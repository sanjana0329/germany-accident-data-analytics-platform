"""
etl/sources/gv_isys.py
=======================
Loads the official German regional key file (GV-ISys) from Destatis
and upserts into the regions table.

Priority order:
  1. Local file at data/raw/31122024_Auszug_GV(2).xlsx  (your existing file)
  2. Live download from Destatis (tries to scrape the current URL)

License: dl-de/by-2-0
"""

import io
import re
from pathlib import Path

import requests
import pandas as pd
from sqlalchemy import text
from sqlalchemy.engine import Engine

from etl.db import ensure_source, log_import_run

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

# Your local file (already downloaded — used as primary source)
LOCAL_FILE = Path("data/raw/31122024_Auszug_GV(2).xlsx")

# Destatis landing page for scraping the latest download link
LANDING_PAGE = (
    "https://www.destatis.de/DE/Themen/Laender-Regionen/Regionales/"
    "Gemeindeverzeichnis/_inhalt.html"
)

SOURCE_NAME    = "AGS GV-ISys Destatis"
SOURCE_LICENSE = "dl-de/by-2-0"
SOURCE_URL     = "https://www.destatis.de/DE/Themen/Laender-Regionen/Regionales/Gemeindeverzeichnis/_inhalt.html"

SHEET_KEYWORD  = "Onlineprodukt_Gemeinden"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _find_live_url() -> str | None:
    """Scrape the Destatis page for the current Excel download link."""
    try:
        resp = requests.get(LANDING_PAGE, timeout=30,
                            headers={"User-Agent": "Mozilla/5.0"})
        resp.raise_for_status()
        match = re.search(r'href="([^"]+Auszug_GV[^"]*\.xlsx)"', resp.text)
        if match:
            href = match.group(1)
            return href if href.startswith("http") else "https://www.destatis.de" + href
    except Exception as exc:
        print(f"    Could not scrape Destatis page: {exc}")
    return None


def _load_content() -> tuple[bytes, str]:
    """
    Return (excel_bytes, source_description).
    Tries local file first, then live download.
    """
    if LOCAL_FILE.exists():
        print(f"    Using local file: {LOCAL_FILE}")
        return LOCAL_FILE.read_bytes(), str(LOCAL_FILE)

    print("    Local file not found, trying live download...")
    url = _find_live_url()

    if url is None:
        # Try a known stable archive URL pattern
        url = (
            "https://www.destatis.de/DE/Themen/Laender-Regionen/Regionales/"
            "Gemeindeverzeichnis/Administrativ/Archiv/GVAuszugQ/"
            "31122024_Auszug_GV.xlsx"
        )

    try:
        resp = requests.get(url, timeout=120,
                            headers={"User-Agent": "Mozilla/5.0"})
        resp.raise_for_status()
        print(f"    Downloaded from: {url}")
        return resp.content, url
    except requests.RequestException as exc:
        raise RuntimeError(
            f"Could not load GV-ISys data. "
            f"Place the file at '{LOCAL_FILE}' or check your internet connection.\n"
            f"Error: {exc}"
        )


def _format_code(value, length: int) -> str:
    if pd.isna(value):
        return ""
    try:
        return str(int(float(value))).zfill(length)
    except (ValueError, TypeError):
        return ""


def _determine_level(satzart: str) -> str:
    return {
        "10": "state",
        "20": "government_region",
        "30": "regional_association",
        "40": "district",
        "50": "municipality_association",
        "60": "municipality",
    }.get(str(satzart), "unknown")


def _parse_excel(content: bytes) -> pd.DataFrame:
    xf = pd.ExcelFile(io.BytesIO(content))

    sheet = next((s for s in xf.sheet_names if SHEET_KEYWORD in s), None)
    if sheet is None:
        raise ValueError(
            f"Sheet matching '{SHEET_KEYWORD}' not found. "
            f"Available: {xf.sheet_names}"
        )

    print(f"    Reading sheet: {sheet}")

    df = pd.read_excel(xf, sheet_name=sheet, header=None, skiprows=6)
    df = df.iloc[:, :20]
    df.columns = [
        "satzart", "textkennzeichen",
        "land", "rb", "kreis", "vb", "gem",
        "gemeindename",
        "flaeche", "bevoelkerung", "maennlich", "weiblich",
        "bevoelkerungsdichte", "plz",
        "laengengrad", "breitengrad",
        "reisegebiet_code", "reisegebiet_name",
        "verstaedterung_code", "verstaedterung_name",
    ]

    df = df[df["satzart"].notna() & df["gemeindename"].notna()].copy()

    df["land_code"]  = df["land"].apply(lambda x: _format_code(x, 2))
    df["rb_code"]    = df["rb"].apply(lambda x: _format_code(x, 1))
    df["kreis_code"] = df["kreis"].apply(lambda x: _format_code(x, 2))
    df["vb_code"]    = df["vb"].apply(lambda x: _format_code(x, 4))
    df["gem_code"]   = df["gem"].apply(lambda x: _format_code(x, 3))

    df["ags"] = (
        df["land_code"] + df["rb_code"] + df["kreis_code"]
        + df["vb_code"] + df["gem_code"]
    )
    df["level"] = df["satzart"].apply(
        lambda x: _determine_level(str(int(float(x))) if pd.notna(x) else "")
    )

    df["latitude"]  = pd.to_numeric(df["breitengrad"], errors="coerce")
    df["longitude"] = pd.to_numeric(df["laengengrad"],  errors="coerce")

    return df[df["ags"].str.len() > 0]


UPSERT_SQL = text("""
    INSERT INTO regions (
        ags, name, level,
        land_code, rb_code, kreis_code, vb_code, gem_code,
        latitude, longitude
    )
    VALUES (
        :ags, :name, :level,
        :land_code, :rb_code, :kreis_code, :vb_code, :gem_code,
        :latitude, :longitude
    )
    ON CONFLICT (ags) DO UPDATE SET
        name       = EXCLUDED.name,
        level      = EXCLUDED.level,
        land_code  = EXCLUDED.land_code,
        rb_code    = EXCLUDED.rb_code,
        kreis_code = EXCLUDED.kreis_code,
        vb_code    = EXCLUDED.vb_code,
        gem_code   = EXCLUDED.gem_code,
        latitude   = EXCLUDED.latitude,
        longitude  = EXCLUDED.longitude
""")


def fetch_regions(engine: Engine) -> int:
    """Load GV-ISys data and upsert into the regions table."""

    with engine.begin() as conn:
        source_id = ensure_source(
            conn,
            name=SOURCE_NAME,
            url=SOURCE_URL,
            license_name=SOURCE_LICENSE,
        )

        try:
            content, source_desc = _load_content()
        except RuntimeError as exc:
            print(f"    ERROR: {exc}")
            log_import_run(conn, source_id, "failed", 0, str(exc))
            return 0

        try:
            df = _parse_excel(content)
        except Exception as exc:
            print(f"    Parse error: {exc}")
            log_import_run(conn, source_id, "error", 0, str(exc))
            return 0

        records = [
            {
                "ags":        row["ags"],
                "name":       row["gemeindename"],
                "level":      row["level"],
                "land_code":  row["land_code"],
                "rb_code":    row["rb_code"],
                "kreis_code": row["kreis_code"],
                "vb_code":    row["vb_code"],
                "gem_code":   row["gem_code"],
                "latitude":   None if pd.isna(row["latitude"])  else float(row["latitude"]),
                "longitude":  None if pd.isna(row["longitude"]) else float(row["longitude"]),
            }
            for _, row in df.iterrows()
        ]

        conn.execute(UPSERT_SQL, records)
        log_import_run(conn, source_id, "success", len(records), f"source={source_desc}")
        print(f"    Upserted {len(records)} regions.")

    return len(records)
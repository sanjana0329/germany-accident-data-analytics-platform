"""
etl/sources/genesis.py
=======================
Fetches population statistics per German federal state and upserts into:
  - indicators table
  - indicator_values table

Primary source: GENESIS Regionalstatistik REST API
Fallback: reads population directly from the GV-ISys Excel file

License: dl-de/by-2-0
"""

import io
import requests
import pandas as pd
from pathlib import Path
from sqlalchemy import text
from sqlalchemy.engine import Engine

from etl.db import ensure_source, log_import_run

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

GENESIS_BASE       = "https://www.regionalstatistik.de/genesis/api/"
POPULATION_TABLE   = "12411-01-01-4"

SOURCE_NAME        = "GENESIS Regionalstatistik Population"
SOURCE_URL         = GENESIS_BASE
SOURCE_LICENSE     = "dl-de/by-2-0"

INDICATOR_CODE     = "POPULATION"
INDICATOR_NAME     = "Population (31 Dec)"
INDICATOR_UNIT     = "persons"

# Same local file used by gv_isys.py
LOCAL_GV_FILE      = Path("data/raw/31122024_Auszug_GV(2).xlsx")
SHEET_KEYWORD      = "Onlineprodukt_Gemeinden"


# ---------------------------------------------------------------------------
# Primary: GENESIS API
# ---------------------------------------------------------------------------

def _fetch_population_table() -> pd.DataFrame | None:
    params = {
        "name":      POPULATION_TABLE,
        "area":      "all",
        "compress":  "false",
        "transpose": "false",
        "language":  "de",
        "format":    "json",
    }
    try:
        resp = requests.get(GENESIS_BASE + "data/table", params=params, timeout=60)
        resp.raise_for_status()
        data = resp.json()

        content = (
            data.get("Object", {}).get("Content", "")
            or data.get("Content", "")
        )
        if not content:
            return None

        df = pd.read_csv(
            io.StringIO(content),
            sep=";",
            skiprows=5,
            skipfooter=3,
            engine="python",
            encoding="utf-8",
        )
        df = df.iloc[:, :3]
        df.columns = ["region_code", "year", "value"]
        df = df.dropna(subset=["region_code", "year", "value"])
        df["year"]  = pd.to_numeric(df["year"],  errors="coerce")
        df["value"] = pd.to_numeric(
            df["value"].astype(str).str.replace(".", "").str.replace(",", "."),
            errors="coerce"
        )
        df = df.dropna()
        df["region_code"] = df["region_code"].astype(str).str.strip()
        return df

    except Exception as exc:
        print(f"    GENESIS API error: {exc}")
        return None


# ---------------------------------------------------------------------------
# Fallback: read population from local GV-ISys Excel
# ---------------------------------------------------------------------------

def _fallback_from_excel() -> pd.DataFrame | None:
    """
    Read population per state directly from the GV-ISys Excel file.
    Groups municipality rows (satzart=60) by land_code and sums bevoelkerung.
    Returns DataFrame with columns: region_code, year, value
    """
    if not LOCAL_GV_FILE.exists():
        print(f"    Local GV file not found at {LOCAL_GV_FILE}")
        return None

    print(f"    Reading population from local GV file: {LOCAL_GV_FILE}")
    try:
        xf = pd.ExcelFile(LOCAL_GV_FILE)
        sheet = next((s for s in xf.sheet_names if SHEET_KEYWORD in s), None)
        if sheet is None:
            print(f"    Sheet not found in {LOCAL_GV_FILE}")
            return None

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

        # Keep only municipality rows (satzart = 60)
        df = df[df["satzart"].astype(str).str.strip() == "60"].copy()
        df["bevoelkerung"] = pd.to_numeric(df["bevoelkerung"], errors="coerce")
        df["land_code"] = df["land"].apply(
            lambda x: str(int(float(x))).zfill(2) if pd.notna(x) else None
        )
        df = df.dropna(subset=["land_code", "bevoelkerung"])

        # Sum population per state
        grouped = (
            df.groupby("land_code")["bevoelkerung"]
            .sum()
            .reset_index()
        )
        grouped.columns = ["region_code", "value"]
        grouped["year"] = 2024   # the file is the 31.12.2024 edition

        print(f"    Found population for {len(grouped)} states.")
        return grouped[["region_code", "year", "value"]]

    except Exception as exc:
        print(f"    Excel fallback error: {exc}")
        return None


# ---------------------------------------------------------------------------
# DB helpers
# ---------------------------------------------------------------------------

def _ensure_indicator(conn) -> int:
    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS indicators (
            indicator_id  SERIAL PRIMARY KEY,
            code          VARCHAR(100) NOT NULL UNIQUE,
            name          VARCHAR(255),
            unit          VARCHAR(100),
            source_system VARCHAR(255)
        )
    """))

    conn.execute(text("""
        INSERT INTO indicators (code, name, unit, source_system)
        VALUES (:code, :name, :unit, :source)
        ON CONFLICT (code) DO UPDATE SET
            name          = EXCLUDED.name,
            unit          = EXCLUDED.unit,
            source_system = EXCLUDED.source_system
    """), {
        "code":   INDICATOR_CODE,
        "name":   INDICATOR_NAME,
        "unit":   INDICATOR_UNIT,
        "source": SOURCE_NAME,
    })

    return conn.execute(
        text("SELECT indicator_id FROM indicators WHERE code = :code"),
        {"code": INDICATOR_CODE}
    ).fetchone().indicator_id


UPSERT_VALUE = text("""
    INSERT INTO indicator_values (region_id, indicator_id, year, value)
    SELECT
        r.region_id,
        :indicator_id,
        :year,
        :value
    FROM regions r
    WHERE r.land_code = :land_code
      AND r.level = 'state'
    ON CONFLICT (region_id, indicator_id, year)
    DO UPDATE SET value = EXCLUDED.value
""")


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def fetch_indicators(engine: Engine) -> int:
    with engine.begin() as conn:
        source_id = ensure_source(
            conn,
            name=SOURCE_NAME,
            url=SOURCE_URL,
            license_name=SOURCE_LICENSE,
        )

        # Ensure indicator_values table exists
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS indicator_values (
                id           SERIAL PRIMARY KEY,
                region_id    INTEGER REFERENCES regions(region_id),
                indicator_id INTEGER REFERENCES indicators(indicator_id),
                year         SMALLINT,
                value        NUMERIC(18,2)
            )
        """))

        # Add unique constraint if missing (table may already exist without it)
        conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint
                    WHERE conname = 'uq_indicator_values'
                ) THEN
                    ALTER TABLE indicator_values
                    ADD CONSTRAINT uq_indicator_values
                    UNIQUE (region_id, indicator_id, year);
                END IF;
            END
            $$;
        """))

        # Try GENESIS API first
        print("    Calling GENESIS API for population table...")
        df = _fetch_population_table()

        # Fall back to local Excel
        if df is None or df.empty:
            print("    GENESIS API unavailable — using local GV Excel file.")
            df = _fallback_from_excel()

        if df is None or df.empty:
            log_import_run(conn, source_id, "failed", 0)
            print("    No population data available from any source.")
            return 0

        indicator_id = _ensure_indicator(conn)
        upserted = 0

        for _, row in df.iterrows():
            result = conn.execute(UPSERT_VALUE, {
                "indicator_id": indicator_id,
                "year":         int(row["year"]),
                "value":        float(row["value"]),
                "land_code":    str(row["region_code"]).zfill(2),
            })
            upserted += result.rowcount

        log_import_run(conn, source_id, "success", upserted)
        print(f"    Upserted {upserted} indicator values.")

    return upserted
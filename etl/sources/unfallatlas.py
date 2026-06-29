"""
etl/sources/unfallatlas.py
===========================
Downloads accident point-data CSVs from OpenGeoData NRW and inserts
new rows into the accidents table.

Priority per year:
  1. Local file in data/raw/ matching the year
  2. Live download from opengeodata.nrw.de

License: Datenlizenz Deutschland – Namensnennung – Version 2.0
"""

import io
import zipfile
from pathlib import Path

import requests
import pandas as pd
from sqlalchemy import text
from sqlalchemy.engine import Engine

from etl.db import ensure_source, log_import_run

BASE_URL       = "https://www.opengeodata.nrw.de/produkte/transport_verkehr/unfallatlas/"
AVAILABLE_YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]
LOCAL_RAW_DIR  = Path("data/raw")

SOURCE_NAME    = "Unfallatlas OpenGeoData NRW"
SOURCE_LICENSE = "Datenlizenz Deutschland Namensnennung 2.0"


def _find_local_file(year: int) -> Path | None:
    """
    Look for any CSV in data/raw/ whose filename contains the year.
    Matches e.g.:
      accident_per_location_2023.csv
      Unfallorte_2021_LinRef.csv
      unfallorte2021_epsg25832.csv
    """
    for f in LOCAL_RAW_DIR.glob("*.csv"):
        if str(year) in f.name:
            return f
    return None


def _zip_url(year: int) -> str:
    return f"{BASE_URL}Unfallorte{year}_EPSG25832_CSV.zip"


def _download_csv(year: int) -> pd.DataFrame | None:
    url = _zip_url(year)
    print(f"    Downloading {url} ...")
    try:
        resp = requests.get(url, timeout=120)
        resp.raise_for_status()
    except requests.RequestException as exc:
        print(f"    Download failed for year {year}: {exc}")
        return None

    zf = zipfile.ZipFile(io.BytesIO(resp.content))
    csv_name = next((n for n in zf.namelist() if n.lower().endswith(".csv")), None)
    if csv_name is None:
        print(f"    No CSV found in ZIP for year {year} — skipping.")
        return None

    with zf.open(csv_name) as f:
        df = pd.read_csv(f, sep=";", low_memory=False, encoding="utf-8-sig")

    print(f"    Downloaded {len(df)} rows for year {year}.")
    return df


def _load_local_csv(path: Path) -> pd.DataFrame | None:
    print(f"    Using local file: {path}")
    try:
        # Try semicolon first (Unfallatlas default), then comma
        df = pd.read_csv(path, sep=";", low_memory=False, encoding="utf-8-sig")
        if len(df.columns) < 5:
            df = pd.read_csv(path, sep=",", low_memory=False, encoding="utf-8-sig")
        print(f"    Loaded {len(df)} rows from local file.")
        return df
    except Exception as exc:
        print(f"    Failed to read local file {path}: {exc}")
        return None


def _detect_road_condition_col(df: pd.DataFrame) -> str | None:
    for col in ("IstStrassenzustand", "USTRZUSTAND"):
        if col in df.columns:
            return col
    return None


def _safe_int(val, default=None):
    try:
        if pd.isna(val):
            return default
        return int(val)
    except (ValueError, TypeError):
        return default


def _safe_bool(val) -> bool:
    try:
        return bool(int(val))
    except (ValueError, TypeError):
        return False


def _build_records(df: pd.DataFrame) -> list[dict]:
    road_col = _detect_road_condition_col(df)
    records = []

    for _, row in df.iterrows():
        lat_raw = str(row.get("YGCSWGS84", "")).replace(",", ".")
        lon_raw = str(row.get("XGCSWGS84", "")).replace(",", ".")

        land_raw = row.get("ULAND")
        kreis_raw = row.get("UKREIS")
        gem_raw = row.get("UGEMEINDE")
        rb_raw = row.get("UREGBEZ")

        records.append({
            "year":             _safe_int(row.get("UJAHR")),
            "month":            _safe_int(row.get("UMONAT")),
            "hour":             _safe_int(row.get("USTUNDE")),
            "weekday":          _safe_int(row.get("UWOCHENTAG")),
            "category":         _safe_int(row.get("UKATEGORIE")),
            "type":             _safe_int(row.get("UART")),
            "subtype":          _safe_int(row.get("UTYP1")),
            "light_condition":  _safe_int(row.get("ULICHTVERH")),
            "road_condition":   _safe_int(row.get(road_col)) if road_col else None,
            "is_bicycle":       _safe_bool(row.get("IstRad", 0)),
            "is_car":           _safe_bool(row.get("IstPKW", 0)),
            "is_pedestrian":    _safe_bool(row.get("IstFuss", 0)),
            "is_motorcycle":    _safe_bool(row.get("IstKrad", 0)),
            "is_goods_vehicle": _safe_bool(row.get("IstGkfz", 0)),
            "is_other":         _safe_bool(row.get("IstSonstige", 0)),
            "latitude":         lat_raw if lat_raw not in ("", "nan") else None,
            "longitude":        lon_raw if lon_raw not in ("", "nan") else None,
            "land_code":        str(_safe_int(land_raw, 0)).zfill(2) if land_raw is not None else None,
            "rb_code":          str(_safe_int(rb_raw, 0)) if rb_raw is not None else "0",
            "kreis_code":       str(_safe_int(kreis_raw, 0)).zfill(2) if kreis_raw is not None else None,
            "gemeinde_code":    str(_safe_int(gem_raw, 0)).zfill(3) if gem_raw is not None else None,
        })

    return records


INSERT_SQL = text("""
    INSERT INTO accidents (
        year, month, hour, weekday,
        category, type, subtype,
        light_condition, road_condition,
        is_bicycle, is_car, is_pedestrian,
        is_motorcycle, is_goods_vehicle, is_other,
        latitude, longitude,
        land_code, rb_code, kreis_code, gemeinde_code
    ) VALUES (
        :year, :month, :hour, :weekday,
        :category, :type, :subtype,
        :light_condition, :road_condition,
        :is_bicycle, :is_car, :is_pedestrian,
        :is_motorcycle, :is_goods_vehicle, :is_other,
        :latitude, :longitude,
        :land_code, :rb_code, :kreis_code, :gemeinde_code
    )
    ON CONFLICT DO NOTHING
""")


def fetch_accidents(engine: Engine, year: int | None = None) -> int:
    years_to_fetch = [year] if year else AVAILABLE_YEARS
    total_inserted = 0

    with engine.begin() as conn:
        source_id = ensure_source(
            conn,
            name=SOURCE_NAME,
            url=BASE_URL,
            license_name=SOURCE_LICENSE,
        )

        for yr in years_to_fetch:
            existing = conn.execute(
                text("SELECT COUNT(*) FROM accidents WHERE year = :y"),
                {"y": yr}
            ).scalar()

            if existing and existing > 0:
                print(f"    Year {yr}: already {existing:,} rows in DB — skipping.")
                continue

            # 1. Try local file first
            local = _find_local_file(yr)
            if local:
                df = _load_local_csv(local)
                source_note = f"local:{local.name}"
            else:
                df = _download_csv(yr)
                source_note = f"live:{_zip_url(yr)}"

            if df is None:
                log_import_run(conn, source_id, "failed", 0)
                continue

            records = _build_records(df)

            try:
                conn.execute(INSERT_SQL, records)
                total_inserted += len(records)
                log_import_run(conn, source_id, "success", len(records))
                print(f"    Year {yr}: inserted {len(records):,} rows ({source_note}).")
            except Exception as exc:
                log_import_run(conn, source_id, "error", 0)
                print(f"    Year {yr}: insert error — {exc}")

    return total_inserted
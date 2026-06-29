"""
ETL Update Script - Accident Data Platform
==========================================
Fetches live data from:
  1. Unfallatlas / OpenGeoData NRW  → accidents table
  2. AGS GV-ISys (Destatis)         → regions table
  3. GENESIS / Regionalstatistik    → indicator_values table

Run:
    python etl/update.py [--year 2023] [--source all|accidents|regions|indicators]

The script is safe to re-run: it uses upsert logic and logs every run
in import_runs + sources tables.
"""

import argparse
import sys
from pathlib import Path
from datetime import datetime, timezone

# Allow running from project root
sys.path.append(str(Path(__file__).resolve().parent.parent))

from etl.sources.unfallatlas import fetch_accidents
from etl.sources.gv_isys import fetch_regions
from etl.sources.genesis import fetch_indicators
from etl.db import get_engine, log_import_run


def parse_args():
    parser = argparse.ArgumentParser(description="ETL update script")
    parser.add_argument(
        "--year",
        type=int,
        default=None,
        help="Accident year to fetch (default: latest available)"
    )
    parser.add_argument(
        "--source",
        choices=["all", "accidents", "regions", "indicators"],
        default="all",
        help="Which source to update (default: all)"
    )
    return parser.parse_args()


def main():
    args = parse_args()
    engine = get_engine()

    print(f"\n{'='*60}")
    print(f"  Accident Data Platform - ETL Update")
    print(f"  Started: {datetime.now(timezone.utc).isoformat()}")
    print(f"  Source filter: {args.source}")
    print(f"{'='*60}\n")

    if args.source in ("all", "regions"):
        print(">>> [1/3] Updating regions from AGS GV-ISys (Destatis)...")
        rows = fetch_regions(engine)
        print(f"    Done. {rows} regions upserted.\n")

    if args.source in ("all", "accidents"):
        year = args.year
        print(f">>> [2/3] Updating accidents from Unfallatlas (year={year or 'latest'})...")
        rows = fetch_accidents(engine, year=year)
        print(f"    Done. {rows} accident rows inserted.\n")

    if args.source in ("all", "indicators"):
        print(">>> [3/3] Updating indicators from GENESIS API...")
        rows = fetch_indicators(engine)
        print(f"    Done. {rows} indicator values upserted.\n")

    print(f"{'='*60}")
    print(f"  ETL Update complete: {datetime.now(timezone.utc).isoformat()}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
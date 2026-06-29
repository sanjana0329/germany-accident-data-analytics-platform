"""
app/routers/metadata.py  (or app/api/metadata.py — put it wherever your routers live)
"""

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, BackgroundTasks, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database.dependencies import get_db

router = APIRouter(prefix="/metadata", tags=["Metadata & Provenance"])


@router.get("/sources")
def list_sources(db: Session = Depends(get_db)):
    rows = db.execute(text("""
        SELECT source_id, name, url, license, last_fetched
        FROM sources ORDER BY name
    """)).fetchall()
    return [
        {"source_id": r.source_id, "name": r.name, "url": r.url,
         "license": r.license, "last_fetched": r.last_fetched}
        for r in rows
    ]


@router.get("/import-runs")
def import_runs(
    limit: int = Query(default=20, le=500),
    db: Session = Depends(get_db),
):
    """Uses the real import_runs schema: import_date, records_count."""
    rows = db.execute(text("""
        SELECT
            ir.run_id,
            s.name        AS source_name,
            s.url         AS source_url,
            s.license,
            ir.import_date AS run_at,
            ir.status,
            ir.records_count AS rows_inserted
        FROM import_runs ir
        JOIN sources s ON s.source_id = ir.source_id
        ORDER BY ir.import_date DESC
        LIMIT :limit
    """), {"limit": limit}).fetchall()

    return [
        {
            "run_id":        r.run_id,
            "source_name":   r.source_name,
            "source_url":    r.source_url,
            "license":       r.license,
            "run_at":        r.run_at,
            "status":        r.status,
            "rows_inserted": r.rows_inserted,
        }
        for r in rows
    ]


def _run_etl(source: str, year: Optional[int]):
    import sys
    from pathlib import Path
    root = Path(__file__).resolve().parent.parent.parent
    if str(root) not in sys.path:
        sys.path.insert(0, str(root))

    from etl.db import get_engine
    from etl.sources.unfallatlas import fetch_accidents
    from etl.sources.gv_isys import fetch_regions
    from etl.sources.genesis import fetch_indicators

    engine = get_engine()
    if source in ("all", "regions"):    fetch_regions(engine)
    if source in ("all", "accidents"):  fetch_accidents(engine, year=year)
    if source in ("all", "indicators"): fetch_indicators(engine)


@router.post("/update")
def trigger_update(
    background_tasks: BackgroundTasks,
    source: str = Query(default="all"),
    year: Optional[int] = Query(default=None),
):
    valid = {"all", "accidents", "regions", "indicators"}
    if source not in valid:
        raise HTTPException(400, f"Invalid source. Choose from: {sorted(valid)}")
    background_tasks.add_task(_run_etl, source, year)
    return {
        "message": "ETL update started in background.",
        "source": source, "year": year,
        "check_progress": "/metadata/import-runs",
        "started_at": datetime.utcnow().isoformat() + "Z",
    }
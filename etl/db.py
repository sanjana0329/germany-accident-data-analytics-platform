"""
etl/db.py
Shared database utilities for all ETL modules.
"""

import os
from datetime import datetime, timezone
from urllib.parse import quote_plus

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

load_dotenv()


def get_engine() -> Engine:
    host = os.getenv("DB_HOST", "localhost")
    port = os.getenv("DB_PORT", "5432")
    name = os.getenv("DB_NAME", "accident_data_platform")
    user = os.getenv("DB_USER", "postgres")
    password = quote_plus(os.getenv("DB_PASSWORD", ""))
    url = f"postgresql://{user}:{password}@{host}:{port}/{name}"
    return create_engine(url)


def ensure_source(conn, name: str, url: str, license_name: str) -> int:
    """Upsert a row in the sources table and return its source_id."""

    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS sources (
            source_id    SERIAL PRIMARY KEY,
            name         VARCHAR(255) NOT NULL,
            url          TEXT,
            license      VARCHAR(255),
            last_fetched TIMESTAMPTZ
        )
    """))

    # Add unique constraint only if missing
    conn.execute(text("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'uq_sources_name'
            ) THEN
                ALTER TABLE sources ADD CONSTRAINT uq_sources_name UNIQUE (name);
            END IF;
        END
        $$;
    """))

    # Add license / last_fetched columns if the table existed without them
    conn.execute(text("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='sources' AND column_name='license'
            ) THEN
                ALTER TABLE sources ADD COLUMN license VARCHAR(255);
            END IF;
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='sources' AND column_name='last_fetched'
            ) THEN
                ALTER TABLE sources ADD COLUMN last_fetched TIMESTAMPTZ;
            END IF;
        END
        $$;
    """))

    conn.execute(text("""
        INSERT INTO sources (name, url, license)
        VALUES (:name, :url, :license)
        ON CONFLICT ON CONSTRAINT uq_sources_name DO UPDATE
            SET url     = EXCLUDED.url,
                license = EXCLUDED.license
    """), {"name": name, "url": url, "license": license_name})

    row = conn.execute(
        text("SELECT source_id FROM sources WHERE name = :name"),
        {"name": name}
    ).fetchone()

    return row.source_id


def log_import_run(
    conn,
    source_id: int,
    status: str,
    rows_inserted: int,
    notes: str = ""
) -> None:
    """
    Write a row to import_runs using the EXACT schema that already exists:
        run_id        SERIAL PK
        source_id     INTEGER NOT NULL
        import_date   TIMESTAMP NOT NULL
        records_count INTEGER
        status        VARCHAR(50)
    """
    conn.execute(text("""
        INSERT INTO import_runs (source_id, import_date, records_count, status)
        VALUES (:source_id, :import_date, :records_count, :status)
    """), {
        "source_id":     source_id,
        "import_date":   datetime.now(timezone.utc),
        "records_count": rows_inserted,
        "status":        status,
    })

    conn.execute(text("""
        UPDATE sources SET last_fetched = now() WHERE source_id = :sid
    """), {"sid": source_id})
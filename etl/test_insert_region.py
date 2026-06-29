import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))


from sqlalchemy import text
from app.database.database import engine

with engine.connect() as conn:

    conn.execute(
        text("""
        INSERT INTO regions
        (
            ags,
            name,
            level,
            land_code,
            rb_code,
            kreis_code,
            vb_code,
            gem_code
        )
        VALUES
        (
            '01',
            'Schleswig-Holstein',
            'state',
            '01',
            '',
            '',
            '',
            ''
        )
        """)
    )

    conn.commit()

print("Insert successful!")
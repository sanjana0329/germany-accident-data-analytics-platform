from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional

from app.database.dependencies import get_db

router = APIRouter(
    prefix="/api",
    tags=["Accidents"]
)

@router.get("/summary")
def get_summary(db: Session = Depends(get_db)):

    total_accidents = db.execute(
        text("""
            SELECT COUNT(*)
            FROM accidents
        """)
    ).scalar()

    total_regions = db.execute(
        text("""
            SELECT COUNT(*)
            FROM regions
        """)
    ).scalar()

    return {
        "total_accidents": total_accidents,
        "total_regions": total_regions
    }
    
    
@router.get("/accidents/by-category")
def accidents_by_category(db: Session = Depends(get_db)):

    result = db.execute(
        text("""
            SELECT
                category,
                COUNT(*) as count
            FROM accidents
            GROUP BY category
            ORDER BY category
        """)
    )

    return [
        {
            "category": row.category,
            "count": row.count
        }
        for row in result
    ]
    
@router.get("/accidents/by-month")
def accidents_by_month(db: Session = Depends(get_db)):

    result = db.execute(
        text("""
            SELECT
                month,
                COUNT(*) as count
            FROM accidents
            GROUP BY month
            ORDER BY month
        """)
    )

    return [
        {
            "month": row.month,
            "count": row.count
        }
        for row in result
    ]
    
@router.get("/accidents/by-weekday")
def accidents_by_weekday(db: Session = Depends(get_db)):

    result = db.execute(
        text("""
            SELECT
                weekday,
                COUNT(*) as count
            FROM accidents
            GROUP BY weekday
            ORDER BY weekday
        """)
    )

    return [
        {
            "weekday": row.weekday,
            "count": row.count
        }
        for row in result
    ]
    
@router.get("/accidents/by-road-user")
def accidents_by_road_user(db: Session = Depends(get_db)):

    bicycle = db.execute(
        text("SELECT COUNT(*) FROM accidents WHERE is_bicycle = TRUE")
    ).scalar()

    car = db.execute(
        text("SELECT COUNT(*) FROM accidents WHERE is_car = TRUE")
    ).scalar()

    pedestrian = db.execute(
        text("SELECT COUNT(*) FROM accidents WHERE is_pedestrian = TRUE")
    ).scalar()

    motorcycle = db.execute(
        text("SELECT COUNT(*) FROM accidents WHERE is_motorcycle = TRUE")
    ).scalar()

    return {
        "bicycle": bicycle,
        "car": car,
        "pedestrian": pedestrian,
        "motorcycle": motorcycle
    }
    
@router.get("/accidents/filter")
def filter_accidents(
    month: Optional[int] = None,
    category: Optional[int] = None,
    land_code: Optional[str] = None,
    kreis_code: Optional[str] = None,
    db: Session = Depends(get_db)
):

    query = """
        SELECT COUNT(*) as total
        FROM accidents
        WHERE 1=1
    """

    params = {}

    if month:
        query += " AND month = :month"
        params["month"] = month

    if category:
        query += " AND category = :category"
        params["category"] = category

    if land_code:
        query += " AND land_code = :land_code"
        params["land_code"] = land_code

    if kreis_code:
        query += " AND kreis_code = :kreis_code"
        params["kreis_code"] = kreis_code

    result = db.execute(text(query), params).scalar()

    return {
        "total_accidents": result
    }
    
@router.get("/queries/highest-accident-month")
def highest_accident_month(db: Session = Depends(get_db)):

    result = db.execute(
        text("""
            SELECT
                month,
                COUNT(*) AS total
            FROM accidents
            GROUP BY month
            ORDER BY total DESC
            LIMIT 1
        """)
    ).first()

    return {
        "month": result.month,
        "total_accidents": result.total
    }
    
    
@router.get("/rates/top10")
def top_10_accident_rates(
    db: Session = Depends(get_db)
):

    result = db.execute(
        text("""
            SELECT
                region_name,
                accident_rate
            FROM accident_rates
            ORDER BY accident_rate DESC
            LIMIT 10
        """)
    )

    return [
        {
            "region": row.region_name,
            "rate": float(row.accident_rate)
        }
        for row in result
    ]
    
@router.get("/queries/pedestrian-berlin")
def pedestrian_accidents_berlin(db: Session = Depends(get_db)):

    result = db.execute(
        text("""
            SELECT COUNT(*) AS total
            FROM accidents
            WHERE land_code = '11'
            AND is_pedestrian = TRUE
        """)
    ).scalar()

    return {
        "region": "Berlin",
        "total_accidents": result
    }
    
    
@router.get("/queries/personal-injury-saxony")
def personal_injury_saxony(
    db: Session = Depends(get_db)
):

    result = db.execute(
        text("""
            SELECT COUNT(*)
            FROM accidents
            WHERE land_code = '14'
        """)
    ).scalar()

    return {
        "region": "Saxony",
        "year": 2023,
        "total_accidents": result
    }
    
@router.get("/queries/earliest-year")
def earliest_year(
    db: Session = Depends(get_db)
):

    result = db.execute(
        text("""
            SELECT MIN(year)
            FROM accidents
        """)
    ).scalar()

    return {
        "earliest_year": result
    }
    
@router.get("/queries/earliest-year-state")
def earliest_year_state(
    land_code: str,
    db: Session = Depends(get_db)
):
    result = db.execute(
        text("""
            SELECT
                MIN(year) AS earliest_year
            FROM accidents
            WHERE land_code = :land_code
        """),
        {"land_code": land_code}
    ).scalar()

    return {
        "land_code": land_code,
        "earliest_year": result
    }

    
@router.get("/top-fatal-districts")
def top_fatal_districts(db: Session = Depends(get_db)):

    result = db.execute(text("""
        SELECT
            r.name,
            COUNT(*) AS total_fatal_accidents
        FROM accidents a
        JOIN regions r
        ON a.land_code = r.land_code
        AND a.rb_code = r.rb_code
        AND a.kreis_code = r.kreis_code
        WHERE a.category = 1
        AND r.level = 'district' 
        GROUP BY r.name
        ORDER BY total_fatal_accidents DESC
        LIMIT 5
    """))

    rows = result.fetchall()

    return [
        {
            "district": row.name,
            "fatal_accidents": row.total_fatal_accidents
        }
        for row in rows
    ]
    
@router.get("/state-summary")
def state_summary(
    land_code: str,
    db: Session = Depends(get_db)
):

    result = db.execute(text("""
        SELECT
            COUNT(*) AS total_accidents,

            COUNT(*) FILTER (
                WHERE category = 1
            ) AS fatal,

            COUNT(*) FILTER (
                WHERE category = 2
            ) AS serious,

            COUNT(*) FILTER (
                WHERE category = 3
            ) AS minor

        FROM accidents
        WHERE land_code = :land_code
    """), {"land_code": land_code})

    row = result.fetchone()

    return {
        "total_accidents": row.total_accidents,
        "fatal": row.fatal,
        "serious": row.serious,
        "minor": row.minor
    }
    
@router.get("/state-category-distribution")
def state_category_distribution(
    land_code: str,
    db: Session = Depends(get_db)
):

    result = db.execute(
        text("""
            SELECT
                category,
                COUNT(*) AS total
            FROM accidents
            WHERE land_code = :land_code
            GROUP BY category
            ORDER BY category
        """),
        {"land_code": land_code}
    )

    rows = result.fetchall()

    category_names = {
        1: "Fatal",
        2: "Serious Injury",
        3: "Minor Injury"
    }

    return [
        {
            "name": category_names[row.category],
            "value": row.total
        }
        for row in rows
    ]
    
    
@router.get("/state-monthly-trend")
def state_monthly_trend(
    land_code: str,
    db: Session = Depends(get_db)
):

    result = db.execute(text("""
        SELECT
            month,
            COUNT(*) AS total
        FROM accidents
        WHERE land_code = :land_code
        GROUP BY month
        ORDER BY month
    """), {"land_code": land_code})

    rows = result.fetchall()

    return [
        {
            "month": row.month,
            "total": row.total
        }
        for row in rows
    ]
    
    
@router.get("/state-road-user-distribution")
def state_road_user_distribution(
    land_code: str,
    db: Session = Depends(get_db)
):

    bicycle = db.execute(
        text("""
            SELECT COUNT(*)
            FROM accidents
            WHERE land_code = :land_code
            AND is_bicycle = TRUE
        """),
        {"land_code": land_code}
    ).scalar()

    car = db.execute(
        text("""
            SELECT COUNT(*)
            FROM accidents
            WHERE land_code = :land_code
            AND is_car = TRUE
        """),
        {"land_code": land_code}
    ).scalar()

    pedestrian = db.execute(
        text("""
            SELECT COUNT(*)
            FROM accidents
            WHERE land_code = :land_code
            AND is_pedestrian = TRUE
        """),
        {"land_code": land_code}
    ).scalar()

    motorcycle = db.execute(
        text("""
            SELECT COUNT(*)
            FROM accidents
            WHERE land_code = :land_code
            AND is_motorcycle = TRUE
        """),
        {"land_code": land_code}
    ).scalar()

    return [
        {"name": "Bicycle", "value": bicycle},
        {"name": "Car", "value": car},
        {"name": "Pedestrian", "value": pedestrian},
        {"name": "Motorcycle", "value": motorcycle}
    ]
    
    
@router.get("/state-weekday-distribution")
def state_weekday_distribution(
    land_code: str,
    db: Session = Depends(get_db)
):

    result = db.execute(text("""
        SELECT
            weekday,
            COUNT(*) AS total
        FROM accidents
        WHERE land_code = :land_code
        GROUP BY weekday
        ORDER BY weekday
    """), {"land_code": land_code})

    rows = result.fetchall()

    return [
        {
            "weekday": row.weekday,
            "total": row.total
        }
        for row in rows
    ]
    
    
@router.get("/state-comparison")
def state_comparison(
    analysis_type: str = "total",
    year: int | None = None,
    month: int | None = None,
    db: Session = Depends(get_db)
):

    metric_conditions = {
        "total": "1=1",
        "fatal": "category = 1",
        "serious": "category = 2",
        "minor": "category = 3",
        "bicycle": "is_bicycle = TRUE",
        "car": "is_car = TRUE",
        "motorcycle": "is_motorcycle = TRUE",
        "pedestrian": "is_pedestrian = TRUE"
    }

    condition = metric_conditions.get(analysis_type, "1=1")

    filters = [condition]
    params = {}

    if year:
        filters.append("a.year = :year")
        params["year"] = year

    if month:
        filters.append("a.month = :month")
        params["month"] = month

    where_clause = " AND ".join(filters)

    result = db.execute(
        text(f"""
            SELECT
                a.land_code,
                COUNT(*) AS total
            FROM accidents a
            WHERE {where_clause}
            GROUP BY a.land_code
            ORDER BY total DESC
        """),
        params
    )

    rows = result.fetchall()

    state_names = {
        "01": "Schleswig-Holstein",
        "02": "Hamburg",
        "03": "Lower Saxony",
        "04": "Bremen",
        "05": "North Rhine-Westphalia",
        "06": "Hesse",
        "07": "Rhineland-Palatinate",
        "08": "Baden-Württemberg",
        "09": "Bavaria",
        "10": "Saarland",
        "11": "Berlin",
        "12": "Brandenburg",
        "13": "Mecklenburg-Western Pomerania",
        "14": "Saxony",
        "15": "Saxony-Anhalt",
        "16": "Thuringia"
    }

    return [
        {
            "state": state_names.get(row.land_code, row.land_code),
            "value": row.total
        }
        for row in rows
    ]
    

@router.get("/queries/latest-year")
def latest_year(db: Session = Depends(get_db)):
    result = db.execute(
        text("SELECT MAX(year) FROM accidents")
    ).scalar()
    return {"latest_year": result}

@router.get("/state-yearly-trend")
def state_yearly_trend(
    land_code: str,
    db: Session = Depends(get_db)
):
    result = db.execute(
        text("""
            SELECT
                year,
                COUNT(*) AS total
            FROM accidents
            WHERE land_code = :land_code
            GROUP BY year
            ORDER BY year
        """),
        {"land_code": land_code}
    )

    rows = result.fetchall()

    return [
        {
            "year": row.year,
            "total": row.total
        }
        for row in rows
    ]


import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))



import pandas as pd
from sqlalchemy import text

from app.database.database import engine

print("Reading CSV...")

df = pd.read_csv(
    "data/raw/accident_per_location_2023.csv",
    sep=";",
    low_memory=False
)

print("Rows loaded:", len(df))

# -------------------------
# Prepare dataframe
# -------------------------

df["latitude"] = (
    df["YGCSWGS84"]
    .astype(str)
    .str.replace(",", ".", regex=False)
)

df["longitude"] = (
    df["XGCSWGS84"]
    .astype(str)
    .str.replace(",", ".", regex=False)
)

# -------------------------
# Create records
# -------------------------

records = []

for _, row in df.iterrows():

    records.append({

        "year": int(row["UJAHR"]),
        "month": int(row["UMONAT"]),
        "hour": int(row["USTUNDE"]),
        "weekday": int(row["UWOCHENTAG"]),

        "category": int(row["UKATEGORIE"]),
        "type": int(row["UART"]),
        "subtype": int(row["UTYP1"]),

        "light_condition": int(row["ULICHTVERH"]),
        "road_condition": int(row["IstStrassenzustand"]),

        "is_bicycle": bool(row["IstRad"]),
        "is_car": bool(row["IstPKW"]),
        "is_pedestrian": bool(row["IstFuss"]),
        "is_motorcycle": bool(row["IstKrad"]),
        "is_goods_vehicle": bool(row["IstGkfz"]),
        "is_other": bool(row["IstSonstige"]),

        "latitude": row["latitude"],
        "longitude": row["longitude"],

        "land_code": str(row["ULAND"]).zfill(2),
        "rb_code": str(row["UREGBEZ"]),
        "kreis_code": str(row["UKREIS"]).zfill(2),
        "gemeinde_code": str(row["UGEMEINDE"]).zfill(3)
    })

print("Records prepared:", len(records))

# -------------------------
# Insert
# -------------------------

insert_sql = text("""
INSERT INTO accidents
(
    year,
    month,
    hour,
    weekday,

    category,
    type,
    subtype,

    light_condition,
    road_condition,

    is_bicycle,
    is_car,
    is_pedestrian,
    is_motorcycle,
    is_goods_vehicle,
    is_other,

    latitude,
    longitude,

    land_code,
    rb_code,
    kreis_code,
    gemeinde_code
)
VALUES
(
    :year,
    :month,
    :hour,
    :weekday,

    :category,
    :type,
    :subtype,

    :light_condition,
    :road_condition,

    :is_bicycle,
    :is_car,
    :is_pedestrian,
    :is_motorcycle,
    :is_goods_vehicle,
    :is_other,

    :latitude,
    :longitude,

    :land_code,
    :rb_code,
    :kreis_code,
    :gemeinde_code
)
""")

print("Inserting into PostgreSQL...")

with engine.begin() as conn:
    conn.execute(insert_sql, records)

print("Import completed successfully!")
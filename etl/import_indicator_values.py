import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))



import pandas as pd
from sqlalchemy import text

from app.database.database import engine

FILE_PATH = "data/raw/31122024_Auszug_GV(2).xlsx"

# Read data
df = pd.read_excel(
    FILE_PATH,
    sheet_name="Onlineprodukt_Gemeinden31122024",
    header=None
)

# Skip top metadata rows
df = df.iloc[6:].reset_index(drop=True)

# Rename columns
df.columns = [
    "satzart",
    "textkennzeichen",
    "land",
    "rb",
    "kreis",
    "vb",
    "gem",
    "gemeindename",
    "flaeche",
    "bevoelkerung",
    "maennlich",
    "weiblich",
    "bevoelkerungsdichte",
    "plz",
    "laengengrad",
    "breitengrad",
    "reisegebiet_code",
    "reisegebiet_name",
    "verstaedterung_code",
    "verstaedterung_name"
]




# Keep only municipality rows (satzart = 60)
df = df[df["satzart"].astype(str) == "60"].copy()

print("Rows after filter:", len(df))

# Build AGS exactly like before
df["land_code"] = df["land"].fillna("").astype(int).astype(str).str.zfill(2)
df["rb_code"] = df["rb"].fillna("").astype(str).replace("0.0", "0")
df["kreis_code"] = df["kreis"].fillna("").astype(int).astype(str).str.zfill(2)
df["vb_code"] = df["vb"].fillna("").astype(int).astype(str).str.zfill(4)
df["gem_code"] = df["gem"].fillna("").astype(int).astype(str).str.zfill(3)

df["ags"] = (
    df["land_code"]
    + df["rb_code"]
    + df["kreis_code"]
    + df["vb_code"]
    + df["gem_code"]
)

# Test first municipality
first_row = df.iloc[0]

with engine.connect() as conn:

    region = conn.execute(
        text("""
            SELECT region_id, name
            FROM regions
            WHERE ags = :ags
        """),
        {"ags": first_row["ags"]}
    ).fetchone()

    print("Excel AGS:", first_row["ags"])
    print("Database Match:", region)
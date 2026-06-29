import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))

import pandas as pd
from sqlalchemy import text
from app.database.database import engine

FILE_PATH = "data/raw/31122024_Auszug_GV(2).xlsx"

df = pd.read_excel(
    FILE_PATH,
    sheet_name="Onlineprodukt_Gemeinden31122024",
    header=None,
    skiprows=6
)

df = df.iloc[:, :20]

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

df = df[df["satzart"].notna()]


def format_code(value, length):
    if pd.isna(value):
        return ""
    return str(int(value)).zfill(length)


# Build AGS components
df["land_code"] = df["land"].apply(lambda x: format_code(x, 2))
df["rb_code"] = df["rb"].apply(lambda x: format_code(x, 1))
df["kreis_code"] = df["kreis"].apply(lambda x: format_code(x, 2))
df["vb_code"] = df["vb"].apply(lambda x: format_code(x, 4))
df["gem_code"] = df["gem"].apply(lambda x: format_code(x, 3))

# Build AGS / ARS
df["ags"] = (
    df["land_code"]
    + df["rb_code"]
    + df["kreis_code"]
    + df["vb_code"]
    + df["gem_code"]
)


def determine_level(row):
    satzart = str(row["satzart"])

    if satzart == "10":
        return "state"

    if satzart == "40":
        return "district"

    if satzart == "50":
        return "municipality_association"

    if satzart == "60":
        return "municipality"

    return "unknown"


df["level"] = df.apply(determine_level, axis=1)


print("Rows before filter:", len(df))

df = df[
    (df["ags"].str.len() > 0)
    & (df["gemeindename"].notna())
]

print("Rows after filter:", len(df))

with engine.connect() as conn:
    inserted = 0

    for _, row in df.iterrows():

        try:
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
                        :ags,
                        :name,
                        :level,
                        :land_code,
                        :rb_code,
                        :kreis_code,
                        :vb_code,
                        :gem_code
                    )
                """),
                {
                    "ags": row["ags"],
                    "name": row["gemeindename"],
                    "level": row["level"],
                    "land_code": row["land_code"],
                    "rb_code": row["rb_code"],
                    "kreis_code": row["kreis_code"],
                    "vb_code": row["vb_code"],
                    "gem_code": row["gem_code"]
                }
            )
            inserted += 1

        except Exception as e:
            
            conn.rollback()
            
            print(f"Error inserting row: {row['gemeindename']}")
            print(f"AGS: {row['ags']}")
            print(e)
        
    conn.commit()

print(f"Inserted {inserted} rows.")
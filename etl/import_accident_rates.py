import pandas as pd
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os
from urllib.parse import quote_plus

load_dotenv()

DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = quote_plus(os.getenv("DB_PASSWORD"))

DATABASE_URL = (
    f"postgresql://{DB_USER}:{DB_PASSWORD}"
    f"@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

engine = create_engine(DATABASE_URL)

print("Reading file...")

df = pd.read_csv(
    "data/raw/accident_per_10000_per_city.csv",
    sep=";",
    skiprows=2
)

df.columns = [
    "region_code",
    "region_name",
    "accident_rate"
]

print(df.head())

records = df.to_dict(orient="records")

with engine.begin() as conn:

    conn.execute(
        text("TRUNCATE TABLE accident_rates RESTART IDENTITY")
    )

    conn.execute(
        text("""
        INSERT INTO accident_rates
        (
            region_code,
            region_name,
            accident_rate
        )
        VALUES
        (
            :region_code,
            :region_name,
            :accident_rate
        )
        """),
        records
    )

print("Import complete.")
print("Rows inserted:", len(records))
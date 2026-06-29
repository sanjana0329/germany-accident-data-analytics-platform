import pandas as pd

df = pd.read_csv(
    "data/raw/accident_per_location_2023.csv",
    sep=";",
    low_memory=False
)

print(df.columns.tolist())
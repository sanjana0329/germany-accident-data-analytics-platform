# Germany Accident Data Analytics Platform

An interactive full-stack web application for exploring, analyzing, and visualizing German road accident statistics using official open government datasets. Built with **FastAPI**, **React**, and **PostgreSQL**.

---

## About the Project

Road accident data contains valuable insights for understanding traffic safety, identifying accident-prone regions, and supporting data-driven decision making. However, official datasets are often distributed as large CSV files that require preprocessing before meaningful analysis can be performed.

The **Germany Accident Data Analytics Platform** addresses this challenge by integrating official German accident datasets into a centralized PostgreSQL database and providing an interactive web interface for exploring accident statistics through visual dashboards, comparisons, and analytical queries.

The platform allows users to investigate accident patterns across German states, analyze injury severity, compare accident statistics, study road user distributions, and explore temporal trends using interactive visualizations.

This project was developed as part of the **API Development Project** in the **M.Sc. Web Engineering** program at **TU Chemnitz**.

---

# Features

* Interactive Germany State Explorer
* Clickable Germany map for state-based analytics
* State accident summary dashboard
* Monthly accident trend analysis
* Weekday accident distribution
* Injury severity analysis
* Road user distribution
* State comparison dashboard
* Interactive filtering
* RESTful API backend
* PostgreSQL relational database
* ETL pipeline for importing official datasets
* Responsive React dashboard
* Modular FastAPI architecture

---

# Screenshots

## Dashboard
<img width="1876" height="943" alt="Screenshot 2026-06-29 171205" src="https://github.com/user-attachments/assets/30ec75c2-6325-4e93-a2b5-006136dd1064" />
<img width="1862" height="935" alt="Screenshot 2026-06-29 171221" src="https://github.com/user-attachments/assets/a152201e-1334-48af-a3f1-5b4157a2d6d7" />
<img width="1893" height="931" alt="Screenshot 2026-06-29 171231" src="https://github.com/user-attachments/assets/ae7f82f6-2533-4213-8ae6-0b5f3edc65e0" />


---

## State Analytics
<img width="1870" height="937" alt="Screenshot 2026-06-29 171257" src="https://github.com/user-attachments/assets/d7078bf9-549e-4e6b-a808-2e3b5f612929" />
<img width="1853" height="922" alt="Screenshot 2026-06-29 171311" src="https://github.com/user-attachments/assets/2273c3b2-8c60-4419-afc0-5ac59547a416" />

---

## Filter Explorer
<img width="1898" height="918" alt="Screenshot 2026-06-29 171356" src="https://github.com/user-attachments/assets/e643c510-ab82-4519-9ca6-b1d3fc54164d" />

---

## State Comparison
<img width="1902" height="921" alt="Screenshot 2026-06-29 171332" src="https://github.com/user-attachments/assets/d2bdccad-c7af-467d-bacc-548e1f208dbf" />

---

## Query Lab
<img width="1897" height="922" alt="Screenshot 2026-06-29 171409" src="https://github.com/user-attachments/assets/6eb25656-0cd5-4ff8-b963-252328a129bb" />

---

# Tech Stack

| Technology | Purpose                    |
| ---------- | -------------------------- |
| Python 3   | Backend development        |
| FastAPI    | REST API framework         |
| PostgreSQL | Relational database        |
| SQLAlchemy | ORM                        |
| Pandas     | Data processing            |
| React      | Frontend framework         |
| Vite       | Frontend build tool        |
| Recharts   | Interactive visualizations |
| Axios      | API communication          |

---

# Installation

## 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/germany-accident-data-analytics-platform.git
cd germany-accident-data-analytics-platform
```

## 2. Create a virtual environment

```bash
python -m venv venv
```

## 3. Activate the virtual environment

Windows

```bash
venv\Scripts\activate
```

Mac/Linux

```bash
source venv/bin/activate
```

## 4. Install backend dependencies

```bash
pip install -r requirements.txt
```

## 5. Install frontend dependencies

```bash
cd frontend
npm install
```

## 6. Run the backend

```bash
uvicorn app.main:app --reload
```

## 7. Run the frontend

```bash
npm run dev
```

---

# System Architecture

```
                     React Frontend
                           │
                           ▼
                   FastAPI REST APIs
                           │
                           ▼
                  SQLAlchemy ORM Layer
                           │
                           ▼
                  PostgreSQL Database
                           │
                           ▼
         German Official Open Data Sources
```

---

# REST API Endpoints

| Endpoint                      | Description                  |
| ----------------------------- | ---------------------------- |
| /state-summary                | State accident summary       |
| /state-category-distribution  | Injury category distribution |
| /state-monthly-trend          | Monthly accident statistics  |
| /state-road-user-distribution | Road user analysis           |
| /state-weekday-distribution   | Weekday accident analysis    |
| /state-comparison             | Compare German states        |
| /metadata                     | Metadata services            |

---

# Project Structure

```
app/
├── api/
├── database/
├── models/
├── main.py

etl/
├── import_accidents.py
├── import_regions.py
├── import_indicator_values.py

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── assets/
├── package.json

README.md
requirements.txt
```

---

# Database Design

The platform stores accident information using a normalized relational schema consisting of:

* Regions
* Accident Indicators
* Indicator Values

The ETL pipeline imports official accident statistics and regional information before exposing the data through REST APIs.

---

# Data Sources

The project uses publicly available German Open Data.

* Unfallatlas
* Destatis (Federal Statistical Office)
* GENESIS Database
* Regional Atlas Germany

---


## Author

**Sanjana Hebha Nandania**  
M.Sc. Web Engineering — TU Chemnitz 

**Supervisor:** Prof. Dr. Michael Martin  
**Scientific Supervision:** Florian Hahn, Sara Todorovikj

---

## License

This project is licensed under the MIT License.

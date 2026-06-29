from sqlalchemy import Column, Integer, String, Text
from app.database.database import Base


class Indicator(Base):
    __tablename__ = "indicators"

    indicator_id = Column(Integer, primary_key=True)

    code = Column(String(50), unique=True)

    name = Column(String(255))

    unit = Column(String(50))

    description = Column(Text)

    source_system = Column(String(100))
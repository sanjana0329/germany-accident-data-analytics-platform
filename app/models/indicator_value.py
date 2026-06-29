from sqlalchemy import (
    Column,
    Integer,
    ForeignKey,
    Numeric
)

from app.database.database import Base


class IndicatorValue(Base):
    __tablename__ = "indicator_values"

    id = Column(Integer, primary_key=True)

    indicator_id = Column(
        Integer,
        ForeignKey("indicators.indicator_id")
    )

    region_id = Column(
        Integer,
        ForeignKey("regions.region_id")
    )

    year = Column(Integer)

    value = Column(Numeric(20, 2))
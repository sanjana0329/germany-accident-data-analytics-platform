from sqlalchemy import Column, Integer, String, Float, ForeignKey
from app.database.database import Base


class Region(Base):
    __tablename__ = "regions"

    region_id = Column(Integer, primary_key=True)

    ags = Column(String(20), unique=True)

    name = Column(String(255), nullable=False)

    level = Column(String(50), nullable=False)

    parent_region_id = Column(
        Integer,
        ForeignKey("regions.region_id"),
        nullable=True
    )

    postal_code = Column(String(20))

    latitude = Column(Float)

    longitude = Column(Float)

    land_code = Column(String(2))

    rb_code = Column(String(1))

    kreis_code = Column(String(2))

    vb_code = Column(String(4))

    gem_code = Column(String(3))
#!/usr/bin/env python3
"""
Resources API endpoints - beds, ventilators, ambulances, blood units.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Bed, Ventilator, Ambulance, BloodUnit, Hospital
from app.schemas import (
    Bed as BedSchema,
    BedCreate,
    Ventilator as VentilatorSchema,
    VentilatorCreate,
    Ambulance as AmbulanceSchema,
    AmbulanceCreate,
    BloodUnit as BloodUnitSchema,
    BloodUnitCreate,
)

router = APIRouter(prefix="/resources", tags=["Resources"])


# Bed endpoints
@router.get("/beds", response_model=List[BedSchema])
def list_beds(
    hospital_id: Optional[int] = Query(None),
    bed_type: Optional[str] = Query(None, pattern="^(icu|general)$"),
    status: Optional[str] = Query(None, pattern="^(available|occupied)$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    """List all beds with optional filtering."""
    query = db.query(Bed)

    if hospital_id:
        query = query.filter(Bed.hospital_id == hospital_id)
    if bed_type:
        query = query.filter(Bed.bed_type == bed_type)
    if status:
        query = query.filter(Bed.status == status)

    return query.offset(skip).limit(limit).all()


@router.post("/beds", response_model=BedSchema, status_code=status.HTTP_201_CREATED)
def create_bed(bed: BedCreate, db: Session = Depends(get_db)):
    """Create a new bed."""
    # Verify hospital exists
    hospital = db.query(Hospital).filter(Hospital.hospital_id == bed.hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")

    # Check if bed_id already exists
    existing = db.query(Bed).filter(Bed.bed_id == bed.bed_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bed ID already exists")

    db_bed = Bed(**bed.model_dump())
    db.add(db_bed)
    db.commit()
    db.refresh(db_bed)
    return db_bed


@router.patch("/beds/{bed_id}/status", response_model=BedSchema)
def update_bed_status(
    bed_id: int,
    new_status: str = Query(..., pattern="^(available|occupied)$"),
    db: Session = Depends(get_db),
):
    """Update bed status."""
    db_bed = db.query(Bed).filter(Bed.bed_id == bed_id).first()
    if not db_bed:
        raise HTTPException(status_code=404, detail="Bed not found")

    db_bed.status = new_status
    db.commit()
    db.refresh(db_bed)
    return db_bed


# Ventilator endpoints
@router.get("/ventilators", response_model=List[VentilatorSchema])
def list_ventilators(
    hospital_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None, pattern="^(available|in_use|maintenance)$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    """List all ventilators with optional filtering."""
    query = db.query(Ventilator)

    if hospital_id:
        query = query.filter(Ventilator.hospital_id == hospital_id)
    if status:
        query = query.filter(Ventilator.status == status)

    return query.offset(skip).limit(limit).all()


@router.post("/ventilators", response_model=VentilatorSchema, status_code=status.HTTP_201_CREATED)
def create_ventilator(ventilator: VentilatorCreate, db: Session = Depends(get_db)):
    """Create a new ventilator."""
    # Verify hospital exists
    hospital = db.query(Hospital).filter(Hospital.hospital_id == ventilator.hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")

    # Check if ventilator_id already exists
    existing = db.query(Ventilator).filter(Ventilator.ventilator_id == ventilator.ventilator_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ventilator ID already exists")

    db_vent = Ventilator(**ventilator.model_dump())
    db.add(db_vent)
    db.commit()
    db.refresh(db_vent)
    return db_vent


@router.patch("/ventilators/{ventilator_id}/status", response_model=VentilatorSchema)
def update_ventilator_status(
    ventilator_id: int,
    new_status: str = Query(..., pattern="^(available|in_use|maintenance)$"),
    db: Session = Depends(get_db),
):
    """Update ventilator status."""
    db_vent = db.query(Ventilator).filter(Ventilator.ventilator_id == ventilator_id).first()
    if not db_vent:
        raise HTTPException(status_code=404, detail="Ventilator not found")

    db_vent.status = new_status
    db.commit()
    db.refresh(db_vent)
    return db_vent


# Ambulance endpoints
@router.get("/ambulances", response_model=List[AmbulanceSchema])
def list_ambulances(
    hospital_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None, pattern="^(available|dispatched|returning)$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    """List all ambulances with optional filtering."""
    query = db.query(Ambulance)

    if hospital_id:
        query = query.filter(Ambulance.hospital_id == hospital_id)
    if status:
        query = query.filter(Ambulance.status == status)

    return query.offset(skip).limit(limit).all()


@router.post("/ambulances", response_model=AmbulanceSchema, status_code=status.HTTP_201_CREATED)
def create_ambulance(ambulance: AmbulanceCreate, db: Session = Depends(get_db)):
    """Create a new ambulance."""
    # Verify hospital exists
    hospital = db.query(Hospital).filter(Hospital.hospital_id == ambulance.hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")

    # Check uniqueness
    existing_id = db.query(Ambulance).filter(Ambulance.ambulance_id == ambulance.ambulance_id).first()
    if existing_id:
        raise HTTPException(status_code=400, detail="Ambulance ID already exists")

    existing_vehicle = db.query(Ambulance).filter(Ambulance.vehicle_no == ambulance.vehicle_no).first()
    if existing_vehicle:
        raise HTTPException(status_code=400, detail="Vehicle number already registered")

    db_amb = Ambulance(**ambulance.model_dump())
    db.add(db_amb)
    db.commit()
    db.refresh(db_amb)
    return db_amb


@router.patch("/ambulances/{ambulance_id}/status", response_model=AmbulanceSchema)
def update_ambulance_status(
    ambulance_id: int,
    new_status: str = Query(..., pattern="^(available|dispatched|returning)$"),
    db: Session = Depends(get_db),
):
    """Update ambulance status."""
    db_amb = db.query(Ambulance).filter(Ambulance.ambulance_id == ambulance_id).first()
    if not db_amb:
        raise HTTPException(status_code=404, detail="Ambulance not found")

    db_amb.status = new_status
    db.commit()
    db.refresh(db_amb)
    return db_amb


# Blood units endpoints
@router.get("/blood-units", response_model=List[BloodUnitSchema])
def list_blood_units(
    hospital_id: Optional[int] = Query(None),
    blood_group: Optional[str] = Query(None, pattern="^(A\\+|A-|B\\+|B-|O\\+|O-|AB\\+|AB-)$"),
    status: Optional[str] = Query(None, pattern="^(in_stock|issued|expired)$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    """List all blood units with optional filtering."""
    query = db.query(BloodUnit)

    if hospital_id:
        query = query.filter(BloodUnit.hospital_id == hospital_id)
    if blood_group:
        query = query.filter(BloodUnit.blood_group == blood_group)
    if status:
        query = query.filter(BloodUnit.status == status)

    return query.offset(skip).limit(limit).all()


@router.post("/blood-units", response_model=BloodUnitSchema, status_code=status.HTTP_201_CREATED)
def create_blood_unit(blood_unit: BloodUnitCreate, db: Session = Depends(get_db)):
    """Create a new blood unit."""
    # Verify hospital exists
    hospital = db.query(Hospital).filter(Hospital.hospital_id == blood_unit.hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")

    # Check if unit_id already exists
    existing = db.query(BloodUnit).filter(BloodUnit.unit_id == blood_unit.unit_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Blood unit ID already exists")

    db_unit = BloodUnit(**blood_unit.model_dump())
    db.add(db_unit)
    db.commit()
    db.refresh(db_unit)
    return db_unit
#!/usr/bin/env python3
"""
Resources API endpoints - beds, ventilators, ambulances, blood units.
Includes inventory management, status synchronization, audit logging,
and blood unit issuing workflow.
"""

from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Bed, Ventilator, Ambulance, BloodUnit, Hospital, EmergencyCase
from app.schemas import (
    Bed as BedSchema,
    BedCreate,
    Ventilator as VentilatorSchema,
    VentilatorCreate,
    Ambulance as AmbulanceSchema,
    AmbulanceCreate,
    BloodUnit as BloodUnitSchema,
    BloodUnitCreate,
    BloodUnitIssueRequest,
)
from app.services.audit import log_audit
from app.services.resource_tracker import sync_resource_availability

router = APIRouter(prefix="/resources", tags=["Resources"])


# ==========================================
# Bed endpoints
# ==========================================
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

    sync_resource_availability(db, db_bed.hospital_id, "beds")
    if db_bed.bed_type == "icu":
        sync_resource_availability(db, db_bed.hospital_id, "icu_beds")
    log_audit(db, db_bed.hospital_id, "Beds", db_bed.bed_id, "INSERT")

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
    db_bed = db.query(Bed).filter(Bed.bed_id == bed_id).with_for_update().first()
    if not db_bed:
        raise HTTPException(status_code=404, detail="Bed not found")

    db_bed.status = new_status
    sync_resource_availability(db, db_bed.hospital_id, "beds")
    if db_bed.bed_type == "icu":
        sync_resource_availability(db, db_bed.hospital_id, "icu_beds")
    log_audit(db, db_bed.hospital_id, "Beds", db_bed.bed_id, "UPDATE")

    db.commit()
    db.refresh(db_bed)
    return db_bed


# ==========================================
# Ventilator endpoints
# ==========================================
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

    sync_resource_availability(db, db_vent.hospital_id, "ventilators")
    log_audit(db, db_vent.hospital_id, "Ventilators", db_vent.ventilator_id, "INSERT")

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
    db_vent = db.query(Ventilator).filter(Ventilator.ventilator_id == ventilator_id).with_for_update().first()
    if not db_vent:
        raise HTTPException(status_code=404, detail="Ventilator not found")

    db_vent.status = new_status
    sync_resource_availability(db, db_vent.hospital_id, "ventilators")
    log_audit(db, db_vent.hospital_id, "Ventilators", db_vent.ventilator_id, "UPDATE")

    db.commit()
    db.refresh(db_vent)
    return db_vent


# ==========================================
# Ambulance endpoints
# ==========================================
@router.get("/ambulances", response_model=List[AmbulanceSchema])
def list_ambulances(
    hospital_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None, pattern="^(available|dispatched|returning|on_duty)$"),
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

    sync_resource_availability(db, db_amb.hospital_id, "ambulances")
    log_audit(db, db_amb.hospital_id, "Ambulances", db_amb.ambulance_id, "INSERT")

    db.commit()
    db.refresh(db_amb)
    return db_amb


@router.patch("/ambulances/{ambulance_id}/status", response_model=AmbulanceSchema)
def update_ambulance_status(
    ambulance_id: int,
    new_status: str = Query(..., pattern="^(available|dispatched|returning|on_duty)$"),
    db: Session = Depends(get_db),
):
    """Update ambulance status."""
    db_amb = db.query(Ambulance).filter(Ambulance.ambulance_id == ambulance_id).with_for_update().first()
    if not db_amb:
        raise HTTPException(status_code=404, detail="Ambulance not found")

    db_amb.status = new_status
    sync_resource_availability(db, db_amb.hospital_id, "ambulances")
    log_audit(db, db_amb.hospital_id, "Ambulances", db_amb.ambulance_id, "UPDATE")

    db.commit()
    db.refresh(db_amb)
    return db_amb


# ==========================================
# Blood units endpoints
# ==========================================
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

    sync_resource_availability(db, db_unit.hospital_id, "blood_units")
    log_audit(db, db_unit.hospital_id, "Blood_Units", db_unit.unit_id, "INSERT")

    db.commit()
    db.refresh(db_unit)
    return db_unit


@router.post("/blood-units/{unit_id}/issue", response_model=BloodUnitSchema)
def issue_blood_unit(
    unit_id: int,
    issue_req: BloodUnitIssueRequest,
    db: Session = Depends(get_db),
):
    """
    Issue a blood unit to an emergency case.
    Validates unit existence, case existence, in-stock status, and expiry date.
    Performs concurrency locking and updates resource availability and audit logs.
    """
    try:
        # Validate emergency case exists
        case = db.query(EmergencyCase).filter(EmergencyCase.case_id == issue_req.case_id).first()
        if not case:
            raise HTTPException(status_code=404, detail="Emergency case not found")

        # Row lock blood unit
        unit = db.query(BloodUnit).filter(BloodUnit.unit_id == unit_id).with_for_update().first()
        if not unit:
            raise HTTPException(status_code=404, detail="Blood unit not found")

        # Validate status
        if unit.status != "in_stock":
            raise HTTPException(
                status_code=400,
                detail=f"Blood unit is not available for issue. Current status: '{unit.status}'",
            )

        # Validate expiry date
        today = date.today()
        if unit.expiry_date < today:
            unit.status = "expired"
            sync_resource_availability(db, unit.hospital_id, "blood_units")
            log_audit(db, unit.hospital_id, "Blood_Units", unit.unit_id, "UPDATE")
            db.commit()
            raise HTTPException(
                status_code=400,
                detail=f"Blood unit expired on {unit.expiry_date} and cannot be issued",
            )

        # Issue the unit
        unit.status = "issued"
        unit.case_id = issue_req.case_id
        unit.issued_at = datetime.utcnow()

        sync_resource_availability(db, unit.hospital_id, "blood_units")
        log_audit(db, unit.hospital_id, "Blood_Units", unit.unit_id, "UPDATE")

        db.commit()
        db.refresh(unit)
        return unit

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to issue blood unit: {str(e)}")

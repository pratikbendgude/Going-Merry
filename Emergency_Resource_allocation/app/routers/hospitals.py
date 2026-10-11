#!/usr/bin/env python3
"""
Hospital API endpoints.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import Hospital, Bed, Ventilator, Ambulance
from app.schemas import (
    Hospital as HospitalSchema,
    HospitalCreate,
    HospitalUpdate,
    HospitalWithResources,
)

router = APIRouter(prefix="/hospitals", tags=["Hospitals"])


@router.get("", response_model=List[HospitalSchema])
def list_hospitals(
    city: Optional[str] = Query(None, description="Filter by city"),
    trauma_level: Optional[int] = Query(None, ge=1, le=5, description="Filter by trauma level"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    """List all hospitals with optional filtering."""
    query = db.query(Hospital)

    if city:
        query = query.filter(Hospital.city.ilike(f"%{city}%"))
    if trauma_level:
        query = query.filter(Hospital.trauma_level == trauma_level)

    return query.offset(skip).limit(limit).all()


@router.get("/with-resources", response_model=List[HospitalWithResources])
def list_hospitals_with_resources(
    city: Optional[str] = Query(None),
    trauma_level: Optional[int] = Query(None, ge=1, le=5),
    db: Session = Depends(get_db),
):
    """List hospitals with their resource counts."""
    hospitals = db.query(Hospital).all()

    result = []
    for hospital in hospitals:
        # Count beds
        total_beds = db.query(func.count(Bed.bed_id)).filter(Bed.hospital_id == hospital.hospital_id).scalar() or 0
        available_beds = db.query(func.count(Bed.bed_id)).filter(
            Bed.hospital_id == hospital.hospital_id,
            Bed.status == "available"
        ).scalar() or 0

        # Count ventilators
        total_vent = db.query(func.count(Ventilator.ventilator_id)).filter(
            Ventilator.hospital_id == hospital.hospital_id
        ).scalar() or 0
        available_vent = db.query(func.count(Ventilator.ventilator_id)).filter(
            Ventilator.hospital_id == hospital.hospital_id,
            Ventilator.status == "available"
        ).scalar() or 0

        # Count ambulances
        total_amb = db.query(func.count(Ambulance.ambulance_id)).filter(
            Ambulance.hospital_id == hospital.hospital_id
        ).scalar() or 0
        available_amb = db.query(func.count(Ambulance.ambulance_id)).filter(
            Ambulance.hospital_id == hospital.hospital_id,
            Ambulance.status == "available"
        ).scalar() or 0

        hosp_dict = HospitalWithResources(
            hospital_id=hospital.hospital_id,
            name=hospital.name,
            city=hospital.city,
            location=hospital.location,
            contact_no=hospital.contact_no,
            trauma_level=hospital.trauma_level,
            total_beds=total_beds,
            available_beds=available_beds,
            total_ventilators=total_vent,
            available_ventilators=available_vent,
            total_ambulances=total_amb,
            available_ambulances=available_amb,
        )
        result.append(hosp_dict)

    # Apply filters
    if city:
        result = [h for h in result if city.lower() in h.city.lower()]
    if trauma_level:
        result = [h for h in result if h.trauma_level == trauma_level]

    return result


@router.get("/search", response_model=List[HospitalSchema])
def search_hospitals(
    q: str = Query(..., min_length=1, description="Search query"),
    db: Session = Depends(get_db),
):
    """Search hospitals by name, city, or location."""
    return db.query(Hospital).filter(
        (Hospital.name.ilike(f"%{q}%")) |
        (Hospital.city.ilike(f"%{q}%")) |
        (Hospital.location.ilike(f"%{q}%"))
    ).limit(20).all()


@router.get("/{hospital_id}", response_model=HospitalSchema)
def get_hospital(hospital_id: int, db: Session = Depends(get_db)):
    """Get a single hospital by ID."""
    hospital = db.query(Hospital).filter(Hospital.hospital_id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return hospital


@router.get("/{hospital_id}/resources", response_model=HospitalWithResources)
def get_hospital_resources(hospital_id: int, db: Session = Depends(get_db)):
    """Get detailed resource information for a hospital."""
    hospital = db.query(Hospital).filter(Hospital.hospital_id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")

    total_beds = db.query(func.count(Bed.bed_id)).filter(Bed.hospital_id == hospital_id).scalar() or 0
    available_beds = db.query(func.count(Bed.bed_id)).filter(
        Bed.hospital_id == hospital_id,
        Bed.status == "available"
    ).scalar() or 0

    total_vent = db.query(func.count(Ventilator.ventilator_id)).filter(
        Ventilator.hospital_id == hospital_id
    ).scalar() or 0
    available_vent = db.query(func.count(Ventilator.ventilator_id)).filter(
        Ventilator.hospital_id == hospital_id,
        Ventilator.status == "available"
    ).scalar() or 0

    total_amb = db.query(func.count(Ambulance.ambulance_id)).filter(
        Ambulance.hospital_id == hospital_id
    ).scalar() or 0
    available_amb = db.query(func.count(Ambulance.ambulance_id)).filter(
        Ambulance.hospital_id == hospital_id,
        Ambulance.status == "available"
    ).scalar() or 0

    return HospitalWithResources(
        hospital_id=hospital.hospital_id,
        name=hospital.name,
        city=hospital.city,
        location=hospital.location,
        contact_no=hospital.contact_no,
        trauma_level=hospital.trauma_level,
        total_beds=total_beds,
        available_beds=available_beds,
        total_ventilators=total_vent,
        available_ventilators=available_vent,
        total_ambulances=total_amb,
        available_ambulances=available_amb,
    )


@router.post("", response_model=HospitalSchema, status_code=status.HTTP_201_CREATED)
def create_hospital(hospital: HospitalCreate, db: Session = Depends(get_db)):
    """Create a new hospital."""
    db_hospital = Hospital(**hospital.model_dump())
    db.add(db_hospital)
    db.commit()
    db.refresh(db_hospital)
    return db_hospital


@router.patch("/{hospital_id}", response_model=HospitalSchema)
def update_hospital(hospital_id: int, hospital: HospitalUpdate, db: Session = Depends(get_db)):
    """Update an existing hospital."""
    db_hospital = db.query(Hospital).filter(Hospital.hospital_id == hospital_id).first()
    if not db_hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")

    update_data = hospital.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_hospital, field, value)

    db.commit()
    db.refresh(db_hospital)
    return db_hospital


@router.delete("/{hospital_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_hospital(hospital_id: int, db: Session = Depends(get_db)):
    """Delete a hospital. Only allowed if no related records exist."""
    db_hospital = db.query(Hospital).filter(Hospital.hospital_id == hospital_id).first()
    if not db_hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")

    # Check for related records
    has_beds = db.query(Bed).filter(Bed.hospital_id == hospital_id).count() > 0
    has_cases = db.query(Hospital).filter(Hospital.hospital_id == hospital_id).count() > 0

    if has_beds or has_cases:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete hospital with existing beds or cases. Remove related records first."
        )

    db.delete(db_hospital)
    db.commit()
    return None
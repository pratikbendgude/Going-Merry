#!/usr/bin/env python3
"""
Emergency Cases API endpoints.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import EmergencyCase, Hospital
from app.schemas import (
    EmergencyCase as EmergencyCaseSchema,
    EmergencyCaseCreate,
    EmergencyCaseUpdate,
)

router = APIRouter(prefix="/emergency-cases", tags=["Emergency Cases"])


@router.get("", response_model=List[EmergencyCaseSchema])
def list_emergency_cases(
    hospital_id: Optional[int] = Query(None),
    triage_level: Optional[str] = Query(None, pattern="^(red|yellow|green)$"),
    status: Optional[str] = Query(None, pattern="^(open|admitted|discharged|transfer_pending)$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    """List all emergency cases with optional filtering."""
    query = db.query(EmergencyCase)

    if hospital_id:
        query = query.filter(EmergencyCase.hospital_id == hospital_id)
    if triage_level:
        query = query.filter(EmergencyCase.triage_level == triage_level)
    if status:
        query = query.filter(EmergencyCase.status == status)

    return query.order_by(EmergencyCase.reported_at.desc()).offset(skip).limit(limit).all()


@router.get("/{case_id}", response_model=EmergencyCaseSchema)
def get_emergency_case(case_id: int, db: Session = Depends(get_db)):
    """Get a single emergency case by ID."""
    case = db.query(EmergencyCase).filter(EmergencyCase.case_id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Emergency case not found")
    return case


@router.post("", response_model=EmergencyCaseSchema, status_code=status.HTTP_201_CREATED)
def create_emergency_case(case: EmergencyCaseCreate, db: Session = Depends(get_db)):
    """Create a new emergency case."""
    # Verify hospital exists
    hospital = db.query(Hospital).filter(Hospital.hospital_id == case.hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")

    db_case = EmergencyCase(**case.model_dump())
    db.add(db_case)
    db.commit()
    db.refresh(db_case)
    return db_case


@router.patch("/{case_id}", response_model=EmergencyCaseSchema)
def update_emergency_case(
    case_id: int,
    case_update: EmergencyCaseUpdate,
    db: Session = Depends(get_db),
):
    """Update an emergency case."""
    db_case = db.query(EmergencyCase).filter(EmergencyCase.case_id == case_id).first()
    if not db_case:
        raise HTTPException(status_code=404, detail="Emergency case not found")

    update_data = case_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_case, field, value)

    db.commit()
    db.refresh(db_case)
    return db_case


@router.delete("/{case_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_emergency_case(case_id: int, db: Session = Depends(get_db)):
    """Delete an emergency case. Only allowed if no allocations exist."""
    db_case = db.query(EmergencyCase).filter(EmergencyCase.case_id == case_id).first()
    if not db_case:
        raise HTTPException(status_code=404, detail="Emergency case not found")

    # Check for related allocations
    if db_case.bed_allocations or db_case.ventilator_allocations or db_case.dispatches:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete emergency case with existing resource allocations. Release resources first."
        )

    db.delete(db_case)
    db.commit()
    return None
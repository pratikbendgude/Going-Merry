#!/usr/bin/env python3
"""
Resource Allocation API endpoints.
Handles bed, ventilator, and ambulance allocations with proper concurrency control.
"""

from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.database import get_db
from app.models import (
    Bed,
    Ventilator,
    Ambulance,
    EmergencyCase,
    BedAllocation,
    VentilatorAllocation,
    Dispatched,
)
from app.schemas import (
    BedAllocationRequest,
    BedAllocationResponse,
    VentilatorAllocationRequest,
    VentilatorAllocationResponse,
    AmbulanceDispatchRequest,
    AmbulanceDispatchResponse,
)

router = APIRouter(prefix="/allocations", tags=["Allocations"])


# Bed Allocations
@router.post("/beds", response_model=BedAllocationResponse, status_code=status.HTTP_201_CREATED)
def allocate_bed(
    allocation: BedAllocationRequest,
    db: Session = Depends(get_db),
):
    """
    Allocate a bed to an emergency case.
    Uses database transaction to ensure concurrency safety.
    """
    try:
        # Verify case exists
        case = db.query(EmergencyCase).filter(EmergencyCase.case_id == allocation.case_id).first()
        if not case:
            raise HTTPException(status_code=404, detail="Emergency case not found")

        # Verify bed exists and is available (with row lock)
        bed = db.query(Bed).filter(Bed.bed_id == allocation.bed_id).with_for_update().first()
        if not bed:
            raise HTTPException(status_code=404, detail="Bed not found")

        if bed.status != "available":
            raise HTTPException(
                status_code=400,
                detail=f"Bed is not available. Current status: {bed.status}"
            )

        # Check if case already has an active bed allocation
        existing = db.query(BedAllocation).filter(
            and_(
                BedAllocation.case_id == allocation.case_id,
                BedAllocation.released_at.is_(None)
            )
        ).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Case already has an active bed allocation (bed_id: {existing.bed_id})"
            )

        # Create allocation
        db_allocation = BedAllocation(
            bed_id=allocation.bed_id,
            case_id=allocation.case_id,
            allocated_at=datetime.utcnow(),
        )
        db.add(db_allocation)

        # Update bed status
        bed.status = "occupied"

        # Commit transaction
        db.commit()
        db.refresh(db_allocation)

        return db_allocation

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Allocation failed: {str(e)}")


@router.post("/beds/{bed_id}/release", response_model=BedAllocationResponse)
def release_bed(bed_id: int, case_id: int, db: Session = Depends(get_db)):
    """Release a bed allocation."""
    try:
        # Find active allocation
        allocation = db.query(BedAllocation).filter(
            and_(
                BedAllocation.bed_id == bed_id,
                BedAllocation.case_id == case_id,
                BedAllocation.released_at.is_(None)
            )
        ).first()

        if not allocation:
            raise HTTPException(status_code=404, detail="Active allocation not found")

        # Update allocation
        allocation.released_at = datetime.utcnow()

        # Update bed status
        bed = db.query(Bed).filter(Bed.bed_id == bed_id).with_for_update().first()
        if bed:
            bed.status = "available"

        db.commit()
        db.refresh(allocation)

        return allocation

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Release failed: {str(e)}")


@router.get("/beds/active", response_model=List[BedAllocationResponse])
def list_active_bed_allocations(db: Session = Depends(get_db)):
    """List all active bed allocations."""
    return db.query(BedAllocation).filter(BedAllocation.released_at.is_(None)).all()


# Ventilator Allocations
@router.post("/ventilators", response_model=VentilatorAllocationResponse, status_code=status.HTTP_201_CREATED)
def allocate_ventilator(
    allocation: VentilatorAllocationRequest,
    db: Session = Depends(get_db),
):
    """
    Allocate a ventilator to an emergency case.
    Uses database transaction to ensure concurrency safety.
    """
    try:
        # Verify case exists
        case = db.query(EmergencyCase).filter(EmergencyCase.case_id == allocation.case_id).first()
        if not case:
            raise HTTPException(status_code=404, detail="Emergency case not found")

        # Verify ventilator exists and is available (with row lock)
        ventilator = db.query(Ventilator).filter(
            Ventilator.ventilator_id == allocation.ventilator_id
        ).with_for_update().first()

        if not ventilator:
            raise HTTPException(status_code=404, detail="Ventilator not found")

        if ventilator.status != "available":
            raise HTTPException(
                status_code=400,
                detail=f"Ventilator is not available. Current status: {ventilator.status}"
            )

        # Check if case already has an active ventilator allocation
        existing = db.query(VentilatorAllocation).filter(
            and_(
                VentilatorAllocation.case_id == allocation.case_id,
                VentilatorAllocation.released_at.is_(None)
            )
        ).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Case already has an active ventilator allocation (ventilator_id: {existing.ventilator_id})"
            )

        # Create allocation
        db_allocation = VentilatorAllocation(
            ventilator_id=allocation.ventilator_id,
            case_id=allocation.case_id,
            allocated_at=datetime.utcnow(),
        )
        db.add(db_allocation)

        # Update ventilator status
        ventilator.status = "in_use"

        # Commit transaction
        db.commit()
        db.refresh(db_allocation)

        return db_allocation

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Allocation failed: {str(e)}")


@router.post("/ventilators/{ventilator_id}/release", response_model=VentilatorAllocationResponse)
def release_ventilator(ventilator_id: int, case_id: int, db: Session = Depends(get_db)):
    """Release a ventilator allocation."""
    try:
        # Find active allocation
        allocation = db.query(VentilatorAllocation).filter(
            and_(
                VentilatorAllocation.ventilator_id == ventilator_id,
                VentilatorAllocation.case_id == case_id,
                VentilatorAllocation.released_at.is_(None)
            )
        ).first()

        if not allocation:
            raise HTTPException(status_code=404, detail="Active allocation not found")

        # Update allocation
        allocation.released_at = datetime.utcnow()

        # Update ventilator status
        ventilator = db.query(Ventilator).filter(
            Ventilator.ventilator_id == ventilator_id
        ).with_for_update().first()
        if ventilator:
            ventilator.status = "available"

        db.commit()
        db.refresh(allocation)

        return allocation

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Release failed: {str(e)}")


@router.get("/ventilators/active", response_model=List[VentilatorAllocationResponse])
def list_active_ventilator_allocations(db: Session = Depends(get_db)):
    """List all active ventilator allocations."""
    return db.query(VentilatorAllocation).filter(VentilatorAllocation.released_at.is_(None)).all()


# Ambulance Dispatches
@router.post("/ambulances", response_model=AmbulanceDispatchResponse, status_code=status.HTTP_201_CREATED)
def dispatch_ambulance(
    dispatch: AmbulanceDispatchRequest,
    db: Session = Depends(get_db),
):
    """
    Dispatch an ambulance to an emergency case.
    Uses database transaction to ensure concurrency safety.
    """
    try:
        # Verify case exists
        case = db.query(EmergencyCase).filter(EmergencyCase.case_id == dispatch.case_id).first()
        if not case:
            raise HTTPException(status_code=404, detail="Emergency case not found")

        # Verify ambulance exists and is available (with row lock)
        ambulance = db.query(Ambulance).filter(
            Ambulance.ambulance_id == dispatch.ambulance_id
        ).with_for_update().first()

        if not ambulance:
            raise HTTPException(status_code=404, detail="Ambulance not found")

        if ambulance.status != "available":
            raise HTTPException(
                status_code=400,
                detail=f"Ambulance is not available. Current status: {ambulance.status}"
            )

        # Check if case already has an active dispatch
        existing = db.query(Dispatched).filter(
            and_(
                Dispatched.case_id == dispatch.case_id,
                Dispatched.arrived_at.is_(None)
            )
        ).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Case already has an active ambulance dispatch (ambulance_id: {existing.ambulance_id})"
            )

        # Create dispatch record
        db_dispatch = Dispatched(
            ambulance_id=dispatch.ambulance_id,
            case_id=dispatch.case_id,
            dispatched_at=datetime.utcnow(),
        )
        db.add(db_dispatch)

        # Update ambulance status
        ambulance.status = "dispatched"

        # Commit transaction
        db.commit()
        db.refresh(db_dispatch)

        return db_dispatch

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Dispatch failed: {str(e)}")


@router.post("/ambulances/{ambulance_id}/arrive", response_model=AmbulanceDispatchResponse)
def mark_ambulance_arrived(ambulance_id: int, case_id: int, db: Session = Depends(get_db)):
    """Mark an ambulance as arrived."""
    try:
        # Find active dispatch
        dispatch = db.query(Dispatched).filter(
            and_(
                Dispatched.ambulance_id == ambulance_id,
                Dispatched.case_id == case_id,
                Dispatched.arrived_at.is_(None)
            )
        ).first()

        if not dispatch:
            raise HTTPException(status_code=404, detail="Active dispatch not found")

        # Update dispatch
        dispatch.arrived_at = datetime.utcnow()

        # Update ambulance status
        ambulance = db.query(Ambulance).filter(
            Ambulance.ambulance_id == ambulance_id
        ).with_for_update().first()
        if ambulance:
            ambulance.status = "available"

        db.commit()
        db.refresh(dispatch)

        return dispatch

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Arrival update failed: {str(e)}")


@router.get("/ambulances/active", response_model=List[AmbulanceDispatchResponse])
def list_active_ambulance_dispatches(db: Session = Depends(get_db)):
    """List all active ambulance dispatches."""
    return db.query(Dispatched).filter(Dispatched.arrived_at.is_(None)).all()
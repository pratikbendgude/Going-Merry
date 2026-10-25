#!/usr/bin/env python3
"""
Transfers API endpoints.
Handles inter-hospital patient transfers, lifecycle transitions,
and coordinate ambulance assignment with full transactional safety.
"""

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_

from app.database import get_db
from app.models import (
    Transfer,
    Hospital,
    EmergencyCase,
    Ambulance,
    Dispatched,
    BedAllocation,
    Bed,
    VentilatorAllocation,
    Ventilator,
    utcnow_second,
)
from app.schemas import (
    Transfer as TransferSchema,
    TransferCreate,
)
from app.services.audit import log_audit
from app.services.resource_tracker import sync_resource_availability

router = APIRouter(prefix="/transfers", tags=["Transfers"])


@router.get("", response_model=List[TransferSchema])
def list_transfers(
    status_filter: Optional[str] = Query(None, alias="status", pattern="^(requested|in_transit|in_progress|completed|cancelled)$"),
    from_hospital_id: Optional[int] = Query(None),
    to_hospital_id: Optional[int] = Query(None),
    case_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    """List all transfers with optional filters."""
    query = db.query(Transfer)

    if status_filter:
        query = query.filter(Transfer.status == status_filter)
    if from_hospital_id:
        query = query.filter(Transfer.from_hospital_id == from_hospital_id)
    if to_hospital_id:
        query = query.filter(Transfer.to_hospital_id == to_hospital_id)
    if case_id:
        query = query.filter(Transfer.case_id == case_id)

    return query.order_by(Transfer.requested_at.desc()).offset(skip).limit(limit).all()


@router.get("/{transfer_id}", response_model=TransferSchema)
def get_transfer(transfer_id: int, db: Session = Depends(get_db)):
    """Get single transfer by ID."""
    transfer = db.query(Transfer).filter(Transfer.transfer_id == transfer_id).first()
    if not transfer:
        raise HTTPException(status_code=404, detail="Transfer not found")
    return transfer


@router.post("", response_model=TransferSchema, status_code=status.HTTP_201_CREATED)
def create_transfer(
    transfer_in: TransferCreate,
    db: Session = Depends(get_db),
):
    """
    Request a new hospital-to-hospital patient transfer.
    Validates hospitals, emergency case, and ambulance availability.
    """
    try:
        # Validate source and destination are different
        if transfer_in.from_hospital_id == transfer_in.to_hospital_id:
            raise HTTPException(
                status_code=400,
                detail="Source and destination hospitals cannot be identical",
            )

        # Validate hospitals exist
        from_hosp = db.query(Hospital).filter(Hospital.hospital_id == transfer_in.from_hospital_id).first()
        if not from_hosp:
            raise HTTPException(status_code=404, detail=f"Source hospital ID {transfer_in.from_hospital_id} not found")

        to_hosp = db.query(Hospital).filter(Hospital.hospital_id == transfer_in.to_hospital_id).first()
        if not to_hosp:
            raise HTTPException(status_code=404, detail=f"Destination hospital ID {transfer_in.to_hospital_id} not found")

        # Validate case exists
        case = db.query(EmergencyCase).filter(EmergencyCase.case_id == transfer_in.case_id).with_for_update().first()
        if not case:
            raise HTTPException(status_code=404, detail=f"Emergency case ID {transfer_in.case_id} not found")

        # Validate that the emergency case belongs to the source hospital
        if case.hospital_id != transfer_in.from_hospital_id:
            raise HTTPException(
                status_code=400,
                detail=f"Emergency case {transfer_in.case_id} belongs to hospital {case.hospital_id}, not source hospital {transfer_in.from_hospital_id}",
            )

        # Check for existing active transfer for this case
        active_case_transfer = db.query(Transfer).filter(
            Transfer.case_id == transfer_in.case_id,
            Transfer.status.in_(["requested", "in_transit", "in_progress"]),
        ).first()
        if active_case_transfer:
            raise HTTPException(
                status_code=400,
                detail=f"Emergency case {transfer_in.case_id} already has an active transfer (ID: {active_case_transfer.transfer_id})",
            )

        # Validate ambulance if provided
        if transfer_in.ambulance_id:
            amb = db.query(Ambulance).filter(
                Ambulance.ambulance_id == transfer_in.ambulance_id
            ).with_for_update().first()
            if not amb:
                raise HTTPException(status_code=404, detail=f"Ambulance ID {transfer_in.ambulance_id} not found")

            if amb.status != "available":
                raise HTTPException(
                    status_code=400,
                    detail=f"Ambulance is not available (current status: {amb.status})",
                )

            # Check conflicting active transfers using this ambulance
            conflict_transfer = db.query(Transfer).filter(
                Transfer.ambulance_id == transfer_in.ambulance_id,
                Transfer.status.in_(["requested", "in_transit", "in_progress"]),
            ).first()
            if conflict_transfer:
                raise HTTPException(
                    status_code=400,
                    detail=f"Ambulance is already assigned to active transfer ID {conflict_transfer.transfer_id}",
                )

            # Check conflicting active dispatches
            active_dispatch = db.query(Dispatched).filter(
                Dispatched.ambulance_id == transfer_in.ambulance_id,
                Dispatched.arrived_at.is_(None),
            ).first()
            if active_dispatch:
                raise HTTPException(
                    status_code=400,
                    detail="Ambulance currently has an ongoing active dispatch",
                )

        # Generate transfer_id safely if not provided
        t_id = transfer_in.transfer_id
        if t_id is None:
            max_id = db.query(func.coalesce(func.max(Transfer.transfer_id), 0)).scalar() or 0
            t_id = max_id + 1

        db_transfer = Transfer(
            transfer_id=t_id,
            from_hospital_id=transfer_in.from_hospital_id,
            to_hospital_id=transfer_in.to_hospital_id,
            case_id=transfer_in.case_id,
            ambulance_id=transfer_in.ambulance_id,
            shortage_reason=transfer_in.shortage_reason,
            status="requested",
            requested_at=utcnow_second(),
            completed_at=None,
        )
        db.add(db_transfer)

        # Update case status
        if case.status in ("open", "admitted"):
            case.status = "transfer_pending"
            log_audit(db, case.hospital_id, "Emergency_Cases", case.case_id, "UPDATE")

        # Audit log
        log_audit(db, transfer_in.from_hospital_id, "Transfers", t_id, "INSERT")

        db.commit()
        db.refresh(db_transfer)
        return db_transfer

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Transfer creation failed: {str(e)}")


@router.post("/{transfer_id}/start", response_model=TransferSchema)
def start_transfer(transfer_id: int, db: Session = Depends(get_db)):
    """
    Transition transfer status from 'requested' to 'in_progress'.
    Marks assigned ambulance as 'dispatched' and synchronizes availability.
    """
    try:
        transfer = db.query(Transfer).filter(Transfer.transfer_id == transfer_id).with_for_update().first()
        if not transfer:
            raise HTTPException(status_code=404, detail="Transfer not found")

        if transfer.status != "requested":
            raise HTTPException(
                status_code=400,
                detail=f"Cannot start transfer with status '{transfer.status}'. Only 'requested' transfers can be started.",
            )

        transfer.status = "in_progress"

        if transfer.ambulance_id:
            amb = db.query(Ambulance).filter(
                Ambulance.ambulance_id == transfer.ambulance_id
            ).with_for_update().first()
            if amb:
                amb.status = "dispatched"
                sync_resource_availability(db, amb.hospital_id, "ambulances")
                log_audit(db, amb.hospital_id, "Ambulances", amb.ambulance_id, "UPDATE")

        log_audit(db, transfer.from_hospital_id, "Transfers", transfer.transfer_id, "UPDATE")

        db.commit()
        db.refresh(transfer)
        return transfer

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to start transfer: {str(e)}")


@router.post("/{transfer_id}/complete", response_model=TransferSchema)
def complete_transfer(transfer_id: int, db: Session = Depends(get_db)):
    """
    Complete an in-progress transfer.
    Moves patient to destination hospital, releases source hospital bed/ventilator,
    and returns assigned ambulance to available status.
    """
    try:
        transfer = db.query(Transfer).filter(Transfer.transfer_id == transfer_id).with_for_update().first()
        if not transfer:
            raise HTTPException(status_code=404, detail="Transfer not found")

        if transfer.status == "completed":
            raise HTTPException(
                status_code=400,
                detail="Cannot complete transfer that is already completed",
            )
        if transfer.status == "cancelled":
            raise HTTPException(
                status_code=400,
                detail="Cannot complete transfer that is already cancelled",
            )
        if transfer.status not in ("in_progress", "in_transit"):
            raise HTTPException(
                status_code=400,
                detail=f"Cannot complete transfer with status '{transfer.status}'. Only 'in_progress' transfers can be completed.",
            )

        now = utcnow_second()
        transfer.status = "completed"
        transfer.completed_at = now

        # Update patient case to destination hospital
        case = db.query(EmergencyCase).filter(
            EmergencyCase.case_id == transfer.case_id
        ).with_for_update().first()
        if case:
            case.hospital_id = transfer.to_hospital_id
            case.status = "admitted"
            log_audit(db, transfer.to_hospital_id, "Emergency_Cases", case.case_id, "UPDATE")

        # Release active bed allocation at origin hospital if one exists
        active_bed_alloc = db.query(BedAllocation).filter(
            BedAllocation.case_id == transfer.case_id,
            BedAllocation.released_at.is_(None),
        ).first()
        if active_bed_alloc:
            active_bed_alloc.released_at = now
            bed = db.query(Bed).filter(Bed.bed_id == active_bed_alloc.bed_id).with_for_update().first()
            if bed:
                bed.status = "available"
                sync_resource_availability(db, bed.hospital_id, "beds")
                if bed.bed_type == "icu":
                    sync_resource_availability(db, bed.hospital_id, "icu_beds")
                log_audit(db, bed.hospital_id, "Beds", bed.bed_id, "UPDATE")

        # Release active ventilator allocation at origin hospital if one exists
        active_vent_alloc = db.query(VentilatorAllocation).filter(
            VentilatorAllocation.case_id == transfer.case_id,
            VentilatorAllocation.released_at.is_(None),
        ).first()
        if active_vent_alloc:
            active_vent_alloc.released_at = now
            vent = db.query(Ventilator).filter(
                Ventilator.ventilator_id == active_vent_alloc.ventilator_id
            ).with_for_update().first()
            if vent:
                vent.status = "available"
                sync_resource_availability(db, vent.hospital_id, "ventilators")
                log_audit(db, vent.hospital_id, "Ventilators", vent.ventilator_id, "UPDATE")

        # Release ambulance back to available
        if transfer.ambulance_id:
            amb = db.query(Ambulance).filter(
                Ambulance.ambulance_id == transfer.ambulance_id
            ).with_for_update().first()
            if amb:
                amb.status = "available"
                sync_resource_availability(db, amb.hospital_id, "ambulances")
                log_audit(db, amb.hospital_id, "Ambulances", amb.ambulance_id, "UPDATE")

        log_audit(db, transfer.from_hospital_id, "Transfers", transfer.transfer_id, "UPDATE")

        db.commit()
        db.refresh(transfer)
        return transfer

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to complete transfer: {str(e)}")


@router.post("/{transfer_id}/cancel", response_model=TransferSchema)
def cancel_transfer(transfer_id: int, db: Session = Depends(get_db)):
    """
    Cancel a transfer request.
    Restores case status and releases ambulance if dispatched.
    """
    try:
        transfer = db.query(Transfer).filter(Transfer.transfer_id == transfer_id).with_for_update().first()
        if not transfer:
            raise HTTPException(status_code=404, detail="Transfer not found")

        if transfer.status in ("completed", "cancelled"):
            raise HTTPException(
                status_code=400,
                detail=f"Cannot cancel transfer that is already {transfer.status}",
            )

        now = utcnow_second()
        transfer.status = "cancelled"
        transfer.completed_at = now

        # Revert case status if it was pending
        case = db.query(EmergencyCase).filter(
            EmergencyCase.case_id == transfer.case_id
        ).with_for_update().first()
        if case and case.status == "transfer_pending":
            case.status = "open"
            log_audit(db, case.hospital_id, "Emergency_Cases", case.case_id, "UPDATE")

        # Restore ambulance if dispatched
        if transfer.ambulance_id:
            amb = db.query(Ambulance).filter(
                Ambulance.ambulance_id == transfer.ambulance_id
            ).with_for_update().first()
            if amb and amb.status == "dispatched":
                amb.status = "available"
                sync_resource_availability(db, amb.hospital_id, "ambulances")
                log_audit(db, amb.hospital_id, "Ambulances", amb.ambulance_id, "UPDATE")

        log_audit(db, transfer.from_hospital_id, "Transfers", transfer.transfer_id, "UPDATE")

        db.commit()
        db.refresh(transfer)
        return transfer

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to cancel transfer: {str(e)}")

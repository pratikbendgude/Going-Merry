#!/usr/bin/env python3
"""
Dashboard API endpoint - provides operational metrics.
"""

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    Hospital,
    Bed,
    Ventilator,
    EmergencyCase,
    Ambulance,
    BloodUnit,
    Transfer,
)
from app.schemas import DashboardMetrics

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("", response_model=DashboardMetrics)
def get_dashboard_metrics(db: Session = Depends(get_db)):
    """
    Get comprehensive dashboard metrics for emergency resource allocation.
    All counts are computed from actual database records.
    """

    # Hospital metrics
    total_hospitals = db.query(func.count(Hospital.hospital_id)).scalar() or 0

    # Bed metrics
    total_beds = db.query(func.count(Bed.bed_id)).scalar() or 0
    available_beds = db.query(func.count(Bed.bed_id)).filter(Bed.status == "available").scalar() or 0
    occupied_beds = db.query(func.count(Bed.bed_id)).filter(Bed.status == "occupied").scalar() or 0

    # Ventilator metrics
    total_ventilators = db.query(func.count(Ventilator.ventilator_id)).scalar() or 0
    available_ventilators = db.query(func.count(Ventilator.ventilator_id)).filter(
        Ventilator.status == "available"
    ).scalar() or 0
    in_use_ventilators = db.query(func.count(Ventilator.ventilator_id)).filter(
        Ventilator.status == "in_use"
    ).scalar() or 0

    # Emergency case metrics
    total_emergency_cases = db.query(func.count(EmergencyCase.case_id)).scalar() or 0
    open_cases = db.query(func.count(EmergencyCase.case_id)).filter(
        EmergencyCase.status == "open"
    ).scalar() or 0
    admitted_cases = db.query(func.count(EmergencyCase.case_id)).filter(
        EmergencyCase.status == "admitted"
    ).scalar() or 0
    transfer_pending_cases = db.query(func.count(EmergencyCase.case_id)).filter(
        EmergencyCase.status == "transfer_pending"
    ).scalar() or 0

    # Ambulance metrics
    total_ambulances = db.query(func.count(Ambulance.ambulance_id)).scalar() or 0
    available_ambulances = db.query(func.count(Ambulance.ambulance_id)).filter(
        Ambulance.status == "available"
    ).scalar() or 0

    # Blood unit metrics
    total_blood_units = db.query(func.count(BloodUnit.unit_id)).scalar() or 0
    available_blood_units = db.query(func.count(BloodUnit.unit_id)).filter(
        BloodUnit.status == "in_stock"
    ).scalar() or 0

    # Transfer metrics
    pending_transfers = db.query(func.count(Transfer.transfer_id)).filter(
        Transfer.status.in_(["requested", "in_transit"])
    ).scalar() or 0

    return DashboardMetrics(
        total_hospitals=total_hospitals,
        total_beds=total_beds,
        available_beds=available_beds,
        occupied_beds=occupied_beds,
        total_ventilators=total_ventilators,
        available_ventilators=available_ventilators,
        in_use_ventilators=in_use_ventilators,
        total_emergency_cases=total_emergency_cases,
        open_cases=open_cases,
        admitted_cases=admitted_cases,
        transfer_pending_cases=transfer_pending_cases,
        total_ambulances=total_ambulances,
        available_ambulances=available_ambulances,
        total_blood_units=total_blood_units,
        available_blood_units=available_blood_units,
        pending_transfers=pending_transfers,
    )
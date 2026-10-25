#!/usr/bin/env python3
"""
Centralized Resource Availability Tracker Service.
Maintains aggregated counts in the Resource_Availability table
in sync with actual database records (Beds, Ventilators, Ambulances, Blood Units).
"""

from datetime import datetime, date
from typing import Optional, Dict
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import (
    ResourceAvailability,
    Bed,
    Ventilator,
    Ambulance,
    BloodUnit,
    utcnow_second,
)

# Standard resource type mappings
# Maps incoming resource types to standard keys in Resource_Availability
VALID_RESOURCE_TYPES = {
    "beds",
    "icu_beds",
    "ventilators",
    "ambulances",
    "blood_units",
    "blood",
}


def sync_resource_availability(
    db: Session,
    hospital_id: int,
    resource_type: str,
) -> Optional[ResourceAvailability]:
    """
    Synchronize the Resource_Availability aggregate record for a given hospital
    and resource type with the actual inventory rows in the database.

    Guarantees:
    - total_count >= 0
    - available_count >= 0
    - available_count <= total_count (enforced by application and database check constraint)
    - Row locking via with_for_update() prevents concurrent count drift
    - Handled within the caller's active database transaction (rolls back on failure)
    """
    rtype = resource_type.lower()
    if rtype not in VALID_RESOURCE_TYPES:
        return None

    # Compute actual counts based on underlying entity tables
    if rtype in ("beds", "general_beds"):
        total = db.query(func.count(Bed.bed_id)).filter(
            Bed.hospital_id == hospital_id
        ).scalar() or 0
        available = db.query(func.count(Bed.bed_id)).filter(
            Bed.hospital_id == hospital_id,
            Bed.status == "available"
        ).scalar() or 0
        target_type = "beds"

    elif rtype == "icu_beds":
        total = db.query(func.count(Bed.bed_id)).filter(
            Bed.hospital_id == hospital_id,
            Bed.bed_type == "icu"
        ).scalar() or 0
        available = db.query(func.count(Bed.bed_id)).filter(
            Bed.hospital_id == hospital_id,
            Bed.bed_type == "icu",
            Bed.status == "available"
        ).scalar() or 0
        target_type = "icu_beds"

    elif rtype == "ventilators":
        total = db.query(func.count(Ventilator.ventilator_id)).filter(
            Ventilator.hospital_id == hospital_id
        ).scalar() or 0
        available = db.query(func.count(Ventilator.ventilator_id)).filter(
            Ventilator.hospital_id == hospital_id,
            Ventilator.status == "available"
        ).scalar() or 0
        target_type = "ventilators"

    elif rtype == "ambulances":
        total = db.query(func.count(Ambulance.ambulance_id)).filter(
            Ambulance.hospital_id == hospital_id
        ).scalar() or 0
        available = db.query(func.count(Ambulance.ambulance_id)).filter(
            Ambulance.hospital_id == hospital_id,
            Ambulance.status == "available"
        ).scalar() or 0
        target_type = "ambulances"

    elif rtype in ("blood_units", "blood"):
        # Blood units: in_stock and unexpired are available
        today = date.today()
        total = db.query(func.count(BloodUnit.unit_id)).filter(
            BloodUnit.hospital_id == hospital_id
        ).scalar() or 0
        available = db.query(func.count(BloodUnit.unit_id)).filter(
            BloodUnit.hospital_id == hospital_id,
            BloodUnit.status == "in_stock",
            BloodUnit.expiry_date >= today
        ).scalar() or 0
        target_type = "blood_units"
    else:
        return None

    # Safety clamp: available must be within [0, total]
    total = max(0, total)
    available = max(0, min(available, total))

    # Look up existing record with row lock to avoid race conditions
    record = (
        db.query(ResourceAvailability)
        .filter(
            ResourceAvailability.hospital_id == hospital_id,
            ResourceAvailability.resource_type == target_type,
        )
        .with_for_update()
        .first()
    )

    if record:
        record.total_count = total
        record.available_count = available
        record.last_updated = utcnow_second()
        return record
    else:
        # Check if an existing record is already staged in the active session
        staged_records = [
            obj for obj in db.new
            if isinstance(obj, ResourceAvailability)
            and obj.hospital_id == hospital_id
            and obj.resource_type == target_type
        ]
        if staged_records:
            staged_rec = staged_records[0]
            staged_rec.total_count = total
            staged_rec.available_count = available
            staged_rec.last_updated = utcnow_second()
            return staged_rec

        # Create record safely with staged-aware manual ID calculation if table lacks auto_increment
        max_db_id = (
            db.query(func.coalesce(func.max(ResourceAvailability.availability_id), 0))
            .scalar()
            or 0
        )
        staged_ids = [
            obj.availability_id for obj in db.new
            if isinstance(obj, ResourceAvailability) and getattr(obj, "availability_id", None) is not None
        ]
        identity_ids = [
            obj.availability_id for obj in db.identity_map.values()
            if isinstance(obj, ResourceAvailability) and getattr(obj, "availability_id", None) is not None
        ]
        next_avail_id = max([max_db_id] + staged_ids + identity_ids) + 1

        record = ResourceAvailability(
            availability_id=next_avail_id,
            hospital_id=hospital_id,
            resource_type=target_type,
            total_count=total,
            available_count=available,
            last_updated=utcnow_second(),
        )
        db.add(record)
        return record


def sync_all_hospital_resources(
    db: Session,
    hospital_id: int,
) -> Dict[str, Optional[ResourceAvailability]]:
    """
    Synchronize all resource categories for a hospital.
    """
    results = {}
    for rtype in ("beds", "icu_beds", "ventilators", "ambulances", "blood_units"):
        results[rtype] = sync_resource_availability(db, hospital_id, rtype)
    return results

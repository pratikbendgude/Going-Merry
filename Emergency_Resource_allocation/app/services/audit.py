#!/usr/bin/env python3
"""
Centralized Audit Logging Service.
Records operational changes to the Audit_Logs table within the caller's transaction.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import AuditLog, Hospital


def log_audit(
    db: Session,
    hospital_id: Optional[int],
    table_name: str,
    record_id: int,
    change_type: str,
) -> Optional[AuditLog]:
    """
    Record an audit log entry for a database operation.

    Guarantees:
    - Enlisted in the caller's current transaction: if the operation rolls back,
      the audit log is also rolled back, avoiding misleading phantom logs.
    - Resolves missing log_id automatically for tables without MySQL AUTO_INCREMENT.
    - Validates hospital_id foreign key constraint. If unavailable or invalid,
      resolves a fallback hospital to avoid integrity errors.
    - Sanitized change_type (INSERT, UPDATE, DELETE).
    """
    if not hospital_id:
        first_hosp = db.query(Hospital.hospital_id).first()
        if first_hosp:
            hospital_id = first_hosp[0]
        else:
            # Cannot write audit log if no hospital exists
            return None
    else:
        # Verify hospital exists to satisfy FK constraint
        exists = db.query(Hospital.hospital_id).filter(Hospital.hospital_id == hospital_id).first()
        if not exists:
            first_hosp = db.query(Hospital.hospital_id).first()
            if first_hosp:
                hospital_id = first_hosp[0]
            else:
                return None

    norm_change = change_type.upper()
    if norm_change not in ("INSERT", "UPDATE", "DELETE"):
        norm_change = "UPDATE"

    # Compute next log_id
    max_id = db.query(func.coalesce(func.max(AuditLog.log_id), 0)).scalar() or 0
    next_log_id = max_id + 1

    entry = AuditLog(
        log_id=next_log_id,
        hospital_id=hospital_id,
        table_name=table_name[:50],
        record_id=record_id,
        change_type=norm_change[:10],
        changed_at=datetime.utcnow(),
    )
    db.add(entry)
    return entry

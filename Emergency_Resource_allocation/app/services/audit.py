#!/usr/bin/env python3
"""
Centralized Audit Logging Service.
Records operational changes to the Audit_Logs table within the caller's transaction.

Strategy & Concurrency Notice:
- Preferred strategy: MySQL native AUTO_INCREMENT. When active (or in SQLite),
  AuditLog instances are created without an explicit log_id, letting the database
  engine allocate monotonically increasing IDs atomically without race conditions.
- Temporary fallback strategy (current unmigrated live schema):
  When the underlying table lacks AUTO_INCREMENT, log_audit() computes the next ID
  by examining both the database maximum and all staged AuditLog objects in the active
  SQLAlchemy session (db.new and db.identity_map).

CONCURRENCY LIMITATION OF TEMPORARY FALLBACK:
Checking db.new and db.identity_map guarantees distinct IDs for multiple audit records
staged within the same SQLAlchemy session/transaction (resolving the intra-transaction
duplicate key errors observed during bed allocation, bed release, and transfer completion).
However, it does NOT guarantee concurrency safety across separate simultaneous client
transactions: if two concurrent requests query MAX(log_id) before either commits, they
can still receive the same ID. Database-native AUTO_INCREMENT (via migrations/enable_audit_autoincrement.sql)
is required for absolute concurrent insert serialization.
"""

from datetime import datetime
from typing import Optional, Dict
from sqlalchemy import func, inspect
from sqlalchemy.orm import Session

from app.models import AuditLog, Hospital, utcnow_second

# Cache auto_increment capability per database engine id
_autoincrement_cache: Dict[int, bool] = {}


def is_autoincrement_supported(db: Session) -> bool:
    """
    Determine if the active database dialect/table natively supports AUTO_INCREMENT
    on Audit_Logs.log_id. Caches result per engine to avoid repetitive schema reflection.
    """
    try:
        bind = db.get_bind()
        engine_id = id(bind)
        if engine_id in _autoincrement_cache:
            return _autoincrement_cache[engine_id]

        # SQLite handles integer primary keys as auto-incrementing natively
        if bind.dialect.name == "sqlite":
            _autoincrement_cache[engine_id] = True
            return True

        # For MySQL and other relational dialects, inspect column definition
        insp = inspect(bind)
        cols = insp.get_columns("Audit_Logs")
        for col in cols:
            if col.get("name") == "log_id":
                is_ai = bool(col.get("autoincrement", False))
                _autoincrement_cache[engine_id] = is_ai
                return is_ai

        _autoincrement_cache[engine_id] = False
        return False
    except Exception:
        # Fallback to manual generation if inspection fails
        return False


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
    - Validates hospital_id foreign key constraint. If unavailable or invalid,
      resolves a fallback hospital to avoid integrity errors.
    - Sanitized change_type (INSERT, UPDATE, DELETE).
    - If AUTO_INCREMENT is available, omits manual log_id for database-native generation.
    - If AUTO_INCREMENT is absent, computes a unique ID across both database rows
      and session-staged records to prevent intra-transaction primary key collisions.
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

    now = utcnow_second()

    # Preferred Strategy: Native Database AUTO_INCREMENT
    if is_autoincrement_supported(db):
        entry = AuditLog(
            hospital_id=hospital_id,
            table_name=table_name[:50],
            record_id=record_id,
            change_type=norm_change[:10],
            changed_at=now,
        )
        db.add(entry)
        return entry

    # Temporary Fallback Strategy: Staged-Aware Manual ID Generation
    # Inspect database maximum ID
    max_db_id = db.query(func.coalesce(func.max(AuditLog.log_id), 0)).scalar() or 0

    # Inspect all newly staged AuditLog objects in current session (not yet flushed)
    staged_ids = [
        obj.log_id for obj in db.new
        if isinstance(obj, AuditLog) and getattr(obj, "log_id", None) is not None
    ]

    # Inspect identity map for objects added/flushed in current session
    identity_ids = [
        obj.log_id for obj in db.identity_map.values()
        if isinstance(obj, AuditLog) and getattr(obj, "log_id", None) is not None
    ]

    next_log_id = max([max_db_id] + staged_ids + identity_ids) + 1

    entry = AuditLog(
        log_id=next_log_id,
        hospital_id=hospital_id,
        table_name=table_name[:50],
        record_id=record_id,
        change_type=norm_change[:10],
        changed_at=now,
    )
    db.add(entry)
    return entry

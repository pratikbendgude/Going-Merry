#!/usr/bin/env python3
"""
Isolated Unit Tests for Transfers, Blood Unit Issuing,
Resource Availability Synchronization, and Audit Logging.
Uses an in-memory SQLite database to ensure the real database is never touched.
"""

import unittest
from datetime import datetime, date, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException

from app.models import (
    Base,
    Hospital,
    Bed,
    Ventilator,
    Ambulance,
    BloodUnit,
    EmergencyCase,
    Transfer,
    BedAllocation,
    VentilatorAllocation,
    Dispatched,
    ResourceAvailability,
    AuditLog,
)
from app.schemas import (
    TransferCreate,
    BloodUnitIssueRequest,
)
from app.routers.transfers import (
    create_transfer,
    start_transfer,
    complete_transfer,
    cancel_transfer,
)
from app.routers.resources import (
    issue_blood_unit,
)
from app.services.resource_tracker import sync_resource_availability
from app.services.audit import log_audit


class TestTransfersAndServicesIsolated(unittest.TestCase):
    """Test suite running exclusively on in-memory SQLite."""

    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(cls.engine)
        cls.Session = sessionmaker(bind=cls.engine)

    def setUp(self):
        self.db = self.Session()

        # Seed two test hospitals
        h1 = Hospital(hospital_id=1, name="City Central Hospital", city="Metropolis", trauma_level=1)
        h2 = Hospital(hospital_id=2, name="St. Jude Memorial", city="Metropolis", trauma_level=2)
        self.db.add_all([h1, h2])

        # Seed beds for Hospital 1
        b1 = Bed(bed_id=101, hospital_id=1, bed_type="icu", status="available")
        b2 = Bed(bed_id=102, hospital_id=1, bed_type="general", status="available")
        self.db.add_all([b1, b2])

        # Seed ventilators for Hospital 1
        v1 = Ventilator(ventilator_id=201, hospital_id=1, status="available")
        self.db.add(v1)

        # Seed ambulance for Hospital 1
        a1 = Ambulance(ambulance_id=301, hospital_id=1, vehicle_no="AMB-MET-01", status="available")
        a2 = Ambulance(ambulance_id=302, hospital_id=1, vehicle_no="AMB-MET-02", status="dispatched")
        self.db.add_all([a1, a2])

        # Seed blood units for Hospital 1
        u_valid = BloodUnit(
            unit_id=401,
            hospital_id=1,
            blood_group="O+",
            status="in_stock",
            expiry_date=date.today() + timedelta(days=30),
        )
        u_expired = BloodUnit(
            unit_id=402,
            hospital_id=1,
            blood_group="A+",
            status="in_stock",
            expiry_date=date.today() - timedelta(days=5),
        )
        u_issued = BloodUnit(
            unit_id=403,
            hospital_id=1,
            blood_group="B+",
            status="issued",
            expiry_date=date.today() + timedelta(days=20),
        )
        self.db.add_all([u_valid, u_expired, u_issued])

        # Seed patient cases
        c1 = EmergencyCase(case_id=501, hospital_id=1, patient_name="John Doe", triage_level="red", status="open")
        c2 = EmergencyCase(case_id=502, hospital_id=1, patient_name="Jane Smith", triage_level="yellow", status="open")
        self.db.add_all([c1, c2])

        self.db.commit()

    def tearDown(self):
        self.db.rollback()
        # Clean all tables in isolated memory DB
        for table in reversed(Base.metadata.sorted_tables):
            self.db.execute(table.delete())
        self.db.commit()
        self.db.close()

    # ==========================================
    # Transfer Lifecycle Tests
    # ==========================================
    def test_transfer_lifecycle_success(self):
        """Full lifecycle: create requested -> start (dispatches amb) -> complete (releases res, moves patient)"""
        # Assign bed and ventilator at source hospital
        bed = self.db.query(Bed).filter(Bed.bed_id == 101).first()
        bed.status = "occupied"
        b_alloc = BedAllocation(bed_id=101, case_id=501, allocated_at=datetime.utcnow())
        self.db.add(b_alloc)

        # 1. Create transfer
        t_req = TransferCreate(
            from_hospital_id=1,
            to_hospital_id=2,
            case_id=501,
            ambulance_id=301,
            shortage_reason="Specialist trauma requirement",
        )
        transfer = create_transfer(t_req, self.db)
        self.assertEqual(transfer.status, "requested")
        self.assertIsNotNone(transfer.transfer_id)

        # Case should be marked transfer_pending
        case = self.db.query(EmergencyCase).filter(EmergencyCase.case_id == 501).first()
        self.assertEqual(case.status, "transfer_pending")

        # 2. Start transfer
        transfer = start_transfer(transfer.transfer_id, self.db)
        self.assertEqual(transfer.status, "in_progress")

        # Ambulance should be dispatched
        amb = self.db.query(Ambulance).filter(Ambulance.ambulance_id == 301).first()
        self.assertEqual(amb.status, "dispatched")

        # 3. Complete transfer
        transfer = complete_transfer(transfer.transfer_id, self.db)
        self.assertEqual(transfer.status, "completed")
        self.assertIsNotNone(transfer.completed_at)

        # Patient moved to hospital 2 with status admitted
        self.db.refresh(case)
        self.assertEqual(case.hospital_id, 2)
        self.assertEqual(case.status, "admitted")

        # Source bed released
        self.db.refresh(bed)
        self.assertEqual(bed.status, "available")
        self.db.refresh(b_alloc)
        self.assertIsNotNone(b_alloc.released_at)

        # Ambulance returned to available
        self.db.refresh(amb)
        self.assertEqual(amb.status, "available")

    def test_transfer_identical_hospitals_rejected(self):
        """Source and destination hospitals cannot be identical."""
        t_req = TransferCreate(
            from_hospital_id=1,
            to_hospital_id=1,
            case_id=501,
        )
        with self.assertRaises(HTTPException) as ctx:
            create_transfer(t_req, self.db)
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("identical", ctx.exception.detail)

    def test_transfer_nonexistent_hospitals_or_case(self):
        """Non-existent entities should return 404."""
        t_req_bad_hosp = TransferCreate(from_hospital_id=999, to_hospital_id=2, case_id=501)
        with self.assertRaises(HTTPException) as ctx:
            create_transfer(t_req_bad_hosp, self.db)
        self.assertEqual(ctx.exception.status_code, 404)

        t_req_bad_case = TransferCreate(from_hospital_id=1, to_hospital_id=2, case_id=999)
        with self.assertRaises(HTTPException) as ctx:
            create_transfer(t_req_bad_case, self.db)
        self.assertEqual(ctx.exception.status_code, 404)

    def test_transfer_conflicting_ambulance(self):
        """Cannot assign unavailable or busy ambulance to a transfer."""
        # 302 is already status 'dispatched'
        t_req = TransferCreate(
            from_hospital_id=1,
            to_hospital_id=2,
            case_id=501,
            ambulance_id=302,
        )
        with self.assertRaises(HTTPException) as ctx:
            create_transfer(t_req, self.db)
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("not available", ctx.exception.detail)

    def test_transfer_cancellation_reverts_state(self):
        """Cancelling a transfer reverts case status and frees ambulance."""
        t_req = TransferCreate(
            from_hospital_id=1,
            to_hospital_id=2,
            case_id=501,
            ambulance_id=301,
        )
        transfer = create_transfer(t_req, self.db)
        start_transfer(transfer.transfer_id, self.db)

        cancelled = cancel_transfer(transfer.transfer_id, self.db)
        self.assertEqual(cancelled.status, "cancelled")

        case = self.db.query(EmergencyCase).filter(EmergencyCase.case_id == 501).first()
        self.assertEqual(case.status, "open")

        amb = self.db.query(Ambulance).filter(Ambulance.ambulance_id == 301).first()
        self.assertEqual(amb.status, "available")

    def test_invalid_lifecycle_transition(self):
        """Cannot complete or cancel twice."""
        t_req = TransferCreate(from_hospital_id=1, to_hospital_id=2, case_id=501)
        transfer = create_transfer(t_req, self.db)
        complete_transfer(transfer.transfer_id, self.db)

        # Attempt duplicate complete
        with self.assertRaises(HTTPException) as ctx:
            complete_transfer(transfer.transfer_id, self.db)
        self.assertEqual(ctx.exception.status_code, 400)

        # Attempt cancel after complete
        with self.assertRaises(HTTPException) as ctx2:
            cancel_transfer(transfer.transfer_id, self.db)
        self.assertEqual(ctx2.exception.status_code, 400)

    # ==========================================
    # Blood Unit Issuing Tests
    # ==========================================
    def test_blood_unit_issue_success(self):
        """Issue eligible in-stock blood unit to emergency case."""
        req = BloodUnitIssueRequest(case_id=501)
        issued = issue_blood_unit(401, req, self.db)
        self.assertEqual(issued.status, "issued")
        self.assertEqual(issued.case_id, 501)
        self.assertIsNotNone(issued.issued_at)

    def test_blood_unit_expired_rejected(self):
        """Expired blood unit must be rejected and marked expired."""
        req = BloodUnitIssueRequest(case_id=501)
        with self.assertRaises(HTTPException) as ctx:
            issue_blood_unit(402, req, self.db)
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("expired", ctx.exception.detail.lower())

        unit = self.db.query(BloodUnit).filter(BloodUnit.unit_id == 402).first()
        self.assertEqual(unit.status, "expired")

    def test_blood_unit_already_issued_rejected(self):
        """Cannot re-issue an already issued blood unit."""
        req = BloodUnitIssueRequest(case_id=501)
        with self.assertRaises(HTTPException) as ctx:
            issue_blood_unit(403, req, self.db)
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("not available", ctx.exception.detail.lower())

    def test_blood_unit_invalid_case_rejected(self):
        """Cannot issue blood unit to a non-existent case."""
        req = BloodUnitIssueRequest(case_id=9999)
        with self.assertRaises(HTTPException) as ctx:
            issue_blood_unit(401, req, self.db)
        self.assertEqual(ctx.exception.status_code, 404)

    # ==========================================
    # Resource Availability Synchronization Tests
    # ==========================================
    def test_resource_tracker_sync(self):
        """Verify availability count matches actual inventory and obeys boundaries."""
        sync_resource_availability(self.db, 1, "beds")
        rec = (
            self.db.query(ResourceAvailability)
            .filter(
                ResourceAvailability.hospital_id == 1,
                ResourceAvailability.resource_type == "beds",
            )
            .first()
        )
        self.assertIsNotNone(rec)
        self.assertEqual(rec.total_count, 2)
        self.assertEqual(rec.available_count, 2)

        # Allocate one bed
        bed = self.db.query(Bed).filter(Bed.bed_id == 101).first()
        bed.status = "occupied"
        self.db.commit()
        updated_rec = sync_resource_availability(self.db, 1, "beds")
        self.db.commit()

        self.assertEqual(updated_rec.total_count, 2)
        self.assertEqual(updated_rec.available_count, 1)

    # ==========================================
    # Audit Logging Tests
    # ==========================================
    def test_audit_logging_and_rollback(self):
        """Audit log is recorded in transaction and rolls back if transaction aborts."""
        log_audit(self.db, 1, "TestTable", 999, "INSERT")
        self.db.commit()

        entry = (
            self.db.query(AuditLog)
            .filter(AuditLog.table_name == "TestTable", AuditLog.record_id == 999)
            .first()
        )
        self.assertIsNotNone(entry)
        self.assertEqual(entry.change_type, "INSERT")

        # Test rollback behavior
        log_audit(self.db, 1, "RollbackTable", 888, "UPDATE")
        self.db.rollback()

        rb_entry = (
            self.db.query(AuditLog)
            .filter(AuditLog.table_name == "RollbackTable")
            .first()
        )
        self.assertIsNone(rb_entry, "Rolled back audit entry must not persist")


if __name__ == "__main__":
    unittest.main()

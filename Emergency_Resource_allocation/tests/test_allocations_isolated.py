"""
Isolated allocation tests using an in-memory SQLite database.
DOES NOT touch or connect to emergency_db.
"""

import unittest
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException

from app.models import (
    Base,
    Hospital,
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
    VentilatorAllocationRequest,
    AmbulanceDispatchRequest,
)
from app.routers.allocations import (
    allocate_bed,
    release_bed,
    allocate_ventilator,
    release_ventilator,
    dispatch_ambulance,
    mark_ambulance_arrived,
)


class TestTransactionalAllocationsIsolated(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # In-memory SQLite isolated test database
        cls.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(cls.engine)
        cls.Session = sessionmaker(bind=cls.engine)

    def setUp(self):
        self.db = self.Session()
        # Seed test fixture in isolated memory DB
        hosp = Hospital(hospital_id=999, name="Test Hospital", city="Test City", trauma_level=1)
        self.db.add(hosp)

        bed1 = Bed(bed_id=901, hospital_id=999, bed_type="icu", status="available")
        bed2 = Bed(bed_id=902, hospital_id=999, bed_type="general", status="occupied")
        self.db.add_all([bed1, bed2])

        vent1 = Ventilator(ventilator_id=901, hospital_id=999, status="available")
        vent2 = Ventilator(ventilator_id=902, hospital_id=999, status="in_use")
        self.db.add_all([vent1, vent2])

        amb1 = Ambulance(ambulance_id=901, hospital_id=999, vehicle_no="TEST-01", status="available")
        amb2 = Ambulance(ambulance_id=902, hospital_id=999, vehicle_no="TEST-02", status="dispatched")
        self.db.add_all([amb1, amb2])

        case1 = EmergencyCase(case_id=901, hospital_id=999, patient_name="Test Patient 1", triage_level="red", status="open")
        case2 = EmergencyCase(case_id=902, hospital_id=999, patient_name="Test Patient 2", triage_level="yellow", status="open")
        self.db.add_all([case1, case2])

        self.db.commit()

    def tearDown(self):
        self.db.rollback()
        # Clean up tables in memory
        for tbl in reversed(Base.metadata.sorted_tables):
            self.db.execute(tbl.delete())
        self.db.commit()
        self.db.close()

    def test_allocate_available_bed_success(self):
        req = BedAllocationRequest(bed_id=901, case_id=901)
        alloc = allocate_bed(req, self.db)
        self.assertEqual(alloc.bed_id, 901)
        self.assertEqual(alloc.case_id, 901)

        # Check bed status is now occupied
        bed = self.db.query(Bed).filter(Bed.bed_id == 901).first()
        self.assertEqual(bed.status, "occupied")

    def test_allocate_unavailable_bed_rejected(self):
        # Bed 902 is already occupied
        req = BedAllocationRequest(bed_id=902, case_id=901)
        with self.assertRaises(HTTPException) as ctx:
            allocate_bed(req, self.db)
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("not available", ctx.exception.detail)

    def test_allocate_second_bed_to_same_case_rejected(self):
        req1 = BedAllocationRequest(bed_id=901, case_id=901)
        allocate_bed(req1, self.db)

        # Create another available bed
        bed3 = Bed(bed_id=903, hospital_id=999, bed_type="general", status="available")
        self.db.add(bed3)
        self.db.commit()

        # Attempt to allocate bed3 to case 901 who already has bed 901
        req2 = BedAllocationRequest(bed_id=903, case_id=901)
        with self.assertRaises(HTTPException) as ctx:
            allocate_bed(req2, self.db)
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("already has an active bed allocation", ctx.exception.detail)

    def test_release_bed_restores_availability(self):
        req = BedAllocationRequest(bed_id=901, case_id=901)
        allocate_bed(req, self.db)

        # Release
        released = release_bed(bed_id=901, case_id=901, db=self.db)
        self.assertIsNotNone(released.released_at)

        bed = self.db.query(Bed).filter(Bed.bed_id == 901).first()
        self.assertEqual(bed.status, "available")

    def test_allocate_unavailable_ventilator_rejected(self):
        # Vent 902 is in_use
        req = VentilatorAllocationRequest(ventilator_id=902, case_id=901)
        with self.assertRaises(HTTPException) as ctx:
            allocate_ventilator(req, self.db)
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("not available", ctx.exception.detail)

    def test_allocate_available_ventilator_and_release(self):
        req = VentilatorAllocationRequest(ventilator_id=901, case_id=901)
        alloc = allocate_ventilator(req, self.db)
        self.assertEqual(alloc.ventilator_id, 901)

        vent = self.db.query(Ventilator).filter(Ventilator.ventilator_id == 901).first()
        self.assertEqual(vent.status, "in_use")

        released = release_ventilator(ventilator_id=901, case_id=901, db=self.db)
        self.assertIsNotNone(released.released_at)

        vent = self.db.query(Ventilator).filter(Ventilator.ventilator_id == 901).first()
        self.assertEqual(vent.status, "available")

    def test_dispatch_unavailable_ambulance_rejected(self):
        # Amb 902 is already dispatched
        req = AmbulanceDispatchRequest(ambulance_id=902, case_id=901)
        with self.assertRaises(HTTPException) as ctx:
            dispatch_ambulance(req, self.db)
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("not available", ctx.exception.detail)

    def test_dispatch_available_ambulance_and_arrive(self):
        req = AmbulanceDispatchRequest(ambulance_id=901, case_id=901)
        disp = dispatch_ambulance(req, self.db)
        self.assertEqual(disp.ambulance_id, 901)

        amb = self.db.query(Ambulance).filter(Ambulance.ambulance_id == 901).first()
        self.assertEqual(amb.status, "dispatched")

        arrived = mark_ambulance_arrived(ambulance_id=901, case_id=901, db=self.db)
        self.assertIsNotNone(arrived.arrived_at)

        amb = self.db.query(Ambulance).filter(Ambulance.ambulance_id == 901).first()
        self.assertEqual(amb.status, "available")

    def test_allocation_failure_does_not_leave_partial_state(self):
        """Failed allocation must not alter bed status or insert allocation records."""
        bed_before = self.db.query(Bed).filter(Bed.bed_id == 901).first().status
        req = BedAllocationRequest(bed_id=901, case_id=9999)  # Non-existent case

        with self.assertRaises(HTTPException):
            allocate_bed(req, self.db)

        # Bed status must remain 'available'
        bed_after = self.db.query(Bed).filter(Bed.bed_id == 901).first().status
        self.assertEqual(bed_before, bed_after)

        # No allocation record should exist
        alloc = self.db.query(BedAllocation).filter(BedAllocation.bed_id == 901).first()
        self.assertIsNone(alloc)

    def test_release_failure_does_not_leave_inconsistent_state(self):
        """Releasing non-existent allocation raises 404 and leaves resources untouched."""
        with self.assertRaises(HTTPException) as ctx:
            release_bed(bed_id=901, case_id=901, db=self.db)
        self.assertEqual(ctx.exception.status_code, 404)

    def test_bed_allocation_second_precision_and_refresh(self):
        """Verify bed allocation truncates microsecond and refreshes without InvalidRequestError."""
        req = BedAllocationRequest(bed_id=901, case_id=901)
        alloc = allocate_bed(req, self.db)
        self.assertEqual(alloc.allocated_at.microsecond, 0)

        # Refresh must succeed cleanly
        self.db.refresh(alloc)
        self.assertEqual(alloc.bed_id, 901)
        self.assertEqual(alloc.case_id, 901)

    def test_ventilator_allocation_second_precision_and_refresh(self):
        """Verify ventilator allocation truncates microsecond and refreshes cleanly."""
        req = VentilatorAllocationRequest(ventilator_id=901, case_id=901)
        alloc = allocate_ventilator(req, self.db)
        self.assertEqual(alloc.allocated_at.microsecond, 0)

        self.db.refresh(alloc)
        self.assertEqual(alloc.ventilator_id, 901)

    def test_ambulance_dispatch_second_precision_and_refresh(self):
        """Verify ambulance dispatch truncates microsecond and refreshes cleanly."""
        req = AmbulanceDispatchRequest(ambulance_id=901, case_id=901)
        disp = dispatch_ambulance(req, self.db)
        self.assertEqual(disp.dispatched_at.microsecond, 0)

        self.db.refresh(disp)
        self.assertEqual(disp.ambulance_id, 901)

    def test_composite_pk_model_microsecond_truncation(self):
        """Verify models automatically enforce second-precision on timestamp composite keys."""
        dt_with_micros = datetime(2026, 10, 25, 12, 34, 56, 789123)

        b = BedAllocation(bed_id=1, case_id=1, allocated_at=dt_with_micros, released_at=dt_with_micros)
        self.assertEqual(b.allocated_at.microsecond, 0)
        self.assertEqual(b.released_at.microsecond, 0)

        v = VentilatorAllocation(ventilator_id=1, case_id=1, allocated_at=dt_with_micros, released_at=dt_with_micros)
        self.assertEqual(v.allocated_at.microsecond, 0)
        self.assertEqual(v.released_at.microsecond, 0)

        d = Dispatched(ambulance_id=1, case_id=1, dispatched_at=dt_with_micros, arrived_at=dt_with_micros)
        self.assertEqual(d.dispatched_at.microsecond, 0)
        self.assertEqual(d.arrived_at.microsecond, 0)


if __name__ == "__main__":
    unittest.main()

#!/usr/bin/env python3
"""
SQLAlchemy models for Emergency Resource Allocation System.
Maps to existing emergency_db tables.
"""

from datetime import date, datetime
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()


class Hospital(Base):
    """Hospital entity"""
    __tablename__ = 'Hospitals'

    hospital_id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    city = Column(String(50), nullable=False)
    location = Column(String(150))
    contact_no = Column(String(15))
    trauma_level = Column(Integer)

    # Relationships
    beds = relationship("Bed", back_populates="hospital")
    ventilators = relationship("Ventilator", back_populates="hospital")
    resource_availabilities = relationship("ResourceAvailability", back_populates="hospital")
    emergency_cases = relationship("EmergencyCase", back_populates="hospital")
    ambulances = relationship("Ambulance", back_populates="hospital")
    blood_units = relationship("BloodUnit", back_populates="hospital")


class Bed(Base):
    """Bed entity - individual bed tracking"""
    __tablename__ = 'Beds'

    bed_id = Column(Integer, primary_key=True)
    hospital_id = Column(Integer, ForeignKey('Hospitals.hospital_id'), nullable=False)
    bed_type = Column(String(20), nullable=False)  # icu, general
    status = Column(String(20), default='available')  # available, occupied

    # Relationships
    hospital = relationship("Hospital", back_populates="beds")
    allocations = relationship("BedAllocation", back_populates="bed")


class Ventilator(Base):
    """Ventilator entity"""
    __tablename__ = 'Ventilators'

    ventilator_id = Column(Integer, primary_key=True)
    hospital_id = Column(Integer, ForeignKey('Hospitals.hospital_id'), nullable=False)
    status = Column(String(20), default='available')  # available, in_use, maintenance

    # Relationships
    hospital = relationship("Hospital", back_populates="ventilators")
    allocations = relationship("VentilatorAllocation", back_populates="ventilator")


class ResourceAvailability(Base):
    """Aggregated resource availability per hospital"""
    __tablename__ = 'Resource_Availability'

    availability_id = Column(Integer, primary_key=True)
    hospital_id = Column(Integer, ForeignKey('Hospitals.hospital_id'), nullable=False)
    resource_type = Column(String(30), nullable=False)  # beds, ventilators, blood, ambulances
    total_count = Column(Integer, nullable=False)
    available_count = Column(Integer, nullable=False)
    last_updated = Column(DateTime, default=datetime.utcnow)

    # Relationships
    hospital = relationship("Hospital", back_populates="resource_availabilities")


class EmergencyCase(Base):
    """Emergency case/patient"""
    __tablename__ = 'Emergency_Cases'

    case_id = Column(Integer, primary_key=True)
    hospital_id = Column(Integer, ForeignKey('Hospitals.hospital_id'), nullable=False)
    patient_name = Column(String(60), nullable=False)
    triage_level = Column(String(10), nullable=False)  # red, yellow, green
    status = Column(String(20), default='open')  # open, admitted, discharged, transfer_pending
    reported_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    hospital = relationship("Hospital", back_populates="emergency_cases")
    transfers = relationship("Transfer", back_populates="case")
    bed_allocations = relationship("BedAllocation", back_populates="case")
    ventilator_allocations = relationship("VentilatorAllocation", back_populates="case")
    dispatches = relationship("Dispatched", back_populates="case")


class Ambulance(Base):
    """Ambulance entity"""
    __tablename__ = 'Ambulances'

    ambulance_id = Column(Integer, primary_key=True)
    hospital_id = Column(Integer, ForeignKey('Hospitals.hospital_id'), nullable=False)
    vehicle_no = Column(String(20), nullable=False, unique=True)
    status = Column(String(20), default='available')  # available, dispatched, returning

    # Relationships
    hospital = relationship("Hospital", back_populates="ambulances")
    dispatches = relationship("Dispatched", back_populates="ambulance")
    transfers = relationship("Transfer", back_populates="ambulance")


class BloodUnit(Base):
    """Blood unit inventory"""
    __tablename__ = 'Blood_Units'

    unit_id = Column(Integer, primary_key=True)
    hospital_id = Column(Integer, ForeignKey('Hospitals.hospital_id'), nullable=False)
    blood_group = Column(String(5), nullable=False)  # A+, A-, B+, B-, O+, O-, AB+, AB-
    status = Column(String(20), default='in_stock')  # in_stock, issued, expired
    expiry_date = Column(Date, nullable=False)
    case_id = Column(Integer, ForeignKey('Emergency_Cases.case_id'), nullable=True)
    issued_at = Column(DateTime, nullable=True)

    # Relationships
    hospital = relationship("Hospital", back_populates="blood_units")


class Transfer(Base):
    """Hospital-to-hospital transfer"""
    __tablename__ = 'Transfers'

    transfer_id = Column(Integer, primary_key=True)
    from_hospital_id = Column(Integer, ForeignKey('Hospitals.hospital_id'), nullable=False)
    to_hospital_id = Column(Integer, ForeignKey('Hospitals.hospital_id'), nullable=False)
    case_id = Column(Integer, ForeignKey('Emergency_Cases.case_id'), nullable=False)
    ambulance_id = Column(Integer, ForeignKey('Ambulances.ambulance_id'), nullable=True)
    shortage_reason = Column(String(100))
    status = Column(String(20), default='requested')  # requested, in_transit, completed, cancelled
    requested_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    case = relationship("EmergencyCase", back_populates="transfers")
    ambulance = relationship("Ambulance", back_populates="transfers")


class BedAllocation(Base):
    """Bed allocation junction table"""
    __tablename__ = 'bed_alloc'

    bed_id = Column(Integer, ForeignKey('Beds.bed_id'), primary_key=True)
    case_id = Column(Integer, ForeignKey('Emergency_Cases.case_id'), primary_key=True)
    allocated_at = Column(DateTime, primary_key=True, default=datetime.utcnow)
    released_at = Column(DateTime, nullable=True)

    # Relationships
    bed = relationship("Bed", back_populates="allocations")
    case = relationship("EmergencyCase", back_populates="bed_allocations")


class Dispatched(Base):
    """Ambulance dispatch junction table"""
    __tablename__ = 'dispatched'

    ambulance_id = Column(Integer, ForeignKey('Ambulances.ambulance_id'), primary_key=True)
    case_id = Column(Integer, ForeignKey('Emergency_Cases.case_id'), primary_key=True)
    dispatched_at = Column(DateTime, primary_key=True, default=datetime.utcnow)
    arrived_at = Column(DateTime, nullable=True)

    # Relationships
    ambulance = relationship("Ambulance", back_populates="dispatches")
    case = relationship("EmergencyCase", back_populates="dispatches")


class VentilatorAllocation(Base):
    """Ventilator allocation junction table"""
    __tablename__ = 'vent_alloc'

    ventilator_id = Column(Integer, ForeignKey('Ventilators.ventilator_id'), primary_key=True)
    case_id = Column(Integer, ForeignKey('Emergency_Cases.case_id'), primary_key=True)
    allocated_at = Column(DateTime, primary_key=True, default=datetime.utcnow)
    released_at = Column(DateTime, nullable=True)

    # Relationships
    ventilator = relationship("Ventilator", back_populates="allocations")
    case = relationship("EmergencyCase", back_populates="ventilator_allocations")


class AuditLog(Base):
    """Audit logging"""
    __tablename__ = 'Audit_Logs'

    log_id = Column(Integer, primary_key=True)
    hospital_id = Column(Integer, ForeignKey('Hospitals.hospital_id'), nullable=False)
    table_name = Column(String(50), nullable=False)
    record_id = Column(Integer, nullable=False)
    change_type = Column(String(10), nullable=False)  # INSERT, UPDATE, DELETE
    changed_at = Column(DateTime, default=datetime.utcnow)
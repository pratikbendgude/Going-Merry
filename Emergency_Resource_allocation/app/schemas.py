#!/usr/bin/env python3
"""
Pydantic schemas for request/response validation.
"""

from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


# Hospital Schemas
class HospitalBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    city: str = Field(..., min_length=1, max_length=50)
    location: Optional[str] = Field(None, max_length=150)
    contact_no: Optional[str] = Field(None, max_length=15)
    trauma_level: Optional[int] = Field(None, ge=1, le=5)


class HospitalCreate(HospitalBase):
    pass


class HospitalUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    city: Optional[str] = Field(None, min_length=1, max_length=50)
    location: Optional[str] = Field(None, max_length=150)
    contact_no: Optional[str] = Field(None, max_length=15)
    trauma_level: Optional[int] = Field(None, ge=1, le=5)


class Hospital(HospitalBase):
    hospital_id: int

    model_config = ConfigDict(from_attributes=True)


# Bed Schemas
class BedBase(BaseModel):
    hospital_id: int
    bed_type: str = Field(..., pattern="^(icu|general)$")
    status: str = Field(default="available", pattern="^(available|occupied)$")


class BedCreate(BedBase):
    bed_id: int


class Bed(BedBase):
    bed_id: int

    model_config = ConfigDict(from_attributes=True)


# Ventilator Schemas
class VentilatorBase(BaseModel):
    hospital_id: int
    status: str = Field(default="available", pattern="^(available|in_use|maintenance)$")


class VentilatorCreate(VentilatorBase):
    ventilator_id: int


class Ventilator(VentilatorBase):
    ventilator_id: int

    model_config = ConfigDict(from_attributes=True)


# Resource Availability Schemas
class ResourceAvailabilityBase(BaseModel):
    hospital_id: int
    resource_type: str = Field(..., max_length=30)
    total_count: int = Field(..., ge=0)
    available_count: int = Field(..., ge=0)


class ResourceAvailabilityCreate(ResourceAvailabilityBase):
    pass


class ResourceAvailability(ResourceAvailabilityBase):
    availability_id: int
    last_updated: datetime

    model_config = ConfigDict(from_attributes=True)


# Emergency Case Schemas
class EmergencyCaseBase(BaseModel):
    hospital_id: int
    patient_name: str = Field(..., min_length=1, max_length=60)
    triage_level: str = Field(..., pattern="^(red|yellow|green)$")
    status: str = Field(default="open", pattern="^(open|admitted|discharged|transfer_pending)$")


class EmergencyCaseCreate(EmergencyCaseBase):
    pass


class EmergencyCaseUpdate(BaseModel):
    patient_name: Optional[str] = Field(None, min_length=1, max_length=60)
    triage_level: Optional[str] = Field(None, pattern="^(red|yellow|green)$")
    status: Optional[str] = Field(None, pattern="^(open|admitted|discharged|transfer_pending)$")


class EmergencyCase(EmergencyCaseBase):
    case_id: int
    reported_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Ambulance Schemas
class AmbulanceBase(BaseModel):
    hospital_id: int
    vehicle_no: str = Field(..., min_length=1, max_length=20)
    status: str = Field(default="available", pattern="^(available|dispatched|returning)$")


class AmbulanceCreate(AmbulanceBase):
    ambulance_id: int


class Ambulance(AmbulanceBase):
    ambulance_id: int

    model_config = ConfigDict(from_attributes=True)


# Blood Unit Schemas
class BloodUnitBase(BaseModel):
    hospital_id: int
    blood_group: str = Field(..., pattern=r"^(A\+|A-|B\+|B-|O\+|O-|AB\+|AB-)$")
    expiry_date: date
    status: str = Field(default="in_stock", pattern="^(in_stock|issued|expired)$")


class BloodUnitCreate(BloodUnitBase):
    unit_id: int


class BloodUnit(BloodUnitBase):
    unit_id: int
    case_id: Optional[int] = None
    issued_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# Transfer Schemas
class TransferBase(BaseModel):
    from_hospital_id: int
    to_hospital_id: int
    case_id: int
    ambulance_id: Optional[int] = None
    shortage_reason: Optional[str] = Field(None, max_length=100)
    status: str = Field(default="requested", pattern="^(requested|in_transit|completed|cancelled)$")


class TransferCreate(TransferBase):
    pass


class Transfer(TransferBase):
    transfer_id: int
    requested_at: datetime
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# Allocation Schemas
class BedAllocationRequest(BaseModel):
    bed_id: int
    case_id: int


class BedAllocationResponse(BaseModel):
    bed_id: int
    case_id: int
    allocated_at: datetime
    released_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class VentilatorAllocationRequest(BaseModel):
    ventilator_id: int
    case_id: int


class VentilatorAllocationResponse(BaseModel):
    ventilator_id: int
    case_id: int
    allocated_at: datetime
    released_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class AmbulanceDispatchRequest(BaseModel):
    ambulance_id: int
    case_id: int


class AmbulanceDispatchResponse(BaseModel):
    ambulance_id: int
    case_id: int
    dispatched_at: datetime
    arrived_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# Dashboard Metrics
class DashboardMetrics(BaseModel):
    total_hospitals: int
    total_beds: int
    available_beds: int
    occupied_beds: int
    total_ventilators: int
    available_ventilators: int
    in_use_ventilators: int
    total_emergency_cases: int
    open_cases: int
    admitted_cases: int
    transfer_pending_cases: int
    total_ambulances: int
    available_ambulances: int
    total_blood_units: int
    available_blood_units: int
    pending_transfers: int


# Hospital with resource counts
class HospitalWithResources(Hospital):
    total_beds: int = 0
    available_beds: int = 0
    total_ventilators: int = 0
    available_ventilators: int = 0
    total_ambulances: int = 0
    available_ambulances: int = 0
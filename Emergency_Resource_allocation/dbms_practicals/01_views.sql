-- ==============================================================================
-- DBMS Practical Phase III: Database Views
-- Project: Emergency Resource Allocation System
-- Target Database: emergency_db (MySQL 8.0+)
-- ==============================================================================
-- SAFETY NOTICE:
-- This script contains CREATE OR REPLACE VIEW and DROP VIEW statements.
-- It does NOT modify or delete base table data.
-- Do NOT execute against the live database without explicit administrator review.
-- ==============================================================================

USE emergency_db;

-- ==============================================================================
-- VIEW 1: vw_hospital_resource_overview
-- ==============================================================================
-- Purpose:
-- Provides a high-level operational dashboard of all hospitals showing accurate
-- total and available counts for beds, ventilators, and ambulances.
--
-- Joins & Logic:
-- Uses LEFT JOIN against pre-aggregated subqueries (derived tables) to completely
-- prevent Cartesian product inflation across multiple 1-to-many relationships.
-- ==============================================================================

CREATE OR REPLACE VIEW vw_hospital_resource_overview AS
SELECT 
    h.hospital_id,
    h.name AS hospital_name,
    h.city,
    h.trauma_level,
    h.contact_no,
    COALESCE(b.total_beds, 0) AS total_beds,
    COALESCE(b.avail_beds, 0) AS available_beds,
    COALESCE(b.total_icu_beds, 0) AS total_icu_beds,
    COALESCE(b.avail_icu_beds, 0) AS available_icu_beds,
    COALESCE(v.total_ventilators, 0) AS total_ventilators,
    COALESCE(v.avail_ventilators, 0) AS available_ventilators,
    COALESCE(a.total_ambulances, 0) AS total_ambulances,
    COALESCE(a.avail_ambulances, 0) AS available_ambulances
FROM Hospitals h
LEFT JOIN (
    SELECT 
        hospital_id,
        COUNT(*) AS total_beds,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) AS avail_beds,
        SUM(CASE WHEN bed_type = 'icu' THEN 1 ELSE 0 END) AS total_icu_beds,
        SUM(CASE WHEN bed_type = 'icu' AND status = 'available' THEN 1 ELSE 0 END) AS avail_icu_beds
    FROM Beds
    GROUP BY hospital_id
) b ON h.hospital_id = b.hospital_id
LEFT JOIN (
    SELECT 
        hospital_id,
        COUNT(*) AS total_ventilators,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) AS avail_ventilators
    FROM Ventilators
    GROUP BY hospital_id
) v ON h.hospital_id = v.hospital_id
LEFT JOIN (
    SELECT 
        hospital_id,
        COUNT(*) AS total_ambulances,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) AS avail_ambulances
    FROM Ambulances
    GROUP BY hospital_id
) a ON h.hospital_id = a.hospital_id;

-- Demonstration Query 1:
-- SELECT * FROM vw_hospital_resource_overview ORDER BY trauma_level ASC;
--
-- Expected Output on Sample Data:
-- Shows City General Hospital (Level 1, Mumbai), Lifeline Medical Centre (Level 2, Mumbai),
-- and Sunrise Care Hospital (Level 3, Pune) with accurate capacity and real-time availability.


-- ==============================================================================
-- VIEW 2: vw_available_critical_resources
-- ==============================================================================
-- Purpose:
-- Displays every individual unoccupied bed and available ventilator across all
-- hospitals, facilitating rapid dispatch for emergency triage.
--
-- Joins & Logic:
-- Joins Beds with Hospitals filtered to status = 'available', UNION ALL with
-- available Ventilators with Hospitals.
-- ==============================================================================

CREATE OR REPLACE VIEW vw_available_critical_resources AS
SELECT 
    'Bed' AS resource_category,
    b.bed_id AS resource_id,
    b.bed_type AS specification,
    b.status AS current_status,
    h.hospital_id,
    h.name AS hospital_name,
    h.city,
    h.trauma_level,
    h.contact_no
FROM Beds b
JOIN Hospitals h ON b.hospital_id = h.hospital_id
WHERE b.status = 'available'

UNION ALL

SELECT 
    'Ventilator' AS resource_category,
    v.ventilator_id AS resource_id,
    'Standard Ventilator' AS specification,
    v.status AS current_status,
    h.hospital_id,
    h.name AS hospital_name,
    h.city,
    h.trauma_level,
    h.contact_no
FROM Ventilators v
JOIN Hospitals h ON v.hospital_id = h.hospital_id
WHERE v.status = 'available';

-- Demonstration Query 2:
-- SELECT * FROM vw_available_critical_resources WHERE city = 'Mumbai';
--
-- Expected Output on Sample Data:
-- Lists unallocated general/ICU beds and ventilators located in Mumbai hospitals.


-- ==============================================================================
-- VIEW 3: vw_active_emergency_patients
-- ==============================================================================
-- Purpose:
-- Shows all currently active emergency patients with their admitting facility,
-- triage severity, assigned bed, and ventilator allocation.
--
-- Joins & Logic:
-- Joins Emergency_Cases with Hospitals, plus LEFT JOINs with bed_alloc and vent_alloc
-- filtering on released_at IS NULL to reflect only live, unreleased allocations.
-- ==============================================================================

CREATE OR REPLACE VIEW vw_active_emergency_patients AS
SELECT 
    ec.case_id,
    ec.patient_name,
    UPPER(ec.triage_level) AS triage_level,
    ec.status AS patient_status,
    ec.reported_at,
    h.hospital_id,
    h.name AS hospital_name,
    h.city,
    ba.bed_id AS assigned_bed_id,
    b.bed_type AS assigned_bed_type,
    ba.allocated_at AS bed_allocated_at,
    va.ventilator_id AS assigned_ventilator_id,
    va.allocated_at AS vent_allocated_at
FROM Emergency_Cases ec
JOIN Hospitals h ON ec.hospital_id = h.hospital_id
LEFT JOIN bed_alloc ba ON ec.case_id = ba.case_id AND ba.released_at IS NULL
LEFT JOIN Beds b ON ba.bed_id = b.bed_id
LEFT JOIN vent_alloc va ON ec.case_id = va.case_id AND va.released_at IS NULL
WHERE ec.status IN ('open', 'admitted', 'transfer_pending');

-- Demonstration Query 3:
-- SELECT * FROM vw_active_emergency_patients ORDER BY reported_at DESC;
--
-- Expected Output on Sample Data:
-- Active cases (e.g. John Doe, Amit Kumar, Sarah Lee) with their live allocation status.


-- ==============================================================================
-- VIEW 4: vw_pending_active_transfers
-- ==============================================================================
-- Purpose:
-- Tracks inter-facility patient transfer requests currently in transit or awaiting
-- ambulance dispatch, along with shortage reasons and assigned vehicles.
--
-- Joins & Logic:
-- Joins Transfers with origin Hospitals, destination Hospitals, Emergency_Cases,
-- and assigned Ambulances.
-- ==============================================================================

CREATE OR REPLACE VIEW vw_pending_active_transfers AS
SELECT 
    t.transfer_id,
    t.status AS transfer_status,
    t.requested_at,
    t.shortage_reason,
    src.hospital_id AS from_hospital_id,
    src.name AS from_hospital_name,
    src.city AS from_city,
    dst.hospital_id AS to_hospital_id,
    dst.name AS to_hospital_name,
    dst.city AS to_city,
    ec.case_id,
    ec.patient_name,
    ec.triage_level,
    amb.ambulance_id,
    amb.vehicle_no AS ambulance_vehicle_no,
    amb.status AS ambulance_status
FROM Transfers t
JOIN Hospitals src ON t.from_hospital_id = src.hospital_id
JOIN Hospitals dst ON t.to_hospital_id = dst.hospital_id
JOIN Emergency_Cases ec ON t.case_id = ec.case_id
LEFT JOIN Ambulances amb ON t.ambulance_id = amb.ambulance_id
WHERE t.status IN ('requested', 'in_progress', 'in_transit');

-- Demonstration Query 4:
-- SELECT * FROM vw_pending_active_transfers;
--
-- Expected Output on Sample Data:
-- Shows active transfer logistics between facilities.


-- ==============================================================================
-- SAFE CLEANUP / ROLLBACK SCRIPT (IF NEEDED)
-- ==============================================================================
-- To remove the views created above without affecting underlying tables:
-- DROP VIEW IF EXISTS vw_pending_active_transfers;
-- DROP VIEW IF EXISTS vw_active_emergency_patients;
-- DROP VIEW IF EXISTS vw_available_critical_resources;
-- DROP VIEW IF EXISTS vw_hospital_resource_overview;

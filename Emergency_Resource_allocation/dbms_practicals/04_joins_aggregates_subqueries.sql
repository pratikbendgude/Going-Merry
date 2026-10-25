-- ==============================================================================
-- DBMS Practical Phase II: SQL Queries, Joins, Aggregates & Subqueries
-- Project: Emergency Resource Allocation System
-- Target Database: emergency_db (MySQL 8.0+)
-- ==============================================================================
-- PURPOSE:
-- Demonstrates foundational and advanced relational database query capabilities:
--   1. INNER JOIN (Exact relational match)
--   2. LEFT OUTER JOIN (Preserving unmatched parent rows)
--   3. Multiple-Table Relational Navigation (5-table join)
--   4. Aggregate Functions with GROUP BY & HAVING
--   5. Scalar Subqueries
--   6. Relational Set Subqueries (IN, NOT IN)
--   7. Correlated Subqueries & Existence Tests (EXISTS, NOT EXISTS)
--   8. Comprehensive Resource Utilization Executive Query
-- ==============================================================================

USE emergency_db;

-- ==============================================================================
-- 1. INNER JOIN: Active Bed Allocations with Patient & Hospital Details
-- ==============================================================================
-- Concept: Matches active bed_alloc records where released_at IS NULL with the
-- corresponding Emergency_Cases, Beds, and Hospitals records.
-- ==============================================================================
SELECT 
    ec.case_id,
    ec.patient_name,
    UPPER(ec.triage_level) AS triage_level,
    h.hospital_id,
    h.name AS hospital_name,
    b.bed_id,
    b.bed_type,
    ba.allocated_at
FROM Emergency_Cases ec
INNER JOIN bed_alloc ba ON ec.case_id = ba.case_id
INNER JOIN Beds b ON ba.bed_id = b.bed_id
INNER JOIN Hospitals h ON ec.hospital_id = h.hospital_id
WHERE ba.released_at IS NULL
ORDER BY ba.allocated_at DESC;


-- ==============================================================================
-- 2. LEFT OUTER JOIN: Hospital Bed Capacity & Occupancy Analysis
-- ==============================================================================
-- Concept: Returns ALL hospitals from the left table regardless of whether they
-- currently have configured beds in the right table.
-- ==============================================================================
SELECT 
    h.hospital_id,
    h.name AS hospital_name,
    h.city,
    h.trauma_level,
    COUNT(b.bed_id) AS total_configured_beds,
    SUM(CASE WHEN b.status = 'occupied' THEN 1 ELSE 0 END) AS occupied_beds,
    SUM(CASE WHEN b.status = 'available' THEN 1 ELSE 0 END) AS available_beds,
    COALESCE(
        ROUND((SUM(CASE WHEN b.status = 'occupied' THEN 1 ELSE 0 END) / NULLIF(COUNT(b.bed_id), 0)) * 100, 1),
        0.0
    ) AS occupancy_rate_percent
FROM Hospitals h
LEFT JOIN Beds b ON h.hospital_id = b.hospital_id
GROUP BY h.hospital_id, h.name, h.city, h.trauma_level
ORDER BY occupancy_rate_percent DESC;


-- ==============================================================================
-- 3. MULTIPLE-TABLE JOIN (5 TABLES): Unified Patient Logistics Overview
-- ==============================================================================
-- Concept: Joins Emergency_Cases, Hospitals, bed_alloc, Beds, dispatched, Ambulances,
-- and Transfers to provide a single unified operational snapshot.
-- ==============================================================================
SELECT 
    ec.case_id,
    ec.patient_name,
    UPPER(ec.triage_level) AS triage_priority,
    ec.status AS patient_status,
    h.name AS current_hospital_name,
    COALESCE(b.bed_type, 'No Bed Assigned') AS allocated_bed_type,
    COALESCE(amb.vehicle_no, 'No Ambulance Dispatched') AS dispatched_ambulance,
    COALESCE(t.status, 'No Transfer Requested') AS transfer_status
FROM Emergency_Cases ec
JOIN Hospitals h ON ec.hospital_id = h.hospital_id
LEFT JOIN bed_alloc ba ON ec.case_id = ba.case_id AND ba.released_at IS NULL
LEFT JOIN Beds b ON ba.bed_id = b.bed_id
LEFT JOIN dispatched d ON ec.case_id = d.case_id AND d.arrived_at IS NULL
LEFT JOIN Ambulances amb ON d.ambulance_id = amb.ambulance_id
LEFT JOIN Transfers t ON ec.case_id = t.case_id AND t.status IN ('requested', 'in_progress')
ORDER BY ec.case_id ASC;


-- ==============================================================================
-- 4. AGGREGATES WITH GROUP BY & HAVING: High-Caseload Facilities
-- ==============================================================================
-- Concept: Groups emergency cases by hospital and triage severity, filtering
-- groups via HAVING clause to isolate facilities handling critical cases.
-- ==============================================================================
SELECT 
    h.hospital_id,
    h.name AS hospital_name,
    h.city,
    COUNT(ec.case_id) AS total_admitted_cases,
    SUM(CASE WHEN ec.triage_level = 'red' THEN 1 ELSE 0 END) AS critical_red_cases,
    SUM(CASE WHEN ec.triage_level = 'yellow' THEN 1 ELSE 0 END) AS urgent_yellow_cases,
    SUM(CASE WHEN ec.triage_level = 'green' THEN 1 ELSE 0 END) AS minor_green_cases
FROM Hospitals h
JOIN Emergency_Cases ec ON h.hospital_id = ec.hospital_id
GROUP BY h.hospital_id, h.name, h.city
HAVING COUNT(ec.case_id) >= 1
ORDER BY critical_red_cases DESC, total_admitted_cases DESC;


-- ==============================================================================
-- 5. SCALAR SUBQUERY: Identifying Premier Trauma Tier Facilities
-- ==============================================================================
-- Concept: The WHERE clause compares each hospital's trauma level against the
-- result of an inner scalar subquery that computes the highest tier (MIN trauma_level).
-- ==============================================================================
SELECT 
    hospital_id,
    name AS facility_name,
    city,
    contact_no,
    trauma_level
FROM Hospitals
WHERE trauma_level = (SELECT MIN(trauma_level) FROM Hospitals)
ORDER BY name ASC;


-- ==============================================================================
-- 6. SET SUBQUERY (NOT IN): Identifying Available Ambulances for Immediate Dispatch
-- ==============================================================================
-- Concept: Selects ambulances that are NOT present in the set of currently active
-- dispatches or currently active transfer assignments.
-- ==============================================================================
SELECT 
    a.ambulance_id,
    a.vehicle_no,
    h.name AS stationed_hospital,
    h.city,
    a.status AS vehicle_status
FROM Ambulances a
JOIN Hospitals h ON a.hospital_id = h.hospital_id
WHERE a.status = 'available'
  AND a.ambulance_id NOT IN (
      -- Subquery Set 1: Currently dispatched ambulances
      SELECT DISTINCT ambulance_id 
      FROM dispatched 
      WHERE arrived_at IS NULL
      
      UNION
      
      -- Subquery Set 2: Ambulances assigned to ongoing transfers
      SELECT DISTINCT ambulance_id 
      FROM Transfers 
      WHERE status IN ('requested', 'in_progress', 'in_transit')
        AND ambulance_id IS NOT NULL
  )
ORDER BY a.ambulance_id ASC;


-- ==============================================================================
-- 7. EXISTENCE SUBQUERY (EXISTS): Hospitals Managing Critical Red-Triage Cases
-- ==============================================================================
-- Concept: Uses a correlated EXISTS condition to return only hospitals that have
-- at least one active patient classified as 'red' severity.
-- ==============================================================================
SELECT 
    h.hospital_id,
    h.name AS hospital_name,
    h.city,
    h.contact_no,
    h.trauma_level
FROM Hospitals h
WHERE EXISTS (
    SELECT 1 
    FROM Emergency_Cases ec 
    WHERE ec.hospital_id = h.hospital_id 
      AND ec.triage_level = 'red'
      AND ec.status IN ('open', 'admitted', 'transfer_pending')
)
ORDER BY h.trauma_level ASC;


-- ==============================================================================
-- 8. CORRELATED SUBQUERY: Most Recent Patient Admission per Hospital
-- ==============================================================================
-- Concept: The inner subquery evaluates the maximum reported_at timestamp for
-- each outer row's specific hospital_id.
-- ==============================================================================
SELECT 
    ec.case_id,
    ec.patient_name,
    ec.triage_level,
    ec.reported_at,
    h.name AS hospital_name
FROM Emergency_Cases ec
JOIN Hospitals h ON ec.hospital_id = h.hospital_id
WHERE ec.reported_at = (
    SELECT MAX(sub.reported_at)
    FROM Emergency_Cases sub
    WHERE sub.hospital_id = ec.hospital_id
)
ORDER BY ec.reported_at DESC;


-- ==============================================================================
-- 9. EXECUTIVE RESOURCE UTILIZATION REPORT: Systemwide Multi-Category Summary
-- ==============================================================================
-- Concept: Advanced multi-subquery join integrating Beds, Ventilators, Ambulances,
-- and Active Cases into an executive dashboard query.
-- ==============================================================================
SELECT 
    h.hospital_id,
    h.name AS hospital_name,
    h.city,
    h.trauma_level,
    COALESCE(b.total_beds, 0) AS total_beds,
    COALESCE(b.available_beds, 0) AS available_beds,
    COALESCE(v.total_ventilators, 0) AS total_ventilators,
    COALESCE(v.available_ventilators, 0) AS available_ventilators,
    COALESCE(a.total_ambulances, 0) AS total_ambulances,
    COALESCE(a.available_ambulances, 0) AS available_ambulances,
    COALESCE(c.active_cases, 0) AS active_cases
FROM Hospitals h
LEFT JOIN (
    SELECT 
        hospital_id,
        COUNT(*) AS total_beds,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) AS available_beds
    FROM Beds
    GROUP BY hospital_id
) b ON h.hospital_id = b.hospital_id
LEFT JOIN (
    SELECT 
        hospital_id,
        COUNT(*) AS total_ventilators,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) AS available_ventilators
    FROM Ventilators
    GROUP BY hospital_id
) v ON h.hospital_id = v.hospital_id
LEFT JOIN (
    SELECT 
        hospital_id,
        COUNT(*) AS total_ambulances,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) AS available_ambulances
    FROM Ambulances
    GROUP BY hospital_id
) a ON h.hospital_id = a.hospital_id
LEFT JOIN (
    SELECT 
        hospital_id,
        COUNT(*) AS active_cases
    FROM Emergency_Cases
    WHERE status IN ('open', 'admitted', 'transfer_pending')
    GROUP BY hospital_id
) c ON h.hospital_id = c.hospital_id
ORDER BY h.trauma_level ASC, h.name ASC;

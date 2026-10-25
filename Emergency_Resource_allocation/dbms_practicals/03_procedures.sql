-- ==============================================================================
-- DBMS Practical Phase III: Stored Procedures
-- Project: Emergency Resource Allocation System
-- Target Database: emergency_db (MySQL 8.0+)
-- ==============================================================================
-- SAFETY NOTICE:
-- Stored procedures read or prepare operational summaries.
-- They do NOT drop tables or mutate existing schema.
-- Do NOT execute against the live database without explicit administrator review.
-- ==============================================================================

USE emergency_db;

DELIMITER $$

-- ==============================================================================
-- PROCEDURE 1: sp_hospital_resource_report
-- Purpose:
-- Produces a comprehensive multi-section operational report for a single hospital.
-- Parameters:
--   IN p_hospital_id INT - ID of the target hospital
-- ==============================================================================
DROP PROCEDURE IF EXISTS sp_hospital_resource_report$$
CREATE PROCEDURE sp_hospital_resource_report(IN p_hospital_id INT)
BEGIN
    -- Section 1: Facility Profile
    SELECT 
        hospital_id,
        name AS hospital_name,
        city,
        location,
        contact_no,
        trauma_level
    FROM Hospitals
    WHERE hospital_id = p_hospital_id;

    -- Section 2: Bed Inventory Breakdown
    SELECT 
        bed_type,
        COUNT(*) AS total_count,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) AS available_count,
        SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) AS occupied_count,
        ROUND((SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 1) AS occupancy_rate_percent
    FROM Beds
    WHERE hospital_id = p_hospital_id
    GROUP BY bed_type;

    -- Section 3: Critical Equipment & Vehicles
    SELECT 
        'Ventilators' AS resource_category,
        COUNT(*) AS total_units,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) AS available_units,
        SUM(CASE WHEN status = 'in_use' THEN 1 ELSE 0 END) AS in_use_units
    FROM Ventilators
    WHERE hospital_id = p_hospital_id
    UNION ALL
    SELECT 
        'Ambulances' AS resource_category,
        COUNT(*) AS total_units,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) AS available_units,
        SUM(CASE WHEN status = 'dispatched' THEN 1 ELSE 0 END) AS in_use_units
    FROM Ambulances
    WHERE hospital_id = p_hospital_id;

    -- Section 4: Blood Bank Stock by Blood Group
    SELECT 
        blood_group,
        COUNT(*) AS total_units,
        SUM(CASE WHEN status = 'in_stock' AND expiry_date >= CURDATE() THEN 1 ELSE 0 END) AS viable_in_stock,
        SUM(CASE WHEN status = 'expired' OR expiry_date < CURDATE() THEN 1 ELSE 0 END) AS expired_units,
        MIN(expiry_date) AS earliest_expiry_date
    FROM Blood_Units
    WHERE hospital_id = p_hospital_id
    GROUP BY blood_group;
END$$


-- ==============================================================================
-- PROCEDURE 2: sp_find_suitable_hospitals
-- Purpose:
-- Emergency triage search procedure: Finds receiving hospitals capable of taking
-- an incoming patient based on city, maximum trauma tier, and resource need.
-- Parameters:
--   IN p_city VARCHAR(50) - Filter by city (or NULL for all cities)
--   IN p_max_trauma_level INT - Maximum trauma level (1=highest capability, NULL=any)
--   IN p_required_resource VARCHAR(30) - 'beds', 'icu_beds', or 'ventilators'
-- ==============================================================================
DROP PROCEDURE IF EXISTS sp_find_suitable_hospitals$$
CREATE PROCEDURE sp_find_suitable_hospitals(
    IN p_city VARCHAR(50),
    IN p_max_trauma_level INT,
    IN p_required_resource VARCHAR(30)
)
BEGIN
    SELECT 
        h.hospital_id,
        h.name AS hospital_name,
        h.city,
        h.trauma_level,
        h.contact_no,
        COALESCE(b.available_general_beds, 0) AS available_general_beds,
        COALESCE(b.available_icu_beds, 0) AS available_icu_beds,
        COALESCE(v.available_ventilators, 0) AS available_ventilators
    FROM Hospitals h
    LEFT JOIN (
        SELECT 
            hospital_id,
            SUM(CASE WHEN bed_type = 'general' AND status = 'available' THEN 1 ELSE 0 END) AS available_general_beds,
            SUM(CASE WHEN bed_type = 'icu' AND status = 'available' THEN 1 ELSE 0 END) AS available_icu_beds
        FROM Beds
        GROUP BY hospital_id
    ) b ON h.hospital_id = b.hospital_id
    LEFT JOIN (
        SELECT 
            hospital_id,
            SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) AS available_ventilators
        FROM Ventilators
        GROUP BY hospital_id
    ) v ON h.hospital_id = v.hospital_id
    WHERE (p_city IS NULL OR h.city = p_city)
      AND (p_max_trauma_level IS NULL OR h.trauma_level <= p_max_trauma_level)
      AND (
          p_required_resource IS NULL
          OR (p_required_resource = 'beds' AND COALESCE(b.available_general_beds, 0) > 0)
          OR (p_required_resource = 'icu_beds' AND COALESCE(b.available_icu_beds, 0) > 0)
          OR (p_required_resource = 'ventilators' AND COALESCE(v.available_ventilators, 0) > 0)
      )
    ORDER BY h.trauma_level ASC, h.name ASC;
END$$


-- ==============================================================================
-- PROCEDURE 3: sp_emergency_case_journey
-- Purpose:
-- Provides a full clinical & logistic trace of an emergency case from report to discharge.
-- Parameters:
--   IN p_case_id INT - ID of the emergency case
-- ==============================================================================
DROP PROCEDURE IF EXISTS sp_emergency_case_journey$$
CREATE PROCEDURE sp_emergency_case_journey(IN p_case_id INT)
BEGIN
    -- Patient & Admitting Facility
    SELECT 
        ec.case_id,
        ec.patient_name,
        UPPER(ec.triage_level) AS triage_level,
        ec.status AS current_status,
        ec.reported_at,
        h.hospital_id,
        h.name AS hospital_name,
        h.city,
        h.contact_no AS hospital_contact
    FROM Emergency_Cases ec
    JOIN Hospitals h ON ec.hospital_id = h.hospital_id
    WHERE ec.case_id = p_case_id;

    -- Bed Allocations (Current & Historical)
    SELECT 
        ba.bed_id,
        b.bed_type,
        ba.allocated_at,
        ba.released_at,
        CASE WHEN ba.released_at IS NULL THEN 'ACTIVE' ELSE 'RELEASED' END AS allocation_state
    FROM bed_alloc ba
    JOIN Beds b ON ba.bed_id = b.bed_id
    WHERE ba.case_id = p_case_id
    ORDER BY ba.allocated_at DESC;

    -- Ventilator Allocations (Current & Historical)
    SELECT 
        va.ventilator_id,
        va.allocated_at,
        va.released_at,
        CASE WHEN va.released_at IS NULL THEN 'ACTIVE' ELSE 'RELEASED' END AS allocation_state
    FROM vent_alloc va
    WHERE va.case_id = p_case_id
    ORDER BY va.allocated_at DESC;

    -- Inter-Hospital Transfers (if any)
    SELECT 
        t.transfer_id,
        src.name AS from_hospital,
        dst.name AS to_hospital,
        t.shortage_reason,
        t.status AS transfer_status,
        t.requested_at,
        t.completed_at,
        amb.vehicle_no AS assigned_ambulance
    FROM Transfers t
    JOIN Hospitals src ON t.from_hospital_id = src.hospital_id
    JOIN Hospitals dst ON t.to_hospital_id = dst.hospital_id
    LEFT JOIN Ambulances amb ON t.ambulance_id = amb.ambulance_id
    WHERE t.case_id = p_case_id;
END$$

DELIMITER ;


-- ==============================================================================
-- DEMONSTRATION COMMANDS FOR TEACHER EVALUATION
-- ==============================================================================
-- Demonstration 1: Resource Report for Hospital 1
--   CALL sp_hospital_resource_report(1);
--
-- Demonstration 2: Find ICU Bed in Mumbai with Trauma Level <= 2
--   CALL sp_find_suitable_hospitals('Mumbai', 2, 'icu_beds');
--
-- Demonstration 3: Search all facilities in any city needing Ventilators
--   CALL sp_find_suitable_hospitals(NULL, NULL, 'ventilators');
--
-- Demonstration 4: Patient Journey Trace for Case #1
--   CALL sp_emergency_case_journey(1);


-- ==============================================================================
-- SAFE CLEANUP / ROLLBACK SCRIPT
-- ==============================================================================
-- To remove the stored procedures created above without touching table data:
-- DROP PROCEDURE IF EXISTS sp_hospital_resource_report;
-- DROP PROCEDURE IF EXISTS sp_find_suitable_hospitals;
-- DROP PROCEDURE IF EXISTS sp_emergency_case_journey;

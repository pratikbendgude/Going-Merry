-- ==============================================================================
-- DBMS Practical Phase III: Database Triggers
-- Project: Emergency Resource Allocation System
-- Target Database: emergency_db (MySQL 8.0+)
-- ==============================================================================
-- CRITICAL ARCHITECTURAL DISTINCTION:
-- 1. In this production architecture, the FastAPI backend (app/services/resource_tracker.py
--    and app/services/audit.py) authoritatively synchronizes aggregated Resource_Availability
--    counts and transactional audit trails.
-- 2. Activating database triggers that perform the same count increment/decrement will
--    cause catastrophic DOUBLE-COUNTING.
-- 3. Therefore, the triggers below are structured into two categories:
--    - CATEGORY A: Database-Level Domain Integrity Triggers (Recommended for DB layer)
--                  These enforce invariants that cannot be bypassed even by manual SQL.
--    - CATEGORY B: Standalone Availability Triggers (Reference Only)
--                  Used ONLY if operating purely in SQL without the FastAPI backend.
--
-- DO NOT EXECUTE AGAINST LIVE emergency_db WITHOUT EXPLICIT ADMINISTRATOR APPROVAL.
-- ==============================================================================

USE emergency_db;

DELIMITER $$

-- ==============================================================================
-- CATEGORY A: DATABASE DOMAIN INTEGRITY TRIGGERS
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- TRIGGER 1: trg_validate_case_active_for_bed_allocation
-- Table:     bed_alloc
-- Event:     BEFORE INSERT
-- Purpose:   Guarantees that a bed is never allocated to an emergency patient whose
--            case is already 'discharged' or closed.
-- ------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_validate_case_active_for_bed_allocation$$
CREATE TRIGGER trg_validate_case_active_for_bed_allocation
BEFORE INSERT ON bed_alloc
FOR EACH ROW
BEGIN
    DECLARE v_case_status VARCHAR(20);

    SELECT status INTO v_case_status
    FROM Emergency_Cases
    WHERE case_id = NEW.case_id;

    IF v_case_status IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Integrity Error: Emergency case does not exist';
    ELSEIF v_case_status = 'discharged' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Integrity Error: Cannot allocate a bed to a discharged patient';
    END IF;
END$$


-- ------------------------------------------------------------------------------
-- TRIGGER 2: trg_prevent_completed_transfer_tampering
-- Table:     Transfers
-- Event:     BEFORE UPDATE
-- Purpose:   Ensures audit immutability: once a patient transfer is marked 'completed'
--            or 'cancelled', its terminal status cannot be altered.
-- ------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_prevent_completed_transfer_tampering$$
CREATE TRIGGER trg_prevent_completed_transfer_tampering
BEFORE UPDATE ON Transfers
FOR EACH ROW
BEGIN
    IF OLD.status IN ('completed', 'cancelled') AND NEW.status <> OLD.status THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Security Error: Completed or cancelled transfer records are immutable and cannot be altered';
    END IF;
END$$


-- ------------------------------------------------------------------------------
-- TRIGGER 3: trg_auto_expire_blood_unit
-- Table:     Blood_Units
-- Event:     BEFORE INSERT
-- Purpose:   Prevents expired blood units from being entered as 'in_stock'.
--            Automatically flags units past expiry as 'expired'.
-- ------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_auto_expire_blood_unit$$
CREATE TRIGGER trg_auto_expire_blood_unit
BEFORE INSERT ON Blood_Units
FOR EACH ROW
BEGIN
    IF NEW.expiry_date < CURDATE() AND (NEW.status = 'in_stock' OR NEW.status IS NULL) THEN
        SET NEW.status = 'expired';
    END IF;
END$$


-- ==============================================================================
-- CATEGORY B: STANDALONE AVAILABILITY SYNCHRONIZATION TRIGGERS (REFERENCE ONLY)
-- WARNING: DO NOT ENABLE WHILE FASTAPI BACKEND IS RUNNING.
-- These are intended ONLY if testing the database without the application server.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- TRIGGER 4: trg_ref_bed_availability_sync
-- Table:     Beds
-- Event:     AFTER UPDATE
-- ------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_ref_bed_availability_sync$$
CREATE TRIGGER trg_ref_bed_availability_sync
AFTER UPDATE ON Beds
FOR EACH ROW
BEGIN
    IF OLD.status <> NEW.status THEN
        IF OLD.status = 'available' AND NEW.status <> 'available' THEN
            UPDATE Resource_Availability
            SET available_count = GREATEST(available_count - 1, 0),
                last_updated = CURRENT_TIMESTAMP
            WHERE hospital_id = NEW.hospital_id AND resource_type = 'beds';
        ELSEIF OLD.status <> 'available' AND NEW.status = 'available' THEN
            UPDATE Resource_Availability
            SET available_count = LEAST(available_count + 1, total_count),
                last_updated = CURRENT_TIMESTAMP
            WHERE hospital_id = NEW.hospital_id AND resource_type = 'beds';
        END IF;
    END IF;
END$$

DELIMITER ;


-- ==============================================================================
-- DEMONSTRATION & TESTING GUIDE FOR TEACHER EVALUATION
-- ==============================================================================
-- Test 1 (Should Fail with Error):
-- Attempt allocating bed 1 to a discharged patient:
--   UPDATE Emergency_Cases SET status = 'discharged' WHERE case_id = 999;
--   INSERT INTO bed_alloc (bed_id, case_id) VALUES (1, 999);
--   -> Result: SQLSTATE 45000: Integrity Error: Cannot allocate a bed to a discharged patient
--
-- Test 2 (Should Fail with Error):
-- Attempt reopening an already completed transfer:
--   UPDATE Transfers SET status = 'in_progress' WHERE transfer_id = 1 AND status = 'completed';
--   -> Result: SQLSTATE 45000: Security Error: Completed or cancelled transfer records are immutable
--
-- Test 3 (Auto-correction):
-- Insert blood unit with past expiry date:
--   INSERT INTO Blood_Units (unit_id, hospital_id, blood_group, status, expiry_date)
--   VALUES (9999, 1, 'O+', 'in_stock', '2020-01-01');
--   SELECT status FROM Blood_Units WHERE unit_id = 9999;
--   -> Result: status is automatically saved as 'expired'


-- ==============================================================================
-- SAFE CLEANUP / ROLLBACK SCRIPT
-- ==============================================================================
-- To completely remove all practical triggers:
-- DROP TRIGGER IF EXISTS trg_validate_case_active_for_bed_allocation;
-- DROP TRIGGER IF EXISTS trg_prevent_completed_transfer_tampering;
-- DROP TRIGGER IF EXISTS trg_auto_expire_blood_unit;
-- DROP TRIGGER IF EXISTS trg_ref_bed_availability_sync;

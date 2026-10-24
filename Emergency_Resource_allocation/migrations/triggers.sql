-- ==============================================================================
-- Emergency Resource Allocation System - Reference Database Triggers
-- ==============================================================================
-- IMPORTANT NOTE:
-- In this architecture, application-level transactional synchronization in
-- app/services/resource_tracker.py is the authoritative strategy for maintaining
-- aggregated resource availability counts. This prevents double-counting, allows
-- detailed application audit trail correlation, and supports database portability.
--
-- The triggers below are provided as REFERENCE SQL DEFINITIONS matching the
-- college DBMS report specifications.
-- DO NOT execute these triggers against a live database where application-level
-- synchronization is active, as executing both concurrently will cause duplicate
-- count mutations.
-- ==============================================================================

DELIMITER $$

-- 1. Trigger for Bed Status Changes
DROP TRIGGER IF EXISTS trg_bed_status_update$$
CREATE TRIGGER trg_bed_status_update
AFTER UPDATE ON Beds
FOR EACH ROW
BEGIN
    IF OLD.status <> NEW.status THEN
        -- If bed became occupied/maintenance from available
        IF OLD.status = 'available' AND NEW.status <> 'available' THEN
            UPDATE Resource_Availability
            SET available_count = GREATEST(available_count - 1, 0),
                last_updated = CURRENT_TIMESTAMP
            WHERE hospital_id = NEW.hospital_id AND resource_type = 'beds';
        -- If bed returned to available
        ELSEIF OLD.status <> 'available' AND NEW.status = 'available' THEN
            UPDATE Resource_Availability
            SET available_count = LEAST(available_count + 1, total_count),
                last_updated = CURRENT_TIMESTAMP
            WHERE hospital_id = NEW.hospital_id AND resource_type = 'beds';
        END IF;
    END IF;
END$$

-- 2. Trigger for Ventilator Status Changes
DROP TRIGGER IF EXISTS trg_ventilator_status_update$$
CREATE TRIGGER trg_ventilator_status_update
AFTER UPDATE ON Ventilators
FOR EACH ROW
BEGIN
    IF OLD.status <> NEW.status THEN
        IF OLD.status = 'available' AND NEW.status <> 'available' THEN
            UPDATE Resource_Availability
            SET available_count = GREATEST(available_count - 1, 0),
                last_updated = CURRENT_TIMESTAMP
            WHERE hospital_id = NEW.hospital_id AND resource_type = 'ventilators';
        ELSEIF OLD.status <> 'available' AND NEW.status = 'available' THEN
            UPDATE Resource_Availability
            SET available_count = LEAST(available_count + 1, total_count),
                last_updated = CURRENT_TIMESTAMP
            WHERE hospital_id = NEW.hospital_id AND resource_type = 'ventilators';
        END IF;
    END IF;
END$$

-- 3. Trigger for Ambulance Status Changes
DROP TRIGGER IF EXISTS trg_ambulance_status_update$$
CREATE TRIGGER trg_ambulance_status_update
AFTER UPDATE ON Ambulances
FOR EACH ROW
BEGIN
    IF OLD.status <> NEW.status THEN
        IF OLD.status = 'available' AND NEW.status <> 'available' THEN
            UPDATE Resource_Availability
            SET available_count = GREATEST(available_count - 1, 0),
                last_updated = CURRENT_TIMESTAMP
            WHERE hospital_id = NEW.hospital_id AND resource_type = 'ambulances';
        ELSEIF OLD.status <> 'available' AND NEW.status = 'available' THEN
            UPDATE Resource_Availability
            SET available_count = LEAST(available_count + 1, total_count),
                last_updated = CURRENT_TIMESTAMP
            WHERE hospital_id = NEW.hospital_id AND resource_type = 'ambulances';
        END IF;
    END IF;
END$$

-- 4. Trigger for Blood Unit Issue
DROP TRIGGER IF EXISTS trg_blood_unit_issue$$
CREATE TRIGGER trg_blood_unit_issue
AFTER UPDATE ON Blood_Units
FOR EACH ROW
BEGIN
    IF OLD.status = 'in_stock' AND NEW.status = 'issued' THEN
        UPDATE Resource_Availability
        SET available_count = GREATEST(available_count - 1, 0),
            last_updated = CURRENT_TIMESTAMP
        WHERE hospital_id = NEW.hospital_id AND resource_type IN ('blood_units', 'blood');
    END IF;
END$$

DELIMITER ;

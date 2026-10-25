-- ==============================================================================
-- Emergency Resource Allocation System - Harden Resource_Availability Schema
-- ==============================================================================
-- Target Database: emergency_db
-- Target Table:    Resource_Availability
--
-- PURPOSE:
-- 1. Enable MySQL native AUTO_INCREMENT on availability_id to eliminate race conditions
--    during initial resource category registration.
-- 2. Add UNIQUE constraint on (hospital_id, resource_type) to strictly enforce that
--    each hospital has at most one aggregate cache row per resource type.
--
-- SAFETY & INTEGRITY GUARANTEES:
-- - In-place ALTER operations; does NOT drop or recreate tables.
-- - All existing availability records are preserved.
-- - MySQL automatically sets AUTO_INCREMENT to MAX(availability_id) + 1.
--
-- DEPLOYMENT STATUS:
-- - Prepared as a standalone, reviewable migration script.
-- - UNAPPLIED: Do NOT execute automatically during application startup or test runs.
--   Apply manually only upon administrator review.
-- ==============================================================================

-- 1. Enable AUTO_INCREMENT on availability_id primary key
ALTER TABLE Resource_Availability MODIFY COLUMN availability_id INT NOT NULL AUTO_INCREMENT;

-- 2. Add Unique Constraint on (hospital_id, resource_type) to prevent duplicate aggregate records
ALTER TABLE Resource_Availability ADD CONSTRAINT uq_hospital_resource UNIQUE (hospital_id, resource_type);

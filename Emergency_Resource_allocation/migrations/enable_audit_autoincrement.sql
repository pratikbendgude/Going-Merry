-- ==============================================================================
-- Emergency Resource Allocation System - Enable AUTO_INCREMENT on Audit_Logs
-- ==============================================================================
-- Target Database: emergency_db
-- Target Table:    Audit_Logs
-- Target Column:   log_id (PRIMARY KEY)
--
-- PURPOSE:
-- Resolve concurrent audit-log primary-key generation at the database engine level.
-- MySQL native AUTO_INCREMENT provides atomic, hardware-enforced sequential ID
-- allocation across concurrent transactions, eliminating application-level race
-- conditions and duplicate key collisions (Error 1062).
--
-- PRE-MIGRATION INSPECTION (VERIFIED):
-- - Table schema: PRIMARY KEY (`log_id`), FOREIGN KEY (`hospital_id`) REFERENCES `Hospitals`
-- - Existing rows: 10 records (log_id 1 through 10)
-- - Current MAX(log_id): 10
--
-- SAFETY & INTEGRITY GUARANTEES:
-- - This migration alters the column definition in-place; it does NOT drop the table.
-- - All existing 10 audit records are fully preserved with their original IDs.
-- - The starting AUTO_INCREMENT value is set to 11 (MAX(log_id) + 1), avoiding
--   collisions with existing records and avoiding arbitrary counter jumps.
--
-- DEPLOYMENT STATUS:
-- - Prepared as a standalone, reviewable migration script.
-- - UNAPPLIED: Do NOT execute automatically during application startup or test runs.
--   Apply manually only upon administrator review.
-- ==============================================================================

-- 1. Modify the primary key column to enable MySQL native AUTO_INCREMENT
ALTER TABLE Audit_Logs MODIFY COLUMN log_id INT NOT NULL AUTO_INCREMENT;

-- 2. Explicitly align the auto-increment counter to the next valid sequential ID.
--    Based on verified MAX(log_id) = 10, next safe ID is 11.
ALTER TABLE Audit_Logs AUTO_INCREMENT = 11;

# Emergency Resource Allocation System — DBMS Practicals Guide

This directory contains database practical assets aligned with the university DBMS curriculum (Phases I through IV). All scripts are designed for **MySQL 8.0+** and run against the project database: `emergency_db`.

---

## 1. Directory Structure & Script Purposes

| Script | Curriculum Phase | Primary Purpose | Database Modification |
| :--- | :--- | :--- | :--- |
| [`01_views.sql`](file:///home/noctis/program-codes/Going-Merry/Emergency_Resource_allocation/dbms_practicals/01_views.sql) | **Phase III (Views)** | 4 operational views providing hospital summaries, critical resource availability, live emergency cases, and transfer logistics. | Creates or replaces views only; base tables are untouched. |
| [`02_triggers.sql`](file:///home/noctis/program-codes/Going-Merry/Emergency_Resource_allocation/dbms_practicals/02_triggers.sql) | **Phase III (Triggers)** | Domain-integrity triggers enforcing data consistency (preventing bed allocation to discharged patients, protecting completed transfer records, auto-flagging expired blood). | Adds trigger definitions. Contains rollback statements. |
| [`03_procedures.sql`](file:///home/noctis/program-codes/Going-Merry/Emergency_Resource_allocation/dbms_practicals/03_procedures.sql) | **Phase III (Procedures)** | 3 parameterized stored procedures for hospital capacity reporting, emergency hospital searching by trauma tier, and patient journey tracking. | Creates procedures only. |
| [`04_joins_aggregates_subqueries.sql`](file:///home/noctis/program-codes/Going-Merry/Emergency_Resource_allocation/dbms_practicals/04_joins_aggregates_subqueries.sql) | **Phase II (Queries)** | Demonstration suite covering INNER JOIN, LEFT JOIN, multi-table joins (5 tables), GROUP BY/HAVING, scalar/set/correlated subqueries, and executive reports. | Read-only queries; leaves database completely unchanged. |

---

## 2. Recommended Order for College Teacher Demonstration

To demonstrate your DBMS project systematically to your professor or examiner:

```
Step 1: Relational Schema & Table Inspection (Phase I)
   └── Show table definitions, primary keys, and foreign keys in MySQL CLI.

Step 2: Joins, Aggregates & Subqueries (Phase II)
   └── Run queries from 04_joins_aggregates_subqueries.sql to demonstrate relational queries.

Step 3: Database Views (Phase III - Part A)
   └── Load 01_views.sql, verify with SHOW FULL TABLES, and demonstrate SELECT queries.

Step 4: Stored Procedures (Phase III - Part B)
   └── Load 03_procedures.sql and demonstrate CALL commands with realistic arguments.

Step 5: Database Triggers (Phase III - Part C)
   └── Load Category A triggers from 02_triggers.sql and demonstrate constraint enforcement.

Step 6: Live Full-Stack Application (Phase IV)
   └── Run the FastAPI backend and React frontend to demonstrate the complete software system.
```

---

## 3. How to Run Each Script in MySQL

> [!IMPORTANT]
> Always verify that your active database is `emergency_db` before executing scripts.

### Option A: Using the MySQL Command Line (Recommended)

```bash
# Connect to MySQL and source the scripts:
mysql -u root -p emergency_db

# Inside MySQL prompt:
mysql> source /home/noctis/program-codes/Going-Merry/Emergency_Resource_allocation/dbms_practicals/01_views.sql;
mysql> source /home/noctis/program-codes/Going-Merry/Emergency_Resource_allocation/dbms_practicals/03_procedures.sql;
mysql> source /home/noctis/program-codes/Going-Merry/Emergency_Resource_allocation/dbms_practicals/02_triggers.sql;
mysql> source /home/noctis/program-codes/Going-Merry/Emergency_Resource_allocation/dbms_practicals/04_joins_aggregates_subqueries.sql;
```

### Option B: Running from Bash Terminal

```bash
cd ~/program-codes/Going-Merry/Emergency_Resource_allocation

# Execute views
mysql -u root -p emergency_db < dbms_practicals/01_views.sql

# Execute procedures
mysql -u root -p emergency_db < dbms_practicals/03_procedures.sql

# Execute triggers
mysql -u root -p emergency_db < dbms_practicals/02_triggers.sql

# Run query demonstrations
mysql -u root -p emergency_db < dbms_practicals/04_joins_aggregates_subqueries.sql
```

---

## 4. How to Verify Created Objects

### 1. Verify Views
```sql
SHOW FULL TABLES IN emergency_db WHERE Table_type = 'VIEW';
```
**Expected:** Lists `vw_hospital_resource_overview`, `vw_available_critical_resources`, `vw_active_emergency_patients`, `vw_pending_active_transfers`.

### 2. Verify Stored Procedures
```sql
SHOW PROCEDURE STATUS WHERE Db = 'emergency_db';
```
**Expected:** Lists `sp_hospital_resource_report`, `sp_find_suitable_hospitals`, `sp_emergency_case_journey`.

### 3. Verify Triggers
```sql
SHOW TRIGGERS FROM emergency_db;
```
**Expected:** Lists `trg_validate_case_active_for_bed_allocation`, `trg_prevent_completed_transfer_tampering`, `trg_auto_expire_blood_unit`.

---

## 5. Step-by-Step Teacher Demonstration Guide

### Demonstration A: Views
```sql
-- 1. Hospital Resource Overview (shows total & available capacity)
SELECT * FROM vw_hospital_resource_overview;

-- 2. Available Critical Resources (shows immediate beds and ventilators ready for dispatch)
SELECT * FROM vw_available_critical_resources WHERE city = 'Mumbai';

-- 3. Active Emergency Cases (shows patient triage and current bed/ventilator assignment)
SELECT case_id, patient_name, triage_level, hospital_name, assigned_bed_type 
FROM vw_active_emergency_patients;

-- 4. Active Transfers (shows in-transit patient transfers with assigned ambulances)
SELECT transfer_id, patient_name, from_hospital_name, to_hospital_name, transfer_status 
FROM vw_pending_active_transfers;
```

### Demonstration B: Stored Procedures
```sql
-- 1. Multi-Section Facility Resource Dashboard for Hospital #1
CALL sp_hospital_resource_report(1);

-- 2. Emergency Triage Search: Find Hospitals with Available ICU Beds and Trauma Level <= 2
CALL sp_find_suitable_hospitals('Mumbai', 2, 'icu_beds');

-- 3. Search all hospitals across any city with available Ventilators
CALL sp_find_suitable_hospitals(NULL, NULL, 'ventilators');

-- 4. 360-Degree Patient Journey & Allocation Trace for Case #1
CALL sp_emergency_case_journey(1);
```

### Demonstration C: Triggers (Integrity Enforcement)
```sql
-- Test 1: Trigger blocks allocating a bed to a discharged patient
-- (Demonstrates database-level business rule enforcement)
INSERT INTO Emergency_Cases (case_id, hospital_id, patient_name, triage_level, status)
VALUES (9999, 1, 'Test Discharged Patient', 'green', 'discharged');

INSERT INTO bed_alloc (bed_id, case_id) VALUES (1, 9999);
-- EXPECTED ERROR:
-- ERROR 1644 (45000): Integrity Error: Cannot allocate a bed to a discharged patient

-- Cleanup test patient:
DELETE FROM Emergency_Cases WHERE case_id = 9999;

-- Test 2: Trigger protects completed transfer records from tampering
UPDATE Transfers SET status = 'in_progress' WHERE transfer_id = 1 AND status = 'completed';
-- EXPECTED ERROR:
-- ERROR 1644 (45000): Security Error: Completed or cancelled transfer records are immutable
```

---

## 6. How to Safely Roll Back Practical Objects

All practical objects can be removed cleanly without deleting or altering any base tables or existing application data:

```sql
USE emergency_db;

-- 1. Remove Views
DROP VIEW IF EXISTS vw_pending_active_transfers;
DROP VIEW IF EXISTS vw_active_emergency_patients;
DROP VIEW IF EXISTS vw_available_critical_resources;
DROP VIEW IF EXISTS vw_hospital_resource_overview;

-- 2. Remove Procedures
DROP PROCEDURE IF EXISTS sp_hospital_resource_report;
DROP PROCEDURE IF EXISTS sp_find_suitable_hospitals;
DROP PROCEDURE IF EXISTS sp_emergency_case_journey;

-- 3. Remove Triggers
DROP TRIGGER IF EXISTS trg_validate_case_active_for_bed_allocation;
DROP TRIGGER IF EXISTS trg_prevent_completed_transfer_tampering;
DROP TRIGGER IF EXISTS trg_auto_expire_blood_unit;
DROP TRIGGER IF EXISTS trg_ref_bed_availability_sync;
```

---

## 7. Critical Architectural Note: Triggers vs. Application Logic

> [!WARNING]
> In this production architecture, the FastAPI backend (`app/services/resource_tracker.py`) synchronizes `Resource_Availability` counts in real-time as part of ACID transactions.
>
> If you activate database triggers that perform count updates (e.g., `AFTER UPDATE ON Beds SET available_count = available_count - 1`), both the backend and database will execute the decrement, causing **double-counting**.
>
> **Best Practice for Evaluation:**
> - Present **Category A Triggers** (`02_triggers.sql`) as the primary database triggers, explaining that the database layer is responsible for declarative invariants and data integrity.
> - Explain that aggregated cache synchronization is kept in the application service layer to guarantee transactional audit trails and prevent duplicate mutations.

---

## 8. Known Limitations & Technical Notes

1. **Composite Primary Key Timestamp Precision:**
   - Tables `bed_alloc`, `vent_alloc`, and `dispatched` use composite primary keys containing a MySQL `timestamp` column (`allocated_at` / `dispatched_at`) with 0 fractional second precision.
   - The application enforces `utcnow_second()` and `@validates` hooks to prevent microsecond mismatch errors during `db.refresh()`.
   - **Remaining limitation:** If the exact same resource/case pair is allocated twice within the same second, a duplicate key collision will occur. In a future production iteration, introducing a surrogate primary key (e.g. `allocation_id INT AUTO_INCREMENT`) is recommended.

2. **Schema Hardening Migrations (Unapplied):**
   - [`migrations/enable_audit_autoincrement.sql`](file:///home/noctis/program-codes/Going-Merry/Emergency_Resource_allocation/migrations/enable_audit_autoincrement.sql): Prepared script to enable native `AUTO_INCREMENT` on `Audit_Logs.log_id`.
   - [`migrations/enable_resource_availability_hardening.sql`](file:///home/noctis/program-codes/Going-Merry/Emergency_Resource_allocation/migrations/enable_resource_availability_hardening.sql): Prepared script to add `AUTO_INCREMENT` and `UNIQUE(hospital_id, resource_type)` on `Resource_Availability`.
   - Both migrations are prepared for administrator review and must **not** be executed automatically without explicit approval.

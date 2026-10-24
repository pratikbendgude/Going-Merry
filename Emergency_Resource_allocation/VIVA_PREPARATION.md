# Viva Examination Defense Guide: Emergency Resource Allocation System

This guide is designed to help you thoroughly understand and defend your project during your college viva examination. Every explanation references the **actual codebase** and real file paths so you can speak with confidence and technical authority.

---

## 1. Project Background & Problem Statement

### The Problem
During multi-casualty incidents, epidemics, or city-wide emergency surges, hospitals often experience a "mismatch of scarcity." One hospital's emergency room might be completely overwhelmed with zero available ICU beds or ventilators, while another facility only 15 minutes away has idle equipment. Because facilities typically operate using independent, isolated systems (or manual phone calls), critical time is lost, leading to delayed medical interventions.

### Project Objective
The **Emergency Resource Allocation System** provides a centralized, real-time command operations platform that:
1. Aggregates live capacity across multiple networked hospitals (Beds, Ventilators, Ambulances, and Blood Bank units).
2. Triage-categorizes incoming patients based on severity (Red/Critical, Yellow/Urgent, Green/Stable).
3. Safely and transactionally allocates resources without allowing double-booking, race conditions, or negative inventory.
4. Coordinates patient transfers between hospitals (`requested` $\to$ `in_progress` $\to$ `completed` / `cancelled`) linking ambulance dispatch and destination hospital admission.
5. Manages blood unit issuance with expiration validation and patient case linkage.
6. Maintains a comprehensive, transaction-safe audit log (`Audit_Logs`) across all operational mutations.

---

## 2. System Architecture & End-to-End Request Flow

The system follows a classic **3-Tier Decoupled Client-Server Architecture**:

```
+-----------------------------------------------------------------------------------+
|                                 PRESENTATION TIER                                 |
|  React 19 + TypeScript (Vite Single Page Application)                             |
|  - UI Pages: Dashboard, Hospitals, Resources, EmergencyCases, Allocations,        |
|              Transfers                                                            |
|  - Server State: TanStack React Query (caching, auto-refresh, cache invalidation) |
|  - API Client: frontend/src/lib/api.ts                                            |
+------------------------------------------+----------------------------------------+
                                           | HTTP JSON Requests (fetchAPI)
                                           | via Vite Proxy or Port 8000
                                           v
+-----------------------------------------------------------------------------------+
|                                   APPLICATION TIER                                |
|  FastAPI Framework (Python 3.10+)                                                 |
|  - main.py (CORS, router inclusion at / and /api)                                 |
|  - Routers: dashboard.py, hospitals.py, resources.py, emergency_cases.py,         |
|             allocations.py, transfers.py                                          |
|  - Services: resource_tracker.py (count sync), audit.py (audit logging)           |
|  - Pydantic Validation: schemas.py (Data type validation, regex pattern matching) |
|  - Dependency Injection: database.py -> get_db() provides isolated SessionLocal   |
+------------------------------------------+----------------------------------------+
                                           | Python Objects & Row Locks
                                           | SQLAlchemy 2.0 ORM (PyMySQL Driver)
                                           v
+-----------------------------------------------------------------------------------+
|                                     DATA TIER                                     |
|  MySQL Relational Database (`emergency_db`)                                       |
|  - Storage Engine: InnoDB (supports ACID transactions & row-level locking)        |
|  - Tables: Hospitals, Beds, Ventilators, Ambulances, Blood_Units,                 |
|            Emergency_Cases, bed_alloc, vent_alloc, dispatched, Transfers,         |
|            Resource_Availability, Audit_Logs                                      |
+-----------------------------------------------------------------------------------+
```

---

## 3. Technology Stack: Purpose & Justification

| Technology | Role | Why We Chose It Instead of Alternatives |
|---|---|---|
| **FastAPI** | Backend API Framework | Much faster than Django or Flask; uses modern Python async features; automatically generates interactive Swagger documentation at `/docs`; built-in dependency injection for database sessions. |
| **Pydantic** | Validation & Serialization | Ensures strict data contracts. If a client sends an invalid triage level or hospital ID, Pydantic immediately returns a structured 422 error before running database queries. |
| **SQLAlchemy** | Object Relational Mapper (ORM) | Allows us to write clean Python objects (`Hospital`, `Bed`, `EmergencyCase`, `Transfer`) instead of raw SQL strings. Crucially, it supports `with_for_update()` to enforce row-level locking. |
| **MySQL (InnoDB)** | Relational Database | We chose relational storage over MongoDB because hospital resource allocation requires strict ACID transactions, foreign key constraints, and relational junctions (`bed_alloc`, `vent_alloc`). InnoDB provides row-level locking. |
| **React 19** | Frontend Framework | Component-based UI architecture. Enables clean separation between visual components (Header, Cards, Tables, Forms) and state. |
| **TypeScript** | Type-Safe Language | Catches bugs at compile time. Ensures frontend data structures strictly match backend Pydantic schemas. |
| **TanStack React Query** | Server-State Management | Manages server caching, automatic polling every 15s for live operations, and immediate cache invalidation upon mutations. |
| **Vite** | Frontend Build Tool | Instant dev server start, Hot Module Replacement (HMR), and fast Rollup production bundling (<300ms). |

---

## 4. Database Schema, Keys, and Relationships

The database `emergency_db` has 12 tables:
1. **`Hospitals`**: Primary facility registry (`hospital_id` PK, `name`, `city`, `location`, `contact_no`, `trauma_level`).
2. **`Beds`**: Individual physical beds (`bed_id` PK, `hospital_id` FK, `bed_type` ['icu', 'general'], `status` ['available', 'occupied']).
3. **`Ventilators`**: Mechanical life support units (`ventilator_id` PK, `hospital_id` FK, `status` ['available', 'in_use', 'maintenance']).
4. **`Ambulances`**: Emergency vehicles (`ambulance_id` PK, `hospital_id` FK, `vehicle_no` UNIQUE, `status` ['available', 'dispatched', 'returning', 'on_duty']).
5. **`Blood_Units`**: Blood bank inventory (`unit_id` PK, `hospital_id` FK, `blood_group`, `expiry_date`, `status` ['in_stock', 'issued', 'expired'], `case_id` FK, `issued_at`).
6. **`Emergency_Cases`**: Patient admissions (`case_id` PK, `hospital_id` FK, `patient_name`, `triage_level` ['red', 'yellow', 'green'], `status` ['open', 'admitted', 'discharged', 'transfer_pending']).
7. **`bed_alloc`**: Junction tracking bed assignments (`bed_id` PK/FK, `case_id` PK/FK, `allocated_at` PK, `released_at`).
8. **`vent_alloc`**: Junction tracking ventilator assignments (`ventilator_id` PK/FK, `case_id` PK/FK, `allocated_at` PK, `released_at`).
9. **`dispatched`**: Junction tracking ambulance dispatches (`ambulance_id` PK/FK, `case_id` PK/FK, `dispatched_at` PK, `arrived_at`).
10. **`Transfers`**: Inter-hospital patient transfer logs (`transfer_id` PK, `from_hospital_id` FK, `to_hospital_id` FK, `case_id` FK, `ambulance_id` FK, `status` ['requested', 'in_transit', 'in_progress', 'completed', 'cancelled'], `requested_at`, `completed_at`).
11. **`Resource_Availability`**: Aggregated facility capacity snapshot table (`availability_id` PK, `hospital_id` FK, `resource_type`, `total_count`, `available_count`, `last_updated`).
12. **`Audit_Logs`**: Mutation audit trail (`log_id` PK, `hospital_id` FK, `table_name`, `record_id`, `change_type`, `changed_at`).

---

## 5. Transfer Lifecycle Architecture (`app/routers/transfers.py`)

Inter-hospital transfers follow a strict transactional state machine:

```
[Requested]
   |
   |---> (start_transfer) ---> [In Progress]
   |                               |
   |                               |---> (complete_transfer) ---> [Completed]
   |                               |
   |---> (cancel_transfer) <-------|---> (cancel_transfer) -----> [Cancelled]
```

### Steps in Transfer Execution:
1. **Creation (`POST /transfers`):**
   * Validates `from_hospital_id != to_hospital_id`.
   * Verifies source hospital, destination hospital, and patient case exist.
   * If an ambulance is assigned, verifies it is `available` and not assigned to conflicting active dispatches/transfers.
   * Sets `case.status = 'transfer_pending'`.
   * Enlists audit log (`INSERT` into `Transfers`).
2. **Start (`POST /transfers/{id}/start`):**
   * Validates transition from `requested` $\to$ `in_progress`.
   * If an ambulance is assigned, marks ambulance `status = 'dispatched'`, updates availability counts, and logs audit record.
3. **Completion (`POST /transfers/{id}/complete`):**
   * Sets `status = 'completed'` and `completed_at = datetime.utcnow()`.
   * Updates patient `case.hospital_id = transfer.to_hospital_id` and `case.status = 'admitted'`.
   * Releases origin bed or ventilator allocations so the source hospital's equipment returns to `available`.
   * Returns assigned ambulance to `available` status and updates vehicle availability.
   * Enlists audit logs for transfer, case, bed/ventilator, and ambulance mutations.
4. **Cancellation (`POST /transfers/{id}/cancel`):**
   * Reverts `case.status` back to `open` (if it was `transfer_pending`).
   * Returns dispatched ambulance back to `available`.

---

## 6. Resource Availability Synchronization vs. Database Triggers

### Authoritative Strategy: Application-Level Service (`app/services/resource_tracker.py`)
* The application calculates live availability counts directly from underlying entity tables within the same transaction as allocations and releases.
* **Clamping:** Enforces `0 <= available_count <= total_count` to ensure compliance with database check constraints (`Resource_Availability_chk_1`).
* **Concurrency:** Uses `.with_for_update()` row locking on `Resource_Availability` records.
* **Transactional Integrity:** If an allocation or release is rolled back, count modifications are rolled back atomically.

### Why Triggers are Not Active Simultaneously (`migrations/triggers.sql`):
* A complete, non-destructive trigger script is provided in `migrations/triggers.sql` for report alignment reference.
* If both application-level synchronization and database triggers execute at the same time, count mutations would occur twice (e.g. decrementing by 2 instead of 1). The application service is chosen as the authoritative mechanism to ensure cross-database portability and atomic rollbacks.

---

## 7. Blood Unit Issuing Workflow (`app/routers/resources.py`)

Endpoint: `POST /resources/blood-units/{unit_id}/issue`
* **Validation Rules:**
  1. Verifies the blood unit exists and is currently `status == 'in_stock'`.
  2. Verifies the patient case exists in `Emergency_Cases`.
  3. Checks `unit.expiry_date >= date.today()`. If expired, the unit is automatically updated to `status = 'expired'` and the request is rejected with HTTP 400.
  4. Row-locks the blood unit with `.with_for_update()` to prevent concurrent double-issuance.
* **Mutations:**
  * Sets `status = 'issued'`, `case_id = request.case_id`, and `issued_at = datetime.utcnow()`.
  * Calls `sync_resource_availability(db, unit.hospital_id, 'blood_units')`.
  * Writes audit entry to `Audit_Logs`.

---

## 8. Concurrency & Double-Booking Prevention

### The Race Condition Problem
Imagine two coordinators simultaneously trying to allocate the last remaining ICU Bed (#101) to two different critical patients at the exact same millisecond. In a naive system without locking, both requests check the database, see `status == 'available'`, and both assign Bed #101. Now one bed has been promised to two patients.

### How Our Code Solves It
In `app/routers/allocations.py`, we use **Pessimistic Concurrency Control** via SQLAlchemy's `.with_for_update()`:

```python
# app/routers/allocations.py
bed = db.query(Bed).filter(Bed.bed_id == allocation.bed_id).with_for_update().first()
if not bed:
    raise HTTPException(status_code=404, detail="Bed not found")

if bed.status != "available":
    raise HTTPException(
        status_code=400,
        detail=f"Bed is not available. Current status: {bed.status}"
    )
```

### Under the Hood in MySQL:
1. When Request A executes `with_for_update()`, MySQL's InnoDB engine places an **Exclusive Row Lock (X-Lock)** on the record for `bed_id = 101`.
2. When Request B arrives a microsecond later, MySQL pauses Request B until Request A's transaction finishes.
3. Request A updates `bed.status = "occupied"` and executes `db.commit()`.
4. Request A's lock is released. Request B resumes and reads the updated row.
5. Request B inspects `bed.status`, sees it is now `"occupied"`, and receives an **HTTP 400 Bad Request**.
6. Result: **Zero possibility of double booking.**

---

## 9. Error Handling & Testing Strategy

### Database Safety
* **Never Drop or Truncate:** College database `emergency_db` is preserved untouched.
* **Isolated Testing:** Tests in `tests/test_allocations_isolated.py` and `tests/test_transfers_and_services_isolated.py` run against an **in-memory SQLite database** (`sqlite:///:memory:`).
* **20 Unit Tests:** Validate bed/ventilator allocations, double-booking prevention, transfer progression, blood expiration, availability synchronization, and audit logging rollbacks in 0.23s.

---

## 10. Frequently Asked Questions (Viva Q&A)

### Standard Questions

**Q1: What is the main objective of this project?**
> **Answer:** To provide a real-time, transaction-safe operations platform connecting networked hospitals, managing critical inventory (ICU beds, ventilators, fleet, blood bank), coordinating patient transfers, and preventing double-booking through database-level row locking.

**Q2: What happens during an inter-hospital patient transfer?**
> **Answer:** In `app/routers/transfers.py`, a transfer progresses from `requested` to `in_progress` (dispatching an ambulance) to `completed`. Upon completion, the patient's record is moved to the receiving hospital, the ambulance is freed back to `available`, and any beds or ventilators reserved at the source hospital are released back to available inventory.

**Q3: How do you prevent expired blood units from being issued?**
> **Answer:** In `app/routers/resources.py` (`issue_blood_unit`), the backend checks `unit.expiry_date < date.today()`. If expired, the unit's status is updated to `'expired'`, resource counts are adjusted, and an HTTP 400 error is returned, preventing the unit from being administered.

**Q4: How does the application maintain `Resource_Availability` counts?**
> **Answer:** Using `app/services/resource_tracker.py`. Whenever a resource is created, allocated, released, dispatched, or issued, `sync_resource_availability()` counts actual records in the active transaction and updates `Resource_Availability`, enforcing `0 <= available_count <= total_count`.

**Q5: What is the role of `Audit_Logs`?**
> **Answer:** `app/services/audit.py` records every create, update, and delete event across hospitals, patients, equipment allocations, and transfers. Crucially, audit entries are enlisted in the same database transaction as the operation; if the operation fails and rolls back, phantom audit entries are never written.

---

### Challenging Questions for High Marks

**Q6: Why are database triggers kept in `migrations/triggers.sql` instead of active in MySQL alongside the Python code?**
> **Answer:** To prevent duplicate count mutations. If both application logic (`resource_tracker.py`) and database triggers execute on an update, available counts would be decremented twice. We maintain application-level synchronization as the authoritative strategy for atomic transaction rollback and cross-database portability.

**Q7: Does in-memory SQLite testing prove MySQL concurrency locking?**
> **Answer:** SQLite in-memory tests prove state transition correctness, boundary validation, and rollback semantics. However, SQLite uses database/table-level locks rather than InnoDB row-level locking. For multi-client concurrency verification on MySQL, testing should be conducted using concurrent load tools (such as Locust or wrk) against a dedicated MySQL staging environment.

**Q8: Why does the system handle primary keys without MySQL AUTO_INCREMENT?**
> **Answer:** Inspection of `emergency_db` revealed that tables such as `Transfers`, `Resource_Availability`, and `Audit_Logs` were created with integer primary keys without the `AUTO_INCREMENT` attribute. To ensure runtime safety without altering the live database schema, our code safely computes `next_id = coalesce(max(id), 0) + 1` within transactions.

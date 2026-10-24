# Emergency Resource Allocation System

An enterprise-grade, transaction-safe hospital emergency management platform designed for real-time tracking, facility coordination, patient triage, and critical resource allocation across interconnected healthcare facilities.

---

## 1. Project Overview & Objectives

In mass casualty incidents, epidemic surges, or urban multi-hospital emergencies, coordination failure is the leading cause of preventable patient mortality. Individual hospitals operate with fragmented data silos, leading to severe resource imbalances—where one facility exhausts its ICU beds and ventilators while an adjacent facility retains idle capacity.

### Key Objectives
* **Unified Command Center:** Provide a single source of truth aggregating real-time metrics across all registered hospital networks.
* **Transaction-Safe Resource Allocation:** Prevent double-booking and negative inventory counts using database-level row locking (`SELECT ... FOR UPDATE`).
* **Inter-Hospital Patient Transfers:** Complete transfer lifecycle coordination (`requested` $\to$ `in_progress` $\to$ `completed` / `cancelled`) linking ambulances, patient records, and origin/destination hospital resources.
* **Dynamic Patient Triage:** Standardize clinical triage (Red/Critical, Yellow/Urgent, Green/Stable) and match patient severity to available trauma care levels.
* **Blood Bank Unit Issuance:** Inventory tracking and patient allocation with automatic expiration validation and inventory synchronization.
* **Centralized Audit Trail:** Reusable transactional mutation logging (`Audit_Logs`) across all clinical, resource, and transfer events.
* **Robust Emergency Ops Aesthetic:** Clean, high-contrast, distraction-free interface built to professional operational engineering standards.

---

## 2. Technology Stack & Architectural Decisions

| Layer | Technology | Version | Justification |
|---|---|---|---|
| **Backend Framework** | **FastAPI** | 0.142.2 | High throughput async performance, automatic OpenAPI/Swagger documentation generation, native dependency injection (`get_db`), and robust request lifecycle handling. |
| **Data Validation** | **Pydantic** | 2.13.5 | Compile-time and runtime data parsing, regex pattern enforcement, type coercion, and schema serialization with zero boilerplate. |
| **Object Relational Mapper** | **SQLAlchemy** | 2.1.3 | Declarative database abstraction, transactional session management, complex aggregations, and support for row-level concurrency locks (`with_for_update()`). |
| **Database Engine** | **MySQL (InnoDB)** | 8.0+ | ACID-compliant relational storage supporting foreign keys, transactional integrity, and row-level locking for the existing `emergency_db`. |
| **Frontend Framework** | **React** | 19.2.8 | Declarative component model, virtual DOM diffing, and predictable state management. |
| **Language** | **TypeScript** | 6.0.2 | End-to-end type safety between backend schemas and frontend interfaces, eliminating runtime type errors. |
| **Build Tooling** | **Vite** | 8.3.4 | Instant Cold Server Start, Hot Module Replacement (HMR), optimized Rollup production bundling, and built-in proxy forwarding. |
| **Server State Management** | **TanStack React Query** | 5.104.1 | Automated background refetching, query caching, optimistic UI updates, and intelligent cross-component cache invalidation. |
| **Icons & UI** | **Lucide React** | 1.55.0 | Lightweight, consistent SVG icon set for emergency operations status signaling. |

---

## 3. Project Folder Structure

```
Emergency_Resource_allocation/
├── app/
│   ├── __init__.py
│   ├── database.py              # MySQL engine configuration, SessionLocal, get_db generator
│   ├── main.py                  # FastAPI application, CORS middleware, router registration
│   ├── models.py                # SQLAlchemy ORM declarative models (all 12 tables)
│   ├── schemas.py               # Pydantic validation models & response schemas
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── dashboard.py         # Real-time aggregated telemetry metrics
│   │   ├── hospitals.py         # Hospital CRUD & resource capacity queries
│   │   ├── resources.py         # Beds, ventilators, ambulances & blood units (with issue workflow)
│   │   ├── emergency_cases.py   # Patient intake, triage status, and clinical management
│   │   ├── allocations.py       # Concurrency-safe allocation & release engine
│   │   └── transfers.py         # Complete inter-hospital transfer lifecycle engine
│   └── services/
│       ├── __init__.py
│       ├── resource_tracker.py  # Centralized Resource_Availability synchronization
│       └── audit.py             # Transactional Audit_Logs recorder
├── frontend/
│   ├── src/
│   │   ├── main.tsx             # React 19 root entry point
│   │   ├── App.tsx              # Router configuration & QueryClientProvider setup
│   │   ├── App.css              # Custom Emergency Operations Design System
│   │   ├── components/
│   │   │   └── Header.tsx       # Live status header & responsive navigation
│   │   ├── lib/
│   │   │   ├── api.ts           # Centralized typed API client
│   │   │   └── simpleApi.ts     # Backward-compatible API re-export
│   │   └── pages/
│   │       ├── Dashboard.tsx    # Live command center metrics & critical alert banner
│   │       ├── Hospitals.tsx    # Hospital directory, trauma levels, CRUD modal
│   │       ├── Resources.tsx    # Tabbed inventory + Blood Unit patient issuance modal
│   │       ├── EmergencyCases.tsx # Patient triage intake & status management
│   │       ├── Allocations.tsx  # Concurrency-safe allocation engine & active releases
│   │       └── Transfers.tsx    # Patient transfer request, progression & completion interface
│   ├── package.json             # Frontend dependencies & build scripts
│   ├── tsconfig.json            # TypeScript compiler configuration
│   └── vite.config.ts           # Vite dev server & /api backend proxy config
├── migrations/
│   └── triggers.sql             # Reference SQL triggers (documentation only, not auto-executed)
├── tests/
│   ├── test_allocations_isolated.py          # Isolated tests for beds, vents, ambulances
│   └── test_transfers_and_services_isolated.py # Isolated tests for transfers, blood, audit & sync
├── .env                         # Database connection credentials (keep secure)
├── requirements.txt             # Python dependencies
├── VIVA_PREPARATION.md          # Comprehensive Viva examination defense guide
└── README.md                    # Project submission documentation
```

---

## 4. Database Schema & Table Relationships

The application connects to the existing MySQL database named **`emergency_db`**.

```
                           +----------------------+
                           |      Hospitals       |
                           +----------------------+
                           | PK hospital_id       |
                           |    name, city, etc.  |
                           +----------+-----------+
                                      | 1
               +----------------------+----------------------+----------------------+
               | 1:N                  | 1:N                  | 1:N                  | 1:N
        +------+------+        +------+------+        +------+------+        +------+------+
        |    Beds     |        | Ventilators |        |  Ambulances  |        | Blood_Units  |
        +-------------+        +-------------+        +-------------+        +-------------+
        | PK bed_id   |        | PK vent_id  |        | PK amb_id   |        | PK unit_id  |
        | FK hosp_id  |        | FK hosp_id  |        | FK hosp_id  |        | FK hosp_id  |
        |    status   |        |    status   |        |    status   |        |    status   |
        +------+------+        +------+------+        +------+------+        | FK case_id  |
               | 1                    | 1                    | 1             |    issued_at|
               | 1:N                  | 1:N                  | 1:N           +-------------+
        +------+------+        +------+------+        +------+------+
        |  bed_alloc  |        |  vent_alloc |        |  dispatched |
        +-------------+        +-------------+        +-------------+
        | PK,FK bed_id|        | PK,FK vent_id|       | PK,FK amb_id|
        | PK,FK case_id|       | PK,FK case_id|       | PK,FK case_id|
        | PK alloc_at |        | PK alloc_at |        | PK disp_at  |
        |    rel_at   |        |    rel_at   |        |    arriv_at |
        +------+------+        +------+------+        +------+------+
               | N:1                  | N:1                  | N:1
               +----------------------+----------------------+
                                      |
                           +----------+-----------+
                           |   Emergency_Cases    |
                           +----------------------+
                           | PK case_id           |
                           | FK hospital_id       |
                           |    patient_name      |
                           |    triage_level      |
                           |    status            |
                           +----------+-----------+
                                      | 1
                                      | 1:N
                           +----------+-----------+
                           |      Transfers       |
                           +----------------------+
                           | PK transfer_id       |
                           | FK from_hospital_id  |
                           | FK to_hospital_id    |
                           | FK case_id           |
                           | FK ambulance_id (opt)|
                           |    status            |
                           |    requested_at      |
                           |    completed_at      |
                           +----------------------+
```

### Table Reference
1. **`Hospitals`**: Primary facility registry (`hospital_id` PK, `name`, `city`, `location`, `contact_no`, `trauma_level`).
2. **`Beds`**: Individual tracked beds (`bed_id` PK, `hospital_id` FK, `bed_type` ['icu', 'general'], `status` ['available', 'occupied']).
3. **`Ventilators`**: Mechanical life support units (`ventilator_id` PK, `hospital_id` FK, `status` ['available', 'in_use', 'maintenance']).
4. **`Ambulances`**: Emergency response vehicles (`ambulance_id` PK, `hospital_id` FK, `vehicle_no` UNIQUE, `status` ['available', 'dispatched', 'returning', 'on_duty']).
5. **`Blood_Units`**: Blood bank inventory (`unit_id` PK, `hospital_id` FK, `blood_group` ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'], `expiry_date`, `status` ['in_stock', 'issued', 'expired'], `case_id` FK nullable, `issued_at` nullable).
6. **`Emergency_Cases`**: Patient emergency admissions (`case_id` PK, `hospital_id` FK, `patient_name`, `triage_level` ['red', 'yellow', 'green'], `status` ['open', 'admitted', 'discharged', 'transfer_pending']).
7. **`bed_alloc`**: Junction tracking bed assignments (`bed_id` PK/FK, `case_id` PK/FK, `allocated_at` PK, `released_at` nullable).
8. **`vent_alloc`**: Junction tracking ventilator assignments (`ventilator_id` PK/FK, `case_id` PK/FK, `allocated_at` PK, `released_at` nullable).
9. **`dispatched`**: Junction tracking ambulance dispatches (`ambulance_id` PK/FK, `case_id` PK/FK, `dispatched_at` PK, `arrived_at` nullable).
10. **`Transfers`**: Inter-hospital patient transfer logs (`transfer_id` PK, `from_hospital_id` FK, `to_hospital_id` FK, `case_id` FK, `ambulance_id` FK, `status` ['requested', 'in_transit', 'in_progress', 'completed', 'cancelled'], `requested_at`, `completed_at`).
11. **`Resource_Availability`**: Aggregated facility capacity snapshot table (`availability_id` PK, `hospital_id` FK, `resource_type`, `total_count`, `available_count`, `last_updated`).
12. **`Audit_Logs`**: Administrative mutation audit trail (`log_id` PK, `hospital_id` FK, `table_name`, `record_id`, `change_type`, `changed_at`).

> [!CAUTION]
> The database `emergency_db` contains college test records. **Never drop, reset, truncate, or recreate this database.**

---

## 5. Resource Availability Synchronization & Triggers Strategy

### Authoritative Strategy: Application-Level Service (`app/services/resource_tracker.py`)
In this implementation, **application-level transactional synchronization** is the authoritative strategy for maintaining `Resource_Availability`:
* **Single Source of Truth:** Counts are computed inside the active SQLAlchemy transaction directly from underlying entity tables (`Beds`, `Ventilators`, `Ambulances`, `Blood_Units`).
* **Check Constraint Guarantee:** Enforces `0 <= available_count <= total_count` before committing to satisfy the database check constraint `Resource_Availability_chk_1`.
* **Rollback Safety:** If any allocation, transfer, or release fails, the transaction rolls back, automatically undoing the count changes.
* **Concurrency Protection:** Row locking via `with_for_update()` prevents race conditions during concurrent count mutations.

### Reference Database Triggers (`migrations/triggers.sql`)
The college DBMS report outlines database triggers for maintaining inventory totals. A complete, non-destructive SQL reference script is provided in `migrations/triggers.sql`.
* **Why Triggers are Not Active Simultaneously:** Maintaining the same counts in both application code and database triggers leads to double-decrementing / double-incrementing.
* **Deployment Notice:** If an administrator wishes to migrate to pure database triggers in the future, application-level count calls in `resource_tracker.py` must be disabled first.

---

## 6. Audit Logging (`app/services/audit.py`)

All state-mutating operations record an audit trail in `Audit_Logs`:
* **Tracked Entities:** `Hospitals`, `Emergency_Cases`, `Beds`, `Ventilators`, `Ambulances`, `Blood_Units`, `Transfers`, `bed_alloc`, `vent_alloc`, and `dispatched`.
* **Change Types:** `INSERT`, `UPDATE`, `DELETE`.
* **Transactional Enlistment:** The helper `log_audit()` enlists entries directly in the caller's active database session. If an operation fails and rolls back, phantom audit entries are never persisted.
* **Key Safety:** Accommodates schemas without `AUTO_INCREMENT` by computing next `log_id` safely.

---

## 7. Installation & Startup Instructions

### Prerequisites
* Python 3.10+ (tested on Python 3.14)
* Node.js 18+ & npm
* MySQL Server running on port 3306 with database `emergency_db`

### Step 1: Backend Setup
From the repository root:
```bash
# 1. Activate Python virtual environment
source .venv/bin/activate

# 2. Install dependencies (if not already installed)
pip install -r requirements.txt

# 3. Start the FastAPI application with auto-reload
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
* Backend URL: `http://127.0.0.1:8000`
* Interactive OpenAPI Documentation (Swagger UI): `http://127.0.0.1:8000/docs`
* ReDoc Documentation: `http://127.0.0.1:8000/redoc`

### Step 2: Frontend Setup
In a new terminal:
```bash
cd frontend

# 1. Install frontend dependencies
npm install

# 2. Start Vite development server
npm run dev
```
* Frontend application: `http://localhost:5173`
* Vite automatically proxies `/api` calls to `http://localhost:8000`.

### Step 3: Production Frontend Build Verification
```bash
cd frontend
npm run build
```
Builds production assets into `frontend/dist/` in under 300ms with 0 errors.

---

## 8. Running Tests (Database-Safe)

To preserve the real database `emergency_db`, all test suites run against an **isolated in-memory SQLite database**.

### Run Complete Unit Test Suite:
```bash
.venv/bin/python -m unittest discover -s tests -p "*.py"
```
**Results:** `Ran 20 tests in 0.23s - OK`

### Verified Test Cases:
1. **Allocations & Double Booking Prevention (`tests/test_allocations_isolated.py` - 8 tests):**
   * `test_allocate_available_bed_success`: Allocates bed and transitions status to `occupied`.
   * `test_allocate_unavailable_bed_rejected`: Rejects booking of occupied bed (HTTP 400).
   * `test_allocate_second_bed_to_same_case_rejected`: Rejects concurrent second bed assignment to one patient (HTTP 400).
   * `test_release_bed_restores_availability`: Releases bed allocation and marks status `available`.
   * `test_allocate_unavailable_ventilator_rejected`: Rejects allocation of in-use ventilator (HTTP 400).
   * `test_allocate_available_ventilator_and_release`: Assigns and releases ventilator.
   * `test_dispatch_unavailable_ambulance_rejected`: Rejects dispatch of dispatched ambulance (HTTP 400).
   * `test_dispatch_available_ambulance_and_arrive`: Dispatches vehicle and processes arrival.
2. **Transfers, Blood Issuance, Sync & Audit (`tests/test_transfers_and_services_isolated.py` - 12 tests):**
   * `test_transfer_lifecycle_success`: Full transfer lifecycle (`requested` $\to$ `in_progress` $\to$ `completed`), dispatches ambulance, moves patient to destination hospital, releases origin bed.
   * `test_transfer_identical_hospitals_rejected`: Validates source != destination hospital.
   * `test_transfer_nonexistent_hospitals_or_case`: Returns HTTP 404 for missing entities.
   * `test_transfer_conflicting_ambulance`: Rejects assigning busy/dispatched ambulance to transfer.
   * `test_transfer_cancellation_reverts_state`: Cancelling transfer restores case to `open` and frees ambulance.
   * `test_invalid_lifecycle_transition`: Prevents duplicate completion or cancellation.
   * `test_blood_unit_issue_success`: Issues eligible blood unit, sets `status='issued'`, assigns `case_id` and timestamp.
   * `test_blood_unit_expired_rejected`: Rejects expired blood unit with HTTP 400 and marks status `expired`.
   * `test_blood_unit_already_issued_rejected`: Rejects re-issuing already issued blood unit.
   * `test_blood_unit_invalid_case_rejected`: Rejects issuance when case ID does not exist.
   * `test_resource_tracker_sync`: Verifies `Resource_Availability` matches inventory counts accurately.
   * `test_audit_logging_and_rollback`: Verifies audit logs persist on commit and disappear on rollback.

### SQLite vs. MySQL Concurrency Notice:
> [!NOTE]
> SQLite in-memory tests prove application logic, transition validation, schema constraints, and rollback behavior. However, SQLite uses file/memory level locks rather than InnoDB row-level locking. For multi-client concurrency verification on MySQL, run concurrent requests against a dedicated staging MySQL instance using tools like `locust` or `wrk`.

---

## 9. API Reference Summary

### Dashboard
* `GET /dashboard`: Aggregated live metrics (total/available beds, ventilators, fleet readiness, blood units, open cases, pending transfers).

### Hospitals
* `GET /hospitals`: List hospitals with city and trauma level filters.
* `GET /hospitals/with-resources`: Hospitals joined with live bed, ventilator, and ambulance availability.
* `GET /hospitals/search?q={query}`: Multi-field search across hospital name, city, and location.
* `POST /hospitals`: Register a new hospital facility.
* `PATCH /hospitals/{hospital_id}`: Update hospital contact details or trauma rating.
* `DELETE /hospitals/{hospital_id}`: Safe deletion (blocks deletion if related beds or active cases exist).

### Resources & Blood Issuing
* `GET /resources/beds`: List beds filtered by hospital, bed type (ICU/General), and availability.
* `POST /resources/beds`: Register a new bed and update resource availability.
* `PATCH /resources/beds/{bed_id}/status`: Toggle bed status (`available`, `occupied`).
* `GET /resources/ventilators`: List ventilators with status filters.
* `POST /resources/ventilators`: Register a new ventilator.
* `PATCH /resources/ventilators/{ventilator_id}/status`: Toggle ventilator operational state.
* `GET /resources/ambulances`: List fleet vehicles with status filters.
* `POST /resources/ambulances`: Register a new ambulance.
* `PATCH /resources/ambulances/{ambulance_id}/status`: Update vehicle dispatch status.
* `GET /resources/blood-units`: List blood units by blood group, status, and expiry date.
* `POST /resources/blood-units`: Register a blood unit into bank inventory.
* `POST /resources/blood-units/{unit_id}/issue`: Issue blood unit to emergency case with expiration validation.

### Emergency Cases
* `GET /emergency-cases`: List patient cases sorted by triage severity.
* `POST /emergency-cases`: Log new emergency case intake with triage rating.
* `PATCH /emergency-cases/{case_id}`: Update patient clinical status (`open`, `admitted`, `transfer_pending`, `discharged`).
* `DELETE /emergency-cases/{case_id}`: Delete case (prevented if active resource allocations exist).

### Allocations Engine
* `POST /allocations/beds`: Allocate bed to case using row lock (`with_for_update()`).
* `POST /allocations/beds/{bed_id}/release?case_id={case_id}`: Release bed back to inventory.
* `GET /allocations/beds/active`: List all currently occupied beds and assigned patient IDs.
* `POST /allocations/ventilators`: Allocate ventilator using row lock.
* `POST /allocations/ventilators/{ventilator_id}/release?case_id={case_id}`: Release ventilator.
* `GET /allocations/ventilators/active`: List active ventilator assignments.
* `POST /allocations/ambulances`: Authorize ambulance dispatch.
* `POST /allocations/ambulances/{ambulance_id}/arrive?case_id={case_id}`: Mark ambulance arrived.
* `GET /allocations/ambulances/active`: List all ambulances currently dispatched.

### Patient Transfers Engine
* `GET /transfers`: List inter-hospital transfers with status and hospital filters.
* `GET /transfers/{transfer_id}`: Retrieve single transfer record by ID.
* `POST /transfers`: Initiate transfer request (validates hospitals, case, and ambulance availability).
* `POST /transfers/{transfer_id}/start`: Begin transfer, transition status to `in_progress`, dispatch assigned ambulance.
* `POST /transfers/{transfer_id}/complete`: Complete transfer, admit patient to receiving hospital, release origin bed/ventilator, return ambulance to `available`.
* `POST /transfers/{transfer_id}/cancel`: Cancel transfer, restore patient status, return ambulance to `available`.

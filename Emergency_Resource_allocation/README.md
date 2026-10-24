# Emergency Resource Allocation System

An enterprise-grade, transaction-safe hospital emergency management platform designed for real-time tracking, facility coordination, patient triage, and critical resource allocation across interconnected healthcare facilities.

---

## 1. Project Overview & Objectives

In mass casualty incidents, epidemic surges, or urban multi-hospital emergencies, coordination failure is the leading cause of preventable patient mortality. Individual hospitals operate with fragmented data silos, leading to severe resource imbalances—where one facility exhausts its ICU beds and ventilators while an adjacent facility retains idle capacity.

### Key Objectives
* **Unified Command Center:** Provide a single source of truth aggregating real-time metrics across all registered hospital networks.
* **Transaction-Safe Resource Allocation:** Prevent double-booking and negative inventory counts using database-level row locking (`SELECT ... FOR UPDATE`).
* **Dynamic Patient Triage:** Standardize clinical triage (Red/Critical, Yellow/Urgent, Green/Stable) and match patient severity to available trauma care levels.
* **Lifecycle Resource Tracking:** Complete audit trail for resources—from assignment and transit through patient recovery and equipment release back to available inventory.
* **Robust Emergency Ops Aesthetic:** Clean, high-contrast, distraction-free interface built to Emil Kowalski's design engineering standards.

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
│   ├── models.py                # SQLAlchemy ORM declarative models
│   ├── schemas.py               # Pydantic validation models & response schemas
│   └── routers/
│       ├── __init__.py
│       ├── dashboard.py         # Real-time aggregated telemetry metrics
│       ├── hospitals.py         # Hospital CRUD & resource capacity queries
│       ├── resources.py         # Beds, ventilators, ambulances & blood units
│       ├── emergency_cases.py   # Patient intake, triage status, and clinical management
│       └── allocations.py       # Concurrency-safe allocation & release engine
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
│   │       ├── Resources.tsx    # Tabbed resource inventory (Beds, Vents, Fleet, Blood)
│   │       ├── EmergencyCases.tsx # Patient triage intake & status management
│   │       └── Allocations.tsx  # Transaction-safe allocation engine & active allocation registry
│   ├── package.json             # Frontend dependencies & build scripts
│   ├── tsconfig.json            # TypeScript compiler configuration
│   └── vite.config.ts           # Vite dev server & /api backend proxy config
├── tests/
│   └── test_allocations_isolated.py # Isolated in-memory SQLite unit tests for allocation logic
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
        +------+------+        +------+------+        +------+------+        +-------------+
               | 1                    | 1                    | 1
               | 1:N                  | 1:N                  | 1:N
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
                           +----------------------+
```

### Table Reference
1. **`Hospitals`**: Primary facility registry (`hospital_id` PK, `name`, `city`, `location`, `contact_no`, `trauma_level`).
2. **`Beds`**: Individual tracked beds (`bed_id` PK, `hospital_id` FK, `bed_type` ['icu', 'general'], `status` ['available', 'occupied']).
3. **`Ventilators`**: Mechanical life support units (`ventilator_id` PK, `hospital_id` FK, `status` ['available', 'in_use', 'maintenance']).
4. **`Ambulances`**: Emergency response vehicles (`ambulance_id` PK, `hospital_id` FK, `vehicle_no` UNIQUE, `status` ['available', 'dispatched', 'returning', 'on_duty']).
5. **`Blood_Units`**: Blood bank inventory (`unit_id` PK, `hospital_id` FK, `blood_group` ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'], `expiry_date`, `status` ['in_stock', 'issued', 'expired']).
6. **`Emergency_Cases`**: Patient emergency admissions (`case_id` PK, `hospital_id` FK, `patient_name`, `triage_level` ['red', 'yellow', 'green'], `status` ['open', 'admitted', 'discharged', 'transfer_pending']).
7. **`bed_alloc`**: Junction tracking bed assignments (`bed_id` PK/FK, `case_id` PK/FK, `allocated_at` PK, `released_at` nullable).
8. **`vent_alloc`**: Junction tracking ventilator assignments (`ventilator_id` PK/FK, `case_id` PK/FK, `allocated_at` PK, `released_at` nullable).
9. **`dispatched`**: Junction tracking ambulance dispatches (`ambulance_id` PK/FK, `case_id` PK/FK, `dispatched_at` PK, `arrived_at` nullable).
10. **`Transfers`**: Inter-hospital patient transfer logs (`transfer_id` PK, `from_hospital_id` FK, `to_hospital_id` FK, `case_id` FK, `ambulance_id` FK, `status` ['requested', 'in_transit', 'in_progress', 'completed', 'cancelled']).
11. **`Resource_Availability`**: Aggregated facility capacity snapshot table.
12. **`Audit_Logs`**: Administrative mutation audit trail (`log_id` PK, `hospital_id` FK, `table_name`, `record_id`, `change_type`, `changed_at`).

> [!CAUTION]
> The database `emergency_db` contains production test records. **Never drop, reset, truncate, or recreate this database.**

---

## 5. Environment Variables & Database Connection

Create or verify the `.env` file in the project root:

```ini
DB_USER=emergency_app
DB_PASSWORD=your_mysql_password
DB_HOST=localhost
DB_PORT=3306
DB_NAME=emergency_db
```

The database connection string in `app/database.py` dynamically composes the PyMySQL driver URI:
```python
DATABASE_URL = (
    f"mysql+pymysql://{getenv('DB_USER')}:{getenv('DB_PASSWORD')}"
    f"@{getenv('DB_HOST')}:{getenv('DB_PORT')}/{getenv('DB_NAME')}"
)
```

---

## 6. Installation & Startup Instructions

### Prerequisites
* Python 3.10+ (tested on Python 3.14)
* Node.js 18+ & npm
* MySQL Server running on port 3306

### Step 1: Backend Setup
From the repository root:
```bash
# 1. Activate the Python virtual environment
source .venv/bin/activate

# 2. Install dependencies (if not already installed)
pip install -r requirements.txt

# 3. Start the FastAPI application with auto-reload
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
* Backend runs at: `http://127.0.0.1:8000`
* Interactive API Documentation (Swagger): `http://127.0.0.1:8000/docs`
* Alternative Documentation (ReDoc): `http://127.0.0.1:8000/redoc`

### Step 2: Frontend Setup
In a new terminal, navigate to the `frontend` folder:
```bash
cd frontend

# 1. Install frontend dependencies
npm install

# 2. Start Vite development server
npm run dev
```
* Frontend application runs at: `http://localhost:5173`
* Vite automatically proxies `/api` calls to `http://localhost:8000`.

### Step 3: Production Frontend Build Verification
To verify TypeScript compilation and bundle production assets:
```bash
cd frontend
npm run build
```
Build output is generated into `frontend/dist/` in under 400ms with zero errors.

---

## 7. Running Tests (Database-Safe)

To preserve the real database `emergency_db`, all write tests run against an **isolated in-memory SQLite database**.

Run the allocation concurrency test suite:
```bash
# From repository root
.venv/bin/python -m unittest tests/test_allocations_isolated.py
```

### Verified Test Cases:
1. `test_allocate_available_bed_success`: Allocates available bed and transitions status to `occupied`.
2. `test_allocate_unavailable_bed_rejected`: Rejects booking of an occupied bed with HTTP 400.
3. `test_allocate_second_bed_to_same_case_rejected`: Rejects concurrent second bed assignment to a single patient with HTTP 400.
4. `test_release_bed_restores_availability`: Releases bed allocation and marks status `available`.
5. `test_allocate_unavailable_ventilator_rejected`: Rejects allocation of in-use ventilator with HTTP 400.
6. `test_allocate_available_ventilator_and_release`: Assigns and releases ventilator with transactional safety.
7. `test_dispatch_unavailable_ambulance_rejected`: Rejects dispatch of dispatched ambulance with HTTP 400.
8. `test_dispatch_available_ambulance_and_arrive`: Dispatches vehicle and processes arrival back to `available`.

---

## 8. API Reference Summary

### Dashboard
* `GET /dashboard`: Aggregated live metrics (total/available beds, ventilators, fleet readiness, blood units, open cases, pending transfers).

### Hospitals
* `GET /hospitals`: List hospitals with city and trauma level filters.
* `GET /hospitals/with-resources`: Hospitals joined with live bed, ventilator, and ambulance availability.
* `GET /hospitals/search?q={query}`: Multi-field search across hospital name, city, and location.
* `POST /hospitals`: Register a new hospital facility.
* `PATCH /hospitals/{hospital_id}`: Update hospital contact details or trauma rating.
* `DELETE /hospitals/{hospital_id}`: Safe deletion (blocks deletion if related beds or active cases exist).

### Resources
* `GET /resources/beds`: List beds filtered by hospital, bed type (ICU/General), and availability.
* `PATCH /resources/beds/{bed_id}/status`: Toggle bed status (`available`, `occupied`).
* `GET /resources/ventilators`: List ventilators with status filters (`available`, `in_use`, `maintenance`).
* `PATCH /resources/ventilators/{ventilator_id}/status`: Toggle ventilator operational state.
* `GET /resources/ambulances`: List fleet vehicles with status filters (`available`, `dispatched`, `returning`, `on_duty`).
* `PATCH /resources/ambulances/{ambulance_id}/status`: Update vehicle dispatch status.
* `GET /resources/blood-units`: List blood units by blood group and expiry date.

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

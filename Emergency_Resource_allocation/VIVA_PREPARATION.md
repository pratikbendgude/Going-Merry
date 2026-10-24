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
4. Maintains an active lifecycle from patient admission, resource assignment, and vehicle dispatch to treatment release and equipment replenishment.

---

## 2. System Architecture & End-to-End Request Flow

The system follows a classic **3-Tier Decoupled Client-Server Architecture**:

```
+-----------------------------------------------------------------------------------+
|                                 PRESENTATION TIER                                 |
|  React 19 + TypeScript (Vite Single Page Application)                             |
|  - UI Pages: Dashboard, Hospitals, Resources, EmergencyCases, Allocations         |
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
|             allocations.py                                                        |
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
|            Emergency_Cases, bed_alloc, vent_alloc, dispatched, Transfers          |
+-----------------------------------------------------------------------------------+
```

### Trace of a Real Request: Allocating a Bed
Let's trace what happens when an operator clicks **"Commit Bed Allocation"** in the browser:
1. **React UI (`Allocations.tsx`):** The user selects Emergency Case #1 and Bed #103, then clicks the button. This triggers `bedAllocation.mutate({ bedId: 103, caseId: 1 })`.
2. **API Client (`api.ts`):** Sends an HTTP `POST` request to `http://localhost:8000/allocations/beds` with JSON body: `{"bed_id": 103, "case_id": 1}`.
3. **FastAPI Route (`allocations.py`):** Route `@router.post("/beds")` intercepts the request.
4. **Pydantic Validation (`schemas.py`):** `BedAllocationRequest` parses the payload, confirming `bed_id` and `case_id` are valid integers.
5. **Database Session (`database.py`):** FastAPI's `Depends(get_db)` injects an active SQLAlchemy `SessionLocal`.
6. **Concurrency Row Lock:** The backend executes:
   ```python
   bed = db.query(Bed).filter(Bed.bed_id == 103).with_for_update().first()
   ```
   This compiles to MySQL: `SELECT * FROM Beds WHERE bed_id = 103 FOR UPDATE;`. MySQL places an exclusive lock on that bed's row in memory.
7. **Business Rules Verification:**
   - Checks if `bed.status == "available"`. (If not, raises HTTP 400).
   - Checks if the case already has an active bed in `bed_alloc` where `released_at IS NULL`. (If yes, raises HTTP 400).
8. **State Transition & Commit:**
   - Adds a new row into `bed_alloc` (`allocated_at = datetime.utcnow()`).
   - Updates `bed.status = "occupied"`.
   - Calls `db.commit()`. The transaction is permanently written, and MySQL releases the row lock.
9. **UI Refresh (React Query):** On HTTP 201 response, `invalidateAll()` fires. React Query marks queries `['available-beds']`, `['active-bed-allocations']`, and `['dashboard']` as stale and refetches them in the background. The bed immediately disappears from the available dropdown and appears in the Active Allocations table.

---

## 3. Technology Stack: Purpose & Justification

| Technology | Role | Why We Chose It Instead of Alternatives |
|---|---|---|
| **FastAPI** | Backend API Framework | Much faster than Django or Flask; uses modern Python async features; automatically generates interactive Swagger documentation at `/docs`; built-in dependency injection for database sessions. |
| **Pydantic** | Validation & Serialization | Ensures strict data contracts. If a client sends an invalid triage level or hospital ID, Pydantic immediately returns a structured 422 error before running database queries. |
| **SQLAlchemy** | Object Relational Mapper (ORM) | Allows us to write clean Python objects (`Hospital`, `Bed`, `EmergencyCase`) instead of raw SQL strings. Crucially, it supports `with_for_update()` to enforce row-level locking. |
| **MySQL (InnoDB)** | Relational Database | We chose relational storage over MongoDB because hospital resource allocation requires strict ACID transactions, foreign key constraints, and relational junctions (`bed_alloc`, `vent_alloc`). InnoDB provides row-level locking. |
| **React 19** | Frontend Framework | Component-based UI architecture. Enables clean separation between visual components (Header, Cards, Tables, Forms) and state. |
| **TypeScript** | Type-Safe Language | Catches bugs at compile time. Ensures the data structures in the frontend (`HospitalWithResources`, `Bed`, `EmergencyCase`) strictly match backend Pydantic schemas. |
| **TanStack React Query** | Server-State Management | Avoids manual `useEffect` boilerplates and synchronization bugs. Manages server caching, automatic polling every 15s for live operations, and immediate cache invalidation upon mutations. |
| **Vite** | Frontend Build Tool | Significantly faster build times than Webpack (under 400ms production build); native ES module dev server with zero-delay Hot Module Replacement (HMR). |

---

## 4. Database Schema, Keys, and Relationships

The database `emergency_db` has 12 tables. The core tables and their relationships are:

### Core Tables
1. **`Hospitals`**: Master table for facilities.
   - Primary Key: `hospital_id`
   - Attributes: `name`, `city`, `location`, `contact_no`, `trauma_level` (1 to 5).
2. **`Beds`**: Tracks individual beds.
   - Primary Key: `bed_id`
   - Foreign Key: `hospital_id` references `Hospitals(hospital_id)`
   - Attributes: `bed_type` ('icu', 'general'), `status` ('available', 'occupied').
3. **`Ventilators`**: Tracks life-support ventilators.
   - Primary Key: `ventilator_id`
   - Foreign Key: `hospital_id` references `Hospitals(hospital_id)`
   - Attributes: `status` ('available', 'in_use', 'maintenance').
4. **`Ambulances`**: Tracks emergency fleet vehicles.
   - Primary Key: `ambulance_id`
   - Foreign Key: `hospital_id` references `Hospitals(hospital_id)`
   - Attributes: `vehicle_no` (UNIQUE), `status` ('available', 'dispatched', 'returning', 'on_duty').
5. **`Blood_Units`**: Tracks blood bank inventory.
   - Primary Key: `unit_id`
   - Foreign Key: `hospital_id` references `Hospitals(hospital_id)`
   - Attributes: `blood_group` ('A+', 'O-', etc.), `expiry_date`, `status` ('in_stock', 'issued', 'expired').
6. **`Emergency_Cases`**: Tracks incoming emergency patients.
   - Primary Key: `case_id`
   - Foreign Key: `hospital_id` references `Hospitals(hospital_id)`
   - Attributes: `patient_name`, `triage_level` ('red', 'yellow', 'green'), `status` ('open', 'admitted', 'transfer_pending', 'discharged').

### Junction Tables (Many-to-Many with Temporal Lifecycle)
Instead of putting a `case_id` column directly on `Beds` or `Ventilators`, the database uses junction tables with timestamps. This preserves an audit history of which patient used which equipment over time:
7. **`bed_alloc`**:
   - Composite Primary Key: `(bed_id, case_id, allocated_at)`
   - Foreign Keys: `bed_id` references `Beds(bed_id)`, `case_id` references `Emergency_Cases(case_id)`.
   - `released_at`: Timestamp. If `NULL`, the bed is **currently occupied**. When released, this timestamp is updated.
8. **`vent_alloc`**:
   - Composite Primary Key: `(ventilator_id, case_id, allocated_at)`
   - `released_at`: Timestamp. If `NULL`, the ventilator is **currently in use**.
9. **`dispatched`**:
   - Composite Primary Key: `(ambulance_id, case_id, dispatched_at)`
   - `arrived_at`: Timestamp. If `NULL`, the vehicle is **in transit**. When it arrives, this timestamp is stamped.

---

## 5. CRUD Operations and Data Validation

Every major entity has complete CRUD (Create, Read, Update, Delete) support in `app/routers/`:

* **Validation with Pydantic (`app/schemas.py`):**
  - Regex patterns prevent bad data. For example:
    - Ambulance status: `^(available|dispatched|returning|on_duty)$`
    - Triage level: `^(red|yellow|green)$`
    - Blood group: `^(A\+|A-|B\+|B-|O\+|O-|AB\+|AB-)$`
  - Bounds checking: `trauma_level: Optional[int] = Field(None, ge=1, le=5)` guarantees trauma levels are always between 1 and 5.
* **Safe Deletions:**
  - `delete_hospital` in `app/routers/hospitals.py`: Checks if beds or active cases are attached. If yes, it raises an HTTP 400 error: `"Cannot delete hospital with existing beds or cases. Remove related records first."`
  - `delete_emergency_case` in `app/routers/emergency_cases.py`: Checks `case.bed_allocations`, `case.ventilator_allocations`, and `case.dispatches`. Deletion is prohibited while resources remain actively allocated.

---

## 6. How Resources are Represented and Tracked

There are two levels of resource tracking in the system:
1. **Granular Individual Tracking (Primary Operational Data):**
   Every single bed, ventilator, ambulance, and blood unit has a physical row with a primary key ID and a status.
   - Bed status: `available` or `occupied`
   - Ventilator status: `available`, `in_use`, or `maintenance`
   - Ambulance status: `available`, `dispatched`, `returning`, or `on_duty`
   - Blood unit status: `in_stock`, `issued`, or `expired`
2. **Aggregated Capacity Queries (On-the-Fly Calculation):**
   In `app/routers/hospitals.py`, `list_hospitals_with_resources()` runs SQL count queries against the real individual resource tables:
   ```python
   available_beds = db.query(func.count(Bed.bed_id)).filter(
       Bed.hospital_id == hospital.hospital_id,
       Bed.status == "available"
   ).scalar() or 0
   ```
   This guarantees that resource capacity percentages shown on cards are never fake or hardcoded—they reflect the exact count of unallocated rows in MySQL.

---

## 7. How Resource Allocation & Release Work

Located in **`app/routers/allocations.py`**:

### Allocation Flow
1. Operator picks an emergency case and an available resource on `Allocations.tsx`.
2. Frontend calls `api.allocateBed(bed_id, case_id)`.
3. Backend locks the bed row using `.with_for_update()`.
4. Checks that the bed's status is `'available'`.
5. Checks that the patient does not already have an active allocation.
6. Writes a record to `bed_alloc` with `allocated_at = datetime.utcnow()`.
7. Updates the bed's status to `'occupied'`.
8. `db.commit()` saves changes and releases the row lock.

### Release Flow
1. Operator clicks **"Release Bed"** or **"Release Ventilator"** in the Active Allocations table.
2. Frontend calls `api.releaseBed(bed_id, case_id)` which sends a `POST` request to `/allocations/beds/{bed_id}/release?case_id={case_id}`.
3. Backend finds the active allocation record where `released_at IS NULL`.
4. Sets `allocation.released_at = datetime.utcnow()`.
5. Updates the bed's status from `'occupied'` back to `'available'`.
6. `db.commit()` commits the transaction.
7. The bed is immediately returned to the pool of available equipment across the entire system.

---

## 8. Concurrency & Double-Booking Prevention

### The Race Condition Problem
Imagine two hospital coordinators simultaneously trying to allocate the last remaining ICU Bed (#101) to two different critical patients at the exact same millisecond. In a naive system without locking, both requests check the database, see `status == 'available'`, and both assign Bed #101. Now one bed has been promised to two patients.

### How Our Code Solves It
In `app/routers/allocations.py`, we use **Pessimistic Concurrency Control** via SQLAlchemy's `.with_for_update()`:

```python
# app/routers/allocations.py - Lines 52-60
bed = db.query(Bed).filter(Bed.bed_id == allocation.bed_id).with_for_update().first()
if not bed:
    raise HTTPException(status_code=404, detail="Bed not found")

if bed.status != "available":
    raise HTTPException(
        status_code=400,
        detail=f"Bed is not available. Current status: {bed.status}"
    )
```

### How MySQL Handles This Under the Hood:
1. When Request A executes `with_for_update()`, MySQL's InnoDB engine places an **Exclusive Row Lock (X-Lock)** on the record for `bed_id = 101`.
2. When Request B arrives a microsecond later and tries to query `bed_id = 101`, MySQL pauses Request B until Request A's transaction completes.
3. Request A updates `bed.status = "occupied"` and executes `db.commit()`.
4. Request A's lock is released. Request B is now unblocked and reads the row.
5. Request B inspects `bed.status`. Since Request A changed it to `"occupied"`, Request B hits `if bed.status != "available":` and receives an **HTTP 400 Bad Request** ("Bed is not available").
6. Result: **Zero possibility of double booking.**

---

## 9. How Dashboard Metrics are Calculated

Located in **`app/routers/dashboard.py`** in function `get_dashboard_metrics()`:

All numbers displayed on the dashboard are computed live from the database using SQL aggregate functions (`func.count`):
* `total_hospitals`: `db.query(func.count(Hospital.hospital_id)).scalar()`
* `total_beds`: `db.query(func.count(Bed.bed_id)).scalar()`
* `available_beds`: `db.query(func.count(Bed.bed_id)).filter(Bed.status == "available").scalar()`
* `occupied_beds`: `db.query(func.count(Bed.bed_id)).filter(Bed.status == "occupied").scalar()`
* `open_cases`: `db.query(func.count(EmergencyCase.case_id)).filter(EmergencyCase.status == "open").scalar()`
* `pending_transfers`: `db.query(func.count(Transfer.transfer_id)).filter(Transfer.status.in_(["requested", "in_transit", "in_progress"])).scalar()`

On the frontend (`Dashboard.tsx`), calculations are guarded against division by zero:
```typescript
const bedUtilization = metrics.total_beds > 0
  ? ((metrics.occupied_beds / metrics.total_beds) * 100).toFixed(1)
  : '0.0';
```

---

## 10. Error Handling, Testing, Limitations & Future Scope

### Error Handling Architecture
* **FastAPI `HTTPException`:** Explicit status codes (400 for bad input, 404 for missing entities, 422 for schema validation failures).
* **Automatic Rollbacks:** All database mutating endpoints in `allocations.py` wrap logic in `try ... except` blocks with `db.rollback()` to ensure database consistency if any failure occurs.
* **Frontend Error Boundaries & Banners:** React Query catches fetch errors and renders clean operational error states with "Retry Connection" buttons rather than crashing.

### Testing Strategy
To guarantee database safety, we created an isolated test suite in `tests/test_allocations_isolated.py` using an **in-memory SQLite database** (`sqlite:///:memory:`). This allows running automated unit tests for concurrency, double-booking rejection, and release restoration without writing or modifying a single record in the real `emergency_db`.

### Current Limitations
1. **Manual Transfer Coordination:** Patient transfers between hospitals log records in `Transfers`, but driver GPS tracking is not simulated in real-time.
2. **Authentication:** The current system operates as a unified emergency command center without role-based access control (RBAC) separating doctors, dispatchers, and administrators.
3. **Automated Resource Optimization:** Allocations are made by the operator. The system does not currently use linear programming (e.g. simplex algorithm) to auto-assign the nearest available hospital.

### Future Improvements
1. **JWT Authentication & RBAC:** Restrict resource release to doctors and ambulance dispatch to paramedics.
2. **Geospatial Proximity Routing:** Integrate PostGIS / MySQL Spatial functions with OpenStreetMap to calculate true travel times for ambulances.
3. **WebSockets for Push Notifications:** Replace 15-second polling with WebSocket push notifications for sub-second critical triage alerts.

---

## 11. Frequently Asked Questions (Viva Q&A)

### Standard Questions

**Q1: What is the main objective of this project?**
> **Answer:** To provide a real-time, transaction-safe operations platform that connects multiple hospitals, tracks critical resources (ICU beds, ventilators, ambulances, blood), and enables emergency coordinators to allocate and release equipment to triage patients without risk of double-booking.

**Q2: Why did you use FastAPI instead of Flask or Django?**
> **Answer:** FastAPI is significantly faster due to ASGI (`uvicorn`) and asynchronous I/O support. It includes automatic data validation via Pydantic and automatically generates interactive Swagger API documentation at `/docs`.

**Q3: How do you prevent two users from booking the same bed at the same time?**
> **Answer:** In `app/routers/allocations.py`, we query the bed using SQLAlchemy's `.with_for_update()`, which issues a `SELECT ... FOR UPDATE` statement in MySQL. This places an exclusive row lock on the bed inside the transaction. Any concurrent request is forced to wait until the first transaction commits, at which point the bed is marked 'occupied' and the second request is rejected with an HTTP 400.

**Q4: What is the purpose of React Query in the frontend?**
> **Answer:** React Query manages server-side state. Instead of writing manual `useEffect` calls and managing loading/error states in local state, React Query handles caching, automatic background polling every 15 seconds, and smart cache invalidation. When we allocate or release a resource, it automatically refreshes the relevant tables and the dashboard metrics.

**Q5: What are the triage levels in your application?**
> **Answer:** We implement the standard emergency triage system:
> * **Red (Critical):** Immediate life-threatening emergency requiring resuscitation or immediate ICU/ventilator care.
> * **Yellow (Urgent):** Serious condition requiring prompt intervention.
> * **Green (Stable):** Non-urgent condition.
> Cases are sorted on the Emergency Cases page so Red triage patients always appear at the top.

**Q6: What is the difference between `Beds` and `bed_alloc`?**
> **Answer:** `Beds` is an entity table representing individual physical beds and their current status (`available` or `occupied`). `bed_alloc` is a junction table that tracks the allocation history between beds and patients (`case_id`), recording `allocated_at` and `released_at` timestamps.

---

### Challenging Questions for High Marks

**Q7: How is the database connection managed to prevent connection leaks?**
> **Answer:** In `app/database.py`, we implement a generator function `get_db()` that yields a database session wrapped in a `try ... finally` block:
> ```python
> def get_db():
>     db = SessionLocal()
>     try:
>         yield db
>     finally:
>         db.close()
> ```
> In FastAPI routers, we use `db: Session = Depends(get_db)`. When the request finishes (even if an unhandled exception occurs), FastAPI automatically executes the `finally` block and closes the session, returning the connection to SQLAlchemy's connection pool.

**Q8: Why does the Vite configuration include a proxy?**
> **Answer:** In development, the React frontend runs on `http://localhost:5173` while FastAPI runs on `http://localhost:8000`. To prevent Cross-Origin Resource Sharing (CORS) issues and cookie/header stripping, Vite's dev server proxies `/api` requests directly to `http://localhost:8000`. In `app/main.py`, we mounted the routers both at root (`/`) and with `/api` prefix to ensure full dual compatibility.

**Q9: If MySQL crashes during an allocation, how is data consistency preserved?**
> **Answer:** In `app/routers/allocations.py`, the allocation logic is wrapped in a `try ... except` block with `db.rollback()`. Because MySQL InnoDB is fully ACID-compliant, if a crash or exception occurs before `db.commit()` is reached, the transaction is rolled back. Either both the `bed_alloc` row insertion and the `bed.status = "occupied"` update succeed together, or neither does.

**Q10: Why did you use an in-memory SQLite database for testing instead of testing directly on `emergency_db`?**
> **Answer:** `emergency_db` contains existing project records. Running write tests against it would pollute real operational data with test cases or risk accidental record deletion. By writing `tests/test_allocations_isolated.py` with `sqlite:///:memory:`, the test suite creates tables in RAM, runs concurrency test cases, and tears down in under 120ms without touching the MySQL database.

---

## 12. Recommended Study Roadmap

To master the project quickly before your viva, study the source files in this exact order:

1. **`app/models.py`:** Understand the database entities, tables, primary keys, and relationships.
2. **`app/schemas.py`:** Review the Pydantic schemas, validation rules, and regex patterns.
3. **`app/routers/allocations.py`:** Study `allocate_bed()`, `release_bed()`, and how `.with_for_update()` prevents race conditions.
4. **`app/routers/dashboard.py`:** Look at how live metrics are aggregated using `func.count()`.
5. **`tests/test_allocations_isolated.py`:** Review how the transactional logic is verified in isolation.
6. **`frontend/src/lib/api.ts`:** Understand how the React frontend communicates with FastAPI endpoints.
7. **`frontend/src/pages/Allocations.tsx`:** See how the UI connects to the allocation and release API endpoints.

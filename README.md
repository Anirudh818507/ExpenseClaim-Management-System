# ExpenseClaim — Employee Expense Management System

A full-stack web application built with **Spring Boot 3** (backend) and **Vanilla HTML/CSS/JavaScript** (frontend) for managing employee expense claims with a manager approval workflow.

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Backend Framework | Spring Boot 3.3.5 |
| Language | Java 21 |
| ORM | Spring Data JPA / Hibernate 6 |
| Database | MySQL 8 |
| Connection Pool | HikariCP |
| Frontend | HTML5 + Vanilla CSS + Vanilla JS (ES2022) |
| Font | Inter (Google Fonts) |
| Build Tool | Maven (Maven Wrapper included) |

---

## Architecture

```
Browser (Static HTML/CSS/JS)
        |
        | HTTP (REST JSON, same-origin /api/**)
        v
Spring Boot Embedded Tomcat (port 8080)
        |
   ┌────┴────────────────────┐
   │  Controller Layer        │  @RestController
   │  (request/response)      │
   └────┬────────────────────┘
        │
   ┌────┴────────────────────┐
   │  Service Layer           │  Business logic
   │                          │
   └────┬────────────────────┘
        │
   ┌────┴────────────────────┐
   │  Repository Layer        │  JpaRepository<T, Long>
   │                          │
   └────┬────────────────────┘
        │
   ┌────┴────────────────────┐
   │  MySQL Database          │
   │  (expenseclaim schema)   │
   └─────────────────────────┘
```

---

## Entity Relationships

```
Employee (1) ─────────────────── (*) Claim
                                        |
                                        ├── (*) ExpenseItem
                                        └── (*) ApprovalStep ── (1) Employee (Manager)
```

### Entities

| Entity | Table | Key Fields |
|--------|-------|-----------|
| Employee | employee | employeeId, name, email, department, role, managerId |
| Claim | claim | claimId, employee(FK), totalAmount, status |
| ExpenseItem | expense_item | expenseItemId, claim(FK), category, amount, description |
| ApprovalStep | approval_step | approvalStepId, claim(FK), manager(FK), status, remarks |

**Claim Status values:** `PENDING` → `APPROVED` or `REJECTED`

**ApprovalStep Status values:** `PENDING` → `APPROVED` or `REJECTED`

> **Note:** Approving/rejecting via `PUT /api/claims/{id}/approve` requires a PENDING ApprovalStep to exist for the claim. The approvalStep's status and the claim's status are kept in sync automatically.

---

## REST API Reference

### Employees — `/api/employees`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/employees | Get all employees |
| GET | /api/employees/{id} | Get employee by ID |
| POST | /api/employees | Create employee |
| PUT | /api/employees/{id} | Update employee |
| DELETE | /api/employees/{id} | Delete employee |

### Claims — `/api/claims`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/claims | Get all claims |
| GET | /api/claims/{id} | Get claim by ID |
| POST | /api/claims | Create claim |
| PUT | /api/claims/{id} | Update claim |
| PUT | /api/claims/{id}/approve | Approve claim (requires PENDING ApprovalStep) |
| PUT | /api/claims/{id}/reject | Reject claim (requires PENDING ApprovalStep) |
| DELETE | /api/claims/{id} | Delete claim (cascades to ApprovalSteps) |

### Expense Items — `/api/expense-items`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/expense-items | Get all expense items |
| GET | /api/expense-items/{id} | Get expense item by ID |
| POST | /api/expense-items | Create expense item |
| PUT | /api/expense-items/{id} | Update expense item |
| DELETE | /api/expense-items/{id} | Delete expense item |

**POST body:** `{ "claim": { "claimId": 1 }, "category": "Travel", "amount": 500.0, "description": "..." }`

### Approval Steps — `/api/approval-steps`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/approval-steps | Get all approval steps |
| GET | /api/approval-steps/{id} | Get approval step by ID |
| POST | /api/approval-steps | Create approval step |
| PUT | /api/approval-steps/{id} | Update approval step (also updates linked Claim status) |
| DELETE | /api/approval-steps/{id} | Delete approval step |

**POST body:** `{ "claim": { "claimId": 1 }, "manager": { "employeeId": 2 }, "status": "PENDING", "remarks": "..." }`

### Error Response Format

All errors return JSON:
```json
{
  "timestamp": "2026-09-28T10:00:00",
  "status": 404,
  "error": "Not Found",
  "message": "Claim not found with ID: 99",
  "path": "/api/claims/99"
}
```

---

## Frontend Structure

```
src/main/resources/static/
├── index.html                  ← Animated splash, redirects to dashboard
├── css/
│   └── styles.css              ← Complete dark design system (26 KB)
├── js/
│   ├── api.js                  ← REST API client (all endpoints)
│   └── utils.js                ← Shared utilities (notifications, modals, etc.)
└── pages/
    ├── dashboard.html/js       ← Summary stats, recent claims, quick actions
    ├── employees.html/js       ← Employee CRUD with search and role filter
    ├── claims.html/js          ← Claim CRUD, approve/reject workflow, detail modal
    ├── expense-items.html/js   ← Expense item CRUD with category filter
    └── approvals.html/js       ← Approval step CRUD, quick approve/reject
```

---

## How to Run

### Prerequisites
- Java 21+
- Maven 3.6+ (or use the included `mvnw`)
- MySQL 8 running on localhost:3306
- Database `expenseclaim` created

### 1. Create the Database
```sql
CREATE DATABASE expenseclaim;
```

### 2. Configure Credentials
Edit `src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/expenseclaim
spring.datasource.username=root
spring.datasource.password=YOUR_PASSWORD
```

### 3. Run the Application
```bash
./mvnw spring-boot:run
```
or on Windows:
```cmd
mvnw.cmd spring-boot:run
```

### 4. Open in Browser
Visit: **http://localhost:8080**

The app automatically redirects to the dashboard.

---

## End-to-End Workflow

1. **Create Employee** → Go to Employees → Add Employee
2. **Create Claim** → Go to Claims → New Claim → Select Employee → Set Amount
3. **Add Expense Items** → Go to Expense Items → Add Item → Link to Claim
4. **Create Approval Step** → Go to Approvals → Add Approval Step → Select Claim + Manager → Status = PENDING
5. **Approve or Reject** → On Approvals page, click ✅ or ❌ on the approval step
6. **Verify** → Go back to Claims → The claim status updates to APPROVED/REJECTED

---

## Build

```bash
# Clean and package
./mvnw clean package

# Run tests
./mvnw test
```

---

## Notes

- `spring.jpa.hibernate.ddl-auto=update` — tables are created/updated automatically on startup.
- The `@JsonBackReference` annotation on `ExpenseItem.claim` prevents circular serialization; the claim is not included in the GET response for expense items.
- Database credentials are in `application.properties` — do not commit this to a public repository.
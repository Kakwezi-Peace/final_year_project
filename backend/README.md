#  Car Wash Management System

> **AUCA Final Project** — A fully-featured RESTful backend for a Car Wash Management System, built with **Spring Boot 3.2**, **Java 21**, **PostgreSQL**, and **JWT-based Authentication**.

---

##  Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Database Schema](#database-schema)
5. [Authentication & Authorization (RBAC)](#authentication--authorization-rbac)
6. [CORS & CSRF](#cors--csrf)
7. [API Endpoints](#api-endpoints)
8. [Getting Started](#getting-started)
9. [Running the Application](#running-the-application)
10. [Testing the API](#testing-the-api)
11. [Default Credentials](#default-credentials)
12. [Pre-Seeded Services](#pre-seeded-services)
13. [Project Structure](#project-structure)

---

## Project Overview

The **Car Wash Management System** is a digital platform designed to automate and streamline the operations of a car wash business (case study: AUCA Kicukiro, Rwanda). It replaces manual, paper-based record-keeping with a modern web system enabling:

- **Online and walk-in booking** of car wash services
- **Customer & vehicle tracking** with a centralized database
- **Real-time appointment scheduling** with status management
- **Multi-method payment processing** (Cash, Mobile Money, Card)
- **Employee assignment** to bookings
- **Admin dashboard** with revenue and operational reports
- **Role-based access control** for Administrator, Staff, and Customer users

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (React SPA)                   │
│              Lovable / localhost:5173                     │
└───────────────────────┬─────────────────────────────────┘
                        │  HTTPS + Bearer JWT
                        ▼
┌─────────────────────────────────────────────────────────┐
│              Spring Boot REST API (:8080)                 │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │  Controllers │  │  Services    │  │  Repositories  │  │
│  │  (REST endpoints)│  │(Business logic)│  │(Spring Data JPA)│  │
│  └─────────────┘  └──────────────┘  └───────┬────────┘  │
│  ┌──────────────────────────────────────────▼─────────┐  │
│  │         Spring Security (JWT Filter + RBAC)        │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────┘
                               │  JPA / Hibernate
                               ▼
┌─────────────────────────────────────────────────────────┐
│                PostgreSQL Database                        │
│   users · customers · vehicles · services ·              │
│   employees · bookings · payments                        │
└─────────────────────────────────────────────────────────┘
```

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Language | Java 21 (LTS) |
| Framework | Spring Boot 3.2.3 |
| Security | Spring Security 6 + JWT (jjwt 0.12.5) |
| Database | PostgreSQL 15+ |
| ORM | Spring Data JPA / Hibernate |
| API Docs | SpringDoc OpenAPI 2.3 (Swagger UI) |
| Build | Apache Maven 3.9+ |
| Utilities | Lombok |

---

## Database Schema

```
┌──────────┐       ┌───────────┐       ┌──────────┐
│  users   │──1:1──│ customers │──1:N──│ vehicles │
└──────────┘       └─────┬─────┘       └────┬─────┘
                         │                   │
                         └──────────────┬────┘
                                        │ 1:N
                               ┌────────▼──────────┐
                               │      bookings      │
                               │ - bookingReference  │
                               │ - status           │
                               │ - scheduledAt      │
                               │ - totalAmount      │
                               └──┬──────────┬──────┘
                                  │          │
                     ┌────────────┘          └──────────────┐
                     ▼                                       ▼
              ┌─────────────┐                       ┌──────────────┐
              │  payments   │                       │   employees  │
              │ - method    │                       │  (assignees) │
              │ - status    │                       └──────────────┘
              │ - receiptNo │
              └─────────────┘

              ┌──────────┐
              │ services │
              │ - name   │     (referenced by bookings.service_id)
              │ - price  │
              └──────────┘
```

### Tables

| Table | Description |
|-------|-------------|
| `users` | Authentication accounts with role (ADMIN / STAFF / CUSTOMER) |
| `customers` | Customer profiles (linked 1:1 to a user account) |
| `vehicles` | Customer-owned vehicles (license plate, make, model) |
| `services` | Car wash service catalog with pricing |
| `employees` | Staff members who perform washes |
| `bookings` | Appointment records tying Customer + Vehicle + Service + Employee |
| `payments` | Payment transactions for completed bookings |

---

## Authentication & Authorization (RBAC)

### How Authentication Works

1. Client calls `POST /api/auth/login` with `{ username, password }`
2. Server validates credentials, returns `accessToken` (JWT, 24 h) + `refreshToken` (7 d)
3. Client includes token in every request: `Authorization: Bearer <accessToken>`
4. The `JwtAuthenticationFilter` intercepts each request, validates the token, and populates the Spring Security context

### Role-Based Access Control (RBAC)

| Role | Description | Access Level |
|------|-------------|-------------|
| `ADMIN` | System administrator | Full access to all endpoints |
| `STAFF` | Car wash employee / receptionist | Read/write bookings, customers, vehicles; read employees |
| `CUSTOMER` | Registered customer | Create bookings for own vehicles, view/cancel own bookings only |

### Booking Ownership Rules

- **CUSTOMERs** can only:
  - View their own bookings (`GET /api/bookings/my-bookings`)
  - Cancel their own **PENDING** or **CONFIRMED** bookings (`PATCH /api/bookings/{id}/cancel`)
  - Cannot cancel bookings that are `IN_PROGRESS` or already `COMPLETED`/`CANCELLED`

- **ADMIN/STAFF** can cancel any booking regardless of status (except COMPLETED)

### Booking Status Machine

```
PENDING ──► CONFIRMED ──► IN_PROGRESS ──► COMPLETED
   │              │              │
   └──► CANCELLED ◄─────────────┘
```

---

## CORS & CSRF

### CORS (Cross-Origin Resource Sharing)
CORS is configured to allow the **Lovable frontend** and local development servers:

```
Allowed Origins:
  - http://localhost:3000
  - http://localhost:5173
  - https://*.lovable.app
  - https://*.lovable.dev

Allowed Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Allowed Headers: Authorization, Content-Type, Accept, Origin, X-Requested-With
```

### CSRF (Cross-Site Request Forgery)
**CSRF protection is intentionally disabled** for this REST API. This is correct and safe because:
- The API is **stateless** – no sessions or cookies are used for authentication
- JWT tokens are sent via the `Authorization: Bearer` header, **not cookies**
- CSRF attacks target cookie-based session authentication only
- Enabling CSRF would break all `POST/PUT/DELETE` calls from the React SPA

---

## API Endpoints

###  Authentication — `/api/auth`
| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| `POST` | `/api/auth/register` | ❌ Public | Register new account |
| `POST` | `/api/auth/login` | ❌ Public | Login → get JWT tokens |
| `GET` | `/api/auth/me` | ✅ Any role | Get logged-in user profile |

### 👥 Customers — `/api/customers`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/customers` | ADMIN, STAFF | Create customer |
| `GET` | `/api/customers` | ADMIN, STAFF | List all / search (`?q=`) |
| `GET` | `/api/customers/{id}` | ADMIN, STAFF | Get by ID |
| `PUT` | `/api/customers/{id}` | ADMIN, STAFF | Update |
| `DELETE` | `/api/customers/{id}` | ADMIN | Delete |

###  Vehicles — `/api/vehicles`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/vehicles` | ADMIN, STAFF | Register vehicle |
| `GET` | `/api/vehicles` | ADMIN, STAFF | List all |
| `GET` | `/api/vehicles/{id}` | ADMIN, STAFF | Get by ID |
| `GET` | `/api/vehicles/customer/{customerId}` | Any auth | Get customer's vehicles |
| `PUT` | `/api/vehicles/{id}` | ADMIN, STAFF | Update |
| `DELETE` | `/api/vehicles/{id}` | ADMIN | Delete |

###  Services — `/api/services`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/services` | ❌ Public | All services |
| `GET` | `/api/services/active` | ❌ Public | Active services only |
| `GET` | `/api/services/category/{cat}` | ❌ Public | Filter by category |
| `GET` | `/api/services/{id}` | ❌ Public | Get by ID |
| `POST` | `/api/services` | ADMIN | Create |
| `PUT` | `/api/services/{id}` | ADMIN | Update |
| `PATCH` | `/api/services/{id}/toggle` | ADMIN | Toggle active/inactive |
| `DELETE` | `/api/services/{id}` | ADMIN | Delete |

###  Bookings — `/api/bookings`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/bookings` | Any auth | Create booking |
| `GET` | `/api/bookings` | ADMIN, STAFF (Customer: own only) | List all bookings |
| `GET` | `/api/bookings/my-bookings` | CUSTOMER | Get own bookings |
| `GET` | `/api/bookings/{id}` | Auth + ownership | Get by ID |
| `GET` | `/api/bookings/reference/{ref}` | Auth + ownership | Get by reference |
| `GET` | `/api/bookings/customer/{customerId}` | ADMIN, STAFF | Get by customer |
| `GET` | `/api/bookings/employee/{employeeId}` | ADMIN, STAFF | Get by employee |
| `GET` | `/api/bookings/status/{status}` | ADMIN, STAFF | Filter by status |
| `PATCH` | `/api/bookings/{id}/status?status=` | ADMIN, STAFF | Update status |
| `PATCH` | `/api/bookings/{id}/cancel` | Any auth (ownership) | **Cancel booking** |
| `PATCH` | `/api/bookings/{id}/assign-employee/{empId}` | ADMIN, STAFF | Assign employee |
| `PUT` | `/api/bookings/{id}` | ADMIN, STAFF | Update booking details |
| `DELETE` | `/api/bookings/{id}` | ADMIN | Hard delete |

###  Payments — `/api/payments`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/payments` | ADMIN, STAFF | Process payment |
| `GET` | `/api/payments` | ADMIN, STAFF | List all payments |
| `GET` | `/api/payments/{id}` | ADMIN, STAFF | Get by ID |
| `GET` | `/api/payments/booking/{bookingId}` | Any auth | Get payment for booking |
| `PATCH` | `/api/payments/{id}/refund` | ADMIN | Refund |

###  Employees — `/api/employees`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/employees` | ADMIN | Create employee |
| `GET` | `/api/employees` | ADMIN, STAFF | List all |
| `GET` | `/api/employees/active` | ADMIN, STAFF | Active only |
| `GET` | `/api/employees/{id}` | ADMIN, STAFF | Get by ID |
| `PUT` | `/api/employees/{id}` | ADMIN | Update |
| `DELETE` | `/api/employees/{id}` | ADMIN | Delete |

###  Reports — `/api/reports` (ADMIN only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/reports/dashboard` | Full dashboard stats |
| `GET` | `/api/reports/revenue?start=&end=` | Revenue report for date range |

---

## Getting Started

### Prerequisites

| Tool | Version |
|------|---------|
| Java (JDK) | 21+ |
| Apache Maven | 3.9+ |
| PostgreSQL | 14+ |

### 1. Clone / Open the Project

Open the project in IntelliJ IDEA:
`File → Open → C:\Users\Amalitech\IdeaProjects\AUCA_FINAL PROJECT FOLDER\car_wash_management_system`

### 2. Create the PostgreSQL Database

Open pgAdmin or psql and run:
```sql
CREATE DATABASE car_wash_db;
```

### 3. Configure Database Credentials

Edit `src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/car_wash_db
spring.datasource.username=postgres        # ← your PostgreSQL username
spring.datasource.password=postgres        # ← your PostgreSQL password
```

---

## Running the Application

### Option A — IntelliJ IDEA
1. Open the project
2. Right-click `CarWashApplication.java` → **Run**

### Option B — Maven (Terminal)
```bash
cd "C:\Users\Amalitech\IdeaProjects\AUCA_FINAL PROJECT FOLDER\car_wash_management_system"
mvn spring-boot:run
```

### Option C — JAR (after build)
```bash
mvn clean package -DskipTests
java -jar target/car-wash-management-system-1.0.0.jar
```

The server starts at **http://localhost:8080**

> On first start, all database tables are created automatically (`ddl-auto=update`) and the default accounts + services are seeded.

---

## Testing the API

### Via Swagger UI (Recommended)

1. Start the application
2. Open: **http://localhost:8080/swagger-ui.html**
3. To test protected endpoints:
   - Call `POST /api/auth/login` with the body below
   - Copy the `accessToken` from the response
   - Click **Authorize**  at the top of Swagger
   - Enter: `Bearer <paste-token-here>`

### Via cURL — Quick Examples

**Login:**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**Get my profile:**
```bash
curl http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer <token>"
```

**Create a booking:**
```bash
curl -X POST http://localhost:8080/api/bookings \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": 1,
    "vehicleId": 1,
    "serviceId": 2,
    "scheduledAt": "2026-03-25T09:00:00",
    "notes": "Please use eco-friendly products"
  }'
```

**Customer cancels their own booking:**
```bash
curl -X PATCH "http://localhost:8080/api/bookings/1/cancel?reason=Schedule+conflict" \
  -H "Authorization: Bearer <customer-token>"
```

**Update booking status (STAFF/ADMIN):**
```bash
curl -X PATCH "http://localhost:8080/api/bookings/1/status?status=CONFIRMED" \
  -H "Authorization: Bearer <admin-token>"
```

**Process a payment:**
```bash
curl -X POST http://localhost:8080/api/payments \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": 1,
    "paymentMethod": "MOBILE_MONEY",
    "amount": 4000,
    "mobileMoneyNumber": "+250788123456"
  }'
```

**Get dashboard stats (ADMIN):**
```bash
curl http://localhost:8080/api/reports/dashboard \
  -H "Authorization: Bearer <admin-token>"
```

---

## Default Credentials

> These are seeded automatically on the **first application startup**.

| Role | Username | Password | Use For |
|------|----------|----------|---------|
|  ADMIN | `admin` | `admin123` | Full system management |
|  STAFF | `staff1` | `staff123` | Booking & customer management |
|  CUSTOMER | `customer1` | `customer123` | Making & viewing own bookings |

---

## Pre-Seeded Services

| # | Service Name | Category | Price (RWF) | Duration |
|---|-------------|----------|-------------|----------|
| 1 | Basic Exterior Wash | Basic | 2,000 | 20 min |
| 2 | Standard Wash | Standard | 4,000 | 40 min |
| 3 | Premium Full Wash | Premium | 7,000 | 60 min |
| 4 | Interior Detailing | Detailing | 10,000 | 90 min |
| 5 | Engine Wash | Detailing | 8,000 | 45 min |
| 6 | Full Detailing Package | Detailing | 25,000 | 3 hrs |

---

## Project Structure

```
car_wash_management_system/
├── pom.xml
└── src/
    └── main/
        ├── resources/
        │   └── application.properties
        └── java/com/carwash/
            ├── CarWashApplication.java
            │
            ├── config/
            │   ├── SecurityConfig.java        ← JWT + CORS + RBAC rules
            │   ├── OpenApiConfig.java         ← Swagger UI + Bearer auth
            │   └── DataInitializer.java       ← Seeds default users & services
            │
            ├── security/
            │   ├── JwtTokenProvider.java      ← Token generation & validation
            │   └── JwtAuthenticationFilter.java ← Request interceptor
            │
            ├── model/                         ← JPA Entities
            │   ├── User.java
            │   ├── Customer.java
            │   ├── Vehicle.java
            │   ├── Service.java
            │   ├── Employee.java
            │   ├── Booking.java
            │   ├── Payment.java
            │   ├── Role.java
            │   ├── BookingStatus.java
            │   ├── PaymentMethod.java
            │   └── PaymentStatus.java
            │
            ├── repository/                    ← Spring Data JPA repos
            │   ├── UserRepository.java
            │   ├── CustomerRepository.java
            │   ├── VehicleRepository.java
            │   ├── ServiceRepository.java
            │   ├── EmployeeRepository.java
            │   ├── BookingRepository.java
            │   └── PaymentRepository.java
            │
            ├── dto/                           ← Request/Response DTOs
            │   ├── LoginRequest / RegisterRequest
            │   ├── AuthResponse
            │   ├── CustomerRequest / CustomerResponse
            │   ├── VehicleRequest / VehicleResponse
            │   ├── ServiceRequest / ServiceResponse
            │   ├── EmployeeRequest / EmployeeResponse
            │   ├── BookingRequest / BookingResponse
            │   ├── PaymentRequest / PaymentResponse
            │   └── DashboardStats
            │
            ├── service/                       ← Business Logic
            │   ├── AuthService.java
            │   ├── UserDetailsServiceImpl.java
            │   ├── CustomerService.java
            │   ├── VehicleService.java
            │   ├── WashServiceService.java
            │   ├── EmployeeService.java
            │   ├── BookingService.java        ← Cancellation + ownership
            │   ├── PaymentService.java
            │   └── ReportService.java
            │
            ├── controller/                    ← REST API Controllers
            │   ├── AuthController.java        ← register, login, /me
            │   ├── CustomerController.java
            │   ├── VehicleController.java
            │   ├── ServiceController.java
            │   ├── EmployeeController.java
            │   ├── BookingController.java     ← cancel + my-bookings
            │   ├── PaymentController.java
            │   └── ReportController.java
            │
            └── exception/
                ├── GlobalExceptionHandler.java ← Unified error responses
                └── ErrorResponse.java
```

---

## Connecting the Frontend (Lovable)

In your Lovable / React project, configure the API base URL:

```javascript
// .env
VITE_API_BASE_URL=http://localhost:8080
```

All API calls must include the JWT token:
```javascript
const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/bookings`, {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    'Content-Type': 'application/json'
  }
});
```

---

## Error Response Format

All errors return a consistent JSON structure:
```json
{
  "timestamp": "2026-03-19T10:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Booking is already cancelled",
  "validationErrors": null
}
```

---

*Built for AUCA Final Project — Car Wash Management System*

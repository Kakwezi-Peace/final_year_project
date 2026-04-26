# UML Diagrams — RUBIS Car Wash Management System
> Paste each code block into [https://www.plantuml.com/plantuml/uml/](https://www.plantuml.com/plantuml/uml/) to render the diagram.

---

## 1. Use Case Diagram

```plantuml
@startuml
left to right direction
scale 0.75
skinparam actorStyle default
skinparam packageStyle rectangle
skinparam defaultFontSize 10
skinparam padding 3
skinparam nodesep 18
skinparam ranksep 25

title RUBIS Car Wash Management System — Use Case Diagram

actor "Guest\n(Walk-in)" as Guest
actor "Customer\n(Registered)" as Customer
actor "Staff\n(Washer)" as Staff
actor "Manager" as Manager
actor "Admin\n(System Admin)" as Admin

rectangle "RUBIS Car Wash System" {

  ' Guest use cases
  usecase "Book as Guest\n(No Login)" as UC_GuestBook
  usecase "View Booking\nConfirmation" as UC_GuestConfirm
  usecase "Register Guest\nAccount" as UC_GuestRegister

  ' Customer use cases
  usecase "Register Account" as UC_Register
  usecase "Login / Logout" as UC_Login
  usecase "Create Booking" as UC_CreateBooking
  usecase "View My Bookings" as UC_ViewBookings
  usecase "Cancel Booking" as UC_CancelBooking
  usecase "Edit Booking" as UC_EditBooking
  usecase "Make Payment\n(MTN/Airtel/Cash)" as UC_Pay
  usecase "View Payment History" as UC_PayHistory
  usecase "Request Account\nDeletion" as UC_DeleteReq

  ' Staff use cases
  usecase "View Queue" as UC_Queue
  usecase "Update Booking\nStatus" as UC_UpdateStatus
  usecase "Mark Booking\nIn Progress" as UC_StartWash
  usecase "Mark Booking\nCompleted" as UC_CompleteWash

  ' Manager use cases
  usecase "Manage Employees" as UC_ManageEmp
  usecase "Assign Staff\nto Booking" as UC_Assign
  usecase "Unassign Staff" as UC_Unassign
  usecase "View Reports &\nAnalytics" as UC_Reports
  usecase "Manage Services" as UC_ManageServices
  usecase "View All Bookings" as UC_AllBookings
  usecase "View All Payments" as UC_AllPayments
  usecase "Approve Refund" as UC_Refund

  ' Admin use cases
  usecase "Manage Users\n(Roles)" as UC_ManageUsers
  usecase "Approve Customer\nDeletion" as UC_ApproveDel
  usecase "Export Reports\n(Excel / PDF)" as UC_Export
  usecase "View Dashboard\nKPIs" as UC_Dashboard
}

' Guest relationships
Guest --> UC_GuestBook
Guest --> UC_GuestConfirm
Guest --> UC_GuestRegister

' Customer relationships
Customer --> UC_Register
Customer --> UC_Login
Customer --> UC_CreateBooking
Customer --> UC_ViewBookings
Customer --> UC_CancelBooking
Customer --> UC_EditBooking
Customer --> UC_Pay
Customer --> UC_PayHistory
Customer --> UC_DeleteReq

' Staff relationships
Staff --> UC_Login
Staff --> UC_Queue
Staff --> UC_UpdateStatus
Staff --> UC_StartWash
Staff --> UC_CompleteWash

' Manager relationships
Manager --> UC_Login
Manager --> UC_ManageEmp
Manager --> UC_Assign
Manager --> UC_Unassign
Manager --> UC_Reports
Manager --> UC_ManageServices
Manager --> UC_AllBookings
Manager --> UC_AllPayments
Manager --> UC_Refund
Manager --> UC_Dashboard

' Admin relationships
Admin --> UC_Login
Admin --> UC_ManageUsers
Admin --> UC_ApproveDel 
Admin --> UC_Export
Admin --> UC_Dashboard
Admin --> UC_ManageEmp
Admin --> UC_AllBookings
Admin --> UC_AllPayments
Admin --> UC_Reports
Admin --> UC_Assign
Admin --> UC_Unassign

@enduml
```

---

## 2. Class Diagram (Domain Model)

```plantuml
@startuml
scale 0.68
left to right direction
skinparam defaultFontSize 10
skinparam classAttributeFontSize 9
skinparam padding 3
skinparam nodesep 35
skinparam ranksep 45
skinparam classBackgroundColor #FEFEFE
skinparam classBorderColor #333333
skinparam classArrowColor #222222
skinparam classFontColor #000000
skinparam classAttributeFontColor #111111
skinparam classFontStyle bold
hide circle

title RUBIS Car Wash — Class / Entity Diagram

enum Role {
  ADMIN
  MANAGER
  STAFF
  CUSTOMER
}

enum BookingStatus {
  PENDING
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum PaymentStatus {
  PENDING
  PAID
  PARTIALLY_PAID
  REFUND_REQUESTED
  REFUNDED
  FAILED
}

enum PaymentMethod {
  CASH
  MOBILE_MONEY
  MTN_MOMO
  AIRTEL_MONEY
}

class User {
  - Long id
  - String username
  - String password
  - String fullName
  - String email
  - String phone
  - Role role
  - boolean enabled
  - boolean isGuest
  - LocalDateTime createdAt
  - LocalDateTime updatedAt
  + getAuthorities()
}

class Customer {
  - Long id
  - String firstName
  - String lastName
  - String email
  - String phone
  - String address
  - String nationalId
  - boolean deletionRequested
  - LocalDateTime deletionRequestedAt
  - LocalDateTime registeredAt
  + getFullName() : String
}

class Employee {
  - Long id
  - String firstName
  - String lastName
  - String email
  - String phone
  - String position
  - String nationalId
  - LocalDateTime hireDate
  - boolean active
  - LocalDateTime statusChangedAt
  - LocalDateTime expectedReturnDate
  - LocalDateTime createdAt
  + getFullName() : String
}

class Vehicle {
  - Long id
  - String licensePlate
  - String make
  - String model
  - Integer year
  - String color
  - String vehicleType
  - LocalDateTime createdAt
}

class Service {
  - Long id
  - String name
  - String description
  - BigDecimal price
  - Integer durationMinutes
  - String category
  - boolean active
  - LocalDateTime createdAt
  - LocalDateTime updatedAt
}

class Booking {
  - Long id
  - String bookingReference
  - BookingStatus status
  - LocalDateTime scheduledAt
  - LocalDateTime startedAt
  - LocalDateTime completedAt
  - BigDecimal totalAmount
  - String notes
  - boolean isGuest
  - String guestName
  - String guestPhone
  - String guestVehiclePlate
  - LocalDateTime createdAt
  - LocalDateTime updatedAt
}

class Payment {
  - Long id
  - String transactionReference
  - BigDecimal amount
  - PaymentMethod paymentMethod
  - PaymentStatus status
  - String mobileMoneyNumber
  - String receiptNumber
  - LocalDateTime paidAt
  - String notes
  - BigDecimal refundAmount
  - LocalDateTime refundedAt
  - LocalDateTime createdAt
  - LocalDateTime updatedAt
}

' Relationships
User "1" -- "0..1" Customer : has profile >
User "1" -- "0..1" Employee : has profile >

Customer "1" *-- "0..*" Vehicle : owns >
Customer "1" *-- "0..*" Booking : makes >

Vehicle "1" -- "0..*" Booking : used in >

Service "1" -- "0..*" Booking : primary service >
Service "0..*" -- "0..*" Booking : additional services >

Employee "0..1" -- "0..*" Booking : assigned to >

Booking "1" *-- "0..1" Payment : has >

Booking ..> BookingStatus
Payment ..> PaymentStatus
Payment ..> PaymentMethod
User ..> Role

@enduml
```

---

## 3. Entity Relationship Diagram (Database Structure)

```plantuml
@startuml
scale 0.62
left to right direction
skinparam defaultFontSize 9
skinparam defaultFontColor #000000
skinparam arrowColor #222222
skinparam padding 3
skinparam nodesep 30
skinparam ranksep 40
skinparam entity {
  BackgroundColor #FFFFFF
  BorderColor #333333
  FontColor #000000
  FontSize 10
  FontStyle bold
  AttributeFontColor #000000
  AttributeFontSize 9
}

title RUBIS Car Wash — Entity Relationship Diagram

entity "users" as users {
  * id : BIGINT <<PK>>
  --
  * username : VARCHAR UNIQUE
  * password : VARCHAR
  * full_name : VARCHAR
  * email : VARCHAR UNIQUE
  phone : VARCHAR
  * role : ENUM(ADMIN,MANAGER,STAFF,CUSTOMER)
  * enabled : BOOLEAN
  * is_guest : BOOLEAN DEFAULT false
  created_at : TIMESTAMP
  updated_at : TIMESTAMP
}

entity "customers" as customers {
  * id : BIGINT <<PK>>
  --
  user_id : BIGINT <<FK>>
  * first_name : VARCHAR
  * last_name : VARCHAR
  email : VARCHAR UNIQUE
  phone : VARCHAR
  address : VARCHAR
  national_id : VARCHAR
  deletion_requested : BOOLEAN DEFAULT false
  deletion_requested_at : TIMESTAMP
  registered_at : TIMESTAMP
}

entity "employees" as employees {
  * id : BIGINT <<PK>>
  --
  user_id : BIGINT <<FK>>
  * first_name : VARCHAR
  * last_name : VARCHAR
  email : VARCHAR UNIQUE
  phone : VARCHAR
  position : VARCHAR
  national_id : VARCHAR
  hire_date : TIMESTAMP
  active : BOOLEAN DEFAULT true
  status_changed_at : TIMESTAMP
  expected_return_date : TIMESTAMP
  created_at : TIMESTAMP
}

entity "vehicles" as vehicles {
  * id : BIGINT <<PK>>
  --
  * customer_id : BIGINT <<FK>>
  * license_plate : VARCHAR UNIQUE
  * make : VARCHAR
  * model : VARCHAR
  year : INTEGER
  color : VARCHAR
  vehicle_type : VARCHAR
  created_at : TIMESTAMP
}

entity "services" as services {
  * id : BIGINT <<PK>>
  --
  * name : VARCHAR UNIQUE
  description : TEXT
  * price : DECIMAL(10,2)
  duration_minutes : INTEGER
  category : VARCHAR
  active : BOOLEAN DEFAULT true
  created_at : TIMESTAMP
  updated_at : TIMESTAMP
}

entity "bookings" as bookings {
  * id : BIGINT <<PK>>
  --
  * booking_reference : VARCHAR UNIQUE
  customer_id : BIGINT <<FK>>
  vehicle_id : BIGINT <<FK>>
  * service_id : BIGINT <<FK>>
  assigned_employee_id : BIGINT <<FK>>
  * status : ENUM(PENDING,CONFIRMED,IN_PROGRESS,COMPLETED,CANCELLED)
  * scheduled_at : TIMESTAMP
  started_at : TIMESTAMP
  completed_at : TIMESTAMP
  * total_amount : DECIMAL(10,2)
  notes : VARCHAR(500)
  is_guest : BOOLEAN DEFAULT false
  guest_name : VARCHAR(200)
  guest_phone : VARCHAR(30)
  guest_vehicle_plate : VARCHAR(50)
  created_at : TIMESTAMP
  updated_at : TIMESTAMP
}

entity "booking_additional_services" as bas {
  * booking_id : BIGINT <<FK>>
  * service_id  : BIGINT <<FK>>
}

entity "payments" as payments {
  * id : BIGINT <<PK>>
  --
  * booking_id : BIGINT <<FK>> UNIQUE
  * transaction_reference : VARCHAR UNIQUE
  * amount : DECIMAL(10,2)
  * payment_method : ENUM(CASH,MOBILE_MONEY,MTN_MOMO,AIRTEL_MONEY,CARD,BANK_TRANSFER)
  * status : ENUM(PENDING,PAID,PARTIALLY_PAID,REFUND_REQUESTED,REFUNDED,FAILED)
  mobile_money_number : VARCHAR
  receipt_number : VARCHAR
  paid_at : TIMESTAMP
  notes : VARCHAR(500)
  refund_amount : DECIMAL(10,2)
  refunded_at : TIMESTAMP
  created_at : TIMESTAMP
  updated_at : TIMESTAMP
}

' FK Relationships
users ||--o| customers : "user_id"
users ||--o| employees : "user_id"
customers ||--o{ vehicles : "customer_id"
customers ||--o{ bookings : "customer_id"
vehicles ||--o{ bookings : "vehicle_id"
services ||--o{ bookings : "service_id"
employees ||--o{ bookings : "assigned_employee_id"
bookings ||--o{ bas : "booking_id"
services ||--o{ bas : "service_id"
bookings ||--o| payments : "booking_id"

@enduml
```

---

## 4. Sequence Diagram — Guest Booking Flow

```plantuml
@startuml
scale 0.8
skinparam defaultFontSize 9
skinparam padding 2
skinparam sequenceMessageAlign left
skinparam maxMessageSize 120
skinparam sequenceBoxPadding 4
skinparam ParticipantPadding 15

title Sequence Diagram — Guest Books a Wash (No Login)

actor "Guest User" as Guest
participant "Home Page\n(React)" as Home
participant "GuestBooking\n(React Page)" as GB
participant "BookingController\n(Spring REST)" as BC
participant "BookingService\n(Spring)" as BS
participant "ServiceRepository\n(JPA)" as SR
participant "BookingRepository\n(JPA)" as BR
database "PostgreSQL\nDatabase" as DB

Guest -> Home : Clicks "Book Now" (no login)
Home -> GB : Navigate to /guest-booking
GB -> SR : GET /api/services
SR -> DB : SELECT * FROM services WHERE active=true
DB --> SR : services list
SR --> GB : List<ServiceResponse>
GB --> Guest : Show service selection form

Guest -> GB : Fills name, phone, plate,\nselects services, picks date
Guest -> GB : Clicks "Confirm Booking"
GB -> BC : POST /api/bookings/guest\n{guestName, guestPhone,\nguestVehiclePlate, serviceId, scheduledAt}
BC -> BS : createGuestBooking(GuestBookingRequest)
BS -> SR : findById(serviceId)
SR -> DB : SELECT * FROM services WHERE id=?
DB --> SR : Service entity
SR --> BS : Service
BS -> BR : save(new Booking{isGuest=true, ...})
BR -> DB : INSERT INTO bookings (booking_reference, is_guest=true, ...)
DB --> BR : saved Booking
BR --> BS : BookingResponse
BS --> BC : BookingResponse
BC --> GB : 201 Created + BookingResponse
GB --> Guest : Show confirmation screen\n(booking reference, amount, date)

@enduml
```

---

## 5. Sequence Diagram — Customer Login & Create Booking

```plantuml
@startuml
scale 0.75
skinparam defaultFontSize 9
skinparam padding 2
skinparam sequenceMessageAlign left
skinparam maxMessageSize 120
skinparam ParticipantPadding 15

title Sequence Diagram — Registered Customer Login & Book

actor "Customer" as C
participant "Login Page\n(React)" as LP
participant "Dashboard\n(React)" as D
participant "BookingModal\n(React)" as BM
participant "AuthController" as AC
participant "AuthService" as AS
participant "JwtTokenProvider" as JWT
participant "BookingController" as BC
participant "BookingService" as BS
database "Database" as DB

C -> LP : Enter username + password
LP -> AC : POST /api/auth/login\n{username, password}
AC -> AS : login(LoginRequest)
AS -> DB : SELECT * FROM users WHERE username=?
DB --> AS : User entity
AS -> AS : validatePassword(BCrypt)
AS -> JWT : generateToken(user)
JWT --> AS : JWT access token
AS --> AC : AuthResponse{accessToken, role}
AC --> LP : 200 OK + token
LP -> LP : store token in localStorage
LP -> AC : GET /api/auth/me
AC -> DB : SELECT user by JWT subject
DB --> AC : User profile
AC --> D : UserProfile{fullName, role}
D --> C : Redirect to Dashboard

C -> D : Clicks "+ Book Now"
D -> BM : Open BookingModal
BM -> BC : GET /api/services
BC -> DB : SELECT * FROM services WHERE active=true
DB --> BC : services
BC --> BM : List<ServiceResponse>
BM --> C : Show service/date form

C -> BM : Select service, date, notes
C -> BM : Clicks "Confirm Booking"
BM -> BC : POST /api/bookings\n{serviceId, scheduledAt, notes}\n[Authorization: Bearer JWT]
BC -> BS : createBooking(BookingRequest, currentUser)
BS -> DB : SELECT customer by user_id
BS -> DB : INSERT INTO bookings (customer_id, service_id, ...)
DB --> BS : Booking saved
BS --> BC : BookingResponse
BC --> BM : 201 Created + BookingResponse
BM --> C : Show "Booking Confirmed" + reference

@enduml
```

---

## 6. Sequence Diagram — Admin Assigns Staff to Booking

```plantuml
@startuml
scale 0.8
skinparam defaultFontSize 9
skinparam padding 2
skinparam sequenceMessageAlign left
skinparam maxMessageSize 120
skinparam ParticipantPadding 15

title Sequence Diagram — Admin/Manager Assigns Staff to Booking

actor "Admin / Manager" as A
participant "Customers Page\n(React)" as CP
participant "BookingController" as BC
participant "BookingService" as BS
participant "EmployeeRepository" as ER
participant "BookingRepository" as BR
database "Database" as DB

A -> CP : Opens Customers page
A -> CP : Clicks "+ Assign" on a customer row
CP -> ER : GET /api/employees/active
ER -> DB : SELECT * FROM employees WHERE active=true
DB --> ER : active employees list
ER --> CP : List<EmployeeResponse>
CP --> A : Show staff dropdown

A -> CP : Selects an employee
CP -> BC : PATCH /api/bookings/{bookingId}/assign-employee/{employeeId}\n[Authorization: Bearer JWT]
BC -> BS : assignEmployee(bookingId, employeeId)
BS -> BR : findById(bookingId)
BR -> DB : SELECT * FROM bookings WHERE id=?
DB --> BR : Booking entity
BR --> BS : Booking
BS -> ER : findById(employeeId)
ER -> DB : SELECT * FROM employees WHERE id=?
DB --> ER : Employee entity
ER --> BS : Employee
BS -> BS : booking.setAssignedEmployee(employee)
BS -> BR : save(booking)
BR -> DB : UPDATE bookings SET assigned_employee_id=? WHERE id=?
DB --> BR : updated Booking
BR --> BS : BookingResponse
BS --> BC : BookingResponse
BC --> CP : 200 OK + updated BookingResponse
CP --> A : Dropdown closes, staff badge updated in table

@enduml
```

---

## 7. Sequence Diagram — Payment Flow (Mobile Money)

```plantuml
@startuml
scale 0.8
skinparam defaultFontSize 9
skinparam padding 2
skinparam sequenceMessageAlign left
skinparam maxMessageSize 120
skinparam ParticipantPadding 15

title Sequence Diagram — Customer Makes Mobile Money Payment

actor "Customer" as C
participant "BookingModal\n(React)" as BM
participant "PaymentController" as PC
participant "PaymentService" as PS
participant "BookingRepository" as BR
participant "PaymentRepository" as PR
database "Database" as DB

C -> BM : Clicks "Pay Now" on a booking
BM --> C : Show payment step (provider selection)
C -> BM : Selects MTN MoMo / Airtel Money
BM --> C : Show USSD code + instructions\n(*182*1*1*0783672723*AMOUNT# for MTN)
C -> C : Dials USSD code on phone\nand completes mobile money transfer
C -> BM : Enters phone number + confirms
BM -> PC : POST /api/payments\n{bookingId, paymentMethod:MTN_MOMO,\nmobileMoneyNumber, amount}\n[Authorization: Bearer JWT]
PC -> PS : processPayment(PaymentRequest)
PS -> BR : findById(bookingId)
BR -> DB : SELECT * FROM bookings WHERE id=?
DB --> BR : Booking entity
BR --> PS : Booking
PS -> PS : validate amount matches booking.totalAmount
PS -> PR : save(new Payment{\nstatus=PAID, paymentMethod=MTN_MOMO,\npaidAt=now(), transactionReference=TXN-...})
PR -> DB : INSERT INTO payments (booking_id, amount, status=PAID, ...)
DB --> PR : Payment saved
PR --> PS : Payment entity
PS -> BR : save(booking) [status stays CONFIRMED]
BR -> DB : UPDATE bookings
DB --> BR : updated
PS --> PC : PaymentResponse
PC --> BM : 201 Created + PaymentResponse
BM --> C : Show "Payment Confirmed" receipt

@enduml
```

---

## 8. Activity Diagram — Booking Lifecycle

```plantuml
@startuml
scale 0.75
skinparam defaultFontSize 9
skinparam defaultFontColor #000000
skinparam ActivityBackgroundColor #FFFFFF
skinparam ActivityBorderColor #333333
skinparam ActivityFontColor #000000
skinparam ActivityFontSize 9
skinparam ActivityDiamondBackgroundColor #FFFFFF
skinparam ActivityDiamondBorderColor #333333
skinparam ActivityDiamondFontColor #000000
skinparam ArrowColor #333333
skinparam padding 2
skinparam nodesep 15
skinparam ranksep 20

title Activity Diagram — Booking Lifecycle

start
:Customer or Guest submits Booking;
:System generates Booking Reference (CW-YYYYMMDD-XXXX);
:Booking set to PENDING;

if (Customer cancels?) then (yes)
  :Booking set to CANCELLED;
  if (Payment already made?) then (yes)
    :Trigger Refund (10% fee deducted);
    :Admin approves refund;
    :Payment set to REFUNDED;
  else (no)
    :No payment action needed;
  endif
  stop
else (no)
  :Admin or Manager reviews and assigns Staff;
  :Booking set to CONFIRMED;
endif

:Staff receives booking in Queue;
:Staff starts wash — Booking set to IN_PROGRESS;
:Wash completed — Booking set to COMPLETED;
:completedAt recorded;

if (Payment not yet made?) then (yes)
  :Customer pays via cash or Mobile Money;
  :Admin records payment;
  :Payment set to PAID;
else (already paid)
  :Payment already confirmed;
endif

:Send confirmation to Customer;
:Booking archived in history;
stop

@enduml
```

---

## 9. Activity Diagram — User Registration & Login

```plantuml
@startuml
scale 0.50
skinparam defaultFontSize 13
skinparam defaultFontColor #000000
skinparam ActivityBackgroundColor #FFFFFF
skinparam ActivityBorderColor #333333
skinparam ActivityFontColor #000000
skinparam ActivityFontSize 13
skinparam ActivityFontStyle bold
skinparam ActivityDiamondBackgroundColor #FFFFFF
skinparam ActivityDiamondBorderColor #333333
skinparam ActivityDiamondFontColor #000000
skinparam ActivityDiamondFontSize 12
skinparam ActivityDiamondFontStyle bold
skinparam ArrowColor #333333
skinparam SwimlaneBorderColor #555555
skinparam SwimlaneTitleFontColor #000000
skinparam SwimlaneTitleFontSize 13
skinparam SwimlaneTitleFontStyle bold
skinparam padding 2
skinparam nodesep 12
skinparam ranksep 18

title Activity Diagram — User Registration and Authentication

|Customer|
start
:Visit RUBIS Website;
:Click "Create Account";
:Fill Registration Form (name, email, phone, password);

|System (Backend)|
:Receive RegisterRequest;
:Validate input fields;
if (Email or Username already exists?) then (yes)
  :Return 400 Conflict Error;
  |Customer|
  :Show error message;
  stop
else (no)
  :Hash password with BCrypt;
  :Create User record (role=CUSTOMER);
  :Create Customer profile record;
  :Return 201 Created with JWT token;
endif

|Customer|
:Redirected to Dashboard;
:See personal booking history;
:Click Book Now;

|System (Backend)|
:Validate JWT Token;
:Extract user role from token;
if (Role is CUSTOMER?) then (yes)
  :Allow booking creation;
  :Save booking to DB;
  :Return BookingResponse;
else (ADMIN/MANAGER/STAFF)
  :Show admin dashboard;
endif

|Customer|
:Booking confirmed on screen;
stop

@enduml
```

---

## 10. Activity Diagram — Admin Dashboard Operations

```plantuml
@startuml
scale 0.8
skinparam defaultFontSize 9
skinparam padding 2
skinparam ActivityDiamondFontSize 9
skinparam ArrowFontSize 8

title Activity Diagram — Admin / Manager Daily Operations

start

:Admin logs in;
:View Dashboard KPIs\n(Today's cars, Revenue,\nQueue length, Total customers);

fork
  :Review Pending Bookings;
  :Assign staff to each booking;
  :Confirm bookings;
fork again
  :Check Current Queue;
  :Monitor IN_PROGRESS washes;
fork again
  :View Analytics Page;
  :Check 7-Day Processing Volume;
  :Review Daily Performance Breakdown;
  :Download daily Excel report;
fork again
  :Review Guest Bookings;
  :Assign staff if needed;
  :Delete expired guest bookings;
fork again
  :Manage Employees;
  if (New employee?) then (yes)
    :Create employee record;
    :Create login account (optional);
  else (existing)
    :Update active/inactive status;
    :Set expected return date;
  endif
fork again
  :Process Payments;
  :Record Cash / MoMo payments;
  :Approve refund requests;
  :Generate payment reports;
end fork

:End of day review;
:Export Excel / PDF reports;

stop

@enduml
```

---

## 11. Component Diagram — System Architecture

```plantuml
@startuml
scale 0.6
skinparam defaultFontSize 8
skinparam padding 2
skinparam nodesep 12
skinparam ranksep 18
skinparam componentStyle rectangle

title Component Diagram — RUBIS Car Wash System Architecture

package "Frontend (React + Vite)" {
  [Login / Register Pages] as AUTH_UI
  [Customer Dashboard] as CUST_DASH
  [Admin / Manager Dashboard] as ADMIN_DASH
  [Guest Booking Page] as GUEST_UI
  [Customers Page] as CUST_PAGE
  [Queue & Schedule Page] as QUEUE_UI
  [Analytics Page] as ANALYTICS_UI
  [Payments Page] as PAY_UI
  [Employees Page] as EMP_UI
  [BookingModal Component] as BM_COMP
  [Navbar / Sidebar] as NAV
  [WeatherWidget] as WEATHER
  [Pagination Component] as PAGING
}

package "Backend (Spring Boot)" {
  package "Security Layer" {
    [JwtTokenProvider] as JWT
    [JwtAuthenticationFilter] as JWT_FILTER
    [SecurityConfig] as SEC_CFG
    [UserDetailsServiceImpl] as UDS
  }
  package "REST Controllers" {
    [AuthController] as AC
    [BookingController] as BC
    [CustomerController] as CC
    [EmployeeController] as EC
    [PaymentController] as PC
    [ServiceController] as SVC_CTRL
    [VehicleController] as VC
    [ReportController] as RC
    [DashboardController] as DC
  }
  package "Service Layer" {
    [AuthService] as AS
    [BookingService] as BS
    [CustomerService] as CS
    [EmployeeService] as ES
    [PaymentService] as PS
    [WashServiceService] as WSS
    [ReportService] as RS
    [GuestCleanupService] as GCS
    [NotificationService] as NS
  }
  package "Repository Layer (JPA)" {
    [BookingRepository] as BR
    [CustomerRepository] as CR
    [EmployeeRepository] as ER
    [PaymentRepository] as PR
    [ServiceRepository] as SR
    [UserRepository] as UR
    [VehicleRepository] as VR
  }
}

database "PostgreSQL" as DB {
  [users]
  [customers]
  [employees]
  [bookings]
  [payments]
  [services]
  [vehicles]
  [booking_additional_services]
}

' Frontend → Backend (REST API via axios)
AUTH_UI --> AC : POST /api/auth/login\nPOST /api/auth/register
GUEST_UI --> BC : POST /api/bookings/guest
CUST_DASH --> BC : GET/POST /api/bookings/my-bookings
CUST_DASH --> PC : GET /api/payments/my-payments
ADMIN_DASH --> DC : GET /api/reports/dashboard
CUST_PAGE --> CC : GET/POST/PUT/DELETE /api/customers
CUST_PAGE --> BC : PATCH /api/bookings/{id}/assign-employee
QUEUE_UI --> BC : GET /api/bookings?status=...
ANALYTICS_UI --> RC : GET /api/reports/daily-peaks
PAY_UI --> PC : GET/POST /api/payments
EMP_UI --> EC : GET/POST/PUT /api/employees
BM_COMP --> SVC_CTRL : GET /api/services
BM_COMP --> BC : POST /api/bookings

' Security chain
JWT_FILTER --> JWT : validateToken()
JWT_FILTER --> UDS : loadUserByUsername()
SEC_CFG --> JWT_FILTER : registers filter

' Controllers → Services
AC --> AS
BC --> BS
CC --> CS
EC --> ES
PC --> PS
SVC_CTRL --> WSS
RC --> RS
DC --> RS

' Services → Repositories
AS --> UR
BS --> BR
BS --> CR
BS --> SR
BS --> ER
CS --> CR
ES --> ER
PS --> PR
PS --> BR
RS --> BR
RS --> PR
GCS --> BR

' Repositories → DB
BR --> DB
CR --> DB
ER --> DB
PR --> DB
SR --> DB
UR --> DB
VR --> DB

@enduml
```

---

## 12. State Machine Diagram — Booking Status Transitions

```plantuml
@startuml
scale 0.85
skinparam defaultFontSize 9
skinparam padding 3
skinparam nodesep 20
skinparam ranksep 25

title State Machine — Booking Status Transitions

[*] --> PENDING : Booking created\n(customer or guest)

PENDING --> CONFIRMED : Admin/Manager\nconfirms & assigns staff
PENDING --> CANCELLED : Customer cancels\nbefore confirmation

CONFIRMED --> IN_PROGRESS : Staff starts wash
CONFIRMED --> CANCELLED : Customer or Admin\ncancels before start

IN_PROGRESS --> COMPLETED : Wash finished\n(completedAt recorded)
IN_PROGRESS --> CANCELLED : Emergency cancel\n(rare)

COMPLETED --> [*] : Booking archived

CANCELLED --> [*] : Refund triggered\nif payment exists

note right of PENDING
  bookingReference generated
  totalAmount calculated
  notification sent
end note

note right of IN_PROGRESS
  startedAt = now()
  assigned employee notified
end note

note right of COMPLETED
  completedAt = now()
  payment can be recorded
end note

@enduml
```

---

## 13. State Machine Diagram — Payment Status Transitions

```plantuml
@startuml
scale 0.85
skinparam defaultFontSize 9
skinparam padding 3
skinparam nodesep 20
skinparam ranksep 25

title State Machine — Payment Status Transitions

[*] --> PENDING : Payment record created\nwith booking

PENDING --> PAID : Customer pays\n(Cash / MoMo / Card)
PENDING --> FAILED : Payment declined\nor timed out
PENDING --> PARTIALLY_PAID : Partial cash\npayment received

PARTIALLY_PAID --> PAID : Remaining balance paid

PAID --> REFUND_REQUESTED : Customer cancels\nbooking after paying

REFUND_REQUESTED --> REFUNDED : Admin approves refund\n(minus 10% cancellation fee)
REFUND_REQUESTED --> PAID : Admin rejects refund\nrequest

REFUNDED --> [*]
PAID --> [*]
FAILED --> [*]

@enduml
```

---

## 14. Deployment Diagram

```plantuml
@startuml
scale 0.8
skinparam defaultFontSize 9
skinparam padding 3
skinparam nodesep 25
skinparam ranksep 30

title Deployment Diagram — RUBIS Car Wash System

node "Client Browser\n(Customer / Admin / Staff)" as BROWSER {
  component "React SPA\n(Vite Build)" as REACT
}

node "Application Server\n(e.g. Railway / Render / VPS)" as APP_SERVER {
  component "Spring Boot JAR\n(Java 17)" as SPRING
  component "Embedded Tomcat\nPort: 8080" as TOMCAT
  SPRING --> TOMCAT
}

node "Database Server\n(PostgreSQL)" as DB_SERVER {
  database "rubis_carwash_db\n(PostgreSQL 15)" as PGDB {
    [users]
    [customers]
    [employees]
    [bookings]
    [payments]
    [services]
    [vehicles]
  }
}

node "Static Asset Host\n(CDN / Nginx)" as STATIC {
  component "/assets/rubis-logo.webp" as LOGO
}

BROWSER --> APP_SERVER : HTTPS REST API\n/api/**\n(JSON + JWT)
BROWSER --> STATIC : HTTPS\nstatic files (JS, CSS, images)
APP_SERVER --> DB_SERVER : JDBC / Hibernate\nPort: 5432

note right of BROWSER
  Axios HTTP client
  JWT stored in localStorage
  React Router for navigation
end note

note right of APP_SERVER
  Spring Security (JWT filter)
  Swagger UI: /swagger-ui.html
  CORS configured for frontend origin
end note

@enduml
```

---

## 15. Sequence Diagram — Staff Updates Booking Status (Queue)

```plantuml
@startuml
scale 0.8
skinparam defaultFontSize 9
skinparam padding 2
skinparam sequenceMessageAlign left
skinparam maxMessageSize 120
skinparam ParticipantPadding 15

title Sequence Diagram — Staff Updates Booking in Queue

actor "Staff Member" as S
participant "Queue Page\n(React)" as QP
participant "BookingController" as BC
participant "BookingService" as BS
participant "BookingRepository" as BR
database "Database" as DB

S -> QP : Opens Queue & Schedule page
QP -> BC : GET /api/bookings?status=CONFIRMED\n[Authorization: Bearer JWT]
BC -> BS : getAllBookings(pageable)
BS -> BR : findAll(pageable)
BR -> DB : SELECT * FROM bookings WHERE status IN\n('PENDING','CONFIRMED','IN_PROGRESS')
DB --> BR : List<Booking>
BR --> BS : Page<Booking>
BS --> BC : Page<BookingResponse>
BC --> QP : 200 OK + bookings list
QP --> S : Show queue table

S -> QP : Finds customer's booking\nClicks "Start Wash"
QP -> BC : PATCH /api/bookings/{id}/status?status=IN_PROGRESS\n[Authorization: Bearer JWT]
BC -> BS : updateStatus(bookingId, IN_PROGRESS)
BS -> BR : findById(id)
BR -> DB : SELECT * FROM bookings WHERE id=?
DB --> BR : Booking entity
BR --> BS : Booking
BS -> BS : booking.setStatus(IN_PROGRESS)\nbooking.setStartedAt(now())
BS -> BR : save(booking)
BR -> DB : UPDATE bookings SET status='IN_PROGRESS',\nstarted_at=now() WHERE id=?
DB --> BR : updated Booking
BS --> BC : BookingResponse
BC --> QP : 200 OK + updated BookingResponse
QP --> S : Row updated to "IN PROGRESS" badge

S -> QP : Clicks "Complete Wash"
QP -> BC : PATCH /api/bookings/{id}/status?status=COMPLETED
BC -> BS : updateStatus(bookingId, COMPLETED)
BS -> BS : booking.setStatus(COMPLETED)\nbooking.setCompletedAt(now())
BS -> BR : save(booking)
BR -> DB : UPDATE bookings SET status='COMPLETED',\ncompleted_at=now()
DB --> BR : updated
BS --> BC : BookingResponse
BC --> QP : 200 OK
QP --> S : Row shows COMPLETED

@enduml
```

---

## 16. Figure 1 — Traditional Car Wash Process (As-Is Flow)

```plantuml
@startuml
scale 0.72
skinparam defaultFontSize 10
skinparam defaultFontColor #000000
skinparam ActivityBackgroundColor #FFFFFF
skinparam ActivityBorderColor #333333
skinparam ActivityFontColor #000000
skinparam ActivityFontSize 10
skinparam ActivityFontStyle bold
skinparam ActivityDiamondBackgroundColor #FFFFFF
skinparam ActivityDiamondBorderColor #333333
skinparam ActivityDiamondFontColor #000000
skinparam ActivityDiamondFontStyle bold
skinparam ArrowColor #333333
skinparam SwimlaneBorderColor #555555
skinparam SwimlaneTitleFontColor #000000
skinparam SwimlaneTitleFontSize 10
skinparam SwimlaneTitleFontStyle bold
skinparam padding 3
skinparam nodesep 12
skinparam ranksep 18

title Traditional Car Wash Management Process\nAs-Is Process Flow at RUBIS Station

|Customer|
start
:Step 1 - Customer Arrival\nDrives in and verbally requests a car wash service.\nNo advance booking possible;

|Receptionist|
:Step 2 - Manual Registration\nRecords license plate, service type and customer name\nin a paper logbook (15-20 minutes per transaction);
:Step 3 - Service Assignment\nVerbally assigns vehicle to available wash worker\nbased on visual observation. No queue tracking;

|Staff Member|
:Step 4 - Service Execution\nPerforms the car wash service.\nNo start or end times tracked.\nNo customer notifications sent;
:Step 5 - Service Completion\nVerbally notifies receptionist that vehicle is ready;

|Receptionist|
:Calls out or walks to notify the customer;

|Customer|
:Step 6 - Payment Collection\nPays in cash at reception counter;

|Receptionist|
:Records payment manually in a separate cash ledger.\nNo digital receipt issued;
:Step 7 - Record Update\nUpdates paper logbook to mark service as completed.\nNo data analysis or customer follow-up;

stop

@enduml
```

---

## 18. System Architecture Design (Figure 7 — Layered View)

```plantuml
@startuml
scale 0.78
skinparam defaultFontSize 11
skinparam defaultFontColor #000000
skinparam rectangleFontSize 11
skinparam rectangleFontColor #000000
skinparam rectangleFontStyle bold
skinparam rectangleBackgroundColor #FFFFFF
skinparam rectangleBorderColor #333333
skinparam arrowColor #333333
skinparam padding 4
skinparam nodesep 20
skinparam ranksep 25

title System Architecture Design\nRUBIS Car Wash Management System

rectangle "LAYER 1 — Presentation Layer" as L1 #E8F4FD {
  rectangle "React.js + Vite (JavaScript)" as FE #FFFFFF
  rectangle "Pages: Dashboard, Queue, Bookings,\nPayments, Customers, Analytics" as PAGES #FFFFFF
  rectangle "Axios HTTP Client" as AXIOS #FFFFFF
}

rectangle "LAYER 2 — Security Layer" as L2 #FEF9E7 {
  rectangle "Spring Security + JWT Filter" as SEC #FFFFFF
  rectangle "Role-Based Access Control\n(ADMIN / MANAGER / STAFF / CUSTOMER)" as RBAC #FFFFFF
  rectangle "BCrypt Password Hashing" as BCRYPT #FFFFFF
}

rectangle "LAYER 3 — API Controller Layer" as L3 #E8F8F5 {
  rectangle "AuthController | BookingController\nCustomerController | EmployeeController\nPaymentController | ReportController" as CTRL #FFFFFF
}

rectangle "LAYER 4 — Business Logic Layer" as L4 #FEF3F3 {
  rectangle "BookingService | PaymentService\nCustomerService | ReportService\nEmployeeService | GuestCleanupService" as SVC #FFFFFF
}

rectangle "LAYER 5 — Data Access Layer" as L5 #F5EEF8 {
  rectangle "Spring Data JPA + Hibernate ORM" as JPA #FFFFFF
  rectangle "BookingRepository | PaymentRepository\nUserRepository | CustomerRepository\nEmployeeRepository | VehicleRepository" as REPO #FFFFFF
}

rectangle "LAYER 6 — Data Storage Layer" as L6 #EAFAF1 {
  rectangle "PostgreSQL Database\nusers | customers | employees\nbookings | payments | vehicles | services" as DB #FFFFFF
}

L1 -down-> L2 : HTTPS REST requests
L2 -down-> L3 : Authenticated requests
L3 -down-> L4 : Business logic calls
L4 -down-> L5 : Data operations
L5 -down-> L6 : SQL via Hibernate

@enduml
```

---

*Generated for RUBIS Car Wash Management System — AUCA Final Year Project*
*All diagrams reflect the actual implementation: Spring Boot backend + React/Vite frontend + PostgreSQL.*

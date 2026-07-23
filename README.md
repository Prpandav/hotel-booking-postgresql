# Hotel Booking System

A simple full-stack hotel booking application built to learn PostgreSQL from basic to advanced concepts.

## Tech Stack

* React
* Node.js
* Express
* PostgreSQL
* Raw SQL with `pg`

## Features

* Customer management
* Room management
* Room availability search
* Booking creation and cancellation
* Partial and full payments
* Refunds
* Check-in and check-out
* Booking status history
* Revenue and occupancy analytics
* Full-text search
* Audit logs
* PostgreSQL roles and Row-Level Security

## Project Structure

```text
hotel-booking-system/
├── backend/
├── frontend/
├── .gitignore
├── package-lock.json
├── package.json
└── README.md
```

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/hotel-booking-postgresql.git
cd hotel-booking-postgresql
```

### 2. Install dependencies

```bash
npm install
npm --prefix backend install
npm --prefix frontend install
```

### 3. Configure the backend

Create:

```text
backend/.env
```

Add:

```env
PORT=5000
DATABASE_URL=postgresql://hotel_app:YOUR_PASSWORD@localhost:5432/hotel_booking
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### 4. Configure the frontend

Create:

```text
frontend/.env
```

Add:

```env
VITE_API_URL=http://localhost:5000/api
```

### 5. Run database files

From the `backend` folder:

```bash
psql -U hotel_app -d hotel_booking -h localhost -f database/schema.sql
psql -U hotel_app -d hotel_booking -h localhost -f database/seed.sql
psql -U hotel_app -d hotel_booking -h localhost -f database/booking_phase.sql
psql -U hotel_app -d hotel_booking -h localhost -f database/payment_phase.sql
psql -U hotel_app -d hotel_booking -h localhost -f database/checkin_phase.sql
psql -U hotel_app -d hotel_booking -h localhost -f database/views.sql
psql -U hotel_app -d hotel_booking -h localhost -f database/triggers.sql
psql -U hotel_app -d hotel_booking -h localhost -f database/analytics.sql
psql -U hotel_app -d hotel_booking -h localhost -f database/search.sql
psql -U hotel_app -d hotel_booking -h localhost -f database/audit.sql
```

Run security setup as PostgreSQL administrator:

```bash
psql -U postgres -d hotel_booking -h localhost -f database/security.sql
```

## Run the Application

From the project root:

```bash
npm run dev
```

Open:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:5000
```

## Main API Routes

```text
/api/rooms
/api/customers
/api/bookings
/api/payments
/api/analytics
/api/search
/api/audit-logs
```

## PostgreSQL Concepts Covered

* CRUD operations
* Joins
* Constraints
* JSONB
* Arrays
* Transactions
* Row locking
* Triggers
* Views
* Materialized views
* Indexes
* Full-text search
* Window functions
* Analytics
* Row-Level Security
* Audit logging

## Author

Built as a PostgreSQL learning project.

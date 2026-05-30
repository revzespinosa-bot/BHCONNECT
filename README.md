# BarangayHealth Connect

A barangay health management system for patient registry, appointments, BHW field visits, vitals monitoring, inventory tracking, and hospital referrals.

## Features

- **Unified Patient Registry** — search and manage patient records
- **Appointments & Queue** — web/SMS booking with digital queue numbers
- **BHW Home Visits** — field visit lists with offline-to-online sync support
- **Vitals Monitoring** — record vitals with automatic high-risk alerts
- **Inventory Management** — auto-deduct supplies and low-stock alerts
- **Hospital Referrals** — send digital records to higher-level hospitals
- **SMS Commands** — REG, BOOK, STATUS, HELP (Twilio-ready stub)

## Tech Stack

| Layer | Technology |
|---|---|
| Web Admin | React + Vite |
| Backend API | Node.js + Express |
| Database | MySQL |
| Auth | JWT |

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [MySQL](https://dev.mysql.com/downloads/) 8.0+

## Setup

### 1. Database

Create and seed the database:

```powershell
cd backend
npm install
npm run seed
```

Or manually import the SQL files in MySQL Workbench / phpMyAdmin:

- `database/schema.sql`
- `database/seed.sql`

Copy the environment file and set your MySQL password if needed:

```powershell
copy .env.example .env
```

### 2. Backend API

```powershell
cd backend
npm run dev
```

API runs at **http://localhost:3001**

### 3. Web Dashboard

Open a second terminal:

```powershell
cd web
npm install
npm run dev
```

Dashboard runs at **http://localhost:5173**

The Vite dev server proxies `/api` requests to the backend automatically.

## Demo Login

| Username | Password | Role |
|---|---|---|
| admin | password123 | Admin |
| nurse.maria | password123 | Nurse |
| bhw.juan | password123 | BHW |
| staff.ana | password123 | Staff |

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login |
| GET | `/api/dashboard/stats` | Dashboard statistics |
| GET/POST | `/api/patients` | Patient registry |
| GET/POST | `/api/appointments` | Appointments & queue |
| GET/POST | `/api/vitals` | Vitals records |
| GET | `/api/vitals/home-visits` | BHW home visit list |
| GET/POST | `/api/inventory` | Inventory management |
| GET | `/api/alerts` | System alerts |
| GET/POST | `/api/referrals` | Hospital referrals |
| POST | `/api/sync/push` | BHW offline sync |
| POST | `/api/sync/sms/inbound` | Process inbound SMS |

## Project Structure

```
BarangayHealthConnect/
├── backend/          # Node.js API server
├── web/              # React admin dashboard
└── database/         # MySQL schema & seed data
```

## SMS Testing (optional)

Simulate an inbound SMS booking:

```powershell
curl -X POST http://localhost:3001/api/sync/sms/inbound -H "Content-Type: application/json" -d "{\"phone\":\"09171111111\",\"message\":\"BOOK General check-up\"}"
```

# Academy Annual Contract Renewal Tracker

**Company:** Oxygen Sports, Hyderabad  
**Project:** Academy Annual Contract Renewal Tracker  
**Team Size:** 3 Students  

## What It Does
Tracks annual equipment supply contracts with sports academies including renewal dates, equipment categories, price revision, and relationship manager. Prevents losing high-value academy contracts to competitors through proactive renewal management.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TailwindCSS |
| Backend | Node.js Express |
| Database | SQLite (better-sqlite3) |
| Charts | Recharts |
| Authentication | JWT (JSON Web Tokens) |

## Team Structure

| Role | Responsibility |
|---|---|
| Student 1 - Frontend | Entry Form, Dashboard, Detail & History View |
| Student 2 - Backend | APIs, Expiry Tracking Engine, Reports, Validation |
| Student 3 - Testing & Deployment | Manual Testing, Postman API Testing, GitHub, Deployment |

## How to Run Locally

### Prerequisites
- Node.js v18+ installed
- npm (comes with Node.js)

### Backend Setup
```bash
cd backend
npm install
npm start
```
Server starts at http://localhost:5000

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
App opens at http://localhost:5173

### Default Login Credentials
- **Username:** admin
- **Password:** admin123

## Project Structure
```
├── frontend/          # React application
├── backend/           # Express API server
├── docs/              # Project documents
├── tests/             # Test cases
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/signup | Register new user |
| POST | /api/auth/login | Login and get JWT |
| GET | /api/contracts | List contracts (search, filter, pagination) |
| POST | /api/contracts | Create new contract |
| GET | /api/contracts/:id | Get contract detail with audit history |
| PUT | /api/contracts/:id | Update contract |
| PATCH | /api/contracts/:id/status | Change contract status |
| DELETE | /api/contracts/:id | Delete contract |
| GET | /api/dashboard/summary | Dashboard metrics |
| GET | /api/dashboard/alerts | Expiring contract alerts |
| GET | /api/reports/summary | Analytics data |
| GET | /api/reports/export | CSV export |

## Deployed URL
- Frontend: [To be updated after deployment]
- Backend: [To be updated after deployment]

## GitHub Repository
https://github.com/[username]/academy-annual-contract-renewal-tracker

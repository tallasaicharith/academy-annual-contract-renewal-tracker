# 🎤 Meeting with Oxygen Sports — Complete Preparation Guide
### Date: June 17, 2026 | Presenter: Student 3 (on behalf of full team)

---

## 🟢 Opening (2 minutes)

Start with this:

> *"Good [morning/afternoon], thank you for this meeting. I'm [Your Name], part of the 3-student team working on the **Academy Annual Contract Renewal Tracker** for Oxygen Sports. Today I'll walk you through what we've built so far, the progress across frontend, backend, and testing, and give you a live demo of the system."*

> *"Before I begin — we understand that Oxygen Sports currently manages annual equipment supply contracts with sports academies **manually** — through phone calls, WhatsApp messages, spreadsheets, and paper registers. This causes delays, missed renewal dates, and the risk of losing high-value academy contracts to competitors. Our system solves this by giving you a **centralised digital platform** to track everything in one place."*

---

## 📱 Explaining Student 1's Work (Frontend) — What the User Sees

> *"Let me explain the 4 screens our frontend developer has built:"*

### Screen 1: Academy Annual Contract Renewal Entry Form
> *"This is where your staff enters a new contract. It captures all the key information:"*

| Field | What it means for Oxygen Sports |
|---|---|
| **Academy Name** | Which academy the contract is with (e.g., "Hyderabad Cricket Academy") |
| **Equipment Categories** | What you're supplying — cricket gear, football equipment, badminton rackets, shoes, etc. |
| **Contract Start Date** | When the supply agreement begins |
| **Contract End / Renewal Date** | When the contract expires — this is the most critical field for tracking renewals |
| **Contract Value / Price** | The monetary value of the annual contract |
| **Price Revision** | Any price changes from the previous year — % increase/decrease |
| **Relationship Manager** | The Oxygen Sports staff member responsible for this academy account |
| **Status** | Active, Expiring Soon, Expired, or Renewed |

> *"Every field has **validation** — you can't submit a form with missing or incorrect data. This prevents the data entry errors that happen with manual spreadsheets."*

### Screen 2: Academy Annual Contract Renewal Dashboard
> *"This is the main screen your management will use daily. It shows **all contracts at a glance** in a table format with:"*
- All contracts listed with columns for academy name, equipment category, renewal date, contract value, relationship manager, and status
- **Color-coded status badges** — green for Active, yellow/orange for Expiring Soon, red for Expired, blue for Renewed
- **Search** — type an academy name or equipment category to find it instantly
- **Filters** — filter by status (show me only "Expiring Soon" contracts)
- **Sorting** — sort by renewal date, value, or any column
- **Pagination** — handles hundreds of contracts without slowing down

> *"Compare this to scrolling through a spreadsheet — your team can now find any contract in seconds."*

### Screen 3: Detail & History View
> *"Click any contract in the dashboard and you see the **complete record** — every field, linked data, and the full history of changes (audit log). You can also print or export this view."*

### Screen 4: Reports & Analytics Dashboard
> *"Management gets charts and summaries:"*
- Total contracts, total value, contracts by status (pie/bar chart)
- Contracts expiring in next 30/60/90 days
- Performance trends over time (line chart)
- Export data as CSV for your own analysis

---

## ⚙️ Explaining Student 2's Work (Backend) — How the System Works

> *"Behind the screens, here's what powers the system:"*

### Database Design
> *"We have 3 main tables in our database:"*

| Table | Purpose |
|---|---|
| **academy_annual_contract_renewal** | Stores every contract record — academy name, equipment categories, price revision, relationship manager, renewal dates, status |
| **contracts** | Stores contract-details |
| **audit_logs** | Tracks every change made — who changed what, when, and the old vs new values. This gives you complete accountability. |

> *"All tables are connected through relationships (foreign keys), so you can trace any contract's complete history."*

### API Endpoints (How Frontend Talks to Backend)
> *"Our backend exposes these APIs — think of them as the communication channels:"*

| API | What it does |
|---|---|
| `POST /api/contracts` | Creates a new contract record |
| `GET /api/contracts` | Retrieves all contracts (with filters, search, pagination) |
| `GET /api/contracts/:id` | Gets one specific contract's full details |
| `PUT /api/contracts/:id` | Updates/edits a contract |
| `PATCH /api/contracts/:id` | Changes just the status or fields of a contract |
| `GET /api/reports/summary` | Gets analytics data for charts |
| `GET /api/dashboard/summary` | Gets key metric counts for the dashboard widget |
| `GET /api/reports/export` | Exports all contract details to CSV |

### 🔥 The Core Logic: Expiry Tracking & Alert Trigger Engine
> *"This is the MOST important part of the system — the reason you need this tool:"*

**How it works:**
1. The engine scans all contracts in the database daily
2. It calculates the number of days until each contract's renewal date
3. Based on thresholds, it assigns alerts:

| Days Until Expiry | Alert Level | Action |
|---|---|---|
| **> 90 days** | 🟢 Safe | No action needed |
| **60-90 days** | 🟡 Upcoming | Start preparing renewal proposal |
| **30-60 days** | 🟠 Expiring Soon | Contact academy, begin negotiation |
| **< 30 days** | 🔴 Urgent | Immediate action — risk of losing contract |
| **0 or past** | ⚫ Expired | Contract lapsed — needs immediate re-engagement |

> *"**Worked Example:** Say you have a contract with Hyderabad Cricket Academy that expires on July 15, 2026. Today is June 17. That's 28 days away — the system marks it 🔴 **Urgent** and pushes it to the top of the dashboard so your relationship manager sees it immediately. Without this system, this might get lost in a spreadsheet and you'd lose the contract to a competitor."*

**Edge cases handled:**
- Null/missing renewal dates → flagged for data entry correction
- Contracts with no relationship manager assigned → flagged as unassigned
- Price revision calculations with boundary values

---

## 🧪 Explaining YOUR Role (Student 3 — Testing & Deployment)

> *"My role is to ensure everything works correctly and is accessible to your team. Here's what I've done:"*

### Testing Strategy
> *"I follow a structured testing approach:"*

| Testing Type | What I Test | Count |
|---|---|---|
| **Unit Tests** | Individual fields, validations, each API endpoint | 15+ cases |
| **Integration Tests** | End-to-end flows (create → view → edit → delete) | 8 scenarios |
| **Edge Case Tests** | Boundary values, empty data, invalid inputs | 10+ cases |
| **UI/Responsive Tests** | Mobile (375px), Tablet (768px), Desktop (1280px) | All screens |
| **API Tests (Postman)** | Every endpoint with valid & invalid data | All routes |

### Test Tracker
> *"I maintain a formal test tracker with:"*
- Test ID, Module, Description, Expected Result, Actual Result, Status (Pass/Fail), Date
- Current pass rate tracked and documented
- Every bug found is logged with: ID, Module, Steps to Reproduce, Severity, Status

---

## 🖥️ Live Demo Walkthrough (If They Ask You to Show)

Open http://localhost:5173 (or deployed URL) and follow this flow:

1. **Show the Dashboard** → *"This is what your team sees when they log in — all contracts at a glance"*
2. **Add a New Contract** → Fill the entry form with realistic data:
   - Academy: "Hyderabad Sports Academy"
   - Equipment: "Cricket Bats, Pads, Helmets"
   - Renewal Date: Pick a date ~25 days from now
   - Price Revision: "+8%"
   - Relationship Manager: "Ramesh Kumar"
3. **Show it appearing in Dashboard** → *"The record is immediately visible with the correct status"*
4. **Click on it** → *"Full detail view with all information"*
5. **Show Filters** → Filter by "Expiring Soon" → *"Management can instantly see which contracts need attention"*
6. **Show on Mobile** → Resize browser → *"Works on phones too — your field team can check on the go"*

---

## ❓ Likely Questions & Your Answers

### "Can multiple people use this at the same time?"
> *"Yes, it's a web application hosted in the cloud. Multiple staff members can access it simultaneously from any device with a browser."*

### "Is our data secure?"
> *"Yes — the backend has input sanitisation to prevent injection attacks, standardised error handling, and all sensitive configuration is stored in environment variables, never in the code. For a production version, we'd add user authentication with role-based access."*

### "Can we export the data?"
> *"Yes — the reports section has CSV export functionality, and the detail page has a print/export button."*

### "What happens if the internet goes down?"
> *"Since this is a cloud-based web app, it requires internet. However, you can export data to CSV for offline reference. For a future version, we could add offline capability."*

### "Can you add more equipment categories?"
> *"Yes — the system is flexible. Equipment categories are not hardcoded. You can enter any category when creating a contract."*

### "How is this better than our Excel sheets?"
> *"Four key advantages: (1) **Automated alerts** — the system tells you when contracts are expiring, you don't have to check manually. (2) **Centralised** — one place for everything, not scattered across files. (3) **Real-time dashboard** — instant visibility for management. (4) **Audit trail** — every change is logged with who, what, and when."*

### "What's the cost to maintain this?"
> *"Currently deployed on free tiers (Vercel, Render). For production use with more data and users, hosting would cost approximately ₹500-2000/month depending on scale."*

---

## 📊 Progress Summary to Share

> *"We are currently on Day 18 of our 26-day development cycle. Here's our progress:"*

| Phase | Status |
|---|---|
| Week 1: Planning, Design, Review 1 | ✅ Complete |
| Week 2: Database, APIs, Core Screens, Integration | ✅ Complete |
| Week 3 (current): Core Logic, CRUD, Review 2 Prep | ✅ Complete |
| Week 4: Polish, Deployment, Reports, Final Testing | ⏳ Upcoming |
| Week 5: Review 3 + Final Submission | ⏳ Upcoming |

### What's Done:
- ✅ Entry Form with all fields and validation
- ✅ Dashboard with live data, filters, search
- ✅ Database with SQLite and pure Javascript `sql.js` (no native C++ compilation issues)
- ✅ All CRUD APIs (Create, Read, Update, Delete)
- ✅ Expiry tracking and alert trigger engine
- ✅ Deployed and accessible publicly
- ✅ 30+ test cases documented
- ✅ Full change audit trail logs saved in SQLite

### What's Coming Next (by June 30):
- 📊 Reports & Analytics with charts
- 🔔 Enhanced alert notifications
- 📱 Mobile responsiveness polish
- 🧪 Final comprehensive testing
- 📄 Full project report + demo video
- 🎤 Review 3 final presentation

# Test Cases — Academy Annual Contract Renewal Tracker

## Test Tracker

| ID | Module | Description | Expected Result | Actual Result | Status | Date |
|---|---|---|---|---|---|---|
| TC-01 | Auth | Login with valid credentials | JWT returned, redirect to dashboard | | | |
| TC-02 | Auth | Login with invalid password | Error: "Invalid credentials" | | | |
| TC-03 | Auth | Signup with new user | User created, JWT returned | | | |
| TC-04 | Auth | Signup with existing email | Error: "User already exists" | | | |
| TC-05 | Entry Form | Submit with all valid fields | Contract created, appears in dashboard | | | |
| TC-06 | Entry Form | Submit with empty academy name | Error: "Academy name is required" | | | |
| TC-07 | Entry Form | Submit with negative contract value | Error: "Contract value must be positive" | | | |
| TC-08 | Entry Form | Submit with past renewal date | Warning shown | | | |
| TC-09 | Dashboard | Load dashboard with data | Stat cards show correct counts | | | |
| TC-10 | Dashboard | Check expiry alerts | Contracts <30 days shown in alert | | | |
| TC-11 | Dashboard | Charts render | Pie and Line charts display data | | | |
| TC-12 | Contract List | Search by academy name | Filtered results shown | | | |
| TC-13 | Contract List | Filter by "Expiring Soon" | Only expiring contracts shown | | | |
| TC-14 | Contract List | Pagination page 1 vs page 2 | Different 20 records each page | | | |
| TC-15 | Contract List | Sort by renewal date | Contracts ordered correctly | | | |
| TC-16 | Detail View | Click contract in list | Full detail page with all fields | | | |
| TC-17 | Detail View | View audit history | Change log entries displayed | | | |
| TC-18 | Edit | Edit contract value | Updated value saved and reflected | | | |
| TC-19 | Edit | Edit with invalid data | Validation errors shown | | | |
| TC-20 | Status | Change Active to Renewed | Status updated, audit log created | | | |
| TC-21 | Status | Verify expiry engine (29 days) | Marked as "Expiring Soon" | | | |
| TC-22 | Status | Verify expiry engine (0 days) | Marked as "Expired" | | | |
| TC-23 | Reports | View status distribution chart | Bar chart with correct counts | | | |
| TC-24 | Reports | CSV export | CSV file downloaded with all data | | | |
| TC-25 | API | GET /api/contracts valid | 200 with paginated results | | | |
| TC-26 | API | GET /api/contracts/:id invalid | 404 returned | | | |
| TC-27 | API | POST /api/contracts missing fields | 400 with validation errors | | | |
| TC-28 | API | PUT /api/contracts/:id | 200, record updated | | | |
| TC-29 | Responsive | Test at 375px (mobile) | All screens readable | | | |
| TC-30 | Responsive | Test at 1280px (desktop) | Full layout displayed | | | |

# Financial Forecaster — Product Requirements Document

**Version:** 1.1  
**Client:** Peak Transport LLC  
**Date:** January 2026

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Solution Overview](#3-solution-overview)
4. [Target Users & Scope](#4-target-users--scope)
5. [System Flow](#5-system-flow)
6. [Feature Requirements](#6-feature-requirements)
7. [Data Models](#7-data-models)
8. [Page Specifications](#8-page-specifications)
9. [Technical Requirements](#9-technical-requirements)
10. [Success Metrics](#10-success-metrics)
11. [Build Phases](#11-build-phases)

---

## 1. Executive Summary

Financial Forecaster is an internal web application designed for Peak Transport LLC, a trucking company that delivers packages for Amazon.

The application provides **two core capabilities**:
1. **Bookkeeping** — Track all financial transactions and generate P&L statements
2. **Forecasting** — Predict weekly Amazon payouts and compare with actual results

### Key Questions the App Answers:
- How much money do I have right now?
- Am I profitable this week?
- How much will Amazon pay me next Thursday?

---

## 2. Problem Statement

### 2.1 Current Situation

Peak Transport operates with a non-standard revenue model:
- Fixed tour pay ($452 per route)
- Variable Accessorials (load-based, ~$77 average)
- Dispute/unused tour payments
- Duration adjustments

### 2.2 Pain Points

| Pain Point | Impact |
|------------|--------|
| Scattered financial data | No single source of truth |
| Manual transaction categorization | Time-consuming, error-prone |
| No real-time P&L visibility | Cannot assess current profitability |
| Cash flow unpredictability | Cannot forecast income accurately |
| Scaling uncertainty | Cannot answer "Can I afford another truck?" |

### 2.3 Success Statement

> "I no longer have to manually categorize transactions, guess my cash flow, or wonder if I can afford to scale."

---

## 3. Solution Overview

### Two Main Modules

| Module | Purpose | Key Functions |
|--------|---------|---------------|
| Bookkeeping | Track money in/out | Import bank data, auto-categorize, P&L generation |
| Forecasting | Predict weekly payout | Import trips/invoices, projected vs actual comparison |

### 3.1 Revenue Model

```
Total Pay = Routes × ($452 + Accessorials) + Adjustments
```

Where:
- **Routes = Trips = Tours** — One truck working one night
- **$452** — Daily Tractor Rate (DTR), fixed per route
- **Accessorials** — Variable payment (~$77 average, based on miles/loads)
- **Loads = Drop-offs** — Individual deliveries within a trip

### 3.2 Key Terminology

| Term | Meaning | Example |
|------|---------|---------|
| Route/Trip/Tour | One truck working one night | 2 trucks × 7 nights = 14 routes |
| Load/Drop-off | Individual delivery within a trip | 1 trip might have 5-6 loads |
| Bobtail | Driving empty between stations | MSP7 → MSP8 (doesn't count) |
| DTR | Daily Tractor Rate | $452 fixed |
| Accessorial | Variable payment per route | ~$77 average |

---

## 4. Target Users & Scope

### 4.1 Scope

| Question | Answer |
|----------|--------|
| Who is this for? | Peak Transport LLC only |
| Business type | Amazon Relay box truck deliveries |
| Internal or SaaS? | Internal tool (ops + finance) |
| Future expansion? | No (just Peak Transport for MVP) |

### 4.2 User Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| **Admin (Owner)** | Primary user, makes all decisions | **Full access to all features** |
| Bookkeeper | Manages transactions and P&L | Full access (future) |
| Dispatcher | Manages operations and capacity | Full access (future) |

**Note:** For MVP, only Admin role will be implemented with full access to all pages and features.

---

## 5. System Flow

### 5.1 Bookkeeping Flow

| Step | Action | Description |
|------|--------|-------------|
| 1 | Import Bank Data | Paste or import transactions from bank |
| 2 | AI Auto-Categorizes | System reads each transaction and assigns category |
| 3 | User Reviews & Corrects | Admin fixes any wrong categorizations |
| 4 | System Learns | App remembers corrections for future imports |
| 5 | P&L Updates | Revenue - Expenses = Profit (auto-calculated) |

### 5.2 Forecasting Flow

| When | Action | Data Source |
|------|--------|-------------|
| Before Week | Import Trips data from scheduler | Scheduler export |
| Before Week | App extracts trips & loads (excludes Bobtail) | Parsed data |
| Before Week | Display PROJECTED loads per trip | Calculated |
| Each Night | Admin updates ACTUAL loads | Manual input |
| Thursday | Import Amazon Invoice data (Payment Details tab) | Amazon Excel |
| Thursday | Compare FORECAST vs ACTUAL payout | Calculated |

### 5.3 Weekly Cycle

| Day | Action |
|-----|--------|
| Sunday/Monday | Import Trips data → See projected payout |
| Mon-Sat | Trucks run routes, admin updates actual loads nightly |
| Thursday | Amazon pays → Import invoice data → Compare forecast vs actual |
| Friday | Import Bank data → Categorize → P&L updates |

### 5.4 Load Counting Rules

| Rule | Details |
|------|---------|
| **COUNT** as loads | Stop 2, 3, 4, 5, 6... (delivery addresses) |
| **EXCLUDE** | MSP7, MSP8, MSP9 (stations) |
| **EXCLUDE** | Stop 1 (usually starting station) |
| **EXCLUDE** | Bobtail trips (driving empty) |

---

## 6. Feature Requirements

### 6.1 Bookkeeping Module

| Feature | Description | Priority |
|---------|-------------|----------|
| Bank Data Import | Import transactions from bank statement (paste/manual) | P0 |
| AI Auto-Categorization | Automatically classify transactions | P0 |
| Manual Labeling | Override/correct categories | P0 |
| Learning System | Remember corrections for future imports | P0 |
| Live P&L Statement | Auto-updating profit & loss | P0 |
| Cash on Hand | Current balance visibility | P0 |
| Cash Flow Visualization | Charts showing money in/out | P1 |
| Transaction History | Searchable, filterable list | P0 |
| Export Reports | CSV/Excel for CPA | P1 |

### 6.2 Forecasting Module

| Feature | Description | Priority |
|---------|-------------|----------|
| Trips Data Import | Import scheduled trips from scheduler | P0 |
| Amazon Invoice Import | Import payment details (paste/manual) | P0 |
| Auto-Extract Trips & Loads | Parse and count deliveries | P0 |
| Projected vs Actual Loads | Side-by-side comparison | P0 |
| Manual Actual Updates | Nightly load corrections | P0 |
| Revenue Forecast | Predicted weekly payout | P0 |
| Forecast vs Actual Comparison | Variance analysis | P0 |
| Slider Controls | Trucks, hours, wage rate adjustments | P1 |
| Labor Cost Modeling | Wages, taxes, workers comp | P1 |
| Overtime Considerations | Adjustable OT rules | P1 |
| Scaling Scenarios | What if 2 → 10 trucks? | P1 |
| Contribution Margin | Per truck per day calculation | P0 |

### 6.3 Dashboard Module

| Feature | Description | Priority |
|---------|-------------|----------|
| Cash on Hand | Current balance from bank | P0 |
| Weekly Net Cash Flow | Money in vs money out | P0 |
| Contribution Margin per Truck | Key profitability metric | P0 |
| P&L Summary | Revenue - Expenses snapshot | P0 |
| Forecast vs Actual | Variance display | P0 |
| Visual Charts | Cash flow trends, breakdowns | P1 |

### 6.4 Revenue Layers (Separate Tracking)

| Revenue Type | Description | Source |
|--------------|-------------|--------|
| Tour Pay | Fixed $452 per route | Amazon Invoice |
| Accessorials | Variable (miles/loads) ~$77 avg | Amazon Invoice |
| Dispute/Unused Tour Pay | Adjustments for cancelled tours | Amazon Invoice |
| Other Adjustments | Credits, one-offs | Amazon Invoice |

### 6.5 Cost Categories (for P&L)

| Category | Description | Included in v1 |
|----------|-------------|----------------|
| Driver Wages | ADP Wage Pay | ✅ Yes |
| Payroll Taxes | ADP Tax | ✅ Yes |
| Workers Comp | Workers compensation | ✅ Yes |
| Insurance | Amazon Insurance, other | ✅ Yes |
| Admin/Overhead | Office, software, etc. | ✅ Yes |
| Fuel | Gas stations | ❌ No |
| Maintenance | Vehicle repairs | ❌ No |

### 6.6 Accessorial Modeling Options

| Mode | How It Works | Use Case |
|------|--------------|----------|
| Simple | Average per tour (~$77) | Quick estimates |
| Advanced | Based on loads, duration, trip type | Accurate forecasting |

### 6.7 Forecasting Questions to Answer

| Question | Feature Required |
|----------|------------------|
| What happens if I go from 2 → 10 trucks? | Scaling scenarios with sliders |
| Can I afford another dispatcher? | Labor cost modeling |
| What's my worst-case month? | Worst-case projection |

---

## 7. Data Models

### 7.1 Data Sources

| Data | Source | When to Import | Used For |
|------|--------|----------------|----------|
| Bank Transactions | Bank account (copy/paste) | Anytime | Bookkeeping |
| Trips Data | Scheduler (copy/paste) | Before week | Forecasting (projected) |
| Amazon Invoice | Amazon Excel (copy/paste) | Thursday | Forecasting (actual) |

### 7.2 Bank Transaction Structure

| Column | Type | Description |
|--------|------|-------------|
| Details | String | DEBIT, CREDIT, CHECK, DSLIP |
| Posting Date | Date | Transaction date |
| Description | String | Full transaction details |
| Amount | Decimal | Negative = outflow, Positive = inflow |
| Type | String | ACH_DEBIT, ACH_CREDIT, DEBIT_CARD, etc. |
| Balance | Decimal | Running balance |
| Check or Slip # | String | Reference number (optional) |

### 7.3 Amazon Invoice Structure (Payment Details Tab)

| Column | Type | Description |
|--------|------|-------------|
| Invoice Number | String | Invoice identifier |
| Trip ID | String | Main trip identifier |
| Load ID | String | Sub-trip identifier |
| Start Date | Date | Trip start date |
| End Date | Date | Trip end date |
| Route/Domicile | String | Location (Minneapolis, MN) |
| Equipment | String | TWENTY_SIX_FOOT_BOX_TRUCK |
| Distance (Mi) | Decimal | Miles driven |
| Item Type | String | Tour - Completed, Load - Completed |
| Duration (hrs) | Decimal | Trip duration |
| Base Rate | Decimal | $452 fixed |
| Fuel Surcharge | Decimal | Accessorial (per mile) |
| Gross Pay | Decimal | Total for this line |

### 7.4 Trips Data Structure

| Column | Type | Description |
|--------|------|-------------|
| Trip ID | String | Main trip identifier |
| Load ID | String | Sub-trip identifier |
| Status | String | Scheduled, Canceled, Completed |
| Stop 1 ID | String | Starting station (usually MSP7/8/9) |
| Stop 2 ID | String | First delivery (count this) |
| Stop 3 ID | String | Second delivery (count this) |
| Stop 4 ID | String | Third delivery (count this) |
| Stop 5 ID | String | Fourth delivery (count this) |
| Stop 6 ID | String | Fifth delivery (count this) |
| Stop 7 ID | String | Return station or sixth delivery |

### 7.5 Database Tables

| Table | Purpose |
|-------|---------|
| users | User accounts (Admin only for MVP) |
| categories | Transaction categories (Wages, Insurance, etc.) |
| transactions | Bank transactions with category assignment |
| category_rules | Auto-categorization rules (learned) |
| amazon_invoices | Imported invoice headers |
| invoice_line_items | Parsed invoice details (trips & loads) |
| trips | Scheduled trips from Trips data |
| trip_loads | Loads per trip (projected and actual) |
| forecasts | Saved forecast scenarios |
| settings | App configuration |

---

## 8. Page Specifications

### 8.1 Page List

| Page | Purpose | Admin Access |
|------|---------|--------------|
| Login | Email authentication | N/A |
| Dashboard | Overview of key metrics | ✅ Full |
| Transactions | Import, view, categorize bank transactions | ✅ Full |
| P&L Statement | Live profit & loss | ✅ Full |
| Amazon Invoices | Import and view parsed invoices | ✅ Full |
| Trips | Import trips data, manage projected/actual loads | ✅ Full |
| Forecasting | Sliders, scenarios, predictions | ✅ Full |
| Forecast vs Actual | Compare and analyze variance | ✅ Full |
| Reports | Export P&L, summaries | ✅ Full |
| Settings | Categories, rules, preferences | ✅ Full |

### 8.2 Dashboard Page

| Component | Description |
|-----------|-------------|
| Cash on Hand Card | Current bank balance |
| Weekly Net Cash Flow Card | Money in vs money out this week |
| Contribution Margin Card | Per truck per day |
| P&L Summary Card | Revenue - Expenses = Profit |
| Forecast vs Actual Card | Variance from last week |
| Cash Flow Chart | Visual trend over time |
| Quick Actions | Import Data, View P&L, Go to Forecasting |

### 8.3 Transactions Page

| Component | Description |
|-----------|-------------|
| Import Button | Import bank transaction data (paste/manual) |
| Transaction Table | List of all transactions |
| Category Dropdown | Assign/change category per transaction |
| Filters | By date, category, amount, type |
| Search | Search by description |
| Bulk Actions | Categorize multiple at once |
| Learning Indicator | Show which rules are auto-applied |

### 8.4 P&L Statement Page

| Component | Description |
|-----------|-------------|
| Period Selector | Weekly (default), Monthly |
| Revenue Section | Tour Pay, Accessorials, Disputes, Adjustments |
| Expenses Section | Wages, Taxes, Insurance, Admin, etc. |
| Net Profit | Revenue - Expenses |
| Comparison | vs Previous Period |
| Export Button | Download as CSV/Excel |

### 8.5 Amazon Invoices Page

| Component | Description |
|-----------|-------------|
| Import Button | Import Amazon invoice data (paste/manual) |
| Invoice List | All imported invoices |
| Invoice Details | Parsed trips and loads |
| Revenue Breakdown | Tour Pay vs Accessorials vs Adjustments |
| Match to Bank | Link invoice to bank deposit |

### 8.6 Trips Page

| Component | Description |
|-----------|-------------|
| Import Button | Import Trips data from scheduler |
| Trip Table | List of all trips for the week |
| Trip ID Column | Main trip identifier |
| Projected Loads Column | Auto-calculated from data |
| Actual Loads Column | Editable - update nightly |
| Status Column | Pending, Updated, Complete |
| Bulk Update | Update multiple trips at once |

### 8.7 Forecasting Page

| Component | Description |
|-----------|-------------|
| Trucks Slider | Number of trucks (1-20) |
| Nights Slider | Nights per week (1-7) |
| Wage Rate Slider | Hourly wage ($15-$35) |
| Overtime Toggle | Include OT calculations |
| Accessorial Mode | Simple ($77) or Advanced (loads-based) |
| Projected Revenue | Calculated from inputs |
| Projected Costs | Labor + overhead |
| Contribution Margin | Per truck per day |
| Scenario Comparison | Save and compare scenarios |

### 8.8 Forecast vs Actual Page

| Component | Description |
|-----------|-------------|
| Week Selector | Choose which week to analyze |
| Forecast Amount | What was predicted |
| Actual Amount | What Amazon paid |
| Variance | Difference (amount and %) |
| Breakdown | By tour pay, accessorials, adjustments |
| Trip-Level Detail | Which trips varied most |
| Notes | Add notes for future reference |

### 8.9 Reports Page

| Report | Description | Format |
|--------|-------------|--------|
| Weekly P&L | Profit & Loss for selected week | CSV, Excel |
| Monthly P&L | Profit & Loss for selected month | CSV, Excel |
| Transaction Export | All transactions (filtered) | CSV, Excel |
| Forecast Summary | Forecast details and variance | CSV, Excel |
| CPA Package | Bundled reports for accountant | Excel |

### 8.10 Settings Page

| Setting | Description |
|---------|-------------|
| Categories | Add, edit, delete transaction categories |
| Auto-Categorization Rules | Manage learned rules |
| Cost Defaults | Default values for labor, overhead |
| Accessorial Settings | Average rate, calculation mode |
| Excluded Addresses | MSP7, MSP8, MSP9 for load counting |
| Profile | Change password, email preferences |

---

## 9. Technical Requirements

### 9.1 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router) + TypeScript |
| State Management | Zustand |
| Data Fetching | TanStack Query |
| Styling | Tailwind CSS |
| Database | PostgreSQL |
| Authentication | Better Auth |
| AI | Claude API (for categorization) |
| CSV Parsing | Papa Parse |
| Excel Parsing | SheetJS (xlsx) |

### 9.2 Architecture

| Component | Approach |
|-----------|----------|
| Database CRUD | Server Actions |
| Form Submissions | Server Actions |
| Data Import/Parsing | API Routes |
| AI Calls (Claude) | API Routes |
| Data Fetching | TanStack Query + Server Components |

### 9.3 Project Status

| Item | Status |
|------|--------|
| Project Boilerplate | ✅ Ready |
| Authentication (Better Auth) | ✅ Ready |
| Protected Routes | ✅ Ready |

---

## 10. Success Metrics

### 10.1 North Star Metric

**Contribution Margin per Truck per Day**

If the tool is successful in 6 months, the owner will confidently know this number at any time.

### 10.2 Key Metrics (Always Visible)

| Metric | Description |
|--------|-------------|
| Cash on Hand | Current bank balance |
| Weekly Net Cash Flow | Money in - Money out |
| Contribution Margin per Truck per Day | Profitability metric |
| Accessorials per Tour | Average variable revenue |
| Revenue per Hour | Efficiency metric |
| Labor as % of Revenue | Cost ratio |

### 10.3 Success Criteria

| Criteria | Target |
|----------|--------|
| Forecast accuracy | Within 5% of actual payout |
| Categorization accuracy | 90%+ auto-categorized correctly |
| Time to generate P&L | < 5 minutes (was hours) |
| User adoption | Owner uses daily |

---

## 11. Build Phases

### Phase 1: Database & Layout *(Authentication already done)*

| Task | Description |
|------|-------------|
| Database Schema | Create all tables in PostgreSQL |
| Basic Layout | Navigation, sidebar, header |
| Dashboard Shell | Empty dashboard with placeholders |

### Phase 2: Bookkeeping Module

| Task | Description |
|------|-------------|
| Bank Data Import | Parse and store transactions |
| Categories Management | CRUD for categories |
| AI Categorization | Claude API integration |
| Manual Categorization | Override categories |
| Learning System | Store and apply rules |
| Transaction List | View, filter, search |
| P&L Generation | Calculate from transactions |

### Phase 3: Forecasting Module

| Task | Description |
|------|-------------|
| Trips Data Import | Parse scheduled trips |
| Load Counting Logic | Exclude Bobtail, MSP stations |
| Projected Loads Display | Trip-by-trip breakdown |
| Actual Loads Input | Manual nightly updates |
| Amazon Invoice Import | Parse Payment Details tab |
| Revenue Calculation | Tours × ($452 + Accessorials) |
| Forecast vs Actual | Comparison and variance |

### Phase 4: Dashboard & Visualization

| Task | Description |
|------|-------------|
| Dashboard Cards | Key metrics at a glance |
| Cash Flow Chart | Visual trends |
| P&L Summary | Quick profit view |
| Forecast Widget | Current week projection |

### Phase 5: Advanced Features

| Task | Description |
|------|-------------|
| Slider Controls | Trucks, hours, wages |
| Labor Cost Modeling | Wages + taxes + workers comp |
| Scaling Scenarios | What-if analysis |
| Export Reports | CSV/Excel downloads |
| Settings Page | Configuration options |

---

## Summary

| Aspect | Details |
|--------|---------|
| **What** | Finance app for trucking company |
| **Who** | Peak Transport LLC (Admin/Owner) |
| **Problem** | Scattered data, can't predict income |
| **Solution** | Bookkeeping + Forecasting in one app |
| **Bookkeeping** | Import bank data → AI categorizes → P&L |
| **Forecasting** | Import trips → Predict payout → Compare actual |
| **Key Metric** | Contribution margin per truck per day |
| **Tech Stack** | Next.js 16 + TypeScript + PostgreSQL + Better Auth |

---

*— End of Document —*
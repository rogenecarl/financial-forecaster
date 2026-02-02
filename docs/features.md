# Peak Transport Financial Command Center

**Bookkeeping + Forecasting Tool for Amazon Relay Operations**

Version 1.0 | January 2025

---

## Executive Summary

Peak Transport Financial Command Center is an internal web application designed to give the owner/admin real-time visibility into **current financial position** and **forward-looking cash flow forecasts**. The tool solves two critical problems simultaneously:

1. **Bookkeeping:** "Where is my money right now?" — Real-time transaction tracking, categorization, and P&L generation.

2. **Forecasting:** "Where will my money be?" — Predictive cash flow based on Amazon Relay capacity, labor costs, and operational levers.

Unlike generic accounting software, this tool understands the **unique revenue mechanics of Amazon Relay** — separating tour pay from Accessorials, modeling per-truck contribution margins, and allowing scenario planning for fleet scaling decisions.

> **🎯 North Star Metric**
> 
> In 6 months, the owner can confidently answer: *"What is my current cash position, and what will it be in 30/60/90 days under different scenarios?"*

---

## Problem Statement

### Current Pain Points

- **Transaction Chaos:** Business account transactions are not properly categorized. Manual effort required to understand what's happening financially.

- **No Real-Time P&L:** Current profit/loss requires manual calculation. No live view of financial health.

- **Amazon Invoice Complexity:** Revenue has multiple layers (tour pay, Accessorials, disputes, adjustments) that generic tools don't understand.

- **Blind Scaling Decisions:** No way to model "What if I add 3 trucks?" or "What if I hire a dispatcher?" without manual spreadsheet work.

- **Labor Cost Uncertainty:** Overtime, wage changes, and payroll burden are hard to factor into future projections.

### Success Criteria

The tool is successful when the owner can:

- Open the app and see current cash on hand in under 5 seconds
- View a weekly P&L without any manual data entry
- Adjust labor cost assumptions and immediately see impact on 90-day forecast
- Model fleet expansion scenarios with slider controls
- Export CPA-ready reports at tax time

---

## Target User

**Scope:** Internal tool for Peak Transport only. Single Amazon Relay box truck operation. No multi-tenant or SaaS considerations in v1.

**Primary User:** Owner / Admin

The owner/admin has full access to all features:

| Capability | Description |
|------------|-------------|
| Dashboard | Real-time cash position, P&L, key metrics |
| Transaction Management | Import, categorize, label all transactions |
| Amazon Invoice Processing | Upload, parse, reconcile Amazon invoices |
| P&L Reports | Weekly, daily, monthly profit & loss statements |
| Forecasting | Scenario modeling with sliders, cash projections |
| Contribution Analysis | Per-truck margins, break-even calculations |
| Exports | Excel/CSV exports, CPA-ready summaries |

---

## Core Features

### Module 1: Bookkeeping Engine

**Purpose:** Real-time visibility into current financial position.

#### 1.1 Transaction Management

- Import bank transactions (CSV/manual entry initially)
- Auto-categorization with rule-based suggestions
- Manual labeling/override capability
- Category taxonomy: Revenue (by type), Labor, Insurance, Fuel, Maintenance, Admin, Other
- Split transaction support (one payment → multiple categories)

#### 1.2 Amazon Invoice Integration

- Upload Amazon Relay invoices (Excel/PDF)
- Auto-parse and classify line items:
  - Tour Pay (base guaranteed pay)
  - Accessorials (per-load, duration, trip-type extras)
  - Disputes / Unused Tour Pay
  - Adjustments (credits, one-offs)
- Flag anomalies: long duration with low Accessorial, missing expected revenue
- Reconcile invoices against bank deposits

#### 1.3 Live P&L Statement

- Weekly P&L as primary view
- Daily and monthly rollups available
- Revenue breakdown by layer (Tour Pay vs Accessorials vs Adjustments)
- Cost breakdown by category
- Gross margin, contribution margin, net margin calculations

#### 1.4 Cash Position Dashboard

- Current cash on hand (hero metric)
- Cash inflows vs outflows visualization
- Accounts receivable (pending Amazon payments)
- Upcoming obligations (payroll, insurance, etc.)

---

### Module 2: Forecasting Engine

**Purpose:** Predict future cash flow based on operational inputs and scenario modeling.

#### 2.1 Revenue Forecasting

- Input: Current Amazon Relay capacity (trucks, tours, hours)
- Two Accessorial models:
  - Simple: Average Accessorial per tour (e.g., $77)
  - Advanced: Model based on loads, duration, trip type
- Historical trend analysis for seasonal patterns
- Confidence intervals (best/expected/worst case)

#### 2.2 Cost Forecasting

**V1 Cost Categories:**

| Cost Category | Input Method | Forecast Logic |
|---------------|--------------|----------------|
| Driver Wages | Hourly rate × hours/week | Adjustable via slider |
| Overtime | 1.5× rate after 40 hrs | Auto-calculated |
| Payroll Taxes | % of gross wages | Fixed % assumption |
| Workers Comp | % of gross wages | Fixed % assumption |
| Insurance | Monthly fixed amount | Scales with truck count |
| Admin/Overhead | Monthly fixed amount | Step function at scale |

*Note: Fuel and Maintenance excluded from v1 per owner decision (simpler model first).*

#### 2.3 Scenario Modeling (Slider Controls)

**Adjustable Parameters:**

- Number of trucks: 1 → 20 (slider)
- Hours per driver per week: 30 → 60 (slider)
- Hourly wage rate: $15 → $35 (slider)
- Accessorial rate assumption: $50 → $150 per tour (slider)
- Add dispatcher: toggle (adds fixed cost)

**Key Questions Answered:**

- *"What happens if I go from 2 → 10 trucks?"* — Shows revenue scale, cost scale, margin impact
- *"Can I afford another dispatcher?"* — Models fixed cost addition against current margin
- *"What's my worst-case month?"* — Shows minimum viable cash position

#### 2.4 Contribution Margin Analysis

- Per-truck-per-day contribution margin (hero metric for ops)
- Break-even analysis: minimum Accessorial needed per tour
- Sensitivity analysis: margin impact of wage/rate changes

#### 2.5 Cash Flow Projection

- 30/60/90 day cash runway
- Visual timeline: when cash goes below safety threshold
- Payroll timing overlay (show cash dips on payroll weeks)

---

## Feature Prioritization: V1 vs V2

| Feature | V1 (MVP) | V2 (Future) |
|---------|----------|-------------|
| Transaction import (CSV) | ✅ | — |
| Bank API integration (Plaid) | — | ✅ |
| Manual transaction labeling | ✅ | — |
| Auto-categorization (ML) | Basic rules | Smart ML |
| Amazon invoice upload (Excel) | ✅ | — |
| Amazon invoice upload (PDF) | Manual | OCR auto |
| Revenue layer separation | ✅ | — |
| Weekly P&L | ✅ | — |
| Daily/Monthly P&L | ✅ | — |
| Cash position dashboard | ✅ | — |
| Forecasting sliders | ✅ | — |
| Contribution margin per truck | ✅ | — |
| 30/60/90 day forecast | ✅ | — |
| Scenario comparison (side-by-side) | — | ✅ |
| Fuel cost tracking | — | ✅ |
| Maintenance log integration | — | ✅ |
| Multi-user roles | — | ✅ |
| Export to Excel/CSV | ✅ | — |
| CPA-ready reports | Basic | Advanced |
| Charts/visualizations | ✅ | — |

---

## Data Model

Core entities aligned to Amazon Relay operations:

### Transactions
```
id, date, amount, description, category, subcategory, source (bank/amazon/manual), reconciled, created_at
```

### Amazon Invoices
```
id, invoice_date, week_ending, total_amount, tour_pay, accessorials, disputes, adjustments, file_url, parsed_at
```

### Invoice Line Items
```
id, invoice_id, line_type (tour_pay|accessorial|dispute|adjustment), tour_id, amount, loads, duration_hours, trip_type, notes
```

### Trucks
```
id, name, status (active|inactive), insurance_cost_monthly, added_date
```

### Drivers
```
id, name, hourly_rate, status, assigned_truck_id, start_date
```

### Forecast Assumptions
```
id, name, truck_count, hours_per_week, hourly_rate, avg_accessorial, payroll_tax_rate, workers_comp_rate, insurance_per_truck, admin_overhead, has_dispatcher, created_at
```

### Categories
```
id, name, type (revenue|expense), parent_id, is_amazon_revenue
```

---

## Build Order (Recommended)

Phased approach to deliver value incrementally:

### Phase 1: Foundation (Week 1-2)
- Set up project and database schema
- Basic auth (single user/admin)
- Transaction CRUD + manual entry form

### Phase 2: Bookkeeping Core (Week 3-4)
- CSV transaction import
- Category management + labeling UI
- Weekly P&L view
- Cash position dashboard

### Phase 3: Amazon Integration (Week 5-6)
- Excel invoice upload + parsing
- Revenue layer separation (Tour Pay, Accessorials, etc.)
- Invoice reconciliation view
- Anomaly flagging

### Phase 4: Forecasting (Week 7-8)
- Forecast assumptions model
- Slider UI for scenario modeling
- 30/60/90 day cash projection
- Contribution margin calculator

### Phase 5: Polish (Week 9-10)
- Charts and visualizations
- Export to Excel/CSV
- CPA-ready summary reports
- Mobile-responsive tweaks

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to see cash position | < 5 seconds | App load to dashboard |
| Weekly P&L generation | 0 manual calculation | Auto-generated from data |
| Forecast scenario time | < 10 seconds | Slider to result display |
| Amazon invoice processing | < 2 minutes | Upload to categorized data |
| Owner confidence in numbers | High (qualitative) | Weekly check-in |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Amazon invoice format changes | Parser breaks | Modular parser, manual override |
| Over-engineering forecasting | Delayed delivery | Start simple (avg Accessorial) |
| Scope creep to multi-tenant | Complexity explosion | Hard boundary: internal only v1 |
| Data entry fatigue | Tool abandonment | Prioritize CSV import early |

---

## Appendix: Category Taxonomy

### Revenue Categories
- Amazon Revenue → Tour Pay
- Amazon Revenue → Accessorials → Per-Load
- Amazon Revenue → Accessorials → Duration
- Amazon Revenue → Accessorials → Trip Type
- Amazon Revenue → Disputes/Unused
- Amazon Revenue → Adjustments

### Expense Categories
- Labor → Driver Wages
- Labor → Overtime
- Labor → Payroll Taxes
- Labor → Workers Comp
- Insurance → Truck Insurance
- Insurance → General Liability
- Admin → Software/Tools
- Admin → Professional Services
- Admin → Other Overhead
- Other → Uncategorized

---

**Ready to Build**

This PRD provides everything needed to start development. Begin with Phase 1 and iterate.
# Financial Forecaster - Scalability & UX Improvement Plan

> **Document Version:** 1.0
> **Created:** February 3, 2026
> **Based on:** Client meeting transcription analysis

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Client Requirements](#client-requirements)
4. [Phase 1: Database Schema & Import History](#phase-1-database-schema--import-history)
5. [Phase 2: Duplicate Detection & Prevention](#phase-2-duplicate-detection--prevention)
6. [Phase 3: Scalable Filter System](#phase-3-scalable-filter-system)
7. [Phase 4: UI/UX Improvements by Page](#phase-4-uiux-improvements-by-page)
8. [Phase 5: Analytics & Historical Views](#phase-5-analytics--historical-views)
9. [Phase 6: Performance Optimization](#phase-6-performance-optimization)
10. [Implementation Timeline](#implementation-timeline)

---

## Executive Summary

This document outlines a comprehensive plan to make the Financial Forecaster application scalable, optimized, and aligned with the client's weekly workflow. The key improvements focus on:

- **Historical data preservation** - All imports saved, nothing overwritten
- **Duplicate prevention** - Smart detection across all CSV imports
- **Week-centric navigation** - Aligned with Amazon Relay's weekly payment cycle
- **Year-over-year analytics** - Track forecast accuracy over time

---

## Current State Analysis

### What Works Well
- Trip parsing correctly extracts loads and calculates projections
- Invoice matching updates trip actuals
- P&L statement correctly categorizes transactions
- Basic forecast vs actual comparison exists

### Critical Issues

| Issue | Impact | Priority |
|-------|--------|----------|
| Trips overwritten on re-import | Loses historical projections | **P0** |
| No import batch tracking for trips | Can't see import history | **P0** |
| ForecastWeek projections recalculated | Original forecast lost | **P0** |
| Month-based filters vs weekly workflow | Poor UX | **P1** |
| "All Data" loads everything | Performance degradation at scale | **P1** |
| No duplicate detection for trips | Duplicate data if same CSV imported twice | **P1** |

### Data Growth Projection

| Timeframe | Trips | Loads | Invoices | Transactions |
|-----------|-------|-------|----------|--------------|
| 1 Month | ~120 | ~600 | 4 | ~50 |
| 6 Months | ~720 | ~3,600 | 24 | ~300 |
| 1 Year | ~1,560 | ~7,800 | 52 | ~600 |
| 3 Years | ~4,680 | ~23,400 | 156 | ~1,800 |

---

## Client Requirements

### From Meeting Transcription

1. **Weekly Import Cycle**
   > "Every week I want to do the projected, do the actual, save it, save it, save it. At the end of the year, we can see what did we project last, what did we actually receive."

2. **Historical Preservation**
   > "It would be nice for it to save all the trips week to week."

3. **Duplicate Detection**
   > "You want the system to be able to detect the new transactions and then if it detects a duplicate to not include that."

4. **Forecast Accuracy Tracking**
   > "How close are our models?"

5. **Variance Analysis**
   > "I want to be able to see what the discrepancy is between the two. Projected and actual."

---

## Phase 1: Database Schema & Import History

### 1.1 New Model: TripImportBatch

Track every trip CSV import with a snapshot of projections at import time.

```prisma
model TripImportBatch {
  id           String   @id @default(uuid())
  userId       String

  // File info
  fileName     String
  fileHash     String?  // MD5 hash for duplicate file detection

  // Import metadata
  importedAt   DateTime @default(now())

  // Period covered by trips in this import
  periodStart  DateTime // Earliest trip scheduledDate
  periodEnd    DateTime // Latest trip scheduledDate

  // Import statistics
  tripCount       Int      // Total trips in file
  newTripsCount   Int      // Actually imported (new)
  skippedCount    Int      // Skipped as duplicates
  loadCount       Int      // Total loads
  canceledCount   Int @default(0)

  // SNAPSHOT: Projections at time of import (IMMUTABLE)
  projectedTours        Int
  projectedLoads        Int
  projectedTourPay      Decimal @db.Decimal(12, 2)
  projectedAccessorials Decimal @db.Decimal(12, 2)
  projectedTotal        Decimal @db.Decimal(12, 2)

  // Status
  status       String @default("completed") // processing, completed, failed
  errorMessage String?

  // Relations
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  trips  Trip[]

  @@index([userId, importedAt])
  @@index([userId, periodStart, periodEnd])
  @@index([fileHash])
  @@map("trip_import_batch")
}
```

### 1.2 Update Trip Model

```prisma
model Trip {
  // ... existing fields ...

  // NEW: Link to import batch
  importBatchId String?
  importBatch   TripImportBatch? @relation(fields: [importBatchId], references: [id])

  // NEW: Original projected values (never change after creation)
  originalProjectedLoads    Int?
  originalProjectedRevenue  Decimal? @db.Decimal(10, 2)

  @@index([importBatchId])
}
```

### 1.3 Update ForecastWeek Model

```prisma
model ForecastWeek {
  // ... existing fields ...

  // NEW: Lock projections when invoice arrives
  projectionLockedAt DateTime?

  // NEW: Track which import created initial projection
  tripImportBatchId String?

  // NEW: Allow tracking multiple invoices
  // (keep amazonInvoiceId for backward compatibility)
}
```

### 1.4 New Model: InvoiceImportBatch

```prisma
model InvoiceImportBatch {
  id           String   @id @default(uuid())
  userId       String
  fileName     String
  fileHash     String?
  importedAt   DateTime @default(now())

  // Stats
  invoiceCount  Int
  lineItemCount Int
  matchedTrips  Int
  unmatchedTrips Int

  status       String @default("completed")

  user     User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  invoices AmazonInvoice[]

  @@index([userId, importedAt])
  @@map("invoice_import_batch")
}
```

---

## Phase 2: Duplicate Detection & Prevention

### 2.1 Duplicate Detection Strategy

| Import Type | Duplicate Key | Detection Method | User Feedback |
|-------------|--------------|------------------|---------------|
| **Trips** | `tripId` (Amazon ID) | Exact match | "5 trips skipped (already exist)" |
| **Transactions** | `postingDate + description + amount` | Composite match | "12 duplicates detected" |
| **Invoices** | `invoiceNumber` | Exact match | "Invoice already imported" |
| **Files** | `fileHash` (MD5) | Warn if same file | "This file was imported on Jan 15" |

### 2.2 Trip Import - Duplicate Handling

```typescript
// NEW Import Logic
async function importTrips(trips: ImportTrip[], fileName: string) {
  // 1. Calculate file hash (optional, for file-level duplicate warning)
  const fileHash = calculateMD5(fileContent);

  // 2. Check if same file was imported before
  const previousImport = await prisma.tripImportBatch.findFirst({
    where: { userId, fileHash }
  });

  if (previousImport) {
    return {
      success: false,
      error: "DUPLICATE_FILE",
      message: `This file was already imported on ${format(previousImport.importedAt, "MMM d, yyyy")}`,
      previousImport
    };
  }

  // 3. Create import batch
  const batch = await prisma.tripImportBatch.create({ ... });

  // 4. Check for duplicate trips
  const tripIds = trips.map(t => t.tripId);
  const existingTrips = await prisma.trip.findMany({
    where: { userId, tripId: { in: tripIds } }
  });
  const existingTripIds = new Set(existingTrips.map(t => t.tripId));

  // 5. Separate new vs duplicate
  const newTrips = trips.filter(t => !existingTripIds.has(t.tripId));
  const duplicateTrips = trips.filter(t => existingTripIds.has(t.tripId));

  // 6. Only insert new trips
  for (const tripData of newTrips) {
    await prisma.trip.create({
      data: {
        ...tripData,
        importBatchId: batch.id,
        originalProjectedLoads: tripData.projectedLoads,
        originalProjectedRevenue: tripData.projectedRevenue
      }
    });
  }

  // 7. Update batch with stats
  await prisma.tripImportBatch.update({
    where: { id: batch.id },
    data: {
      newTripsCount: newTrips.length,
      skippedCount: duplicateTrips.length,
      // ... projected snapshots
    }
  });

  // 8. Return detailed result
  return {
    success: true,
    data: {
      imported: newTrips.length,
      skipped: duplicateTrips.length,
      duplicateTripIds: duplicateTrips.map(t => t.tripId),
      batchId: batch.id
    }
  };
}
```

### 2.3 User Feedback UI - Import Result Dialog

```
┌─────────────────────────────────────────────────────────────┐
│  ✅ Import Complete                                    [X]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  File: trips_jan_27_feb_2.csv                              │
│  Import Date: Feb 3, 2026 at 2:45 PM                       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  📊 Import Summary                                   │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  Total in file:     30 trips                        │   │
│  │  ✅ New imported:   25 trips                        │   │
│  │  ⏭️ Skipped:         5 trips (already exist)        │   │
│  │  📦 Total loads:    125 loads                       │   │
│  │  ❌ Canceled:        2 trips                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  💰 Projected Revenue (New Trips Only)              │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  Tour Pay:          $11,302.25 (25 × $452.09)      │   │
│  │  Accessorials:      $4,096.44 (120 × $34.12)       │   │
│  │  Total Projected:   $15,398.69                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ▼ Show skipped trips (5)                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  T-112YY5BG  (imported Jan 20)                      │   │
│  │  T-113XX4CF  (imported Jan 20)                      │   │
│  │  T-114WW3DE  (imported Jan 20)                      │   │
│  │  T-115VV2FG  (imported Jan 20)                      │   │
│  │  T-116UU1HI  (imported Jan 20)                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│                                    [ View Trips ] [ Done ]  │
└─────────────────────────────────────────────────────────────┘
```

### 2.4 Duplicate File Warning

```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️ Duplicate File Detected                           [X]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  This file appears to have been imported before.           │
│                                                             │
│  Previous Import:                                          │
│  • Date: January 20, 2026 at 10:30 AM                     │
│  • Trips Imported: 30                                      │
│  • File: trips_jan_20_27.csv                              │
│                                                             │
│  Do you want to continue anyway?                           │
│  (Duplicate trips will be automatically skipped)           │
│                                                             │
│              [ Cancel ]  [ Continue Import ]               │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 3: Scalable Filter System

### 3.1 Filter Architecture

Replace generic time filters with domain-specific filters aligned with client workflow.

```
Current (Not Scalable):          Proposed (Scalable):
┌──────────────────────┐         ┌──────────────────────────────────┐
│ ▼ All Data           │         │ ▼ Week 5    ▼ All Imports   ▼ All│
│   This Month         │   →     │   (Jan 27)                       │
│   Last Month         │         │                                  │
│   Last 3 Months      │         │ Week picker + Import + Status    │
│   Custom Range       │         │                                  │
└──────────────────────┘         └──────────────────────────────────┘
```

### 3.2 Filter Components

#### WeekSelector Component

```tsx
interface WeekOption {
  id: string;
  year: number;
  weekNumber: number;
  weekStart: Date;
  weekEnd: Date;
  label: string;           // "Jan 27 - Feb 2"
  hasTrips: boolean;
  hasActuals: boolean;     // Invoice imported
  tripCount: number;
  status: "projected" | "in_progress" | "completed";
}

// Visual representation
┌────────────────────────────────────────┐
│ ▼ Week 5: Jan 27 - Feb 2              │
├────────────────────────────────────────┤
│ ○ Current Week                         │
│ ○ Next Week (Projected)                │
│ ─────────────────────────────────────  │
│ ● Week 5: Jan 27 - Feb 2  ✓ Actual    │
│ ○ Week 4: Jan 20 - 26     ✓ Actual    │
│ ○ Week 3: Jan 13 - 19     ✓ Actual    │
│ ○ Week 2: Jan 6 - 12      ◐ Projected │
│ ○ Week 1: Dec 30 - Jan 5  ◐ Projected │
│ ─────────────────────────────────────  │
│ ○ Custom Range...                      │
└────────────────────────────────────────┘

Legend:
✓ = Has actuals (invoice imported)
◐ = Projected only (no invoice yet)
```

#### ImportBatchSelector Component

```tsx
interface ImportBatchOption {
  id: string;
  importedAt: Date;
  fileName: string;
  tripCount: number;
  newTripsCount: number;
  skippedCount: number;
  projectedTotal: number;
}

// Visual representation
┌────────────────────────────────────────┐
│ ▼ All Imports                          │
├────────────────────────────────────────┤
│ ○ All Imports                          │
│ ─────────────────────────────────────  │
│ ○ Feb 3, 2:45 PM (25 trips) $15,398   │
│ ○ Jan 27, 9:00 AM (30 trips) $17,128  │
│ ○ Jan 20, 10:30 AM (28 trips) $15,890 │
│ ○ Jan 13, 8:15 AM (32 trips) $18,234  │
└────────────────────────────────────────┘
```

#### StatusFilter Component

```tsx
// Visual representation
┌────────────────────────────────────────┐
│ ▼ All Status                           │
├────────────────────────────────────────┤
│ ○ All Status                           │
│ ○ Upcoming (18)                        │
│ ○ Completed (120)                      │
│ ○ Canceled (8)                         │
│ ○ Pending/Rejected (3)                 │
└────────────────────────────────────────┘
```

### 3.3 Filter Combinations by Page

| Page | Primary Filter | Secondary Filter | Tertiary Filter |
|------|---------------|------------------|-----------------|
| **Trips** | Week | Import Batch | Status |
| **P&L Statement** | Period Type | Specific Period | Category |
| **Forecast vs Actual** | View Mode | Week/Range | - |
| **Amazon Invoices** | Week | - | - |
| **Transactions** | Period | Category | Review Status |

---

## Phase 4: UI/UX Improvements by Page

### 4.1 Trips Page

#### Current Layout Issues
- "Revenue" column ambiguous (is it projected or actual?)
- No way to see which import batch a trip came from
- Filter doesn't support weekly navigation

#### Proposed Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Trips                                                        [ Import CSV ] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Filters                                                                 │ │
│ │ ┌──────────────┐ ┌──────────────────┐ ┌─────────────┐                  │ │
│ │ │ ▼ Week 5     │ │ ▼ All Imports    │ │ ▼ All Status│                  │ │
│ │ │   Jan 27-Feb2│ │                  │ │             │                  │ │
│ │ └──────────────┘ └──────────────────┘ └─────────────┘                  │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Week 5 Summary                                    Jan 27 - Feb 2, 2026  │ │
│ │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │ │
│ │ │ 28 Trips    │ │ 131 Loads   │ │ $17,128     │ │ $16,890  ▲ $238    │ │ │
│ │ │ 2 canceled  │ │ projected   │ │ Projected   │ │ Actual   (1.4%)    │ │ │
│ │ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ □ │ Trip ID      │ Status    │Proj.│Act.│ Projected  │ Actual    │ Var │ │
│ │   │              │           │Loads│Loads│ Revenue   │ Revenue   │     │ │
│ ├───┼──────────────┼───────────┼─────┼─────┼───────────┼───────────┼─────┤ │
│ │ □ │ T-112YY5BG   │ COMPLETED │  4  │  4  │ $588.57   │ $612.45   │+$24 │ │
│ │ □ │ T-113XX4CF   │ COMPLETED │  6  │  5  │ $656.81   │ $623.12   │-$34 │ │
│ │ □ │ T-114WW3DE   │ CANCELED  │  -  │  -  │    -      │ $200.00   │TONU │ │
│ │ □ │ T-115VV2FG   │ UPCOMING  │  3  │  -  │ $554.45   │    -      │  -  │ │
│ │ □ │ T-116UU1HI   │ REJECTED  │  5  │  0  │ $622.69   │ $0.00     │-$623│ │
│ └───┴──────────────┴───────────┴─────┴─────┴───────────┴───────────┴─────┘ │
│                                                                             │
│ Showing 28 of 28 trips                              ◀ 1 2 3 ▶             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Column Changes

| Current | Change To | Reason |
|---------|-----------|--------|
| Revenue | **Projected Revenue** | Clarity |
| (none) | **Actual Revenue** | Client requested |
| (none) | **Variance** | Show discrepancy |
| Pending | **Pending/Rejected** | Per client feedback |

### 4.2 P&L Statement Page

#### Proposed Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ P&L Statement                                              [ Export PDF ]   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Period Selection                                                        │ │
│ │ ┌──────────────┐ ┌────────────────────────────────────┐                │ │
│ │ │ ▼ Weekly     │ │ ▼ Week 5: Jan 27 - Feb 2, 2026    │                │ │
│ │ └──────────────┘ └────────────────────────────────────┘                │ │
│ │                                                                         │ │
│ │ Quick Select: [This Week] [Last Week] [This Month] [Last Month] [Q4]   │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ Period Type Options:                                                        │
│ ┌──────────────┐                                                           │
│ │ ○ Weekly     │ → Shows week picker                                       │
│ │ ○ Monthly    │ → Shows month picker                                      │
│ │ ○ Quarterly  │ → Shows Q1/Q2/Q3/Q4 picker                               │
│ │ ○ Yearly     │ → Shows year picker                                       │
│ │ ○ Custom     │ → Shows date range picker                                 │
│ └──────────────┘                                                           │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │                    PROFIT & LOSS STATEMENT                              │ │
│ │                       Peak Transport LLC                                │ │
│ │                    Week 5: Jan 27 - Feb 2, 2026                        │ │
│ │                                                                         │ │
│ │  REVENUE                                                                │ │
│ │  ├─ Amazon Relay Payment ..................... $16,890.45              │ │
│ │  └─ Total Revenue ............................ $16,890.45              │ │
│ │                                                                         │ │
│ │  COST OF GOODS SOLD                                                     │ │
│ │  ├─ Driver Wages ............................. ($5,200.00)             │ │
│ │  ├─ Payroll Taxes ............................   ($397.80)             │ │
│ │  └─ Total COGS ............................... ($5,597.80)             │ │
│ │                                                                         │ │
│ │  GROSS PROFIT ................................ $11,292.65              │ │
│ │                                                                         │ │
│ │  OPERATING EXPENSES                                                     │ │
│ │  ├─ Fuel .....................................  ($2,340.00)            │ │
│ │  ├─ Insurance ................................    ($890.00)            │ │
│ │  ├─ Supplies .................................    ($156.23)            │ │
│ │  └─ Total Operating Expenses .................  ($3,386.23)            │ │
│ │                                                                         │ │
│ │  ═══════════════════════════════════════════════════════════           │ │
│ │  NET OPERATING INCOME ........................  $7,906.42              │ │
│ │  Profit Margin ............................... 46.8%                   │ │
│ │                                                                         │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Forecast vs Actual Page

#### Proposed Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Forecast vs Actual                                         [ Export CSV ]   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ View Options                                                            │ │
│ │ ┌────────────────┐ ┌──────────────────────────────────────────────────┐│ │
│ │ │ ▼ Week Range   │ │ Week 1 (Jan 6)  ───────────  Week 5 (Feb 3)     ││ │
│ │ └────────────────┘ └──────────────────────────────────────────────────┘│ │
│ │                                                                         │ │
│ │ View Modes: [Single Week] [Week Range] [Monthly] [Quarterly] [YTD]     │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Summary (5 Weeks)                                                       │ │
│ │ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐            │ │
│ │ │ $78,450         │ │ $76,890         │ │ 98.0%           │            │ │
│ │ │ Total Projected │ │ Total Actual    │ │ Avg Accuracy    │            │ │
│ │ │                 │ │ -$1,560 (2.0%)  │ │                 │            │ │
│ │ └─────────────────┘ └─────────────────┘ └─────────────────┘            │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │                           📊 TREND CHART                                │ │
│ │  $20k ┤                                                                 │ │
│ │       │     ╭──╮                                                       │ │
│ │  $15k ┤ ╭───╯  ╰───╮   ╭───────╮                                      │ │
│ │       │ │          ╰───╯       ╰───╮                                   │ │
│ │  $10k ┤─┴─────────────────────────────                                 │ │
│ │       │ Wk1   Wk2   Wk3   Wk4   Wk5                                   │ │
│ │       └─────────────────────────────────                               │ │
│ │         ── Projected  ── Actual                                        │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Week     │ Trips │ Loads │ Projected  │ Actual     │ Variance │Accuracy│ │
│ ├──────────┼───────┼───────┼────────────┼────────────┼──────────┼────────┤ │
│ │ Week 5   │ 28/28 │131/128│ $17,128.00 │ $16,890.45 │ -$237.55 │  98.6% │ │
│ │ Week 4   │ 30/30 │145/142│ $18,234.50 │ $17,890.12 │ -$344.38 │  98.1% │ │
│ │ Week 3   │ 26/26 │120/120│ $15,678.00 │ $15,678.00 │   $0.00  │ 100.0% │ │
│ │ Week 2   │ 32/32 │150/148│ $19,012.00 │ $18,456.78 │ -$555.22 │  97.1% │ │
│ │ Week 1   │ 25/25 │115/112│ $14,398.00 │ $13,975.00 │ -$423.00 │  97.1% │ │
│ ├──────────┼───────┼───────┼────────────┼────────────┼──────────┼────────┤ │
│ │ TOTAL    │141/141│661/650│ $84,450.50 │ $82,890.35 │-$1,560.15│  98.0% │ │
│ └──────────┴───────┴───────┴────────────┴────────────┴──────────┴────────┘ │
│                                                                             │
│ Legend: Trips = Proj/Actual  |  Loads = Proj/Actual                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.4 Import History Page (NEW)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Import History                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Filter by Type: [All] [Trips] [Invoices] [Transactions]                 │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Date       │ Type     │ File Name            │ Stats          │ Action  │ │
│ ├────────────┼──────────┼──────────────────────┼────────────────┼─────────┤ │
│ │ Feb 3      │ 🚚 Trips │ trips_week5.csv      │ 25 new, 5 skip │ [View]  │ │
│ │ Feb 1      │ 📄 Invoice│ invoice_8899.xlsx   │ 9 items matched│ [View]  │ │
│ │ Jan 27     │ 🚚 Trips │ trips_week4.csv      │ 30 new, 0 skip │ [View]  │ │
│ │ Jan 25     │ 📄 Invoice│ invoice_8898.xlsx   │ 12 items, 2 ✗  │ [View]  │ │
│ │ Jan 24     │ 💰 Trans │ bank_jan.csv         │ 45 new, 3 dup  │ [View]  │ │
│ │ Jan 20     │ 🚚 Trips │ trips_week3.csv      │ 28 new, 0 skip │ [View]  │ │
│ └────────────┴──────────┴──────────────────────┴────────────────┴─────────┘ │
│                                                                             │
│ Showing 6 of 24 imports                                    ◀ 1 2 3 4 ▶     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.5 Dashboard Improvements

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Dashboard                                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌───────────────────────────────┐ ┌───────────────────────────────────────┐ │
│ │ This Week (Week 5)            │ │ Model Accuracy (Last 4 Weeks)         │ │
│ │                               │ │                                       │ │
│ │ Projected: $17,128            │ │ ████████████████████░░░░ 98.2%       │ │
│ │ Actual:    $16,890 ✓          │ │                                       │ │
│ │ Variance:  -$238 (1.4%)       │ │ You're forecasting within 2% of      │ │
│ │                               │ │ actual results!                       │ │
│ └───────────────────────────────┘ └───────────────────────────────────────┘ │
│                                                                             │
│ ┌───────────────────────────────┐ ┌───────────────────────────────────────┐ │
│ │ Next Week (Week 6)            │ │ Quick Actions                         │ │
│ │                               │ │                                       │ │
│ │ Projected: $15,890            │ │ [📤 Import Trips]                    │ │
│ │ Status: Awaiting trips        │ │ [📄 Import Invoice]                  │ │
│ │                               │ │ [📊 View Forecast vs Actual]         │ │
│ │ [Import Trips for Week 6]     │ │                                       │ │
│ └───────────────────────────────┘ └───────────────────────────────────────┘ │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Recent Activity                                                         │ │
│ │                                                                         │ │
│ │ • Feb 3: Imported 25 trips for Week 5 ($15,398 projected)              │ │
│ │ • Feb 1: Invoice 8899 imported, matched 28/30 trips                    │ │
│ │ • Jan 27: Imported 30 trips for Week 4 ($17,128 projected)             │ │
│ │                                                                         │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Year to Date (2026)                                                     │ │
│ │                                                                         │ │
│ │ Total Revenue:     $82,890          Trips Completed: 141                │ │
│ │ Total Projected:   $84,450          Loads Delivered: 650                │ │
│ │ Accuracy:          98.2%            Canceled:        8                  │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 5: Analytics & Historical Views

### 5.1 Analytics Dashboard (NEW PAGE)

```
Route: /dashboard/analytics

Features:
- Year selector (2024, 2025, 2026)
- Monthly breakdown chart
- Quarterly summaries
- Model accuracy trend
- Top performing weeks
- Variance analysis
```

### 5.2 Data Queries for Analytics

```typescript
// Get yearly summary
async function getYearlySummary(userId: string, year: number) {
  const weeks = await prisma.forecastWeek.findMany({
    where: { userId, year },
    orderBy: { weekNumber: "asc" }
  });

  return {
    totalProjected: sum(weeks, 'projectedTotal'),
    totalActual: sum(weeks, 'actualTotal'),
    weeksCompleted: weeks.filter(w => w.actualTotal !== null).length,
    averageAccuracy: calculateAverageAccuracy(weeks),
    monthlyBreakdown: groupByMonth(weeks),
    quarterlyBreakdown: groupByQuarter(weeks)
  };
}

// Get model accuracy trend
async function getAccuracyTrend(userId: string, lastNWeeks: number = 12) {
  const weeks = await prisma.forecastWeek.findMany({
    where: {
      userId,
      actualTotal: { not: null }
    },
    orderBy: { weekStart: "desc" },
    take: lastNWeeks
  });

  return weeks.map(w => ({
    week: w.weekNumber,
    year: w.year,
    accuracy: calculateAccuracy(w.projectedTotal, w.actualTotal)
  }));
}
```

### 5.3 Historical Comparison Views

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Historical Comparison                                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Compare: [Week 5, 2026] vs [Week 5, 2025]                                  │
│                                                                             │
│ ┌─────────────────────────────┐ ┌─────────────────────────────────────────┐ │
│ │ Week 5, 2026                │ │ Week 5, 2025                            │ │
│ │                             │ │                                         │ │
│ │ Trips: 28                   │ │ Trips: 24                               │ │
│ │ Revenue: $16,890            │ │ Revenue: $14,230                        │ │
│ │ Profit: $7,906              │ │ Profit: $6,120                          │ │
│ │                             │ │                                         │ │
│ │ Growth: +18.7% revenue      │ │                                         │ │
│ │         +29.2% profit       │ │                                         │ │
│ └─────────────────────────────┘ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 6: Performance Optimization

### 6.1 Database Indexes

```prisma
// Add these indexes for filter performance
model Trip {
  @@index([userId, scheduledDate])           // Already exists
  @@index([userId, tripStage])               // NEW: Status filter
  @@index([userId, importBatchId])           // NEW: Import filter
  @@index([userId, weekId])                  // NEW: Week filter
}

model ForecastWeek {
  @@index([userId, year, weekNumber])        // Already exists
  @@index([userId, status])                  // NEW: Quick status lookup
}

model TripImportBatch {
  @@index([userId, importedAt])              // NEW: Import history
  @@index([userId, periodStart, periodEnd])  // NEW: Week overlap
  @@index([fileHash])                        // NEW: Duplicate file check
}
```

### 6.2 Query Optimization

| Query | Current | Optimized |
|-------|---------|-----------|
| Get all trips | `SELECT * FROM trip` | `SELECT * FROM trip WHERE week_id = ? LIMIT 50` |
| Week dropdown | Computed client-side | `SELECT DISTINCT year, week_number FROM forecast_week` |
| Import history | N/A | `SELECT * FROM trip_import_batch ORDER BY imported_at DESC LIMIT 20` |

### 6.3 Pagination Strategy

- **Trips page**: 50 per page (default), with week filter
- **Transactions**: 100 per page
- **Import history**: 20 per page
- **Forecast weeks**: No pagination (max 52/year)

### 6.4 Caching Strategy

```typescript
// Cache week options (changes rarely)
const WEEK_OPTIONS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Cache import batch list (changes on import)
const IMPORT_BATCH_CACHE_TTL = 1 * 60 * 1000; // 1 minute

// No cache for trip data (changes frequently)
```

---

## Implementation Timeline

### Week 1: Schema & Core Infrastructure

| Day | Task | Files |
|-----|------|-------|
| 1-2 | Add TripImportBatch model | `prisma/schema.prisma` |
| 2-3 | Update Trip model | `prisma/schema.prisma` |
| 3-4 | Create migration | `prisma/migrations/` |
| 4-5 | Update importTrips action | `src/actions/forecasting/trips.ts` |

### Week 2: Duplicate Detection & Import UX

| Day | Task | Files |
|-----|------|-------|
| 1-2 | Add file hash detection | `src/lib/utils/file-hash.ts` |
| 2-3 | Update import result types | `src/types/import.ts` |
| 3-4 | Create ImportResultDialog | `src/components/forecasting/ImportResultDialog.tsx` |
| 4-5 | Add duplicate warning dialog | `src/components/forecasting/DuplicateWarningDialog.tsx` |

### Week 3: Filter System

| Day | Task | Files |
|-----|------|-------|
| 1-2 | Create WeekSelector component | `src/components/filters/WeekSelector.tsx` |
| 2-3 | Create ImportBatchSelector | `src/components/filters/ImportBatchSelector.tsx` |
| 3-4 | Create filter actions | `src/actions/filters/` |
| 4-5 | Integrate into Trips page | `src/app/(dashboard)/trips/page.tsx` |

### Week 4: Page Updates

| Day | Task | Files |
|-----|------|-------|
| 1-2 | Update Trips table columns | `src/components/forecasting/TripsTable.tsx` |
| 2-3 | Update P&L filter | `src/app/(dashboard)/pnl-statement/page.tsx` |
| 3-4 | Update Forecast vs Actual | `src/app/(dashboard)/forecast-vs-actual/page.tsx` |
| 4-5 | Create Import History page | `src/app/(dashboard)/import-history/page.tsx` |

### Week 5: Analytics & Polish

| Day | Task | Files |
|-----|------|-------|
| 1-2 | Add analytics queries | `src/actions/analytics/` |
| 2-3 | Update Dashboard | `src/app/(dashboard)/page.tsx` |
| 3-4 | Add trend charts | `src/components/charts/` |
| 4-5 | Testing & bug fixes | - |

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Page load (Trips, 1yr data) | ~3s | <500ms |
| Import feedback | None | Detailed dialog |
| Duplicate handling | Overwrites | Skips with feedback |
| Historical data access | Not possible | Full year available |
| Filter navigation | Month-based | Week-based |
| Model accuracy tracking | Manual | Automatic |

---

## Appendix A: API Changes

### New Endpoints

```typescript
// GET /api/filters/weeks - Get available weeks for filter
// GET /api/filters/import-batches - Get import batches for filter
// GET /api/analytics/yearly-summary - Get year summary
// GET /api/analytics/accuracy-trend - Get accuracy over time
// GET /api/import-history - Get all imports with pagination
```

### Updated Endpoints

```typescript
// POST /api/trips/import - Now returns detailed result with duplicates
// GET /api/trips - Now supports weekId and importBatchId filters
// GET /api/forecast-weeks - Now supports date range and view mode
```

---

## Appendix B: Component Hierarchy

```
src/components/
├── filters/
│   ├── WeekSelector.tsx
│   ├── ImportBatchSelector.tsx
│   ├── PeriodTypeSelector.tsx
│   ├── StatusFilter.tsx
│   └── DateRangePicker.tsx
├── forecasting/
│   ├── TripsTable.tsx (updated)
│   ├── ImportResultDialog.tsx (new)
│   ├── DuplicateWarningDialog.tsx (new)
│   └── WeekSummaryCard.tsx (new)
├── analytics/
│   ├── AccuracyTrendChart.tsx (new)
│   ├── RevenueComparisonChart.tsx (new)
│   └── YearlySummaryCard.tsx (new)
└── import-history/
    └── ImportHistoryTable.tsx (new)
```

---

## Appendix C: Database Migration Plan

```sql
-- Migration: add_trip_import_batch
-- 1. Create trip_import_batch table
-- 2. Add import_batch_id to trip table
-- 3. Add projection_locked_at to forecast_week
-- 4. Create indexes
-- 5. Backfill existing trips with null import_batch_id (acceptable)
```

---

*Document maintained by: Development Team*
*Last updated: February 3, 2026*

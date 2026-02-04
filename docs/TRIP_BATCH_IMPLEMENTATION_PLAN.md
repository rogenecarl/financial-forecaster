# Trip Batch System - Implementation Plan

> **Status**: Planning
> **Created**: February 5, 2026
> **Purpose**: Consolidate forecasting into a single, user-friendly Trip Management system

---

## Executive Summary

Replace the fragmented multi-page forecasting system with a unified **Trip Batch** system where users create named containers to organize their trips and invoices. This improves UX by providing a clear lifecycle view and better historical organization.

---

## Current vs Proposed Architecture

### Current State (5 Pages, Fragmented)

```
┌─────────────────────────────────────────────────────────────────┐
│  /trips              → Import trips CSV, view table             │
│  /amazon-invoices    → Import invoices, view details            │
│  /forecasting        → Scenario calculator                      │
│  /forecast-vs-actual → Variance analysis                        │
│  /import-history     → View past imports                        │
│                                                                  │
│  Tables: Trip, TripLoad, TripImportBatch, AmazonInvoice,        │
│          AmazonInvoiceLineItem, InvoiceImportBatch, ForecastWeek │
└─────────────────────────────────────────────────────────────────┘
```

### Proposed State (Unified)

```
┌─────────────────────────────────────────────────────────────────┐
│  /trips              → Trip Batch cards (list view)             │
│  /trips/[batchId]    → Batch detail (imports + table)           │
│  /forecasting        → Scenario calculator (KEEP)               │
│  /forecast-vs-actual → Cross-batch analytics (KEEP, enhanced)   │
│                                                                  │
│  Tables: TripBatch (NEW), Trip, TripLoad, AmazonInvoice,        │
│          AmazonInvoiceLineItem                                   │
│                                                                  │
│  REMOVED: TripImportBatch, InvoiceImportBatch, ForecastWeek     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Schema Changes

### Tables to REMOVE

| Table | Reason | Data Migration |
|-------|--------|----------------|
| `TripImportBatch` | Replaced by TripBatch | Create TripBatch per existing batch |
| `InvoiceImportBatch` | Replaced by TripBatch | Link invoices to migrated batches |
| `ForecastWeek` | Replaced by TripBatch metrics | Rollup metrics live on TripBatch |

### Tables to KEEP (with modifications)

| Table | Changes |
|-------|---------|
| `Trip` | Remove `weekId`, `importBatchId` → Add `batchId` |
| `TripLoad` | No changes |
| `AmazonInvoice` | Remove `importBatchId` → Add `batchId` |
| `AmazonInvoiceLineItem` | No changes (KEEP for matching/audit) |
| `Forecast` | No changes (scenario calculator) |

### New Table: TripBatch

```prisma
enum BatchStatus {
  EMPTY        // Just created, no data
  UPCOMING     // Has trips imported
  IN_PROGRESS  // Some trips completed
  COMPLETED    // All trips done, awaiting invoice
  INVOICED     // Has invoice, fully reconciled
}

model TripBatch {
  id          String      @id @default(cuid())
  userId      String

  // User-defined metadata
  name        String                    // "Week 5 - Feb 2026"
  description String?                   // Optional notes

  // Status tracking
  status      BatchStatus @default(EMPTY)

  // File tracking (for duplicate detection)
  tripFileHash    String?               // MD5 of last trip CSV
  invoiceFileHash String?               // MD5 of last invoice file

  // Import timestamps
  tripsImportedAt   DateTime?
  invoiceImportedAt DateTime?

  // Trip statistics (updated on import)
  tripCount       Int @default(0)
  loadCount       Int @default(0)
  canceledCount   Int @default(0)
  completedCount  Int @default(0)

  // Projected metrics (calculated from trips, IMMUTABLE after invoice)
  projectedTours        Int     @default(0)
  projectedLoads        Int     @default(0)
  projectedTourPay      Decimal @default(0) @db.Decimal(12, 2)
  projectedAccessorials Decimal @default(0) @db.Decimal(12, 2)
  projectedTotal        Decimal @default(0) @db.Decimal(12, 2)

  // Actual metrics (calculated from invoice)
  actualTours        Int?
  actualLoads        Int?
  actualTourPay      Decimal? @db.Decimal(12, 2)
  actualAccessorials Decimal? @db.Decimal(12, 2)
  actualAdjustments  Decimal? @db.Decimal(12, 2)
  actualTotal        Decimal? @db.Decimal(12, 2)

  // Variance (calculated: actual - projected)
  variance        Decimal? @db.Decimal(12, 2)
  variancePercent Float?

  // Lock projections when invoice imported
  projectionLockedAt DateTime?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  user     User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  trips    Trip[]
  invoices AmazonInvoice[]

  @@index([userId, createdAt])
  @@index([userId, status])
  @@map("trip_batch")
}
```

### Updated Trip Model

```prisma
model Trip {
  id      String  @id @default(uuid())
  userId  String
  batchId String?  // NEW: Link to TripBatch (replaces weekId, importBatchId)

  // ... rest unchanged ...

  // Relations
  user  User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  batch TripBatch? @relation(fields: [batchId], references: [id], onDelete: SetNull)
  loads TripLoad[]

  @@unique([userId, tripId])
  @@index([userId, scheduledDate])
  @@index([userId, tripStage])
  @@index([batchId])  // NEW
  @@map("trip")
}
```

### Updated AmazonInvoice Model

```prisma
model AmazonInvoice {
  id      String  @id @default(uuid())
  userId  String
  batchId String? // NEW: Link to TripBatch (replaces importBatchId)

  // ... rest unchanged ...

  // Relations
  user      User                    @relation(fields: [userId], references: [id], onDelete: Cascade)
  batch     TripBatch?              @relation(fields: [batchId], references: [id], onDelete: SetNull)
  lineItems AmazonInvoiceLineItem[]

  @@index([userId, paymentDate])
  @@index([batchId])  // NEW
  @@map("amazon_invoice")
}
```

---

## Page Structure

### List View: `/trips`

```
┌─────────────────────────────────────────────────────────────────────┐
│  TRIP MANAGEMENT                                                     │
│                                                                      │
│  [+ New Batch]                              [Search] [Filter] [Sort] │
│                                                                      │
│  Filter: [All] [Upcoming] [In Progress] [Completed] [Invoiced]      │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ Week 6 - Feb 2026                               ✅ INVOICED    │ │
│  │ Zone A + B combined deliveries                                 │ │
│  │                                                                 │ │
│  │ 47 trips  •  156 loads  •  $24,890 revenue                    │ │
│  │                                                                 │ │
│  │ Variance: +$560 (+2.3%)                                        │ │
│  │                                                                 │ │
│  │ Created Feb 5  •  Invoiced Feb 12                              │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ Week 5 - Feb 2026                               🟡 UPCOMING    │ │
│  │ Regular weekly run                                              │ │
│  │                                                                 │ │
│  │ 45 trips  •  142 loads  •  $23,450 projected                  │ │
│  │                                                                 │ │
│  │ Created Jan 29                                                  │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Detail View: `/trips/[batchId]`

```
┌─────────────────────────────────────────────────────────────────────┐
│  ← Back to Batches                                                   │
│                                                                      │
│  Week 5 - Feb 2026                                    🟡 UPCOMING   │
│  Regular weekly run                                    [Edit] [Delete]│
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  IMPORT SECTION                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐ │
│  │     📋          │  │     📄          │  │      📊             │ │
│  │   TRIPS         │  │   INVOICE       │  │    SUMMARY          │ │
│  │                 │  │                 │  │                     │ │
│  │  45 imported    │  │  ⏳ Pending     │  │  Projected: $23,450 │ │
│  │                 │  │                 │  │  Actual: --         │ │
│  │  [Import CSV]   │  │  [Import]       │  │  Variance: --       │ │
│  │  [Re-import]    │  │                 │  │                     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────────┘ │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  TRIPS TABLE                                                         │
│                                                                      │
│  [All (45)] [Upcoming (45)] [Completed (0)] [Canceled (0)]          │
│                                                                      │
│  ┌────────┬────────┬────────┬─────────┬──────────┬────────┬──────┐ │
│  │Trip ID │ Status │ Loads  │ Stops   │Projected │ Actual │ ...  │ │
│  ├────────┼────────┼────────┼─────────┼──────────┼────────┼──────┤ │
│  │T-001   │UPCOMING│ 3      │ 5       │ $522.09  │ --     │      │ │
│  │T-002   │UPCOMING│ 4      │ 6       │ $592.09  │ --     │      │ │
│  │...     │        │        │         │          │        │      │ │
│  └────────┴────────┴────────┴─────────┴──────────┴────────┴──────┘ │
│                                                                      │
│  Showing 1-20 of 45                            [< Prev] [Next >]    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Create/Edit Batch Modal

```
┌─────────────────────────────────────────────────────────────────────┐
│  Create New Batch                                              [X]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Name *                                                              │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ Week 7 - Feb 2026                                               ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  Description (optional)                                              │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ Regular weekly deliveries for Zone A                            ││
│  │                                                                  ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│                                            [Cancel]  [Create Batch] │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Database Migration (Foundation)
**Estimated scope: Schema + Migration**

#### Tasks:
1. Create new `TripBatch` model in schema
2. Update `Trip` model (remove weekId, importBatchId → add batchId)
3. Update `AmazonInvoice` model (remove importBatchId → add batchId)
4. Write migration script to:
   - Create TripBatch records from existing TripImportBatch
   - Link existing Trips to new TripBatch
   - Link existing AmazonInvoices to TripBatch (match by date overlap)
   - Calculate rollup metrics on TripBatch
5. Remove old models: TripImportBatch, InvoiceImportBatch, ForecastWeek
6. Update User model relations
7. Run `prisma migrate dev --name trip-batch-consolidation`

#### Migration Logic:
```typescript
// Pseudocode for migration
for each TripImportBatch {
  // Create TripBatch with same data
  const batch = createTripBatch({
    name: `Import - ${formatDate(periodStart)} to ${formatDate(periodEnd)}`,
    description: "Auto-migrated from import batch",
    status: deriveStatus(trips, invoices),
    tripFileHash: fileHash,
    // Copy metrics...
  });

  // Link trips
  updateTrips({ importBatchId: oldId }, { batchId: batch.id });

  // Find matching invoice by date overlap
  const invoice = findInvoiceByDateOverlap(periodStart, periodEnd);
  if (invoice) {
    updateInvoice(invoice.id, { batchId: batch.id });
    updateBatch(batch.id, {
      status: 'INVOICED',
      invoiceImportedAt: invoice.createdAt,
      // Calculate actuals from invoice...
    });
  }
}
```

---

### Phase 2: Server Actions
**Estimated scope: CRUD + Import logic**

#### Files to Create/Update:
- `src/actions/forecasting/trip-batches.ts` (NEW)
- `src/actions/forecasting/trips.ts` (UPDATE)
- `src/actions/forecasting/amazon-invoices.ts` (UPDATE)

#### New Actions (trip-batches.ts):
```typescript
// CRUD
createTripBatch(name, description?)
updateTripBatch(id, { name?, description? })
deleteTripBatch(id) // Cascade deletes trips and invoices
getTripBatch(id)
getTripBatches(filters: { status?, search?, sortBy? })

// Import operations
importTripsToTripBatch(batchId, file) // Returns stats, handles duplicates
importInvoiceToTripBatch(batchId, file) // Auto-matches, updates actuals

// Utilities
checkDuplicateTripFile(batchId, fileHash)
checkDuplicateInvoiceFile(batchId, fileHash)
recalculateBatchMetrics(batchId)
```

#### Updated Actions (trips.ts):
```typescript
// Update to work with batchId instead of importBatchId
getTripsForBatch(batchId, filters?)
bulkDeleteTripsFromBatch(batchId, tripIds)
```

---

### Phase 3: UI Components
**Estimated scope: Cards + Modals + Tables**

#### New Components:
```
src/components/forecasting/
├── trip-batch-card.tsx           # Card for list view
├── trip-batch-card-skeleton.tsx  # Loading state
├── trip-batch-create-modal.tsx   # Create/Edit form
├── trip-batch-delete-dialog.tsx  # Confirmation dialog
├── trip-batch-import-section.tsx # Import cards (trips + invoice)
├── trip-batch-summary-card.tsx   # Metrics summary
└── trip-batch-status-badge.tsx   # Status indicator
```

#### Update Existing:
- `trips-table.tsx` → Work with batchId filter
- `trips-import-modal.tsx` → Accept batchId parameter
- `invoice-import-modal.tsx` → Accept batchId parameter

---

### Phase 4: Pages
**Estimated scope: 2 pages**

#### List Page: `/trips/page.tsx`
```typescript
// src/app/(dashboard)/trips/page.tsx
export default function TripBatchesPage() {
  // Fetch batches with filters
  // Render grid of TripBatchCards
  // Handle create modal
}
```

#### Detail Page: `/trips/[batchId]/page.tsx`
```typescript
// src/app/(dashboard)/trips/[batchId]/page.tsx
export default function TripBatchDetailPage({ params }) {
  // Fetch batch with trips
  // Render import section
  // Render trips table
  // Handle edit/delete
}
```

---

### Phase 5: Hooks & State
**Estimated scope: React Query hooks**

#### New Hooks:
```typescript
// src/hooks/use-trip-batches.ts
useTripBatches(filters?)      // List batches
useTripBatch(batchId)         // Single batch
useTripBatchTrips(batchId)    // Trips for batch
useCreateTripBatch()          // Mutation
useUpdateTripBatch()          // Mutation
useDeleteTripBatch()          // Mutation
useImportTripsToBatch()       // Mutation
useImportInvoiceToBatch()     // Mutation
```

---

### Phase 6: Navigation & Cleanup
**Estimated scope: Config + Cleanup**

#### Tasks:
1. Update `src/config/navigation.ts`:
   - Remove `/import-history` (merged into batch detail)
   - Update `/trips` label to "Trip Management"

2. Delete unused files:
   - `src/app/(dashboard)/import-history/` (entire folder)
   - `src/components/import-history/` (entire folder)
   - `src/actions/filters/import-history.ts`
   - `src/hooks/use-import-history.ts`

3. Update `/forecast-vs-actual` to filter by TripBatch

---

### Phase 7: Analytics Enhancement (Optional)
**Estimated scope: Cross-batch analysis**

#### Tasks:
1. Update `/forecast-vs-actual` to support:
   - Filter by multiple batches
   - Compare batches side-by-side
   - Trend analysis across batches

2. Add aggregate queries:
   - Revenue by month/quarter/year
   - Average variance trends
   - Completion rate trends

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER FLOW                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. CREATE BATCH                                                     │
│     User clicks [+ New Batch]                                        │
│     → Enters name, description                                       │
│     → TripBatch created with status: EMPTY                          │
│                                                                      │
│  2. IMPORT TRIPS                                                     │
│     User clicks [Import CSV] in batch detail                         │
│     → File hash checked for duplicates                              │
│     → Trips parsed and created with batchId                         │
│     → TripBatch metrics calculated                                  │
│     → Status updated to: UPCOMING                                   │
│                                                                      │
│  3. TRIPS COMPLETE (over time)                                       │
│     Trips naturally transition to COMPLETED status                   │
│     → User can re-import updated CSV to refresh statuses            │
│     → Duplicates skipped (by tripId)                                │
│     → Status may update to: IN_PROGRESS or COMPLETED                │
│                                                                      │
│  4. IMPORT INVOICE                                                   │
│     User clicks [Import Invoice] in batch detail                     │
│     → AmazonInvoice created with batchId                            │
│     → Line items matched to trips (by tripId)                       │
│     → Trip.actualLoads and Trip.actualRevenue updated               │
│     → TripBatch actuals calculated                                  │
│     → Variance calculated                                           │
│     → Projections LOCKED (projectionLockedAt = now)                 │
│     → Status updated to: INVOICED                                   │
│                                                                      │
│  5. ANALYZE                                                          │
│     User views batch summary                                         │
│     User compares across batches in /forecast-vs-actual             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Status Transitions

```
EMPTY ──────────────────────────────────────────────────────────────┐
  │                                                                  │
  │ [Import Trips CSV]                                               │
  ↓                                                                  │
UPCOMING ───────────────────────────────────────────────────────────┤
  │                                                                  │
  │ [Some trips COMPLETED/IN_PROGRESS]                               │
  ↓                                                                  │
IN_PROGRESS ────────────────────────────────────────────────────────┤
  │                                                                  │
  │ [All non-canceled trips COMPLETED]                               │
  ↓                                                                  │
COMPLETED ──────────────────────────────────────────────────────────┤
  │                                                                  │
  │ [Import Invoice]                                                 │
  ↓                                                                  │
INVOICED ───────────────────────────────────────────────────────────┘
          (Final state - projections locked)
```

---

## File Structure After Implementation

```
src/
├── actions/forecasting/
│   ├── trip-batches.ts      # NEW: TripBatch CRUD + imports
│   ├── trips.ts             # UPDATED: Work with batchId
│   ├── amazon-invoices.ts   # UPDATED: Work with batchId
│   └── forecasts.ts         # UNCHANGED
│
├── app/(dashboard)/
│   ├── trips/
│   │   ├── page.tsx         # REWRITTEN: Batch cards list
│   │   └── [batchId]/
│   │       └── page.tsx     # NEW: Batch detail
│   ├── forecasting/
│   │   └── page.tsx         # UNCHANGED
│   ├── forecast-vs-actual/
│   │   └── page.tsx         # UPDATED: Filter by batch
│   └── (DELETED: import-history/, amazon-invoices/)
│
├── components/forecasting/
│   ├── trip-batch-card.tsx           # NEW
│   ├── trip-batch-create-modal.tsx   # NEW
│   ├── trip-batch-delete-dialog.tsx  # NEW
│   ├── trip-batch-import-section.tsx # NEW
│   ├── trip-batch-summary-card.tsx   # NEW
│   ├── trip-batch-status-badge.tsx   # NEW
│   ├── trips-table.tsx               # UPDATED
│   ├── trips-import-modal.tsx        # UPDATED
│   ├── invoice-import-modal.tsx      # UPDATED (renamed)
│   └── (KEEP: variance-*, forecast-calculator, etc.)
│
├── hooks/
│   ├── use-trip-batches.ts  # NEW
│   └── (DELETED: use-import-history.ts)
│
└── config/
    └── navigation.ts        # UPDATED
```

---

## Why Keep AmazonInvoiceLineItem?

| Reason | Explanation |
|--------|-------------|
| **Matching accuracy** | Line items contain tripId for precise matching |
| **Audit trail** | Can trace exactly which loads were paid |
| **Detailed breakdown** | Shows baseRate, fuelSurcharge, detention, tonu per load |
| **Dispute resolution** | If revenue doesn't match, line items show why |
| **Future analytics** | Can analyze accessorial patterns, detention frequency |

**Recommendation**: KEEP `AmazonInvoiceLineItem` - the storage cost is minimal and the data value is high.

---

## Migration Safety

### Rollback Plan
1. Before migration, export current data:
   ```bash
   pg_dump -t trip_import_batch -t invoice_import_batch -t forecast_week > backup.sql
   ```

2. Migration is additive first:
   - Create TripBatch
   - Populate from existing data
   - Update foreign keys
   - Verify data integrity
   - THEN drop old tables

### Data Verification Queries
```sql
-- Verify all trips migrated
SELECT COUNT(*) FROM trip WHERE batch_id IS NULL AND import_batch_id IS NOT NULL;
-- Should be 0

-- Verify metrics match
SELECT
  tb.id,
  tb.projected_total,
  (SELECT SUM(projected_revenue) FROM trip WHERE batch_id = tb.id)
FROM trip_batch tb;
-- Values should match
```

---

## Success Criteria

| Metric | Target |
|--------|--------|
| All existing data migrated | 100% of trips, invoices preserved |
| No duplicate trips after re-import | Enforced by tripId unique constraint |
| Invoice auto-matching accuracy | Same as current (by tripId) |
| Page load time | < 2s for 100 batches |
| User can complete full workflow | Create → Import → Invoice in one page |

---

## Questions Resolved

| Question | Decision |
|----------|----------|
| Granularity of batches | User-defined (not forced to weeks) |
| Auto-match invoices | Yes, within batch scope by tripId |
| Allow duplicate imports | No, skip by tripId |
| Archive old batches | No, keep all for analytics |
| Detail view type | Separate page (`/trips/[batchId]`) |
| What shows on cards | Name, status, trip count, loads, revenue, variance (if invoiced) |
| Keep AmazonInvoiceLineItem | Yes, for matching and audit |

---

## Next Steps

1. **Review this plan** - Confirm approach before implementation
2. **Phase 1**: Database migration (most critical, do first)
3. **Phase 2-5**: Implement in order (server → components → pages → hooks)
4. **Phase 6**: Cleanup old code
5. **Phase 7**: Analytics (optional enhancement)

---

*Document version: 1.0*
*Last updated: February 5, 2026*

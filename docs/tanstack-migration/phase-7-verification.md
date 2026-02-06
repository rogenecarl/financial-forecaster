# Phase 7: Testing & Verification

## Build Verification
```bash
pnpm build    # Must pass with no TypeScript errors
pnpm lint     # Must pass with no ESLint errors
```

## Page-by-Page Testing

### Dashboard (`/dashboard`)
- [ ] Loading skeletons show on first load
- [ ] All widgets populate with data
- [ ] User name displays correctly
- [ ] Navigate away and back — data loads instantly from cache
- [ ] After 1 minute, data refetches in background

### Transactions (`/transactions`)
- [ ] No changes expected — verify still works
- [ ] CRUD operations with toast notifications
- [ ] Import/export functionality

### Trip Management (`/trips`)
- [ ] Batch list loads with search/filter
- [ ] Create new batch navigates to detail
- [ ] Edit batch updates inline
- [ ] Delete batch with confirmation dialog
- [ ] Navigate away and back — cached batch list

### Trip Batch Detail (`/trips/[batchId]`)
- [ ] Batch details load with status badge
- [ ] Trips table loads with status filter
- [ ] Bulk delete trips works
- [ ] Import trips/invoices work
- [ ] Invoice details table shows for INVOICED batches
- [ ] Charts render correctly

### Analytics (`/analytics`)
- [ ] Year selector changes data
- [ ] Historical comparison with YTD/quarterly tabs
- [ ] Refetch button works
- [ ] Insight cards calculate correctly

### Forecast vs Actual (`/forecast-vs-actual`)
- [ ] Invoiced batches filter works
- [ ] All batches filter works
- [ ] Aggregate stats calculate correctly
- [ ] Batch rows link to detail pages

### Forecasting (`/forecasting`)
- [ ] No changes expected — verify still works
- [ ] Calculator and saved scenarios

### P&L Statement (`/pl-statement`)
- [ ] No changes expected — verify still works
- [ ] Period selection and data display

### Categories (`/categories`)
- [ ] Categories load grouped by type
- [ ] Create new category with form
- [ ] Edit existing category
- [ ] Delete category with confirmation
- [ ] Toast notifications for all operations

### Reports (`/reports`)
- [ ] Weekly P&L PDF generation works
- [ ] Monthly P&L PDF generation works
- [ ] Transaction CSV export works
- [ ] Forecast Excel export works
- [ ] CPA Package ZIP generation works
- [ ] Loading spinners show during generation
- [ ] Recent exports list updates after each generation
- [ ] Validation toasts for missing selections

## Cross-Cutting Verification

### Caching
- [ ] Navigate between pages rapidly — no loading flash on revisit within 30 seconds
- [ ] After staleTime expires, background refetch occurs
- [ ] Hard refresh clears cache and shows loading state

### Query Invalidation
- [ ] Creating a trip batch refreshes the trips list
- [ ] Importing trips refreshes batch detail and trips table
- [ ] Deleting a category refreshes category list AND transactions category dropdown
- [ ] Creating a transaction refreshes the transactions list

### Error Handling
- [ ] Server errors show toast notifications
- [ ] Network errors trigger 1 retry then show error toast
- [ ] Auth expiry redirects to login

## Summary of Unchanged Pages (Verify No Regression)
- `transactions/page.tsx` — already correct
- `forecasting/page.tsx` — already correct
- `pl-statement/page.tsx` — already correct
- All server actions — no changes
- All child components — no changes

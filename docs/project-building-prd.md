# Financial Forecaster — Project Building PRD

**Version:** 1.0
**Created:** January 2026
**Client:** Peak Transport LLC

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Design System & UI/UX Principles](#2-design-system--uiux-principles)
3. [Performance Optimization Guidelines](#3-performance-optimization-guidelines)
4. [Phase 1: Database Schema](#phase-1-database-schema)
5. [Phase 2: Authentication (Completed)](#phase-2-authentication-completed)
6. [Phase 3: Layout & Navigation](#phase-3-layout--navigation)
7. [Phase 4: Settings Module](#phase-4-settings-module)
8. [Phase 5: Bookkeeping Module](#phase-5-bookkeeping-module)
9. [Phase 6: Forecasting Module](#phase-6-forecasting-module)
10. [Phase 7: Dashboard Module](#phase-7-dashboard-module)
11. [Phase 8: Reports Module](#phase-8-reports-module)
12. [Phase 9: Testing & Optimization](#phase-9-testing--optimization)

---

## 1. Project Overview

### 1.1 Purpose

Financial Forecaster is an internal web application for Peak Transport LLC that provides:
1. **Bookkeeping** — Track financial transactions and generate P&L statements
2. **Forecasting** — Predict weekly Amazon payouts and compare with actual results

### 1.2 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router) + TypeScript |
| State Management | Zustand |
| Data Fetching | TanStack Query |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Database | PostgreSQL + Prisma 7 |
| Authentication | Better Auth (Completed) |
| AI | Claude API (Anthropic) |
| CSV Parsing | Papa Parse |
| Excel Parsing | SheetJS (xlsx) |
| Validation | Zod 4 |

### 1.3 Project Structure

```
src/
├── app/
│   ├── (auth)/                 # Auth pages (login, register)
│   ├── (landing)/              # Landing page
│   ├── (dashboard)/            # Protected dashboard routes
│   │   ├── layout.tsx          # Dashboard layout with sidebar
│   │   ├── page.tsx            # Main dashboard
│   │   ├── transactions/       # Transactions page
│   │   ├── pl-statement/       # P&L Statement page
│   │   ├── amazon-invoices/    # Amazon Invoices page
│   │   ├── trips/              # Trips page
│   │   ├── forecasting/        # Forecasting page
│   │   ├── forecast-vs-actual/ # Comparison page
│   │   ├── reports/            # Reports page
│   │   └── settings/           # Settings page
│   └── api/
│       ├── auth/               # Better Auth routes
│       ├── import/             # Data import endpoints
│       └── ai/                 # Claude API endpoints
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── layout/                 # Layout components
│   ├── dashboard/              # Dashboard-specific components
│   ├── transactions/           # Transaction components
│   ├── forecasting/            # Forecasting components
│   └── shared/                 # Shared/reusable components
├── actions/                    # Server Actions
├── hooks/                      # Custom React hooks
├── lib/                        # Utilities and configurations
├── schema/                     # Zod validation schemas
├── stores/                     # Zustand stores
└── types/                      # TypeScript types
```

---

## 2. Design System & UI/UX Principles

### 2.1 Design Tokens

```typescript
// Color Palette (Tailwind CSS 4)
const colors = {
  // Primary - Professional Blue
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
  },
  // Success - Green (for positive values)
  success: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a',
  },
  // Danger - Red (for negative values)
  danger: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626',
  },
  // Warning - Amber (for alerts)
  warning: {
    50: '#fffbeb',
    500: '#f59e0b',
    600: '#d97706',
  },
  // Neutral - Slate (for text/backgrounds)
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
};

// Typography Scale
const typography = {
  // Font Family
  fontFamily: 'Inter, system-ui, sans-serif',
  fontMono: 'JetBrains Mono, monospace',

  // Font Sizes
  xs: '0.75rem',     // 12px - Labels, badges
  sm: '0.875rem',    // 14px - Body small, table cells
  base: '1rem',      // 16px - Body text
  lg: '1.125rem',    // 18px - Subheadings
  xl: '1.25rem',     // 20px - Card titles
  '2xl': '1.5rem',   // 24px - Page titles
  '3xl': '1.875rem', // 30px - Dashboard metrics
  '4xl': '2.25rem',  // 36px - Hero numbers
};

// Spacing Scale (consistent 4px base)
const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
};

// Border Radius
const borderRadius = {
  none: '0',
  sm: '0.25rem',   // 4px - Badges, small elements
  md: '0.375rem',  // 6px - Buttons, inputs
  lg: '0.5rem',    // 8px - Cards, modals
  xl: '0.75rem',   // 12px - Large cards
  full: '9999px',  // Pills, avatars
};

// Shadows
const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
};
```

### 2.2 Component Patterns

#### Card Component Pattern

```tsx
// Consistent card structure across all pages
<Card className="rounded-lg border border-neutral-200 bg-white shadow-sm">
  <CardHeader className="border-b border-neutral-100 px-6 py-4">
    <CardTitle className="text-lg font-semibold text-neutral-900">
      {title}
    </CardTitle>
    {description && (
      <CardDescription className="text-sm text-neutral-500">
        {description}
      </CardDescription>
    )}
  </CardHeader>
  <CardContent className="p-6">
    {children}
  </CardContent>
  {footer && (
    <CardFooter className="border-t border-neutral-100 px-6 py-4">
      {footer}
    </CardFooter>
  )}
</Card>
```

#### Button Variants

```tsx
// Primary Action (Import, Save, Submit)
<Button variant="default" size="md">
  Primary Action
</Button>

// Secondary Action (Cancel, Back)
<Button variant="outline" size="md">
  Secondary Action
</Button>

// Destructive Action (Delete)
<Button variant="destructive" size="md">
  Delete
</Button>

// Ghost Action (Icons, subtle actions)
<Button variant="ghost" size="icon">
  <Icon />
</Button>
```

#### Form Input Pattern

```tsx
// Consistent form field structure
<div className="space-y-2">
  <Label htmlFor="field" className="text-sm font-medium text-neutral-700">
    Field Label
    {required && <span className="text-danger-500">*</span>}
  </Label>
  <Input
    id="field"
    placeholder="Placeholder text..."
    className="h-10 rounded-md border-neutral-300 focus:border-primary-500 focus:ring-primary-500"
  />
  {error && (
    <p className="text-sm text-danger-500">{error}</p>
  )}
  {hint && (
    <p className="text-sm text-neutral-500">{hint}</p>
  )}
</div>
```

#### Table Pattern

```tsx
// Consistent table structure
<div className="rounded-lg border border-neutral-200 overflow-hidden">
  <Table>
    <TableHeader className="bg-neutral-50">
      <TableRow>
        <TableHead className="text-xs font-semibold uppercase text-neutral-600">
          Column
        </TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow className="hover:bg-neutral-50 transition-colors">
        <TableCell className="text-sm text-neutral-900">
          Content
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</div>
```

### 2.3 Layout Patterns

#### Page Layout Structure

```tsx
// Consistent page structure
export default function PageName() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Page Title</h1>
          <p className="text-sm text-neutral-500">Page description</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Secondary</Button>
          <Button>Primary Action</Button>
        </div>
      </div>

      {/* Page Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>{/* Content */}</Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>{/* Sidebar content */}</Card>
        </div>
      </div>
    </div>
  );
}
```

#### Responsive Grid System

```tsx
// Grid breakpoints
// Mobile: 1 column (default)
// Tablet (sm: 640px): 2 columns
// Desktop (lg: 1024px): 3-4 columns
// Wide (xl: 1280px): 4+ columns

// Dashboard cards grid
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  <MetricCard />
  <MetricCard />
  <MetricCard />
  <MetricCard />
</div>

// Content + Sidebar
<div className="grid gap-6 lg:grid-cols-3">
  <div className="lg:col-span-2">{/* Main */}</div>
  <div>{/* Sidebar */}</div>
</div>

// Form layout
<div className="grid gap-4 sm:grid-cols-2">
  <FormField />
  <FormField />
</div>
```

### 2.4 Interaction Patterns

#### Loading States

```tsx
// Skeleton loading for cards
<Card>
  <CardContent className="p-6">
    <Skeleton className="h-8 w-32 mb-2" />
    <Skeleton className="h-4 w-24" />
  </CardContent>
</Card>

// Table loading
<TableRow>
  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
</TableRow>

// Button loading
<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Processing...
</Button>
```

#### Empty States

```tsx
// Consistent empty state pattern
<div className="flex flex-col items-center justify-center py-12 text-center">
  <div className="rounded-full bg-neutral-100 p-4 mb-4">
    <FileIcon className="h-8 w-8 text-neutral-400" />
  </div>
  <h3 className="text-lg font-semibold text-neutral-900 mb-1">
    No transactions yet
  </h3>
  <p className="text-sm text-neutral-500 mb-4 max-w-sm">
    Import your bank transactions to get started with bookkeeping.
  </p>
  <Button>
    <Upload className="mr-2 h-4 w-4" />
    Import Transactions
  </Button>
</div>
```

#### Toast Notifications

```tsx
// Success
toast.success("Transaction categorized successfully");

// Error
toast.error("Failed to import file. Please try again.");

// Info
toast.info("Processing your data...");

// Action toast
toast("Transaction imported", {
  action: {
    label: "Undo",
    onClick: () => undoImport(),
  },
});
```

### 2.5 Accessibility Requirements

| Requirement | Implementation |
|-------------|----------------|
| Keyboard Navigation | All interactive elements focusable with Tab |
| Focus Indicators | Visible focus ring (`focus:ring-2 focus:ring-primary-500`) |
| Color Contrast | WCAG AA minimum (4.5:1 for text) |
| Screen Readers | Proper ARIA labels and roles |
| Reduced Motion | `prefers-reduced-motion` media query support |
| Form Labels | All inputs have associated labels |
| Error Messages | Clear, descriptive error messages |

---

## 3. Performance Optimization Guidelines

### 3.1 Next.js Optimizations

#### Server Components (Default)

```tsx
// Use Server Components for data fetching
// src/app/(dashboard)/transactions/page.tsx
export default async function TransactionsPage() {
  const transactions = await getTransactions();
  return <TransactionList transactions={transactions} />;
}
```

#### Client Components (When Needed)

```tsx
// Only use 'use client' when necessary
// - Event handlers (onClick, onChange)
// - Browser APIs (localStorage, window)
// - React hooks (useState, useEffect)
// - Third-party client libraries

'use client';
export function TransactionFilters() {
  const [filter, setFilter] = useState('all');
  // ...
}
```

#### Dynamic Imports

```tsx
// Lazy load heavy components
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('@/components/charts/CashFlowChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false, // Disable SSR for chart libraries
});

const ImportModal = dynamic(() => import('@/components/modals/ImportModal'));
```

### 3.2 Data Fetching Patterns

#### Server Actions for Mutations

```tsx
// src/actions/transactions.ts
'use server';

export async function createTransaction(data: TransactionInput) {
  const validated = transactionSchema.parse(data);
  const transaction = await db.transaction.create({ data: validated });
  revalidatePath('/transactions');
  return { success: true, data: transaction };
}
```

#### TanStack Query for Client Data

```tsx
// Use for client-side data that needs caching/revalidation
export function useTransactions(filters: Filters) {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => fetchTransactions(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### 3.3 Bundle Optimization

#### Import Optimization

```tsx
// BAD - Imports entire library
import { format, parseISO, addDays } from 'date-fns';

// GOOD - Tree-shakeable imports
import format from 'date-fns/format';
import parseISO from 'date-fns/parseISO';

// BAD - Imports all icons
import * as Icons from 'lucide-react';

// GOOD - Named imports
import { Plus, Upload, Download } from 'lucide-react';
```

#### Image Optimization

```tsx
// Always use next/image
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="Peak Transport"
  width={120}
  height={40}
  priority // For above-fold images
/>
```

### 3.4 Database Query Optimization

#### Pagination

```tsx
// Always paginate large datasets
export async function getTransactions(page = 1, limit = 50) {
  return db.transaction.findMany({
    take: limit,
    skip: (page - 1) * limit,
    orderBy: { postingDate: 'desc' },
    include: { category: true },
  });
}
```

#### Select Only Needed Fields

```tsx
// BAD - Fetches all fields
const transactions = await db.transaction.findMany();

// GOOD - Only fetch needed fields
const transactions = await db.transaction.findMany({
  select: {
    id: true,
    description: true,
    amount: true,
    postingDate: true,
    category: { select: { name: true, color: true } },
  },
});
```

#### Batch Operations

```tsx
// Use transactions for multiple operations
await db.$transaction([
  db.transaction.createMany({ data: transactions }),
  db.importLog.create({ data: importLog }),
]);
```

### 3.5 Caching Strategy

| Data Type | Cache Strategy | Revalidation |
|-----------|---------------|--------------|
| Categories | Static | On change |
| Dashboard Metrics | 5 minutes | On data change |
| Transactions List | 1 minute | On import |
| User Settings | Static | On change |
| Forecasts | 5 minutes | On calculation |

---

## Phase 1: Database Schema

### 1.1 Overview

Create all database tables while preserving existing authentication models (User, Session, Account, Verification).

### 1.2 Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider        = "prisma-client-js"
  output          = "../src/lib/generated/prisma"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// AUTHENTICATION MODELS (DO NOT MODIFY)
// ============================================

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified Boolean   @default(false)
  image         String?
  role          Role      @default(USER)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations - Auth
  sessions      Session[]
  accounts      Account[]

  // Relations - App
  transactions    Transaction[]
  categoryRules   CategoryRule[]
  amazonInvoices  AmazonInvoice[]
  trips           Trip[]
  forecasts       Forecast[]
  settings        UserSettings?

  @@map("users")
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model Account {
  id                    String    @id @default(cuid())
  userId                String
  accountId             String
  providerId            String
  accessToken           String?
  refreshToken          String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  idToken               String?
  password              String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("accounts")
}

model Verification {
  id         String   @id @default(cuid())
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@map("verifications")
}

enum Role {
  USER
  ADMIN
  PROVIDER
}

// ============================================
// BOOKKEEPING MODELS
// ============================================

model Category {
  id          String       @id @default(cuid())
  name        String       @unique
  type        CategoryType
  color       String       @default("#6b7280") // Hex color for UI
  icon        String?      // Lucide icon name
  description String?
  includeInPL Boolean      @default(true)
  isSystem    Boolean      @default(false) // System categories can't be deleted
  sortOrder   Int          @default(0)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  // Relations
  transactions  Transaction[]
  categoryRules CategoryRule[]

  @@map("categories")
}

enum CategoryType {
  REVENUE
  EXPENSE
  TRANSFER
  UNKNOWN
}

model Transaction {
  id              String            @id @default(cuid())
  userId          String
  categoryId      String?
  importBatchId   String?

  // Bank data fields
  details         String            // DEBIT, CREDIT, CHECK, DSLIP
  postingDate     DateTime
  description     String
  amount          Decimal           @db.Decimal(12, 2)
  type            String            // ACH_DEBIT, ACH_CREDIT, DEBIT_CARD, etc.
  balance         Decimal?          @db.Decimal(12, 2)
  checkOrSlipNum  String?

  // Categorization
  aiCategorized   Boolean           @default(false)
  aiConfidence    Float?            // 0-1 confidence score
  manualOverride  Boolean           @default(false)
  reviewStatus    ReviewStatus      @default(PENDING)

  // Matching
  amazonInvoiceId String?           // Link to Amazon invoice if matched

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  // Relations
  user          User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  category      Category?      @relation(fields: [categoryId], references: [id], onSetNull: SetNull)
  importBatch   ImportBatch?   @relation(fields: [importBatchId], references: [id])
  amazonInvoice AmazonInvoice? @relation(fields: [amazonInvoiceId], references: [id])

  @@index([userId, postingDate])
  @@index([categoryId])
  @@index([importBatchId])
  @@map("transactions")
}

enum ReviewStatus {
  PENDING
  REVIEWED
  FLAGGED
}

model ImportBatch {
  id           String   @id @default(cuid())
  userId       String
  fileName     String
  fileType     String   // CSV, XLSX
  recordCount  Int
  status       String   @default("completed") // processing, completed, failed
  errorMessage String?
  createdAt    DateTime @default(now())

  // Relations
  transactions Transaction[]

  @@map("import_batches")
}

model CategoryRule {
  id          String   @id @default(cuid())
  userId      String
  categoryId  String

  // Matching criteria
  pattern     String   // Regex or text pattern
  matchType   String   @default("contains") // contains, startsWith, endsWith, regex
  field       String   @default("description") // description, type, details

  // Rule metadata
  priority    Int      @default(0) // Higher = checked first
  isActive    Boolean  @default(true)
  hitCount    Int      @default(0) // Track usage

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  category Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@index([userId, isActive])
  @@map("category_rules")
}

// ============================================
// FORECASTING MODELS
// ============================================

model AmazonInvoice {
  id             String   @id @default(cuid())
  userId         String

  // Invoice header
  invoiceNumber  String   @unique
  routeDomicile  String?  // Minneapolis, MN
  equipment      String?  // 26-Foot Box Truck
  programType    String?  // Fixed and Variable - Flex

  // Totals (calculated from line items)
  totalTourPay      Decimal @db.Decimal(12, 2) @default(0)
  totalAccessorials Decimal @db.Decimal(12, 2) @default(0)
  totalAdjustments  Decimal @db.Decimal(12, 2) @default(0)
  totalPay          Decimal @db.Decimal(12, 2) @default(0)

  // Period
  periodStart    DateTime?
  periodEnd      DateTime?
  paymentDate    DateTime?

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relations
  user      User                    @relation(fields: [userId], references: [id], onDelete: Cascade)
  lineItems AmazonInvoiceLineItem[]
  transactions Transaction[]

  @@index([userId, paymentDate])
  @@map("amazon_invoices")
}

model AmazonInvoiceLineItem {
  id              String   @id @default(cuid())
  invoiceId       String

  // Identifiers
  tripId          String
  loadId          String?  // Null for Tour rows

  // Dates
  startDate       DateTime?
  endDate         DateTime?

  // Details
  operator        String?  // Solo, Team
  distanceMiles   Decimal  @db.Decimal(10, 2) @default(0)
  durationHours   Decimal  @db.Decimal(6, 2) @default(0)

  // Item type
  itemType        InvoiceItemType

  // Pay breakdown
  baseRate        Decimal  @db.Decimal(10, 2) @default(0) // $452 for tours
  fuelSurcharge   Decimal  @db.Decimal(10, 2) @default(0) // Accessorial
  detention       Decimal  @db.Decimal(10, 2) @default(0)
  tonu            Decimal  @db.Decimal(10, 2) @default(0) // Truck Ordered Not Used
  grossPay        Decimal  @db.Decimal(10, 2) @default(0)

  comments        String?

  createdAt       DateTime @default(now())

  // Relations
  invoice AmazonInvoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)

  @@index([invoiceId])
  @@index([tripId])
  @@map("amazon_invoice_line_items")
}

enum InvoiceItemType {
  TOUR_COMPLETED
  LOAD_COMPLETED
  ADJUSTMENT_DISPUTE
  ADJUSTMENT_OTHER
}

model Trip {
  id              String     @id @default(cuid())
  userId          String
  weekId          String?    // Group trips by week

  // Identifiers
  tripId          String     // Amazon Trip ID (T-112YY5BG)
  status          TripStatus @default(SCHEDULED)

  // Dates
  scheduledDate   DateTime

  // Load tracking
  projectedLoads  Int        @default(0) // Auto-calculated from CSV
  actualLoads     Int?       // Manually updated nightly

  // Stop details (from CSV)
  stop1Id         String?
  stop2Id         String?
  stop3Id         String?
  stop4Id         String?
  stop5Id         String?
  stop6Id         String?
  stop7Id         String?

  // Calculated fields
  projectedRevenue Decimal?  @db.Decimal(10, 2)
  actualRevenue    Decimal?  @db.Decimal(10, 2)

  notes           String?

  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  // Relations
  user  User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  week  ForecastWeek? @relation(fields: [weekId], references: [id])
  loads TripLoad[]

  @@unique([userId, tripId])
  @@index([userId, scheduledDate])
  @@index([weekId])
  @@map("trips")
}

enum TripStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

model TripLoad {
  id          String   @id @default(cuid())
  tripId      String

  loadId      String   // Amazon Load ID
  stopNumber  Int      // 2, 3, 4, 5, 6, 7
  address     String?
  isDelivery  Boolean  @default(true) // False for Bobtail/station stops

  createdAt   DateTime @default(now())

  // Relations
  trip Trip @relation(fields: [tripId], references: [id], onDelete: Cascade)

  @@index([tripId])
  @@map("trip_loads")
}

model ForecastWeek {
  id          String   @id @default(cuid())
  userId      String

  // Week identification
  weekStart   DateTime // Monday
  weekEnd     DateTime // Sunday
  weekNumber  Int      // Week of year
  year        Int

  // Inputs
  truckCount  Int      @default(2)
  nightsCount Int      @default(7)

  // Projected (before week)
  projectedTours        Int      @default(0)
  projectedLoads        Int      @default(0)
  projectedTourPay      Decimal  @db.Decimal(12, 2) @default(0)
  projectedAccessorials Decimal  @db.Decimal(12, 2) @default(0)
  projectedTotal        Decimal  @db.Decimal(12, 2) @default(0)

  // Actual (after invoice)
  actualTours           Int?
  actualLoads           Int?
  actualTourPay         Decimal? @db.Decimal(12, 2)
  actualAccessorials    Decimal? @db.Decimal(12, 2)
  actualAdjustments     Decimal? @db.Decimal(12, 2)
  actualTotal           Decimal? @db.Decimal(12, 2)

  // Variance
  variance              Decimal? @db.Decimal(12, 2)
  variancePercent       Float?

  notes       String?
  status      ForecastStatus @default(PROJECTED)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  trips Trip[]

  @@unique([userId, weekStart])
  @@index([userId, year, weekNumber])
  @@map("forecast_weeks")
}

enum ForecastStatus {
  PROJECTED
  IN_PROGRESS
  COMPLETED
}

model Forecast {
  id          String   @id @default(cuid())
  userId      String

  // Scenario details
  name        String
  description String?
  isDefault   Boolean  @default(false)

  // Input parameters
  truckCount      Int
  nightsPerWeek   Int      @default(7)
  toursPerTruck   Int      @default(1)
  avgLoadsPerTour Decimal  @db.Decimal(4, 2) @default(4)

  // Rates
  dtrRate             Decimal @db.Decimal(10, 2) @default(452)
  avgAccessorialRate  Decimal @db.Decimal(10, 2) @default(77)

  // Labor costs
  hourlyWage          Decimal @db.Decimal(10, 2) @default(20)
  hoursPerNight       Decimal @db.Decimal(4, 2) @default(10)
  overtimeMultiplier  Decimal @db.Decimal(3, 2) @default(1.5)
  payrollTaxRate      Decimal @db.Decimal(5, 4) @default(0.0765) // 7.65%
  workersCompRate     Decimal @db.Decimal(5, 4) @default(0.05)   // 5%

  // Calculated results
  weeklyRevenue       Decimal @db.Decimal(12, 2)
  weeklyLaborCost     Decimal @db.Decimal(12, 2)
  weeklyOverhead      Decimal @db.Decimal(12, 2) @default(0)
  weeklyProfit        Decimal @db.Decimal(12, 2)
  contributionMargin  Decimal @db.Decimal(10, 2) // Per truck per day

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("forecasts")
}

// ============================================
// SETTINGS MODELS
// ============================================

model UserSettings {
  id     String @id @default(cuid())
  userId String @unique

  // Display preferences
  dateFormat       String @default("MM/dd/yyyy")
  currencyFormat   String @default("USD")
  timezone         String @default("America/Chicago")

  // Default values
  defaultDtrRate           Decimal @db.Decimal(10, 2) @default(452)
  defaultAccessorialRate   Decimal @db.Decimal(10, 2) @default(77)
  defaultHourlyWage        Decimal @db.Decimal(10, 2) @default(20)
  defaultHoursPerNight     Decimal @db.Decimal(4, 2) @default(10)
  defaultTruckCount        Int     @default(2)

  // Excluded addresses for load counting
  excludedAddresses String[] @default(["MSP7", "MSP8", "MSP9"])

  // AI settings
  aiCategorizationEnabled  Boolean @default(true)
  aiConfidenceThreshold    Float   @default(0.8) // Auto-apply above this

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_settings")
}
```

### 1.3 Database Seeding

```typescript
// prisma/seed.ts

const defaultCategories = [
  // Revenue
  { name: 'Amazon Payout', type: 'REVENUE', color: '#22c55e', icon: 'DollarSign', isSystem: true, sortOrder: 1 },
  { name: 'Other Income', type: 'REVENUE', color: '#16a34a', icon: 'Plus', sortOrder: 2 },

  // Expenses - Included in P&L
  { name: 'Driver Wages', type: 'EXPENSE', color: '#3b82f6', icon: 'Users', includeInPL: true, isSystem: true, sortOrder: 10 },
  { name: 'Payroll Taxes', type: 'EXPENSE', color: '#6366f1', icon: 'Receipt', includeInPL: true, isSystem: true, sortOrder: 11 },
  { name: 'Workers Comp', type: 'EXPENSE', color: '#8b5cf6', icon: 'Shield', includeInPL: true, isSystem: true, sortOrder: 12 },
  { name: 'Insurance', type: 'EXPENSE', color: '#a855f7', icon: 'FileCheck', includeInPL: true, isSystem: true, sortOrder: 13 },
  { name: 'Admin/Overhead', type: 'EXPENSE', color: '#ec4899', icon: 'Building', includeInPL: true, sortOrder: 14 },
  { name: 'Bank Fees', type: 'EXPENSE', color: '#f43f5e', icon: 'CreditCard', includeInPL: true, sortOrder: 15 },

  // Expenses - Excluded from P&L (per PRD)
  { name: 'Fuel', type: 'EXPENSE', color: '#f97316', icon: 'Fuel', includeInPL: false, sortOrder: 20 },
  { name: 'Maintenance', type: 'EXPENSE', color: '#eab308', icon: 'Wrench', includeInPL: false, sortOrder: 21 },

  // Transfers
  { name: 'Cash Transfer', type: 'TRANSFER', color: '#64748b', icon: 'ArrowLeftRight', includeInPL: false, sortOrder: 30 },
  { name: 'Personal/Excluded', type: 'TRANSFER', color: '#94a3b8', icon: 'UserX', includeInPL: false, sortOrder: 31 },

  // Unknown
  { name: 'Uncategorized', type: 'UNKNOWN', color: '#cbd5e1', icon: 'HelpCircle', includeInPL: false, isSystem: true, sortOrder: 99 },
];

const defaultCategoryRules = [
  // Revenue patterns
  { pattern: 'AMAZON.COM SERVICES', matchType: 'contains', field: 'description', categoryName: 'Amazon Payout', priority: 100 },
  { pattern: 'AMAZON EDI PAYMENTS', matchType: 'contains', field: 'description', categoryName: 'Amazon Payout', priority: 100 },

  // Payroll patterns
  { pattern: 'ADP WAGE PAY', matchType: 'contains', field: 'description', categoryName: 'Driver Wages', priority: 90 },
  { pattern: 'ADP Tax', matchType: 'contains', field: 'description', categoryName: 'Payroll Taxes', priority: 90 },
  { pattern: 'ADP PAYROLL FEES', matchType: 'contains', field: 'description', categoryName: 'Admin/Overhead', priority: 90 },

  // Insurance
  { pattern: 'AMAZON INSURANCE', matchType: 'contains', field: 'description', categoryName: 'Insurance', priority: 90 },

  // Workers Comp
  { pattern: 'Wise Inc', matchType: 'contains', field: 'description', categoryName: 'Workers Comp', priority: 80 },

  // Admin/Overhead
  { pattern: 'OPENPHONE', matchType: 'contains', field: 'description', categoryName: 'Admin/Overhead', priority: 70 },
  { pattern: 'QUO (OPENPHONE)', matchType: 'contains', field: 'description', categoryName: 'Admin/Overhead', priority: 70 },
  { pattern: 'NAME-CHEAP', matchType: 'contains', field: 'description', categoryName: 'Admin/Overhead', priority: 70 },
  { pattern: 'Monday.com', matchType: 'contains', field: 'description', categoryName: 'Admin/Overhead', priority: 70 },
  { pattern: 'INDEED', matchType: 'contains', field: 'description', categoryName: 'Admin/Overhead', priority: 70 },

  // Bank fees
  { pattern: 'MONTHLY SERVICE FEE', matchType: 'contains', field: 'description', categoryName: 'Bank Fees', priority: 80 },
  { pattern: 'COUNTER CHECK', matchType: 'contains', field: 'description', categoryName: 'Bank Fees', priority: 80 },

  // Fuel stations
  { pattern: 'MARATHON', matchType: 'contains', field: 'description', categoryName: 'Fuel', priority: 60 },
  { pattern: 'KWIK TRIP', matchType: 'contains', field: 'description', categoryName: 'Fuel', priority: 60 },
  { pattern: 'BP#', matchType: 'contains', field: 'description', categoryName: 'Fuel', priority: 60 },
  { pattern: 'SHELL OIL', matchType: 'contains', field: 'description', categoryName: 'Fuel', priority: 60 },
  { pattern: 'HOLIDAY STATIONS', matchType: 'contains', field: 'description', categoryName: 'Fuel', priority: 60 },
  { pattern: 'EXXON', matchType: 'contains', field: 'description', categoryName: 'Fuel', priority: 60 },

  // Maintenance
  { pattern: "O'REILLY", matchType: 'contains', field: 'description', categoryName: 'Maintenance', priority: 60 },
];
```

### 1.4 Tasks

| Task | Description | Priority |
|------|-------------|----------|
| 1.1 | Update Prisma schema with all models | P0 |
| 1.2 | Generate and apply migration | P0 |
| 1.3 | Create seed script with default categories | P0 |
| 1.4 | Run seed and verify data | P0 |
| 1.5 | Update Prisma client imports across codebase | P0 |

---

## Phase 2: Authentication (Completed)

### 2.1 Status

Authentication is fully implemented using Better Auth:

| Feature | Status |
|---------|--------|
| Email/Password login | ✅ Complete |
| Google OAuth | ✅ Complete |
| Session management | ✅ Complete |
| Protected routes | ✅ Complete |
| Role-based access | ✅ Complete |
| Rate limiting | ✅ Complete |

### 2.2 Files

- `src/lib/auth.ts` - Better Auth server config
- `src/lib/auth-client.ts` - Client-side auth
- `src/lib/auth-server.ts` - Server-side helpers
- `src/hooks/useAuth.ts` - Auth hook
- `src/app/api/auth/[...all]/route.ts` - Auth API routes

---

## Phase 3: Layout & Navigation

### 3.1 Overview

Create the main application layout with responsive sidebar navigation.

### 3.2 Component Hierarchy

```
(dashboard)/layout.tsx
├── Sidebar (Desktop)
│   ├── Logo
│   ├── Navigation Links
│   │   ├── Dashboard
│   │   ├── Transactions
│   │   ├── P&L Statement
│   │   ├── Amazon Invoices
│   │   ├── Trips
│   │   ├── Forecasting
│   │   ├── Forecast vs Actual
│   │   └── Reports
│   ├── Divider
│   └── Settings
│
├── Mobile Header
│   ├── Menu Button (Sheet trigger)
│   ├── Logo
│   └── User Menu
│
├── Header (Desktop)
│   ├── Breadcrumb
│   ├── Search (optional)
│   └── User Menu
│
└── Main Content Area
    └── {children}
```

### 3.3 Navigation Items

```typescript
const navigationItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Bookkeeping',
    items: [
      { title: 'Transactions', href: '/transactions', icon: Receipt },
      { title: 'P&L Statement', href: '/pl-statement', icon: FileText },
    ],
  },
  {
    title: 'Forecasting',
    items: [
      { title: 'Amazon Invoices', href: '/amazon-invoices', icon: FileSpreadsheet },
      { title: 'Trips', href: '/trips', icon: Truck },
      { title: 'Forecasting', href: '/forecasting', icon: TrendingUp },
      { title: 'Forecast vs Actual', href: '/forecast-vs-actual', icon: GitCompare },
    ],
  },
  {
    title: 'Reports',
    href: '/reports',
    icon: BarChart3,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];
```

### 3.4 Responsive Behavior

| Breakpoint | Sidebar | Header |
|------------|---------|--------|
| Mobile (< 768px) | Hidden, Sheet overlay | Mobile header with menu |
| Tablet (768px - 1024px) | Collapsed icons only | Full header |
| Desktop (> 1024px) | Full width expanded | Full header |

### 3.5 Tasks

| Task | Description | Priority |
|------|-------------|----------|
| 3.1 | Create Sidebar component with navigation | P0 |
| 3.2 | Create MobileNav with Sheet | P0 |
| 3.3 | Create Header with breadcrumb | P0 |
| 3.4 | Create UserMenu dropdown | P0 |
| 3.5 | Create dashboard layout wrapper | P0 |
| 3.6 | Add responsive collapsible sidebar | P1 |
| 3.7 | Add keyboard navigation support | P1 |

---

## Phase 4: Settings Module

### 4.1 Overview

Build settings page first to establish default values used throughout the app.

### 4.2 Settings Sections

#### 4.2.1 Categories Management

```
┌─────────────────────────────────────────────────────────────┐
│ Categories                                         + Add    │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ● Amazon Payout          Revenue    ✓ In P&L    ⋮ Edit │ │
│ │ ● Driver Wages           Expense    ✓ In P&L    ⋮ Edit │ │
│ │ ● Payroll Taxes          Expense    ✓ In P&L    ⋮ Edit │ │
│ │ ● Fuel                   Expense    ✗ Excluded  ⋮ Edit │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### 4.2.2 Auto-Categorization Rules

```
┌─────────────────────────────────────────────────────────────┐
│ Categorization Rules                               + Add    │
├─────────────────────────────────────────────────────────────┤
│ Pattern              │ Match    │ Category       │ Hits     │
│ ─────────────────────┼──────────┼────────────────┼──────────│
│ AMAZON.COM SERVICES  │ Contains │ Amazon Payout  │ 24       │
│ ADP WAGE PAY         │ Contains │ Driver Wages   │ 12       │
│ ADP Tax              │ Contains │ Payroll Taxes  │ 12       │
└─────────────────────────────────────────────────────────────┘
```

#### 4.2.3 Default Values

```
┌─────────────────────────────────────────────────────────────┐
│ Forecasting Defaults                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Daily Tractor Rate (DTR)     [$452.00        ]              │
│ Average Accessorial Rate     [$77.00         ]              │
│ Default Truck Count          [2              ]              │
│                                                             │
│ Hourly Wage                  [$20.00         ]              │
│ Hours per Night              [10             ]              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 4.2.4 Excluded Addresses

```
┌─────────────────────────────────────────────────────────────┐
│ Excluded Addresses (for load counting)                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ These addresses are excluded when counting loads:           │
│                                                             │
│ [MSP7] [×]  [MSP8] [×]  [MSP9] [×]                         │
│                                                             │
│ [Add address...                              ] [+ Add]      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 4.2.5 AI Settings

```
┌─────────────────────────────────────────────────────────────┐
│ AI Categorization                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [✓] Enable AI auto-categorization                          │
│                                                             │
│ Confidence threshold                                        │
│ [═══════════════●═══] 80%                                  │
│                                                             │
│ Transactions with confidence above this threshold will be   │
│ automatically categorized. Others will be flagged for       │
│ manual review.                                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Tasks

| Task | Description | Priority |
|------|-------------|----------|
| 4.1 | Create settings page layout with tabs | P0 |
| 4.2 | Build Categories CRUD with color picker | P0 |
| 4.3 | Build Category Rules management | P0 |
| 4.4 | Build Default Values form | P0 |
| 4.5 | Build Excluded Addresses tag input | P0 |
| 4.6 | Build AI Settings with slider | P1 |
| 4.7 | Create server actions for all settings | P0 |
| 4.8 | Add validation with Zod schemas | P0 |

---

## Phase 5: Bookkeeping Module

### 5.1 Transactions Page

#### 5.1.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Transactions                                                            │
│ Track and categorize your bank transactions                             │
│                                                    [Export] [Import]    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Filters                                                             │ │
│ │ [Date Range    ▼] [Category    ▼] [Type    ▼] [Status    ▼]        │ │
│ │ [Search description...                                    ] 🔍      │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ ☐ │ Date       │ Description              │ Amount    │ Category   │ │
│ │───┼────────────┼──────────────────────────┼───────────┼────────────│ │
│ │ ☐ │ 01/22/2026 │ AMAZON.COM SERVICES...   │ +$8,366   │ 🟢 Amazon  │ │
│ │ ☐ │ 01/22/2026 │ ADP WAGE PAY - PEAK...   │ -$8,682   │ 🔵 Wages   │ │
│ │ ☐ │ 01/22/2026 │ ADP Tax - PEAK TRANS...  │ -$2,101   │ 🟣 Taxes   │ │
│ │ ☐ │ 01/22/2026 │ THE HOME DEPOT #2809...  │ -$71.01   │ ⚪ Review  │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ Showing 1-50 of 234 transactions              [◀ Prev] [1] [2] [Next ▶] │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 5.1.2 Import Modal

```
┌─────────────────────────────────────────────────────────────┐
│ Import Bank Transactions                              [×]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │     📄 Drop your CSV file here                      │   │
│  │        or click to browse                           │   │
│  │                                                     │   │
│  │     Supports: .csv, .xlsx                          │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ── OR paste data directly ──────────────────────────────  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Paste your bank transaction data here...            │   │
│  │                                                     │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│                              [Cancel]  [Preview & Import]   │
└─────────────────────────────────────────────────────────────┘
```

#### 5.1.3 Import Preview

```
┌─────────────────────────────────────────────────────────────┐
│ Preview Import                                        [×]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Found 45 transactions • 12 duplicates will be skipped       │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Date       │ Description           │ Amount  │ Category │ │
│ │────────────┼───────────────────────┼─────────┼──────────│ │
│ │ 01/22/2026 │ AMAZON.COM SERVICES   │ +$8,366 │ 🟢 95%   │ │
│ │ 01/22/2026 │ ADP WAGE PAY          │ -$8,682 │ 🔵 92%   │ │
│ │ 01/22/2026 │ THE HOME DEPOT        │ -$71.01 │ ⚪ 45%   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 🤖 AI will auto-categorize 38 transactions (>80% confidence)│
│ ⚠️  7 transactions need manual review                       │
│                                                             │
│                                    [Cancel]  [Import 45]    │
└─────────────────────────────────────────────────────────────┘
```

#### 5.1.4 Category Assignment

```
┌─────────────────────────────────────────────────────────────┐
│ Categorize Transaction                                [×]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ THE HOME DEPOT #2809 - BURNSVILLE MN                        │
│ 01/22/2026 • -$71.01 • DEBIT_CARD                          │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Select Category                                    ▼    │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [✓] Create rule: Always categorize "THE HOME DEPOT" as     │
│     this category                                           │
│                                                             │
│                                      [Cancel]  [Save]       │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 P&L Statement Page

#### 5.2.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Profit & Loss Statement                                                 │
│ Financial performance summary                                           │
│                                           [This Week ▼]  [Export PDF]   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ ┌───────────────────────────────┐  ┌───────────────────────────────┐   │
│ │ Revenue                       │  │ Net Profit                    │   │
│ │ $8,366.41                     │  │ -$2,489.73                    │   │
│ │ ↑ 12% vs last week            │  │ ↓ 8% vs last week             │   │
│ └───────────────────────────────┘  └───────────────────────────────┘   │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ REVENUE                                                             │ │
│ │─────────────────────────────────────────────────────────────────────│ │
│ │ Amazon Payout                                           $8,366.41   │ │
│ │   └ Tour Pay (15 tours × $452)              $6,780.00               │ │
│ │   └ Accessorials                            $1,186.41               │ │
│ │   └ Adjustments (TONU)                        $400.00               │ │
│ │ Other Income                                                $0.00   │ │
│ │─────────────────────────────────────────────────────────────────────│ │
│ │ TOTAL REVENUE                                           $8,366.41   │ │
│ │                                                                     │ │
│ │ EXPENSES                                                            │ │
│ │─────────────────────────────────────────────────────────────────────│ │
│ │ Driver Wages                                           -$8,682.81   │ │
│ │ Payroll Taxes                                          -$2,101.39   │ │
│ │ Workers Comp                                             -$542.17   │ │
│ │ Insurance                                                  $0.00    │ │
│ │ Admin/Overhead                                           -$120.04   │ │
│ │ Bank Fees                                                  $0.00    │ │
│ │─────────────────────────────────────────────────────────────────────│ │
│ │ TOTAL EXPENSES                                        -$10,856.14   │ │
│ │                                                                     │ │
│ │═════════════════════════════════════════════════════════════════════│ │
│ │ NET PROFIT/(LOSS)                                     -$2,489.73    │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ ⚠️ 3 transactions are uncategorized and excluded from this statement    │
│    [Review uncategorized →]                                             │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Tasks

| Task | Description | Priority |
|------|-------------|----------|
| 5.1 | Create Transactions page with table | P0 |
| 5.2 | Build Import Modal with file upload | P0 |
| 5.3 | Implement CSV/Excel parsing | P0 |
| 5.4 | Build Import Preview with AI categorization | P0 |
| 5.5 | Integrate Claude API for categorization | P0 |
| 5.6 | Build inline category editor | P0 |
| 5.7 | Implement bulk categorization | P1 |
| 5.8 | Add search and filter functionality | P0 |
| 5.9 | Create P&L Statement page | P0 |
| 5.10 | Build P&L calculation logic | P0 |
| 5.11 | Add period selector (weekly/monthly) | P0 |
| 5.12 | Add export to PDF/Excel | P1 |
| 5.13 | Implement learning system for rules | P0 |

---

## Phase 6: Forecasting Module

### 6.1 Amazon Invoices Page

#### 6.1.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Amazon Invoices                                                         │
│ Import and analyze Amazon payment details                               │
│                                                             [Import]    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Invoice           │ Period        │ Tours │ Total Pay  │ Status    │ │
│ │───────────────────┼───────────────┼───────┼────────────┼───────────│ │
│ │ AZNGA40B872...    │ Jan 11-18     │ 15    │ $8,366.41  │ ✓ Matched │ │
│ │ AZNGA40B654...    │ Jan 4-11      │ 14    │ $7,892.10  │ ✓ Matched │ │
│ │ AZNGA40B321...    │ Dec 28-Jan 4  │ 12    │ $6,801.22  │ ⚠ Pending │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Invoice Details: AZNGA40B872...                                     │ │
│ ├─────────────────────────────────────────────────────────────────────┤ │
│ │                                                                     │ │
│ │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐    │ │
│ │ │ Tour Pay    │ │ Accessorials│ │ Adjustments │ │ Total       │    │ │
│ │ │ $6,781.41   │ │ $1,185.00   │ │ $400.00     │ │ $8,366.41   │    │ │
│ │ │ 15 tours    │ │ 37 loads    │ │ 2 TONU      │ │             │    │ │
│ │ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘    │ │
│ │                                                                     │ │
│ │ Line Items                                                          │ │
│ │ ─────────────────────────────────────────────────────────────────── │ │
│ │ Trip ID      │ Type      │ Miles  │ Base    │ Fuel Sur. │ Total    │ │
│ │ T-111GTV5BG  │ Tour      │ -      │ $452.00 │ -         │ $452.10  │ │
│ │ └ 111YQ6DK4  │ Load      │ 179.66 │ -       │ $50.31    │ $50.31   │ │
│ │ └ 113BSFGX5  │ Load      │ 127.66 │ -       │ $35.74    │ $35.74   │ │
│ │ T-111NW6XMD  │ Tour      │ -      │ $452.00 │ -         │ $452.09  │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Trips Page

#### 6.2.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Trips                                                                   │
│ Manage scheduled trips and track actual loads                           │
│                              [Week: Jan 20-26, 2026 ▼]       [Import]   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│ │ Total Trips │ │ Proj. Loads │ │ Act. Loads  │ │ Completion  │        │
│ │ 14          │ │ 56          │ │ 48          │ │ 85.7%       │        │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘        │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Trip ID      │ Date       │ Projected │ Actual │ Status    │ Notes  │ │
│ │──────────────┼────────────┼───────────┼────────┼───────────┼────────│ │
│ │ T-112YY5BG   │ Jan 20     │ 6         │ [4  ]  │ ✓ Updated │ [📝]   │ │
│ │ T-113XH2VP7  │ Jan 20     │ 4         │ [4  ]  │ ✓ Updated │        │ │
│ │ T-114HDR7XK  │ Jan 21     │ 5         │ [   ]  │ ○ Pending │        │ │
│ │ T-115P3YPY3  │ Jan 21     │ 3         │ [   ]  │ ○ Pending │        │ │
│ │ T-1165YN1J2  │ Jan 22     │ 4         │ [   ]  │ ○ Scheduled│       │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ 💡 Tip: Update actual loads each night to improve forecast accuracy     │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.3 Forecasting Page

#### 6.3.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Forecasting                                                             │
│ Predict weekly revenue and model scenarios                              │
│                                                    [Save Scenario]      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ ┌──────────────────────────────────┐ ┌────────────────────────────────┐ │
│ │ Input Parameters                 │ │ Projected Revenue              │ │
│ │                                  │ │                                │ │
│ │ Number of Trucks                 │ │ ┌────────────────────────────┐ │ │
│ │ [═══════●═══════════] 2          │ │ │ Weekly Revenue             │ │ │
│ │                                  │ │ │ $7,406.00                  │ │ │
│ │ Nights per Week                  │ │ │                            │ │ │
│ │ [═══════════════════●] 7         │ │ │ Tour Pay      $6,328.00    │ │ │
│ │                                  │ │ │ Accessorials  $1,078.00    │ │ │
│ │ DTR Rate                         │ │ └────────────────────────────┘ │ │
│ │ [$452.00                    ]    │ │                                │ │
│ │                                  │ │ ┌────────────────────────────┐ │ │
│ │ Avg Accessorial                  │ │ │ Weekly Costs               │ │ │
│ │ [$77.00                     ]    │ │ │ $5,250.00                  │ │ │
│ │                                  │ │ │                            │ │ │
│ │ ── Labor Costs ──────────────── │ │ │ Labor         $4,200.00    │ │ │
│ │                                  │ │ │ Payroll Tax     $321.30    │ │ │
│ │ Hourly Wage                      │ │ │ Workers Comp    $210.00    │ │ │
│ │ [$20.00                     ]    │ │ │ Overhead        $500.00    │ │ │
│ │                                  │ │ └────────────────────────────┘ │ │
│ │ Hours per Night                  │ │                                │ │
│ │ [10                         ]    │ │ ┌────────────────────────────┐ │ │
│ │                                  │ │ │ Weekly Profit              │ │ │
│ │ [✓] Include Overtime             │ │ │ $2,156.00                  │ │ │
│ │                                  │ │ │                            │ │ │
│ │ Payroll Tax Rate                 │ │ │ Contribution Margin        │ │ │
│ │ [7.65%                      ]    │ │ │ $154/truck/day             │ │ │
│ │                                  │ │ └────────────────────────────┘ │ │
│ │ Workers Comp Rate                │ │                                │ │
│ │ [5%                         ]    │ │                                │ │
│ └──────────────────────────────────┘ └────────────────────────────────┘ │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Scaling Scenarios                                                   │ │
│ │                                                                     │ │
│ │  Trucks │ Revenue  │ Costs    │ Profit   │ Margin/Truck/Day        │ │
│ │  ───────┼──────────┼──────────┼──────────┼─────────────────        │ │
│ │  2      │ $7,406   │ $5,250   │ $2,156   │ $154                    │ │
│ │  4      │ $14,812  │ $10,500  │ $4,312   │ $154                    │ │
│ │  6      │ $22,218  │ $15,750  │ $6,468   │ $154                    │ │
│ │  10     │ $37,030  │ $26,250  │ $10,780  │ $154                    │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.4 Forecast vs Actual Page

#### 6.4.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Forecast vs Actual                                                      │
│ Compare predictions with actual Amazon payments                         │
│                                            [Week: Jan 13-19, 2026 ▼]    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ ┌───────────────────────────────────────────────────────────────────┐   │
│ │                                                                   │   │
│ │   Forecast          Actual            Variance                    │   │
│ │   $7,406.00         $8,366.41         +$960.41 (+13.0%)          │   │
│ │                                                                   │   │
│ │   ████████████████  ████████████████████  ▲ Better than expected │   │
│ │                                                                   │   │
│ └───────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Breakdown                                                           │ │
│ │                                                                     │ │
│ │ Component        │ Forecast   │ Actual     │ Variance              │ │
│ │ ─────────────────┼────────────┼────────────┼────────────────────── │ │
│ │ Tour Pay         │ $6,328.00  │ $6,781.41  │ +$453.41 (+7.2%)     │ │
│ │ Accessorials     │ $1,078.00  │ $1,185.00  │ +$107.00 (+9.9%)     │ │
│ │ Adjustments      │ $0.00      │ $400.00    │ +$400.00 (TONU)      │ │
│ │ ─────────────────┼────────────┼────────────┼────────────────────── │ │
│ │ TOTAL            │ $7,406.00  │ $8,366.41  │ +$960.41 (+13.0%)    │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Trip-Level Variance                                                 │ │
│ │                                                                     │ │
│ │ Trip ID      │ Proj. Loads │ Act. Loads │ Proj. Pay │ Act. Pay     │ │
│ │ ─────────────┼─────────────┼────────────┼───────────┼───────────── │ │
│ │ T-111GTV5BG  │ 4           │ 3          │ $529.00   │ $539.07      │ │
│ │ T-111NW6XMD  │ 3           │ 2          │ $529.00   │ $533.82      │ │
│ │ T-115XSCTXK  │ 4           │ 0 (TONU)   │ $529.00   │ $200.00      │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ Notes                                                                   │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ 2 TONU adjustments this week. One truck cancelled due to weather.  │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.5 Tasks

| Task | Description | Priority |
|------|-------------|----------|
| 6.1 | Create Amazon Invoices page | P0 |
| 6.2 | Build invoice import (Payment Details tab) | P0 |
| 6.3 | Implement invoice parsing logic | P0 |
| 6.4 | Create invoice detail view | P0 |
| 6.5 | Create Trips page | P0 |
| 6.6 | Build trips import from scheduler CSV | P0 |
| 6.7 | Implement load counting (exclude MSP*, Stop 1) | P0 |
| 6.8 | Build inline actual loads editor | P0 |
| 6.9 | Create Forecasting page with sliders | P0 |
| 6.10 | Implement forecast calculation engine | P0 |
| 6.11 | Build scaling scenarios table | P1 |
| 6.12 | Create Forecast vs Actual page | P0 |
| 6.13 | Implement variance calculation | P0 |
| 6.14 | Build trip-level variance breakdown | P0 |
| 6.15 | Match invoices to bank transactions | P1 |

---

## Phase 7: Dashboard Module

### 7.1 Dashboard Page

#### 7.1.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Dashboard                                                               │
│ Welcome back, Admin                                    Jan 27, 2026     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ │
│ │ Cash on Hand  │ │ Weekly Revenue│ │ Weekly Profit │ │ Contribution  │ │
│ │ $9,180.57     │ │ $8,366.41     │ │ -$2,489.73    │ │ $154/truck/day│ │
│ │ Current       │ │ ↑ 12% vs last │ │ ↓ 8% vs last  │ │ 2 trucks      │ │
│ └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘ │
│                                                                         │
│ ┌─────────────────────────────────────┐ ┌───────────────────────────┐   │
│ │ Cash Flow Trend                     │ │ This Week's Forecast      │   │
│ │                                     │ │                           │   │
│ │     📈 [Chart: 8 week trend]        │ │ Projected: $7,406.00      │   │
│ │                                     │ │ Current:   $5,280.00      │   │
│ │                                     │ │ ████████████░░░░ 71%      │   │
│ │                                     │ │                           │   │
│ │                                     │ │ Trips: 10/14 completed    │   │
│ │                                     │ │ Loads: 42/56 delivered    │   │
│ └─────────────────────────────────────┘ └───────────────────────────┘   │
│                                                                         │
│ ┌─────────────────────────────────────┐ ┌───────────────────────────┐   │
│ │ Recent Transactions                 │ │ Quick Actions             │   │
│ │                                     │ │                           │   │
│ │ Today                               │ │ [📥 Import Transactions]  │   │
│ │ ● AMAZON.COM SERVICES    +$8,366.41 │ │ [📊 Import Amazon Invoice]│   │
│ │ ● ADP WAGE PAY          -$8,682.81  │ │ [🚚 Import Trips]         │   │
│ │ ● ADP Tax               -$2,101.39  │ │ [📈 View Forecasting]     │   │
│ │                                     │ │                           │   │
│ │ [View all transactions →]           │ │                           │   │
│ └─────────────────────────────────────┘ └───────────────────────────┘   │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Forecast vs Actual (Last 4 Weeks)                                   │ │
│ │                                                                     │ │
│ │ Week        │ Forecast   │ Actual     │ Variance   │ Accuracy      │ │
│ │ ────────────┼────────────┼────────────┼────────────┼────────────── │ │
│ │ Jan 13-19   │ $7,406.00  │ $8,366.41  │ +$960.41   │ 87%           │ │
│ │ Jan 6-12    │ $7,406.00  │ $7,892.10  │ +$486.10   │ 93%           │ │
│ │ Dec 30-Jan 5│ $6,348.00  │ $6,801.22  │ +$453.22   │ 93%           │ │
│ │ Dec 23-29   │ $5,290.00  │ $5,230.17  │ -$59.83    │ 99%           │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Tasks

| Task | Description | Priority |
|------|-------------|----------|
| 7.1 | Create Dashboard page layout | P0 |
| 7.2 | Build MetricCard component | P0 |
| 7.3 | Implement Cash on Hand calculation | P0 |
| 7.4 | Build Cash Flow chart (8-week trend) | P1 |
| 7.5 | Create This Week's Forecast widget | P0 |
| 7.6 | Build Recent Transactions list | P0 |
| 7.7 | Create Quick Actions grid | P0 |
| 7.8 | Build Forecast vs Actual summary table | P0 |
| 7.9 | Implement dashboard data aggregation | P0 |
| 7.10 | Add real-time updates with TanStack Query | P1 |

---

## Phase 8: Reports Module

### 8.1 Reports Page

#### 8.1.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Reports                                                                 │
│ Generate and export financial reports                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ 📊 Weekly P&L Report                                                │ │
│ │ Profit & Loss statement for a selected week                         │ │
│ │ [Select Week ▼]                                    [Generate PDF]   │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ 📊 Monthly P&L Report                                               │ │
│ │ Profit & Loss statement for a selected month                        │ │
│ │ [Select Month ▼]                                   [Generate PDF]   │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ 📋 Transaction Export                                               │ │
│ │ Export all transactions with categories                             │ │
│ │ [Date Range ▼] [Categories ▼]                      [Export CSV]    │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ 📈 Forecast Summary                                                 │ │
│ │ Forecast vs Actual comparison report                                │ │
│ │ [Date Range ▼]                                     [Export Excel]   │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ 📦 CPA Package                                                      │ │
│ │ Bundled reports for your accountant                                 │ │
│ │ [Select Quarter ▼]                                [Download ZIP]    │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Recent Exports                                                      │ │
│ │                                                                     │ │
│ │ File                        │ Generated    │ Size   │ Action       │ │
│ │ ────────────────────────────┼──────────────┼────────┼───────────── │ │
│ │ PL_Jan_2026.pdf             │ Jan 25, 2026 │ 124 KB │ [Download]   │ │
│ │ Transactions_Q4_2025.csv    │ Jan 20, 2026 │ 45 KB  │ [Download]   │ │
│ │ Forecast_Summary_Jan.xlsx   │ Jan 18, 2026 │ 89 KB  │ [Download]   │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Tasks

| Task | Description | Priority |
|------|-------------|----------|
| 8.1 | Create Reports page layout | P1 |
| 8.2 | Build report card components | P1 |
| 8.3 | Implement P&L PDF generation | P1 |
| 8.4 | Implement transaction CSV export | P1 |
| 8.5 | Implement forecast Excel export | P1 |
| 8.6 | Build CPA package bundler | P2 |
| 8.7 | Create recent exports list | P2 |

---

## Phase 9: Testing & Optimization

### 9.1 Testing Strategy

| Test Type | Tools | Coverage Target |
|-----------|-------|-----------------|
| Unit Tests | Vitest | Core calculations, parsing |
| Integration Tests | Playwright | User flows, imports |
| E2E Tests | Playwright | Critical paths |
| Performance | Lighthouse | Score > 90 |

### 9.2 Core Test Scenarios

| Scenario | Description |
|----------|-------------|
| Transaction Import | CSV parse → AI categorize → Save |
| P&L Calculation | Sum by category → Display totals |
| Trips Import | Parse CSV → Count loads → Exclude stations |
| Invoice Parse | Parse Excel → Extract tours/loads/adjustments |
| Forecast Calculation | Inputs → Revenue/Cost/Profit |
| Forecast vs Actual | Match trips → Calculate variance |

### 9.3 Performance Targets

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Largest Contentful Paint | < 2.5s |
| Time to Interactive | < 3.5s |
| Cumulative Layout Shift | < 0.1 |
| Lighthouse Performance | > 90 |

### 9.4 Tasks

| Task | Description | Priority |
|------|-------------|----------|
| 9.1 | Set up Vitest for unit tests | P1 |
| 9.2 | Write tests for parsing logic | P1 |
| 9.3 | Write tests for calculations | P1 |
| 9.4 | Set up Playwright for E2E | P1 |
| 9.5 | Write E2E for import flows | P1 |
| 9.6 | Run Lighthouse audits | P1 |
| 9.7 | Optimize bundle size | P1 |
| 9.8 | Add error boundaries | P1 |
| 9.9 | Implement error logging | P2 |

---

## Appendix A: File Naming Conventions

```
Components:    PascalCase.tsx       (MetricCard.tsx)
Pages:         page.tsx             (Next.js convention)
Layouts:       layout.tsx           (Next.js convention)
Actions:       kebab-case.ts        (transaction-actions.ts)
Hooks:         use-camelCase.ts     (use-transactions.ts)
Utils:         kebab-case.ts        (format-currency.ts)
Types:         kebab-case.ts        (transaction-types.ts)
Schemas:       kebab-case.schema.ts (transaction.schema.ts)
Stores:        kebab-case.store.ts  (forecast.store.ts)
```

## Appendix B: Import Order Convention

```typescript
// 1. React/Next.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. Third-party libraries
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

// 3. Internal - UI components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// 4. Internal - Feature components
import { TransactionTable } from '@/components/transactions/transaction-table';

// 5. Internal - Hooks/Utils/Types
import { useTransactions } from '@/hooks/use-transactions';
import { formatCurrency } from '@/lib/format-currency';
import type { Transaction } from '@/types/transaction';
```

## Appendix C: Git Commit Convention

```
feat:     New feature
fix:      Bug fix
docs:     Documentation only
style:    Formatting, no code change
refactor: Code restructuring
test:     Adding tests
chore:    Maintenance tasks

Examples:
feat(transactions): add CSV import functionality
fix(forecast): correct load counting for MSP stations
docs(readme): update installation instructions
```

---

*— End of Document —*

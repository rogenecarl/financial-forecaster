# Financial Forecaster

A financial management application for Peak Transport LLC, providing real-time bookkeeping and revenue forecasting for Amazon Relay trucking operations.

---

## Overview

Financial Forecaster solves two core problems for trucking companies:

1. **Bookkeeping** — Import bank transactions, auto-categorize with AI, and generate P&L statements
2. **Forecasting** — Predict weekly Amazon payouts and compare projected vs actual revenue

### Key Questions the App Answers

- How much cash do I have right now?
- Am I profitable this week?
- How much will Amazon pay me next Thursday?
- What happens if I add more trucks?

---

## Features

### Bookkeeping Module
- Import bank transactions (CSV or paste)
- AI-powered auto-categorization using Claude API
- Learning system that improves from manual corrections
- Real-time P&L statement generation
- Category management with custom rules

### Forecasting Module
- Import scheduled trips from Amazon Scheduler
- Automatic load counting (excludes Bobtail, stations)
- Track projected vs actual loads nightly
- Import Amazon Payment invoices
- Forecast vs Actual comparison with variance analysis
- What-if scenarios with adjustable parameters

### Dashboard
- Cash on Hand (current balance)
- Weekly Revenue & Profit
- Contribution Margin per Truck per Day
- Cash Flow Trend (8-week chart)
- Forecast accuracy tracking

### Reports
- Weekly/Monthly P&L (PDF)
- Transaction Export (CSV)
- Forecast Summary (Excel)
- CPA Package (ZIP bundle)

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Authentication | Better Auth |
| Database | PostgreSQL + Prisma 7 |
| State Management | Zustand |
| Data Fetching | TanStack Query |
| AI | Claude API (Anthropic) |
| CSV Parsing | Papa Parse |
| Excel Parsing | SheetJS (xlsx) |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Validation | Zod 4 |
| Language | TypeScript |

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended)
- PostgreSQL database
- Claude API key (Anthropic)

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"

# Authentication
BETTER_AUTH_SECRET="generate-a-strong-secret-at-least-32-characters"
BETTER_AUTH_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# AI (for transaction categorization)
ANTHROPIC_API_KEY="your-claude-api-key"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Set Up the Database

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed default categories and rules
npx prisma db seed
```

### 4. Run the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/               # Login, Register pages
│   ├── (landing)/            # Landing page
│   ├── (dashboard)/          # Protected dashboard routes
│   │   ├── page.tsx          # Main dashboard
│   │   ├── transactions/     # Bank transactions
│   │   ├── pl-statement/     # Profit & Loss
│   │   ├── amazon-invoices/  # Amazon payment imports
│   │   ├── trips/            # Scheduled trips
│   │   ├── forecasting/      # Revenue forecasting
│   │   ├── forecast-vs-actual/
│   │   ├── reports/          # Export reports
│   │   └── settings/         # App settings
│   └── api/
│       ├── auth/             # Better Auth routes
│       ├── import/           # Data import endpoints
│       └── ai/               # Claude API endpoints
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── layout/               # Sidebar, Header
│   ├── dashboard/            # Dashboard widgets
│   ├── transactions/         # Transaction components
│   └── forecasting/          # Forecasting components
├── actions/                  # Server Actions
├── hooks/                    # Custom React hooks
├── lib/                      # Utilities
├── schema/                   # Zod schemas
├── stores/                   # Zustand stores
└── types/                    # TypeScript types
```

---

## Data Sources

The app processes three types of data:

### 1. Bank Transactions (CSV)
- Source: Bank export
- Format: CSV with Date, Description, Amount, Type
- Used for: Bookkeeping, P&L generation

### 2. Trips Data (CSV)
- Source: Amazon Relay Scheduler
- Format: Tab-delimited, one row per load
- Used for: Projected loads, forecast calculation

### 3. Amazon Invoice (Excel)
- Source: Amazon Relay Portal
- Tab: "Payment Details" (not Summary)
- Used for: Actual revenue, forecast comparison

---

## Business Logic

### Revenue Formula

```
Weekly Revenue = Tours × ($452 DTR + ~$77 Accessorial) + Adjustments
```

- **DTR (Daily Tractor Rate):** $452 fixed per tour
- **Accessorial:** ~$0.28/mile fuel surcharge
- **TONU:** $200 credit for cancelled tours

### Load Counting Rules

When processing Trips CSV:

1. **Skip Bobtail loads:** `Truck Filter = "BobtailMovementAnnotation"`
2. **Exclude stations:** MSP7, MSP8, MSP9 (configurable)
3. **Exclude Stop 1:** Always the starting station
4. **Count Stop 2-7:** Actual delivery addresses

---

## Weekly Workflow

| Day | Action | Module |
|-----|--------|--------|
| Sun/Mon | Import Trips CSV → See projected revenue | Forecasting |
| Mon-Sat | Update actual loads nightly | Trips |
| Thursday | Import Amazon Invoice → Compare forecast | Forecast vs Actual |
| Friday | Import Bank Transactions → Categorize → P&L | Bookkeeping |

---

## Available Scripts

```bash
pnpm dev          # Start development server (localhost:3000)
pnpm build        # Production build
pnpm lint         # Run ESLint
pnpm start        # Start production server

# Database
npx prisma generate              # Regenerate Prisma client
npx prisma migrate dev --name    # Create migration
npx prisma db push               # Push schema changes
npx prisma db seed               # Seed default data
npx prisma studio                # Open Prisma Studio GUI
```

---

## Key Metrics

| Metric | Description |
|--------|-------------|
| Cash on Hand | Current bank balance |
| Weekly Net Cash Flow | Revenue - Expenses |
| Contribution Margin | Profit per truck per day |
| Accessorials per Tour | Average variable pay |
| Forecast Accuracy | % difference from actual |

### Success Criteria

- Forecast accuracy within 5% of actual payout
- 90%+ auto-categorization accuracy
- < 5 minutes to generate P&L
- Daily usage by owner

---

## Documentation

- [Project Building PRD](docs/project-building-prd.md) — Complete technical specification
- [Financial Forecaster PRD](docs/financial-forecaster-prd.md) — Business requirements

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Yes | Auth secret (32+ chars) |
| `BETTER_AUTH_URL` | Yes | App URL for auth |
| `GOOGLE_CLIENT_ID` | No | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth |
| `ANTHROPIC_API_KEY` | Yes | Claude API for AI categorization |
| `NEXT_PUBLIC_APP_URL` | Yes | Public app URL |

---

## License

Private - Peak Transport LLC

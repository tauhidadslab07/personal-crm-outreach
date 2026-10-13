# Nexus Personal CRM & WhatsApp Cadence Operations Engine

A high-performance, zero-friction, mobile-first and desktop-responsive **Personal CRM & Outreach Operations Web Application** engineered for daily client hunting, 5-stage automated WhatsApp cadences, intelligent meeting scheduling with 1-hour buffer protection, project delivery tracking, and conversion analytics.

![Nexus CRM Preview](public/file.svg)

---

## ⚡ Core Features

### 1. Automatic Country Detection & Universal WhatsApp Engine
- **Live Country & Flag Detection**: Powered by `libphonenumber-js`. Instant real-time parsing of country code, ISO code, localized country name, and flag emoji (e.g. 🇧🇩, 🇺🇸, 🇬🇧, 🇦🇪, 🇩🇪, 🇦🇺).
- **Universal Click-to-Chat**: Sanitizes all numbers to international format (`88017...`, `1415...`) and generates universal `https://api.whatsapp.com/send?phone=...&text=...` deep links (launches native WhatsApp App on mobile; WhatsApp Web/Desktop on PC).
- **Inline Validation**: Instant visual warnings for incomplete or invalid digit lengths.

### 2. Zero-Friction Outreach Acceleration
- **Send & Auto-Advance**: One-click action button opens pre-filled WhatsApp message, marks stage complete, and automatically schedules the next follow-up stage.
- **Rapid Bulk Lead Importer**: Multi-row textarea parser supporting `Name, Phone, Source, Company` or `Phone, Name` with live parsing preview and 1-click batch import.
- **Daily Outreach Velocity Tracker**: Sticky progress bar tracking today's outreach quotas (`X / Y Completed`) with celebration confetti on target completion.

### 3. 5-Stage WhatsApp Cadence Logic
- **Interval Automation**:
  - **Stage 0 (Initial Outreach)** $\rightarrow$ Schedule **Follow-up 1** for **Today + 2 Days**
  - **Stage 1 (Follow-up 1)** $\rightarrow$ Schedule **Follow-up 2** for **Today + 3 Days**
  - **Stage 2 (Follow-up 2)** $\rightarrow$ Schedule **Follow-up 3** for **Today + 4 Days**
  - **Stage 3 (Follow-up 3)** $\rightarrow$ Schedule **Follow-up 4** for **Today + 5 Days**
  - **Stage 4 (Follow-up 4)** $\rightarrow$ Schedule **Follow-up 5 (Breakup)** for **Today + 7 Days**
- **Overdue Engine**: Surfaces past-due follow-ups at the top of the queue with animated red badges.
- **Pipeline Kill-Switches**: One-click "Booked Meeting", "Not Interested / Opt-Out", or "Wrong Number" status updates.

### 4. Intelligent Meeting Scheduler with 1-Hour Buffer Detection
- Scans calendar density within 60 minutes before and after proposed time slots.
- Differentiates direct collisions from buffer proximity violations and suggests the nearest conflict-free slot.
- Meeting outcome tracking (`Closed Won`, `Follow-up Needed`, `Lost`) with automatic project generation upon closing deals.

### 5. Client Project Financial Tracker & Daily Tasks
- Contract order valuation, realized cash collected, and outstanding milestone receivables.
- Delivery deadline tracking with overdue warnings.

### 6. Performance Analytics (Recharts)
- Conversion Funnel: Leads $\rightarrow$ Initial Outreach $\rightarrow$ FU 1-5 $\rightarrow$ Meetings $\rightarrow$ Closed Deals.
- Stage-by-stage drop-off rate analysis to pinpoint pipeline bottlenecks.
- Geographic and acquisition source attribution.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS v4 + Lucide Icons
- **Phone Engine**: `libphonenumber-js`
- **State & Realtime UX**: Zustand (with local persistence) + TanStack React Query
- **Charts & Data Viz**: Recharts
- **Database**: Supabase (PostgreSQL) Client & Schema Migrations
- **PWA Ready**: Mobile-first responsive layout with bottom navigation & install manifest

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/tauhidadslab07/personal-crm-outreach.git
cd personal-crm-outreach
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the project root:
```ini
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### 4. Desktop Keyboard Shortcuts
- `1` – Today's Work Command Center
- `2` – Leads Pipeline (Table & Kanban)
- `3` – Intelligent Meetings
- `4` – Projects & Financials
- `5` – Performance Analytics
- `N` – Add New Target Lead
- `B` – Rapid Bulk Lead Importer
- `/` – Focus Universal Search Bar
- `Esc` – Close Modals

---

## 🗄️ Database Setup (Supabase)

Run the SQL migration script located in [`supabase/migrations/20260101_init_crm_schema.sql`](supabase/migrations/20260101_init_crm_schema.sql) in your Supabase SQL Editor.
To enable public/anonymous access policies, run [`supabase/migrations/enable_rls_policies.sql`](supabase/migrations/enable_rls_policies.sql).

---

## 📄 License
MIT License. Crafted for high-velocity client acquisition and outreach automation.

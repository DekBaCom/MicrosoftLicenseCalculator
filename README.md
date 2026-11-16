# Microsoft License Assessment & Calculator

A modern, responsive web application for **Microsoft Presales / Solution Specialists** to
assess and calculate Microsoft on-premises licensing — Windows Server, Windows Server CAL,
RDS CAL, Exchange Server, Exchange CAL, DAG/HA — then produce gap analysis, optimization
recommendations, cost estimation, and professional reports.

Deployable as a **static website on GitHub Pages**. No backend required — everything runs
in the browser with LocalStorage persistence.

---

## Project Overview

- **Audience:** Presales / Solution Specialists, Partner licensing teams, IT buyers.
- **Scope (V1):**
  - Windows Server (Standard / Datacenter), core-based licensing with virtualization rights
  - Windows Server CAL (User / Device)
  - RDS CAL (User / Device)
  - Exchange Server (Standard / Enterprise) and Exchange CAL
  - Exchange DAG / High Availability
  - Current vs Required license, Gap analysis, Optimization
  - Cost estimation (THB / USD / EUR, configurable catalog)
  - Assessment history (CRUD + duplicate)
  - Report generation (PDF)
  - Excel / CSV / JSON export

## Features

- Executive **Dashboard** with KPI cards, license status donut, distribution bar chart, cost comparison.
- 8-step **Assessment Wizard** (Customer → Environment → Windows → CAL/RDS → Exchange → Inventory → Review → Result).
- **Calculation engines** (pluggable, extensible):
  - `windowsCalculator.ts` — per-host core requirement with per-processor / per-server minimums and VM-based re-licensing for Standard edition.
  - `calCalculator.ts` and `rdsCalculator.ts` — User vs Device CAL recommendation.
  - `exchangeCalculator.ts` — server + CAL requirement and DAG copies.
  - `gapAnalyzer.ts` — required vs owned with Compliant / Review / Gap / Surplus statuses.
  - `recommendationEngine.ts` — prioritized actions based on gaps and virtualization density.
  - `costCalculator.ts` — annualized cost against a configurable catalog.
- **License Catalog** admin page (Add / Edit / Delete / Import / Export, stored in LocalStorage).
- **Scenario / What-if** modeling (+20% users, +50% VMs, Exchange Hybrid, etc.).
- **Reports** page with executive summary and print / PDF.
- **Export**: Excel workbook (multiple sheets), PDF report, CSV tables, JSON backup.
- **Settings**: Company/brand, default currency, data import/export, clear local data.
- **Responsive** layout (1920/1440/1366/1024 desktop → 768 tablet → 390 mobile), hamburger sidebar on mobile.
- **Demo data** seeded on first launch, plus a `Load Demo Assessment` button.
- Clear **licensing disclaimer** on every page.

## Architecture

```
src/
├── components/
│   ├── common/        # KPI card, PageHeader, Disclaimer, StatusBadge, EmptyState
│   ├── layout/        # AppShell (sidebar + topbar)
│   └── questionnaire/ # Stepper for wizard
├── pages/
│   ├── Dashboard.tsx
│   ├── NewAssessment.tsx
│   ├── Assessments.tsx
│   ├── WindowsServer.tsx
│   ├── ExchangeServer.tsx
│   ├── CALRDS.tsx
│   ├── Calculator.tsx
│   ├── Recommendations.tsx
│   ├── Reports.tsx
│   ├── Export.tsx
│   ├── Catalog.tsx
│   └── Settings.tsx
├── engine/            # Pure calculation modules (no React)
│   ├── windowsCalculator.ts
│   ├── calCalculator.ts
│   ├── rdsCalculator.ts
│   ├── exchangeCalculator.ts
│   ├── gapAnalyzer.ts
│   ├── recommendationEngine.ts
│   └── costCalculator.ts
├── data/              # Configurable rules, pricing, demo data
│   ├── licenseRules.ts
│   ├── pricing.ts
│   ├── products.ts
│   └── demo.ts
├── export/            # XLSX / PDF / CSV exports
│   ├── excel.ts
│   └── pdf.ts
├── state/
│   └── AppContext.tsx # Global app state with LocalStorage persistence
├── types/             # Shared TypeScript domain types
├── utils/             # id, format, storage
└── App.tsx
```

Design: **Microsoft Enterprise / Modern SaaS** — light background, professional blue accent,
cards with soft shadow, clear typography, responsive tables.

## Installation

Requires Node.js **20+**.

```bash
npm install
```

## Development

```bash
npm run dev
```

Vite serves at http://localhost:5173.

## Build

```bash
npm run build
```

Output is written to `dist/`. Preview locally:

```bash
npm run preview
```

## GitHub Pages Deployment

1. Edit `vite.config.ts` and set the `REPO_NAME` constant to match your GitHub repository:

   ```ts
   const REPO_NAME = "MicrosoftLicenseCalculator"; // change if your repo name differs
   ```

2. Push to the `main` branch. The workflow `.github/workflows/deploy.yml` will:
   - Checkout the repo
   - Install dependencies
   - Run `npm run build`
   - Deploy `dist/` to GitHub Pages

3. In your repository's **Settings → Pages**, set the source to **GitHub Actions**.

Your site will be available at:
`https://<your-user>.github.io/<REPO_NAME>/`

> The app uses hash-based routing (`HashRouter`), so no server-side rewrites are required.
> The workflow also copies `index.html` to `404.html` as a safety net.

## Configuration

### License Rule Configuration

All licensing assumptions are centralized in **`src/data/licenseRules.ts`**. Adjust:

- `minimumCoresPerProcessor`, `minimumCoresPerServer`, `minimumProcessorsPerServer`
- `virtualizationRights` for Standard edition
- `unlimitedVirtualization` for Datacenter
- `DATACENTER_VM_BREAKPOINT` — threshold VM count above which Datacenter is recommended
- `CAL_DEVICE_FACTOR` — threshold ratio used to prefer Device CAL over User CAL

### Pricing Configuration

Defaults live in **`src/data/pricing.ts`** and can be edited in-app at **License Catalog**.
Prices are stored in LocalStorage after the first edit.

> Prices are **placeholder values** for assessment purposes only. Admins must configure
> prices to match the customer's licensing agreement.

## Disclaimer

> This tool provides an indicative Microsoft licensing assessment based on the information
> entered and configured licensing rules. It is **not** a substitute for Microsoft's
> official Product Terms, licensing agreement, reseller agreement, or licensing specialist
> validation. Final licensing requirements and pricing must be confirmed against the
> applicable Microsoft terms and customer agreement.

## Extensibility

The engine and data layers are decoupled from UI, so future versions can add:

- Microsoft 365 / Office 365 / Copilot
- SQL Server (core-based + CAL)
- Azure Hybrid Benefit modeling
- Power Platform, Defender, Purview
- Direct ingestion from Microsoft licensing-agreement management APIs

## License

Internal presales enablement tool. Licensing data and rule values must be reviewed by a
Microsoft licensing specialist before use with customers.

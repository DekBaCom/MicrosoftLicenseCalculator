import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./state/AppContext";
import { AppShell } from "./components/layout/AppShell";

// Route-level code splitting: each page is its own chunk so the first
// paint only ships the shell + Dashboard, not every page's dependencies.
const Dashboard = lazy(() => import("./pages/Dashboard"));
const NewAssessment = lazy(() => import("./pages/NewAssessment"));
const Assessments = lazy(() => import("./pages/Assessments"));
const WindowsServer = lazy(() => import("./pages/WindowsServer"));
const ExchangeServer = lazy(() => import("./pages/ExchangeServer"));
const SQLServerPage = lazy(() => import("./pages/SQLServer"));
const M365Page = lazy(() => import("./pages/M365"));
const CALRDS = lazy(() => import("./pages/CALRDS"));
const Calculator = lazy(() => import("./pages/Calculator"));
const Recommendations = lazy(() => import("./pages/Recommendations"));
const Reports = lazy(() => import("./pages/Reports"));
const Export = lazy(() => import("./pages/Export"));
const Catalog = lazy(() => import("./pages/Catalog"));
const DataCollection = lazy(() => import("./pages/DataCollection"));
const LicensingGuide = lazy(() => import("./pages/LicensingGuide"));
const Templates = lazy(() => import("./pages/Templates"));
const QuickAssessment = lazy(() => import("./pages/QuickAssessment"));
const TCO = lazy(() => import("./pages/TCO"));
const Settings = lazy(() => import("./pages/Settings"));

function PageFallback() {
  return (
    <div className="flex items-center justify-center py-16 text-sm text-slate-500">
      <div className="animate-pulse">Loading…</div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Routes>
        <Route
          element={
            <Suspense fallback={<PageFallback />}>
              <AppShell />
            </Suspense>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="assessments" element={<Assessments />} />
          <Route path="assessments/new" element={<NewAssessment />} />
          <Route path="windows" element={<WindowsServer />} />
          <Route path="exchange" element={<ExchangeServer />} />
          <Route path="sql" element={<SQLServerPage />} />
          <Route path="m365" element={<M365Page />} />
          <Route path="cal-rds" element={<CALRDS />} />
          <Route path="quick" element={<QuickAssessment />} />
          <Route path="templates" element={<Templates />} />
          <Route path="calculator" element={<Calculator />} />
          <Route path="tco" element={<TCO />} />
          <Route path="recommendations" element={<Recommendations />} />
          <Route path="reports" element={<Reports />} />
          <Route path="export" element={<Export />} />
          <Route path="catalog" element={<Catalog />} />
          <Route path="data-collection" element={<DataCollection />} />
          <Route path="licensing-guide" element={<LicensingGuide />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
    </AppProvider>
  );
}

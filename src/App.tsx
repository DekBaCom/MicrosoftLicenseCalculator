import { Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./state/AppContext";
import { AppShell } from "./components/layout/AppShell";
import Dashboard from "./pages/Dashboard";
import NewAssessment from "./pages/NewAssessment";
import Assessments from "./pages/Assessments";
import WindowsServer from "./pages/WindowsServer";
import ExchangeServer from "./pages/ExchangeServer";
import CALRDS from "./pages/CALRDS";
import Calculator from "./pages/Calculator";
import Recommendations from "./pages/Recommendations";
import Reports from "./pages/Reports";
import Export from "./pages/Export";
import Catalog from "./pages/Catalog";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <AppProvider>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="assessments" element={<Assessments />} />
          <Route path="assessments/new" element={<NewAssessment />} />
          <Route path="windows" element={<WindowsServer />} />
          <Route path="exchange" element={<ExchangeServer />} />
          <Route path="cal-rds" element={<CALRDS />} />
          <Route path="calculator" element={<Calculator />} />
          <Route path="recommendations" element={<Recommendations />} />
          <Route path="reports" element={<Reports />} />
          <Route path="export" element={<Export />} />
          <Route path="catalog" element={<Catalog />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
    </AppProvider>
  );
}

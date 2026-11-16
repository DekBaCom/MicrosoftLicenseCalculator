import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FilePlus2,
  FolderOpenDot,
  Server,
  Mail,
  Database,
  Users,
  Calculator,
  Lightbulb,
  FileText,
  FileDown,
  BookOpen,
  BookOpenCheck,
  Settings as SettingsIcon,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import clsx from "clsx";
import { useApp } from "../../state/AppContext";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/assessments/new", label: "New Assessment", icon: FilePlus2 },
  { to: "/assessments", label: "Assessments", icon: FolderOpenDot },
  { to: "/windows", label: "Windows Server", icon: Server },
  { to: "/exchange", label: "Exchange Server", icon: Mail },
  { to: "/sql", label: "SQL Server", icon: Database },
  { to: "/cal-rds", label: "CAL & RDS", icon: Users },
  { to: "/calculator", label: "License Calculator", icon: Calculator },
  { to: "/recommendations", label: "Recommendations", icon: Lightbulb },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/export", label: "Export", icon: FileDown },
  { to: "/catalog", label: "License Catalog", icon: BookOpen },
  { to: "/data-collection", label: "วิธีเก็บข้อมูล Host", icon: BookOpenCheck },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export function AppShell() {
  const [open, setOpen] = useState(false);
  const { current, assessments, setCurrentId } = useApp();
  const [picker, setPicker] = useState(false);
  const loc = useLocation();

  return (
    <div className="flex min-h-screen">
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed md:static inset-y-0 left-0 w-64 bg-white border-r border-slate-200 z-40 transform transition-transform duration-200 flex flex-col",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="h-16 px-4 flex items-center gap-2 border-b border-slate-200">
          <div className="w-8 h-8 rounded-md bg-brand-700 text-white flex items-center justify-center font-bold">
            M
          </div>
          <div className="leading-tight">
            <div className="font-semibold text-slate-900 text-sm">MS Licensing</div>
            <div className="text-[11px] text-slate-500">Assessment & Calculator</div>
          </div>
          <button
            className="ml-auto md:hidden p-1 text-slate-500"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto scrollbar-thin p-2">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-100"
                )
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-200 text-[11px] text-slate-500">
          v1.0.0 · For presales assessment only
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 gap-3 sticky top-0 z-20">
          <button
            onClick={() => setOpen(true)}
            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900 truncate">
              Microsoft License Assessment & Calculator
            </div>
            <div className="text-[11px] text-slate-500 truncate">
              {loc.pathname}
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Current assessment picker */}
            <div className="relative">
              <button
                onClick={() => setPicker((v) => !v)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-sm max-w-[260px]"
              >
                <FolderOpenDot className="w-4 h-4 text-brand-700" />
                <span className="truncate">
                  {current?.customer.name || "No assessment selected"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
              {picker && (
                <div className="absolute right-0 mt-1 w-72 bg-white border border-slate-200 rounded-lg shadow-soft z-30 max-h-80 overflow-y-auto">
                  {assessments.length === 0 && (
                    <div className="p-3 text-sm text-slate-500">No assessments yet.</div>
                  )}
                  {assessments.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => {
                        setCurrentId(a.id);
                        setPicker(false);
                      }}
                      className={clsx(
                        "w-full text-left px-3 py-2 text-sm hover:bg-slate-50 border-b last:border-b-0 border-slate-100",
                        a.id === current?.id && "bg-brand-50"
                      )}
                    >
                      <div className="font-medium text-slate-900 truncate">
                        {a.customer.name || "Untitled"}
                      </div>
                      <div className="text-[11px] text-slate-500">{a.status} · {new Date(a.updatedAt).toLocaleDateString()}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto scrollbar-thin bg-slate-50">
          <div className="p-4 md:p-6 max-w-[1500px] mx-auto">
            <Outlet />
          </div>
          <footer className="border-t border-slate-200 bg-white py-3 px-4 md:px-6 text-xs text-slate-500 text-center">
            Contribute by Mr. Abdulloh Etaeluengoh
          </footer>
        </main>
      </div>
    </div>
  );
}

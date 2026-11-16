import React, { createContext, useContext, useEffect, useState } from "react";
import { storage } from "../utils/storage";

export type Lang = "en" | "th";

type Dict = Record<string, string>;

const en: Dict = {
  // Sidebar
  "nav.dashboard": "Dashboard",
  "nav.newAssessment": "New Assessment",
  "nav.assessments": "Assessments",
  "nav.windows": "Windows Server",
  "nav.exchange": "Exchange Server",
  "nav.sql": "SQL Server",
  "nav.m365": "Microsoft 365",
  "nav.calrds": "CAL & RDS",
  "nav.calculator": "License Calculator",
  "nav.tco": "3-Year TCO",
  "nav.quick": "Quick Assessment",
  "nav.templates": "Quick Start",
  "nav.recommendations": "Recommendations",
  "nav.reports": "Reports",
  "nav.export": "Export",
  "nav.catalog": "License Catalog",
  "nav.dataCollection": "Data Collection Guide",
  "nav.licensingGuide": "Licensing Guide",
  "nav.settings": "Settings",

  // Common
  "common.newAssessment": "New Assessment",
  "common.add": "Add",
  "common.edit": "Edit",
  "common.delete": "Delete",
  "common.duplicate": "Duplicate",
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.next": "Next",
  "common.previous": "Previous",
  "common.import": "Import",
  "common.export": "Export",
  "common.search": "Search…",
  "common.noData": "No data yet",
  "common.loading": "Loading…",
  "common.yes": "Yes",
  "common.no": "No",
  "common.total": "Total",
  "common.required": "Required",
  "common.owned": "Owned",
  "common.gap": "Gap",
  "common.status": "Status",

  // App
  "app.title": "Microsoft License Assessment & Calculator",
  "app.subtitle": "For Presales / Solution Specialists",
  "app.footer": "Contribute by Mr. Abdulloh Etaeluengoh",
  "app.disclaimer.short": "Indicative assessment only — not a substitute for Microsoft Product Terms.",

  // Dashboard
  "dashboard.title": "Dashboard",
  "dashboard.empty.title": "No assessment yet",
  "dashboard.empty.desc": "Start by creating a new customer assessment.",
  "dashboard.kpi.totalAssessments": "Total Assessments",
  "dashboard.kpi.totalUsers": "Total Users",
  "dashboard.kpi.licenseGap": "License Gap",
  "dashboard.kpi.gapCost": "Est. Gap Cost / Year",
  "dashboard.chart.status": "License Status",
  "dashboard.chart.distribution": "License Distribution",
  "dashboard.chart.cost": "Cost Comparison",

  // Lang picker
  "lang.english": "English",
  "lang.thai": "ไทย",
  "lang.label": "Language",
};

const th: Dict = {
  // Sidebar
  "nav.dashboard": "แดชบอร์ด",
  "nav.newAssessment": "ประเมินใหม่",
  "nav.assessments": "รายการประเมิน",
  "nav.windows": "Windows Server",
  "nav.exchange": "Exchange Server",
  "nav.sql": "SQL Server",
  "nav.m365": "Microsoft 365",
  "nav.calrds": "CAL และ RDS",
  "nav.calculator": "คำนวณ License",
  "nav.tco": "TCO 3 ปี",
  "nav.quick": "ประเมินด่วน",
  "nav.templates": "เริ่มต้นด่วน",
  "nav.recommendations": "คำแนะนำ",
  "nav.reports": "รายงาน",
  "nav.export": "ส่งออก",
  "nav.catalog": "แคตตาล็อก License",
  "nav.dataCollection": "วิธีเก็บข้อมูล Host",
  "nav.licensingGuide": "คู่มือรูปแบบ License",
  "nav.settings": "ตั้งค่า",

  // Common
  "common.newAssessment": "ประเมินใหม่",
  "common.add": "เพิ่ม",
  "common.edit": "แก้ไข",
  "common.delete": "ลบ",
  "common.duplicate": "ทำสำเนา",
  "common.save": "บันทึก",
  "common.cancel": "ยกเลิก",
  "common.next": "ถัดไป",
  "common.previous": "ย้อนกลับ",
  "common.import": "นำเข้า",
  "common.export": "ส่งออก",
  "common.search": "ค้นหา…",
  "common.noData": "ยังไม่มีข้อมูล",
  "common.loading": "กำลังโหลด…",
  "common.yes": "ใช่",
  "common.no": "ไม่",
  "common.total": "รวม",
  "common.required": "ต้องการ",
  "common.owned": "มีอยู่",
  "common.gap": "ขาด",
  "common.status": "สถานะ",

  // App
  "app.title": "Microsoft License Assessment & Calculator",
  "app.subtitle": "สำหรับ Presales / Solution Specialist",
  "app.footer": "พัฒนาโดย นาย อับดุลเลาะห์ แอเตาะเละ",
  "app.disclaimer.short": "เป็นการประเมินเบื้องต้นเท่านั้น ไม่ได้ทดแทน Microsoft Product Terms",

  // Dashboard
  "dashboard.title": "แดชบอร์ด",
  "dashboard.empty.title": "ยังไม่มีการประเมิน",
  "dashboard.empty.desc": "เริ่มต้นโดยสร้างการประเมินลูกค้าใหม่",
  "dashboard.kpi.totalAssessments": "จำนวนการประเมิน",
  "dashboard.kpi.totalUsers": "ผู้ใช้งานทั้งหมด",
  "dashboard.kpi.licenseGap": "License ที่ขาด",
  "dashboard.kpi.gapCost": "ประมาณค่าใช้จ่ายเติม/ปี",
  "dashboard.chart.status": "สถานะ License",
  "dashboard.chart.distribution": "การกระจาย License",
  "dashboard.chart.cost": "เปรียบเทียบค่าใช้จ่าย",

  // Lang picker
  "lang.english": "English",
  "lang.thai": "ไทย",
  "lang.label": "ภาษา",
};

const dictionaries: Record<Lang, Dict> = { en, th };

interface I18nApi {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nApi | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => storage.get<Lang>("lang", "en"));

  useEffect(() => {
    storage.set("lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const api: I18nApi = {
    lang,
    setLang: setLangState,
    t: (key, fallback) => dictionaries[lang][key] ?? fallback ?? key,
  };

  return <I18nContext.Provider value={api}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nApi {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

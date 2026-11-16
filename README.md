# Microsoft License Assessment & Calculator

เว็บแอปสำหรับ **Microsoft Presales / Solution Specialist** ใช้ประเมินและคำนวณ License ของ Microsoft
(on-premises และ cloud) ได้แก่ Windows Server, CAL, RDS CAL, Exchange (รวม DAG/HA), SQL Server,
Microsoft 365 และ Windows 11 แล้วสรุปเป็น Gap Analysis, คำแนะนำการ optimize, ประมาณการค่าใช้จ่าย,
TCO 3 ปี และรายงานพร้อมส่งลูกค้า

A modern, responsive web app for Microsoft presales to assess and calculate Microsoft licensing.
Deployed as a **static site on GitHub Pages** — no backend; everything runs in the browser and is
saved in LocalStorage (prefix `mslc.v1.`).

> ข้อมูลทั้งหมดอยู่ในเบราว์เซอร์ของคุณเท่านั้น ไม่มีการส่งข้อมูลลูกค้าไปที่เซิร์ฟเวอร์ใด ๆ

---

## สารบัญ

- [ฟีเจอร์](#ฟีเจอร์)
- [วิธีใช้งาน](#วิธีใช้งาน)
- [โครงสร้างโปรเจกต์](#โครงสร้างโปรเจกต์)
- [ติดตั้งและรัน](#ติดตั้งและรัน)
- [Deploy ขึ้น GitHub Pages](#deploy-ขึ้น-github-pages)
- [การปรับแต่งกฎและราคา](#การปรับแต่งกฎและราคา)
- [Disclaimer](#disclaimer)

---

## ฟีเจอร์

### การประเมินและคำนวณ

| ฟีเจอร์ | รายละเอียด |
|---|---|
| **Assessment Wizard** | 8 ขั้นตอน: Customer → Environment → Windows → CAL/RDS → Exchange → Inventory → Review → Result |
| **Quick Assessment** | ประเมินด่วนโดยเลือกเฉพาะ scope ที่ต้องการ: Server / Exchange / CAL (+RDS) / M365 / Windows 11 แล้วกด "Save as assessment" ได้ |
| **Quick-Start Templates** | แม่แบบ SMB / Mid-size / Enterprise สร้าง assessment เริ่มต้นได้ทันที (เป็นข้อมูลตัวอย่างเพื่อประกอบเท่านั้น) |
| **Windows Server** | นับ core ต่อ host (ขั้นต่ำ 8 core/CPU, 16 core/server), Standard stacking (2 VM/ชุด), Datacenter (VM ไม่จำกัด), แจ้งเตือนจุดที่ควรพิจารณา Datacenter |
| **CAL / RDS CAL** | แนะนำ User CAL vs Device CAL อัตโนมัติ |
| **Exchange** | Server License (Standard/Enterprise), CAL, DAG / HA, Hybrid |
| **SQL Server** | Core-based + CAL, passive failover (SA), Standard/Enterprise |
| **Microsoft 365** | ตัวเลือกแพ็กเกจ (Business / E3 / E5 / **E7**) + **Suite packs** (Defender, Purview, Entra, E5 Information Protection & Governance), Copilot และ **ตรวจ license ซ้ำซ้อน (overlap warning)** |
| **Windows 11** | ตรวจเครื่องที่ upgrade ได้ / ต้องเปลี่ยน และประมาณค่า Windows Enterprise per user |
| **Azure Hybrid Benefit** | ประเมินสิทธิ์ AHB กับ Windows Server / SQL (แสดงในหน้า Calculator, Recommendations และ Excel export) |
| **Gap Analysis** | เทียบ Required vs Owned → สถานะ Compliant / Review / Gap / Surplus |
| **Recommendations** | คำแนะนำเรียงตามความสำคัญ (เช่น เปลี่ยนเป็น Datacenter, Device vs User CAL) |
| **Scenario / What-if** | จำลอง +20% users, +50% VMs, Exchange Hybrid ฯลฯ |
| **Cost Estimation** | ประมาณค่าใช้จ่ายตาม Catalog ราคา (THB / USD / EUR) |
| **3-Year TCO** | ไทม์ไลน์ค่า License (CapEx) + Software Assurance + M365 subscription 36 เดือน พร้อม SA watch-list แจ้งเตือน SA หมดอายุ/ไม่มี SA |

### การนำเข้าข้อมูล

- **Import CSV / XLSX** รายการ Windows / SQL server (มี preview ก่อนเพิ่ม และบอกแถวที่ถูกข้าม)
- รองรับ sheet **vHost ของ RVTools**
- **คู่มือเก็บข้อมูล Host** (ภาษาไทย step-by-step) สำหรับ VMware vSphere, Microsoft Hyper-V และ Nutanix

### คู่มือและความรู้

- **คู่มือรูปแบบ License** (`#/licensing-guide`) ภาษาไทย พร้อมภาพประกอบและตัวอย่างคำนวณ:
  - Windows Server: Physical, VM (Standard/Datacenter, per-VM), Hybrid/AHB, CAL, HA, vMotion, DR
  - Exchange: Server License, DAG, CAL, Hybrid, Exchange SE
  - Windows client: OEM / Enterprise / M365 / VDA / Windows 365
  - สรุปสูตรการคำนวณ (Cheat sheet)
- **เปรียบเทียบ M365** (`#/m365-compare`) — ติ๊กเลือก Office 365 E1/E3/E5, Microsoft 365 E3/E5/E7, EMS E3/E5, Copilot, Agent 365 และ Suite packs (Defender / Purview / Entra / E5 IPG) แล้วดู feature matrix (มี preset, ค้นหา, กรองหมวด, "Differences only") พร้อม **Export Excel / Word** ตามที่เลือกและกรองอยู่ (ข้อมูลเป็นตัวชี้วัดเบื้องต้น — ตรวจสอบกับ Microsoft ก่อนเสนอลูกค้า)
- **License Catalog** — จัดการราคา เพิ่ม/แก้ไข/ลบ/Import/Export

### รายงานและการส่งออก

- **Reports**: สรุปผู้บริหาร พิมพ์ / PDF
- **Export**: Excel (หลายชีท), PDF, CSV, JSON backup / restore

### ประสบการณ์ใช้งาน

- **สองภาษา** ไทย / English (สลับที่ปุ่มบนแถบด้านบน)
- **Dark Mode** (จำค่าที่เลือกไว้ และเริ่มตามค่าของระบบเป็นค่าเริ่มต้น)
- Responsive: Desktop → Tablet → Mobile (sidebar แบบ hamburger)
- รองรับทุกแพลตฟอร์ม: Windows, macOS, Linux, Android, iOS — Chrome/Edge 79+, Firefox 72+, Safari/iOS 13+ (มีหน้าแจ้งข้อผิดพลาดแทนหน้าขาวหากโหลดแอปไม่สำเร็จ)
- **Clean data**: ไม่มีข้อมูลตัวอย่างฝังมาให้ เริ่มจากว่างเปล่า
- ประสิทธิภาพ: lazy-loaded routes และแยก chunk ของ chart / xlsx / pdf
- มี **Disclaimer** เรื่อง licensing ทุกหน้า

---

## วิธีใช้งาน

เปิดเว็บที่ `https://<your-user>.github.io/MicrosoftLicenseCalculator/` (หรือรัน `npm run dev` แล้วเปิด http://localhost:5173)

### เส้นทางที่แนะนำ

```
เก็บข้อมูล Host → เริ่ม Assessment → ตรวจ Gap → ดู Recommendations / TCO → Export รายงาน
```

### 1) เก็บข้อมูลจาก environment ลูกค้า

เมนู **วิธีเก็บข้อมูล Host** — เลือก VMware / Hyper-V / Nutanix แล้วทำตามขั้นตอนเพื่อได้ข้อมูล
Sockets, Cores/CPU, จำนวน VM, Edition/Version ของแต่ละ host (หรือส่งออกจาก RVTools เป็น Excel)

### 2) เริ่มต้นประเมิน (เลือก 1 แบบ)

| ต้องการ | ใช้เมนู |
|---|---|
| ประเมินเต็มรูปแบบทีละขั้น | **ประเมินใหม่** (`New Assessment`) → Wizard 8 ขั้นตอน |
| ประเมินเฉพาะบางส่วน (เช่น แค่ M365 + Windows 11) | **ประเมินด่วน** (`Quick Assessment`) → ติ๊กเลือก scope แล้วกรอกเฉพาะส่วนนั้น → ดูผลทันที / กด **Save as assessment** |
| เริ่มจากแม่แบบ | **เริ่มต้นด่วน** (`Templates`) → ใส่ชื่อลูกค้า → เลือก SMB / Mid / Enterprise |

### 3) ใส่ข้อมูล inventory

- **Windows Server**: กรอกเอง หรือกด **Import CSV / XLSX** (รองรับ RVTools vHost) → ตรวจ preview → **Add servers**
- **Exchange**: จำนวน server, mailbox users, DAG, edition
- **SQL Server**: version / edition / model / sockets / cores / SA / passive failover
- **CAL และ RDS**: จำนวน user / device ที่เข้าถึง
- **Microsoft 365**: เลือกแพ็กเกจและจำนวน user (หากเลือกซ้อนกันจะมีกล่อง *Overlapping licenses* เตือน)
- **Current License (Inventory)**: บันทึก license ที่ลูกค้ามีอยู่ พร้อมสถานะ SA และวันหมดอายุ — ใช้เทียบ Gap และแจ้งเตือน SA

### 4) ดูผลลัพธ์

| เมนู | ได้อะไร |
|---|---|
| **Dashboard** | ภาพรวม KPI, สถานะ License, Required vs Owned, เปรียบเทียบค่าใช้จ่าย |
| **คำนวณ License** (`Calculator`) | สรุป Required / Owned / Gap แยกรายผลิตภัณฑ์ + Scenario / What-if |
| **TCO 3 ปี** | ปรับ cost basis (Required หรือ Gap เท่านั้น), อัตรา SA %, และ Year-1 SA → ดูกราฟและตาราง 3 ปี + SA watch-list |
| **คำแนะนำ** | การปรับ license ให้คุ้มขึ้นเรียงตามความสำคัญ |
| **รายงาน / ส่งออก** | PDF, Excel, CSV, JSON |

### 5) ตั้งค่าราคาและข้อมูลบริษัท

- **แคตตาล็อก License**: แก้ไขราคาให้ตรงกับสัญญาของลูกค้า (ราคาตั้งต้นเป็นค่า placeholder เท่านั้น)
- **ตั้งค่า**: ชื่อบริษัท/แบรนด์, สกุลเงินเริ่มต้น, Import/Export ข้อมูลสำรอง, ล้างข้อมูลในเครื่อง
- ปุ่ม **ดวงจันทร์/ดวงอาทิตย์** = Dark Mode, ปุ่มภาษา = ไทย/English

### 6) ศึกษากฎ License

เมนู **คู่มือรูปแบบ License** อธิบาย Physical / VM / Hybrid / CAL / HA / vMotion / DR ของ
Windows Server, Exchange และ Windows client พร้อมแผนภาพและสูตรสรุป

### 7) เปรียบเทียบ feature M365

เมนู **เปรียบเทียบ M365** → ติ๊กผลิตภัณฑ์ที่ต้องการเทียบ (หรือกด preset เช่น *E5 vs E7 + suites*) →
ดูตาราง ✓ / ◐ (บางส่วน) / – → กด **Export Excel** หรือ **Export Word** (ไฟล์ .doc แนวนอน เปิดด้วย Word ได้)

### เคล็ดลับ

- สำรองข้อมูลด้วย **Export JSON** ก่อนล้างเบราว์เซอร์ หรือย้ายเครื่อง (ข้อมูลอยู่ใน LocalStorage ของเบราว์เซอร์นั้น)
- ตรวจราคาใน Catalog ก่อนนำตัวเลขไปเสนอลูกค้าเสมอ
- ราคา M365 E7 / Suite packs และ Windows 11 Enterprise ในแอปเป็นค่า placeholder — ต้องปรับให้ตรงกับราคาจริง

---

## โครงสร้างโปรเจกต์

```
src/
├── components/
│   ├── common/        # KpiCard, PageHeader, Disclaimer, EmptyState, ImportServersButton ...
│   ├── guide/         # SVG diagrams ของคู่มือ License
│   ├── layout/        # AppShell (sidebar + topbar)
│   └── questionnaire/ # Stepper ของ wizard
├── pages/             # Dashboard, NewAssessment, QuickAssessment, Templates, WindowsServer,
│                      # ExchangeServer, SQLServer, M365, CALRDS, Calculator, TCO,
│                      # Recommendations, Reports, Export, Catalog,
│                      # LicensingGuide, DataCollection, Settings
├── engine/            # Pure calculation modules (ไม่ผูกกับ React)
│   ├── windowsCalculator.ts   ├── calCalculator.ts     ├── rdsCalculator.ts
│   ├── exchangeCalculator.ts  ├── sqlCalculator.ts     ├── m365Calculator.ts
│   ├── windows11Calculator.ts ├── ahbCalculator.ts     ├── gapAnalyzer.ts
│   ├── recommendationEngine.ts├── costCalculator.ts    └── tcoCalculator.ts
├── data/              # licenseRules, pricing, products, m365Plans, windows11, templates
├── import/            # serverImport.ts (CSV / XLSX / RVTools)
├── export/            # excel.ts, pdf.ts
├── i18n/              # พจนานุกรม en / th
├── state/             # AppContext (LocalStorage persistence)
├── types/             # Shared TypeScript types
├── utils/             # format, id, storage, theme
└── App.tsx            # Routes (lazy-loaded)
```

**Tech stack:** React 18, TypeScript (strict), Vite 5, Tailwind CSS 3, React Router (HashRouter),
Recharts, lucide-react, SheetJS (xlsx), jsPDF.

---

## ติดตั้งและรัน

ต้องใช้ Node.js **20+**

```bash
npm install      # ติดตั้ง dependencies
npm run dev      # dev server ที่ http://localhost:5173
npm run build    # type-check + build ไปที่ dist/
npm run preview  # ทดลองรันไฟล์ที่ build แล้ว
```

---

## Deploy ขึ้น GitHub Pages

1. แก้ `REPO_NAME` ใน `vite.config.ts` ให้ตรงกับชื่อ repo (ค่าปัจจุบัน `MicrosoftLicenseCalculator`)
2. Push ขึ้น branch `main` — workflow `.github/workflows/deploy.yml` จะ install → build → deploy `dist/`
3. ที่ **Settings → Pages** ตั้ง Source เป็น **GitHub Actions**

เว็บจะอยู่ที่ `https://<your-user>.github.io/<REPO_NAME>/`

> ใช้ HashRouter จึงไม่ต้องตั้งค่า rewrite ฝั่งเซิร์ฟเวอร์ และ workflow คัดลอก `index.html` เป็น `404.html` เป็นตัวช่วยเพิ่มเติม

---

## การปรับแต่งกฎและราคา

**กฎ License** อยู่ที่ `src/data/licenseRules.ts` เช่น
`minimumCoresPerProcessor`, `minimumCoresPerServer`, `minimumProcessorsPerServer`,
`virtualizationRights` (Standard), `unlimitedVirtualization` (Datacenter),
`DATACENTER_VM_BREAKPOINT` (จำนวน VM ที่เริ่มแนะนำ Datacenter), `CAL_DEVICE_FACTOR`

**ราคา** ตั้งต้นที่ `src/data/pricing.ts` และแก้ในแอปที่เมนู License Catalog ได้ (เก็บใน LocalStorage)
ส่วนแพ็กเกจ M365 ดูที่ `src/data/m365Plans.ts` และราคา Windows 11 ที่ `src/data/windows11.ts`

> ราคาทั้งหมดเป็นค่า **placeholder** เพื่อการประเมินเท่านั้น ต้องปรับให้ตรงกับสัญญา/ราคาของลูกค้าจริง

---

## Disclaimer

> เครื่องมือนี้ให้ผลการประเมิน License เบื้องต้นตามข้อมูลที่กรอกและกฎที่ตั้งค่าไว้ **ไม่ใช่** ข้อมูลทางการ
> ไม่สามารถแทน Product Terms, สัญญา Licensing, สัญญากับ Reseller หรือการตรวจสอบโดย Licensing Specialist
> ของ Microsoft ได้ ข้อกำหนดและราคาสุดท้ายต้องยืนยันกับเอกสารและสัญญาที่เกี่ยวข้องก่อนใช้งานจริง

This tool provides an indicative Microsoft licensing assessment based on the information entered and
configured licensing rules. It is **not** a substitute for Microsoft's official Product Terms,
licensing agreement, reseller agreement, or licensing specialist validation.

## Roadmap

- Save / share assessment via URL
- Customer-facing PDF with logo
- SA Benefit analyzer, assessment comparison
- Power Platform / Fabric licensing, licensing program selector
- ครอบคลุมภาษาไทย/อังกฤษในทุกหน้า และรูป screenshot จริงในคู่มือเก็บข้อมูล

---

Contribute by Mr.Abdulloh Etaeluengoh

Internal presales enablement tool — ค่า licensing และกฎต่าง ๆ ต้องผ่านการตรวจสอบโดย Microsoft licensing specialist ก่อนนำไปใช้กับลูกค้า

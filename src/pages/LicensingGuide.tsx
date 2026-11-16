import { useState } from "react";
import { GraduationCap, Monitor, Server, Mail, Table2 } from "lucide-react";
import { PageHeader } from "../components/common/PageHeader";
import { Disclaimer } from "../components/common/Disclaimer";
import {
  PhysicalMinimumsDiagram,
  EditionStackingDiagram,
  PerVmDiagram,
  HybridDiagram,
  VMotionDiagram,
  HaDiagram,
  DrDiagram,
  CalDiagram,
  ExchangeDagDiagram,
  ExchangeHybridDiagram,
  WindowsClientDiagram,
} from "../components/guide/LicensingDiagrams";

type Tab = "client" | "server" | "exchange" | "cheat";

export default function LicensingGuide() {
  const [tab, setTab] = useState<Tab>("server");

  return (
    <>
      <PageHeader
        title="คู่มือรูปแบบ License: Windows / Windows Server / Exchange"
        subtitle="Physical · VM · Hybrid · CAL · HA · vMotion · DR — พร้อมภาพประกอบและตัวอย่างการคำนวณ"
        icon={<GraduationCap className="w-5 h-5" />}
      />

      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-thin">
        <TabBtn active={tab === "server"} onClick={() => setTab("server")} icon={<Server className="w-4 h-4" />}>Windows Server</TabBtn>
        <TabBtn active={tab === "exchange"} onClick={() => setTab("exchange")} icon={<Mail className="w-4 h-4" />}>Exchange Server</TabBtn>
        <TabBtn active={tab === "client"} onClick={() => setTab("client")} icon={<Monitor className="w-4 h-4" />}>Windows (Client)</TabBtn>
        <TabBtn active={tab === "cheat"} onClick={() => setTab("cheat")} icon={<Table2 className="w-4 h-4" />}>สรุปสูตร</TabBtn>
      </div>

      {tab === "server" && <ServerGuide />}
      {tab === "exchange" && <ExchangeGuide />}
      {tab === "client" && <ClientGuide />}
      {tab === "cheat" && <CheatSheet />}

      <div className="mt-4">
        <Disclaimer compact />
      </div>
    </>
  );
}

function TabBtn({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
        active ? "bg-brand-700 text-white" : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <div id={id} className="card p-4 mb-3">
      <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
      <div className="space-y-3 text-sm text-slate-700">{children}</div>
    </div>
  );
}

function Example({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
      <div className="font-semibold mb-1">ตัวอย่างคำนวณ: {title}</div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function Warn({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">{children}</div>;
}

function Bullets({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc pl-5 space-y-1">
      {items.map((x, i) => (
        <li key={i}>{x}</li>
      ))}
    </ul>
  );
}

// =========================== Windows Server ===========================

function ServerGuide() {
  return (
    <>
      <Section title="0) ภาพรวม: Windows Server License = Core License + CAL">
        <p>
          Windows Server (2016 ขึ้นไป) ใช้โมเดล <b>per-core</b> สำหรับตัวเซิร์ฟเวอร์ และต้องมี <b>CAL</b> สำหรับผู้ใช้/อุปกรณ์ที่เข้าถึง
          ทั้งสองส่วนไม่ขึ้นกับ hypervisor (VMware ESXi, Hyper-V, Nutanix AHV, OpenShift ใช้กฎเดียวกัน)
        </p>
        <Bullets
          items={[
            <>เลือก <b>Edition</b>: Standard (2 VM ต่อ 1 ชุด, ต่อ stack ได้), Datacenter (VM ไม่จำกัด), Essentials (ไม่ต้องมี CAL, จำกัดผู้ใช้ 25 / device 50)</>,
            <>เลือก <b>วิธีนับ</b>: Physical host (ปกติ) หรือ per-VM (ต้องมี SA/Subscription)</>,
            <>นับ <b>CAL</b> ตามผู้ใช้/อุปกรณ์ที่เข้าถึง และ RDS CAL แยกต่างหากสำหรับ Remote Desktop</>,
          ]}
        />
      </Section>

      <Section title="1) Physical — License ตาม core จริงของ host">
        <PhysicalMinimumsDiagram />
        <Bullets
          items={[
            <>ขั้นต่ำ <b>8 core ต่อ CPU</b> และ <b>16 core ต่อเซิร์ฟเวอร์</b> (อย่างน้อย 2 CPU ในการนับขั้นต่ำ)</>,
            <>นับ <b>physical core</b> ไม่ใช่ vCPU / logical processor (Hyper-Threading ไม่นับเพิ่ม)</>,
            <>ต้อง license <b>ทุก core ของ host</b> ก่อน จึงจะมีสิทธิ์รัน VM บน host นั้น</>,
          ]}
        />
        <Example title="Host 2 CPU × 12 core รัน Windows Server Datacenter">
          <div>Core จริง = 24 → ผ่านขั้นต่ำ (≥16/server, ≥8/CPU) → ซื้อ <b>24 core license</b></div>
        </Example>
      </Section>

      <Section title="2) VM บน Host — Standard vs Datacenter">
        <EditionStackingDiagram />
        <Bullets
          items={[
            <>Standard: license เต็ม host 1 ชุด = สิทธิ์ <b>2 VM</b>; ต้องการ VM เพิ่มให้ซื้อชุดเต็มซ้ำ (stacking) ทีละ 2 VM</>,
            <>Datacenter: license เต็ม host 1 ชุด = VM <b>ไม่จำกัด</b></>,
            <>แอปนี้เตือนให้พิจารณา Datacenter เมื่อมี VM ≥ 8 ตัวต่อ host (ที่ราคา list จุดคุ้มทุนจริงมักอยู่ราว 11–13 VM — ตรวจราคาจริงในตัวคำนวณ)</>,
          ]}
        />
        <Example title="Host 32 core, 10 VM">
          <div>Standard: ⌈10 ÷ 2⌉ = 5 ชุด × 32 = <b>160 core license</b></div>
          <div>Datacenter: 1 ชุด × 32 = <b>32 core license</b> (แต่ราคา/core สูงกว่า → เทียบราคาจริงก่อนตัดสินใจ)</div>
        </Example>
      </Section>

      <Section title="3) Per-VM (VM-level) vs Hybrid">
        <PerVmDiagram />
        <p>
          <b>Per-VM licensing</b> ใช้ได้เมื่อมี Software Assurance / Subscription: นับ vCore ของแต่ละ VM โดยขั้นต่ำ
          <b> 8 core license ต่อ VM</b> (และ 16 core license ต่อ processor license) — มักแพงกว่า host licensing เมื่อมี VM จำนวนมาก
          จึงเหมาะกับ VM จำนวนน้อย หรือ VM ที่รันบน host ที่ license เองไม่ได้ (เช่น โฮสต์ของ provider อื่น)
        </p>
        <HybridDiagram />
        <p>
          <b>Hybrid (on-prem + Azure)</b>: ใช้ <b>Azure Hybrid Benefit (AHB)</b> นำ license Windows Server ที่มี SA/Subscription
          ไปลดค่า OS บน Azure VM โดยไม่ต้องซื้อซ้ำ
        </p>
        <Bullets
          items={[
            <>Standard: ใช้ on-prem และ Azure <b>พร้อมกันไม่ได้</b> (มีข้อยกเว้นช่วงย้ายระบบ 180 วัน); Datacenter ใช้พร้อมกันได้ (กรณี per-VM)</>,
            <>ขั้นต่ำ 8 core license ต่อ Azure VM; ต้องหยุดใช้ AHB เมื่อ SA หมดอายุ</>,
            <>Unlimited virtualization ผ่าน AHB ได้เฉพาะ Datacenter บน Azure Dedicated Host ที่ license ครบทุก physical core</>,
          ]}
        />
        <Example title="VM 6 vCPU ย้ายไป Azure ด้วย AHB">
          <div>vCore = 6 → ต่ำกว่าขั้นต่ำ → นับเป็น <b>8 core license</b> ต่อ VM</div>
        </Example>
      </Section>

      <Section title="4) CAL — Server CAL / RDS CAL">
        <CalDiagram />
        <Bullets
          items={[
            <><b>User CAL</b>: ผู้ใช้ 1 คนเข้าถึงได้จากหลายอุปกรณ์ → เหมาะเมื่อ user ใช้หลาย device</>,
            <><b>Device CAL</b>: อุปกรณ์ 1 เครื่องใช้ได้หลาย user → เหมาะกับ shift work / kiosk</>,
            <>ต้องมี CAL <b>เวอร์ชันเท่ากับหรือสูงกว่า</b> เซิร์ฟเวอร์ที่เข้าถึง; <b>ไม่ผูกกับจำนวน VM หรือ core</b></>,
            <>RDS (Remote Desktop) ต้องมี <b>RDS CAL</b> เพิ่มจาก Windows Server CAL เสมอ (User/Device)</>,
            <>Windows Server Essentials ไม่ต้องมี CAL (จำกัด 25 user / 50 device)</>,
          ]}
        />
        <Example title="พนักงาน 200 คน (ใช้ 1 PC/คน) + กะ 30 เครื่อง">
          <div>User CAL = 200 · Device CAL = 230 → เลือก <b>User CAL 200</b> หากทุกคนใช้เครื่องเฉพาะตัว</div>
          <div>หากมี 80 คน แชร์ 30 เครื่องแบบ shift → Device CAL ถูกกว่า</div>
        </Example>
      </Section>

      <Section title="5) HA (Failover Cluster / Hyper-V Replica / NLB)">
        <HaDiagram />
        <Bullets
          items={[
            <>Windows Server ไม่มีสิทธิ์ “passive node ฟรี” → <b>ทุก host ใน cluster ที่ VM อาจรัน</b> ต้อง license เต็ม</>,
            <>Active–Standby (N+1): คิด license ทั้ง Active และ Standby host</>,
            <>Active–Active: license ทุก host ตามปกติ (ไม่มีส่วนลด)</>,
            <>SQL Server ต่างกัน: SA ให้สิทธิ์ passive failover node (ดูแท็บ SQL)</>,
          ]}
        />
        <Example title="Cluster 2 node (Active/Standby) host 2×16 core, Datacenter">
          <div>(1 Active + 1 Standby) × 32 core = <b>64 core license</b></div>
        </Example>
      </Section>

      <Section title="6) vMotion / Live Migration">
        <VMotionDiagram />
        <Bullets
          items={[
            <>VM ย้ายข้าม host ได้ (vMotion, Live Migration, AHV migration) → <b>ทุก host ที่ VM ย้ายไปได้</b> ต้องมี license ครอบคลุม</>,
            <>Datacenter ทุก host ใน cluster = วิธีที่ง่ายและเสถียรที่สุด (VM ย้ายอิสระ ไม่ต้องจัดการ stacking)</>,
            <>Standard: จำนวน VM สูงสุดที่ <i>อาจ</i> อยู่บน host ใด host หนึ่งต้องถูกครอบคลุมด้วย stacking ของ host นั้น</>,
            <>การย้าย <i>license</i> ระหว่างเซิร์ฟเวอร์ถาวรทำได้ไม่บ่อย (โดยทั่วไป ≥ 90 วัน) — การย้าย VM ชั่วคราวไม่ใช่การย้าย license</>,
          ]}
        />
        <Example title="Cluster 3 host (2×16 core), DRS อาจรวม 12 VM บน host เดียว, Standard">
          <div>ต่อ host: ⌈12 ÷ 2⌉ = 6 ชุด × 32 = 192 core → 3 host = <b>576 core license</b></div>
          <div>Datacenter: 3 × 32 = <b>96 core license</b> (ถูกกว่ามากในกรณีนี้)</div>
        </Example>
        <Warn>กฎการย้าย license และ “server farm mobility” ปรับเปลี่ยนตามเวอร์ชัน/โปรแกรม — ตรวจ Product Terms ล่าสุดก่อนออกแบบ cluster</Warn>
      </Section>

      <Section title="7) DR (Disaster Recovery)">
        <DrDiagram />
        <Bullets
          items={[
            <><b>DR on-prem:</b> host ที่ DR site ที่จะรัน Windows Server ต้อง license ด้วย (ไม่มีสิทธิ์ passive ฟรี สำหรับ Windows Server)</>,
            <><b>DR ไป Azure (ASR):</b> จ่าย Azure VM ตามการใช้งานจริง + ใช้ AHB ได้หากมี SA/Subscription; ไม่ต้องซื้อ host DR เอง</>,
            <>คิดจำนวน core ของ DR host รวมในผล assessment เพื่อไม่ให้ประมาณต่ำเกินจริง</>,
          ]}
        />
        <Example title="Primary 32 core + DR site 32 core (Datacenter)">
          <div>(32 + 32) = <b>64 core license</b> ; ถ้า DR ไป Azure ด้วย AHB → on-prem 32 core + ค่า Azure compute</div>
        </Example>
      </Section>
    </>
  );
}

// =========================== Exchange ===========================

function ExchangeGuide() {
  return (
    <>
      <Section title="0) ภาพรวม: Exchange Server = Server License + CAL">
        <ExchangeDagDiagram />
        <Bullets
          items={[
            <><b>Server License</b> ต่อ 1 เซิร์ฟเวอร์ (physical หรือ VM) ไม่ว่าจะมีกี่ core/CPU — ไม่ใช่ per-core เหมือน Windows Server</>,
            <>2 edition: <b>Standard</b> (สูงสุด 5 mounted DB) และ <b>Enterprise</b> (สูงสุด 100 DB) — กำหนดด้วย product key</>,
            <>CAL: <b>Standard CAL</b> (mail/calendar/contact) และ <b>Enterprise CAL</b> (เพิ่ม archiving, DLP ฯลฯ) — ซื้อ <b>ทับ Standard CAL</b> ไม่ใช่ทดแทน</>,
            <>CAL เป็น User CAL หรือ Device CAL ก็ได้ — เก็บจำนวน “คน/อุปกรณ์” ที่ใช้ mailbox ไม่ใช่จำนวน mailbox ทั้งหมด</>,
          ]}
        />
      </Section>

      <Section title="1) Physical vs VM">
        <Bullets
          items={[
            <>Exchange ติดตั้งบน physical หรือ VM ก็ได้ ได้สิทธิ์ <b>1 server license ต่อ 1 OSE</b> ที่รัน Exchange</>,
            <>ไม่มี core-based pricing → จำนวน core/vCPU ไม่มีผลต่อค่า Exchange Server License (แต่ Windows Server ที่รัน Exchange ต้อง license ตามหัวข้อ Windows Server)</>,
            <>Exchange VM ที่ย้ายด้วย vMotion ไม่เพิ่มค่า Exchange license (แต่ host ต้อง license Windows Server ครบ)</>,
          ]}
        />
        <Example title="Exchange 2 VM บน host 32 core (Windows Server Standard)">
          <div>Exchange: 2 Server License (1 ต่อ VM) + CAL ตามผู้ใช้</div>
          <div>Windows: Host 32 core Standard 1 ชุด = สิทธิ์ 2 VM พอดี (ถ้ามี VM อื่นเพิ่มต้อง stack)</div>
        </Example>
      </Section>

      <Section title="2) HA — DAG (Database Availability Group)">
        <Bullets
          items={[
            <>DAG รองรับสูงสุด <b>16 member</b>; <b>ทุก member ต้องมี Exchange Server License</b> (ไม่มี passive ฟรี)</>,
            <>เลือก Standard/Enterprise ตามจำนวน mounted DB และ replica ที่ต้องการต่อ server</>,
            <>Lagged copy / DR site member ก็นับเป็น server เช่นกัน</>,
          ]}
        />
        <Example title="DAG 3 member (2 site หลัก + 1 DR)">
          <div><b>3 Server License</b> + CAL ตามจำนวน user/device (ไม่ขึ้นกับจำนวน member)</div>
        </Example>
      </Section>

      <Section title="3) CAL — Exchange CAL">
        <Bullets
          items={[
            <>Standard CAL: ทุกผู้ใช้/อุปกรณ์ที่เข้าถึง mailbox ต้องมี</>,
            <>Enterprise CAL: เพิ่มเมื่อใช้ฟีเจอร์ premium (In-Place Archive, Retention/DLP, Unified Messaging ฯลฯ) — ต้องมี Standard CAL ด้วย</>,
            <>Mailbox ที่อยู่ใน Exchange Online ใช้สิทธิ์จาก Subscription ไม่ต้องมี CAL on-prem</>,
          ]}
        />
        <Example title="500 users ที่ใช้ mailbox on-prem, 120 คนใช้ archive/DLP">
          <div>Standard CAL = <b>500</b> · Enterprise CAL = <b>120</b> (เพิ่มทับ Standard)</div>
        </Example>
      </Section>

      <Section title="4) Hybrid (on-prem + Exchange Online) และ Exchange SE">
        <ExchangeHybridDiagram />
        <Bullets
          items={[
            <>Hybrid server ที่ยังรัน mailbox/transport on-prem ต้องมี <b>Server License + CAL</b> ตามปกติ</>,
            <>Hybrid Configuration Wizard license ฟรีใช้ได้เฉพาะ Exchange <b>2010 SP3 / 2013 / 2016</b> hybrid server — ไม่ใช้กับ 2019 ขึ้นไป (ตรวจเงื่อนไขล่าสุด)</>,
            <>Exchange 2016 / 2019 สิ้นสุด support <b>14 ต.ค. 2025</b> → วางแผนไป Exchange SE หรือ Exchange Online</>,
            <>Exchange <b>Subscription Edition (SE)</b>: สิทธิ์ผ่าน SA ของ 2019 หรือ M365 E3/E5 ที่เข้าเงื่อนไข; ต้องมี SA เพื่ออัปเกรดจาก 2019 → SE</>,
          ]}
        />
      </Section>

      <Section title="5) vMotion / DR ของ Exchange">
        <Bullets
          items={[
            <>Exchange VM ย้ายด้วย vMotion ได้ตามเงื่อนไข support ของ Exchange; license Exchange ยังคงเป็นต่อ VM (OSE)</>,
            <>DR site: ถ้ามี DAG member ที่ DR ต้องมี server license ต่อ member (ดูหัวข้อ HA)</>,
            <>DR ไป Exchange Online: ใช้ Subscription แทน (ไม่ต้องมี server license ที่ DR)</>,
          ]}
        />
      </Section>
    </>
  );
}

// =========================== Windows client ===========================

function ClientGuide() {
  return (
    <>
      <Section title="0) ภาพรวม License ของ Windows client">
        <WindowsClientDiagram />
      </Section>

      <Section title="1) รูปแบบ License">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="table min-w-[640px]">
            <thead>
              <tr><th>รูปแบบ</th><th>นับต่อ</th><th>หมายเหตุ</th></tr>
            </thead>
            <tbody>
              <tr><td>Windows 11 Pro (OEM / FPP)</td><td>เครื่อง</td><td>ผูกกับเครื่อง; พื้นฐานสำหรับ Volume upgrade</td></tr>
              <tr><td>Windows Enterprise E3 / E5 (Volume, SA)</td><td>user หรือ device</td><td>ต้องมี Windows Pro license ที่ถูกต้องเป็น base ก่อน</td></tr>
              <tr><td>Windows in Microsoft 365 E3 / E5 / F3</td><td>user</td><td>ใช้ได้ถึง 5 device ต่อ user</td></tr>
              <tr><td>Windows VDA</td><td>device</td><td>สำหรับเข้าถึง VDI ด้วย device ที่ไม่มี SA</td></tr>
              <tr><td>Windows 365 (Cloud PC)</td><td>user</td><td>เป็น subscription Cloud PC</td></tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="2) Physical / VM / VDI">
        <Bullets
          items={[
            <><b>Physical PC:</b> ใช้ OEM Pro หรือ Enterprise upgrade ตามสิทธิ์ user/device</>,
            <><b>VDI (VM):</b> device ที่เข้าถึงต้องมี SA บน Windows Enterprise หรือ VDA; Windows Client ใน VM ต้องใช้ Enterprise per-user/device ตามเงื่อนไข</>,
            <><b>Azure Virtual Desktop:</b> ใช้สิทธิ์ Windows Enterprise E3/E5 (M365) ได้โดยไม่ต้องมี Windows license แยก ตามเงื่อนไข</>,
          ]}
        />
        <Example title="500 users M365 E3 (2 device/คน)">
          <div>Windows Enterprise E3 = <b>500 user</b> (ครอบคลุม 1,000 device ได้ ไม่ต้องซื้อรายเครื่อง)</div>
        </Example>
        <Warn>Windows 10 สิ้นสุด support 14 ต.ค. 2025 — ใช้เมนู Quick Assessment (Windows 11) เพื่อประเมินเครื่องที่ upgrade ได้/ต้องเปลี่ยน</Warn>
      </Section>
    </>
  );
}

// =========================== Cheat sheet ===========================

function CheatSheet() {
  return (
    <Section title="สรุปสูตรการคำนวณ (Cheat Sheet)">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="table min-w-[760px]">
          <thead>
            <tr><th>สถานการณ์</th><th>สูตร</th></tr>
          </thead>
          <tbody>
            <tr><td>Physical host (Windows Server)</td><td>max(cores, 8 × CPU, 16) core license</td></tr>
            <tr><td>Standard บน host, N VM</td><td>⌈N ÷ 2⌉ × (core license ของ host)</td></tr>
            <tr><td>Datacenter บน host</td><td>1 × (core license ของ host) — VM ไม่จำกัด</td></tr>
            <tr><td>Per-VM</td><td>Σ max(vCore ของ VM, 8)</td></tr>
            <tr><td>Hybrid / AHB (Azure)</td><td>max(vCore, 8) ต่อ VM; ต้องมี SA/Subscription</td></tr>
            <tr><td>Server CAL (Windows)</td><td>min(User CAL, Device CAL) ตามรูปแบบการใช้งาน</td></tr>
            <tr><td>RDS CAL</td><td>จำนวน User หรือ Device ที่ใช้ Remote Desktop</td></tr>
            <tr><td>HA Cluster</td><td>Σ core license ของทุก host (รวม Standby)</td></tr>
            <tr><td>vMotion cluster</td><td>Datacenter ทุก host หรือ stack Standard ให้ครอบคลุม VM สูงสุดต่อ host</td></tr>
            <tr><td>DR on-prem</td><td>Primary + DR (ทั้งสอง site)</td></tr>
            <tr><td>Exchange Server</td><td>1 Server License ต่อ server/VM (Std หรือ Ent)</td></tr>
            <tr><td>Exchange DAG</td><td>จำนวน member × Server License</td></tr>
            <tr><td>Exchange CAL</td><td>Standard CAL = users/devices; Enterprise CAL = users/devices ที่ใช้ premium (ซื้อทับ)</td></tr>
          </tbody>
        </table>
      </div>
    </Section>
  );
}

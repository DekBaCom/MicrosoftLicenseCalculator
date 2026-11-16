import type { ReactNode } from "react";

// Self-contained SVG diagrams. Each draws its own light background so it stays
// readable in dark mode.

const C = {
  bg: "#f8fafc",
  line: "#94a3b8",
  text: "#0f172a",
  sub: "#475569",
  blue: "#1d4ed8",
  blueLight: "#dbeafe",
  green: "#059669",
  greenLight: "#d1fae5",
  amber: "#d97706",
  amberLight: "#fef3c7",
  red: "#dc2626",
  redLight: "#fee2e2",
  gray: "#e2e8f0",
};

function Frame({ w, h, title, children }: { w: number; h: number; title: string; children: ReactNode }) {
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto rounded-lg border border-slate-200" role="img" aria-label={title} fontFamily="system-ui, sans-serif">
      <rect width={w} height={h} fill={C.bg} />
      {children}
    </svg>
  );
}

function T({ x, y, children, size = 12, bold, fill = C.text, anchor = "middle" }: { x: number; y: number; children: ReactNode; size?: number; bold?: boolean; fill?: string; anchor?: "start" | "middle" | "end" }) {
  return (
    <text x={x} y={y} fontSize={size} fontWeight={bold ? 700 : 400} fill={fill} textAnchor={anchor}>
      {children}
    </text>
  );
}

function Box({ x, y, w, h, fill, stroke, dash }: { x: number; y: number; w: number; h: number; fill: string; stroke: string; dash?: boolean }) {
  return <rect x={x} y={y} width={w} height={h} rx={8} fill={fill} stroke={stroke} strokeWidth={1.5} strokeDasharray={dash ? "5 4" : undefined} />;
}

function Arrow({ x1, y1, x2, y2, color = C.line, dash }: { x1: number; y1: number; x2: number; y2: number; color?: string; dash?: boolean }) {
  return (
    <>
      <defs>
        <marker id={`ah-${color.slice(1)}`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 z" fill={color} />
        </marker>
      </defs>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={2} strokeDasharray={dash ? "6 4" : undefined} markerEnd={`url(#ah-${color.slice(1)})`} />
    </>
  );
}

/** A server box with coloured core squares. */
function Host({ x, y, w, label, sockets, cores, vms, vmFill = C.blueLight, vmStroke = C.blue, licensed = true }: {
  x: number; y: number; w: number; label: string; sockets: number; cores: number; vms: string[]; vmFill?: string; vmStroke?: string; licensed?: boolean;
}) {
  const h = 70 + vms.length * 26;
  return (
    <g>
      <Box x={x} y={y} w={w} h={h} fill="#fff" stroke={licensed ? C.green : C.red} />
      <T x={x + w / 2} y={y + 18} bold>{label}</T>
      <T x={x + w / 2} y={y + 34} size={10} fill={C.sub}>{`${sockets} socket × ${cores} core`}</T>
      {Array.from({ length: Math.min(sockets * cores, 32) }).map((_, i) => (
        <rect key={i} x={x + 10 + (i % 16) * ((w - 20) / 16)} y={y + 42 + Math.floor(i / 16) * 9} width={(w - 20) / 16 - 2} height={7} rx={1} fill={licensed ? C.green : C.red} />
      ))}
      {vms.map((v, i) => (
        <g key={i}>
          <Box x={x + 10} y={y + 66 + i * 26} w={w - 20} h={20} fill={vmFill} stroke={vmStroke} />
          <T x={x + w / 2} y={y + 80 + i * 26} size={10}>{v}</T>
        </g>
      ))}
    </g>
  );
}

// 1) Physical host licensing — minimums
export function PhysicalMinimumsDiagram() {
  return (
    <Frame w={720} h={230} title="Windows Server physical core licensing minimums">
      <T x={360} y={22} bold size={14}>หลักการ: License ตาม “physical core” ของ host (ไม่ใช่ vCPU)</T>
      {[
        { x: 20, label: "ตัวอย่าง A", d: "2 CPU × 6 core = 12 core จริง", r: "ขั้นต่ำ 8 core/CPU → 16 core", c: C.amberLight, s: C.amber },
        { x: 250, label: "ตัวอย่าง B", d: "1 CPU × 4 core = 4 core จริง", r: "ขั้นต่ำ 16 core/server → 16 core", c: C.amberLight, s: C.amber },
        { x: 480, label: "ตัวอย่าง C", d: "2 CPU × 16 core = 32 core จริง", r: "เกินขั้นต่ำ → ต้อง 32 core", c: C.greenLight, s: C.green },
      ].map((e) => (
        <g key={e.label}>
          <Box x={e.x} y={40} w={220} h={170} fill={e.c} stroke={e.s} />
          <T x={e.x + 110} y={64} bold>{e.label}</T>
          <T x={e.x + 110} y={92} size={11}>{e.d}</T>
          <Arrow x1={e.x + 110} y1={102} x2={e.x + 110} y2={128} color={e.s} />
          <T x={e.x + 110} y={152} size={12} bold>{e.r}</T>
          <T x={e.x + 110} y={184} size={10} fill={C.sub}>ขาย core license เป็นแพ็ก 2-core / 16-core</T>
        </g>
      ))}
    </Frame>
  );
}

// 2) Standard stacking vs Datacenter
export function EditionStackingDiagram() {
  const vmBox = (x: number, y: number, n: string, f: string, s: string) => (
    <g key={`${x}-${y}`}>
      <Box x={x} y={y} w={46} h={22} fill={f} stroke={s} />
      <T x={x + 23} y={y + 15} size={10}>{n}</T>
    </g>
  );
  return (
    <Frame w={720} h={290} title="Standard stacking versus Datacenter on a 2x16 core host">
      <T x={360} y={22} bold size={14}>Host 2 CPU × 16 core = 32 core (License เต็ม 32 core ต่อ 1 ชุด)</T>

      <Box x={20} y={40} w={335} h={235} fill="#fff" stroke={C.blue} />
      <T x={187} y={62} bold>Standard (2 VM ต่อ 1 ชุด)</T>
      {[0, 1, 2].map((s) => (
        <g key={s}>
          <Box x={34} y={74 + s * 62} w={307} h={54} fill={C.blueLight} stroke={C.blue} />
          <T x={46} y={92 + s * 62} size={10} anchor="start" fill={C.sub}>{`ชุดที่ ${s + 1}: 32 core license`}</T>
          {vmBox(200, 84 + s * 62, `VM${s * 2 + 1}`, "#fff", C.blue)}
          {vmBox(254, 84 + s * 62, `VM${s * 2 + 2}`, "#fff", C.blue)}
        </g>
      ))}
      <T x={187} y={266} size={11} bold fill={C.blue}>6 VM = 3 ชุด × 32 = 96 core license</T>

      <Box x={375} y={40} w={325} h={235} fill="#fff" stroke={C.green} />
      <T x={537} y={62} bold>Datacenter (ไม่จำกัด VM)</T>
      <Box x={389} y={74} w={297} h={160} fill={C.greenLight} stroke={C.green} />
      <T x={400} y={92} size={10} anchor="start" fill={C.sub}>1 ชุด: 32 core license</T>
      {Array.from({ length: 12 }).map((_, i) => vmBox(398 + (i % 5) * 56, 106 + Math.floor(i / 5) * 30, `VM${i + 1}`, "#fff", C.green))}
      <T x={537} y={262} size={11} bold fill={C.green}>VM กี่ตัวก็ได้ = 32 core license</T>
    </Frame>
  );
}

// 3) Per-VM (hybrid / AHB) vs per-host
export function PerVmDiagram() {
  return (
    <Frame w={720} h={230} title="Per host vs per VM licensing">
      <T x={360} y={22} bold size={14}>License ที่ host (ปกติ) เทียบกับ License รายตัว VM (ต้องมี SA/Subscription)</T>
      <Box x={20} y={40} w={335} h={175} fill="#fff" stroke={C.blue} />
      <T x={187} y={62} bold>Host licensing</T>
      <T x={187} y={84} size={11}>นับ core ของ “เครื่องจริง” ทั้งหมด</T>
      <Host x={80} y={94} w={215} label="Host 32 core" sockets={2} cores={16} vms={[]} />
      <T x={187} y={200} size={10} fill={C.sub}>VM เกิดใหม่/ย้ายไปมาบน host ที่ license แล้ว ไม่ต้องซื้อเพิ่ม (Datacenter)</T>

      <Box x={375} y={40} w={325} h={175} fill="#fff" stroke={C.amber} />
      <T x={537} y={62} bold>Per-VM licensing</T>
      <T x={537} y={84} size={11}>นับ vCore ต่อ VM — ขั้นต่ำ 8 core/VM</T>
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <Box x={395 + i * 100} y={98} w={90} h={60} fill={C.amberLight} stroke={C.amber} />
          <T x={440 + i * 100} y={120} size={11} bold>{`VM${i + 1}`}</T>
          <T x={440 + i * 100} y={138} size={10}>{["4 vCPU → 8", "8 vCPU → 8", "12 vCPU → 12"][i]}</T>
          <T x={440 + i * 100} y={151} size={9} fill={C.sub}>core license</T>
        </g>
      ))}
      <T x={537} y={182} size={11} bold fill={C.amber}>รวม 28 core license (ตัวอย่าง)</T>
      <T x={537} y={200} size={10} fill={C.sub}>มักแพงกว่า host licensing เมื่อมี VM จำนวนมาก</T>
    </Frame>
  );
}

// 4) Hybrid: on-prem + Azure with AHB
export function HybridDiagram() {
  return (
    <Frame w={720} h={260} title="Hybrid licensing with Azure Hybrid Benefit">
      <Box x={20} y={30} w={290} h={210} fill="#fff" stroke={C.blue} />
      <T x={165} y={52} bold>On-premises</T>
      <Host x={55} y={64} w={220} label="Host 16 core + SA" sockets={1} cores={16} vms={["VM Windows Server"]} />

      <Box x={410} y={30} w={290} h={210} fill="#fff" stroke={C.green} />
      <T x={555} y={52} bold>Azure</T>
      <Box x={440} y={64} w={230} h={80} fill={C.greenLight} stroke={C.green} />
      <T x={555} y={86} bold size={12}>Azure VM (Windows Server)</T>
      <T x={555} y={106} size={10}>จ่ายเฉพาะ compute (base rate)</T>
      <T x={555} y={122} size={10}>ไม่จ่ายค่า Windows license ซ้ำ</T>

      <Arrow x1={310} y1={104} x2={408} y2={104} color={C.amber} />
      <T x={359} y={94} size={10} fill={C.amber} bold>AHB</T>

      <T x={555} y={170} size={11} bold>เงื่อนไขหลัก</T>
      <T x={555} y={188} size={10}>• ต้องมี SA หรือ Subscription ที่ active</T>
      <T x={555} y={203} size={10}>• ขั้นต่ำ 8 core license ต่อ VM</T>
      <T x={555} y={218} size={10}>• Standard: ใช้ on-prem + Azure พร้อมกันไม่ได้</T>
    </Frame>
  );
}

// 5) vMotion cluster
export function VMotionDiagram() {
  return (
    <Frame w={720} h={290} title="vMotion cluster licensing">
      <T x={360} y={22} bold size={14}>VM ย้ายได้ทุก host ใน cluster → ทุก host ต้อง license ให้ครอบคลุม</T>
      <Host x={30} y={38} w={200} label="ESXi-01 (32 core)" sockets={2} cores={16} vms={["VM-A", "VM-B"]} />
      <Host x={260} y={38} w={200} label="ESXi-02 (32 core)" sockets={2} cores={16} vms={["VM-C"]} />
      <Host x={490} y={38} w={200} label="ESXi-03 (32 core)" sockets={2} cores={16} vms={[]} />
      <Arrow x1={230} y1={118} x2={258} y2={118} color={C.amber} dash />
      <Arrow x1={460} y1={118} x2={488} y2={118} color={C.amber} dash />
      <T x={244} y={110} size={9} fill={C.amber} bold>vMotion</T>
      <Box x={30} y={190} w={660} h={85} fill={C.amberLight} stroke={C.amber} dash />
      <T x={360} y={212} bold size={12}>Datacenter ทุก host: 3 × 32 = 96 core license → VM กี่ตัวก็ได้ ย้ายได้อิสระ</T>
      <T x={360} y={234} size={11}>Standard: ต้อง “stack” ให้ครอบคลุมจำนวน VM สูงสุดที่ อาจ อยู่บน host ใด host หนึ่ง</T>
      <T x={360} y={252} size={11}>เช่น 10 VM บน host 32 core = 5 ชุด × 32 = 160 core ต่อ host (ยิ่ง cluster ใหญ่ยิ่งแพง)</T>
      <T x={360} y={268} size={10} fill={C.sub}>ย้าย license ระหว่างเซิร์ฟเวอร์ถาวรได้ไม่เกิน 1 ครั้งใน 90 วัน (ตรวจ Product Terms)</T>
    </Frame>
  );
}

// 6) HA failover
export function HaDiagram() {
  return (
    <Frame w={720} h={250} title="High availability host licensing">
      <T x={360} y={22} bold size={14}>HA / Failover Cluster: host สำรองต้องมี license ด้วย</T>
      <Host x={50} y={38} w={200} label="Active host" sockets={2} cores={16} vms={["VM-1", "VM-2"]} />
      <Host x={470} y={38} w={200} label="Standby host (N+1)" sockets={2} cores={16} vms={[]} />
      <Arrow x1={252} y1={90} x2={468} y2={90} color={C.red} dash />
      <T x={360} y={80} size={10} fill={C.red} bold>failover เมื่อ host ล่ม</T>
      <Box x={290} y={110} w={140} h={70} fill={C.redLight} stroke={C.red} />
      <T x={360} y={132} size={11} bold fill={C.red}>ไม่มีสิทธิ์ passive</T>
      <T x={360} y={148} size={10}>Windows Server on-prem</T>
      <T x={360} y={162} size={10}>ไม่มี “free standby”</T>
      <T x={360} y={206} size={12} bold>จำนวน core license = (Active + Standby) × 32 = 64 core</T>
      <T x={360} y={226} size={10} fill={C.sub}>ต่างจาก SQL Server ที่ SA ให้สิทธิ์ passive failover node 1 ตัว</T>
    </Frame>
  );
}

// 7) DR
export function DrDiagram() {
  return (
    <Frame w={720} h={290} title="Disaster recovery licensing options">
      <T x={360} y={22} bold size={14}>DR: เลือกได้ 2 แบบ</T>
      <Box x={20} y={36} w={340} h={240} fill="#fff" stroke={C.blue} />
      <T x={190} y={58} bold>A) DR Site on-prem</T>
      <Box x={40} y={70} w={130} h={120} fill={C.blueLight} stroke={C.blue} />
      <T x={105} y={92} bold size={11}>Primary</T>
      <T x={105} y={110} size={10}>Host 32 core</T>
      <T x={105} y={126} size={10}>ซื้อ license</T>
      <Box x={210} y={70} w={130} h={120} fill={C.blueLight} stroke={C.blue} />
      <T x={275} y={92} bold size={11}>DR Site</T>
      <T x={275} y={110} size={10}>Host 32 core</T>
      <T x={275} y={126} size={10}>ซื้อ license อีกชุด</T>
      <Arrow x1={170} y1={130} x2={208} y2={130} color={C.blue} dash />
      <T x={190} y={220} size={11} bold fill={C.blue}>รวม 64 core license</T>
      <T x={190} y={238} size={10} fill={C.sub}>ห้ามถือว่า host DR ใช้ฟรี แม้ไม่รัน VM ปกติ</T>
      <T x={190} y={254} size={10} fill={C.sub}>(ตรวจ Product Terms/สิทธิ์ SA ของ workload นั้น ๆ)</T>

      <Box x={380} y={36} w={320} h={240} fill="#fff" stroke={C.green} />
      <T x={540} y={58} bold>B) DR ไป Azure (ASR + AHB)</T>
      <Box x={395} y={70} w={130} h={120} fill={C.blueLight} stroke={C.blue} />
      <T x={460} y={92} bold size={11}>Primary on-prem</T>
      <T x={460} y={110} size={10}>Host 32 core + SA</T>
      <Box x={555} y={70} w={130} h={120} fill={C.greenLight} stroke={C.green} />
      <T x={620} y={92} bold size={11}>Azure DR VMs</T>
      <T x={620} y={110} size={10}>ASR replicate</T>
      <T x={620} y={126} size={10}>AHB ลดค่า OS</T>
      <Arrow x1={525} y1={130} x2={553} y2={130} color={C.green} dash />
      <T x={540} y={220} size={11} bold fill={C.green}>ไม่ต้องซื้อ host DR เอง</T>
      <T x={540} y={238} size={10} fill={C.sub}>จ่ายค่า Azure ตามการใช้งานจริง + ต้องมี SA/Subscription เพื่อใช้ AHB</T>
    </Frame>
  );
}

// 8) CAL model
export function CalDiagram() {
  return (
    <Frame w={720} h={250} title="CAL concept">
      <T x={360} y={22} bold size={14}>Server License ≠ CAL: ต้องซื้อทั้งสองอย่าง</T>
      <Box x={20} y={40} w={150} h={150} fill={C.blueLight} stroke={C.blue} />
      <T x={95} y={64} bold>Users</T>
      <T x={95} y={86} size={10}>User CAL: 1 user ใช้</T>
      <T x={95} y={100} size={10}>ได้หลายอุปกรณ์</T>
      <T x={95} y={130} bold>Devices</T>
      <T x={95} y={152} size={10}>Device CAL: 1 device</T>
      <T x={95} y={166} size={10}>ใช้ได้หลาย user (เช่น shift)</T>
      <Arrow x1={172} y1={115} x2={278} y2={115} color={C.blue} />
      <Box x={280} y={60} w={160} h={110} fill={C.greenLight} stroke={C.green} />
      <T x={360} y={90} bold>Windows Server</T>
      <T x={360} y={108} size={10}>Core license</T>
      <T x={360} y={122} size={10}>(อ่าน “Physical”)</T>
      <T x={360} y={150} size={10} fill={C.sub}>+ CAL ของผู้เข้าถึง</T>
      <Arrow x1={442} y1={115} x2={538} y2={115} color={C.amber} />
      <Box x={540} y={40} w={160} h={150} fill={C.amberLight} stroke={C.amber} />
      <T x={620} y={64} bold>CAL เพิ่มเติม</T>
      <T x={620} y={90} size={10}>Windows Server CAL</T>
      <T x={620} y={108} size={10}>RDS CAL (Remote Desktop)</T>
      <T x={620} y={126} size={10}>Exchange Std/Ent CAL</T>
      <T x={620} y={144} size={10}>SQL CAL (ถ้าไม่ใช้ core)</T>
      <T x={360} y={222} size={11} bold>CAL ไม่ผูกกับจำนวน VM หรือ core — นับ “คน/อุปกรณ์” ที่เข้าถึง</T>
    </Frame>
  );
}

// 9) Exchange DAG
export function ExchangeDagDiagram() {
  return (
    <Frame w={720} h={290} title="Exchange DAG licensing">
      <T x={360} y={22} bold size={14}>Exchange: License ต่อ “server” (physical หรือ VM) + CAL ต่อ user/device</T>
      <Box x={20} y={38} w={680} h={150} fill="#fff" stroke={C.blue} dash />
      <T x={360} y={58} bold size={11} fill={C.blue}>DAG (สูงสุด 16 member)</T>
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <Box x={50 + i * 220} y={70} w={190} h={100} fill={C.blueLight} stroke={C.blue} />
          <T x={145 + i * 220} y={92} bold size={12}>{`EXCH-0${i + 1}`}</T>
          <T x={145 + i * 220} y={110} size={10}>{["Mailbox (Active DB)", "Mailbox (Copy)", "Mailbox (DR site)"][i]}</T>
          <T x={145 + i * 220} y={130} size={10} bold fill={C.blue}>Server license ×1</T>
          <T x={145 + i * 220} y={148} size={10} fill={C.sub}>Standard หรือ Enterprise</T>
        </g>
      ))}
      <Box x={20} y={205} w={680} h={72} fill={C.amberLight} stroke={C.amber} />
      <T x={360} y={226} bold size={12}>ทุก DAG member ต้องมี server license — รวม DR/copy ที่ passive</T>
      <T x={360} y={246} size={11}>3 servers = 3 Server License + CAL ตามจำนวน user/device ที่ใช้ mailbox</T>
      <T x={360} y={264} size={10} fill={C.sub}>Standard CAL + Enterprise CAL (ฟีเจอร์เพิ่ม) = ซื้อเพิ่มทับกัน ไม่ใช่แทนกัน</T>
    </Frame>
  );
}

// 10) Exchange hybrid
export function ExchangeHybridDiagram() {
  return (
    <Frame w={720} h={240} title="Exchange hybrid">
      <Box x={20} y={30} w={290} h={190} fill="#fff" stroke={C.blue} />
      <T x={165} y={52} bold>On-prem Exchange</T>
      <Box x={50} y={66} w={230} h={60} fill={C.blueLight} stroke={C.blue} />
      <T x={165} y={90} bold size={11}>Hybrid server</T>
      <T x={165} y={108} size={10}>ต้องมี Server License + CAL</T>
      <T x={165} y={152} size={10}>2016/2019: end of support 14 ต.ค. 2025</T>
      <T x={165} y={170} size={10}>Exchange SE: ต้องมี SA ของ 2019</T>
      <T x={165} y={186} size={10}>หรือ M365 E3/E5 ที่เข้าเงื่อนไข</T>

      <Box x={410} y={30} w={290} h={190} fill="#fff" stroke={C.green} />
      <T x={555} y={52} bold>Exchange Online (M365)</T>
      <Box x={440} y={66} w={230} h={60} fill={C.greenLight} stroke={C.green} />
      <T x={555} y={90} bold size={11}>Mailbox ใน cloud</T>
      <T x={555} y={108} size={10}>ใช้สิทธิ์ใน Subscription (ไม่ต้องใช้ CAL)</T>
      <Arrow x1={312} y1={96} x2={408} y2={96} color={C.amber} />
      <T x={360} y={86} size={9} fill={C.amber} bold>Hybrid</T>
      <T x={555} y={152} size={10}>Mailbox ที่ย้ายขึ้น cloud ไม่นับ CAL on-prem</T>
      <T x={555} y={170} size={10}>Server hybrid แบบ management-tools เท่านั้น</T>
      <T x={555} y={186} size={10}>อาจไม่ต้องมี server license (ตรวจกับ Microsoft)</T>
    </Frame>
  );
}

// 11) Windows client
export function WindowsClientDiagram() {
  return (
    <Frame w={720} h={230} title="Windows client licensing paths">
      <T x={360} y={22} bold size={14}>Windows 11 (client): ติดมากับเครื่อง หรือ ซื้อ upgrade ตามสิทธิ์</T>
      {[
        { x: 20, t: "OEM / Pro", l1: "ติดมากับเครื่องใหม่", l2: "ผูกกับเครื่อง — ย้ายไม่ได้", c: C.gray, s: C.line },
        { x: 190, t: "Volume (Pro→Ent)", l1: "Enterprise Upgrade (SA)", l2: "ต้องมี Pro ที่ถูกต้องก่อน", c: C.blueLight, s: C.blue },
        { x: 360, t: "M365 E3/E5/F3", l1: "Windows Ent E3/E5 ต่อ user", l2: "ใช้ได้ถึง 5 devices/user", c: C.greenLight, s: C.green },
        { x: 530, t: "Windows 365 / VDA", l1: "VDI/Cloud PC", l2: "VDA ต่อ device สำหรับ VDI", c: C.amberLight, s: C.amber },
      ].map((e) => (
        <g key={e.t}>
          <Box x={e.x} y={44} w={165} h={110} fill={e.c} stroke={e.s} />
          <T x={e.x + 82} y={68} bold size={12}>{e.t}</T>
          <T x={e.x + 82} y={94} size={10}>{e.l1}</T>
          <T x={e.x + 82} y={112} size={10} fill={C.sub}>{e.l2}</T>
        </g>
      ))}
      <T x={360} y={185} size={11} bold>Windows 10 สิ้นสุด support 14 ต.ค. 2025 → วางแผน upgrade หรือซื้อ ESU</T>
      <T x={360} y={205} size={10} fill={C.sub}>Windows 11 ต้องการ TPM 2.0, Secure Boot, CPU ที่รองรับ — ดูหน้า Quick Assessment</T>
    </Frame>
  );
}

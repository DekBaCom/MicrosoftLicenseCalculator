import { useState } from "react";
import { BookOpenCheck, Server, Monitor, Boxes, Copy, Check } from "lucide-react";
import { PageHeader } from "../components/common/PageHeader";
import { Disclaimer } from "../components/common/Disclaimer";

type Tab = "vmware" | "hyperv" | "nutanix";

export default function DataCollection() {
  const [tab, setTab] = useState<Tab>("vmware");

  return (
    <>
      <PageHeader
        title="วิธีเก็บข้อมูล Host เพื่อคำนวณ License"
        subtitle="How to collect host inventory data (VMware / Hyper-V / Nutanix) for licensing calculation"
        icon={<BookOpenCheck className="w-5 h-5" />}
      />

      <div className="card p-4 mb-4">
        <h3 className="font-semibold text-slate-900 mb-2">ข้อมูลที่ต้องเก็บจากทุก Host</h3>
        <p className="text-sm text-slate-600 mb-3">
          ก่อนเริ่ม แนะนำให้เตรียม Excel ไว้ 1 ชีท และเก็บฟิลด์เหล่านี้สำหรับ <b>ทุก physical host</b> ที่รัน
          Windows / SQL / Exchange:
        </p>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="table min-w-[800px]">
            <thead>
              <tr>
                <th>ฟิลด์</th>
                <th>ตัวอย่าง</th>
                <th>ใช้คำนวณอะไร</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Server Name</td><td>HV-HOST01</td><td>อ้างอิง</td></tr>
              <tr><td>Type</td><td>Physical / VM</td><td>แยก host กับ guest</td></tr>
              <tr><td>CPU Sockets</td><td>2</td><td>Min 2 processors/server</td></tr>
              <tr><td>Cores per CPU</td><td>16</td><td>Min 8 cores/processor</td></tr>
              <tr><td>Total Physical Cores</td><td>32</td><td>License per core (Windows/SQL)</td></tr>
              <tr><td>Windows / SQL Version + Edition</td><td>Windows Server 2022 Datacenter</td><td>Edition rules</td></tr>
              <tr><td>VM Count on this host</td><td>12</td><td>Standard VM-rights stacking / DC breakpoint</td></tr>
              <tr><td>HA / Cluster</td><td>Yes</td><td>Passive-failover benefit (SA)</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-thin">
        <TabBtn active={tab === "vmware"} onClick={() => setTab("vmware")} icon={<Server className="w-4 h-4" />}>VMware vSphere / ESXi</TabBtn>
        <TabBtn active={tab === "hyperv"} onClick={() => setTab("hyperv")} icon={<Monitor className="w-4 h-4" />}>Microsoft Hyper-V</TabBtn>
        <TabBtn active={tab === "nutanix"} onClick={() => setTab("nutanix")} icon={<Boxes className="w-4 h-4" />}>Nutanix (AHV / Prism)</TabBtn>
      </div>

      {tab === "vmware" && <VMwareGuide />}
      {tab === "hyperv" && <HyperVGuide />}
      {tab === "nutanix" && <NutanixGuide />}

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

// =========================== VMware ===========================

function VMwareGuide() {
  return (
    <>
      <Step n={1} title="Login เข้า vCenter Server">
        <p>เปิดเบราว์เซอร์ไปที่ <Code>https://&lt;vcenter-fqdn&gt;/ui</Code> แล้ว login ด้วย administrator@vsphere.local หรือบัญชี AD ที่มีสิทธิ์</p>
        <Mockup title="vSphere Client (HTML5)">{`
┌─────────────────────────────────────────────────────┐
│ vmware vSphere Client            [Menu▾]  user ▾   │
├─────────────────────────────────────────────────────┤
│ [🏠 Home]  [📊 Shortcuts]  [📁 Hosts and Clusters] │
└─────────────────────────────────────────────────────┘
`}</Mockup>
        <ImageSlot src="guides/vmware/01-login.png" caption="vSphere Client login" />
      </Step>

      <Step n={2} title="ไปที่ Inventory → Hosts and Clusters">
        <p>คลิกเมนู <b>Menu</b> → <b>Hosts and Clusters</b> หรือใช้ shortcut (Ctrl+Alt+2)</p>
        <Mockup title="Left Inventory Tree">{`
▾ vCenter-01.corp.local
  ▾ Datacenter-HQ
    ▾ Cluster-PROD
      ■ esxi-01.corp.local   ← คลิกเลือก host
      ■ esxi-02.corp.local
      ■ esxi-03.corp.local
`}</Mockup>
      </Step>

      <Step n={3} title="ดูข้อมูล CPU จาก Summary tab">
        <p>เมื่อเลือก host แล้ว แท็บ <b>Summary</b> จะแสดง:</p>
        <ul className="list-disc pl-5 text-sm space-y-1">
          <li><b>Hardware → CPU</b>: <Code>2x Intel Xeon Gold 6338 @ 2.00GHz</Code> (= 2 sockets)</li>
          <li><b>CPU Cores</b>: <Code>64 CPUs × 2 GHz</Code> (รวม cores ทั้ง host — หารด้วย sockets ได้ cores/CPU)</li>
          <li><b>Virtual Machines</b>: จำนวน VMs ที่ host นี้รัน</li>
        </ul>
        <Mockup title="Summary → Hardware panel">{`
┌─ Hardware ─────────────────────────┐
│ Manufacturer   Dell Inc.           │
│ Model          PowerEdge R750       │
│ Processor Type Intel Xeon Gold 6338 │
│ CPU            2 Sockets, 64 Cores │  ← 2 sockets × 32 cores
│ Logical Procs  128                   │
│ NICs           4                     │
│ Virtual Machines   24                │  ← VM count
└─────────────────────────────────────┘
`}</Mockup>
        <ImageSlot src="guides/vmware/03-summary.png" caption="vSphere Host Summary (Hardware panel)" />
      </Step>

      <Step n={4} title="ดูรายละเอียดเพิ่ม: Configure → Hardware → Processors">
        <p>เพื่อยืนยัน cores/CPU กดแท็บ <b>Configure</b> → <b>Hardware</b> → <b>Processors</b></p>
        <Mockup title="Configure → Processors">{`
┌─ Processors ─────────────────────────────────┐
│ General                                       │
│   Model          Intel Xeon Gold 6338        │
│   Processor Sockets      2                   │  ← CPU Sockets
│   Cores per Socket       32                  │  ← Cores per CPU
│   Logical Processors     128                 │
│   Hyperthreading         Active              │
└───────────────────────────────────────────────┘
`}</Mockup>
        <ImageSlot src="guides/vmware/04-processors.png" caption="Host → Configure → Processors" />
      </Step>

      <Step n={5} title="(เร็วกว่า) ใช้ PowerCLI ดึงข้อมูลทุก host รวดเดียว">
        <p>หากมี host หลายตัว แนะนำใช้ PowerCLI จะได้ CSV พร้อมใช้งาน:</p>
        <CodeBlock lang="powershell">{`# ติดตั้ง (ครั้งแรกเท่านั้น)
Install-Module VMware.PowerCLI -Scope CurrentUser

# เชื่อมต่อ
Connect-VIServer vcenter-01.corp.local

# ดึงข้อมูล CPU / VM ของทุก host
Get-VMHost | ForEach-Object {
  $cpu = $_.ExtensionData.Hardware.CpuInfo
  [PSCustomObject]@{
    Name           = $_.Name
    Sockets        = $cpu.NumCpuPackages
    CoresPerCPU    = $cpu.NumCpuCores / $cpu.NumCpuPackages
    TotalCores     = $cpu.NumCpuCores
    VMCount        = (Get-VM -Location $_).Count
    Version        = $_.Version
  }
} | Export-Csv vmware_hosts.csv -NoTypeInformation`}</CodeBlock>
        <p className="text-xs text-slate-500">ไฟล์ <Code>vmware_hosts.csv</Code> นำไปกรอกใน "Windows Server inventory" ของ wizard ได้โดยตรง</p>
      </Step>

      <Step n={6} title="กรอกข้อมูลเข้า Calculator">
        <p>ไปที่ <b>New Assessment → Step 3: Windows Server</b> แล้วกด <b>+ Add Server</b> ใส่ค่า:</p>
        <table className="table mt-2">
          <thead><tr><th>ฟิลด์ใน Calculator</th><th>ค่าจาก vSphere</th></tr></thead>
          <tbody>
            <tr><td>Name</td><td>Host name จาก Inventory tree</td></tr>
            <tr><td>Type</td><td>Physical</td></tr>
            <tr><td>Sockets</td><td>Processor Sockets</td></tr>
            <tr><td>Cores/CPU</td><td>Cores per Socket</td></tr>
            <tr><td>VMs</td><td>Virtual Machines count</td></tr>
            <tr><td>Edition</td><td>Datacenter (ถ้ารัน Windows VMs หลายตัว) / Standard</td></tr>
            <tr><td>HA</td><td>Yes ถ้าอยู่ใน Cluster ที่เปิด vSphere HA</td></tr>
          </tbody>
        </table>
      </Step>
    </>
  );
}

// =========================== Hyper-V ===========================

function HyperVGuide() {
  return (
    <>
      <Step n={1} title="เปิด Hyper-V Manager">
        <p>บน Windows Server host: <b>Server Manager → Tools → Hyper-V Manager</b></p>
        <Mockup title="Hyper-V Manager">{`
┌─────────────────────────────────────────────────────┐
│ Hyper-V Manager                                     │
├────────────────┬────────────────────────────────────┤
│ Hyper-V Manager│ Virtual Machines                   │
│ ▶ HV-HOST01    │ ┌──────────────┬────────┬───────┐ │
│ ▶ HV-HOST02    │ │ Name         │ State  │ CPU%  │ │
│                │ │ VM-APP01     │ Running│ 4%    │ │
│                │ │ VM-DC01      │ Running│ 1%    │ │
│                │ │ VM-SQL01     │ Running│ 22%   │ │
│                │ └──────────────┴────────┴───────┘ │
└────────────────┴────────────────────────────────────┘
`}</Mockup>
        <ImageSlot src="guides/hyperv/01-manager.png" caption="Hyper-V Manager main window" />
      </Step>

      <Step n={2} title="(ทางเร็ว) ใช้ PowerShell บน host">
        <p>เปิด PowerShell <b>Run as Administrator</b> แล้วรัน:</p>
        <CodeBlock lang="powershell">{`# ----- CPU & Cores -----
$cpus = Get-CimInstance Win32_Processor
"Hostname     : $env:COMPUTERNAME"
"CPU Sockets  : $($cpus.Count)"
"Cores/CPU    : $($cpus[0].NumberOfCores)"
"Total Cores  : $(($cpus | Measure-Object NumberOfCores -Sum).Sum)"
"Logical CPUs : $(($cpus | Measure-Object NumberOfLogicalProcessors -Sum).Sum)"

# ----- Windows Edition -----
Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion, OsName

# ----- จำนวน VM บน host นี้ -----
Get-VM | Group-Object State | Select Count, Name
Get-VM | Select VMName, State, ProcessorCount, MemoryStartup, @{N='GuestOS';E={$_.Guest.OperatingSystem}}`}</CodeBlock>
        <CodeBlock lang="powershell">{`# ----- Cluster นี้มี host กี่ตัว + VM รวมเท่าไร -----
Get-ClusterNode | ForEach-Object {
  $node = $_.Name
  $vms  = Get-VM -ComputerName $node
  [PSCustomObject]@{
    Host     = $node
    Sockets  = (Get-CimInstance Win32_Processor -ComputerName $node).Count
    Cores    = ((Get-CimInstance Win32_Processor -ComputerName $node) | Measure-Object NumberOfCores -Sum).Sum
    VMCount  = $vms.Count
    Version  = (Get-CimInstance Win32_OperatingSystem -ComputerName $node).Caption
  }
} | Export-Csv hyperv_hosts.csv -NoTypeInformation`}</CodeBlock>
      </Step>

      <Step n={3} title="ดูผ่าน Windows Admin Center (ถ้ามี)">
        <p>เปิด <Code>https://&lt;WAC-URL&gt;</Code> → All connections → เลือก Hyper-V host → <b>Overview</b></p>
        <Mockup title="WAC → Hyper-V Overview">{`
┌─ Overview ─────────────────────────────────────┐
│ Computer name    HV-HOST01                     │
│ OS               Windows Server 2022 DC        │
│ Processors       Intel Xeon Gold 6338          │
│ CPU sockets      2                             │
│ CPU cores        32                            │
│ Logical procs    64                            │
│ Virtual machines 18                            │
└─────────────────────────────────────────────────┘
`}</Mockup>
        <ImageSlot src="guides/hyperv/03-wac.png" caption="Windows Admin Center → Server Overview" />
      </Step>

      <Step n={4} title="ดูผ่าน SCVMM (ถ้าใช้ System Center)">
        <p><b>VMM Console → VMs and Services → All Hosts</b> → คลิกขวา host → <b>Properties → Hardware</b></p>
        <ImageSlot src="guides/hyperv/04-scvmm.png" caption="SCVMM Host Properties → Hardware" />
      </Step>

      <Step n={5} title="กรอกเข้า Calculator">
        <table className="table mt-2">
          <thead><tr><th>Calculator</th><th>Hyper-V source</th></tr></thead>
          <tbody>
            <tr><td>Name</td><td><Code>$env:COMPUTERNAME</Code></td></tr>
            <tr><td>Type</td><td>Physical</td></tr>
            <tr><td>Sockets</td><td><Code>Win32_Processor.Count</Code></td></tr>
            <tr><td>Cores/CPU</td><td><Code>Win32_Processor[0].NumberOfCores</Code></td></tr>
            <tr><td>VMs</td><td><Code>(Get-VM).Count</Code></td></tr>
            <tr><td>Edition</td><td>WindowsProductName (Datacenter/Standard)</td></tr>
          </tbody>
        </table>
      </Step>
    </>
  );
}

// =========================== Nutanix ===========================

function NutanixGuide() {
  return (
    <>
      <Step n={1} title="Login เข้า Prism Element (per-cluster)">
        <p>เปิด <Code>https://&lt;CVM-IP&gt;:9440</Code> (หรือ Prism Central ถ้ามีหลาย cluster)</p>
        <Mockup title="Prism Element">{`
┌─────────────────────────────────────────────────────┐
│ nutanix PRISM   Home ▾   admin ▾                   │
├─────────────────────────────────────────────────────┤
│ [🏠 Home] [⚙ Settings] [💻 VM] [🖥 Hardware] [📊] │
└─────────────────────────────────────────────────────┘
`}</Mockup>
        <ImageSlot src="guides/nutanix/01-prism.png" caption="Prism Element home" />
      </Step>

      <Step n={2} title="ไปที่ Hardware → Table view">
        <p>คลิกเมนู <b>Hardware</b> จะเห็น list ของ hosts ใน cluster</p>
        <Mockup title="Hardware → Hosts">{`
┌─ Hardware ─ Hosts ─ Table ──────────────────────┐
│ Host name      CPU model        Sockets  Cores  │
│ NTNX-HOST-01   Xeon Gold 6330   2        56     │
│ NTNX-HOST-02   Xeon Gold 6330   2        56     │
│ NTNX-HOST-03   Xeon Gold 6330   2        56     │
└──────────────────────────────────────────────────┘
`}</Mockup>
        <ImageSlot src="guides/nutanix/02-hardware.png" caption="Prism → Hardware → Hosts" />
      </Step>

      <Step n={3} title="เลือก Host → Details panel">
        <p>คลิก host ชื่อหนึ่ง จะได้ details ด้านขวา:</p>
        <Mockup title="Host Details">{`
┌─ NTNX-HOST-01 ──────────────────────────────────┐
│ Serial            ABC123                        │
│ Model             NX-3170-G8                    │
│ Hypervisor        AHV 20220304.420             │
│ CPU Model         Intel Xeon Gold 6330          │
│ CPU Sockets       2                             │  ← Sockets
│ CPU Cores         56                            │  ← Total cores (28 cores/socket)
│ CPU Capacity      128 GHz                       │
│ Memory            768 GiB                       │
│ Number of VMs     23                            │  ← VM count
└──────────────────────────────────────────────────┘
`}</Mockup>
        <ImageSlot src="guides/nutanix/03-host-details.png" caption="Host details panel in Prism" />
      </Step>

      <Step n={4} title="(เร็วกว่า) ใช้ ncli / acli จาก CVM">
        <p>SSH เข้า Controller VM (CVM) ด้วย <Code>nutanix@&lt;CVM-IP&gt;</Code>:</p>
        <CodeBlock lang="bash">{`# ===== ncli: list ของ hosts =====
ncli host list

# รายละเอียด
ncli host ls

# Cluster info (เห็น total nodes + VM count)
ncli cluster info

# ===== acli (AHV only): list VMs =====
acli host.list
acli vm.list

# นับ VM ต่อ host (ทำบน CVM)
for h in $(acli host.list | awk 'NR>1 {print $1}'); do
  cnt=$(acli vm.list host=$h 2>/dev/null | wc -l)
  echo "$h  $cnt VMs"
done`}</CodeBlock>
      </Step>

      <Step n={5} title="(หากใช้ ESXi บน Nutanix)">
        <p>ถ้า hypervisor เป็น <b>ESXi</b> (ไม่ใช่ AHV) ให้ย้อนไปอ่าน tab <b>VMware vSphere / ESXi</b> แทน — Nutanix ทำหน้าที่เป็น storage/infrastructure เท่านั้น การ licensing Windows จะคำนวณที่ ESXi hypervisor</p>
      </Step>

      <Step n={6} title="กรอกเข้า Calculator">
        <table className="table mt-2">
          <thead><tr><th>Calculator</th><th>Nutanix source</th></tr></thead>
          <tbody>
            <tr><td>Name</td><td>Host name (NTNX-HOST-XX)</td></tr>
            <tr><td>Type</td><td>Physical</td></tr>
            <tr><td>Sockets</td><td>CPU Sockets</td></tr>
            <tr><td>Cores/CPU</td><td>CPU Cores ÷ Sockets</td></tr>
            <tr><td>VMs</td><td>Number of VMs</td></tr>
            <tr><td>Edition</td><td>ดูจาก Windows Server ของ guest VM (Datacenter แนะนำถ้า &gt; 8 Windows VMs)</td></tr>
            <tr><td>HA</td><td>Yes (Nutanix VM HA default on)</td></tr>
          </tbody>
        </table>
      </Step>
    </>
  );
}

// =========================== Helpers ===========================

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="card p-4 mb-3">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-brand-700 text-white flex items-center justify-center font-semibold flex-shrink-0">
          {n}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
          <div className="space-y-2 text-sm text-slate-700">{children}</div>
        </div>
      </div>
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono text-slate-800">{children}</code>;
}

function CodeBlock({ children, lang }: { children: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative">
      {lang && <div className="absolute top-2 right-2 text-[10px] uppercase tracking-wider text-slate-400">{lang}</div>}
      <button
        onClick={() => {
          navigator.clipboard.writeText(children);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="absolute top-8 right-2 p-1.5 rounded bg-slate-700 hover:bg-slate-600 text-white text-xs"
        title="Copy"
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
      <pre className="bg-slate-900 text-slate-100 text-xs p-3 pt-6 rounded-lg overflow-x-auto scrollbar-thin font-mono leading-relaxed whitespace-pre">{children}</pre>
    </div>
  );
}

function Mockup({ title, children }: { title: string; children: string }) {
  return (
    <div>
      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
        {title}
      </div>
      <pre className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] font-mono text-slate-700 overflow-x-auto scrollbar-thin whitespace-pre leading-snug">{children}</pre>
    </div>
  );
}

function ImageSlot({ src, caption }: { src: string; caption: string }) {
  // Image placeholder — drop a PNG at public/<src> and it will render.
  const base = import.meta.env.BASE_URL;
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center text-xs text-slate-500 bg-slate-50 mt-2">
        📷 Screenshot placeholder — drop image at <Code>public/{src}</Code> to replace this box.<br />
        <span className="italic">{caption}</span>
      </div>
    );
  }
  return (
    <figure className="mt-2">
      <img
        src={`${base}${src}`}
        alt={caption}
        className="rounded-lg border border-slate-200 max-w-full"
        onError={() => setFailed(true)}
      />
      <figcaption className="text-xs text-slate-500 mt-1">{caption}</figcaption>
    </figure>
  );
}

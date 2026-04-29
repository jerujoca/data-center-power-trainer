"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Power,
  Zap,
  Battery,
  Server,
  GitBranch,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

type ModuleStatus = "energized" | "transfer" | "failed" | "deenergized";
type StsSource = "A" | "B" | "AUTO";

type ModuleItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  lesson: string;
};

type FaultState = {
  utilityAOpen: boolean;
  utilityBOpen: boolean;
  genAFailed: boolean;
  genBFailed: boolean;
  upsAFailed: boolean;
  upsBFailed: boolean;
  stsFailed: boolean;
  pduACb1Open: boolean;
  pduACb2Open: boolean;
  pduBCb1Open: boolean;
  pduBCb2Open: boolean;
  rpp1Open: boolean;
  rpp2Open: boolean;
  rpp3Open: boolean;
  rpp4Open: boolean;
};

type PathState = {
  utility: boolean;
  generator: boolean;
  source: boolean;
  ups: boolean;
  status: ModuleStatus;
};

type SystemState = {
  pathA: PathState;
  pathB: PathState;
  stsA: boolean;
  stsB: boolean;
  selectedSource: "A" | "B" | "NONE";
  pduA: boolean;
  pduB: boolean;
  rpp1: boolean;
  rpp2: boolean;
  rpp3: boolean;
  rpp4: boolean;
  serverRow1: boolean;
  serverRow2: boolean;
  loadOnline: boolean;
};

const MODULES: ModuleItem[] = [
  {
    id: "utility",
    label: "Utility / Transformer",
    icon: Zap,
    lesson:
      "In this trainer, utility power feeds each service path. In Tier IV, Path A and Path B are shown as separate utility/service paths.",
  },
  {
    id: "ses",
    label: "SES A / SES B",
    icon: GitBranch,
    lesson:
      "The Service Entrance Sections receive utility power and distribute it toward generators, UPS systems, and downstream loads. In Tier IV, A and B paths stay independent.",
  },
  {
    id: "gsb",
    label: "GEN A / GEN B",
    icon: RotateCcw,
    lesson:
      "The generator switchboard side supports the path when utility fails. In this simplified app, generator power becomes available when utility is open unless that generator is failed.",
  },
  {
    id: "ups",
    label: "UPS A / UPS B",
    icon: Battery,
    lesson:
      "Each UPS supports its source path and keeps the load alive while transferring from utility to generator power.",
  },
  {
    id: "sts",
    label: "STS",
    icon: GitBranch,
    lesson:
      "The Static Transfer Switch chooses Source A or Source B. In AUTO, it prefers Source A when available and transfers to Source B if A is unavailable.",
  },
  {
    id: "pdu",
    label: "PDU A / PDU B",
    icon: Power,
    lesson:
      "PDU-A and PDU-B distribute power into branch circuits. PDU-A feeds RPP1 and RPP2. PDU-B feeds RPP3 and RPP4.",
  },
  {
    id: "rpp",
    label: "RPP1 - RPP4",
    icon: GitBranch,
    lesson:
      "RPP1 and RPP2 support Server Row 1. RPP3 and RPP4 support Server Row 2. Each RPP can be opened to simulate a branch failure.",
  },
  {
    id: "servers",
    label: "Server Rows",
    icon: Server,
    lesson:
      "Server Row 1 is supported by RPP1/RPP2. Server Row 2 is supported by RPP3/RPP4. A row remains online if at least one of its assigned RPPs is energized.",
  },
];

const tierDescriptions: Record<number, string> = {
  1: "Tier I: Single power path. Only Path A is used.",
  2: "Tier II: Single distribution path with redundant generator support shown.",
  3: "Tier III: A maintainable design concept. This simplified trainer shows A/B source support through the STS.",
  4: "Tier IV: Two independent A/B paths with dual downstream distribution and fault-tolerant server support.",
};

const defaultFaults: FaultState = {
  utilityAOpen: false,
  utilityBOpen: false,
  genAFailed: false,
  genBFailed: false,
  upsAFailed: false,
  upsBFailed: false,
  stsFailed: false,
  pduACb1Open: false,
  pduACb2Open: false,
  pduBCb1Open: false,
  pduBCb2Open: false,
  rpp1Open: false,
  rpp2Open: false,
  rpp3Open: false,
  rpp4Open: false,
};

function statusColor(status: ModuleStatus) {
  if (status === "energized") return "bg-emerald-500 border-emerald-700 text-white";
  if (status === "transfer") return "bg-yellow-400 border-yellow-600 text-black";
  if (status === "failed") return "bg-red-500 border-red-700 text-white";
  return "bg-slate-300 border-slate-400 text-slate-800";
}

function statusText(status: ModuleStatus) {
  if (status === "energized") return "ENERGIZED";
  if (status === "transfer") return "TRANSFERRING";
  if (status === "failed") return "FAILED / OPEN";
  return "DE-ENERGIZED";
}

function boolStatus(value: boolean): ModuleStatus {
  return value ? "energized" : "failed";
}

function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`bg-white border border-slate-200 ${className}`}>{children}</div>;
}

function CardContent({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={className}>{children}</div>;
}

function Button({
  variant = "default",
  className = "",
  onClick,
  children,
}: {
  variant?: "default" | "outline" | "destructive" | "ghost";
  className?: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  const styles = {
    default: "bg-slate-900 text-white border-slate-900",
    outline: "bg-white text-slate-900 border-slate-300",
    destructive: "bg-red-600 text-white border-red-700",
    ghost: "bg-transparent text-slate-700 border-transparent",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`border px-4 py-2 font-semibold transition hover:opacity-90 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

function Badge({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`bg-slate-900 text-white font-semibold ${className}`}>{children}</div>;
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant={active ? "destructive" : "outline"}
      onClick={onClick}
      className="justify-start rounded-2xl w-full text-left"
    >
      {children}
    </Button>
  );
}

function ModuleCard({
  label,
  status,
  selected = false,
  onClick,
  icon: Icon,
}: {
  label: string;
  status: ModuleStatus;
  selected?: boolean;
  onClick?: () => void;
  icon?: React.ElementType;
}) {
  const DisplayIcon = Icon || Power;
  return (
    <motion.button
      layout
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full rounded-2xl border-2 p-3 text-left shadow-sm transition ${statusColor(status)} ${
        selected ? "ring-4 ring-slate-900/20" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <DisplayIcon className="h-5 w-5 shrink-0" />
        <div>
          <div className="text-base font-bold leading-tight">{label}</div>
          <div className="text-[11px] font-semibold opacity-90">{statusText(status)}</div>
        </div>
      </div>
    </motion.button>
  );
}

function PowerLine({ active }: { active: boolean }) {
  return <div className={`mx-auto h-7 w-1 rounded-full ${active ? "bg-emerald-500" : "bg-slate-300"}`} />;
}

function HorizontalLine({ active }: { active: boolean }) {
  return <div className={`h-1 min-w-8 flex-1 rounded-full ${active ? "bg-emerald-500" : "bg-slate-300"}`} />;
}

export default function DataCenterPowerTrainer() {
  const [tier, setTier] = useState(4);
  const [selectedModule, setSelectedModule] = useState("sts");
  const [stsMode, setStsMode] = useState<StsSource>("AUTO");
  const [faults, setFaults] = useState<FaultState>(defaultFaults);

  const state = useMemo<SystemState>(() => {
    const usePathB = tier >= 3;
    const utilityA = !faults.utilityAOpen;
    const utilityB = usePathB && !faults.utilityBOpen;

    const genA = faults.utilityAOpen && !faults.genAFailed;
    const genB = usePathB && faults.utilityBOpen && !faults.genBFailed;

    const sourceA = utilityA || genA;
    const sourceB = utilityB || genB;

    const upsA = sourceA && !faults.upsAFailed;
    const upsB = usePathB && sourceB && !faults.upsBFailed;

    const stsA = upsA && !faults.stsFailed;
    const stsB = usePathB && upsB && !faults.stsFailed;

    let selectedSource: "A" | "B" | "NONE" = "NONE";
    if (stsMode === "A" && stsA) selectedSource = "A";
    if (stsMode === "B" && stsB) selectedSource = "B";
    if (stsMode === "AUTO") {
      if (stsA) selectedSource = "A";
      else if (stsB) selectedSource = "B";
    }

    const pduA = selectedSource === "A" && !faults.pduACb1Open;
    const pduB = selectedSource === "B" && !faults.pduBCb1Open;

    const rpp1 = pduA && !faults.pduACb1Open && !faults.rpp1Open;
    const rpp2 = pduA && !faults.pduACb2Open && !faults.rpp2Open;
    const rpp3 = pduB && !faults.pduBCb1Open && !faults.rpp3Open;
    const rpp4 = pduB && !faults.pduBCb2Open && !faults.rpp4Open;

    const serverRow1 = tier >= 4 ? rpp1 || rpp2 || rpp3 || rpp4 : rpp1 || rpp2;
    const serverRow2 = tier >= 4 ? rpp1 || rpp2 || rpp3 || rpp4 : rpp3 || rpp4;

    return {
      pathA: {
        utility: utilityA,
        generator: genA,
        source: sourceA,
        ups: upsA,
        status: upsA ? (utilityA ? "energized" : "transfer") : "failed",
      },
      pathB: {
        utility: utilityB,
        generator: genB,
        source: sourceB,
        ups: upsB,
        status: upsB ? (utilityB ? "energized" : "transfer") : usePathB ? "failed" : "deenergized",
      },
      stsA,
      stsB,
      selectedSource,
      pduA,
      pduB,
      rpp1,
      rpp2,
      rpp3,
      rpp4,
      serverRow1,
      serverRow2,
      loadOnline: serverRow1 || serverRow2,
    };
  }, [faults, stsMode, tier]);

  const selected = MODULES.find((m) => m.id === selectedModule) || MODULES[0];

  function flip(key: keyof FaultState) {
    setFaults((old) => ({ ...old, [key]: !old[key] }));
  }

  function reset() {
    setFaults(defaultFaults);
    setStsMode("AUTO");
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-900 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight md:text-5xl">Data Center Power Path Trainer</h1>
            <p className="mt-2 max-w-3xl text-base text-slate-600 md:text-lg">
              Tier I-IV simulator based on your physical model: SES, generators, UPS, STS, PDU, RPP, and server rows.
            </p>
          </div>

          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                {state.loadOnline ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                )}
                <div>
                  <div className="text-sm font-semibold text-slate-500">Load Status</div>
                  <div className="text-xl font-black">{state.loadOnline ? "SERVERS ONLINE" : "SERVERS OFFLINE"}</div>
                  <div className="text-xs font-semibold text-slate-500">STS Source: {state.selectedSource}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_390px]">
          <Card className="rounded-3xl shadow-sm">
            <CardContent className="p-4 md:p-6">
              <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-black">Tier IV A/B One-Line</h2>
                  <p className="text-sm text-slate-600">Tap major equipment groups to read the lesson.</p>
                </div>
                <Badge className="w-fit rounded-xl px-3 py-1 text-sm">Tier {tier}</Badge>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_160px_1fr]">
                <div className="space-y-0">
                  <div className="mb-2 text-center text-lg font-black">PATH A</div>
                  <ModuleCard label="Utility A" icon={Zap} status={boolStatus(state.pathA.utility)} onClick={() => setSelectedModule("utility")} selected={selectedModule === "utility"} />
                  <PowerLine active={state.pathA.utility} />
                  <ModuleCard label="SES A" icon={GitBranch} status={state.pathA.source ? "energized" : "failed"} onClick={() => setSelectedModule("ses")} selected={selectedModule === "ses"} />
                  <PowerLine active={state.pathA.source} />
                  <ModuleCard label="GEN A" icon={RotateCcw} status={faults.utilityAOpen ? boolStatus(state.pathA.generator) : "deenergized"} onClick={() => setSelectedModule("gsb")} selected={selectedModule === "gsb"} />
                  <PowerLine active={state.pathA.source} />
                  <ModuleCard label="UPS A" icon={Battery} status={state.pathA.status} onClick={() => setSelectedModule("ups")} selected={selectedModule === "ups"} />
                </div>

                <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-slate-300 bg-slate-50 p-3">
                  <HorizontalLine active={state.stsA} />
                  <ModuleCard label="STS" icon={GitBranch} status={faults.stsFailed ? "failed" : state.selectedSource === "NONE" ? "failed" : state.selectedSource === "A" || state.selectedSource === "B" ? "energized" : "deenergized"} onClick={() => setSelectedModule("sts")} selected={selectedModule === "sts"} />
                  <div className="grid w-full grid-cols-3 gap-1">
                    {(["AUTO", "A", "B"] as StsSource[]).map((mode) => (
                      <Button key={mode} variant={stsMode === mode ? "default" : "outline"} className="rounded-xl px-2 py-1 text-xs" onClick={() => setStsMode(mode)}>
                        {mode}
                      </Button>
                    ))}
                  </div>
                  <HorizontalLine active={state.stsB} />
                </div>

                <div className="space-y-0">
                  <div className="mb-2 text-center text-lg font-black">PATH B</div>
                  <ModuleCard label="Utility B" icon={Zap} status={tier >= 3 ? boolStatus(state.pathB.utility) : "deenergized"} onClick={() => setSelectedModule("utility")} selected={selectedModule === "utility"} />
                  <PowerLine active={state.pathB.utility} />
                  <ModuleCard label="SES B" icon={GitBranch} status={tier >= 3 ? (state.pathB.source ? "energized" : "failed") : "deenergized"} onClick={() => setSelectedModule("ses")} selected={selectedModule === "ses"} />
                  <PowerLine active={state.pathB.source} />
                  <ModuleCard label="GEN B" icon={RotateCcw} status={tier >= 2 && faults.utilityBOpen ? boolStatus(state.pathB.generator) : tier >= 2 ? "deenergized" : "deenergized"} onClick={() => setSelectedModule("gsb")} selected={selectedModule === "gsb"} />
                  <PowerLine active={state.pathB.source} />
                  <ModuleCard label="UPS B" icon={Battery} status={state.pathB.status} onClick={() => setSelectedModule("ups")} selected={selectedModule === "ups"} />
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <Card className="rounded-3xl shadow-sm">
                  <CardContent className="space-y-3 p-4">
                    <div className="text-center text-lg font-black">PDU / RPP A SIDE</div>
                    <ModuleCard label="PDU A" icon={Power} status={boolStatus(state.pduA)} onClick={() => setSelectedModule("pdu")} selected={selectedModule === "pdu"} />
                    <div className="grid grid-cols-2 gap-3">
                      <ModuleCard label="RPP1" icon={GitBranch} status={boolStatus(state.rpp1)} onClick={() => setSelectedModule("rpp")} selected={selectedModule === "rpp"} />
                      <ModuleCard label="RPP2" icon={GitBranch} status={boolStatus(state.rpp2)} onClick={() => setSelectedModule("rpp")} selected={selectedModule === "rpp"} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-3xl shadow-sm">
                  <CardContent className="space-y-3 p-4">
                    <div className="text-center text-lg font-black">PDU / RPP B SIDE</div>
                    <ModuleCard label="PDU B" icon={Power} status={boolStatus(state.pduB)} onClick={() => setSelectedModule("pdu")} selected={selectedModule === "pdu"} />
                    <div className="grid grid-cols-2 gap-3">
                      <ModuleCard label="RPP3" icon={GitBranch} status={boolStatus(state.rpp3)} onClick={() => setSelectedModule("rpp")} selected={selectedModule === "rpp"} />
                      <ModuleCard label="RPP4" icon={GitBranch} status={boolStatus(state.rpp4)} onClick={() => setSelectedModule("rpp")} selected={selectedModule === "rpp"} />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <ModuleCard label="Server Row 1" icon={Server} status={boolStatus(state.serverRow1)} onClick={() => setSelectedModule("servers")} selected={selectedModule === "servers"} />
                <ModuleCard label="Server Row 2" icon={Server} status={boolStatus(state.serverRow2)} onClick={() => setSelectedModule("servers")} selected={selectedModule === "servers"} />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="rounded-3xl shadow-sm">
              <CardContent className="space-y-4 p-5">
                <h2 className="text-xl font-black">Selected Lesson</h2>
                <h3 className="text-2xl font-black">{selected.label}</h3>
                <p className="text-sm leading-6 text-slate-600">{selected.lesson}</p>
              </CardContent>
            </Card>

            <Card className="rounded-3xl shadow-sm">
              <CardContent className="space-y-4 p-5">
                <h2 className="text-xl font-black">Tier Selection</h2>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((value) => (
                    <Button key={value} variant={tier === value ? "default" : "outline"} className="rounded-2xl" onClick={() => setTier(value)}>
                      {value}
                    </Button>
                  ))}
                </div>
                <p className="text-sm leading-6 text-slate-600">{tierDescriptions[tier]}</p>
              </CardContent>
            </Card>

            <Card className="rounded-3xl shadow-sm">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black">Fault Controls</h2>
                  <Button variant="ghost" onClick={reset} className="rounded-xl">
                    Reset
                  </Button>
                </div>
                <div className="grid gap-2">
                  <ToggleButton active={faults.utilityAOpen} onClick={() => flip("utilityAOpen")}>Open Utility / SES A Main</ToggleButton>
                  <ToggleButton active={faults.utilityBOpen} onClick={() => flip("utilityBOpen")}>Open Utility / SES B Main</ToggleButton>
                  <ToggleButton active={faults.genAFailed} onClick={() => flip("genAFailed")}>Fail Generator A</ToggleButton>
                  <ToggleButton active={faults.genBFailed} onClick={() => flip("genBFailed")}>Fail Generator B</ToggleButton>
                  <ToggleButton active={faults.upsAFailed} onClick={() => flip("upsAFailed")}>Fail UPS A</ToggleButton>
                  <ToggleButton active={faults.upsBFailed} onClick={() => flip("upsBFailed")}>Fail UPS B</ToggleButton>
                  <ToggleButton active={faults.stsFailed} onClick={() => flip("stsFailed")}>Fail STS</ToggleButton>
                  <ToggleButton active={faults.pduACb1Open} onClick={() => flip("pduACb1Open")}>Open PDU-A CB1 / RPP1 Feed</ToggleButton>
                  <ToggleButton active={faults.pduACb2Open} onClick={() => flip("pduACb2Open")}>Open PDU-A CB2 / RPP2 Feed</ToggleButton>
                  <ToggleButton active={faults.pduBCb1Open} onClick={() => flip("pduBCb1Open")}>Open PDU-B CB1 / RPP3 Feed</ToggleButton>
                  <ToggleButton active={faults.pduBCb2Open} onClick={() => flip("pduBCb2Open")}>Open PDU-B CB2 / RPP4 Feed</ToggleButton>
                  <ToggleButton active={faults.rpp1Open} onClick={() => flip("rpp1Open")}>Open RPP1</ToggleButton>
                  <ToggleButton active={faults.rpp2Open} onClick={() => flip("rpp2Open")}>Open RPP2</ToggleButton>
                  <ToggleButton active={faults.rpp3Open} onClick={() => flip("rpp3Open")}>Open RPP3</ToggleButton>
                  <ToggleButton active={faults.rpp4Open} onClick={() => flip("rpp4Open")}>Open RPP4</ToggleButton>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}

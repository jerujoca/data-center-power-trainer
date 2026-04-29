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
  pduAFailed: boolean;
  pduBFailed: boolean;
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
    lesson:
      "Utility power feeds each service path. In Tier IV, Path A and Path B are shown as separate utility/service paths.",
  },
  {
    id: "ses",
    label: "SES A / SES B",
    lesson:
      "The Service Entrance Sections receive utility power and distribute it toward generators, UPS systems, and downstream loads. In Tier IV, A and B paths stay independent.",
  },
  {
    id: "gen",
    label: "GEN A / GEN B",
    lesson:
      "The generator side supports the path when utility fails. In this simplified trainer, generator power becomes available when utility is open unless that generator is failed.",
  },
  {
    id: "ups",
    label: "UPS A / UPS B",
    lesson:
      "Each UPS supports its source path and keeps the load alive while transferring from utility to generator power.",
  },
  {
    id: "sts",
    label: "STS",
    lesson:
      "The Static Transfer Switch chooses Source A or Source B. In AUTO, it prefers Source A when available and transfers to Source B if A is unavailable.",
  },
  {
    id: "pdu",
    label: "PDU A / PDU B",
    lesson:
      "PDU-A and PDU-B distribute power into branch circuits. PDU-A feeds RPP1 and RPP2. PDU-B feeds RPP3 and RPP4.",
  },
  {
    id: "rpp",
    label: "RPP1 - RPP4",
    lesson:
      "RPP1 and RPP2 support Server Row 1. RPP3 and RPP4 support Server Row 2. Each RPP can be opened to simulate a branch failure.",
  },
  {
    id: "servers",
    label: "Server Rows",
    lesson:
      "Server Row 1 is supported by RPP1/RPP2. Server Row 2 is supported by RPP3/RPP4. In this trainer, a row remains online if at least one assigned RPP is energized.",
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
  pduAFailed: false,
  pduBFailed: false,
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

function ModuleCard({
  label,
  status,
  onClick,
  icon: Icon,
}: {
  label: string;
  status: ModuleStatus;
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
      className={`w-full rounded-2xl border-2 p-3 shadow-sm transition ${statusColor(status)}`}
    >
      <div className="flex min-h-[90px] flex-col items-center justify-center gap-2 text-center">
        <DisplayIcon className="h-6 w-6 shrink-0" />
        <div>
          <div className="text-sm font-black leading-tight">{label}</div>
          <div className="text-[10px] font-semibold opacity-90">{statusText(status)}</div>
        </div>
      </div>
    </motion.button>
  );
}

function HorizontalLine({ active }: { active: boolean }) {
  return <div className={`h-1 rounded-full ${active ? "bg-emerald-500" : "bg-slate-300"}`} />;
}

type AlarmItem = {
  title: string;
  severity: "Critical" | "Alarm" | "Warning" | "Info";
  explanation: string;
};

function alarmColor(severity: AlarmItem["severity"]) {
  if (severity === "Critical") return "border-red-500 bg-red-50 text-red-950";
  if (severity === "Alarm") return "border-orange-500 bg-orange-50 text-orange-950";
  if (severity === "Warning") return "border-yellow-500 bg-yellow-50 text-yellow-950";
  return "border-blue-500 bg-blue-50 text-blue-950";
}

function getAlarms(faults: FaultState, state: SystemState, stsMode: StsSource): AlarmItem[] {
  const alarms: AlarmItem[] = [];

  if (faults.utilityAOpen) {
    alarms.push({
      title: "Utility / SES A Main Open",
      severity: state.pathA.generator ? "Warning" : "Alarm",
      explanation: state.pathA.generator
        ? "Path A lost utility power, but Generator A is available. UPS A is shown in transfer because the source is being supported by generator power."
        : "Path A lost utility power and Generator A is not available. Downstream A-side equipment will lose source support.",
    });
  }

  if (faults.utilityBOpen) {
    alarms.push({
      title: "Utility / SES B Main Open",
      severity: state.pathB.generator ? "Warning" : "Alarm",
      explanation: state.pathB.generator
        ? "Path B lost utility power, but Generator B is available. UPS B is shown in transfer because the source is being supported by generator power."
        : "Path B lost utility power and Generator B is not available. Downstream B-side equipment will lose source support.",
    });
  }

  if (faults.genAFailed) {
    alarms.push({
      title: "Generator A Failed",
      severity: faults.utilityAOpen ? "Alarm" : "Info",
      explanation: faults.utilityAOpen
        ? "Generator A is failed while Utility A is open, so Path A has no standby source available."
        : "Generator A is failed, but Utility A is still available, so Path A remains supported for now.",
    });
  }

  if (faults.genBFailed) {
    alarms.push({
      title: "Generator B Failed",
      severity: faults.utilityBOpen ? "Alarm" : "Info",
      explanation: faults.utilityBOpen
        ? "Generator B is failed while Utility B is open, so Path B has no standby source available."
        : "Generator B is failed, but Utility B is still available, so Path B remains supported for now.",
    });
  }

  if (faults.upsAFailed) {
    alarms.push({
      title: "UPS A Failed",
      severity: "Alarm",
      explanation: "UPS A is failed, so Source A cannot support the STS even if Utility A or Generator A is available.",
    });
  }

  if (faults.upsBFailed) {
    alarms.push({
      title: "UPS B Failed",
      severity: "Alarm",
      explanation: "UPS B is failed, so Source B cannot support the STS even if Utility B or Generator B is available.",
    });
  }

  if (faults.stsFailed) {
    alarms.push({
      title: "STS Failed",
      severity: "Critical",
      explanation: "The STS has failed. No source can be selected, so PDU and server loads lose power even if upstream sources are healthy.",
    });
  }

  if (stsMode === "A" && !state.stsA) {
    alarms.push({
      title: "STS Forced to Source A but Source A Unavailable",
      severity: "Critical",
      explanation: "The STS is manually set to A, but A is not available. In AUTO, the STS may be able to transfer to B if B is healthy.",
    });
  }

  if (stsMode === "B" && !state.stsB) {
    alarms.push({
      title: "STS Forced to Source B but Source B Unavailable",
      severity: "Critical",
      explanation: "The STS is manually set to B, but B is not available. In AUTO, the STS may be able to transfer to A if A is healthy.",
    });
  }

  if (state.selectedSource === "B") {
    alarms.push({
      title: "STS Transferred to Source B",
      severity: "Warning",
      explanation: "The load is being supported from Source B. This usually means Source A is unavailable or the STS was manually selected to B.",
    });
  }

  if (faults.pduAFailed) {
    alarms.push({
      title: "PDU A Failed / Open",
      severity: state.selectedSource === "A" ? "Critical" : "Warning",
      explanation: "PDU A is unavailable. If the STS is feeding Source A, A-side RPPs and server loads lose downstream distribution.",
    });
  }

  if (faults.pduBFailed) {
    alarms.push({
      title: "PDU B Failed / Open",
      severity: state.selectedSource === "B" ? "Critical" : "Warning",
      explanation: "PDU B is unavailable. If the STS is feeding Source B, B-side RPPs and server loads lose downstream distribution.",
    });
  }

  if (faults.rpp1Open) {
    alarms.push({
      title: "RPP1 Open",
      severity: state.rpp2 ? "Warning" : "Alarm",
      explanation: "RPP1 is open. Server Row 1 may remain online if another assigned RPP path is still energized.",
    });
  }

  if (faults.rpp2Open) {
    alarms.push({
      title: "RPP2 Open",
      severity: state.rpp1 ? "Warning" : "Alarm",
      explanation: "RPP2 is open. Server Row 1 may remain online if another assigned RPP path is still energized.",
    });
  }

  if (faults.rpp3Open) {
    alarms.push({
      title: "RPP3 Open",
      severity: state.rpp4 ? "Warning" : "Alarm",
      explanation: "RPP3 is open. Server Row 2 may remain online if another assigned RPP path is still energized.",
    });
  }

  if (faults.rpp4Open) {
    alarms.push({
      title: "RPP4 Open",
      severity: state.rpp3 ? "Warning" : "Alarm",
      explanation: "RPP4 is open. Server Row 2 may remain online if another assigned RPP path is still energized.",
    });
  }

  if (!state.serverRow1) {
    alarms.push({
      title: "Server Row 1 Offline",
      severity: "Critical",
      explanation: "Server Row 1 has no energized downstream feed available in the current simulation state.",
    });
  }

  if (!state.serverRow2) {
    alarms.push({
      title: "Server Row 2 Offline",
      severity: "Critical",
      explanation: "Server Row 2 has no energized downstream feed available in the current simulation state.",
    });
  }

  if (alarms.length === 0) {
    alarms.push({
      title: "Normal System",
      severity: "Info",
      explanation: "No active simulated faults. Utility, UPS, STS, PDU, RPP, and server loads are in a normal supported condition.",
    });
  }

  return alarms;
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

    if (stsMode === "AUTO") {
      if (stsA) selectedSource = "A";
      else if (stsB) selectedSource = "B";
    }

    if (stsMode === "A") selectedSource = stsA ? "A" : "NONE";
    if (stsMode === "B") selectedSource = stsB ? "B" : "NONE";

    const pduA = selectedSource === "A" && !faults.pduAFailed;
    const pduB = selectedSource === "B" && !faults.pduBFailed;

    const rpp1 = pduA && !faults.rpp1Open;
    const rpp2 = pduA && !faults.rpp2Open;
    const rpp3 = pduB && !faults.rpp3Open;
    const rpp4 = pduB && !faults.rpp4Open;

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
  const alarms = getAlarms(faults, state, stsMode);

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
                  <p className="text-sm text-slate-600">
                    Click equipment blocks directly. The one-line scrolls sideways on smaller screens.
                  </p>
                </div>
                <Badge className="w-fit rounded-xl px-3 py-1 text-sm">Tier {tier}</Badge>
              </div>

              <div className="overflow-x-auto rounded-3xl border-2 border-slate-300 bg-slate-50 p-4">
                <div className="min-w-[1500px] space-y-10">
                  <div>
                    <div className="mb-3 text-xl font-black">PATH A</div>
                    <div className="grid grid-cols-[170px_40px_170px_40px_170px_40px_170px_40px_170px_40px_170px_40px_170px_40px_170px] items-center gap-2">
                      <ModuleCard label="Utility A" icon={Zap} status={boolStatus(state.pathA.utility)} onClick={() => { setSelectedModule("utility"); flip("utilityAOpen"); }} />
                      <HorizontalLine active={state.pathA.utility} />
                      <ModuleCard label="SES A" icon={GitBranch} status={state.pathA.source ? "energized" : "failed"} onClick={() => { setSelectedModule("ses"); flip("utilityAOpen"); }} />
                      <HorizontalLine active={state.pathA.source} />
                      <ModuleCard label="GEN A" icon={RotateCcw} status={faults.utilityAOpen ? boolStatus(state.pathA.generator) : "deenergized"} onClick={() => { setSelectedModule("gen"); flip("genAFailed"); }} />
                      <HorizontalLine active={state.pathA.source} />
                      <ModuleCard label="UPS A" icon={Battery} status={state.pathA.status} onClick={() => { setSelectedModule("ups"); flip("upsAFailed"); }} />
                      <HorizontalLine active={state.stsA} />
                      <ModuleCard label="STS A Input" icon={GitBranch} status={state.stsA ? "energized" : "failed"} onClick={() => { setSelectedModule("sts"); setStsMode("A"); }} />
                      <HorizontalLine active={state.pduA} />
                      <ModuleCard label="PDU A" icon={Power} status={boolStatus(state.pduA)} onClick={() => { setSelectedModule("pdu"); flip("pduAFailed"); }} />
                      <HorizontalLine active={state.pduA} />
                      <ModuleCard label="RPP1" icon={GitBranch} status={boolStatus(state.rpp1)} onClick={() => { setSelectedModule("rpp"); flip("rpp1Open"); }} />
                      <HorizontalLine active={state.rpp1} />
                      <ModuleCard label="Server Row 1" icon={Server} status={boolStatus(state.serverRow1)} onClick={() => setSelectedModule("servers")} />
                    </div>
                  </div>

                  <div>
                    <div className="mb-3 text-xl font-black">PATH B</div>
                    <div className="grid grid-cols-[170px_40px_170px_40px_170px_40px_170px_40px_170px_40px_170px_40px_170px_40px_170px] items-center gap-2">
                      <ModuleCard label="Utility B" icon={Zap} status={tier >= 3 ? boolStatus(state.pathB.utility) : "deenergized"} onClick={() => { setSelectedModule("utility"); flip("utilityBOpen"); }} />
                      <HorizontalLine active={state.pathB.utility} />
                      <ModuleCard label="SES B" icon={GitBranch} status={tier >= 3 ? (state.pathB.source ? "energized" : "failed") : "deenergized"} onClick={() => { setSelectedModule("ses"); flip("utilityBOpen"); }} />
                      <HorizontalLine active={state.pathB.source} />
                      <ModuleCard label="GEN B" icon={RotateCcw} status={tier >= 2 && faults.utilityBOpen ? boolStatus(state.pathB.generator) : "deenergized"} onClick={() => { setSelectedModule("gen"); flip("genBFailed"); }} />
                      <HorizontalLine active={state.pathB.source} />
                      <ModuleCard label="UPS B" icon={Battery} status={state.pathB.status} onClick={() => { setSelectedModule("ups"); flip("upsBFailed"); }} />
                      <HorizontalLine active={state.stsB} />
                      <ModuleCard label="STS B Input" icon={GitBranch} status={state.stsB ? "energized" : "failed"} onClick={() => { setSelectedModule("sts"); setStsMode("B"); }} />
                      <HorizontalLine active={state.pduB} />
                      <ModuleCard label="PDU B" icon={Power} status={boolStatus(state.pduB)} onClick={() => { setSelectedModule("pdu"); flip("pduBFailed"); }} />
                      <HorizontalLine active={state.pduB} />
                      <ModuleCard label="RPP3" icon={GitBranch} status={boolStatus(state.rpp3)} onClick={() => { setSelectedModule("rpp"); flip("rpp3Open"); }} />
                      <HorizontalLine active={state.rpp3} />
                      <ModuleCard label="Server Row 2" icon={Server} status={boolStatus(state.serverRow2)} onClick={() => setSelectedModule("servers")} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-3xl border-2 border-slate-300 bg-slate-50 p-4">
                <div className="mb-3 text-center text-lg font-black">STS Source Selector</div>
                <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
                  {(["AUTO", "A", "B"] as StsSource[]).map((mode) => (
                    <Button
                      key={mode}
                      variant={stsMode === mode ? "default" : "outline"}
                      className="rounded-xl px-2 py-2 text-sm"
                      onClick={() => setStsMode(mode)}
                    >
                      {mode}
                    </Button>
                  ))}
                </div>
                <div className="mt-3 text-center text-sm font-semibold text-slate-600">
                  Selected Source: {state.selectedSource}
                </div>
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
                    <Button
                      key={value}
                      variant={tier === value ? "default" : "outline"}
                      className="rounded-2xl"
                      onClick={() => setTier(value)}
                    >
                      {value}
                    </Button>
                  ))}
                </div>
                <p className="text-sm leading-6 text-slate-600">{tierDescriptions[tier]}</p>
              </CardContent>
            </Card>

            <Card className="rounded-3xl shadow-sm">
              <CardContent className="space-y-4 p-5">
                <h2 className="text-xl font-black">Fault / Alarm Explanation</h2>
                <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
                  {alarms.map((alarm, index) => (
                    <div key={`${alarm.title}-${index}`} className={`rounded-2xl border-l-4 p-3 ${alarmColor(alarm.severity)}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-black">{alarm.title}</div>
                        <div className="rounded-full bg-white/70 px-2 py-1 text-[10px] font-black uppercase tracking-wide">
                          {alarm.severity}
                        </div>
                      </div>
                      <p className="mt-2 text-sm leading-6">{alarm.explanation}</p>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" onClick={reset} className="w-full rounded-xl">
                  Reset Entire System
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}

@/components/ui/card
@/components/ui/button
@/components/ui/badge
@/components/ui/tabs
import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Power, Zap, Battery, Server, GitBranch, RotateCcw, AlertTriangle, CheckCircle2 } from "lucide-react";

const MODULES = [
  { id: "utility", label: "Utility", icon: Zap, lesson: "The normal source feeding the data center. In the physical model, opening the SES main input breaker represents utility loss." },
  { id: "transformer", label: "Transformer", icon: Power, lesson: "Represents the utility transformer stepping medium voltage down to a usable service voltage such as 480Y/277 V." },
  { id: "ses", label: "SES", icon: GitBranch, lesson: "The Service Entrance Section receives utility power and distributes it toward the generator switchboard, UPS, tie breaker, and downstream equipment." },
  { id: "gsb", label: "GEN Switchboard", icon: RotateCcw, lesson: "Receives a start signal when utility is lost. It simulates generator startup and transfer support." },
  { id: "ups", label: "UPS", icon: Battery, lesson: "Keeps the load alive during a utility outage and bridges the gap until generator power is available." },
  { id: "sts", label: "STS", icon: GitBranch, lesson: "The Static Transfer Switch chooses between available sources and sends power to downstream loads." },
  { id: "pdu", label: "PDU", icon: Power, lesson: "The Power Distribution Unit distributes power into branch circuits feeding RPPs." },
  { id: "rpp", label: "RPP", icon: GitBranch, lesson: "The Remote Power Panel distributes branch power to server rows." },
  { id: "servers", label: "Servers", icon: Server, lesson: "The final load. In higher-tier designs, servers may have dual power cords fed from separate paths." },
];

const tierDescriptions = {
  1: "Tier I: Single path. Basic utility-to-load flow with no redundant active path.",
  2: "Tier II: Adds redundant components such as generator/UPS support, but still commonly has a single distribution path.",
  3: "Tier III: Concurrent maintainability concept. One path can be maintained while another keeps critical loads supported.",
  4: "Tier IV: Fault tolerant concept. Two active independent paths, usually A and B, with dual feeds to critical loads.",
};

function statusColor(status) {
  if (status === "energized") return "bg-emerald-500 border-emerald-700 text-white";
  if (status === "transfer") return "bg-yellow-400 border-yellow-600 text-black";
  if (status === "failed") return "bg-red-500 border-red-700 text-white";
  return "bg-slate-300 border-slate-400 text-slate-800";
}

function statusText(status) {
  if (status === "energized") return "ENERGIZED";
  if (status === "transfer") return "TRANSFERRING";
  if (status === "failed") return "FAILED / OPEN";
  return "DE-ENERGIZED";
}

function ToggleButton({ active, onClick, children }) {
  return (
    <Button
      variant={active ? "destructive" : "outline"}
      onClick={onClick}
      className="justify-start rounded-2xl"
    >
      {children}
    </Button>
  );
}

function ModuleCard({ module, status, selected, onClick }) {
  const Icon = module.icon;
  return (
    <motion.button
      layout
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full rounded-2xl border-2 p-4 text-left shadow-sm transition ${statusColor(status)} ${selected ? "ring-4 ring-slate-900/20" : ""}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Icon className="h-6 w-6" />
          <div>
            <div className="text-lg font-bold leading-tight">{module.label}</div>
            <div className="text-xs font-semibold opacity-90">{statusText(status)}</div>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

function PowerLine({ active }) {
  return <div className={`mx-auto h-8 w-1 rounded-full ${active ? "bg-emerald-500" : "bg-slate-300"}`} />;
}

export default function DataCenterPowerTrainer() {
  const [tier, setTier] = useState(1);
  const [selectedModule, setSelectedModule] = useState("ses");
  const [faults, setFaults] = useState({
    utilityOpen: false,
    genAFailed: false,
    genBFailed: false,
    upsFailed: false,
    stsSourceAFailed: false,
    pduCb1Open: false,
    rppOpen: false,
  });

  const state = useMemo(() => {
    const generatorAvailable = !faults.genAFailed || (tier >= 2 && !faults.genBFailed);
    const utilityAvailable = !faults.utilityOpen;
    const upstreamAvailable = utilityAvailable || generatorAvailable;
    const upsAvailable = upstreamAvailable && !faults.upsFailed;
    const stsAvailable = upsAvailable && !faults.stsSourceAFailed;
    const pduAvailable = stsAvailable && !faults.pduCb1Open;
    const rppAvailable = pduAvailable && !faults.rppOpen;

    return {
      utility: utilityAvailable ? "energized" : "failed",
      transformer: utilityAvailable ? "energized" : "deenergized",
      ses: upstreamAvailable ? (utilityAvailable ? "energized" : "transfer") : "failed",
      gsb: faults.utilityOpen ? (generatorAvailable ? "energized" : "failed") : "deenergized",
      ups: upsAvailable ? (utilityAvailable ? "energized" : "transfer") : "failed",
      sts: stsAvailable ? "energized" : "failed",
      pdu: pduAvailable ? "energized" : "failed",
      rpp: rppAvailable ? "energized" : "failed",
      servers: rppAvailable ? "energized" : "deenergized",
      generatorAvailable,
      utilityAvailable,
      loadOnline: rppAvailable,
    };
  }, [faults, tier]);

  const selected = MODULES.find((m) => m.id === selectedModule) || MODULES[0];

  function flip(key) {
    setFaults((old) => ({ ...old, [key]: !old[key] }));
  }

  function reset() {
    setFaults({
      utilityOpen: false,
      genAFailed: false,
      genBFailed: false,
      upsFailed: false,
      stsSourceAFailed: false,
      pduCb1Open: false,
      rppOpen: false,
    });
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 text-slate-900 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight md:text-5xl">Data Center Power Path Trainer</h1>
            <p className="mt-2 max-w-3xl text-base text-slate-600 md:text-lg">
              Interactive trainer based on the physical electrical model: utility, SES, generator, UPS, STS, PDU, RPP, and server loads.
            </p>
          </div>
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                {state.loadOnline ? <CheckCircle2 className="h-6 w-6 text-emerald-600" /> : <AlertTriangle className="h-6 w-6 text-red-600" />}
                <div>
                  <div className="text-sm font-semibold text-slate-500">Load Status</div>
                  <div className="text-xl font-black">{state.loadOnline ? "SERVERS ONLINE" : "SERVERS OFFLINE"}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="simulator" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 rounded-2xl md:w-[520px]">
            <TabsTrigger value="simulator">Simulator</TabsTrigger>
            <TabsTrigger value="lessons">Lessons</TabsTrigger>
            <TabsTrigger value="quiz">Training Quiz</TabsTrigger>
          </TabsList>

          <TabsContent value="simulator" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
              <Card className="rounded-3xl shadow-sm">
                <CardContent className="p-4 md:p-6">
                  <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-2xl font-black">Live One-Line</h2>
                      <p className="text-sm text-slate-600">Tap a module to learn what it does.</p>
                    </div>
                    <Badge className="w-fit rounded-xl px-3 py-1 text-sm">Tier {tier}</Badge>
                  </div>

                  <div className="mx-auto max-w-md">
                    {MODULES.map((module, index) => (
                      <div key={module.id}>
                        <ModuleCard
                          module={module}
                          status={state[module.id]}
                          selected={selectedModule === module.id}
                          onClick={() => setSelectedModule(module.id)}
                        />
                        {index < MODULES.length - 1 && <PowerLine active={state[module.id] === "energized" || state[module.id] === "transfer"} />}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
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
                      <Button variant="ghost" size="sm" onClick={reset} className="rounded-xl">Reset</Button>
                    </div>
                    <div className="grid gap-2">
                      <ToggleButton active={faults.utilityOpen} onClick={() => flip("utilityOpen")}>Open Utility / SES Main</ToggleButton>
                      <ToggleButton active={faults.genAFailed} onClick={() => flip("genAFailed")}>Fail Generator A</ToggleButton>
                      <ToggleButton active={faults.genBFailed} onClick={() => flip("genBFailed")}>Fail Generator B</ToggleButton>
                      <ToggleButton active={faults.upsFailed} onClick={() => flip("upsFailed")}>Fail UPS</ToggleButton>
                      <ToggleButton active={faults.stsSourceAFailed} onClick={() => flip("stsSourceAFailed")}>Fail STS Source A</ToggleButton>
                      <ToggleButton active={faults.pduCb1Open} onClick={() => flip("pduCb1Open")}>Open PDU CB1</ToggleButton>
                      <ToggleButton active={faults.rppOpen} onClick={() => flip("rppOpen")}>Open RPP Breaker</ToggleButton>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="lessons">
            <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
              <Card className="rounded-3xl shadow-sm">
                <CardContent className="grid gap-2 p-4">
                  {MODULES.map((module) => (
                    <Button key={module.id} variant={selectedModule === module.id ? "default" : "outline"} className="justify-start rounded-2xl" onClick={() => setSelectedModule(module.id)}>
                      {module.label}
                    </Button>
                  ))}
                </CardContent>
              </Card>
              <Card className="rounded-3xl shadow-sm">
                <CardContent className="space-y-4 p-6">
                  <h2 className="text-3xl font-black">{selected.label}</h2>
                  <p className="text-lg leading-8 text-slate-700">{selected.lesson}</p>
                  <div className="rounded-2xl bg-slate-900 p-4 font-mono text-sm text-slate-100">
                    Current Status: {statusText(state[selected.id])}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="quiz">
            <Card className="rounded-3xl shadow-sm">
              <CardContent className="space-y-5 p-6">
                <h2 className="text-3xl font-black">Training Quiz</h2>
                <p className="text-lg text-slate-700">Scenario: Utility power is lost. What should happen next in this trainer?</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <Button className="rounded-2xl p-6 text-left" variant="outline">The SES sends a start signal to the generator switchboard.</Button>
                  <Button className="rounded-2xl p-6 text-left" variant="outline">The RPP becomes the new power source.</Button>
                  <Button className="rounded-2xl p-6 text-left" variant="outline">The servers generate power back to the UPS.</Button>
                  <Button className="rounded-2xl p-6 text-left" variant="outline">The transformer becomes the backup battery.</Button>
                </div>
                <div className="rounded-2xl bg-blue-50 p-4 text-blue-950">
                  Correct answer: The SES sends a start signal to the generator switchboard. The UPS keeps the load supported while generator power becomes available.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

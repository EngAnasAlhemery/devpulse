
"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  Activity,
  AlertCircle,
  Bell,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Globe2,
  LayoutDashboard,
  Menu,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Zap,
} from "lucide-react";





export default function Home() {
  const [activeNav, setActiveNav] = useState("Overview");
  const [mobileMenu, setMobileMenu] = useState(false);
  type Monitor = {
  id: string;
  name: string;
  url: string;
  isActive: boolean;
  checks: {
    isUp: boolean;
    statusCode: number | null;
    responseTimeMs: number | null;
    checkedAt: string;
  }[];
};
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [isAddMonitorOpen, setIsAddMonitorOpen] = useState(false);
  const [newMonitorName, setNewMonitorName] = useState("");
  const [newMonitorUrl, setNewMonitorUrl] = useState("");
  const [isCreatingMonitor, setIsCreatingMonitor] = useState(false);
  const [createMonitorError, setCreateMonitorError] = useState("");

  type DashboardStats = {
  generatedAt: string;
  monitors: {
    total: number;
    active: number;
    paused: number;
    operational: number;
    down: number;
    pending: number;
  };
  incidents: {
    open: number;
  };
  uptime: {
    percentage: number | null;
    periodDays: number;
    totalChecks: number;
  };
  responseTime: {
    averageMs: number | null;
    periodHours: number;
    totalChecks: number;
    chart: {
      hour: string;
      averageResponseTime: number | null;
      checks: number;
    }[];
  };
};
type Incident = {
  id: string;
  title: string;
  description: string | null;
  startedAt: string;
  resolvedAt: string | null;
  monitor: {
    id: string;
    name: string;
    url: string;
  };
};
const [dashboardStats, setDashboardStats] =
  useState<DashboardStats | null>(null);
const [incidents, setIncidents] = useState<Incident[]>([]);
const [incidentsLoading, setIncidentsLoading] = useState(true);
const currentDate = useSyncExternalStore(
  () => () => {},
  () =>
    new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
  () => ""
);
useEffect(() => {
  const fetchDashboard = async () => {
    try {
            const [monitorsResponse, dashboardResponse, incidentsResponse] =
        await Promise.all([
          fetch("/api/monitors", { cache: "no-store" }),
          fetch("/api/dashboard", { cache: "no-store" }),
          fetch("/api/incidents", { cache: "no-store" }),
        ]);

      if (
        !monitorsResponse.ok ||
        !dashboardResponse.ok ||
        !incidentsResponse.ok
      ) {
        throw new Error("Failed to load dashboard data");
      }

      const [monitorsData, dashboardData, incidentsData] = await Promise.all([
        monitorsResponse.json(),
        dashboardResponse.json(),
        incidentsResponse.json(),
      ]);

      setMonitors(monitorsData);
      setDashboardStats(dashboardData);
      setIncidents(incidentsData.incidents);
      setApiError("");
    } catch {
      setApiError("Unable to load monitoring data");
    } finally {
      setLoading(false);
      setIncidentsLoading(false);
    }
  };

  void fetchDashboard();

  const interval = setInterval(fetchDashboard, 15000);

  return () => clearInterval(interval);
}, []);
  const handleCreateMonitor = async () => {
    setIsCreatingMonitor(true);
    setCreateMonitorError("");

    try {
      const response = await fetch("/api/monitors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newMonitorName,
          url: newMonitorUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create monitor");
      }

      const [monitorsResponse, dashboardResponse] = await Promise.all([
        fetch("/api/monitors", { cache: "no-store" }),
        fetch("/api/dashboard", { cache: "no-store" }),
      ]);

      if (!monitorsResponse.ok || !dashboardResponse.ok) {
        throw new Error("Monitor created, but dashboard refresh failed");
      }

      const [monitorsData, dashboardData] = await Promise.all([
        monitorsResponse.json(),
        dashboardResponse.json(),
      ]);

      setMonitors(monitorsData);
      setDashboardStats(dashboardData);

      setNewMonitorName("");
      setNewMonitorUrl("");
      setIsAddMonitorOpen(false);
    } catch (error) {
      setCreateMonitorError(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsCreatingMonitor(false);
    }
  };
  const navigation = [
    { name: "Overview", icon: LayoutDashboard },
    { name: "Monitors", icon: Globe2 },
    { name: "Incidents", icon: AlertCircle, count: String(dashboardStats?.incidents.open ?? 0) },
    { name: "Settings", icon: Settings },
  ];
const healthStats = dashboardStats?.monitors;

const totalActive = healthStats?.active ?? 0;
const operationalCount = healthStats?.operational ?? 0;
const downCount = healthStats?.down ?? 0;
const pendingCount = healthStats?.pending ?? 0;

const operationalPercent =
  totalActive > 0 ? (operationalCount / totalActive) * 100 : 0;

const downPercent =
  totalActive > 0 ? (downCount / totalActive) * 100 : 0;

const pendingPercent =
  totalActive > 0 ? (pendingCount / totalActive) * 100 : 0;

const downStart = operationalPercent;
const pendingStart = operationalPercent + downPercent;

const responseChart = dashboardStats?.responseTime.chart ?? [];

const maxResponseTime = Math.max(
  ...responseChart.map((point) => point.averageResponseTime ?? 0),
  1
);

const hasResponseTimeData = responseChart.some(
  (point) => point.averageResponseTime !== null
);
  return (
    <main className="min-h-screen bg-[#080d18] text-slate-100">
      <div className="flex min-h-screen">
        <aside className={`${mobileMenu ? "fixed inset-y-0 left-0 z-50 flex" : "hidden"} w-64 shrink-0 flex-col border-r border-white/[0.07] bg-[#0b1120] p-6 md:relative md:flex`}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 text-[#07111d]">
              <Activity size={23} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">DevPulse</h1>
              <p className="text-[10px] tracking-[0.2em] text-slate-500">API OBSERVABILITY</p>
            </div>
          </div>

          <div className="mt-12">
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Workspace</p>
            <nav className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = activeNav === item.name;
                return (
                  <button
                    key={item.name}
                    onClick={() => { setActiveNav(item.name); setMobileMenu(false); }}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${active ? "bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/20" : "text-slate-400 hover:bg-white/[0.04] hover:text-white"}`}
                  >
                    <Icon size={18} />
                    <span className="flex-1 text-left">{item.name}</span>
                    {item.count && <span className="rounded-md bg-rose-500/15 px-2 py-0.5 text-xs text-rose-300">{item.count}</span>}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.05] p-4">
            <div className="flex items-center gap-2 text-cyan-300">
              <ShieldCheck size={17} />
              <span className="text-xs font-semibold">System protected</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-400">Your services are being monitored around the clock.</p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[92%] rounded-full bg-cyan-400" />
            </div>
            <p className="mt-2 text-[10px] text-slate-500">{monitors.length} monitors configured</p>
          </div>

          <div className="mt-6 flex items-center gap-3 border-t border-white/[0.07] pt-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-xs font-bold text-white">AN</div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Admin User</p>
              <p className="text-xs text-slate-500">Free workspace</p>
            </div>
            <ChevronDown size={16} className="text-slate-500" />
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="flex h-[76px] items-center justify-between border-b border-white/[0.07] px-5 md:px-9">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileMenu(!mobileMenu)} className="text-slate-400 md:hidden">
                <Menu size={22} />
              </button>
              <div>
                <p className="text-sm text-slate-400">Workspace / <span className="text-white">{activeNav}</span></p>
              </div>
            </div>
            <div className="flex items-center gap-3 md:gap-5">
              <div className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-400 sm:flex">
                <Search size={14} />
                <span>Search anything...</span>
                <kbd className="ml-4 rounded border border-white/10 px-1.5 py-0.5 text-[10px]">⌘ K</kbd>
              </div>
              <button className="relative text-slate-400 hover:text-white">
                <Bell size={19} />
                <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-rose-400 ring-2 ring-[#080d18]" />
              </button>
              <div className="hidden h-8 w-px bg-white/10 sm:block" />
<span className="hidden text-xs text-slate-400 sm:block">{currentDate}</span>
            </div>
          </header>
{activeNav === "Overview" ? (
          <div className="mx-auto max-w-[1500px] p-5 md:p-9">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Overview</h2>
                  <span className="rounded-md border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">Live preview</span>
                </div>
                <p className="mt-2 text-sm text-slate-400">Monitor your APIs and infrastructure at a glance.</p>
              </div>
              <button
  onClick={() => {
    setCreateMonitorError("");
    setNewMonitorName("");
    setNewMonitorUrl("");
    setIsAddMonitorOpen(true);
  }}
  className="flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-[#07111d] transition hover:bg-cyan-300"
>
  <Plus size={17} /> Add new monitor
</button>
            </div>
{apiError && (
  <div
    role="alert"
    className="mb-4 flex items-center gap-3 rounded-xl border border-rose-400/20 bg-rose-400/[0.06] px-4 py-3 text-sm text-rose-300"
  >
    <AlertCircle size={18} className="shrink-0" />
    <p>{apiError}</p>
  </div>
)}
<div
  className={`mb-7 flex items-center gap-3 rounded-xl border px-4 py-3 ${
    totalActive === 0
      ? "border-amber-400/15 bg-amber-400/[0.05]"
      : downCount > 0
        ? "border-rose-400/15 bg-rose-400/[0.05]"
        : "border-emerald-400/15 bg-emerald-400/[0.05]"
  }`}
>
  {totalActive === 0 ? (
    <AlertCircle size={19} className="shrink-0 text-amber-400" />
  ) : downCount > 0 ? (
    <AlertCircle size={19} className="shrink-0 text-rose-400" />
  ) : (
    <CheckCircle2 size={19} className="shrink-0 text-emerald-400" />
  )}

  <p className="flex-1 text-sm text-slate-300">
    {totalActive === 0
      ? "No active monitors. Activate a monitor to start tracking your services."
      : downCount > 0
        ? `${downCount} service${downCount > 1 ? "s are" : " is"} currently down. Check your monitored endpoints.`
        : pendingCount > 0
          ? `${pendingCount} service${pendingCount > 1 ? "s are" : " is"} waiting for the first health check.`
          : "All active monitoring services are operational."}
  </p>

  <span className="hidden text-xs text-slate-500 sm:block">
    Live status
  </span>
</div>
<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
  {[
    {
      label: "Total Monitors",
      value: String(dashboardStats?.monitors.total ?? monitors.length),
      change: `${dashboardStats?.monitors.active ?? 0} active monitors`,
      icon: Globe2,
      color: "text-cyan-300",
      bg: "bg-cyan-400/10",
    },
    {
      label: "Overall Uptime",
      value:
        dashboardStats?.uptime.percentage != null
          ? `${dashboardStats.uptime.percentage}%`
          : "—",
      change: `Last ${dashboardStats?.uptime.periodDays ?? 30} days`,
      icon: ShieldCheck,
      color: "text-emerald-300",
      bg: "bg-emerald-400/10",
    },
    {
      label: "Avg. Response Time",
      value:
        dashboardStats?.responseTime.averageMs != null
          ? `${dashboardStats.responseTime.averageMs} ms`
          : "—",
      change: "Last 24 hours",
      icon: Zap,
      color: "text-amber-300",
      bg: "bg-amber-400/10",
    },
    {
      label: "Active Incidents",
      value: String(dashboardStats?.incidents.open ?? 0).padStart(2, "0"),
      change: "Currently unresolved",
      icon: AlertCircle,
      color: "text-rose-300",
      bg: "bg-rose-400/10",
    },
  ].map((stat) => {
    const Icon = stat.icon;

    return (
      <div
        key={stat.label}
        className="rounded-2xl border border-white/[0.07] bg-[#0d1525] p-5 transition hover:border-white/15"
      >
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">{stat.label}</p>
          <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}>
            <Icon size={18} />
          </span>
        </div>

        <p className="mt-4 text-3xl font-bold tracking-tight">
          {stat.value}
        </p>

        <p className="mt-2 text-xs text-slate-500">
          {stat.change}
        </p>
      </div>
    );
  })}
</div>
<div className="mt-6 grid gap-6 xl:grid-cols-[1.65fr_1fr]">
<div className="rounded-2xl border border-white/[0.07] bg-[#0d1525] p-5 md:p-6">
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div>
      <h3 className="font-semibold">Response time</h3>
      <p className="mt-1 text-xs text-slate-500">
        Average API latency over the last 24 hours
      </p>
    </div>
    <span className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-400">
      Last 24 hours
    </span>
  </div>
  <div className="mt-8 flex items-end gap-3">
    <span className="text-3xl font-bold">
      {dashboardStats?.responseTime.averageMs != null
        ? dashboardStats.responseTime.averageMs
        : "—"}
      <span className="text-base font-normal text-slate-500"> ms</span>
    </span>
  </div>

  <div className="relative mt-6 flex h-40 items-end gap-1.5 border-b border-l border-white/[0.08] px-2 pb-0">
    {hasResponseTimeData ? (
      responseChart.map((point) => {
        const responseTime = point.averageResponseTime;
        const height =
          responseTime !== null
            ? Math.max((responseTime / maxResponseTime) * 100, 3)
            : 0;

        return (
          <div
            key={point.hour}
            title={`${point.hour}: ${
              responseTime !== null ? `${responseTime} ms` : "No data"
            }`}
            className="group relative flex h-full flex-1 items-end"
          >
            <div
              style={{ height: `${height}%` }}
              className={`w-full rounded-t-sm transition-all ${
                responseTime !== null
                  ? "bg-gradient-to-t from-cyan-500/20 to-cyan-400 group-hover:from-cyan-400/60 group-hover:to-cyan-300"
                  : "bg-slate-700/30"
              }`}
            />
          </div>
        );
      })
    ) : (
      <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
        No response time data available yet
      </div>
    )}
  </div>

  <div className="mt-3 flex justify-between text-[10px] text-slate-500">
    {responseChart
      .filter((_, index) => index % 4 === 0)
      .map((point) => (
        <span key={point.hour}>{point.hour}</span>
      ))}
  </div>
</div>
<div className="rounded-2xl border border-white/[0.07] bg-[#0d1525] p-5 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Service health</h3>
                    <p className="mt-1 text-xs text-slate-500">Current infrastructure status</p>
                  </div>
                  <Activity size={18} className="text-cyan-300" />
                </div>
                <div className="mt-7 flex items-center justify-center">
  <div
    className="relative flex h-40 w-40 items-center justify-center rounded-full"
    style={{
      background:
        totalActive === 0
          ? "#1e293b"
          : `conic-gradient(
              #34d399 0% ${operationalPercent}%,
              #fb7185 ${downStart}% ${downStart + downPercent}%,
              #fbbf24 ${pendingStart}% ${pendingStart + pendingPercent}%,
              #1e293b ${pendingStart + pendingPercent}% 100%
            )`,
    }}
  >
    <div className="flex h-[124px] w-[124px] flex-col items-center justify-center rounded-full bg-[#0d1525]">
      <span className="text-3xl font-bold">
        {totalActive > 0 ? `${Math.round(operationalPercent)}%` : "—"}
      </span>
      <span className="mt-1 text-[10px] text-slate-500">
        {totalActive > 0 ? "Healthy" : "No active services"}
      </span>
    </div>
  </div>
</div>
<div className="mt-7 space-y-3">
  <div className="flex items-center justify-between text-sm">
    <span className="flex items-center gap-2 text-slate-400">
      <span className="h-2 w-2 rounded-full bg-emerald-400" />
      Operational
    </span>
    <span>{operationalCount} services</span>
  </div>

  <div className="flex items-center justify-between text-sm">
    <span className="flex items-center gap-2 text-slate-400">
      <span className="h-2 w-2 rounded-full bg-rose-400" />
      Down
    </span>
    <span>{downCount} services</span>
  </div>

  <div className="flex items-center justify-between text-sm">
    <span className="flex items-center gap-2 text-slate-400">
      <span className="h-2 w-2 rounded-full bg-amber-400" />
      Pending
    </span>
    <span>{pendingCount} services</span>
  </div>

  <div className="flex items-center justify-between border-t border-white/[0.07] pt-3 text-sm">
    <span className="text-slate-400">Paused</span>
    <span>{healthStats?.paused ?? 0} services</span>
  </div>
</div>
</div>
</div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d1525]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] p-5 md:px-6">
                <div>
                  <h3 className="font-semibold">Monitored services</h3>
                  <p className="mt-1 text-xs text-slate-500">Health and performance of your endpoints</p>
                </div>
                <button className="text-xs font-medium text-cyan-300 hover:text-cyan-200">View all monitors <span aria-hidden="true">→</span></button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left text-sm">
                  <thead className="bg-white/[0.02] text-[11px] uppercase tracking-wider text-slate-500">
                    <tr><th className="px-6 py-4 font-medium">Service</th><th className="px-6 py-4 font-medium">Status</th><th className="px-6 py-4 font-medium">Uptime (30d)</th><th className="px-6 py-4 font-medium">Response</th><th className="px-6 py-4 font-medium">Region</th></tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {monitors.map((monitor) => {
  const lastCheck = monitor.checks[0];

  const status = !monitor.isActive
    ? "Paused"
    : !lastCheck
      ? "Pending"
      : lastCheck.isUp
        ? "Operational"
        : "Down";

  const statusColor =
    status === "Operational"
      ? "bg-emerald-400/10 text-emerald-300"
      : status === "Down"
        ? "bg-rose-400/10 text-rose-300"
        : "bg-amber-400/10 text-amber-300";

  const dotColor =
    status === "Operational"
      ? "bg-emerald-400"
      : status === "Down"
        ? "bg-rose-400"
        : "bg-amber-400";

  return (
                      <tr key={monitor.id} className="transition hover:bg-white/[0.02]">
  <td className="px-6 py-4">
    <p className="font-medium text-slate-200">{monitor.name}</p>
    <p className="mt-1 text-xs text-slate-500">{monitor.url}</p>
  </td>

  <td className="px-6 py-4">
    <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs ${statusColor}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
      {status}
    </span>
  </td>

  <td className="px-6 py-4 font-medium tabular-nums">—</td>

  <td className="px-6 py-4 tabular-nums text-slate-300">
    {lastCheck?.responseTimeMs != null
      ? `${lastCheck.responseTimeMs} ms`
      : "—"}
  </td>

  <td className="px-6 py-4 text-slate-400">—</td>
</tr>
  );
            })}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t border-white/[0.07] px-6 py-4 text-xs text-slate-500">
                <span>
  {loading ? "Loading monitors..." : `Showing ${monitors.length} monitors`}
</span>
                <span className="flex items-center gap-1"><Clock3 size={13} /> Auto-refresh every 15s</span>
              </div>
            </div>

            <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-5 text-xs text-slate-600">
              <span>© 2026 DevPulse. Built for developers.</span>
<span className="flex items-center gap-2">
  <span
    className={`h-1.5 w-1.5 rounded-full ${
      loading || !dashboardStats
        ? "bg-slate-400"
        : dashboardStats.monitors.down > 0
          ? "bg-rose-400"
          : dashboardStats.monitors.pending > 0
            ? "bg-amber-400"
            : dashboardStats.monitors.active === 0
              ? "bg-slate-400"
              : "bg-emerald-400"
    }`}
  />
  {loading || !dashboardStats
    ? "Checking monitoring status..."
    : dashboardStats.monitors.down > 0
      ? `${dashboardStats.monitors.down} service(s) down`
      : dashboardStats.monitors.pending > 0
        ? `${dashboardStats.monitors.pending} monitor(s) awaiting first check`
        : dashboardStats.monitors.active === 0
          ? "No active monitors"
          : "All monitored services operational"}
</span>
            </footer>
          </div>
          ) : activeNav === "Incidents" ? (
    <div className="mx-auto max-w-[1500px] p-5 md:p-9">
    <div className="mb-8">
      <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
        Incidents
      </h2>
      <p className="mt-2 text-sm text-slate-400">
        Track service outages and recovery events across your monitors.
      </p>
    </div>

    <div className="mb-8 grid gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
        <p className="text-sm text-slate-400">Total incidents</p>
        <p className="mt-2 text-3xl font-bold">{incidents.length}</p>
      </div>
      <div className="rounded-2xl border border-rose-400/20 bg-rose-400/[0.05] p-5">
        <p className="text-sm text-rose-300">Open incidents</p>
        <p className="mt-2 text-3xl font-bold text-rose-300">
          {incidents.filter((incident) => !incident.resolvedAt).length}
        </p>
      </div>
      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.05] p-5">
        <p className="text-sm text-emerald-300">Resolved incidents</p>
        <p className="mt-2 text-3xl font-bold text-emerald-300">
          {incidents.filter((incident) => incident.resolvedAt).length}
        </p>
      </div>
    </div>

    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
      <div className="border-b border-white/[0.08] px-5 py-4">
        <h3 className="font-semibold">Incident history</h3>
      </div>

      {incidentsLoading ? (
        <div className="p-10 text-center text-sm text-slate-400">
          Loading incidents...
        </div>
      ) : incidents.length === 0 ? (
        <div className="p-10 text-center">
          <CheckCircle2 className="mx-auto mb-3 text-emerald-400" size={32} />
          <p className="font-medium">No incidents recorded</p>
          <p className="mt-1 text-sm text-slate-400">
            Your monitoring history will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left text-sm">
            <thead className="bg-white/[0.03] text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4 font-medium">Incident</th>
                <th className="px-5 py-4 font-medium">Monitor</th>
                <th className="px-5 py-4 font-medium">Started</th>
                <th className="px-5 py-4 font-medium">Resolved</th>
                <th className="px-5 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {incidents.map((incident) => (
                <tr key={incident.id} className="transition hover:bg-white/[0.03]">
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-200">{incident.title}</p>
                    {incident.description && (
                      <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                        {incident.description}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-slate-300">{incident.monitor.name}</p>
                    <p className="mt-1 max-w-[200px] truncate text-xs text-slate-500">
                      {incident.monitor.url}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-slate-400">
                    {new Date(incident.startedAt).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-slate-400">
                    {incident.resolvedAt
                      ? new Date(incident.resolvedAt).toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-5 py-4">
                    {incident.resolvedAt ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
                        <CheckCircle2 size={13} /> Resolved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-400/10 px-2.5 py-1 text-xs font-medium text-rose-300">
                        <AlertCircle size={13} /> Open
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>
) : (
  <div className="mx-auto max-w-[1500px] p-5 md:p-9">
    <h2 className="text-2xl font-bold">{activeNav}</h2>
    <p className="mt-2 text-sm text-slate-400">
      This section is not available yet.
    </p>
  </div>
)}
        </section>
      </div>
            {isAddMonitorOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-monitor-title"
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d1525] p-6 shadow-2xl"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 id="add-monitor-title" className="text-lg font-semibold">
                  Add New Monitor
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Start monitoring a new API endpoint.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddMonitorOpen(false)}
                disabled={isCreatingMonitor}
                className="rounded-lg px-2 py-1 text-slate-400 transition hover:bg-white/5 hover:text-white"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleCreateMonitor();
              }}
              className="space-y-5"
            >
              <div>
                <label
                  htmlFor="monitor-name"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Monitor name
                </label>
                <input
                  id="monitor-name"
                  type="text"
                  required
                  maxLength={100}
                  value={newMonitorName}
                  onChange={(event) => setNewMonitorName(event.target.value)}
                  placeholder="e.g. Production API"
                  className="w-full rounded-xl border border-white/10 bg-[#080d18] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
                />
              </div>

              <div>
                <label
                  htmlFor="monitor-url"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Endpoint URL
                </label>
                <input
                  id="monitor-url"
                  type="url"
                  required
                  value={newMonitorUrl}
                  onChange={(event) => setNewMonitorUrl(event.target.value)}
                  placeholder="https://api.example.com/health"
                  className="w-full rounded-xl border border-white/10 bg-[#080d18] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
                />
              </div>

              {createMonitorError && (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-400/20 bg-rose-400/[0.06] px-4 py-3 text-sm text-rose-300"
                >
                  {createMonitorError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddMonitorOpen(false)}
                  disabled={isCreatingMonitor}
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isCreatingMonitor}
                  className="rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-[#07111d] transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isCreatingMonitor ? "Creating..." : "Create Monitor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

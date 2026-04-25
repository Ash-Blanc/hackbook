import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hackathon Command Center" },
      {
        name: "description",
        content: "Track hackathon submissions, deadlines, source links, tasks, and progress in one lightweight command center.",
      },
      { property: "og:title", content: "Hackathon Command Center" },
      {
        property: "og:description",
        content: "A CLI-inspired workspace for staying on top of active and upcoming hackathons.",
      },
    ],
  }),
  component: Index,
});

type Status = "watching" | "registered" | "building" | "submitted" | "archived";
type Priority = "critical" | "high" | "medium" | "low";
type Platform = "Devpost" | "Devfolio" | "Kaggle" | "Discord" | "X" | "LinkedIn" | "Other";

type Task = {
  id: number;
  label: string;
  done: boolean;
  due: string;
};

type Hackathon = {
  id: number;
  title: string;
  platform: Platform;
  source: string;
  theme: string;
  status: Status;
  priority: Priority;
  registrationDeadline: string;
  submissionDeadline: string;
  prize: string;
  notes: string;
  assets: string[];
  tasks: Task[];
};

type Capture = {
  id: number;
  platform: Platform;
  link: string;
  notes: string;
  createdAt: string;
};

const hackathonsSeed: Hackathon[] = [
  {
    id: 1,
    title: "Global AI Agents Sprint",
    platform: "Devpost",
    source: "https://devpost.com/",
    theme: "Autonomous workflows for real-world teams",
    status: "building",
    priority: "critical",
    registrationDeadline: "2026-04-27",
    submissionDeadline: "2026-04-30",
    prize: "$20k + accelerator interviews",
    notes: "Focus on a tight demo loop: ingest task, plan, execute, produce audit trail.",
    assets: ["github.com/you/agent-sprint", "pitch.deck/agent-sprint", "demo.video/todo"],
    tasks: [
      { id: 1, label: "Lock problem statement", done: true, due: "2026-04-23" },
      { id: 2, label: "Prototype core flow", done: true, due: "2026-04-25" },
      { id: 3, label: "Record demo walkthrough", done: false, due: "2026-04-29" },
      { id: 4, label: "Submit final project", done: false, due: "2026-04-30" },
    ],
  },
  {
    id: 2,
    title: "Open Data Climate Challenge",
    platform: "Kaggle",
    source: "https://kaggle.com/competitions",
    theme: "Forecasting urban heat risk with public datasets",
    status: "registered",
    priority: "high",
    registrationDeadline: "2026-05-02",
    submissionDeadline: "2026-05-07",
    prize: "GPU credits + finalist showcase",
    notes: "Use lightweight baseline first, then ensemble only if leaderboard gap is meaningful.",
    assets: ["notebook/kaggle-climate-v1", "dataset/card", "model-log/week-1"],
    tasks: [
      { id: 1, label: "Create baseline notebook", done: true, due: "2026-04-26" },
      { id: 2, label: "Feature audit", done: false, due: "2026-05-01" },
      { id: 3, label: "Leaderboard submission", done: false, due: "2026-05-05" },
      { id: 4, label: "Write model explanation", done: false, due: "2026-05-06" },
    ],
  },
  {
    id: 3,
    title: "DeFi Builder Weekend",
    platform: "Devfolio",
    source: "https://devfolio.co/",
    theme: "Consumer-grade crypto safety tools",
    status: "watching",
    priority: "medium",
    registrationDeadline: "2026-05-10",
    submissionDeadline: "2026-05-17",
    prize: "$8k sponsor bounties",
    notes: "Could reuse wallet risk scanner idea. Decide after checking sponsor tracks.",
    assets: ["idea/doc-wallet-risk", "sponsor-list/todo"],
    tasks: [
      { id: 1, label: "Read bounty requirements", done: false, due: "2026-05-04" },
      { id: 2, label: "Choose track", done: false, due: "2026-05-08" },
      { id: 3, label: "Register team", done: false, due: "2026-05-09" },
    ],
  },
  {
    id: 4,
    title: "Founder Tools Microhack",
    platform: "LinkedIn",
    source: "https://linkedin.com/feed/",
    theme: "Tiny products that remove operational drag",
    status: "submitted",
    priority: "low",
    registrationDeadline: "2026-04-12",
    submissionDeadline: "2026-04-20",
    prize: "Investor office hours",
    notes: "Submitted ops dashboard. Follow up with judges if shortlisted.",
    assets: ["submission/founder-tools", "demo.video/final", "landing/page"],
    tasks: [
      { id: 1, label: "Submit build", done: true, due: "2026-04-20" },
      { id: 2, label: "Share public post", done: true, due: "2026-04-21" },
      { id: 3, label: "Follow up", done: false, due: "2026-04-28" },
    ],
  },
];

const platforms: Platform[] = ["Devpost", "Devfolio", "Kaggle", "Discord", "X", "LinkedIn", "Other"];
const statuses: Array<Status | "all"> = ["all", "watching", "registered", "building", "submitted", "archived"];

const today = new Date("2026-04-25T10:00:00");

function daysUntil(date: string) {
  const target = new Date(`${date}T23:59:59`);
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}

function urgencyFor(date: string) {
  const days = daysUntil(date);
  if (days < 0) return { label: "overdue", tone: "danger", command: "panic --recover" };
  if (days === 0) return { label: "today", tone: "danger", command: "submit --now" };
  if (days <= 3) return { label: `${days}d`, tone: "warning", command: "focus --next" };
  if (days <= 7) return { label: `${days}d`, tone: "info", command: "plan --week" };
  return { label: `${days}d`, tone: "muted", command: "watch --later" };
}

function progress(tasks: Task[]) {
  const complete = tasks.filter((task) => task.done).length;
  return Math.round((complete / tasks.length) * 100);
}

function inferPlatform(value: string): Platform {
  const lower = value.toLowerCase();
  if (lower.includes("devpost")) return "Devpost";
  if (lower.includes("devfolio")) return "Devfolio";
  if (lower.includes("kaggle")) return "Kaggle";
  if (lower.includes("discord")) return "Discord";
  if (lower.includes("twitter") || lower.includes("x.com")) return "X";
  if (lower.includes("linkedin")) return "LinkedIn";
  return "Other";
}

function Index() {
  const [hackathons, setHackathons] = useState(hackathonsSeed);
  const [selectedId, setSelectedId] = useState(1);
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [platformFilter, setPlatformFilter] = useState<Platform | "all">("all");
  const [query, setQuery] = useState("");
  const [captures, setCaptures] = useState<Capture[]>([
    {
      id: 1,
      platform: "Discord",
      link: "Discord post: #hackathons / AI-native tooling bounty",
      notes: "Review sponsor list after work block.",
      createdAt: "queued 2h ago",
    },
  ]);
  const [captureLink, setCaptureLink] = useState("");
  const [captureNotes, setCaptureNotes] = useState("");
  const [capturePlatform, setCapturePlatform] = useState<Platform>("Other");

  const filteredHackathons = useMemo(() => {
    return hackathons.filter((hackathon) => {
      const matchesStatus = statusFilter === "all" || hackathon.status === statusFilter;
      const matchesPlatform = platformFilter === "all" || hackathon.platform === platformFilter;
      const text = `${hackathon.title} ${hackathon.theme} ${hackathon.platform}`.toLowerCase();
      return matchesStatus && matchesPlatform && text.includes(query.toLowerCase());
    });
  }, [hackathons, platformFilter, query, statusFilter]);

  const selectedHackathon = hackathons.find((hackathon) => hackathon.id === selectedId) ?? hackathons[0];

  const deadlineQueue = useMemo(() => {
    return hackathons
      .flatMap((hackathon) => [
        { hackathon, type: "reg", date: hackathon.registrationDeadline },
        { hackathon, type: "submit", date: hackathon.submissionDeadline },
      ])
      .sort((a, b) => daysUntil(a.date) - daysUntil(b.date))
      .slice(0, 6);
  }, [hackathons]);

  const taskDebt = hackathons.flatMap((hackathon) => hackathon.tasks.filter((task) => !task.done)).length;
  const activeCount = hackathons.filter((hackathon) => !["submitted", "archived"].includes(hackathon.status)).length;
  const submittedCount = hackathons.filter((hackathon) => hackathon.status === "submitted").length;
  const urgentCount = deadlineQueue.filter((item) => daysUntil(item.date) <= 3).length;

  function toggleTask(hackathonId: number, taskId: number) {
    setHackathons((items) =>
      items.map((hackathon) =>
        hackathon.id === hackathonId
          ? {
              ...hackathon,
              tasks: hackathon.tasks.map((task) =>
                task.id === taskId ? { ...task, done: !task.done } : task,
              ),
            }
          : hackathon,
      ),
    );
  }

  function captureOpportunity(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!captureLink.trim()) return;
    const platform = capturePlatform === "Other" ? inferPlatform(captureLink) : capturePlatform;
    setCaptures((items) => [
      {
        id: Date.now(),
        platform,
        link: captureLink.trim(),
        notes: captureNotes.trim() || "Review and decide whether to track.",
        createdAt: "queued just now",
      },
      ...items,
    ]);
    setCaptureLink("");
    setCaptureNotes("");
    setCapturePlatform("Other");
  }

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(var(--terminal-grid)_1px,transparent_1px),linear-gradient(90deg,var(--terminal-grid)_1px,transparent_1px)] bg-[size:42px_42px] opacity-35" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_50%_0%,var(--terminal-glow),transparent_65%)]" />

      <section className="relative mx-auto flex w-full max-w-7xl flex-col gap-5 px-3 py-4 sm:px-5 lg:px-6">
        <header className="grid gap-4 rounded-md border border-border bg-card/85 p-4 shadow-[var(--shadow-terminal)] backdrop-blur md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground">
              <span className="rounded-sm border border-border bg-secondary px-2 py-1 text-accent">~/hackathons</span>
              <span>status: synced locally</span>
              <span>mode: in-app reminders</span>
            </div>
            <h1 className="font-mono text-3xl font-semibold leading-tight text-foreground sm:text-5xl">
              hackathonctl
              <span className="block text-accent">track --active --deadline-aware</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              One dense workspace for opportunities, build progress, task debt, source links, and submission readiness.
            </p>
          </div>
          <div className="rounded-md border border-border bg-secondary p-3 font-mono text-xs text-muted-foreground">
            <div className="text-accent">$ next_action</div>
            <div className="mt-2 text-foreground">close {urgentCount} urgent loops</div>
            <div className="mt-1">today: Apr 25, 2026</div>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="active" value={activeCount} command="track --active" />
          <Metric label="urgent" value={urgentCount} command="deadline --queue" tone="warning" />
          <Metric label="open tasks" value={taskDebt} command="tasks --debt" tone="danger" />
          <Metric label="submitted" value={submittedCount} command="ship --done" tone="success" />
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5">
            <Panel title="track --board" action="filter, scan, select">
              <div className="mb-4 grid gap-2 md:grid-cols-[1fr_auto_auto]">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="grep by title, platform, theme..."
                  className="min-h-10 rounded-md border border-input bg-input px-3 font-mono text-sm text-foreground outline-none transition focus:border-ring"
                />
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as Status | "all")}
                  className="min-h-10 rounded-md border border-input bg-input px-3 font-mono text-sm text-foreground outline-none transition focus:border-ring"
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                <select
                  value={platformFilter}
                  onChange={(event) => setPlatformFilter(event.target.value as Platform | "all")}
                  className="min-h-10 rounded-md border border-input bg-input px-3 font-mono text-sm text-foreground outline-none transition focus:border-ring"
                >
                  <option value="all">all sources</option>
                  {platforms.map((platform) => (
                    <option key={platform} value={platform}>{platform}</option>
                  ))}
                </select>
              </div>

              <div className="grid gap-3">
                {filteredHackathons.map((hackathon) => {
                  const urgent = urgencyFor(hackathon.submissionDeadline);
                  const percent = progress(hackathon.tasks);
                  return (
                    <button
                      key={hackathon.id}
                      onClick={() => setSelectedId(hackathon.id)}
                      className={`group rounded-md border p-4 text-left transition hover:-translate-y-0.5 hover:border-ring hover:bg-secondary ${
                        selectedHackathon.id === hackathon.id ? "border-ring bg-secondary" : "border-border bg-card"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs text-accent">{hackathon.platform}</span>
                            <Badge>{hackathon.status}</Badge>
                            <Badge tone={hackathon.priority === "critical" ? "danger" : hackathon.priority === "high" ? "warning" : "muted"}>{hackathon.priority}</Badge>
                          </div>
                          <h2 className="mt-2 font-mono text-lg font-semibold text-foreground">{hackathon.title}</h2>
                          <p className="mt-1 text-sm text-muted-foreground">{hackathon.theme}</p>
                        </div>
                        <Badge tone={urgent.tone}>{urgent.command}</Badge>
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                        <div>
                          <div className="mb-1 flex justify-between font-mono text-xs text-muted-foreground">
                            <span>progress</span>
                            <span>{percent}%</span>
                          </div>
                          <div className="h-2 rounded-sm bg-muted">
                            <div className="h-full rounded-sm bg-primary" style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                        <div className="font-mono text-xs text-muted-foreground">
                          submit: <span className="text-foreground">{hackathon.submissionDeadline}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Panel>

            <Panel title="capture --source" action="paste now, classify later">
              <form onSubmit={captureOpportunity} className="grid gap-3">
                <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                  <input
                    value={captureLink}
                    onChange={(event) => setCaptureLink(event.target.value)}
                    placeholder="paste Devpost, Devfolio, Kaggle, Discord, X, LinkedIn, or any URL/post..."
                    className="min-h-11 rounded-md border border-input bg-input px-3 font-mono text-sm text-foreground outline-none transition focus:border-ring"
                  />
                  <select
                    value={capturePlatform}
                    onChange={(event) => setCapturePlatform(event.target.value as Platform)}
                    className="min-h-11 rounded-md border border-input bg-input px-3 font-mono text-sm text-foreground outline-none transition focus:border-ring"
                  >
                    {platforms.map((platform) => (
                      <option key={platform} value={platform}>{platform}</option>
                    ))}
                  </select>
                </div>
                <textarea
                  value={captureNotes}
                  onChange={(event) => setCaptureNotes(event.target.value)}
                  placeholder="why this might be worth tracking, sponsor notes, prize, deadline hints..."
                  className="min-h-20 resize-none rounded-md border border-input bg-input px-3 py-2 font-mono text-sm text-foreground outline-none transition focus:border-ring"
                />
                <button className="min-h-11 rounded-md border border-primary bg-primary px-4 font-mono text-sm font-semibold text-primary-foreground transition hover:opacity-90">
                  queue --review
                </button>
              </form>
              <div className="mt-4 grid gap-2">
                {captures.map((capture) => (
                  <div key={capture.id} className="rounded-md border border-border bg-secondary p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
                      <Badge>{capture.platform}</Badge>
                      <span className="text-muted-foreground">{capture.createdAt}</span>
                    </div>
                    <p className="mt-2 break-words font-mono text-sm text-foreground">{capture.link}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{capture.notes}</p>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <aside className="space-y-5">
            <Panel title="deadline --queue" action="in-app reminders">
              <div className="grid gap-2">
                {deadlineQueue.map((item) => {
                  const urgent = urgencyFor(item.date);
                  return (
                    <div key={`${item.hackathon.id}-${item.type}`} className="rounded-md border border-border bg-secondary p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-mono text-xs text-accent">{item.type} deadline</div>
                          <div className="mt-1 text-sm font-semibold text-foreground">{item.hackathon.title}</div>
                        </div>
                        <Badge tone={urgent.tone}>{urgent.label}</Badge>
                      </div>
                      <div className="mt-2 font-mono text-xs text-muted-foreground">{item.date} · {urgent.command}</div>
                    </div>
                  );
                })}
              </div>
            </Panel>

            <Panel title="submit --progress" action={selectedHackathon.title}>
              <div className="mb-4 rounded-md border border-border bg-secondary p-3">
                <div className="font-mono text-xs text-accent">selected</div>
                <h2 className="mt-1 font-mono text-xl font-semibold text-foreground">{selectedHackathon.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{selectedHackathon.notes}</p>
              </div>
              <div className="grid gap-2">
                {selectedHackathon.tasks.map((task) => {
                  const urgent = urgencyFor(task.due);
                  return (
                    <label key={task.id} className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-card p-3 transition hover:bg-secondary">
                      <input
                        type="checkbox"
                        checked={task.done}
                        onChange={() => toggleTask(selectedHackathon.id, task.id)}
                        className="mt-1 h-4 w-4 accent-[var(--primary)]"
                      />
                      <span className="min-w-0 flex-1">
                        <span className={`block text-sm ${task.done ? "text-muted-foreground line-through" : "text-foreground"}`}>{task.label}</span>
                        <span className="mt-1 block font-mono text-xs text-muted-foreground">due {task.due}</span>
                      </span>
                      <Badge tone={task.done ? "success" : urgent.tone}>{task.done ? "done" : urgent.label}</Badge>
                    </label>
                  );
                })}
              </div>
            </Panel>

            <Panel title="notes --assets" action="links, docs, repo">
              <div className="grid gap-2">
                {selectedHackathon.assets.map((asset) => (
                  <div key={asset} className="flex items-center justify-between gap-3 rounded-md border border-border bg-secondary p-3 font-mono text-xs">
                    <span className="break-all text-foreground">{asset}</span>
                    <span className="text-accent">linked</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-md border border-border bg-card p-3">
                <div className="font-mono text-xs text-accent">prize / upside</div>
                <p className="mt-1 text-sm text-muted-foreground">{selectedHackathon.prize}</p>
              </div>
            </Panel>
          </aside>
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value, command, tone = "default" }: { label: string; value: number; command: string; tone?: "default" | "warning" | "danger" | "success" }) {
  return (
    <div className="rounded-md border border-border bg-card/85 p-4 shadow-[var(--shadow-terminal)] backdrop-blur">
      <div className="flex items-center justify-between gap-2 font-mono text-xs text-muted-foreground">
        <span>{label}</span>
        <Badge tone={tone === "default" ? "muted" : tone}>{command}</Badge>
      </div>
      <div className="mt-4 font-mono text-4xl font-semibold text-foreground">{value}</div>
    </div>
  );
}

function Panel({ title, action, children }: { title: string; action: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-border bg-card/85 p-4 shadow-[var(--shadow-terminal)] backdrop-blur">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <h2 className="font-mono text-sm font-semibold text-foreground">{title}</h2>
        <span className="font-mono text-xs text-muted-foreground">{action}</span>
      </div>
      {children}
    </section>
  );
}

function Badge({ children, tone = "muted" }: { children: React.ReactNode; tone?: string }) {
  const toneClass =
    tone === "danger"
      ? "border-destructive bg-destructive/15 text-destructive"
      : tone === "warning"
        ? "border-warning bg-warning/15 text-warning"
        : tone === "success"
          ? "border-success bg-success/15 text-success"
          : tone === "info"
            ? "border-info bg-info/15 text-info"
            : "border-border bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex max-w-full items-center rounded-sm border px-2 py-1 font-mono text-[11px] leading-none ${toneClass}`}>
      {children}
    </span>
  );
}

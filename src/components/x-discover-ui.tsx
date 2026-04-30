import { useXDiscover } from "./x-discover-panel";
import type { XSearchTweet } from "@/lib/server";

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card/90 p-5 shadow-[var(--shadow-terminal)] backdrop-blur">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <h2 className="font-mono text-sm font-semibold text-foreground flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-sm bg-accent opacity-60" />
          {title}
        </h2>
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
    <span
      className={`inline-flex max-w-full items-center rounded-sm border px-2 py-1 font-mono text-[11px] leading-none ${toneClass}`}
    >
      {children}
    </span>
  );
}

function inferPlatformFromUrl(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes("devpost")) return "Devpost";
  if (lower.includes("devfolio")) return "Devfolio";
  if (lower.includes("kaggle")) return "Kaggle";
  if (lower.includes("discord")) return "Discord";
  if (lower.includes("twitter") || lower.includes("x.com")) return "X";
  if (lower.includes("linkedin")) return "LinkedIn";
  return "Other";
}

function extractHackathonNameFromTweet(text: string): string {
  const named = text.match(
    /(?:hackathon|challenge|competition|bounty|sprint)\s*[:—-]\s*([^\n|]{4,80})/i,
  );
  if (named) return named[1].trim().slice(0, 64);

  const firstLine = text.split("\n").find((line) => line.trim().length > 3);
  if (firstLine) {
    return firstLine
      .replace(/https?:\/\/\S+/g, "")
      .replace(/#/g, "")
      .replace(/@\w+/g, "")
      .trim()
      .slice(0, 64);
  }

  return "X Hackathon";
}

function extractDeadlineFromTweet(text: string): string | null {
  const explicitDate = text.match(/\b(20\d{2})[-/.](0?[1-9]|1[0-2])[-/.](0?[1-9]|[12]\d|3[01])\b/);
  if (explicitDate) {
    const [, year, month, day] = explicitDate;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${year}-${pad(Number(month))}-${pad(Number(day))}`;
  }

  const namedMonth = text.match(
    /\b(?:deadline|due|ends|submission|submit by|closes|register by|apply by)?\s*:?[\s-]*((?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s*(20\d{2}))?/i,
  );
  if (namedMonth) {
    const monthIndex = [
      "jan",
      "feb",
      "mar",
      "apr",
      "may",
      "jun",
      "jul",
      "aug",
      "sep",
      "oct",
      "nov",
      "dec",
    ].findIndex((month) => namedMonth[1].toLowerCase().startsWith(month));
    if (monthIndex !== -1) {
      const year = Number(namedMonth[3] ?? new Date().getFullYear());
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${year}-${pad(monthIndex + 1)}-${pad(Number(namedMonth[2]))}`;
    }
  }

  return null;
}

export function XDiscoverPanel({
  onImport,
}: {
  onImport: (discovered: {
    id: string;
    title: string;
    platform: "Devpost" | "Devfolio" | "Kaggle" | "Discord" | "X" | "LinkedIn" | "Other";
    source: string;
    theme: string;
    status: "watching";
    priority: "critical" | "high" | "medium" | "low";
    registrationDeadline: string;
    submissionDeadline: string;
    prize: string;
    location: string;
    openState: string;
    timeLeft: string;
  }) => void;
}) {
  const { items, loading, error, query, setQuery, hasNext, search, removeItem, clear } =
    useXDiscover();

  function importTweet(tweet: XSearchTweet) {
    const url = tweet.urls[0] || tweet.source || "";
    const platform = inferPlatformFromUrl(url) as
      | "Devpost"
      | "Devfolio"
      | "Kaggle"
      | "Discord"
      | "X"
      | "LinkedIn"
      | "Other";

    const extractedDeadline = extractDeadlineFromTweet(tweet.text);
    const now = new Date();
    const fallbackSubmit = new Date(now);
    fallbackSubmit.setDate(fallbackSubmit.getDate() + 14);
    const pad = (n: number) => String(n).padStart(2, "0");
    const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    const submissionDeadline = extractedDeadline || fmt(fallbackSubmit);
    const registration = new Date(submissionDeadline);
    registration.setDate(registration.getDate() - 3);
    const registrationDeadline = fmt(registration);

    const daysUntil = Math.ceil(
      (new Date(submissionDeadline).getTime() - now.getTime()) / 86_400_000,
    );
    const priority: "critical" | "high" | "medium" | "low" =
      daysUntil <= 3 ? "critical" : daysUntil <= 7 ? "high" : "medium";

    const title = extractHackathonNameFromTweet(tweet.text);

    onImport({
      id: `x-${tweet.id}`,
      title,
      platform,
      source: url || tweet.source,
      theme: tweet.text.slice(0, 120),
      status: "watching",
      priority,
      registrationDeadline,
      submissionDeadline,
      prize: "Review tweet for prize details.",
      location: "Online",
      openState: "open",
      timeLeft: `${Math.max(0, daysUntil)}d left`,
    });

    removeItem(tweet.id);
  }

  return (
    <Panel title="import --x" action="scan, extract, track">
      <div className="mb-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='query: hackathon OR "register now" min_faves:3'
          className="min-h-10 rounded-md border border-input bg-input px-3 font-mono text-sm text-foreground outline-none transition focus:border-ring w-full"
        />
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <button
          onClick={() => search()}
          disabled={loading}
          className="min-h-9 rounded-md border border-primary bg-primary px-3 font-mono text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "scanning..." : "search --x"}
        </button>
        {hasNext && (
          <button
            onClick={() => search("next")}
            disabled={loading}
            className="min-h-9 rounded-md border border-border bg-secondary px-3 font-mono text-xs text-foreground transition hover:bg-muted disabled:opacity-50"
          >
            next --page
          </button>
        )}
        {items.length > 0 && (
          <button
            onClick={clear}
            className="min-h-9 rounded-md border border-destructive bg-destructive/10 px-3 font-mono text-xs text-destructive transition hover:bg-destructive/20"
          >
            clear
          </button>
        )}
      </div>

      {error && (
        <div className="mb-3 rounded-md border border-destructive bg-destructive/10 p-3 font-mono text-xs text-destructive">
          error: {error}
        </div>
      )}

      <div className="grid gap-2 max-h-96 overflow-y-auto pr-1">
        {items.length === 0 && !loading && (
          <div className="py-4 text-center font-mono text-xs text-muted-foreground">
            no results. run a search.
          </div>
        )}

        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border border-border bg-card p-4 transition hover:bg-secondary/60"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="info">@{item.username}</Badge>
                  <Badge tone="muted">
                    ♥ {item.likeCount} · ↻ {item.retweetCount}
                  </Badge>
                  {item.urls.length > 0 && (
                    <Badge tone="success">
                      {item.urls.length} link{item.urls.length > 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
                <p className="mt-2 text-sm text-foreground line-clamp-3 leading-relaxed">
                  {item.text}
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => importTweet(item)}
                  className="rounded-md border border-success bg-success/10 px-2.5 py-1.5 font-mono text-[11px] font-semibold text-success transition hover:bg-success/20"
                >
                  import
                </button>
                <button
                  onClick={() => removeItem(item.id)}
                  className="rounded-md border border-border bg-muted px-2.5 py-1.5 font-mono text-[11px] text-muted-foreground transition hover:bg-secondary"
                >
                  dismiss
                </button>
              </div>
            </div>
            {item.urls.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {item.urls.map((url) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all font-mono text-[11px] text-accent hover:underline"
                  >
                    {url.slice(0, 60)}
                    {url.length > 60 ? "..." : ""}
                  </a>
                ))}
              </div>
            )}
            {item.hashtags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {item.hashtags.map((tag) => (
                  <span key={tag} className="font-mono text-[11px] text-muted-foreground">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </Panel>
  );
}

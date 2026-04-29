import { createServerFn } from "@tanstack/react-start";

// ── Devpost ──

type DevpostHackathon = {
  title: string;
  url: string;
  submission_period_dates: string;
  prize_amount: string;
  themes: Array<{ name: string }>;
  displayed_location: { location: string };
  open_state: string;
  time_left_to_submission: string;
};

function parseDevpostDateRange(range: string): { start: string; end: string } | null {
  // e.g. "Apr 09 - May 20, 2026" or "Mar 04 - May 11, 2026"
  const match = range.match(
    /([A-Za-z]{3})\s+(\d{1,2})\s+-\s+([A-Za-z]{3})\s+(\d{1,2}),?\s+(\d{4})/,
  );
  if (!match) return null;

  const [, startMonth, startDay, endMonth, endDay, year] = match;
  const monthMap: Record<string, number> = {
    jan: 0,
    feb: 1,
    mar: 2,
    apr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    aug: 7,
    sep: 8,
    oct: 9,
    nov: 10,
    dec: 11,
  };

  const startM = monthMap[startMonth.toLowerCase()];
  const endM = monthMap[endMonth.toLowerCase()];
  if (startM === undefined || endM === undefined) return null;

  const pad = (n: number) => String(n).padStart(2, "0");
  const start = `${year}-${pad(startM + 1)}-${pad(Number(startDay))}`;
  const end = `${year}-${pad(endM + 1)}-${pad(Number(endDay))}`;
  return { start, end };
}

export const fetchDevpostHackathons = createServerFn({ method: "GET" }).handler(async () => {
  const res = await fetch("https://devpost.com/api/hackathons?per_page=40&page=1");
  if (!res.ok) throw new Error(`Devpost API error: ${res.status}`);
  const data = await res.json();

  const hackathons: DevpostHackathon[] = data.hackathons ?? [];

  return hackathons
    .map((h) => {
      const dates = parseDevpostDateRange(h.submission_period_dates);
      if (!dates) return null;
      return {
        id: `devpost-${h.url.replace(/https?:\/\//, "")}`,
        title: h.title.trim(),
        platform: "Devpost" as const,
        source: h.url,
        theme: h.themes.map((t) => t.name).join(", ") || "General",
        status: "watching" as const,
        priority: "medium" as const,
        registrationDeadline: dates.start,
        submissionDeadline: dates.end,
        prize: h.prize_amount.replace(/<[^>]+>/g, ""),
        location: h.displayed_location?.location || "Online",
        openState: h.open_state,
        timeLeft: h.time_left_to_submission,
      };
    })
    .filter(Boolean) as Array<{
    id: string;
    title: string;
    platform: "Devpost";
    source: string;
    theme: string;
    status: "watching";
    priority: "medium";
    registrationDeadline: string;
    submissionDeadline: string;
    prize: string;
    location: string;
    openState: string;
    timeLeft: string;
  }>;
});

// ── Devfolio ──

type DevfolioHackathon = {
  name: string;
  slug: string;
  tagline: string;
  starts_at: string;
  ends_at: string;
  city: string | null;
  country: string | null;
  is_online: boolean;
};

export const fetchDevfolioHackathons = createServerFn({ method: "GET" }).handler(async () => {
  const res = await fetch("https://api.devfolio.co/api/hackathons?page=1");
  if (!res.ok) throw new Error(`Devfolio API error: ${res.status}`);
  const data = await res.json();

  const hackathons: DevfolioHackathon[] = data.result ?? [];
  const now = new Date();
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() + 3); // show hackathons within 3 months

  return hackathons
    .map((h) => {
      const start = new Date(h.starts_at);
      const end = new Date(h.ends_at);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
      if (end < now) return null; // skip past hackathons
      if (start > cutoff) return null; // skip too far in future

      const pad = (n: number) => String(n).padStart(2, "0");
      const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      const location = h.is_online
        ? "Online"
        : [h.city, h.country].filter(Boolean).join(", ") || "Unknown";

      return {
        id: `devfolio-${h.slug}`,
        title: h.name.trim(),
        platform: "Devfolio" as const,
        source: `https://${h.slug}.devfolio.co/`,
        theme: h.tagline || "General",
        status: "watching" as const,
        priority: "medium" as const,
        registrationDeadline: fmt(start),
        submissionDeadline: fmt(end),
        prize: "Review source for prizes and tracks.",
        location,
        openState: "open",
        timeLeft: `${Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86_400_000))} days left`,
      };
    })
    .filter(Boolean) as Array<{
    id: string;
    title: string;
    platform: "Devfolio";
    source: string;
    theme: string;
    status: "watching";
    priority: "medium";
    registrationDeadline: string;
    submissionDeadline: string;
    prize: string;
    location: string;
    openState: string;
    timeLeft: string;
  }>;
});

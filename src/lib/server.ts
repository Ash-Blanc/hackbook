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

// ── X / Twitter Search ──

export type XSearchTweet = {
  id: string;
  text: string;
  createdAt: string;
  username: string;
  userDisplayName: string;
  likeCount: number;
  retweetCount: number;
  replyCount: number;
  urls: string[];
  hashtags: string[];
  source: string; // tweet URL
};

function extractUrlsFromTweet(tweet: Record<string, unknown>): string[] {
  const urls: string[] = [];
  // TwitterAPI.io format
  if (Array.isArray(tweet.urls)) {
    for (const u of tweet.urls) {
      if (typeof u === "object" && u !== null) {
        const expanded = (u as Record<string, unknown>).expanded_url;
        const display = (u as Record<string, unknown>).display_url;
        if (typeof expanded === "string" && expanded) urls.push(expanded);
        else if (typeof display === "string" && display) urls.push(`https://${display}`);
      }
    }
  }
  // ScrapeBadger format
  if (Array.isArray(tweet.urls)) {
    for (const u of tweet.urls) {
      if (typeof u === "object" && u !== null) {
        const expanded = (u as Record<string, unknown>).expanded_url;
        if (typeof expanded === "string" && expanded && !urls.includes(expanded))
          urls.push(expanded);
      }
    }
  }
  // Fallback: extract from text
  const text = String(tweet.text || tweet.full_text || "");
  const found = text.match(/https?:\/\/[^\s]+/g);
  if (found) {
    for (const u of found) {
      const clean = u.replace(/[),.;]+$/, "");
      if (!urls.includes(clean)) urls.push(clean);
    }
  }
  return urls;
}

function extractHashtagsFromTweet(tweet: Record<string, unknown>): string[] {
  const tags: string[] = [];
  if (Array.isArray(tweet.hashtags)) {
    for (const h of tweet.hashtags) {
      if (typeof h === "object" && h !== null) {
        const text = (h as Record<string, unknown>).text;
        if (typeof text === "string") tags.push(text.toLowerCase());
      }
    }
  }
  return tags;
}

function normalizeTweetFromTwitterAPI(raw: Record<string, unknown>): XSearchTweet {
  const urls = extractUrlsFromTweet(raw);
  const hashtags = extractHashtagsFromTweet(raw);
  const authorObj =
    typeof raw.author === "object" && raw.author !== null
      ? (raw.author as Record<string, unknown>)
      : {};
  const author = String(raw.userName || authorObj.userName || "unknown");
  const displayName = String(raw.name || authorObj.name || author);
  const tweetId = String(raw.id || "");
  const tweetUrl = tweetId ? `https://x.com/${author}/status/${tweetId}` : "";

  return {
    id: tweetId,
    text: String(raw.text || ""),
    createdAt: String(raw.createdAt || raw.created_at || ""),
    username: author,
    userDisplayName: displayName,
    likeCount: Number(raw.likeCount || raw.favorite_count || 0),
    retweetCount: Number(raw.retweetCount || raw.retweet_count || 0),
    replyCount: Number(raw.replyCount || raw.reply_count || 0),
    urls,
    hashtags,
    source: tweetUrl,
  };
}

function normalizeTweetFromScrapeBadger(raw: Record<string, unknown>): XSearchTweet {
  const urls = extractUrlsFromTweet(raw);
  const hashtags = extractHashtagsFromTweet(raw);
  const username = String(raw.username || raw.user_id || "unknown");
  const displayName = String(raw.user_name || username);
  const tweetId = String(raw.id || "");
  const tweetUrl = tweetId ? `https://x.com/${username}/status/${tweetId}` : "";

  return {
    id: tweetId,
    text: String(raw.full_text || raw.text || ""),
    createdAt: String(raw.created_at || ""),
    username,
    userDisplayName: displayName,
    likeCount: Number(raw.favorite_count || raw.likeCount || 0),
    retweetCount: Number(raw.retweet_count || raw.retweetCount || 0),
    replyCount: Number(raw.reply_count || raw.replyCount || 0),
    urls,
    hashtags,
    source: tweetUrl,
  };
}

export const searchXTwitterAPI = createServerFn({ method: "GET" })
  .inputValidator((data: { query: string; cursor?: string }) => data)
  .handler(async ({ data }) => {
    const apiKey = process.env.TWITTERAPI_IO_KEY;
    if (!apiKey) throw new Error("TWITTERAPI_IO_KEY not configured");

    const params = new URLSearchParams({
      query: data.query,
      queryType: "Latest",
      cursor: data.cursor || "",
    });

    const res = await fetch(
      `https://api.twitterapi.io/twitter/tweet/advanced_search?${params.toString()}`,
      {
        headers: { "X-API-Key": apiKey },
      },
    );

    if (!res.ok)
      throw new Error(`TwitterAPI.io error: ${res.status} ${await res.text().catch(() => "")}`);
    const json = await res.json();

    const tweets: Record<string, unknown>[] = json.tweets || [];
    return {
      tweets: tweets.map(normalizeTweetFromTwitterAPI),
      hasNextPage: Boolean(json.has_next_page),
      nextCursor: String(json.next_cursor || ""),
    };
  });

export const searchXScrapeBadger = createServerFn({ method: "GET" })
  .inputValidator((data: { query: string; cursor?: string }) => data)
  .handler(async ({ data }) => {
    const apiKey = process.env.SCRAPEBADGER_API_KEY;
    if (!apiKey) throw new Error("SCRAPEBADGER_API_KEY not configured");

    const params = new URLSearchParams({
      query: data.query,
      query_type: "Latest",
      count: "20",
    });
    if (data.cursor) params.set("cursor", data.cursor);

    const res = await fetch(
      `https://scrapebadger.com/v1/twitter/tweets/advanced_search?${params.toString()}`,
      {
        headers: { "x-api-key": apiKey },
      },
    );

    if (!res.ok)
      throw new Error(`ScrapeBadger error: ${res.status} ${await res.text().catch(() => "")}`);
    const json = await res.json();

    const tweets: Record<string, unknown>[] = json.data || [];
    return {
      tweets: tweets.map(normalizeTweetFromScrapeBadger),
      hasNextPage: Boolean(json.next_cursor),
      nextCursor: String(json.next_cursor || ""),
    };
  });

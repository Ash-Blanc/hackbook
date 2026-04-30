import { useState } from "react";
import { searchXTwitterAPI, searchXScrapeBadger, type XSearchTweet } from "@/lib/server";

type MergedResult = {
  tweets: XSearchTweet[];
  hasNextPage: boolean;
  nextCursor: string;
  errors: string[];
};

function dedupeTweets(tweets: XSearchTweet[]): XSearchTweet[] {
  const seen = new Set<string>();
  return tweets.filter((t) => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });
}

function mergeResults(
  results: { tweets: XSearchTweet[]; hasNextPage: boolean; nextCursor: string }[],
): MergedResult {
  const allTweets = results.flatMap((r) => r.tweets);
  const tweets = dedupeTweets(allTweets);
  const hasNextPage = results.some((r) => r.hasNextPage);
  const nextCursor = results.find((r) => r.hasNextPage)?.nextCursor || "";
  return { tweets, hasNextPage, nextCursor, errors: [] };
}

export function useXDiscover() {
  const [items, setItems] = useState<XSearchTweet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState(
    "hackathon OR hackathon submission OR register now min_faves:3",
  );
  const [cursor, setCursor] = useState("");
  const [hasNext, setHasNext] = useState(false);

  async function search(nextCursor?: string) {
    setLoading(true);
    setError("");
    try {
      const twitterPromise = searchXTwitterAPI({ data: { query, cursor: nextCursor || "" } })
        .then((r) => ({ ok: true as const, result: r, source: "twitterapi" as const }))
        .catch((e) => ({
          ok: false as const,
          error: e instanceof Error ? e.message : "TwitterAPI failed",
          source: "twitterapi" as const,
        }));

      const scrapePromise = searchXScrapeBadger({ data: { query, cursor: nextCursor || "" } })
        .then((r) => ({ ok: true as const, result: r, source: "scrapebadger" as const }))
        .catch((e) => ({
          ok: false as const,
          error: e instanceof Error ? e.message : "ScrapeBadger failed",
          source: "scrapebadger" as const,
        }));

      const [twitter, scrape] = await Promise.all([twitterPromise, scrapePromise]);

      const successes: { tweets: XSearchTweet[]; hasNextPage: boolean; nextCursor: string }[] = [];
      const errors: string[] = [];

      if (twitter.ok) {
        successes.push(twitter.result);
      } else {
        errors.push(twitter.error);
      }

      if (scrape.ok) {
        successes.push(scrape.result);
      } else {
        errors.push(scrape.error);
      }

      if (successes.length === 0) {
        setError(errors.join("; "));
        return;
      }

      const merged = mergeResults(successes);

      if (nextCursor) {
        setItems((prev) => dedupeTweets([...prev, ...merged.tweets]));
      } else {
        setItems(merged.tweets);
      }
      setHasNext(merged.hasNextPage);
      setCursor(merged.nextCursor);

      if (errors.length > 0 && successes.length > 0) {
        // silently degrade — one provider worked
        console.warn("X discover partial failure:", errors.join("; "));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((p) => p.id !== id));
  }

  function clear() {
    setItems([]);
    setCursor("");
    setHasNext(false);
    setError("");
  }

  return {
    items,
    loading,
    error,
    query,
    setQuery,
    hasNext,
    cursor,
    search,
    removeItem,
    clear,
  };
}

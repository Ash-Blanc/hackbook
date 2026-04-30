import { useState } from "react";
import { searchXTwitterAPI, searchXScrapeBadger, type XSearchTweet } from "@/lib/server";

export type XProvider = "twitterapi" | "scrapebadger";

export function useXDiscover() {
  const [items, setItems] = useState<XSearchTweet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [provider, setProvider] = useState<XProvider>("twitterapi");
  const [query, setQuery] = useState(
    "hackathon OR hackathon submission OR register now min_faves:3",
  );
  const [cursor, setCursor] = useState("");
  const [hasNext, setHasNext] = useState(false);

  async function search(nextCursor?: string) {
    setLoading(true);
    setError("");
    try {
      const fn = provider === "twitterapi" ? searchXTwitterAPI : searchXScrapeBadger;
      const result = await fn({ data: { query, cursor: nextCursor || "" } });

      if (nextCursor) {
        setItems((prev) => [...prev, ...result.tweets]);
      } else {
        setItems(result.tweets);
      }
      setHasNext(result.hasNextPage);
      setCursor(result.nextCursor);
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
    provider,
    setProvider,
    query,
    setQuery,
    hasNext,
    cursor,
    search,
    removeItem,
    clear,
  };
}

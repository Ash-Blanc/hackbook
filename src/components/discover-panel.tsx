import { useState } from "react";
import { fetchDevpostHackathons, fetchDevfolioHackathons } from "@/lib/server";

export type DiscoveredHackathon = {
  id: string;
  title: string;
  platform: "Devpost" | "Devfolio";
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
};

export function useDiscover() {
  const [items, setItems] = useState<DiscoveredHackathon[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadDevpost() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchDevpostHackathons();
      setItems((prev) => {
        const existing = new Set(prev.map((p) => p.id));
        const next = data.filter((d) => !existing.has(d.id));
        return [...prev, ...next];
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Devpost fetch failed");
    } finally {
      setLoading(false);
    }
  }

  async function loadDevfolio() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchDevfolioHackathons();
      setItems((prev) => {
        const existing = new Set(prev.map((p) => p.id));
        const next = data.filter((d) => !existing.has(d.id));
        return [...prev, ...next];
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Devfolio fetch failed");
    } finally {
      setLoading(false);
    }
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((p) => p.id !== id));
  }

  return { items, loading, error, loadDevpost, loadDevfolio, removeItem };
}

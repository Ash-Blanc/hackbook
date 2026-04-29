import { DiscoveredHackathon, useDiscover } from "./discover-panel";

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
    <span
      className={`inline-flex max-w-full items-center rounded-sm border px-2 py-1 font-mono text-[11px] leading-none ${toneClass}`}
    >
      {children}
    </span>
  );
}

export function DiscoverPanel({
  onImport,
}: {
  onImport: (hackathon: DiscoveredHackathon) => void;
}) {
  const { items, loading, error, loadDevpost, loadDevfolio, removeItem } = useDiscover();

  return (
    <Panel title="import --discover" action="devpost, devfolio">
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={loadDevpost}
          disabled={loading}
          className="min-h-9 rounded-md border border-primary bg-primary px-3 font-mono text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          fetch --devpost
        </button>
        <button
          onClick={loadDevfolio}
          disabled={loading}
          className="min-h-9 rounded-md border border-info bg-info/10 px-3 font-mono text-xs font-semibold text-info transition hover:bg-info/20 disabled:opacity-50"
        >
          fetch --devfolio
        </button>
        {items.length > 0 && (
          <button
            onClick={() => items.forEach((i) => onImport(i))}
            className="min-h-9 rounded-md border border-success bg-success/10 px-3 font-mono text-xs font-semibold text-success transition hover:bg-success/20"
          >
            import --all ({items.length})
          </button>
        )}
      </div>

      {loading && (
        <div className="py-4 text-center font-mono text-xs text-muted-foreground">
          scanning sources...
        </div>
      )}

      {error && (
        <div className="mb-3 rounded-md border border-destructive bg-destructive/10 p-3 font-mono text-xs text-destructive">
          error: {error}
        </div>
      )}

      <div className="grid gap-2 max-h-80 overflow-y-auto pr-1">
        {items.length === 0 && !loading && (
          <div className="py-4 text-center font-mono text-xs text-muted-foreground">
            no discoveries yet. run a fetch.
          </div>
        )}

        {items.map((item) => (
          <div key={item.id} className="rounded-md border border-border bg-secondary p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={item.platform === "Devpost" ? "info" : "warning"}>
                    {item.platform}
                  </Badge>
                  <Badge tone="muted">{item.openState}</Badge>
                  <Badge tone="muted">{item.location}</Badge>
                </div>
                <h3 className="mt-1.5 font-mono text-sm font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">{item.theme}</p>
              </div>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => {
                    onImport(item);
                    removeItem(item.id);
                  }}
                  className="rounded-md border border-success bg-success/10 px-2 py-1 font-mono text-[11px] font-semibold text-success transition hover:bg-success/20"
                >
                  import
                </button>
                <button
                  onClick={() => removeItem(item.id)}
                  className="rounded-md border border-border bg-muted px-2 py-1 font-mono text-[11px] text-muted-foreground transition hover:bg-secondary"
                >
                  dismiss
                </button>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 font-mono text-[11px] text-muted-foreground">
              <span>reg: {item.registrationDeadline}</span>
              <span>·</span>
              <span>submit: {item.submissionDeadline}</span>
              <span>·</span>
              <span>{item.timeLeft}</span>
            </div>
            {item.prize && item.prize !== "Review source for prizes and tracks." && (
              <div className="mt-1.5 font-mono text-[11px] text-accent">{item.prize}</div>
            )}
          </div>
        ))}
      </div>
    </Panel>
  );
}

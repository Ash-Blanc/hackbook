# Hackbook

A command center for hackers who can't keep up.

Every day Twitter, Discord and LinkedIn flood with new hackathons. You screenshot the link, promise yourself you'll register later, and three days later it's already closed. Hackbook fixes that.

It is a single workspace to capture hackathon links in seconds, track deadlines without mental overhead, and run every build phase like a project manager who actually ships.

---

## What it does

| Feature                       | Why it matters                                                                                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Hybrid URL capture**        | Paste a link from any platform (Devpost, Devfolio, Kaggle, Twitter, Discord, LinkedIn). Hackbook stores it instantly so nothing gets buried in notification noise. |
| **Status pipeline**           | `watching → registered → building → submitted → archived`. Know exactly where every hackathon stands without opening ten tabs.                                     |
| **Per-hackathon tasks**       | Break each event into checklists with due dates. No more "oh I still need a demo video" at 23:55.                                                                  |
| **Priority + deadline radar** | `critical / high / medium / low` tags plus registration and submission deadlines. The right thing surfaces at the right time.                                      |
| **Asset links**               | Pin GitHub repos, pitch decks, demo videos and dataset cards directly to the hackathon card. Everything lives in one place.                                        |
| **Built for speed**           | Keyboard-friendly, no bloat. Open, capture, close. Back to hacking.                                                                                                |

---

## Tech stack

- **TanStack Start** — type-safe routing + server logic
- **React 19 + TypeScript** — UI layer
- **shadcn/ui + Tailwind CSS** — components
- **Bun** — runtime & package manager
- **Cloudflare Workers** — edge deployment target

---

## Quick start

```bash
# Clone
git clone https://github.com/Ash-Blanc/hackbook.git
cd hackbook

# Install (Bun preferred)
bun install

# Dev server
bun run dev

# Build for Cloudflare
bun run build
```

---

## Philosophy

> Hackathons are already chaotic. Your tooling shouldn't be.

Hackbook is opinionated:

- One screen, not a dashboard with twenty widgets.
- Capture first, organise later. Speed beats perfection.
- Deadlines are treated as hard constraints, not suggestions.
- Progress is visible. If it's not in Hackbook, it doesn't exist.

---

## Roadmap

- [ ] Calendar / timeline view
- [ ] Team collaboration (shared hackathon boards)
- [ ] Auto-import from Devpost / Devfolio APIs
- [ ] Post-hackathon retrospective notes
- [ ] Streak tracking (submissions, wins, learning logs)

---

## Contributing

Issues and PRs welcome. If you want to add a platform, improve the capture flow, or make the UX faster, open an issue first so we align on direction.

---

Built by [Ash Blanc](https://github.com/Ash-Blanc) to stop losing good hackathons to the timeline.

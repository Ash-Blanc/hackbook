## Plan: Hackathon Command Center

Build a sleek, lightweight, CLI-inspired web app that replaces the placeholder page with a focused dashboard for tracking hackathon opportunities, active submissions, deadlines, tasks, and notes.

## Core experience

1. **Dashboard overview**
   - Show key stats: active hackathons, upcoming deadlines, tasks due, and submitted projects.
   - Highlight urgent hackathons with countdowns and deadline severity.
   - Provide a compact “today/this week” command-center view so nothing slips through.

2. **Hackathon tracker**
   - Add a curated sample dataset for Devpost, Devfolio, Kaggle, Discord/X/LinkedIn-style opportunities.
   - Track each hackathon with: title, platform/source, URL, registration deadline, submission deadline, prize/benefit, theme, status, priority, and notes.
   - Support statuses such as `watching`, `registered`, `building`, `submitted`, and `archived`.
   - Add filters for status, platform, urgency, and search.

3. **Submission progress workspace**
   - For each active hackathon, show a checklist of progress tasks such as idea validation, team formed, repo created, prototype, demo video, final submission.
   - Include progress bars, due labels, and task completion toggles in the UI.
   - Add notes/assets fields for repo links, demo links, pitch docs, submission links, team notes, and idea notes.

4. **Hybrid source capture**
   - Include a “capture opportunity” panel where you can paste a URL or social post reference.
   - Let the user record where it came from: Devpost, Devfolio, Kaggle, Discord, X, LinkedIn, Other.
   - Store the source link, quick notes, inferred platform label, and “review later” status in the local app state.
   - Keep the first version lightweight; no account/API integration yet.

5. **In-app reminders only**
   - Add visual reminder logic inside the dashboard:
     - overdue
     - due today
     - due within 3 days
     - due this week
     - later
   - Use prominent CLI-style badges and a deadline queue rather than email/calendar notifications.

6. **CLI-inspired modern design**
   - Dark terminal-like interface with modern cards, thin borders, subtle grid/glow accents, monospace headings, and compact data-dense panels.
   - Use keyboard-command-inspired UI labels like `track --active`, `capture --source`, `submit --progress`.
   - Ensure responsive layout works on narrow and desktop screens.

## Pages and structure

This can start as a single focused app route at `/` because the main goal is a lightweight command center rather than a public marketing site. The app will include distinct internal panels instead of separate SEO content pages.

Suggested layout:

```text
/ Dashboard
  ├─ Top command bar + quick stats
  ├─ Deadline queue
  ├─ Active submissions board
  ├─ Capture opportunity panel
  ├─ Progress checklist panel
  └─ Notes/assets panel
```

## Technical notes

- Replace the placeholder `src/routes/index.tsx` with the full app UI.
- Update route metadata in `src/routes/__root.tsx` from the default Lovable title/description to match the hackathon tracker.
- Use existing React, TanStack Router, Tailwind CSS v4, and available UI components.
- Keep data in component state with realistic seeded examples for this first lightweight version.
- No database, authentication, scraping, or external API integrations in v1.
- Structure the code so a later version can add persistent storage, account login, scraping, or integrations without redesigning the UI.
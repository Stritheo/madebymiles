# CLAUDE.md — Project Instructions

This file is auto-read by Claude Code on every session. It is the canonical source of project rules.

## Project

Personal executive website for Miles Sowden at milessowden.au. Goal: win CEO, CXO, and NED roles in Australian insurance/financial services.

- **Stack:** Astro 6 + TypeScript + Tailwind CSS, static output
- **Hosting:** GitHub Pages, Cloudflare DNS proxy
- **CI/CD:** GitHub Actions, Discord notifications (#alerts, #reports)
- **Repo:** Stritheo/madebymiles on GitHub

## Design and content rules

- No emdashes, en-dashes, or ampersands (exception: P&L)
- No "me" in CTAs. No desperate positioning ("Open to opportunities")
- CTA text: direct and confident ("Contact", "Connect on LinkedIn", "Open WhatsApp")
- CEO-first lens: strategy, leadership, people first; AI is a capability not the identity
- "Growth" is contextualised: structural/strategic growth (alliances, channels, pricing), not pure revenue
- Apple x Tom Ford aesthetic: whitespace, restraint, typography
- All text responsive (no hard max-w that breaks alignment with card grids)
- Footer post-nominals: abbreviated form (GAICD, GDipAppFin)
- Scannable in 10 seconds, expandable to 1 minute

## CI/CD quality gate protocol

These rules prevent the class of error where CI checks are committed without verifying they pass in the target environment.

1. **Baseline before budget.** Never commit a CI threshold (Lighthouse, bundle size, test coverage) without first running it in GitHub Actions to establish a baseline. Set budgets at 1.5-2x the CI baseline, not the local or production value.

2. **Soft-fail first.** New quality gates must use `continue-on-error: true` for the first deploy. Only enforce (remove continue-on-error) after confirming the check passes green in CI.

3. **CI environment awareness.** GitHub Actions runners (ubuntu-latest) are ~2x slower than real users. External resources (Google Fonts, CDNs) add variable latency. All performance budgets must account for this delta.

4. **Test the test.** When adding any CI check (Lighthouse, audit, lint, type-check), trigger a manual `workflow_dispatch` run before merging to verify it passes. Do not assume local results will match CI.

5. **No silent failures.** Every CI job must either pass green or post to Discord #alerts. Never add a job that can fail silently.

6. **Isolate deploy jobs from quality gates.** Lighthouse, bundle budgets, and other quality checks must never block worker deploys or site deploys. In the workflow, quality gates and deploys run as independent parallel jobs. A Lighthouse budget failure must not prevent a worker fix from shipping.

7. **Verify deployment before iterating.** After pushing a fix, confirm it actually deployed to production before writing the next fix. Check the GitHub Actions run, not just the git push. Multiple rounds of "fixes" to the contact form were wasted because earlier fixes never deployed (blocked by an unrelated Lighthouse budget failure).

8. **Start minimal with dependencies.** Do not add libraries for simple tasks. Raw MIME for email, URLSearchParams for form encoding, explicit Turnstile render with polling instead of fragile onload callbacks. Every dependency is a future debugging surface.

## Observability

- **Dashboard:** Databricks Free Edition (AI/BI dashboards + Genie)
- **Data sources:** Cloudflare, Sentry, GitHub Actions, Google Search Console
- **Reports:** Weekly GenAI improvement proposals via GitHub Actions to Discord #reports
- **PRD:** See `docs/PRD-observability-and-design-integration.md` for full setup plan

## Technical notes

- CSP requires `script-src 'self' 'unsafe-inline'` because Astro bundles scripts as inline modules
- GitHub Pages ignores `_headers` files — use Cloudflare Transform Rules for HTTP headers
- Content collections use Astro 6 Content Layer API with `glob` loaders from `astro/loaders` (not the old `type: 'data'`/`type: 'content'` syntax). Config file is at `src/content.config.ts`.
- Skills collection: data/JSON in `src/content/skills/`. Work collection: content/markdown in `src/content/work/`.
- Turnstile verification: use `?render=explicit` with polling for `window.turnstile`, not `?onload=` callbacks. Load early (2s after page load), poll until ready, null-check token before sending requests.
- Contact channels: LinkedIn, WhatsApp, and Send a note form must appear consistently across homepage, /contact, and /fit pages. Footer has LinkedIn and WhatsApp only.
- Cloudflare Email Routing rejects Reply-To headers. The contact worker uses raw MIME without mimetext.

## User preferences

- Limited technical knowledge — explain in plain English
- Values design discipline and brand consistency
- Prefers direct action over lengthy proposals
- Wants persona-based review of significant content changes (board chair, search consultant, CEO peer)

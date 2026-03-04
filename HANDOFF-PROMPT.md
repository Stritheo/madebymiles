# Handoff Prompt — Continue in Claude Code

Read this file first, then read `PRD.md` and `ROADMAP.md` for full context.

---

## Current state

**Branch:** `main` (pushed to origin)
**Phase 1:** Complete and live at madebymiles.ai.
**Sprint 1.5 (immediate priorities):** Complete.
**PVT:** All checks passed. Site live, HTTPS, DNS, sitemap, Discord notifications all working.
**Security headers:** A+ on securityheaders.com. Cloudflare Transform Rules configured.

### What is live

**Pages:** Homepage, Contact (/contact), Privacy (/privacy)
**Infrastructure:** Cloudflare DNS (proxied), GitHub Pages, Discord (#alerts, #reports), UptimeRobot, Supabase, Sentry, Google Search Console, Dependabot.

### Homepage features
- Hero with headshot (desktop: right column, mobile: above CTAs)
- "What I bring" section: 4 capability blocks (Strategic Leadership, Business Transformation, People and Culture, Technology and AI)
- "Work and impact" section: 6 cards in 3x2 grid (SCI, CBA, Hollard, Suncorp, Westpac, Agentic Engineering)
- Role cards standardised: company name, role/scope subtitle, outcomes paragraph
- Closing section with Contact CTA
- Person JSON-LD with credentials, occupations, knowsAbout
- OG image set to headshot

### Contact page
- LinkedIn and WhatsApp cards with buttons pinned to bottom (flex/mt-auto)
- "Role fit" section: CEO/CXO, NED, Advisory

### Footer
- "Growth and Transformation. GAICD. GDipAppFin."
- LinkedIn, WhatsApp, Privacy links

### Technical
- CSP includes `script-src 'self' 'unsafe-inline'` (needed for Astro inline module scripts)
- Cloudflare Transform Rule CSP must match (user action: update the CSP value in Cloudflare dashboard)
- Title tag: "Miles Sowden | Insurance Executive, Growth and Transformation"
- Sitemap at /sitemap-index.xml, robots.txt references it
- Favicon: SVG "M" in brand colours

---

## Pending user action

- **Update Cloudflare Transform Rule:** Change the Content-Security-Policy header value to add `script-src 'self' 'unsafe-inline'` so the hamburger menu works. See SECURITY-HEADERS.md for the exact value.

---

## What to do next: Phase 2 — Credibility Engine

Per ROADMAP.md steps 2.1 through 2.7:

1. **AICD-aligned skill matrix** — Content Collection `src/content/skills/` with JSON schema. Build /experience page with grid component. CEO candidate lens first.
2. **5 case study pages** — Content Collection `src/content/work/`. Template: Role/context, Challenge, Approach, Outcomes, Reflection. Companies: SCI, CBA, Hollard, Suncorp, Westpac.
3. **Supabase analytics beacon** — Cloudflare Worker `/api/beacon`, sendBeacon on page_view, scroll_50, CTA clicks.
4. **Discord reporting cron Worker** — Daily visitor summary to #reports, weekly funnel to #reports.
5. **Lighthouse CI** — Add to GitHub Actions, thresholds: Perf 95, A11y 100, BP 95, SEO 95.

---

## Design and content rules

- No emdashes, en-dashes, or ampersands
- No "me" in CTAs
- CTA text: direct and confident ("Contact", "Connect on LinkedIn", "Open WhatsApp")
- No desperate positioning ("Open to opportunities")
- "Growth" is contextualised: structural/strategic growth (alliances, channels, pricing), not pure revenue growth
- CEO-first lens: strategy, leadership, people first; AI is a capability not the identity
- Apple x Tom Ford aesthetic: whitespace, restraint, typography
- All text content must be responsive (no hard max-w that breaks alignment with card grids)
- Footer tagline: post-nominals in abbreviated form (GAICD, GDipAppFin)
- Scannable in 10 seconds, expandable to 1 minute

## User preferences
- Limited technical knowledge, explain in plain English
- Values design discipline and brand consistency
- LinkedIn: "Led $1bn insurer | Growth and Transformation | MIT | GAICD"
- Profile data: `.claude/projects/-Users-milessowden-Projects-madebymiles/memory/miles-profile.md`

# Handoff Prompt — Continue in Claude Code

Read this file first, then read `PRD.md` and `ROADMAP.md` for full context. Infrastructure setup is complete (covered below).

---

## Current state

**Branch:** `main` (pushed to origin)
**Phase 1:** Complete. Site builds, 3 pages (home, contact, privacy), CI/CD with Discord notifications.

### What was completed this session

**Infrastructure (all manual setup done):**
- Cloudflare DNS proxied to GitHub Pages
- GitHub Pages on Stritheo/madebymiles (public repo)
- Discord: 2 channels (#alerts, #reports) with webhooks
- UptimeRobot monitoring with Discord integration
- Supabase (Oceania/Sydney, RLS enabled)
- Cloudflare Workers (Account ID and API token saved)
- Sentry (US, Browser JavaScript, Discord #alerts)
- Google Search Console verified
- GitHub Secrets: DISCORD_WEBHOOK_ALERTS, DISCORD_WEBHOOK_REPORTS, CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, SENTRY_DSN

**Code changes:**
- Homepage redesigned with CEO positioning (not just tech/AI)
- Header simplified: "Experience" and "Contact" text links, mobile hamburger
- Footer: tagline "Growth and Transformation. MIT. GAICD." aligned with LinkedIn
- Contact page: LinkedIn and WhatsApp cards, no "me" language, buttons pinned to bottom with flex/mt-auto
- Privacy page: plain language, published at /privacy
- CTA buttons: consistent 1.5px borders for aligned height
- "Work and impact" subheading: removed max-w-[720px] so text spans full grid width
- Closing section: moved max-w-[720px] from container to paragraph, fixing left-alignment
- Sitemap: @astrojs/sitemap, robots.txt updated
- Favicon: SVG with "M" in brand colors
- Deploy workflow: Discord success/failure notifications
- Dependabot: weekly npm and GitHub Actions updates
- SECURITY-HEADERS.md: Cloudflare Transform Rules guide
- Deleted: non-functional public/_headers, duplicate root CNAME

**NOT done (pending):**
- Cloudflare Transform Rules for HTTP security headers (guide user through SECURITY-HEADERS.md)
- Headshot not added to site yet (file at assets/images/miles-sowden-headshot.jpeg)

---

## Next sprint priorities (from persona review)

### Immediate (before Phase 2 code)
1. Add headshot to hero, contact page, default OG image
2. Add positioning statement to homepage ("CEO, CXO and NED roles")
3. Add Suncorp as 5th company card
4. Add 6th card: agentic engineering projects or volunteer/charity (3x2 grid balance, shows another dimension)
5. Spell out credentials (GAICD, MIT are cryptic to non-Australian audiences)
6. Add basic Person JSON-LD to homepage
7. Standardise scope data across role cards (title, team size, reporting line)
8. Improve title tag (too generic)

### Phase 2 (ROADMAP steps 2.1 through 2.7)
9. AICD-aligned skill matrix on /experience (CEO candidate lens first)
10. 5 case study pages (10-second scan card, 1-minute expandable detail)
11. Supabase analytics beacon
12. Discord reporting cron workers
13. Lighthouse CI

---

## Design and content rules

- No emdashes or en-dashes anywhere
- No ampersands, use "and"
- No "me" in CTAs
- CTA text: direct and confident ("Contact", "Connect on LinkedIn", "Open WhatsApp")
- No desperate positioning ("Open to opportunities")
- CEO-first lens: strategy, leadership, people first; AI is a capability not the identity
- Apple x Tom Ford aesthetic: whitespace, restraint, typography
- Footer tagline aligns with LinkedIn header
- Scannable in 10 seconds, expandable to 1 minute

## User preferences
- Limited technical knowledge, explain in plain English
- Values design discipline and brand consistency
- LinkedIn: "Led $1bn insurer | Growth and Transformation | MIT | GAICD"
- Profile data: `.claude/projects/-Users-milessowden-Projects-madebymiles/memory/miles-profile.md`

## What to do next

1. Run PVT checks against live site (see testing plan in session history)
2. Guide user through Cloudflare Transform Rules (SECURITY-HEADERS.md)
3. Begin next sprint with priorities above

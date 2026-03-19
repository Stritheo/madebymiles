# PRD: UX and Conversion Design

**Project:** milessowden.au
**Date:** 2026-03-19
**Status:** Tech debt cleared. Ready for UX design work.
**Related:** See `docs/PRD-observability-and-design-integration.md` for observability setup.

---

## Context

Personal executive site for Miles Sowden at milessowden.au. Goal: win CEO, CXO, and NED roles in Australian insurance/financial services. The site has five pages, a Fit Finder AI tool, and a Cloudflare Workers API backend.

### What was just completed (2026-03-19)

Two rounds of tech debt fixes across 17 files:

**Critical fixes (Commit 1):**
- PDF text length cap on extraction (cost protection)
- Rate limiting on Phase 2 detail endpoint (abuse prevention)
- Turnstile polling interval memory leak fixed
- HTML escaping on all Claude-generated output (XSS prevention)
- Client-side fetch timeouts (60s/150s)
- Mobile button responsiveness on Fit Finder unlock gate
- Constant-time JWT signature comparison
- Detail endpoint error code corrected (410 not 500)
- Contact meta description brand compliance fix

**Structural improvements (Commit 2):**
- Hover colour tokens added to Tailwind config (no more hardcoded hex)
- `src/site.config.ts` centralises LinkedIn/WhatsApp URLs
- Header nav routes deduplicated into single array
- CTA component external prop default flipped to match usage
- SQL injection risk removed from workflow files (parameterised queries)

### Design rules (from CLAUDE.md)

- No emdashes, en-dashes, or ampersands (exception: P&L)
- No "me" in CTAs. No desperate positioning ("Open to opportunities")
- CTA text: direct and confident ("Contact", "Connect on LinkedIn", "Open WhatsApp")
- CEO-first lens: strategy, leadership, people first; AI is a capability not the identity
- Apple x Tom Ford aesthetic: whitespace, restraint, typography
- All text responsive (no hard max-w that breaks alignment with card grids)
- Scannable in 10 seconds, expandable to 1 minute

---

## Current site architecture

### Pages

| Page | Purpose | Key UX elements |
|------|---------|-----------------|
| `/` (index) | Hero, leadership principles, work history, closing CTA | Scroll reveals, hover cards, 2 CTAs |
| `/experience` | AICD skill matrix, career timeline, credentials | 13 skills across 4 domains, rating badges |
| `/fit` | AI-powered role fit analysis | File upload, text paste, 2-phase analysis, unlock gate, shared URLs |
| `/contact` | LinkedIn + WhatsApp cards, role fit summary | 2 contact cards, role interest list |
| `/privacy` | Privacy policy with Fit Finder section | Expanded sections, anchor links |
| `/work/[slug]` | Individual work detail (markdown content) | Prose rendering, prev/next navigation |

### Components

| Component | Purpose |
|-----------|---------|
| `CTA.astro` | Primary/secondary link button, sm/md sizes, internal/external |
| `Card.astro` | Clickable card with accent border animation, hover lift |
| `Header.astro` | Fixed nav, mobile hamburger with max-height transition |
| `Footer.astro` | Dark footer, LinkedIn/WhatsApp links, privacy link |
| `Tag.astro` | Pill-style label |
| `Base.astro` | Layout wrapper, meta tags, CSP, fonts, scroll reveal observer |

### Design tokens (tailwind.config.mjs)

```
bg-primary:      #FAFAF9  (page background)
bg-card:         #FFFFFF  (card surfaces)
bg-dark:         #1A1F2E  (dark sections, primary buttons)
bg-dark-hover:   #151A26  (button hover)
text-primary:    #1A1A1A  (headings, body)
text-secondary:  #525252  (descriptions, captions)
text-accent:     #C87D5C  (warm copper - CTAs, borders, badges)
text-accent-hover: #B36F4F (accent hover state)
border-light:    #E5E5E5  (card borders, dividers)
border-light-hover: #D4D4D4 (border hover)

Font display:    DM Serif Display (headings)
Font body:       IBM Plex Sans (body text)
```

---

## Known UX issues (prioritised)

### High impact (affects conversion)

1. **Homepage closing CTA uses inline styles** instead of CTA component. Style drift risk, and the dark-section CTA uses `bg-text-accent` while the standard CTA uses `bg-bg-dark`. Inconsistent brand.

2. **Fit Finder unlock gate is vague.** "The depth is there. It belongs in a discussion, not on a screen." Users don't know what they'll get after clicking LinkedIn. No preview, no content teaser.

3. **No visible focus outlines** on any interactive elements. Keyboard users cannot see what they're interacting with. WCAG failure.

4. **Contact page has no fallback** for people who don't use LinkedIn or WhatsApp. Email is common in executive search.

5. **Fit Finder character counter disappears at 100+** characters. Confusing when user has typed enough but the hint vanishes.

### Medium impact (affects perception)

6. **Experience page skill cards have no interactivity.** No hover, no click, no expand. Users expect cards to do something.

7. **Privacy page is not collapsible.** Six sections all expanded creates a wall of text.

8. **Work detail pages have no print styles.** Hiring managers print these.

9. **Mobile hamburger menu has no focus trap.** Tab key escapes the menu.

10. **Headshot loaded twice** (mobile + desktop versions). Wastes bandwidth on mobile.

### Low impact (polish)

11. **Skeleton loader animates indefinitely.** Should stop or settle after timeout.
12. **Timeline cramped on mobile.** Two-column company/role layout doesn't have enough vertical spacing.
13. **No skip-to-content link** in header for screen readers.
14. **Shared Fit Finder links have no expiry warning.** Users don't know the 30-day limit.

---

## Conversion flow map

```
                     ┌─────────────┐
                     │   Google /   │
                     │  LinkedIn /  │
                     │   Referral   │
                     └──────┬──────┘
                            │
                     ┌──────▼──────┐
                     │  Homepage   │
                     │  (10s scan) │
                     └──────┬──────┘
                            │
                 ┌──────────┼──────────┐
                 │          │          │
          ┌──────▼──┐  ┌───▼────┐  ┌──▼───────┐
          │Experience│  │  Fit   │  │ Contact  │
          │  (AICD   │  │ Finder │  │(LinkedIn │
          │  matrix) │  │ (AI)   │  │WhatsApp) │
          └──────┬───┘  └───┬────┘  └──────────┘
                 │          │               ▲
                 │     ┌────▼─────┐         │
                 │     │ Unlock   │         │
                 │     │  Gate    ├─────────┘
                 │     └────┬─────┘
                 │          │
                 │     ┌────▼─────┐
                 │     │Full eval │
                 │     │+ cases   │
                 │     └──────────┘
                 │
          ┌──────▼──────┐
          │ Work detail │
          │ (per role)  │
          └─────────────┘
```

### Key conversion points
1. Homepage hero CTAs (Contact / Work and impact)
2. Fit Finder unlock gate (LinkedIn / WhatsApp)
3. Post-Fit Finder footer CTAs
4. Contact page cards
5. Experience page "Try the Fit Finder" CTA

---

## Audience personas (for review of UX changes)

| Persona | What they need | Time on site |
|---------|---------------|--------------|
| **Board Chair** | Governance credentials, track record, gravitas | 10-30 seconds |
| **Search Consultant** | Career progression, measurable outcomes, fit for brief | 1-3 minutes |
| **CEO Peer** | Leadership style, operating approach, cultural fit | 1-2 minutes |
| **NED Committee** | AICD alignment, independence, sector expertise | 30-60 seconds |

---

## Technical constraints

- **Stack:** Astro 5 + TypeScript + Tailwind CSS, static output
- **Hosting:** GitHub Pages, Cloudflare DNS proxy
- **CSP:** `script-src 'self' 'unsafe-inline'` (Astro inline modules)
- **External scripts:** Turnstile, Sentry (loaded in fit.astro and Base.astro)
- **API:** Cloudflare Workers (Fit Finder backend)
- **Content:** Skills data in JSON (`src/content/skills/`), work content in markdown (`src/content/work/`)
- **No JS framework:** vanilla TypeScript in Astro `<script>` tags, no React/Vue

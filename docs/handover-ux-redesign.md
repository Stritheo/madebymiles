# UX Redesign Handover Prompt

Copy this into a new Claude Code session (or Cowork) to continue the UX work.

---

## Prompt

I'm Miles Sowden. This is my personal executive site at milessowden.au, built to win CEO, CXO, and NED roles in Australian insurance/financial services.

A tech debt review was just completed (see the last 2 commits on the current branch). The codebase is clean. Now I want to focus on UX and conversion design.

### What to read first
1. `CLAUDE.md` -- project rules, design principles, brand constraints
2. `docs/PRD-ux-and-conversion.md` -- full UX audit, known issues, conversion flow map, audience personas, design tokens
3. `tailwind.config.mjs` -- the design system tokens
4. `src/site.config.ts` -- centralised constants (LinkedIn, WhatsApp URLs)

### What I want to work through

I want to explore options for improving the site's UX and conversion rate. The target audience is board chairs, search consultants, CEO peers, and NED committees. The site should feel like Apple x Tom Ford: whitespace, restraint, typography. Scannable in 10 seconds, expandable to 1 minute.

**Areas to explore (in rough priority order):**

1. **Fit Finder unlock gate redesign** -- The current gate ("The depth is there. It belongs in a discussion, not on a screen.") is too vague. Users don't know what they'll get. Explore options: content preview/teaser, clearer value proposition, softer gate, no gate. Consider that the gate is the primary conversion mechanism.

2. **Homepage conversion flow** -- The closing CTA section (dark background) uses inline styles instead of the CTA component, and the copy may not be compelling enough. The hero is strong but the path from hero to contact could be tighter.

3. **Contact page** -- No email option. No form. Only LinkedIn and WhatsApp. Is that enough for the executive search audience? Should there be a form or mailto link?

4. **Accessibility** -- No visible focus outlines anywhere. No skip-to-content link. Mobile menu has no focus trap. These are WCAG failures that matter for a professional site.

5. **Experience page interactivity** -- The AICD skill matrix is static. Could it be more engaging? Expandable cards? Hover details? Connection to Fit Finder?

6. **Mobile polish** -- Timeline spacing, card padding, button stacking have been partially fixed but the overall mobile experience needs a holistic review.

### How I want to work

- Show me mockups before writing code (ASCII wireframes, or describe the layout clearly)
- For each change, explain why from a conversion perspective
- Run changes past the three personas: board chair (10s scan), search consultant (1-3 min deep read), CEO peer (style/culture fit check)
- Keep it minimal. Every element must earn its place on the page.
- Follow CLAUDE.md rules strictly (no emdashes, no "me" in CTAs, no desperate positioning)

### What's already been fixed (don't redo these)
- XSS escaping on all Claude-generated output
- Mobile button responsiveness on Fit Finder unlock gate
- Hardcoded hover colours replaced with theme tokens
- WhatsApp/LinkedIn URLs centralised in site.config.ts
- Header nav routes deduplicated
- CTA component defaults corrected
- SQL injection in workflow files parameterised
- PDF extraction length cap, detail endpoint rate limiting, Turnstile memory leak, JWT timing comparison, fetch timeouts

Start by reading the PRD and CLAUDE.md, then propose 2-3 options for the Fit Finder unlock gate redesign with mockups.

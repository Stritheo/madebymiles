# Product Requirements Document — madebymiles.ai

**Owner:** Miles Sowden
**Last updated:** 2 March 2026
**Status:** Draft for review

---

## 1. Vision

**madebymiles.ai** is the definitive digital representation of Miles Sowden — designed to win CEO, CXO, and Non-Executive Director roles by making his mindset, skillset, and experience immediately accessible to human decision-makers *and* the LLMs that increasingly surface and summarise candidates.

It is not a corporate brochure. It is an executive signal — concise, evidence-based, and personality-rich — that works equally well when a board chair reads it on a phone, when an executive search consultant sends a link, or when an AI agent is asked *"Who has led insurance transformation in Australia?"*

The site should embody the same philosophy Miles brings to his work: **pragmatic outcomes for users come first**. The latest technology, data models, and AI sit safely, securely, and scalably in the background — powering the experience without being the experience. The human interface is primary. LLMs and AI agents have the option to consume the same content their own way, via a dedicated machine-readable layer (Markdown, structured data, `llms.txt`), not by scraping a UI built for humans.

---

## 2. Goals & Success Measures

| Goal | Measure |
|---|---|
| Win executive and NED roles | Inbound conversations from boards, search firms, and CEOs that reference the site |
| Demonstrate mindset + skillset + experience | Visitors can evaluate leadership fit within 60 seconds and deep-dive within 5 minutes |
| Be LLM-readable and retrievable | Structured data, semantic HTML, and clear prose that LLMs can parse, quote, and attribute |
| Serve as the canonical link from LinkedIn, resume, and bio | Single URL that extends every other professional touchpoint |
| Showcase character and curiosity (secondary) | Reflections and agentic engineering projects reveal how Miles thinks, not just what he's done |

---

## 3. Audiences

### Primary: Board Directors & Nomination Committees
- Evaluating candidates for CEO/CXO/NED appointments
- Need to quickly assess strategic capability, cultural fit, and leadership evidence
- Will often arrive via a forwarded link or search firm shortlist

### Primary: Executive Search Firms
- Building longlists and shortlists for insurance and financial services roles
- Need structured, quotable evidence to present to clients
- Value clear positioning, metrics, and scope of experience

### Secondary: AI Agents & LLMs
- Retrieval-augmented search, talent intelligence tools, and general-purpose assistants
- Need semantic structure, schema markup, and unambiguous factual claims
- Attribution requires a clear canonical URL and authorship signals

### Secondary: Peers, Collaborators & Industry
- People who know Miles or encounter his name in industry contexts
- Interested in what he's building, thinking about, and working on next

---

## 4. Design Principles

1. **Outcomes over technology** — The site demonstrates pragmatic impact for real users. Technology, AI, and data models are the enablers, not the headline. The same philosophy Miles applies to insurance transformation applies to this site.
2. **Evidence over adjectives** — Every claim is backed by a metric, a scope, or a specific outcome. No superlatives without substance.
3. **Scannable then deep** — The homepage answers "Who is this person and why should I care?" in 10 seconds. Case studies and the skill matrix reward deeper evaluation.
4. **Human-first, machine-accessible** — The primary interface is designed for humans. LLMs and AI agents access the same content through a parallel machine-readable layer (Markdown files, JSON-LD, `llms.txt`) — not by parsing a UI that wasn't built for them.
5. **Warm authority** — Professional but not corporate. The design and voice should feel like a confident, approachable leader — not a law firm.
6. **Fast and frictionless** — Sub-second loads. No cookie banners, no popups, no login walls. Every interaction earns the next click.

---

## 5. Information Architecture

```
madebymiles.ai
├── / ............................ Homepage (hero, capabilities, impact summary, CTA)
├── /experience .................. Skill matrix + career timeline
│   └── Skill matrix grid (domains × competencies, self-rated)
│   └── Career timeline with role scope and tenure
├── /work
│   ├── /work/sci ................ Case study: Strata Community Insurance
│   ├── /work/cba ................ Case study: Commonwealth Bank
│   ├── /work/hollard ............ Case study: Hollard Insurance
│   └── /work/westpac ............ Case study: Westpac
├── /reflections ................. Short-form writing on leadership, AI, insurance
│   └── Individual reflection posts
├── /projects .................... Agentic engineering & side projects
│   └── Individual project write-ups
└── /contact ..................... Contact hub (LinkedIn message, WhatsApp, links)
```

---

## 6. Technology

### Stack Decision: Astro

Migrate from static HTML to **Astro** — a content-focused static site generator that outputs zero JavaScript by default.

**Why Astro over Next.js:**
- Content-first architecture (Markdown/MDX for case studies, reflections, projects)
- Zero client-side JS by default — faster than Next.js for a content site
- Built-in support for structured data, RSS, sitemaps
- Component-based development without React/framework overhead
- Incremental adoption — can add interactive islands (React/Svelte) only where needed
- Deploys to GitHub Pages with a single GitHub Action

**Key technical choices:**
- **Content:** Astro Content Collections (type-safe Markdown/MDX)
- **Styling:** Tailwind CSS (utility-first, design-token friendly)
- **Structured data:** JSON-LD on every page (Person, Article, Organization schemas)
- **Hosting:** GitHub Pages (existing setup, free, fast CDN)
- **Analytics:** Plausible or Fathom (privacy-respecting, no cookie banner needed)
- **Contact:** LinkedIn deep-link messaging + WhatsApp `wa.me` link (no email forms)

---

## 7. Epics & Roadmap

### Epic 1 — Foundation & Migration
> Set up the Astro project, design system, and deploy pipeline. The existing site continues to work throughout.

**Scope:**
- Initialise Astro project with TypeScript
- Configure Tailwind CSS with the existing design tokens (colours, fonts, spacing)
- Create reusable layout and component library (Header, Footer, Card, CTA, Tag)
- Set up GitHub Actions for build and deploy to GitHub Pages
- Migrate the current homepage content into the new Astro structure
- Verify the deployed site matches the current site visually

**Exit criteria:** The Astro site is live on madebymiles.ai, visually identical to today, with a component-based architecture ready for new pages.

---

### Epic 2 — Contact & CTAs (LinkedIn + WhatsApp)
> Replace email mailto links with LinkedIn messaging and WhatsApp, making it effortless to start a conversation.

**Scope:**
- Replace all `mailto:` links with LinkedIn message deep-link (`https://www.linkedin.com/messaging/compose/?to=milessowden`)
- Add WhatsApp CTA using `https://wa.me/<number>?text=...` with a pre-filled professional greeting
- Create a dedicated `/contact` page with both channels, a brief "how I prefer to connect" note, and links to LinkedIn profile
- Update CTA copy: "Message me on LinkedIn" / "WhatsApp me"
- Ensure CTAs are prominent on every page (header + footer)

**Exit criteria:** No email addresses appear anywhere on the site. All CTAs route to LinkedIn messages or WhatsApp.

---

### Epic 3 — Skill Matrix & Experience Page
> Give boards and search firms a structured way to evaluate leadership fit across domains and competencies.

**Scope:**
- Design and build `/experience` page
- **Skill matrix:** Grid of domains (rows) × competencies (columns), each cell with a brief evidence statement
  - Domains: e.g. Insurance Operations, Pricing & Actuarial, Digital & AI, People & Culture, Strategy & Alliances, Risk & Governance
  - Competencies: e.g. Strategic Leadership, Execution & Delivery, Stakeholder Management, Commercial Acumen, Innovation & Technology, Team Development
  - Each cell: 1-2 sentence evidence snippet + link to relevant case study
- **Career timeline:** Chronological or reverse-chronological summary of roles with title, company, tenure, and one-line scope
- Responsive design — matrix works on mobile (horizontal scroll or stacked cards)
- Schema markup for the career timeline (Person schema with `hasOccupationExperience`)

**Exit criteria:** A board member can scan the skill matrix and within 2 minutes understand Miles's strengths, gaps, and evidence across key leadership dimensions.

---

### Epic 4 — Case Studies
> Expand the four work-and-impact cards into standalone pages with narrative, metrics, and context.

**Scope:**
- Create Astro Content Collection for case studies (`src/content/work/`)
- Build case study page template with consistent structure:
  - **Role & context** — Title, company, reporting line, team size, tenure
  - **Challenge** — What was the situation and why did it matter?
  - **Approach** — What strategic and operational choices were made?
  - **Outcomes** — Quantified results with specific metrics
  - **Reflection** — What was learned or what would be done differently?
- Write four case studies: SCI, CBA, Hollard, Westpac
- Update homepage project cards to link to their full case study
- Add prev/next navigation between case studies
- JSON-LD Article schema on each case study page

**Exit criteria:** Each case study is a compelling, self-contained page that a search firm could share directly with a client board.

---

### Epic 5 — LLM Readability & Machine-Readable Layer
> Build a parallel content layer purpose-built for LLMs and AI agents — so they consume content their own way, not by scraping the human UI.

**Scope:**

**Machine-readable content layer:**
- Create `/llms.txt` — a concise, structured plain-text file that follows the emerging `llms.txt` convention: who Miles is, what he does, key experience, skills, and how to contact him
- Create `/llms-full.txt` or `/miles-sowden.md` — a comprehensive Markdown version of the entire site content (career, case studies, skill matrix, reflections) in a single file that any LLM can consume in one fetch
- Auto-generate these files from the same Astro Content Collections that power the human site (single source of truth, never out of sync)
- Expose each case study and reflection as clean Markdown at a predictable URL (e.g. `/work/sci.md` or via content negotiation)

**Structured data:**
- Add JSON-LD `Person` schema to the homepage (name, title, experience, skills, sameAs links)
- Add JSON-LD `Article` schema to case studies and reflections
- Add `hasOccupationExperience` to the Person schema with structured role/company/tenure data
- Ensure all pages use semantic HTML5 elements (`<article>`, `<section>`, `<header>`, `<nav>`, `<main>`, `<aside>`)

**Discoverability:**
- Add `<meta>` descriptions that read as natural-language summaries, not keyword-stuffed SEO
- Add Open Graph and Twitter Card tags to every page (not just the homepage)
- Generate a comprehensive `sitemap.xml`
- Add a `<link rel="alternate" type="text/markdown">` tag on HTML pages pointing to the Markdown equivalent

**Validation:**
- Test with LLM retrieval: prompt Claude/ChatGPT/Perplexity with queries like "Who has led insurance AI transformation in Australia?" and verify madebymiles.ai content is retrievable and accurately represented
- Verify that an LLM reading `/llms-full.txt` can produce an accurate, attributed summary without needing to parse HTML

**Exit criteria:** An LLM can fetch a single Markdown file from the site and produce an accurate 200-word summary of Miles's career, capabilities, and preferred contact method — without ever touching the HTML.

---

### Epic 6 — Reflections
> Short-form writing that reveals how Miles thinks — on leadership, insurance, AI, and transformation.

**Scope:**
- Create Astro Content Collection for reflections (`src/content/reflections/`)
- Build `/reflections` listing page (reverse chronological, with title, date, and 1-line summary)
- Build individual reflection page template
- Write 3-5 initial reflections to seed the section. Possible topics:
  - Why culture eats strategy (and what to do about it)
  - What 20 years in insurance taught me about change
  - How I think about AI adoption in risk-averse organisations
  - The difference between managing and leading transformation
- Add reflections to the homepage as a "Latest thinking" section
- RSS feed for reflections

**Exit criteria:** The reflections section is live with at least 3 posts, accessible from the homepage and via direct URL.

---

### Epic 7 — Agentic Engineering Projects
> A secondary showcase of hands-on technical curiosity — projects Miles has built with AI tools and agentic workflows.

**Scope:**
- Create Astro Content Collection for projects (`src/content/projects/`)
- Build `/projects` listing page
- Build individual project page template with:
  - What it does
  - Why it was built
  - Tools and approach (e.g. Claude, Cursor, n8n, etc.)
  - What was learned
  - Link to repo or demo if applicable
- Write up 2-3 initial projects (e.g. this website itself, any automation or AI projects)
- Add to homepage as a "Building things" or "Side projects" teaser

**Exit criteria:** The projects section is live with at least 2 write-ups, showing technical fluency without overshadowing the executive narrative.

---

## 8. Phasing

```
Phase 1 — Replatform & Core        Epics 1 + 2          Foundation + Contact
Phase 2 — Credibility Engine        Epics 3 + 4          Skill Matrix + Case Studies
Phase 3 — Discoverability           Epic 5               LLM Readability + Structured Data
Phase 4 — Voice & Depth             Epics 6 + 7          Reflections + Projects
```

Each phase delivers a working, deployable site. No phase depends on a later phase.

---

## 9. Out of Scope (for now)

- Blog with comments or social sharing (reflections are one-way publishing)
- Email newsletter or mailing list
- Login or gated content
- Video or multimedia content
- E-commerce, paid advisory booking, or invoicing
- CMS or admin interface (content authored in Markdown via Git)
- Custom domain email (contact flows through LinkedIn/WhatsApp)

---

## 10. Open Questions

1. **WhatsApp number** — Which number should be used for the `wa.me` link? Is a dedicated number preferred?
2. **Skill matrix content** — Does Miles want to self-rate skills (e.g. 1-5) or prefer qualitative evidence statements only?
3. **Suncorp/Promina** — The README mentions this as past employment but it's not on the current site. Should it be a fifth case study?
4. **Photography** — Is there a professional headshot available for the site? Would add significant credibility for human visitors and image search.
5. **Analytics** — Does Miles want privacy-respecting analytics (Plausible/Fathom) or is GitHub Pages traffic sufficient?
6. **Domain** — Is `madebymiles.ai` the permanent domain? The `.ai` TLD aligns well with the positioning.

---

*This PRD is a living document. Update it as decisions are made and epics are completed.*

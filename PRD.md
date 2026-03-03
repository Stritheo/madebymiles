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
5. **Secure by default** — No cookies, no PII collection, no persistent storage. Uploaded documents are processed in memory and discarded. Security headers, SRI, and least-privilege architecture protect both Miles and every visitor.
6. **Warm authority** — Professional but not corporate. The design and voice should feel like a confident, approachable leader — not a law firm.
7. **Fast and frictionless** — Sub-second loads. No cookie banners, no popups, no login walls. Every interaction earns the next click.
8. **Maximum impact, minimum cost** — The architecture deliberately uses free tiers and static-first design. Variable running costs stay under $5/month. No service is adopted unless it earns its place.

---

## 5. Information Architecture

```
madebymiles.ai
├── / ............................ Homepage (hero, capabilities, impact summary, CTA)
├── /experience .................. Skill matrix + career timeline
│   └── Skill matrix grid (AICD-aligned domains × competencies)
│   └── Career timeline with role scope and tenure
├── /work
│   ├── /work/sci ................ Case study: Strata Community Insurance
│   ├── /work/cba ................ Case study: Commonwealth Bank
│   ├── /work/hollard ............ Case study: Hollard Insurance
│   └── /work/westpac ............ Case study: Westpac
├── /fit ......................... AI Role Matcher — upload a role description, see alignment
├── /reflections ................. Short-form writing on leadership, AI, insurance
│   └── Individual reflection posts
├── /projects .................... Agentic engineering & side projects
│   └── Individual project write-ups
├── /contact ..................... Contact hub (LinkedIn message, WhatsApp, links)
├── /privacy ..................... Privacy policy (plain language, no legalese)
├── /llms.txt .................... Machine-readable summary for LLMs
├── /llms-full.txt ............... Comprehensive Markdown for LLMs
└── /api/fit ..................... Cloudflare Worker endpoint (Fit Finder API)
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

### Solution Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         VISITORS                                 │
│      Board Chairs · Search Firms · LLMs · AI Agents              │
└──────────────┬───────────────────────────┬───────────────────────┘
               │ HTTPS                     │ HTTPS
               ▼                           ▼
┌──────────────────────────┐  ┌────────────────────────────────────┐
│   Cloudflare (Free)      │  │   Cloudflare Workers (Free)        │
│                          │  │                                    │
│  · DNS + CDN             │  │  · /api/fit endpoint               │
│  · Security headers      │  │  · Parse PDF/DOCX (in-memory)     │
│  · DDoS protection       │  │  · Call Claude Haiku API           │
│  · Web Analytics (RUM)   │  │  · Return match JSON               │
│  · Edge caching          │  │  · Rate limit (10/IP/day)          │
│  · HSTS + CSP            │  │  · No storage, no logging          │
│                          │  │                                    │
└──────────┬───────────────┘  └──────────┬─────────────────────────┘
           │                             │
           ▼                             ▼
┌──────────────────────────┐  ┌────────────────────────────────────┐
│   GitHub Pages (Free)    │  │   Anthropic API (Pay-per-use)      │
│                          │  │                                    │
│  · Static HTML/CSS/JS    │  │  · Claude Haiku 4.5                │
│  · Pre-rendered pages    │  │  · Prompt-cached candidate profile │
│  · /llms.txt             │  │  · ~$0.002 per analysis            │
│  · /llms-full.txt        │  │  · No data retention               │
│  · JSON-LD structured    │  │                                    │
│    data on every page    │  │                                    │
│  · Sitemap + RSS         │  │                                    │
└──────────────────────────┘  └────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                      BUILD PIPELINE (Free)                       │
│                                                                  │
│  GitHub Actions: lint → npm audit → build → Lighthouse CI        │
│                  → deploy to GitHub Pages → post to Discord      │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                  OBSERVABILITY → DISCORD (Free)                   │
│                                                                  │
│  Browser beacon ──→ Worker ──→ Supabase ──→ Cron ──→ Discord     │
│  (sendBeacon)       (/api/beacon) (Postgres)  (daily)            │
│                                                                  │
│  UptimeRobot ─────────────────────────────────→ #uptime-alerts   │
│  GitHub Actions ──────────────────────────────→ #build-deploys   │
│  Cloudflare Security API ──→ Cron Worker ────→ #security-threats │
│  Sentry ──────────────────────────────────────→ #build-deploys   │
│  Fit Finder Worker ──────────────────────────→ #fit-finder       │
│  Dependabot ──────────────────────────────────→ #dependency-alerts│
└──────────────────────────────────────────────────────────────────┘
```

**Design decisions:**
- **Static-first:** Every page is pre-rendered at build time. No server, no database, no container, no runtime to patch or scale.
- **Serverless-only for dynamic features:** The Fit Finder is the only dynamic component, running on Cloudflare Workers (V8 isolates, auto-scaling, free tier).
- **Build-time over runtime:** Structured data, sitemaps, RSS, `llms.txt`, and the machine-readable content layer are all generated during the Astro build — not computed on each request.
- **Zero persistent state:** Nothing is stored between requests. The site is stateless by design. This eliminates entire categories of risk (data breaches, backup failures, GDPR data subject requests).
- **Edge-native:** Cloudflare serves and protects everything from the edge. No origin server to expose.

**Key technical choices:**
- **Content:** Astro Content Collections (type-safe Markdown/MDX)
- **Styling:** Tailwind CSS (utility-first, design-token friendly)
- **Structured data:** JSON-LD on every page (Person, Article, Organization schemas)
- **Hosting:** GitHub Pages (existing setup, free, fast CDN)
- **Edge compute:** Cloudflare Workers (free tier — Fit Finder serverless function)
- **AI API:** Claude Haiku via Anthropic API (role matching in Fit Finder)
- **DNS & CDN:** Cloudflare free plan (security headers, Web Analytics, edge caching)
- **Analytics:** Cloudflare Web Analytics (free, cookie-free, privacy-respecting)
- **Monitoring:** UptimeRobot free tier + Lighthouse CI in GitHub Actions + custom analytics beacon (Workers KV)
- **Ops dashboard:** Discord server with webhook integrations — all alerts, reports, and metrics push to Discord channels
- **Funnel tracking:** Lightweight `sendBeacon` → Cloudflare Worker → Supabase Postgres → scheduled Discord reports
- **Analytics database:** Supabase free tier (500MB Postgres) — proper SQL for funnel queries, historical retention, no write limits
- **Contact:** LinkedIn deep-link messaging + WhatsApp `wa.me` link (no email forms)
- **Security:** CSP headers, SRI, no cookies, no PII, HSTS

---

## 7. Available Services & Accounts

Miles has access to the following services. The PRD uses only the subset needed — the rest are documented here for future reference.

**In use by this project:**

| Service | Role in project | Tier | Notes |
|---|---|---|---|
| **GitHub** | Repo, CI/CD, Pages hosting | Free (with Copilot Pro) | 2,000 Actions mins/month (public repos), 500 (private) |
| **Cloudflare** | DNS, CDN, Workers, Web Analytics | Free | Domain will point from Squarespace to Cloudflare nameservers |
| **Supabase** | Analytics database (Postgres) | Free (500MB, 50k MAU) | Replaces Workers KV for funnel tracking — proper SQL, no write limits |
| **Claude API** | Fit Finder LLM (Haiku) | Pay-per-use | ~$0.002/analysis. Also available: Claude Max subscription for Claude Code |
| **Discord** | Ops dashboard (webhooks) | Free | Server already created. 7 channels for observability |
| **UptimeRobot** | Uptime monitoring | Free (5 monitors) | Native Discord webhook integration |
| **Sentry** | JS error tracking | Free (5k events/month) | Native Discord integration |
| **Squarespace** | Domain registration | Paid (pre-paid) | DNS only — nameservers point to Cloudflare |

**Available but not currently needed:**

| Service | What it could do | Why not using (yet) |
|---|---|---|
| **Langflow** | Visual LLM prompt chain builder | Could simplify Fit Finder prompt iteration — evaluate during Epic 8 |
| **Firebase** | Realtime DB, auth, hosting | Supabase covers the DB need; GitHub Pages covers hosting |
| **Google Cloud** | Cloud Functions, storage, AI APIs | Cloudflare Workers covers serverless; would add complexity |
| **Vercel / Netlify** | Hosting with serverless + analytics | GitHub Pages is simpler and already working; Vercel is a viable alternative if Pages hits limits |
| **Gemini (free)** | Fallback LLM | If Claude API costs spike, Gemini could serve as Fit Finder fallback |
| **Mistral (free)** | Fallback LLM | Smaller models, good for cost-sensitive fallback |
| **Notion** | Content CMS | Markdown in Git is simpler for a single-author site |
| **Meta AI / Llama** | Open-source LLM | Self-hosted option — unnecessary given Claude API costs (~$0.10/month) |

**MCPs and integrations:** Will be identified and configured as needed during implementation. Miles has the infrastructure to make additional MCPs available.

**GitHub plan note:** Free tier with Copilot Pro. If the repo is public, GitHub Pages and 2,000 Actions minutes/month are available at no cost. If private, 500 minutes/month — still sufficient for this project's build frequency.

---

## 8. Epics & Roadmap

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
- Add WhatsApp CTA using `https://wa.me/61414185721?text=Hi%20Miles%2C%20I%20came%20across%20your%20site%20and%20would%20like%20to%20connect.` with a pre-filled professional greeting
- Create a dedicated `/contact` page with both channels, a brief "how I prefer to connect" note, and links to LinkedIn profile
- Update CTA copy: "Message me on LinkedIn" / "WhatsApp me"
- Ensure CTAs are prominent on every page (header + footer)

**Exit criteria:** No email addresses appear anywhere on the site. All CTAs route to LinkedIn messages or WhatsApp.

---

### Epic 3 — Skill Matrix & Experience Page (AICD-Aligned)
> Give boards, nomination committees, and search firms a structured way to evaluate leadership fit — using the same AICD/ASX framework they already work with.

**Why AICD alignment matters:**
The Australian Institute of Company Directors (AICD) publishes the standard framework for board skills matrices. ASX Corporate Governance Council Recommendation 2.2 (4th Edition) requires listed entities to "have and disclose a board skills matrix." Every nomination committee in Australia uses this format. Spencer Stuart, Korn Ferry, Heidrick & Struggles, Egon Zehnder, and Russell Reynolds all present candidates against it. By structuring Miles's profile in this exact format, the site:
- Speaks the language nomination committees already use
- Maps directly into how the SHREK firms (Spencer Stuart, Heidrick, Russell Reynolds, Egon Zehnder, Korn Ferry) present shortlisted candidates
- Can be overlaid directly onto a board's existing skills matrix to identify gap-fill potential
- Eliminates the translation step search consultants normally have to do between a CV and a matrix

**References:** [AICD Board Skills Matrix Guidance (PDF)](https://www.aicd.com.au/content/dam/aicd/pdf/tools-resources/director-tools/board/guidance-preparing-board-skills-matrix-director-tool.pdf) · [ASX CGC Principles, 4th Edition (PDF)](https://www.asx.com.au/content/dam/asx/about/corporate-governance-council/cgc-principles-and-recommendations-fourth-edn.pdf) · [AICD Board Composition Matrix, Sept 2024 (PDF)](https://www.aicd.com.au/content/dam/aicd/pdf/about/about-our-governance/board-composition-skills-matrix-web.pdf)

**Scope:**

**Skill matrix (AICD four-domain model):**
- Design and build `/experience` page
- Grid of skill domains (rows) grouped by AICD's four competency domains × rating (columns) with evidence

**Rating scale** (three-level, matching CBA and ASX 200 practice):

| Level | Definition | AICD equivalent |
|---|---|---|
| **Expert** | Substantial career experience in senior executive or director roles; has led at scale; can advise others | "Expert" — substantial career experience with tertiary qualifications |
| **Practised** | Significant direct experience and accountability; has operated with decision-making authority | "Substantial" — considerable experience at director/management level |
| **Awareness** | Working knowledge; has operated adjacent to this domain or has relevant training | Awareness level |

**Skill domains** (organised by AICD's four competency domains, tailored to Miles's strategic priorities):

*Domain 1 — Industry:*
| # | Skill Area | Notes |
|---|---|---|
| 1 | Insurance Operations & Underwriting | General insurance, strata, personal lines, commercial |
| 2 | Financial Services (Banking & Wealth) | CBA, Westpac, cross-sector experience |
| 3 | Pricing, Actuarial & Claims | Technical insurance disciplines |

*Domain 2 — Technical/Professional:*
| # | Skill Area | Notes |
|---|---|---|
| 4 | Technology, Digital & AI Transformation | Core positioning — digital and AI executive |
| 5 | Data, Analytics & Decision Science | Data strategy, ML, analytics capability build |
| 6 | Financial Acumen & P&L | Budget accountability, commercial performance |
| 7 | Risk Management | Enterprise risk, operational risk, cyber risk |
| 8 | Customer Experience & Distribution | Channel strategy, NPS, customer-led design |

*Domain 3 — Governance:*
| # | Skill Area | Notes |
|---|---|---|
| 9 | Corporate Governance & Regulatory | Board duties, APRA/ASIC, compliance frameworks |
| 10 | ESG & Sustainability | Climate risk, social impact (if applicable) |

*Domain 4 — Behavioural:*
| # | Skill Area | Notes |
|---|---|---|
| 11 | Strategic Leadership & Vision | Setting direction, strategic planning, M&A |
| 12 | People, Culture & Team Development | Building high-performance teams, inclusion, talent |
| 13 | Stakeholder Management & Alliances | Partnerships, alliances, exec stakeholder management |
| 14 | Change Management & Execution | Transformation delivery, program leadership |

- Each cell: rating level + 1-2 sentence evidence snippet + link to relevant case study
- Following AICD guidance: exclude basic competencies universally expected of directors (e.g. understanding of director duties)
- The matrix data is also the structured input for the Fit Finder (Epic 8)

**Career timeline:**
- Reverse-chronological summary of roles
- Each role: title, company, reporting line, team size, tenure, one-line scope
- Include term/tenure dates to support succession planning (per AICD recommendation)
- Schema markup (`Person` schema with `hasOccupationExperience`)

**SHREK team compatibility:**
- The skill matrix data is stored as structured JSON (Astro Content Collection), making it consumable by:
  - **Invenias / Bullhorn / FileFinder (Talentis)** — exec search CRM/ATS platforms that index candidate profiles
  - **Eightfold / SeekOut** — AI talent intelligence platforms that crawl structured web data and match on demonstrated capabilities
  - **LinkedIn Recruiter** — indexes Schema.org Person markup and `hasOccupationExperience`
  - **BoardEx / RelSci** — executive relationship intelligence platforms used by nomination committees
  - **Diligent / OnBoard** — board management software where nomination committees maintain their skills matrices
  - **Korn Ferry / Spencer Stuart** — both use proprietary assessment frameworks (KF's Executive Snapshot, SS's Board Intrinsics) that map to the same underlying skill domains
- The HTML matrix is also machine-readable via JSON-LD, aligning with HR Open Standards and Schema.org `Occupation`/`Role` schemas
- A search consultant can take the skill matrix data and directly overlay it onto their client board's existing AICD matrix to demonstrate gap-fill

**Responsive design:**
- Desktop: full grid with hover evidence tooltips, grouped by domain
- Tablet: horizontally scrollable matrix with sticky first column
- Mobile: stacked cards per domain, each showing rating badge + evidence text

**Exit criteria:** A nomination committee member can scan the skill matrix in the exact same format they use for board composition reviews under ASX Recommendation 2.2 — and within 2 minutes understand Miles's strengths, depth, and evidence across all four AICD competency domains.

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

### Epic 8 — AI Role Matcher ("Fit Finder")
> Let a potential hirer upload a role description or SOW and instantly see how Miles's skillset and mindset align — then invite them to start a conversation.

**Concept:**
A hiring manager, board chair, or search consultant visits `/fit` and uploads a role description (PDF, DOCX, or pasted text). A serverless function sends the document to Claude Haiku alongside Miles's structured skill and experience data. The system returns a personalised fit report:

- **Top skillset match** — The strongest alignment between the role's requirements and Miles's demonstrated capabilities, with evidence from case studies
- **Top mindset match** — The strongest alignment between the role's leadership culture/values and Miles's leadership philosophy, with evidence from reflections
- **Remaining matches** — Shown blurred/redacted with a clear CTA: *"Want to see the full picture? Let's talk."* → routes to LinkedIn message or WhatsApp

This is both a conversion mechanism and a demonstration of AI fluency — Miles walking the talk.

**Architecture:**

```
Browser (static Astro page)
    │
    ├── Upload / paste role description
    │
    ▼
Cloudflare Worker (serverless function)
    │
    ├── Parse document (PDF.js / mammoth.js for DOCX, or plain text)
    ├── Load Miles's structured profile (JSON, stored in Worker KV or bundled)
    ├── Call Claude Haiku API with role description + profile
    ├── Return structured match response
    │
    ▼
Browser renders fit report (top 2 visible, rest blurred, CTA)
```

**Scope:**
- Build `/fit` page with file upload (PDF, DOCX) and text paste input
- Build Cloudflare Worker serverless function:
  - Document parsing (extract text from uploaded files)
  - Structured prompt to Claude Haiku: compare role requirements against Miles's AICD-aligned skill matrix (14 domains across 4 competency areas), case study outcomes, and leadership philosophy
  - The prompt includes Miles's structured profile as a cached system prompt (JSON derived from the same Content Collection that powers the `/experience` page) — single source of truth
  - Return JSON: array of matches ranked by strength, each with category (skillset/mindset), AICD domain, evidence snippet, and confidence
- Build match result UI:
  - Top skillset match: fully visible with evidence
  - Top mindset match: fully visible with evidence
  - Remaining matches: blurred with CSS blur filter, revealed only after contact
  - CTA buttons: "Message me on LinkedIn" / "WhatsApp me"
- Miles's structured profile data as a JSON file (single source of truth, derived from content collections)
- Rate limiting: max 10 analyses per IP per day (prevent abuse, control cost)

**SHREK Team Integration:**
Search firms and hiring teams use platforms like Invenias, Bullhorn, FileFinder (CRM/ATS), LinkedIn Recruiter, BoardEx, RelSci (sourcing), and increasingly AI-powered talent intelligence tools like Eightfold and SeekOut. The Fit Finder positions madebymiles.ai as compatible with these workflows:
- Search consultants can paste a role brief directly from their ATS
- The structured JSON-LD on the site (Person schema, `hasOccupationExperience`) is consumable by talent intelligence crawlers
- The skill matrix and case studies mirror the structured data these platforms index
- The match report can be shared via a unique results URL (optional) — giving the search consultant something to attach to a candidate profile in their CRM

**Privacy & data handling:**
- Uploaded documents are processed in-memory by the Cloudflare Worker — **never persisted to disk, database, or logs**
- No PII is collected from the uploader (no login, no email capture)
- The Worker processes the document, calls the API, returns the result, and the document is garbage-collected
- Clear privacy notice on the upload page: *"Your document is processed in memory and immediately discarded. Nothing is stored."*
- No analytics on document content — only aggregate usage counts (number of analyses per day)

**Cost estimate:**
- Cloudflare Workers free tier: 100k requests/day (vastly more than needed)
- Claude Haiku: ~$0.25/1M input tokens, ~$1.25/1M output tokens
- A typical role description: ~2-3k tokens input + ~1k tokens output = ~$0.002 per analysis
- At 50 analyses/month: ~$0.10/month
- Well within $5/month budget

**Exit criteria:** A search consultant can paste a CEO role description and within 10 seconds see Miles's top skillset and mindset alignment with evidence, with a clear path to start a conversation.

---

### Epic 9 — Security, Privacy & Data Protection (By Design)
> Build privacy and security into every layer — and make it visible. The way this site handles data is itself a demonstration of how Miles approaches digital and AI leadership.

**Why this matters beyond compliance:**
Miles is a digital and AI executive. Every potential employer and board will evaluate not just what he says about privacy and security, but what they can *see and feel* in how his own site operates. The site should be a living example of privacy-by-design and security-by-default — the same principles Miles applies at work. No cookie banners because there are no cookies. No privacy policy full of exceptions because there's nothing to except.

**Privacy Impact Assessment (PIA):**

A lightweight PIA for the Fit Finder feature (the only data-processing component):

| PIA Element | Assessment |
|---|---|
| **Data collected** | Uploaded document (role description/SOW) — text only, no metadata extraction |
| **Data subject** | The hiring organisation, not the uploader (role descriptions describe the company's needs, not personal data) |
| **Sensitive data** | Possible — role descriptions may contain confidential remuneration, reporting lines, or strategic context |
| **Processing purpose** | One-time comparison against Miles's public skill profile; result returned to uploader |
| **Data storage** | None. Document processed in-memory in Cloudflare Worker isolate, then garbage-collected. Not written to disk, database, log, or any persistent medium |
| **Data sharing** | Document text sent to Anthropic API (Claude Haiku) for processing. Subject to Anthropic's API data policy: API inputs are not used for training and are not retained beyond the request lifecycle |
| **Data retention** | Zero. No document content, no uploader identity, no results are retained |
| **Cross-border transfer** | Document text transits to Anthropic API (US-hosted). No PII is involved. Anthropic's API terms apply |
| **Lawful basis (GDPR)** | Legitimate interest — the uploader initiates the analysis voluntarily. No PII is processed |
| **APPs compliance (Australian Privacy Principles)** | No personal information is collected, used, or disclosed. APPs do not apply to non-personal data |
| **Risk rating** | Low. No PII, no storage, no profiling, no automated decision-making affecting individuals |
| **Mitigations** | In-memory processing, rate limiting, file type/size validation, clear user-facing privacy notice, no logging of content |

**Threat model:**
- The site is mostly static (low attack surface), but the Fit Finder introduces a serverless function that accepts file uploads and calls an external API
- Uploaded role descriptions may contain confidential information about the hiring organisation
- Miles's personal positioning data is intentionally public but should not be manipulable (no XSS, no content injection)
- Potential risks: document exfiltration (mitigated by no-storage architecture), API key exposure (mitigated by server-side only), abuse/scraping (mitigated by rate limiting)

**Scope:**

**Privacy policy & disclosures (visible on-site):**
- Create a `/privacy` page with a clear, plain-language privacy policy
- Structure: What we collect (nothing), what happens when you use Fit Finder (in-memory processing, no storage), what analytics we use (Cloudflare Web Analytics — no cookies, no PII), your rights, contact
- No legalese — the policy itself should demonstrate Miles's approach to clear, respectful communication
- Link to privacy policy in the site footer on every page
- Inline privacy notice on the Fit Finder upload page: *"Your document is processed in memory and immediately discarded. Nothing is stored. The document text is sent to Anthropic's Claude API for analysis — Anthropic does not retain API inputs."*
- Display a "Privacy by design" or "No cookies. No tracking. No storage." signal in the footer — subtle but visible

**Transport & headers:**
- HTTPS everywhere (enforced by GitHub Pages / Cloudflare)
- Strict Content Security Policy (CSP) headers — no inline scripts, no external script sources except trusted CDNs
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` (prevent clickjacking)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- HSTS with `includeSubDomains` and `preload`

**Fit Finder security:**
- File upload validation: accept only PDF and DOCX, max 5MB, validate MIME type AND file header bytes (magic numbers) on both client and server
- Document processing in Cloudflare Worker isolate — sandboxed V8 runtime, no filesystem access, no persistent state
- Input sanitisation: strip any embedded scripts/macros from uploaded documents before text extraction
- Rate limiting: 10 requests per IP per day (prevents abuse and controls API costs)
- API key for Claude never exposed to the client — stored as Cloudflare Worker secret (encrypted at rest)
- No logging of document content — only aggregate operational metadata (request count, response time, error rate)
- Timeout: Worker terminates after 30 seconds to prevent resource exhaustion
- Uploaded file names are never read or stored — only the extracted text content is processed

**Data protection:**
- No cookies (no cookie banner needed — and that absence is itself a signal)
- No PII collection — no forms capture email, name, or any personal data
- No third-party tracking scripts (Google Analytics, Facebook Pixel, HubSpot, etc.)
- Privacy-respecting analytics only (Cloudflare Web Analytics — no cookies, no PII, free, first-party)
- GDPR/APPs compliance by design — there is genuinely nothing to comply with because nothing personal is collected or stored

**Supply chain:**
- Minimal dependencies — Astro builds to static HTML/CSS/JS, no runtime dependencies in production
- Dependabot or Renovate for automated dependency updates
- `npm audit` in CI pipeline — fail on critical/high vulnerabilities
- Subresource Integrity (SRI) hashes on any external resources (fonts, CDN scripts)
- Lock files committed to git (`package-lock.json`)

**Secrets management:**
- Claude API key stored as GitHub Actions secret (for build-time) and Cloudflare Worker secret (for runtime)
- No secrets in client-side code, environment files committed to git, or build output
- `.env` in `.gitignore` with `.env.example` documenting required variables (without values)

**Exit criteria:** The site scores A+ on securityheaders.com. The privacy policy is live at `/privacy`. No cookies, no PII, no persistent storage. A visitor — especially one evaluating Miles's approach to digital leadership — can see and feel that privacy and security are built in, not bolted on.

---

### Epic 10 — Cost Governance & Infrastructure
> Deliver the highest-impact executive site for under $5/month through deliberate architecture choices.

**Budget target:** ≤ $5 AUD/month total running cost

**Cost architecture:**

| Service | Purpose | Tier | Monthly cost |
|---|---|---|---|
| GitHub Pages | Static site hosting + CDN | Free | $0 |
| Cloudflare (free plan) | DNS, CDN, security headers, Web Analytics | Free | $0 |
| Cloudflare Workers | Fit Finder serverless function | Free (100k req/day) | $0 |
| Claude API (Haiku) | Role description analysis | Pay-per-use | ~$0.10 (est. 50 analyses) |
| Supabase | Analytics database (Postgres) | Free (500MB, 50k MAU) | $0 |
| Google Fonts | Typography (DM Serif Display, IBM Plex Sans) | Free | $0 |
| Domain (madebymiles.ai) | `.ai` TLD — already paid (Squarespace) | Paid | $0 (pre-paid) |
| **Total** | | | **< $1/month** |

**Domain setup (Squarespace → Cloudflare):**
The domain is registered and paid for at Squarespace. To use Cloudflare's free CDN, security, and Web Analytics without transferring the domain:
1. Add `madebymiles.ai` to Cloudflare (free plan) — Cloudflare will assign two nameservers
2. In Squarespace → Domains → `madebymiles.ai` → DNS Settings → Custom nameservers → enter the two Cloudflare nameservers
3. In Cloudflare DNS, add records pointing to GitHub Pages (`A` records for `185.199.108-111.153` + `CNAME` for `www`)
4. Enable Cloudflare proxy (orange cloud) for CDN, DDoS protection, and Web Analytics
5. Propagation: typically 24-48 hours
6. Alternative: transfer the domain to Cloudflare Registrar later (at-cost pricing, often cheaper than Squarespace renewal) — but not required

**Cost controls:**
- **Rate limiting** on Fit Finder: 10/IP/day hard cap, 200/month soft cap with alerting
- **Claude API spend cap**: Set a $5/month hard limit via Anthropic console billing alerts
- **No paid analytics** — Cloudflare Web Analytics is free and cookie-free
- **No paid monitoring** — free tiers of UptimeRobot + Sentry (see Epic 11)
- **No paid CI/CD** — GitHub Actions free tier (2,000 minutes/month for public repos, 500 for private)
- **No paid CDN** — Cloudflare free plan includes global CDN
- **Self-hosted fonts fallback** — If Google Fonts latency is an issue, self-host the two font files (~100KB total) to eliminate the external dependency entirely

**Architecture principles for cost:**
- Static-first: every page is pre-rendered HTML — no server, no database, no container
- Serverless-only: the one dynamic feature (Fit Finder) runs on Cloudflare Workers free tier
- Build-time over runtime: structured data, sitemaps, RSS, and LLM content files are all generated at build time
- Zero infrastructure to maintain: no servers to patch, no databases to back up, no containers to orchestrate

**Exit criteria:** The site runs for a full month with all features active and total variable costs (excluding domain) are under $1.

---

### Epic 11 — Observability & Discord Ops Dashboard
> Know exactly who's visiting, where they drop off, when the site is down, what threats are blocked, and how fast it loads — all reported to a Discord channel for free.

**Why Discord as the ops dashboard:**
Discord webhooks are free, unlimited, and support rich embeds (colour-coded, structured, with fields). Instead of paying for Datadog, PagerDuty, or checking five different dashboards, every signal routes to a single Discord server with channels for each concern. Miles checks one place. Everything is push-based — no dashboards to log into.

**Discord server structure:**

```
#site-visitors      ← Daily/weekly visitor reports, top pages, referrers
#funnel-tracking    ← Conversion funnel: landing → engagement → CTA click
#uptime-alerts      ← Downtime/recovery notifications (UptimeRobot)
#build-deploys      ← CI/CD pass/fail, Lighthouse scores per deploy
#security-threats   ← Threats blocked, rate limit hits, WAF events
#fit-finder         ← Usage counts, error rates, API spend
#dependency-alerts  ← Dependabot PRs, npm audit findings
```

**Signal routing — what posts where, and how:**

| Signal | Source | Discord channel | Delivery method | Cost |
|---|---|---|---|---|
| Uptime/downtime | UptimeRobot | `#uptime-alerts` | UptimeRobot native Discord webhook | $0 |
| Build pass/fail | GitHub Actions | `#build-deploys` | GitHub webhook or Actions step (`curl`) | $0 |
| Lighthouse scores | GitHub Actions | `#build-deploys` | CI step posts embed after each deploy | $0 |
| Visitor summary | Custom analytics beacon → Supabase | `#site-visitors` | Scheduled Worker (cron) → Discord webhook | $0 |
| Top pages + referrers | Custom analytics beacon → Supabase | `#site-visitors` | Scheduled Worker (cron) → Discord webhook | $0 |
| Funnel conversion | Custom beacon events → Supabase | `#funnel-tracking` | Scheduled Worker (cron) → Discord webhook | $0 |
| Drop-off points | Custom beacon events → Supabase | `#funnel-tracking` | Scheduled Worker (cron) → Discord webhook | $0 |
| CTA clicks | Custom beacon events → Supabase | `#funnel-tracking` | Scheduled Worker (cron) → Discord webhook | $0 |
| Threats blocked | Cloudflare Security Events API | `#security-threats` | Scheduled Worker → Cloudflare API → Discord | $0 |
| Rate limit hits | Cloudflare Worker (Fit Finder) | `#security-threats` | Worker posts to Discord on rate limit trigger | $0 |
| Fit Finder usage | Cloudflare Worker counter | `#fit-finder` | Scheduled Worker (cron) → Discord webhook | $0 |
| Fit Finder errors | Cloudflare Worker exceptions | `#fit-finder` | Worker `catch` block → Discord webhook | $0 |
| API spend estimate | Worker tracks token usage | `#fit-finder` | Scheduled Worker (cron) → Discord webhook | $0 |
| JS errors | Sentry free tier | `#build-deploys` | Sentry native Discord integration | $0 |
| Vulnerable deps | GitHub Dependabot | `#dependency-alerts` | GitHub webhook → Discord | $0 |

**Scope:**

**1. Custom analytics beacon (privacy-respecting, cookie-free):**

The site needs funnel and conversion tracking that Cloudflare Web Analytics alone can't provide. Build a lightweight, first-party analytics beacon:

```
Browser (every page)
    │
    ├── navigator.sendBeacon('/api/beacon', payload)
    │   Payload: { page, referrer, event, timestamp }
    │   No cookies. No fingerprinting. No PII.
    │
    ▼
Cloudflare Worker (/api/beacon)
    │
    ├── Validate & sanitise input
    ├── INSERT into Supabase Postgres (via REST API):
    │   ├── events table: { page, referrer, event_type, created_at }
    │   └── No PII stored. No IP logging. No user IDs.
    │
    ▼
Supabase (free tier: 500MB Postgres, 50k MAU, unlimited API requests)
    │
    ├── SQL views for reporting:
    │   ├── daily_pageviews    → COUNT(*) GROUP BY date
    │   ├── top_pages          → COUNT(*) GROUP BY page, date
    │   ├── top_referrers      → COUNT(*) GROUP BY referrer, date
    │   ├── funnel_steps       → COUNT(*) GROUP BY event_type, date
    │   └── conversion_rate    → funnel step comparisons
    │
    ▼
Scheduled Cloudflare Worker (cron) → queries Supabase → posts to Discord
```

**Why Supabase over Workers KV:**
- **No write limits** — Workers KV free tier caps at 1,000 writes/day (~125 page views). Supabase has no meaningful write limit on the free tier.
- **Real SQL** — Funnel queries, date ranges, GROUP BY, conversion calculations — all native SQL instead of counter arithmetic
- **Historical data** — Keep months of analytics data (500MB is years of event rows for a personal site). Workers KV would require daily counter resets.
- **Supabase REST API** — The Worker calls Supabase's auto-generated REST API (PostgREST) with the `anon` key. No direct Postgres connection needed.
- **Row Level Security** — Supabase RLS ensures the `anon` key can only INSERT events, not read or delete. The cron Worker uses the `service_role` key to read for reports.

**Supabase schema (minimal):**
```sql
CREATE TABLE events (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  page       text NOT NULL,
  referrer   text,
  event_type text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- RLS: anon can only insert
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_insert" ON events FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "service_read" ON events FOR SELECT TO service_role USING (true);

-- Reporting views
CREATE VIEW daily_summary AS
SELECT
  created_at::date AS day,
  COUNT(*) FILTER (WHERE event_type = 'page_view') AS pageviews,
  COUNT(DISTINCT page) AS unique_pages,
  COUNT(*) FILTER (WHERE event_type LIKE 'cta_%') AS cta_clicks
FROM events
GROUP BY created_at::date
ORDER BY day DESC;
```

**Tracked events (for funnel):**

| Event | Funnel step | Trigger |
|---|---|---|
| `page_view` | 1. Landing | Any page load |
| `scroll_50` | 2. Engagement | User scrolls past 50% of page |
| `skill_matrix_view` | 3. Evaluation | `/experience` page viewed |
| `case_study_click` | 4. Deep-dive | Any case study link clicked |
| `fit_finder_start` | 5. Intent | Fit Finder page reached |
| `fit_finder_complete` | 6. Analysis | Fit Finder result returned |
| `cta_click_linkedin` | 7. Conversion | LinkedIn CTA clicked |
| `cta_click_whatsapp` | 7. Conversion | WhatsApp CTA clicked |

**Drop-off analysis:** The scheduled report compares funnel step counts to calculate drop-off rates between each step (e.g. "35 visitors landed → 22 scrolled → 12 viewed skills → 5 clicked CTA → 2 used Fit Finder → 1 converted").

**2. Scheduled Discord reports (Cloudflare Workers cron triggers):**

| Report | Frequency | Channel | Content |
|---|---|---|---|
| **Daily summary** | 08:00 AEST | `#site-visitors` | Yesterday's visitors, top 5 pages, top 3 referrers, device split |
| **Weekly funnel** | Monday 08:00 | `#funnel-tracking` | Full 7-step funnel with conversion rates and drop-off percentages |
| **Weekly security** | Monday 08:00 | `#security-threats` | Threats blocked, countries, rate limit hits, WAF events |
| **Weekly performance** | Monday 08:00 | `#build-deploys` | Latest Lighthouse scores, Core Web Vitals averages |
| **Monthly Fit Finder** | 1st of month | `#fit-finder` | Analyses run, error rate, estimated API spend |

Discord embed format example (daily summary):
```json
{
  "embeds": [{
    "title": "📊 Daily Site Report — 1 Mar 2026",
    "color": 3447003,
    "fields": [
      { "name": "Visitors", "value": "47", "inline": true },
      { "name": "Page Views", "value": "89", "inline": true },
      { "name": "CTA Clicks", "value": "3", "inline": true },
      { "name": "Top Pages", "value": "1. /experience (31)\n2. / (24)\n3. /fit (12)" },
      { "name": "Top Referrers", "value": "1. linkedin.com (18)\n2. direct (15)\n3. google.com (9)" },
      { "name": "Funnel", "value": "Landing: 47 → Engaged: 28 → CTA: 3 (6.4%)" }
    ]
  }]
}
```

**3. Build pipeline (CI/CD):**
- GitHub Actions workflow: lint → build → test → deploy
- Astro build with `--strict` flag (fail on broken links, missing images, TypeScript errors)
- `npm audit` check in CI (fail on critical/high vulnerabilities)
- Lighthouse CI in GitHub Actions:
  - Performance ≥ 95
  - Accessibility ≥ 100
  - Best Practices ≥ 95
  - SEO ≥ 95
  - Fail the build if scores drop below thresholds
  - **Post Lighthouse scores to `#build-deploys` Discord channel** after each deploy
- Build status badge in README
- Deploy preview for PRs (GitHub Pages preview or Cloudflare Pages preview)
- **Build failure → Discord alert** via `curl` step in GitHub Actions

**4. Uptime monitoring:**
- UptimeRobot (free tier): 5 monitors, 5-minute check intervals
  - Monitor 1: `https://madebymiles.ai` (homepage HTTP 200)
  - Monitor 2: `https://madebymiles.ai/llms.txt` (LLM content layer)
  - Monitor 3: Fit Finder health endpoint (`/api/health`)
  - **Alert channel: `#uptime-alerts` via UptimeRobot's native Discord webhook integration**
- Public status page via UptimeRobot (optional, free)

**5. Performance monitoring:**
- Cloudflare Web Analytics (free): page views, top pages, countries, devices, Web Vitals — this runs in parallel with the custom beacon as a second source of truth
- Lighthouse CI scores tracked over time in GitHub Actions artifacts + posted to Discord
- Core Web Vitals targets:
  - LCP (Largest Contentful Paint): < 1.5s
  - FID (First Input Delay): < 50ms
  - CLS (Cumulative Layout Shift): < 0.05

**6. Security & threat monitoring:**
- **Cloudflare Security Events:** A scheduled Worker queries the Cloudflare GraphQL Analytics API (free) for:
  - Firewall events (blocked requests, challenged requests)
  - Bot score distribution
  - Top threat countries/IPs
  - WAF rule triggers
  - DDoS mitigation events
- Posts weekly summary to `#security-threats`
- **Real-time rate limit alerts:** The Fit Finder Worker posts to `#security-threats` whenever an IP hits the rate limit
- **Cloudflare Notifications (free):** Configure Cloudflare's built-in notifications for DDoS alerts, SSL expiry, etc. — these can email, but the scheduled Worker catches the rest for Discord

**7. Error tracking:**
- Sentry free tier (5k events/month): client-side JS errors (primarily Fit Finder)
  - **Sentry → Discord integration** (native, free) posts to `#build-deploys`
- Cloudflare Worker exceptions: logged in Cloudflare dashboard (free) + Worker `catch` block posts to `#fit-finder`
- GitHub Actions failure notifications: post to `#build-deploys`

**8. Alerting thresholds:**

| Alert | Threshold | Channel | Urgency |
|---|---|---|---|
| Site down | 5-minute check fails | `#uptime-alerts` | Immediate |
| Build failure | Any CI step fails | `#build-deploys` | Immediate |
| Lighthouse regression | Any score drops > 5 points | `#build-deploys` | Immediate |
| Rate limit hit | Any IP exceeds 10 req/day on Fit Finder | `#security-threats` | Informational |
| High threat volume | > 50 blocked requests/day | `#security-threats` | Daily digest |
| Fit Finder error | Any Worker exception | `#fit-finder` | Immediate |
| API spend approaching limit | Estimated spend > $3/month | `#fit-finder` | Monthly |
| Vulnerable dependency | Dependabot PR created | `#dependency-alerts` | Informational |

**Implementation order:**
1. **Phase 1 (with Foundation):** UptimeRobot → Discord, GitHub Actions → Discord (build/deploy notifications)
2. **Phase 2 (with Skill Matrix):** Custom analytics beacon + Supabase + daily/weekly Discord reports
3. **Phase 4 (with Fit Finder):** Fit Finder usage tracking, Sentry, rate limit alerts, API spend tracking, security event reporting

**Exit criteria:** Every signal in the table above routes to the correct Discord channel. A daily summary posts at 08:00 AEST. A weekly funnel report shows conversion rates and drop-off points. Build failures, downtime, and security threats trigger immediate alerts. Miles checks one Discord server and knows exactly how the site is performing.

---

## 9. Phasing

```
Phase 0 — Cross-Cutting              Epics 9 + 10 + 11    Security, Cost, Observability & Discord (woven into every phase)
Phase 1 — Replatform & Core          Epics 1 + 2           Foundation + Contact
Phase 2 — Credibility Engine         Epics 3 + 4           Skill Matrix + Case Studies
Phase 3 — Discoverability            Epic 5                LLM Readability + Structured Data
Phase 4 — AI Differentiator          Epic 8                Fit Finder (Role Matching)
Phase 5 — Voice & Depth              Epics 6 + 7           Reflections + Projects
```

**Phase 0** is not a sequential phase — it is embedded into every other phase. Security headers ship in Phase 1. Cost controls ship with the Fit Finder in Phase 4. Monitoring is configured in Phase 1 and extended as features are added.

Each phase delivers a working, deployable site. No phase depends on a later phase (except Phase 4 depends on Phase 2 for the skill matrix data that powers matching).

---

## 10. Out of Scope (for now)

- Blog with comments or social sharing (reflections are one-way publishing)
- Email newsletter or mailing list
- User accounts or login (the Fit Finder uses progressive disclosure without authentication)
- Video or multimedia content
- E-commerce, paid advisory booking, or invoicing
- CMS or admin interface (content authored in Markdown via Git)
- Custom domain email (contact flows through LinkedIn/WhatsApp)
- Server-side data storage beyond analytics (Supabase stores anonymous event counts only — no PII, no user data)
- Paid services beyond Claude API micro-usage (total budget ≤ $5/month variable cost)

---

## 11. Open Questions

1. ~~**WhatsApp number**~~ — Resolved: `+61414185721`. CTA link: `https://wa.me/61414185721?text=Hi%20Miles%2C%20...`
2. **Skill matrix rating approach** — The AICD recommends a three-level scale (Expert / Substantial / Awareness). Should Miles self-rate, or should each cell also include a qualitative evidence statement linking to a case study?
3. **Suncorp/Promina** — The README mentions this as past employment but it's not on the current site. Should it be a fifth case study?
4. ~~**Photography**~~ — Resolved: Professional headshot available (navy blazer, white shirt, glasses). Image saved to `assets/images/miles-sowden-headshot.jpg`. Will be used on homepage, `/contact`, and in Person schema `image` property for search/social previews.
5. ~~**Domain**~~ — Resolved: `madebymiles.ai` is registered and paid at Squarespace. DNS will point to Cloudflare nameservers (see Epic 10).
6. **Fit Finder — blurred results unlock** — Should the blurred matches unlock after contacting Miles (honour system), or should they remain permanently blurred as the conversion incentive?
7. **Fit Finder — results sharing** — Should each analysis generate a unique shareable URL so a search consultant can share the fit report with their client? (Requires minimal state — e.g. a short-lived signed URL with the result embedded, no server storage.)
8. **AICD membership** — Is Miles an AICD member or graduate of the Company Directors Course? This would strengthen the credibility of the AICD-aligned skill matrix.
9. **Privacy policy review** — Should the privacy policy be reviewed by a legal professional, or is a clear, self-authored plain-language policy sufficient for a personal site?

---

## 12. References

### Governance & Board Skills Frameworks
- [AICD Guidance for Preparing a Board Skills Matrix (PDF)](https://www.aicd.com.au/content/dam/aicd/pdf/tools-resources/director-tools/board/guidance-preparing-board-skills-matrix-director-tool.pdf)
- [AICD Board Composition and Skills Matrix, September 2024 (PDF)](https://www.aicd.com.au/content/dam/aicd/pdf/about/about-our-governance/board-composition-skills-matrix-web.pdf)
- [ASX Corporate Governance Principles and Recommendations, 4th Edition (PDF)](https://www.asx.com.au/content/dam/asx/about/corporate-governance-council/cgc-principles-and-recommendations-fourth-edn.pdf)
- [ASX Good Governance Guide: Creating and Disclosing a Board Skills Matrix (PDF)](https://www.asx.com.au/content/dam/asx/about/corporate-governance-council/creating-disclosing-board-skills-matrix.pdf)
- [AICD Director Tools Hub](https://www.aicd.com.au/tools-and-resources/director-tools.html)
- [AICD Key Competencies for Directors](https://www.aicd.com.au/board-of-directors/performance/skills-matrix/key-competencies-for-directors.html)
- [APRA: How a Skills Matrix Can Help Transform Board Capability](https://www.apra.gov.au/superannuation-how-a-skills-matrix-can-help-transform-board-capability)

### Executive Search & Talent Intelligence
- [Spencer Stuart Board Indexes](https://www.spencerstuart.com/research-and-insight/board-indexes)
- [Schema.org JobPosting](https://schema.org/JobPosting)
- [HR Open Standards — Recruiting](https://www.hropenstandards.org)
- [LinkedIn Recruiter System Connect](https://learn.microsoft.com/en-us/linkedin/talent/recruiter-system-connect)

### LLM Readability
- [llms.txt specification](https://llmstxt.org/)
- [Mintlify: What is llms.txt?](https://www.mintlify.com/blog/what-is-llms-txt)

### Technology & Services
- [Astro](https://astro.build/)
- [Cloudflare Workers](https://workers.cloudflare.com/)
- [Cloudflare Workers KV](https://developers.cloudflare.com/kv/)
- [Cloudflare Workers Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/)
- [Cloudflare GraphQL Analytics API](https://developers.cloudflare.com/analytics/graphql-api/)
- [Anthropic Claude API](https://docs.anthropic.com/en/docs/about-claude/models)
- [Cloudflare Web Analytics](https://www.cloudflare.com/web-analytics/)
- [Supabase](https://supabase.com/)
- [Supabase REST API (PostgREST)](https://supabase.com/docs/guides/api)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Discord Webhooks](https://discord.com/developers/docs/resources/webhook)
- [UptimeRobot](https://uptimerobot.com/)
- [UptimeRobot Discord Integration](https://blog.uptimerobot.com/how-to-set-up-discord-notifications-for-uptimerobot/)
- [Sentry Discord Integration](https://docs.sentry.io/organization/integrations/notification-incidents/discord/)
- [GitHub Actions Discord Webhook](https://github.com/marketplace/actions/discord-webhook-action)

---

*This PRD is a living document. Update it as decisions are made and epics are completed.*

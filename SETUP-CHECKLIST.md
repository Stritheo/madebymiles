# Setup Checklist — What Miles Needs to Provide

## Phase 1 (Foundation) — Needed now

### Cloudflare
- [ ] Cloudflare account email (confirm you can log in at dash.cloudflare.com)
- [ ] After adding the site: the two assigned nameservers (e.g. `adam.ns.cloudflare.com`)
- [ ] Confirm DNS propagation complete (site loads on madebymiles.ai)
- [ ] Confirm Web Analytics enabled

### Discord
- [ ] Discord server created (`madebymiles-ops`)
- [ ] 7 webhook URLs (one per channel):
  - [ ] `#uptime-alerts` webhook URL
  - [ ] `#build-deploys` webhook URL
  - [ ] `#site-visitors` webhook URL
  - [ ] `#funnel-tracking` webhook URL
  - [ ] `#security-threats` webhook URL
  - [ ] `#fit-finder` webhook URL
  - [ ] `#dependency-alerts` webhook URL

### GitHub
- [ ] Confirm repo visibility: public or private? (affects Actions minutes: 2000 vs 500/month)
- [ ] Confirm GitHub Pages is enabled (Settings → Pages → Source: GitHub Actions)
- [ ] Add repository secret: `DISCORD_WEBHOOK_BUILDS` (the #build-deploys webhook URL)
- [ ] Add GitHub webhook for Dependabot → Discord (see instructions above)

### UptimeRobot
- [ ] UptimeRobot account created (free tier)
- [ ] Discord alert contact configured
- [ ] Monitor for `https://madebymiles.ai` created

### Headshot
- [ ] Save your professional headshot to the repo at `assets/images/miles-sowden-headshot.jpg`
  (The image you shared in chat — navy blazer, white shirt, glasses)

---

## Phase 2 (Skill Matrix & Analytics) — Needed before Phase 2 starts

### Supabase
- [ ] Supabase project created (free tier) at app.supabase.com
- [ ] Project URL (e.g. `https://abcdefgh.supabase.co`)
- [ ] `anon` public key (safe to embed in Worker — used for INSERT only with RLS)
- [ ] `service_role` secret key (used only in cron Worker for reading reports — NEVER client-side)

### Skill Matrix Content
- [ ] Self-rating for all 14 skill areas (Expert / Practised / Awareness)
- [ ] 1-2 sentence evidence statement for each skill
- [ ] AICD membership details (member number, year, or just "AICD Member" / "GAICD")
  This will appear on the /experience page and in structured data

### Case Study Content
For each of the 5 case studies (SCI, CBA, Hollard, Westpac, Suncorp), I need:
- [ ] Your role title and reporting line
- [ ] Team size you led
- [ ] Tenure (start year – end year)
- [ ] The challenge / problem you were hired to solve
- [ ] Your approach (2-3 key decisions or actions)
- [ ] Measurable outcomes (numbers, percentages, dollar values)
- [ ] One reflection or lesson learned

You've already provided great summary content on the current site — I can draft
expanded versions from that and your LinkedIn, then you review and correct.

---

## Phase 4 (Fit Finder) — Needed before Phase 4 starts

### Anthropic (Claude API)
- [ ] Anthropic API key (for Claude Haiku — the Fit Finder LLM)
  Get one at: console.anthropic.com → API Keys → Create Key
- [ ] Confirm billing is enabled (pay-per-use, ~$0.10/month estimated)
- [ ] Set spend alert at $3/month and hard cap at $5/month in Anthropic console

### Cloudflare Workers
- [ ] Confirm Workers is enabled on your Cloudflare account (it's free, usually on by default)
- [ ] I'll need you to run `npx wrangler login` and authenticate once — or provide an API token
  Alternatively, I can set up Workers deployment via GitHub Actions using a Cloudflare API token:
  - [ ] Cloudflare API token (create at dash.cloudflare.com → My Profile → API Tokens)
    - Permissions: Workers Scripts (Edit), Account Settings (Read)
  - [ ] Cloudflare Account ID (visible on the Workers overview page)

### Sentry
- [ ] Sentry account created (free tier, 5k events/month) at sentry.io
- [ ] Create a "Browser JavaScript" project
- [ ] Sentry DSN (the public URL for error reporting — safe to embed in client-side code)
- [ ] Enable Sentry → Discord integration:
  - Sentry → Settings → Integrations → Discord → Configure
  - Map alerts to your `#build-deploys` Discord channel

---

## Optional / Nice-to-have

### LinkedIn
- [ ] Confirm LinkedIn profile URL: `https://linkedin.com/in/milessowden`
- [ ] Is your LinkedIn profile set to "Open Profile" (allows messages from non-connections)?
  This matters because the "Message me on LinkedIn" CTA uses the messaging compose URL

### Langflow (evaluate during Phase 4)
- [ ] Langflow account URL and access details
  May use for Fit Finder prompt chain iteration — visual builder for testing different prompts

### Photography
- [ ] Any additional professional photos (team shots, speaking events, corporate)?
  Would be useful for case study pages and Open Graph images

---

## How to send me secrets safely

NEVER paste API keys, tokens, or passwords directly in chat.

Instead:
1. **GitHub Secrets:** Add them directly at github.com → repo → Settings → Secrets → Actions
   - `DISCORD_WEBHOOK_BUILDS`
   - `DISCORD_WEBHOOK_VISITORS` (etc. for each channel)
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`
   - `SUPABASE_URL`
   - `ANTHROPIC_API_KEY`
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `SENTRY_DSN`

2. **Cloudflare Worker Secrets:** Add via Cloudflare dashboard → Workers → your worker → Settings → Variables
   - `ANTHROPIC_API_KEY`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`
   - `DISCORD_WEBHOOK_*` (one per channel)

I'll reference these by name in code — I never need to see the actual values.

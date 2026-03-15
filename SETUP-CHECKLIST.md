# Setup Checklist — Step-by-Step Guide

This guide walks you through every manual setup step, with exact click paths and screenshots descriptions. Nothing is assumed — if you get stuck on any step, just ask.

---

## Phase 1 — Foundation (do these now)

### 1. Cloudflare (free) — your DNS and security layer

**What this does:** Cloudflare sits between your domain (`milessowden.au`) and GitHub Pages (where the site is hosted). It makes the site faster, adds security headers, and gives you free analytics. Right now your domain is managed by Squarespace — we're moving the DNS control to Cloudflare while keeping the domain registered at Squarespace.

#### Step 1: Create a Cloudflare account
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Click **Sign Up**
3. Enter your email and a password
4. Verify your email (check inbox for a confirmation link)

#### Step 2: Add your domain to Cloudflare
1. Once logged in, click the **"Add a site"** button (big blue button on the dashboard)
2. Type `milessowden.au` and click **Add site**
3. Select the **Free** plan at the bottom and click **Continue**
4. Cloudflare will scan your existing DNS records — click **Continue** (we'll fix the records in a moment)
5. Cloudflare will now show you **two nameservers** — every account gets a unique pair, e.g.:
   ```
   fatima.ns.cloudflare.com
   major.ns.cloudflare.com
   ```
   **Write these down or leave this tab open** — you need them for the next step

#### Step 3: Point Squarespace to Cloudflare
1. Open a new tab and go to [account.squarespace.com](https://account.squarespace.com)
2. Log in to your Squarespace account
3. Click **Domains** in the left sidebar
4. Click on **milessowden.au**
5. Click **DNS Settings** (or **Advanced Settings**, depending on your Squarespace version)
6. Look for **Nameservers** — click **Edit** or **Use Custom Nameservers**
7. Replace the existing nameservers with the two Cloudflare gave you:
   - Nameserver 1: `fatima.ns.cloudflare.com`
   - Nameserver 2: `major.ns.cloudflare.com`
8. Click **Save**

> **Important:** This takes 24–48 hours to fully propagate. The site will keep working during this time — nothing breaks immediately.

#### Step 4: Set up DNS records in Cloudflare
Go back to your Cloudflare tab. Navigate to **DNS → Records** and add these records (click **Add record** for each one):

**Four A records** (these point your domain to GitHub Pages):

| Type | Name | Content | Proxy status |
|------|------|---------|-------------|
| A | `@` | `185.199.108.153` | Proxied (orange cloud ON) |
| A | `@` | `185.199.109.153` | Proxied (orange cloud ON) |
| A | `@` | `185.199.110.153` | Proxied (orange cloud ON) |
| A | `@` | `185.199.111.153` | Proxied (orange cloud ON) |

**One CNAME record** (this makes `www.milessowden.au` work too):

| Type | Name | Content | Proxy status |
|------|------|---------|-------------|
| CNAME | `www` | `Stritheo.github.io` | Proxied (orange cloud ON) |

> **How to add each record:** Click **Add record** → select the Type from the dropdown → type the Name → type the Content → make sure the Proxy status toggle is orange (not grey) → click **Save**

#### Step 5: Enable Cloudflare Web Analytics
1. In Cloudflare, click **Analytics & Logs** in the left sidebar
2. Click **Web Analytics**
3. Click **Set up** for `milessowden.au`
4. Since you have the proxy enabled (orange cloud), select **"JS Snippet not required"** — Cloudflare tracks analytics automatically through the proxy
5. Click **Done**

#### Step 6: Google Search Console (helps Google and Gemini find your site)
1. Go to [search.google.com/search-console](https://search.google.com/search-console)
2. Sign in with your Google account
3. Click **Add property** (or you'll be prompted on first visit)
4. Choose **Domain** (not "URL prefix")
5. Type `milessowden.au` and click **Continue**
6. Google will give you a TXT record to verify ownership — it looks like:
   ```
   google-site-verification=abc123xyz...
   ```
7. Go to Cloudflare → **DNS → Records** → **Add record**:
   - Type: **TXT**
   - Name: `@`
   - Content: paste the full `google-site-verification=...` string Google gave you
   - Click **Save**
8. Go back to Google Search Console and click **Verify**
9. Once verified, click **Sitemaps** in the left sidebar
10. Add: `https://milessowden.au/sitemap.xml` (we'll generate this in Phase 3 — just register it now so Google knows where to look)

- [ ] Google Search Console verified
- [ ] Sitemap URL submitted

---

#### Step 7: Verify it's working (after 24–48 hours)
1. Go to [dnschecker.org](https://dnschecker.org)
2. Type `milessowden.au` and select **A** record
3. Click **Search** — you should see **Cloudflare proxy IPs** (like `104.21.x.x` and `172.67.x.x`) with green ticks across the world. You won't see the GitHub IPs directly — that's correct, Cloudflare is hiding them behind its proxy.
4. Try visiting `https://milessowden.au` in your browser — it should load your site

- [ ] Cloudflare account created
- [ ] Domain added and nameservers changed in Squarespace
- [ ] DNS records added (4x A + 1x CNAME)
- [ ] Web Analytics enabled
- [ ] DNS propagation confirmed (check after 24–48 hours)

---

### 2. GitHub Pages — enable deployment

**What this does:** GitHub Pages hosts your site for free. The code is already set up to deploy automatically when changes are pushed — you just need to flip the switch in GitHub settings.

#### Step 1: Check your repository
1. Go to [github.com/Stritheo/madebymiles](https://github.com/Stritheo/madebymiles) (or whatever your repo URL is — check by running `git remote -v` in your terminal)
2. If you're not sure of the URL, I can check for you

#### Step 2: Enable GitHub Pages
1. On the repo page, click **Settings** (the gear icon tab, far right)
2. In the left sidebar, click **Pages**
3. Under **Source**, select **GitHub Actions** from the dropdown
4. That's it — no branch to select, the GitHub Actions workflow will handle deployment

#### Step 3: Decide on repo visibility
Your repo is currently set to either public or private. This affects GitHub Actions:
- **Public repo:** 2,000 free Actions minutes per month (more than enough)
- **Private repo:** 500 free Actions minutes per month (still enough, but tighter)

To check or change: **Settings → General → scroll to "Danger Zone" → Change visibility**

- [ ] GitHub Pages source set to "GitHub Actions"
- [ ] Repo visibility confirmed (public or private — your choice)

---

### 3. Discord — your ops dashboard

**What this does:** Discord will be your private command centre. You'll get automatic notifications whenever the site deploys, goes down, gets a visitor spike, etc. Think of it as a dashboard in your pocket.

#### Step 1: Create a Discord server
1. Open Discord (download from [discord.com](https://discord.com) if you don't have it — available for Mac, phone, or just use the web version)
2. Click the **+** button on the left sidebar (it says "Add a Server" on hover)
3. Click **Create My Own**
4. Click **For me and my friends** (it doesn't matter — this is a private server)
5. Name it: `madebymiles-ops`
6. Click **Create**

#### Step 2: Create channels
You need 2 channels. For each one:
1. Right-click on the **Text Channels** category header in the left sidebar
2. Click **Create Channel**
3. Keep it as **Text**
4. Enter the name and click **Create Channel**

Create these 2 channels:
1. `#alerts` — urgent stuff: downtime, security threats, build failures, errors
2. `#reports` — summaries: daily visitors, weekly funnel, deploy success, Fit Finder stats

(You can delete the default `#general` channel if you like — right-click → Delete Channel)

#### Step 3: Create webhooks (one per channel)
For **each** of the 2 channels:
1. Right-click on the channel name
2. Click **Edit Channel**
3. Click **Integrations** in the left sidebar
4. Click **Webhooks**
5. Click **New Webhook**
6. Give it a name (e.g., "Alerts Bot" for `#alerts`, "Reports Bot" for `#reports`)
7. Click **Copy Webhook URL** — save this somewhere safe (a notes file on your computer)
8. Click **Save Changes**

You'll end up with 2 webhook URLs. They look like:
```
https://discord.com/api/webhooks/1234567890/abcdefghijklmnop...
```

> **Keep these URLs private** — anyone with the URL can post to your channel.

- [ ] Discord server `madebymiles-ops` created
- [ ] `#alerts` and `#reports` channels created
- [ ] Both webhook URLs copied and saved

#### Step 4: Add webhooks to GitHub
This connects GitHub deploys and alerts to Discord:
1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `DISCORD_WEBHOOK_ALERTS`
4. Value: paste the webhook URL from the `#alerts` channel
5. Click **Add secret**
6. Repeat for a second secret:
   - Name: `DISCORD_WEBHOOK_REPORTS`
   - Value: paste the webhook URL from the `#reports` channel

- [ ] `DISCORD_WEBHOOK_ALERTS` secret added to GitHub
- [ ] `DISCORD_WEBHOOK_REPORTS` secret added to GitHub

---

### 4. UptimeRobot (free) — uptime monitoring

**What this does:** UptimeRobot checks your site every 5 minutes. If it goes down, you get a Discord alert. When it comes back up, another alert. Peace of mind.

#### Step 1: Create an account
1. Go to [uptimerobot.com](https://uptimerobot.com)
2. Click **Register for FREE**
3. Enter your email and password
4. Verify your email

#### Step 2: Set up Discord alerts
1. Once logged in, click **My Settings** (top right, gear icon)
2. Click **Alert Contacts** → **Add Alert Contact**
3. Choose **Webhook** as the type
4. Set Friendly Name to `Discord Uptime`
5. URL to Notify: paste your `#alerts` webhook URL
6. In the POST body, paste:
   ```json
   {"content": "🔔 **UptimeRobot Alert**\n*monitorFriendlyName*: *alertTypeFriendlyName*\nURL: *monitorURL*"}
   ```
   (UptimeRobot replaces the `*starred*` words with actual values)
7. Set Content-Type to `application/json`
8. Click **Save**

#### Step 3: Create the monitor
1. Click **Add New Monitor** (big green button)
2. Monitor Type: **HTTP(s)**
3. Friendly Name: `milessowden.au`
4. URL: `https://milessowden.au`
5. Monitoring Interval: **5 minutes** (the free tier default)
6. Under Alert Contacts, tick the **Discord Uptime** contact you just created
7. Click **Create Monitor**

- [ ] UptimeRobot account created
- [ ] Discord alert contact configured
- [ ] Monitor for `https://milessowden.au` created

---

### 5. Headshot

**What this does:** Your professional photo appears on the site, in Open Graph previews (when someone shares your link on LinkedIn/Slack), and in structured data for search engines.

#### How to add it:
1. Find the headshot photo on your computer (the navy blazer, white shirt, glasses shot)
2. In Finder, copy the image
3. Rename it to `miles-sowden-headshot.jpg`
4. Move/copy it to: `Projects/madebymiles/assets/images/miles-sowden-headshot.jpg`
   - The `assets/images/` folder already exists in the project

Or if you'd prefer, you can drag and drop the image into this chat and I'll save it to the right location.

- [ ] Headshot saved to `assets/images/miles-sowden-headshot.jpg`

---

## Phase 2 — Credibility Engine (do these before Phase 2 starts)

### ~~6. Supabase~~ — REMOVED (15 Mar 2026)

Supabase free tier pauses after 7 days of inactivity. Removed from architecture. Cloudflare Analytics Engine (free, 25M data points/month, no pausing) will replace when funnel tracking is needed.

---

### 7. Skill matrix content — your ratings and evidence

**What this does:** The AICD skill matrix is the centrepiece of your `/experience` page. It maps your skills across the 4 AICD governance domains. I'll draft initial content from your existing site and LinkedIn — you just need to review and adjust.

**I'll prepare this for you.** When it's ready, you'll review a table like this:

| Skill Area | Your Rating | Your Evidence |
|-----------|-------------|---------------|
| Strategy & Planning | Expert | "Led digital strategy at CBA and Hollard..." |
| Risk Oversight | Practised | "Built risk frameworks for..." |
| etc. | | |

Ratings are: **Expert** / **Practised** / **Awareness**

- [ ] Skill ratings reviewed and confirmed (I'll draft these)

---

### 8. Case study content — your career stories

**What this does:** Five detailed case studies (SCI, CBA, Hollard, Westpac, Suncorp) on `/work/`. I'll draft these from the existing homepage content and public information. You'll review and add anything I've missed.

For each case study, the structure is:
- **Role & context** — what company, your title, who you reported to
- **Challenge** — what problem you were hired to solve
- **Approach** — 2–3 key things you did
- **Outcomes** — measurable results (numbers, percentages, dollar values)
- **Reflection** — one lesson learned

- [ ] Case studies reviewed and confirmed (I'll draft these)

---

## Phase 4 — Fit Finder (do these before Phase 4 starts)

### 9. Anthropic API key — powers the AI Fit Finder

**What this does:** The Fit Finder uses Claude (Anthropic's AI) to analyse job descriptions against your skills. You need an API key to access Claude. Cost is roughly $0.10/month at expected usage.

#### Step 1: Create an Anthropic account
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Click **Sign Up**
3. Enter your email, verify it, set a password

#### Step 2: Add billing
1. Once logged in, click **Settings** in the left sidebar
2. Click **Billing**
3. Click **Add payment method**
4. Enter a credit card (you won't be charged until you use the API)

#### Step 3: Set spend alerts
1. Still in **Billing**, look for **Usage limits** or **Alerts**
2. Set a **warning alert** at $3/month
3. Set a **hard cap** at $5/month
4. This ensures you never get a surprise bill

#### Step 4: Create an API key
1. Click **API Keys** in the left sidebar
2. Click **Create Key**
3. Name it: `madebymiles-fit-finder`
4. Copy the key (it starts with `sk-ant-...`)
5. **Save it somewhere safe** — you can't see it again after closing this page

#### Step 5: Add to GitHub secrets
Go to GitHub repo → **Settings** → **Secrets and variables** → **Actions**:
- Secret name: `ANTHROPIC_API_KEY`
- Value: paste the API key

- [ ] Anthropic account created with billing
- [ ] Spend alerts set ($3 warning, $5 cap)
- [ ] API key created and added to GitHub secrets

---

### 10. Cloudflare Workers — runs the Fit Finder API

**What this does:** Cloudflare Workers run small pieces of server-side code. The Fit Finder and analytics beacon will run as Workers. The free tier gives you 100,000 requests/day — far more than needed.

#### Step 1: Check Workers is enabled
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Click **Workers & Pages** in the left sidebar
3. If you see a welcome/onboarding screen, click through it (accept the free plan)
4. Workers should now be available

#### Step 2: Create a Cloudflare API token (for automated deploys)
1. Click your **profile icon** (top right) → **My Profile**
2. Click **API Tokens** in the left sidebar
3. Click **Create Token**
4. Click **Get started** next to **Create Custom Token**
5. Token name: `madebymiles-deploy`
6. Permissions — add two rows:
   - Account → **Workers Scripts** → **Edit**
   - Account → **Account Settings** → **Read**
7. Account Resources: select **Include → your account**
8. Click **Continue to summary** → **Create Token**
9. Copy the token — **save it, you can't see it again**

#### Step 3: Find your Account ID
1. Go to **Workers & Pages** in the left sidebar
2. Your **Account ID** is shown on the right side of the page (a long string of letters and numbers)
3. Click to copy it

#### Step 4: Add to GitHub secrets
Go to GitHub repo → **Settings** → **Secrets and variables** → **Actions**:

| Secret name | Value |
|------------|-------|
| `CLOUDFLARE_API_TOKEN` | The API token you just created |
| `CLOUDFLARE_ACCOUNT_ID` | Your Account ID |

- [ ] Workers enabled on Cloudflare
- [ ] API token created
- [ ] Account ID copied
- [ ] Both secrets added to GitHub

---

### 11. Sentry (free) — error tracking

**What this does:** Sentry catches JavaScript errors on your site and sends alerts to Discord. If something breaks for a visitor, you'll know about it. Free tier gives 5,000 events/month.

#### Step 1: Create a Sentry account
1. Go to [sentry.io](https://sentry.io)
2. Click **Start for free**
3. Sign up with your **GitHub account** (easiest)
4. Authorise Sentry

#### Step 2: Create a project
1. Once logged in, click **Projects** in the left sidebar
2. Click **Create Project**
3. Choose platform: **Browser JavaScript**
4. Project name: `madebymiles`
5. Click **Create Project**

#### Step 3: Get your DSN
1. After creating the project, you'll see a setup screen with a code snippet
2. Look for the `dsn:` value — it looks like:
   ```
   https://abc123@o456789.ingest.sentry.io/1234567
   ```
3. Copy this DSN

#### Step 4: Connect Sentry to Discord
1. In Sentry, go to **Settings** → **Integrations**
2. Search for **Discord** → click **Install**
3. Follow the prompts to connect your Discord server
4. In **Alert Rules**, create a rule that sends to your `#alerts` channel

#### Step 5: Add to GitHub secrets
- Secret name: `SENTRY_DSN`
- Value: paste the DSN

- [ ] Sentry account and project created
- [ ] DSN copied and added to GitHub secrets
- [ ] Discord integration configured

---

## Quick reference: all GitHub secrets

Here's the complete list of secrets you'll add over time. You only need the Phase 1 ones now:

| Secret name | Phase needed | Where to get it |
|------------|-------------|----------------|
| `DISCORD_WEBHOOK_ALERTS` | Phase 1 | Discord `#alerts` channel webhook |
| `DISCORD_WEBHOOK_REPORTS` | Phase 1 | Discord `#reports` channel webhook |
| ~~`SUPABASE_URL`~~ | ~~Phase 2~~ | ~~Removed~~ |
| ~~`SUPABASE_ANON_KEY`~~ | ~~Phase 2~~ | ~~Removed~~ |
| ~~`SUPABASE_SERVICE_KEY`~~ | ~~Phase 2~~ | ~~Removed~~ |
| `ANTHROPIC_API_KEY` | Phase 4 | Anthropic console → API Keys |
| `CLOUDFLARE_API_TOKEN` | Phase 4 | Cloudflare My Profile → API Tokens |
| `CLOUDFLARE_ACCOUNT_ID` | Phase 4 | Cloudflare Workers & Pages page |
| `SENTRY_DSN` | Phase 4 | Sentry project settings |

**How to add a secret to GitHub:**
1. Go to your repo on github.com
2. Click **Settings** (gear icon tab)
3. Left sidebar: **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Type the name exactly as shown above
6. Paste the value
7. Click **Add secret**

---

## How to send me secrets safely

**NEVER paste API keys, tokens, or passwords directly in chat.**

Instead, add them directly through the GitHub and Cloudflare dashboards as described above. I reference secrets by name in code — I never need to see the actual values.

---

## Optional / Nice-to-have

### LinkedIn
- [ ] Confirm LinkedIn profile URL: `https://linkedin.com/in/milessowden`
- [ ] Is your profile set to **Open Profile**? (Allows messages from non-connections)
  - To check: LinkedIn → **Settings** → **Visibility** → **Profile viewing options**
  - Look for **Open Profile** under your Premium settings

### Photography
- [ ] Any additional professional photos? (team shots, speaking events, corporate)
  Would be useful for case study pages and Open Graph images

---

*Only Phase 1 steps are needed right now. I'll remind you about Phase 2 and Phase 4 steps when we get there.*

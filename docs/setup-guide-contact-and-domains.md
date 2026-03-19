# Setup Guide: Contact, Email Routing, Scheduling, and Domain Redirect

Three configuration tasks that need to be done outside the codebase. None require code changes.

## 1. Cloudflare Email Routing (contact@milessowden.au)

This forwards contact@milessowden.au to miles.sowden@outlook.com. No mail server needed.

**Steps:**

1. Log into Cloudflare dashboard at dash.cloudflare.com
2. Select the milessowden.au zone
3. Go to Email > Email Routing
4. Click "Get started" if this is the first time (Cloudflare will add the required MX and TXT DNS records automatically)
5. Under "Routing rules", click "Create address"
6. Custom address: `contact`
7. Destination: `miles.sowden@outlook.com`
8. Click "Save"
9. Cloudflare will send a verification email to miles.sowden@outlook.com. Click the link to confirm.

**Verification:** Send a test email to contact@milessowden.au from a different account. It should arrive at miles.sowden@outlook.com within a few minutes.

**MailChannels SPF record:** The contact form Worker sends email notifications via MailChannels. For these to land in inboxes (not spam), add this TXT record to milessowden.au DNS:

- Type: TXT
- Name: `_mailchannels`
- Content: `v=mc1 cfid=milessowden.au`

This authorises MailChannels to send on behalf of your domain when triggered from your Cloudflare Worker.

**Also add an SPF record if you don't have one:**

- Type: TXT
- Name: `@`
- Content: `v=spf1 include:_spf.mx.cloudflare.net include:relay.mailchannels.net ~all`

If you already have an SPF record, just add `include:relay.mailchannels.net` before the `~all`.

## 2. Microsoft Bookings with Me (Outlook scheduling)

This creates a public booking page that syncs directly to your Outlook calendar.

**Steps:**

1. Open Outlook on the web at outlook.office.com
2. Click the calendar icon in the left sidebar
3. In the calendar view, look for "Bookings with me" (or go to outlook.office.com/bookwithme)
4. Click "Create a booking page" (or "New meeting type" if you already have one)
5. Configure:
   - Title: "Conversation with Miles Sowden"
   - Duration: 30 minutes
   - Location: Microsoft Teams meeting (auto-generates a Teams link)
   - Availability: Set your preferred hours (e.g., Mon-Fri 9am-5pm AEST)
   - Buffer time: 15 minutes before and after (prevents back-to-back)
   - Lead time: Minimum 24 hours advance booking
   - Booking window: Up to 4 weeks out
6. Save the page
7. Copy the public URL (it will look like: https://outlook.office.com/bookwithme/user/[your-id])

**Once you have the URL**, update the placeholder in index.astro:

Replace `https://outlook.office.com/bookwithme/user/placeholder` with your actual booking URL.

**Security notes:**

- The booking page only shows availability windows, not calendar details
- Bookers must provide their name and email
- Each booking auto-generates a unique Teams meeting link
- You can set a maximum number of bookings per day
- Cancellation and rescheduling links are included in confirmation emails
- All bookings appear in your Outlook calendar with full attendee details

**Testing:** Book a test meeting from an incognito browser. Confirm it appears in your Outlook calendar and that the Teams link works.

## 3. Domain redirect (milessowden.com.au to milessowden.au)

Route milessowden.com.au to milessowden.au automatically.

**Option A: Cloudflare (recommended if milessowden.com.au DNS is on Cloudflare)**

1. Add milessowden.com.au as a site in Cloudflare (free plan)
2. Update the domain registrar NS records to point to Cloudflare
3. Wait for DNS propagation (can take up to 24 hours)
4. In Cloudflare dashboard for milessowden.com.au, go to Rules > Redirect Rules
5. Create a new rule:
   - Name: "Redirect to primary domain"
   - When: All incoming requests (or hostname equals milessowden.com.au)
   - Then: Dynamic redirect
   - Expression: `concat("https://milessowden.au", http.request.uri.path)`
   - Status code: 301 (permanent)
   - Preserve query string: Yes
6. Deploy the rule

**Option B: Registrar-level redirect (if you prefer not to use Cloudflare for this domain)**

Most Australian domain registrars (VentraIP, Crazy Domains, etc.) offer URL forwarding:

1. Log into your registrar for milessowden.com.au
2. Find DNS or URL forwarding settings
3. Set up a 301 permanent redirect from milessowden.com.au to https://milessowden.au
4. Enable "forward with path" if available (so milessowden.com.au/experience goes to milessowden.au/experience)

**Verification:** After DNS propagation, test these URLs:

- http://milessowden.com.au should redirect to https://milessowden.au
- http://milessowden.com.au/experience should redirect to https://milessowden.au/experience
- https://milessowden.com.au (if SSL is configured) should also redirect

**SEO note:** The 301 redirect tells search engines that milessowden.au is the canonical domain. No duplicate content penalty.

## 4. Deploy the Worker update

The contact form endpoint (/api/contact) was added to the existing fit-finder Worker. Deploy it:

```bash
cd workers/fit-finder
npx wrangler deploy
```

No new secrets are needed. The Worker reuses the existing DISCORD_WEBHOOK_ALERTS and RATE_LIMIT_KV bindings. MailChannels is a free integration for Cloudflare Workers and requires no API key.

## Post-deployment checklist

- [ ] Cloudflare Email Routing active for contact@milessowden.au
- [ ] MailChannels TXT record added to DNS
- [ ] SPF record updated
- [ ] Test email sent to contact@milessowden.au and received at Outlook
- [ ] Microsoft Bookings page created and URL copied
- [ ] Booking URL updated in index.astro (replace placeholder)
- [ ] Test booking made and confirmed in calendar
- [ ] Worker deployed with contact endpoint
- [ ] Test "Send a note" form on live site
- [ ] Discord notification received for test submission
- [ ] Email notification received for test submission
- [ ] milessowden.com.au DNS added to Cloudflare (or registrar redirect configured)
- [ ] 301 redirect tested for root and subpaths

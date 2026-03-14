# Security Headers — Cloudflare Transform Rules

GitHub Pages does not support custom HTTP response headers. Since Cloudflare is proxying milessowden.au (orange cloud), we add security headers using **Cloudflare Transform Rules**.

Some headers are also set via `<meta http-equiv>` in the HTML `<head>` as a belt-and-suspenders approach, but the HTTP headers are the authoritative source.

---

## How to configure

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Click **milessowden.au** (your zone)
3. In the left sidebar: **Rules** → **Transform Rules**
4. Click the **Modify Response Header** tab
5. Click **Create rule**
6. Give it a name: `Security Headers`
7. Under **When incoming requests match…** select **All incoming requests**
8. Under **Then…** click **Set static** for each header below:

| Header Name | Value |
|---|---|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'` |

9. Click **Deploy**

---

## How to verify

1. Run: `curl -sI https://milessowden.au` — check the headers are present
2. Visit [securityheaders.com](https://securityheaders.com/?q=https://milessowden.au) — target score: **A+**

---

## Future changes

- **Phase 2:** Update `connect-src` to include Supabase URL for the analytics beacon
- **Phase 4:** Update `connect-src` to include the Fit Finder Worker URL

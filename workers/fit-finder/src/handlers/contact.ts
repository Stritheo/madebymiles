import type { Env } from '../types';
import { corsHeaders } from '../index';
import { EmailMessage } from 'cloudflare:email';
import { postAlert } from '../lib/discord';
import { postToDatabricks } from '../lib/databricks';

interface ContactPayload {
  name: string;
  email: string;
}

/** Rate limit: max 5 contact submissions per IP per hour */
async function checkContactRateLimit(ip: string, kv: KVNamespace): Promise<boolean> {
  const key = `contact:${ip}`;
  const current = parseInt((await kv.get(key)) || '0', 10);
  if (current >= 5) return false;
  await kv.put(key, String(current + 1), { expirationTtl: 3600 });
  return true;
}

export async function handleContact(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  const headers = { 'Content-Type': 'application/json', ...corsHeaders() };

  // Rate limit check
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const allowed = await checkContactRateLimit(ip, env.RATE_LIMIT_KV);
  if (!allowed) {
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please try LinkedIn or WhatsApp.' }),
      { status: 429, headers },
    );
  }

  // Parse and validate
  let payload: ContactPayload;
  try {
    payload = await request.json() as ContactPayload;
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid request' }),
      { status: 400, headers },
    );
  }

  const name = (payload.name || '').trim();
  const email = (payload.email || '').trim();

  if (!name || name.length > 200) {
    return new Response(
      JSON.stringify({ error: 'Name is required (max 200 characters)' }),
      { status: 400, headers },
    );
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) {
    return new Response(
      JSON.stringify({ error: 'Valid email is required' }),
      { status: 400, headers },
    );
  }

  const timestamp = new Date().toISOString();

  // Discord notification (reliable, proven channel)
  ctx.waitUntil(sendDiscordNotification(env, name, email, timestamp));

  // Email notification via Cloudflare Email Routing
  ctx.waitUntil(sendEmailNotification(env, name, email, timestamp));

  // Log to Databricks (non-critical)
  ctx.waitUntil(
    postToDatabricks(env.DATABRICKS_HOST, env.DATABRICKS_TOKEN, env.DATABRICKS_WAREHOUSE_ID, {
      source: 'contact-form',
      severity: 'info',
      title: `Contact from ${name}`,
      message: `New contact submission`,
      metadata: { email, ip: ip.substring(0, 3) + 'xxx' },
    }),
  );

  return new Response(
    JSON.stringify({ status: 'sent' }),
    { status: 200, headers },
  );
}

async function sendDiscordNotification(
  env: Env,
  name: string,
  email: string,
  timestamp: string,
): Promise<void> {
  try {
    await fetch(env.DISCORD_WEBHOOK_ALERTS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: 'New contact from milessowden.au',
          color: 0xC87D5C,
          fields: [
            { name: 'Name', value: name, inline: true },
            { name: 'Email', value: email, inline: true },
          ],
          timestamp,
        }],
      }),
    });
  } catch {
    // Non-critical: don't fail the response
  }
}

/** Build a minimal RFC 5322 MIME message without external dependencies. */
function buildMimeMessage(from: string, to: string, subject: string, body: string): string {
  // Base64-encode subject for UTF-8 safety (RFC 2047)
  const encodedSubject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  return [
    `From: <${from}>`,
    `To: <${to}>`,
    `Subject: ${encodedSubject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    body,
  ].join('\r\n');
}

async function sendEmailNotification(
  env: Env,
  name: string,
  email: string,
  timestamp: string,
): Promise<void> {
  const from = 'contact@milessowden.au';
  const to = 'miles.sowden@outlook.com';

  try {
    const raw = buildMimeMessage(
      from,
      to,
      `Contact from ${name} (${email})`,
      `New contact submission from milessowden.au\n\nName: ${name}\nEmail: ${email}\nTime: ${timestamp}\n\nReply to: ${email}`,
    );

    const message = new EmailMessage(from, to, raw);
    await env.SEND_EMAIL.send(message);
  } catch (err) {
    // Surface email failures in Discord so they don't go unnoticed
    await postAlert(
      env.DISCORD_WEBHOOK_ALERTS,
      `Email send failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

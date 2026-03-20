import type { Env } from '../types';
import { corsHeaders } from '../index';
import { EmailMessage } from 'cloudflare:email';
import { createMimeMessage, Mailbox } from 'mimetext';

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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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

  // Send Discord notification (reliable, proven channel)
  ctx.waitUntil(sendDiscordNotification(env, name, email, timestamp));

  // Send email notification via MailChannels (Cloudflare Workers integration)
  ctx.waitUntil(sendEmailNotification(env, name, email, timestamp));

  // Log to Databricks (non-critical)
  ctx.waitUntil(logContact(env, name, email, ip, timestamp));

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
          color: 0xC87D5C, // accent colour
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

async function sendEmailNotification(
  env: Env,
  name: string,
  email: string,
  timestamp: string,
): Promise<void> {
  try {
    const msg = createMimeMessage();
    msg.setSender('contact@milessowden.au');
    msg.setRecipient('miles.sowden@outlook.com');
    msg.setHeader('Reply-To', new Mailbox({ addr: email }));
    msg.setSubject(`Contact from ${escapeHtml(name)}`);
    msg.addMessage({
      contentType: 'text/plain',
      data: `New contact submission from milessowden.au\n\nName: ${name}\nEmail: ${email}\nTime: ${timestamp}\n\nReply directly to this person at ${email}`,
    });

    const message = new EmailMessage(
      'contact@milessowden.au',
      'miles.sowden@outlook.com',
      msg.asRaw(),
    );
    await env.SEND_EMAIL.send(message);
  } catch (err) {
    // Surface email failures in Discord so they don't go unnoticed
    try {
      await fetch(env.DISCORD_WEBHOOK_ALERTS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `Email send failed: ${err instanceof Error ? err.message : String(err)}`,
        }),
      });
    } catch {
      // Both channels failed; Discord notification was already sent for the contact
    }
  }
}

async function logContact(
  env: Env,
  name: string,
  email: string,
  ip: string,
  timestamp: string,
): Promise<void> {
  if (!env.DATABRICKS_HOST || !env.DATABRICKS_TOKEN || !env.DATABRICKS_WAREHOUSE_ID) return;
  try {
    await fetch(`${env.DATABRICKS_HOST}/api/2.0/sql/statements`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.DATABRICKS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        warehouse_id: env.DATABRICKS_WAREHOUSE_ID,
        statement: 'INSERT INTO default.site_events (source, severity, title, metadata, created_at) VALUES (?, ?, ?, ?, ?)',
        parameters: [
          { value: 'contact-form' },
          { value: 'info' },
          { value: `Contact from ${name}` },
          { value: JSON.stringify({ email, ip: ip.substring(0, 3) + 'xxx' }) },
          { value: timestamp },
        ],
      }),
    });
  } catch {
    // Non-critical logging
  }
}

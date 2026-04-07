// Supabase Edge Function: notify-emergency-contacts
// Triggered on PANIC alert inserts via DB trigger/webhook.

interface AlertPayload {
  alert_id?: string | number;
  clerk_user_id?: string;
  type?: string;
  latitude?: number;
  longitude?: number;
  created_at?: string;
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID") ?? "";
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN") ?? "";
const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER") ?? "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const APP_BASE_URL = Deno.env.get("APP_BASE_URL") ?? "https://yourapp.com";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function supabaseQuery(path: string, init?: RequestInit) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      ...(init?.headers ?? {}),
    },
  });
}

async function sendTwilioSms(to: string, body: string) {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) return;
  const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
  const form = new URLSearchParams({
    To: to,
    From: TWILIO_PHONE_NUMBER,
    Body: body,
  });
  await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    },
  );
}

async function sendResendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Tourist Safety <alerts@yourdomain.com>",
      to: [to],
      subject,
      html,
    }),
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ ok: false, reason: "method_not_allowed" }, 405);
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json({ ok: false, reason: "missing_supabase_env" }, 500);
  }

  const payload = (await req.json()) as AlertPayload;
  if (payload.type !== "PANIC" || !payload.clerk_user_id) {
    return json({ ok: true, skipped: true });
  }

  const touristRes = await supabaseQuery(
    `tourists?select=full_name&clerk_user_id=eq.${encodeURIComponent(payload.clerk_user_id)}&limit=1`,
  );
  const touristRows = (await touristRes.json()) as Array<{ full_name?: string }>;
  const touristName = touristRows?.[0]?.full_name ?? "A tourist";

  const contactsRes = await supabaseQuery(
    `emergency_contacts?select=name,phone_number,email&clerk_user_id=eq.${encodeURIComponent(payload.clerk_user_id)}`,
  );
  const contacts = (await contactsRes.json()) as Array<{
    name?: string;
    phone_number?: string;
    email?: string;
  }>;

  if (!Array.isArray(contacts) || contacts.length === 0) {
    return json({ ok: true, sent: 0 });
  }

  const lat = payload.latitude ?? 0;
  const lng = payload.longitude ?? 0;
  const time = payload.created_at ?? new Date().toISOString();
  const mapUrl = `https://maps.google.com/?q=${lat},${lng}`;
  const trackLinksRes = await supabaseQuery(
    `tracking_links?select=token,expires_at&tourist_id=eq.${encodeURIComponent(payload.clerk_user_id)}&active=eq.true&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&order=created_at.desc&limit=1`,
  );
  const linkRows = (await trackLinksRes.json()) as Array<{ token?: string }>;
  const trackToken = linkRows?.[0]?.token;
  const liveTrackUrl = trackToken ? `${APP_BASE_URL}/track/${trackToken}` : `${APP_BASE_URL}/dashboard`;

  await Promise.all(
    contacts.map(async (contact) => {
      const sms = `${touristName} has triggered a PANIC alert. Last location: ${mapUrl} Time: ${time}. Please contact local authorities immediately.`;
      if (contact.phone_number) {
        await sendTwilioSms(contact.phone_number, sms);
      }
      if (contact.email) {
        await sendResendEmail(
          contact.email,
          `PANIC alert for ${touristName}`,
          `
            <p><strong>${touristName}</strong> has triggered a PANIC alert.</p>
            <p><strong>Time:</strong> ${time}</p>
            <p><strong>Last location:</strong> <a href="${mapUrl}">${mapUrl}</a></p>
            <p><strong>Live tracking:</strong> <a href="${liveTrackUrl}">${liveTrackUrl}</a></p>
            <p>Please contact local authorities immediately.</p>
          `,
        );
      }
    }),
  );

  return json({ ok: true, sent: contacts.length });
});


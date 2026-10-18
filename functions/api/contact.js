// Cloudflare Pages Function: POST /api/contact
// Sends the contact form to your inbox through Resend.
// Required env vars (set in Cloudflare Pages > Settings > Variables and Secrets):
//   RESEND_API_KEY  (secret)  your Resend key
//   CONTACT_TO                where submissions go, e.g. you@gemmlabs.com
//   CONTACT_FROM              a sender on a domain verified in Resend, e.g. "GEMM LABS <hello@gemmlabs.com>"

const json = (status, data) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return json(400, { error: "Bad request." }); }

  const name = (body.name || "").toString().trim().slice(0, 200);
  const email = (body.email || "").toString().trim().slice(0, 200);
  const topic = (body.topic || "").toString().trim().slice(0, 100);
  const message = (body.message || "").toString().trim().slice(0, 5000);
  const honeypot = (body.company || "").toString().trim();

  if (honeypot) return json(200, { ok: true }); // bot filled the hidden field; pretend success
  if (!name || !email || !message) return json(400, { error: "Name, email and message are required." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(400, { error: "That email address doesn't look right." });

  if (!env.RESEND_API_KEY || !env.CONTACT_TO || !env.CONTACT_FROM)
    return json(500, { error: "Form is not configured yet. Call or email us instead." });

  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const html = `
    <div style="font-family:ui-sans-serif,system-ui;font-size:15px;line-height:1.6;color:#0E1522">
      <p style="margin:0 0 12px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#5C6878">gemmlabs.com contact form</p>
      <p><b>Name:</b> ${esc(name)}<br><b>Email:</b> ${esc(email)}<br><b>Interested in:</b> ${esc(topic || "Not specified")}</p>
      <p style="white-space:pre-wrap;border-left:3px solid #4F7DFF;padding-left:12px">${esc(message)}</p>
    </div>`;

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env.CONTACT_FROM,
      to: env.CONTACT_TO.split(",").map((s) => s.trim()),
      reply_to: email,
      subject: `[GEMM LABS] ${topic || "New message"} from ${name}`,
      html,
      text: `Name: ${name}\nEmail: ${email}\nInterested in: ${topic}\n\n${message}`,
    }),
  });

  if (!r.ok) {
    const raw = await r.text().catch(() => "");
    console.error("Resend error", r.status, raw);
    let detail = "";
    try { detail = JSON.parse(raw).message || ""; } catch {}
    // 500 instead of 502: Cloudflare replaces origin 502s with its own HTML error page.
    return json(500, { error: "We couldn't send that right now. Call or email us instead.", detail });
  }
  return json(200, { ok: true });
}

export const onRequestGet = () => json(405, { error: "Method not allowed." });

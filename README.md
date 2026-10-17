# gemmlabs.com

Static site for GEMM LABS, hosted on Cloudflare Pages. No build step. Everything the browser sees is in `public/`. The contact form posts to a Pages Function in `functions/api/contact.js`, which emails submissions through Resend.

## Deploy (first time)

1. In Cloudflare, go to Workers & Pages, Create, Pages, Connect to Git, and pick this repo.
2. Build settings: Framework preset None, Build command empty, Build output directory `public`.
3. After the first deploy, open the project, Settings, Variables and Secrets, and add:
   - `RESEND_API_KEY` as a Secret (the key from Resend)
   - `CONTACT_TO` as plain text, the inbox that should receive form messages
   - `CONTACT_FROM` as plain text, a sender on a domain verified in Resend, for example `GEMM LABS <hello@gemmlabs.com>`
4. Redeploy once so the function picks up the variables.
5. Custom domains, add `gemmlabs.com` and `www.gemmlabs.com`. Cloudflare writes the DNS records for you when the domain is on Cloudflare DNS.

## Updating the site

Edit `public/index.html` and push to `main`. Cloudflare redeploys automatically in about 30 seconds.

## Share preview

Open Graph and Twitter tags live in the `<head>` of `public/index.html` and point at `https://gemmlabs.com/og.png` (1200 x 630). To refresh a stale card after a change, run the URL through LinkedIn Post Inspector or Facebook Sharing Debugger once.

## Test the form locally

```
npm i -g wrangler
echo 'RESEND_API_KEY=...' > .dev.vars
echo 'CONTACT_TO=you@example.com' >> .dev.vars
echo 'CONTACT_FROM=GEMM LABS <hello@gemmlabs.com>' >> .dev.vars
wrangler pages dev public
```

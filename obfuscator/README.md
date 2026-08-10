# IND OBFUSCATOR

Heavy Luau transformation UI and protected-loader backend by MR_GAMING1141.

## GitHub Pages

GitHub Pages serves `obfuscator/index.html` as a static frontend. The repository root `index.html` redirects visitors into the obfuscator page.

The frontend needs the URL of the deployed Vercel API. Enter it in **Vercel API URL** and press **SAVE API**.

## Vercel backend

Deploy the `obfuscator` directory as the Vercel project root. The `api/` directory contains:

- `GET /api/health`
- `POST /api/obfuscate`
- `GET /api/loader/:token`

Set these Vercel environment variables:

- `PAYLOAD_SECRET` — long random secret
- `PUBLIC_URL` — your Vercel project URL
- `PAYLOAD_TTL_SECONDS` — optional token lifetime, default 86400
- `PASTEFY_API_TOKEN` — optional Pastefy API v2 token
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` — recommended for production token storage

The Pastefy token is never sent to the browser.

## Local development

From `obfuscator/`:

```bash
npm install
npm run dev
```

The legacy Express server is kept for local testing. Vercel uses the `api/` serverless functions instead.

## Security notes

The protected payload is stored server-side and the generated loader contains only a short token URL. Redis/Upstash is recommended on Vercel because serverless instances are not a durable shared in-memory database.

Client-executed code can still be inspected at runtime. No client-side obfuscator can make executable code mathematically invisible after it reaches the client.

## Pastefy

When `PASTEFY_API_TOKEN` is configured, the obfuscation endpoint automatically uploads the transformed source to Pastefy and returns the raw URL plus a generated `loadstring(game:HttpGet(...))()` loader.

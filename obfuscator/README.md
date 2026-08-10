# IND OBFUSCATOR

Heavy Luau source transformation and protected-loader prototype for IND HUB.

## Run

```bash
cd obfuscator/backend
npm install
cp .env.example .env
npm start
```

Open `http://localhost:3000/obfuscator/`.

## Environment

- `PUBLIC_URL` must point at the deployed backend so generated loaders use the correct host.
- `PAYLOAD_SECRET` should be a long random secret and must never be committed.
- `OPENAI_API_KEY` is reserved for future optional AI-assisted transformations and must remain server-side.

## Security note

The generated loader contains a short-lived token instead of the large source payload. The backend stores the transformed payload and removes it after successful retrieval or expiration. Client-executed code can still be inspected at runtime; no client-side design can make executable code absolutely invisible.
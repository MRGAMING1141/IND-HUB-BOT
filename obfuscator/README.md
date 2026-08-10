# IND OBFUSCATOR

Standalone browser Luau transformer and Pastefy loader generator by MR_GAMING1141.

## GitHub Pages — no Vercel required

The repository root `index.html` opens `obfuscator/`. The obfuscation pipeline runs entirely in the browser.

For **Auto Upload to Pastefy**, enter your own Pastefy API token in the page. The token is held only in page memory and is never committed to GitHub. Pastefy's API requires authentication for creating pastes.

Pastefy API documentation: https://docs.pastefy.app/api/

The generated loader is:

```lua
loadstring(game:HttpGet("PASTEFY_RAW_URL"))()
```

Without Pastefy upload, the page still produces and lets you copy the transformed Luau source.

## Optional Vercel backend

The `backend/` and `api/` files are retained for a future server-side deployment. They are not required for the GitHub Pages version.

## Security notes

A browser-only obfuscator cannot make code impossible to inspect after it executes on a client. The standalone mode avoids putting the transformed source inside the generated loadstring by using Pastefy's raw URL when upload is enabled.

Never commit a Pastefy API token, OpenAI API key, or other secret to the repository.
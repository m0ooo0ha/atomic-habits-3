# Problem Discovery App (PWA)

A bilingual Arabic/English **local-first** problem discovery web app.

## Publish as a public website (recommended)

### Option 1 — Netlify Drop (fastest, no code setup)
1. Open https://app.netlify.com/drop
2. Drag this project folder.
3. Netlify gives you an HTTPS URL instantly (e.g. `https://your-app.netlify.app`).
4. Open that URL on iPhone Safari → Share → Add to Home Screen.

### Option 2 — Cloudflare Pages
1. Push this repo to GitHub.
2. In Cloudflare Pages: **Create project** → connect repo.
3. Build command: *(leave empty)*
4. Build output directory: `.`
5. Deploy and use the generated HTTPS URL.

### Option 3 — Vercel
1. Push repo to GitHub.
2. Import project in Vercel.
3. Framework preset: **Other** (static site).
4. Build command: *(empty)*, Output: `.`
5. Deploy and use the generated HTTPS URL.

## Local run
```bash
python3 -m http.server 4173 --bind 0.0.0.0
```
Open: `http://localhost:4173`

## iPhone install steps
1. Open deployed URL in Safari.
2. Tap Share.
3. Tap **Add to Home Screen**.
4. Launch from home screen (standalone PWA mode).

## Notes
- All user data is stored in browser local storage.
- Core app works without AI key.
- AI features require user-provided DeepSeek API key.

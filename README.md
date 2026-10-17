# WebcamTest

A free, private, single-page webcam & microphone test website — built as fast, hand-written static files (no frameworks, no build step). Designed to load in under a second and to be SEO- and AdSense-friendly.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Main page: the webcam test tool + SEO content (how-to, troubleshooting, FAQ) |
| `style.css` | All styling, light + dark mode |
| `script.js` | Camera logic: preview, device switching, resolution/FPS, mic meter, snapshot, fullscreen, theme toggle |
| `privacy.html` | Privacy policy (required for Google AdSense) |
| `about.html` | About page |
| `robots.txt` | Allows crawlers, points to the sitemap |
| `sitemap.xml` | Sitemap for search engines |

## Important: camera access needs HTTPS

Browsers only allow `getUserMedia` (camera access) on **`https://`** or on **`localhost`**. Opening `index.html` directly from disk (`file://`) will NOT let the camera start. Use one of the options below.

### Test locally
Run a quick local server from this folder and open the printed URL:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

### Deploy (free, with automatic HTTPS)
Any of these host static files for free with HTTPS out of the box:

- **Netlify** — drag this folder onto https://app.netlify.com/drop
- **Vercel** — `vercel` in this folder, or import from Git
- **Cloudflare Pages** — connect a repo or upload the folder
- **GitHub Pages** — push to a repo, enable Pages in settings

## Before you go live — replace the placeholders

1. **Domain** — replace every `https://example.com/` with your real domain in:
   `index.html` (canonical + Open Graph + Twitter + JSON-LD), `privacy.html`, `about.html`, `robots.txt`, `sitemap.xml`.
2. **Contact email** — replace `contact@example.com` in `privacy.html`.
3. **Brand name** — "WebcamTest" appears in the header, footer and titles; change if you pick a different name.
4. **Social image** — add an `og-image.png` (1200×630) for nice link previews, or remove the `og:image` / `twitter` image lines.
5. **Accent color** — change `--accent` (and `--accent-hover`, `--accent-soft`) at the top of `style.css`.

## Adding Google AdSense (how you make money)

1. Apply at https://adsense.google.com with your live domain. Approval needs real content and some traffic — the privacy policy, about page and FAQ here are built to meet their requirements.
2. Once approved, paste the AdSense `<script>` into the `<head>` of each HTML page.
3. Replace the placeholder ad box in `index.html` (the `<div class="ad-slot">`) with your ad unit code.

## SEO notes (honest expectations)

- The exact term **"webcam test"** is very competitive (established sites with years of backlinks dominate). Don't expect to rank #1 for it quickly.
- The realistic path is **long-tail keywords**: "test webcam windows 11", "why is my laptop camera black", "test camera before zoom meeting", "mic and camera test online", etc. Consider adding a few short help articles targeting these.
- Already included for SEO: semantic HTML, meta description, Open Graph/Twitter cards, `WebApplication` + `FAQPage` JSON-LD structured data, canonical tags, sitemap and robots.txt, fast load, mobile-first responsive layout.
- After deploying, submit your sitemap in **Google Search Console** to get indexed faster.

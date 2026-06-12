# Project: Alpacka Construction LLC Site

Static marketing site for Alpacka Construction LLC — home remodeling and contracting services in Effort, PA and the Pocono Mountains. Single-page, vanilla HTML/CSS/JS, built with Vite and deployed to Cloudflare Pages via GitHub Actions.

## Commands

```bash
npm run dev       # local dev server (localhost:5173)
npm run build     # production build → dist/
npm run preview   # preview dist/ locally
npm run format    # prettier format all js/css/html
```

## Project Structure

```
index.html              # Vite entry point — page sections inline; partials injected via {{> name}}
src/
  css/styles.css        # all styles, mobile-first, no frameworks
  js/main.js            # footer year, scroll reveal, mobile nav, sticky header, gallery carousel, contact form
  partials/             # reusable HTML fragments injected into index.html via {{> name}} (head, logo, footer, contact)
public/                 # copied to dist/ as-is — robots.txt, _headers, site.webmanifest, 404.html, favicons, images/
  images/showcase/      # gallery photos (the rest of public/ is config, icons, and source-image originals in images/src/)
.github/workflows/
  deploy.yml            # push to main → build → Cloudflare Pages
```

## v1.0 — what's live

The site converts through the **phone CTA only**. `tel:` links appear in the header, hero, and CTA strip.

The contact form (`src/partials/contact.html`) is **built but not shipped**: its `{{> contact}}` include and the "Get a Quote" nav/CTA links are commented out in `index.html`. To enable it, uncomment those, then note:

- The form posts to `/api/contact.cfm` — there is **no backend** on Cloudflare Pages, so submissions won't be delivered until a handler exists.
- `contact.html` still has placeholder address (`123 Main Street`) and hours — update before going live.

## Templating

`vite-plugin-handlebars` processes `index.html` at build and dev time.

- Partials live in `src/partials/` and are referenced as `{{> name}}`
- Template variables live in the `context` object in `vite.config.js` and populate the templates as `{{variableName}}`

To add a new partial: create `src/partials/myblock.html`, reference it with `{{> myblock}}`. To add a new variable: add it to the `context` object in `vite.config.js`. Neither needs other config changes.

## Build Plugins (`vite.config.js`)

| Plugin                   | Purpose                                                   |
| ------------------------ | --------------------------------------------------------- |
| `vite-plugin-handlebars` | Partial injection + template variable substitution        |
| `sitemapPlugin` (inline) | Generates `dist/sitemap.xml` with build date as `lastmod` |

Cache busting (content hashes on JS/CSS assets) is Vite's default — no config needed.

## Deployment

Push to `main` (or run the workflow manually via `workflow_dispatch`) triggers GitHub Actions:

1. `npm ci` → `npm run build` → `wrangler pages deploy dist --project-name=alpackaconstruction`

Runs on Node 24. `public/_headers` ships with the build to apply security headers and asset cache rules at the edge.

**Required GitHub secrets:**

- `CLOUDFLARE_API_TOKEN` — Cloudflare API token with "Cloudflare Pages: Edit" permission
- `CLOUDFLARE_ACCOUNT_ID` — found on the Cloudflare dashboard homepage

The Cloudflare Pages project must exist and be named **`alpackaconstruction`** (matches `--project-name` in `deploy.yml`).

## Updating Site Content

| What                   | Where                                                                                          |
| ---------------------- | ---------------------------------------------------------------------------------------------- |
| Phone number           | `PHONE_DISPLAY` / `PHONE_E164` in `vite.config.js` — propagates to every `tel:` link + JSON-LD |
| Service-area wording   | `SERVICE_AREA` in `vite.config.js` — propagates to header, hero, about, footer, meta + JSON-LD |
| Site URL               | `SITE_URL` in `vite.config.js` — propagates to canonical, OG tags, JSON-LD, sitemap            |
| Email, address, hours  | `src/partials/head.html` (JSON-LD) + `src/partials/contact.html`                               |
| Services               | `index.html` (services section)                                                                |
| Testimonials           | `index.html` (testimonials section)                                                            |
| Gallery photos         | Drop images in `public/images/showcase/`, update `<img src>` in `index.html` gallery section   |
| Colors / design tokens | `:root` block at the top of `src/css/styles.css`                                               |
| Nav + footer links     | `index.html` (nav) + `src/partials/footer.html`                                                |

## Design Tokens

```
--primary      #2C2C2A   dark charcoal
--accent       #C97B4A   terracotta orange
--spark        #8B3A1F   deep rust
--wool         #E8DCC4   warm beige
--off-white    #FAFAF8   page background
```

The `:root` block in `src/css/styles.css` also defines tints/shades (`--primary-dark`, `--accent-dark`, `--accent-light`, `--wool-light`, `--muted`, etc.).

Fonts: **Playfair Display** (headings) + **Inter** (body) — loaded from Google Fonts in `src/partials/head.html`.

## Code Style

Prettier config in `.prettierrc`: single quotes, 4-space tabs, 120 print width, LF line endings. Run `npm run format` before committing.

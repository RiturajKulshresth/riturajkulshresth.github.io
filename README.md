# riturajkulshresth.github.io

Personal portfolio of [Rituraj Kulshresth](https://riturajkulshresth.github.io) — built with Next.js 16, React 19, TypeScript, and Tailwind CSS v4. Statically exported and deployed to GitHub Pages.

## Stack

| Layer       | Choice                                |
| ----------- | ------------------------------------- |
| Framework   | Next.js 16 (App Router, static export) |
| Language    | TypeScript 5                          |
| Styling     | Tailwind CSS v4                       |
| Typography  | Geist Sans, Geist Mono, Instrument Serif |
| Icons       | react-icons                           |
| Theming     | CSS custom properties, `[data-theme]` on `<html>` (light / dark) |
| Deployment  | GitHub Pages via GitHub Actions       |

## Theming

Light and dark are equal-class themes. The active theme is set by a `data-theme` attribute on `<html>`. The initial value is resolved by a tiny inline script in `<head>` (`src/app/layout.tsx`) that runs before paint, in this order:

1. `localStorage.theme` if the user has previously toggled
2. `prefers-color-scheme` media query
3. Falls back to `dark`

Adding new theme-aware styles: use the CSS variables defined in `src/app/globals.css` (e.g. `bg-[color:var(--color-bg)]`, `text-[color:var(--color-fg-muted)]`). Avoid hardcoded `text-white` / `bg-slate-*`; they break theme switching.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Production build

```bash
npm run build
```

Static HTML is written to `out/`. Preview locally with:

```bash
npx serve out
```

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the static export and publishes it to GitHub Pages. No manual `gh-pages` step required.

**Repo settings:** Settings → Pages → Source = **GitHub Actions**.

## Project structure

```
.
├── .github/workflows/deploy.yml   # Pages deploy workflow
├── public/                        # Static assets (favicon, manifest, images)
│   └── images/                    # Project preview GIFs + résumé PDF
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout, theme init, metadata
│   │   ├── page.tsx               # Home (hero + work + projects + skills + contact)
│   │   ├── photography/page.tsx   # /photography — drag-to-pan gallery
│   │   ├── sitemap.ts
│   │   └── globals.css            # Theme tokens (light + dark) and utilities
│   ├── components/                # Navbar, Hero, Experience, Projects, Skills, Contact, Footer, PhotoGallery, PhotoLightbox, ThemeToggle
│   └── lib/
│       ├── data.ts                # Profile, projects, experience, skills, nav
│       └── photography.ts         # Photo data + URL builders
├── next.config.ts
├── package.json
└── tsconfig.json
```

## Photography

`/photography` is a fullscreen, drag-to-pan gallery (Lusion-style). Photos are sourced from Unsplash via `src/lib/photography.ts`. The gallery preserves the original interaction model from the legacy `photography` repo:

- Horizontal track translates as you drag
- Each image's `object-position` pans in the opposite direction (parallax depth)
- Web Animations API smooths every frame (1.2s, fill: forwards)
- Blurred backdrop tracks the photo nearest viewport center
- Click any frame → custom lightbox with keyboard navigation (←, →, Esc)

To add photos, edit `src/lib/photography.ts`. The `u(id, ix)` helper composes the three Unsplash URL variants (`small` / `regular` / `full`).

## Editing content

All content lives in [`src/lib/data.ts`](./src/lib/data.ts):

- `profile` — name, role, bio, location, contact
- `experience` — work + education timeline (most recent first)
- `projects` — selected work with tags and links
- `skillGroups` — categorised skills
- `socialLinks` — footer + contact section
- `navItems` / `externalLinks` — header navigation

Updating any of these and pushing to `main` re-deploys automatically.

## Scripts

| Script           | Purpose                                |
| ---------------- | -------------------------------------- |
| `npm run dev`    | Local dev server on port 3000          |
| `npm run build`  | Static export to `out/`                |
| `npm run start`  | Serve a production build               |
| `npm run lint`   | Next.js ESLint                         |
| `npm run clean`  | Wipe `node_modules`, lockfile, `.next`, `out` |

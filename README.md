# riturajkulshresth.github.io

Personal portfolio of [Rituraj Kulshresth](https://riturajkulshresth.github.io), built with Next.js 16, React 19, TypeScript, and Tailwind CSS v4. Statically exported and deployed to GitHub Pages.

The site is more than a single page: the same portfolio content is presented through several swappable "render modes" (Default, Windows 95, CLI, Editorial, Magazine, Munchkin Cat, Bad UI), plus two standalone experiences (a drag-to-pan Photography gallery and a full cyberpunk Terminal with a 10-game arcade).

## Stack

| Layer       | Choice                                |
| ----------- | ------------------------------------- |
| Framework   | Next.js 16 (App Router, static export) |
| Language    | TypeScript 5                          |
| Styling     | Tailwind CSS v4                       |
| Typography  | Geist Sans, Geist Mono, Instrument Serif |
| Icons       | react-icons, lucide-react             |
| Theming     | CSS custom properties, `[data-theme]` on `<html>` (light / dark) |
| Deployment  | GitHub Pages via GitHub Actions       |

## Architecture at a glance

```
src/
├── app/
│   ├── layout.tsx              # Root layout: fonts, metadata, pre-paint theme init script
│   ├── page.tsx                # Home (= the "Default" render mode)
│   ├── globals.css             # Theme tokens (light + dark) and shared utilities
│   ├── sitemap.ts              # Static sitemap for all routes
│   │
│   ├── _default/components/    # The Default home page (private to "/")
│   │   ├── navbar.tsx          # Header + "Render Modes" dropdown + theme toggle
│   │   ├── hero.tsx, experience.tsx, projects.tsx, project-card.tsx,
│   │   ├── skills.tsx, accolades.tsx, contact.tsx, footer.tsx,
│   │   ├── section-header.tsx, cursor-glow.tsx, theme-toggle.tsx, icons.tsx
│   │
│   ├── windows95/              # Render mode: Windows 95 desktop (incl. Minesweeper)
│   ├── cli/                    # Render mode: interactive command-line shell
│   ├── editorial/              # Render mode: long-form editorial layout
│   ├── magazine/               # Render mode: print-magazine spread
│   ├── munchkincat/            # Render mode: side-scrolling cat platformer
│   ├── badui/                  # Render mode: cursed dark-pattern homage (r/badUIbattles)
│   ├── photography/            # Standalone: fullscreen drag-to-pan gallery + lightbox
│   └── terminal/               # Standalone: cyberpunk "AEGIS" terminal + arcade
│
└── lib/
    ├── data.ts                 # All portfolio content + nav/route/render-mode tables
    ├── hooks.ts                # Shared hooks (useLockBodyScroll)
    └── photography.ts          # Photo data + Unsplash URL builders
```

### Route folder convention

Every route follows the same pattern, which keeps each experience fully self-contained:

- `page.tsx`: the route entry. Interactive modes are mounted **client-only** with `next/dynamic({ ssr: false })` because the site is a static export and these components rely on browser APIs (canvas, WebGL, keyboard, audio).
- `layout.tsx`: per-route `metadata` (title/description) for that mode.
- `_<mode>/components/`: a **private** component folder (the leading underscore tells Next.js it is not a route). Each mode also ships a small `back-button.tsx` that links back to `/`.

This means you can read or modify any single mode without touching the others.

## Render modes

All portfolio content is defined once in `src/lib/data.ts` and re-presented by each mode. The modes are aggregated under the navbar's "Render Modes" dropdown via the `renderModes` table in `data.ts`.

| Route           | Mode          | What it is |
| --------------- | ------------- | ---------- |
| `/`             | Default       | The primary scroll-narrative portfolio (hero, work, projects, skills, recognition, contact). |
| `/windows95`    | Windows 95    | A Windows-95-style desktop with draggable windows; includes a full Minesweeper (first-click safety, chord click, flag mode, timer). |
| `/cli`          | CLI           | A keyboard-driven command-line shell that exposes the portfolio as commands. |
| `/editorial`    | Editorial     | A calm, long-form editorial reading layout. |
| `/magazine`     | Magazine      | A print-magazine-style spread. |
| `/munchkincat`  | Munchkin Cat  | A side-scrolling platformer where a cat explores rooms ("stations") that surface portfolio content. |
| `/badui`        | Bad UI        | A deliberately cursed, dark-pattern homage to r/badUIbattles: a countdown cookie wall (with a one-time reset), a jittery exact-match slider age gate, a three-strike captcha whose tiles scramble under your cursor, a loading bar that collapses twice near the finish, then the portfolio in Comic Sans with running buttons, marquees, a self-breeding swarm of fake ad pop-ups, whack-a-mole notification spam, a blinking ad ticker, recurring newsletter popups, scroll-hijacking, a copy/right-click nag, and a paperclip assistant. Hostile but never a trap: each gate's skip is bounded (a countdown plus an escalating guilt-trip confirm chain), the Exit always works instantly, and it respects `prefers-reduced-motion`. |
| `/photography`  | Photography   | Standalone fullscreen gallery (see below). |
| `/terminal`     | Terminal      | Standalone cyberpunk terminal with an arcade (see below). |

## Theming

Light and dark are equal-class themes set by a `data-theme` attribute on `<html>`. The initial value is resolved by a tiny inline script in `<head>` (`src/app/layout.tsx`, `THEME_INIT_SCRIPT`) that runs **before paint** to avoid a flash-of-wrong-theme, in this order:

1. `localStorage.theme` if the user has previously toggled
2. `prefers-color-scheme` media query
3. Falls back to `dark`

Add theme-aware styles using the CSS variables in `src/app/globals.css` (e.g. `bg-[color:var(--color-bg)]`, `text-[color:var(--color-fg-muted)]`). Avoid hardcoded `text-white` / `bg-slate-*`; they break theme switching.

The Terminal mode has its own independent palette system (GREEN / AMBER / COSMIC "spectrum" presets) that does not use the site-wide light/dark theme.

## Photography

`/photography` is a fullscreen, drag-to-pan gallery (Lusion-style). Photo data lives in `src/app/photography/_photography/data.ts` and is sourced from Unsplash. Interaction model:

- Horizontal track translates as you drag
- Each image's `object-position` pans in the opposite direction (parallax depth)
- Web Animations API smooths every frame
- Blurred backdrop tracks the photo nearest viewport center
- Click any frame to open the custom lightbox with keyboard navigation (left, right, Esc)
- A minimal back button returns to the home page; a counter pill shows position

## Terminal and the arcade

`/terminal` (`src/app/terminal/_terminal/`) is a cyberpunk "AEGIS" control surface. `App.tsx` (`AppShell`) composes the whole screen: a WebGL shader background, a live weighted log stream, a suite of HUD visualizers, and a re-skinned presentation of the projects/skills/resume data.

Key pieces:

- `audio.ts`: a small Web Audio synth (`synth`) for retro SFX and an ambient drone. Audio is unlocked during the boot sequence to satisfy the browser autoplay gesture requirement.
- `contexts/OverdriveContext.tsx`: a global "overdrive" toggle backed by a draining/recharging **stamina** reserve. It drives every visualizer's speed and accent, and is mirrored by the SkillMatrix OVERCLOCK button and the arcade's speed multiplier.
- `types.ts`: shared terminal types (e.g. `SystemLog`).
- Visualizers: `ShaderCanvas` (WebGL warp field with Bayer dithering), `CoreVisualizer`, `SpectralAnalyzer` (FFT + Lorenz attractor), `TelemetrySparkGrid`, `EntropyMeter`, `BackgroundLogStream`, `BootSequence`, `AiCore`, `ProjectGrid`, `SkillMatrix`, `ResumeTimeline`.

> Note: `App.tsx` opts out of type-checking/linting (`@ts-nocheck`, `eslint-disable`) because it is a dense, ported HUD. Do not remove those headers unless you are prepared to fix the resulting reports.

### Arcade games

`components/ArcadeTerminal.tsx` is the host for a 10-game arcade. Each game is an isolated engine implementing a shared interface, so the host owns the runtime and input while each game owns only its own logic.

- `games/types.ts`: the contracts.
  - `GameEngine`: `{ init, update, draw }`.
  - `GameContext`: canvas/2d-context, `colorPreset`, `speedFactor` (overdrive), `playRetroSFX`, `setScore`, `setGameState`, `checkAndSaveHighScore`, plus color helpers.
  - `GameInput`: `{ keysPressed, mouseX, mouseY, mouseClicked }`.
- `games/index.ts`: maps a game id to its engine instance.
- `ArcadeTerminal.tsx`: runs the `requestAnimationFrame` loop, normalizes input (keyboard, mouse, touch, and an always-visible translucent on-screen control pad that dispatches synthetic key events), persists high scores to `localStorage`, and draws the IDLE / PLAYING / GAMEOVER / VICTORY overlays.

The game states separate a **win** (`VICTORY`, green overlay) from a **loss** (`GAMEOVER`, red overlay). Several games carry a 3-life system; the rest are single-life by genre.

| Game id    | Cabinet name | Notes |
| ---------- | ------------ | ----- |
| SNAKE      | Snake        | Single-life. |
| BREAKOUT   | Firewall     | 3 lives; clear all blocks to win (VICTORY). |
| SHOOTER    | Defense.LOG  | 3 lives; **power-ups** (rapid, spread, shield, life); boss waves. |
| PONG       | Pong         | 3 lives; symmetric scoring vs CPU. |
| ASTEROIDS  | Orbit.BIN    | 3 lives + invuln respawn; **power-ups** (rapid, triple, shield, life); toroidal screen wrap. |
| FLAPPY     | Flappy       | Single-life. |
| FROGGER    | Frogger      | 3 lives. |
| PACMAN     | Pac-Man      | 3 lives; real tile maze, ghost AI, power pellets; clear all pellets to win. |
| HIGHWAY    | Speedway     | 3 lives + invuln; Space/Up/W nitro boost. |
| DINO       | Dino Runner  | Single-life. |

## Editing content

Almost all copy lives in [`src/lib/data.ts`](./src/lib/data.ts):

- `profile`: name, role, bio, location, contact, status
- `experience`: work + education timeline (most recent first)
- `projects`: selected work with tags, year, and links
- `skillGroups`: categorised skills
- `accolades`: awards and recognition
- `socialLinks`: footer + contact section
- `navItems`: in-page anchor navigation for the Default mode
- `routes`: standalone routes surfaced in the navbar (Photography, Terminal)
- `renderModes`: the alternate-presentation routes in the "Render Modes" dropdown

Updating any of these and pushing to `main` re-deploys automatically. Photos are edited in `src/app/photography/_photography/data.ts`.

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

**Repo settings:** Settings, then Pages, then Source = **GitHub Actions**.

## Scripts

| Script           | Purpose                                |
| ---------------- | -------------------------------------- |
| `npm run dev`    | Local dev server on port 3000          |
| `npm run build`  | Static export to `out/`                |
| `npm run start`  | Serve a production build               |
| `npm run lint`   | Next.js ESLint                         |
| `npm run clean`  | Wipe `node_modules`, lockfile, `.next`, `out` |

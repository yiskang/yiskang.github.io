# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

This is `yiskang.github.io`, a personal GitHub Pages static site (a resume/landing page) served from `index.html` at the repo root. It's built on the "Start Bootstrap - Freelancer" template, ported to Bootstrap 5 + Sass + vanilla JS (ES modules) and bundled with Vite. No jQuery, no contact form/PHP mail handler — those were dropped during the Vite migration.

Deployment is via GitHub Actions (`.github/workflows/deploy.yml`): pushing to `master` runs `npm run build` and deploys `dist/` to GitHub Pages. `public/CNAME` is copied into `dist/` as-is for the custom domain. Nothing needs to be built/committed manually.

## Commands

```bash
npm install         # install deps (vite, sass, bootstrap 5, fontawesome, fontsource, etc.)
npm run dev         # Vite dev server with HMR
npm run build       # production build to dist/
npm run preview     # serve the dist/ build locally
```

There is no test suite or linter configured in this repo.
To sanity-check CSS/layout changes, run `npm run dev` and check the page in a
browser at a few viewport sizes — a Playwright MCP browser (if available) works
well for this since the site is a single scrolling page sensitive to viewport height.

## Architecture

- `index.html` — the entire page (single page: nav, header/intro, footer), and the Vite entry point. It loads `/src/js/main.js` as a `<script type="module">`. All content edits happen here directly; there's no templating engine.
- `src/scss/main.scss` — theme styles (`@import`s `_variables.scss` and Bootstrap 5's Sass source), compiled by Vite. Edit this, not any generated CSS in `dist/`.
- `src/scss/_variables.scss` — theme color variables, mapped onto Bootstrap's own `$primary`/`$success` so generated Bootstrap components pick up the same palette.
- `src/js/main.js` — vanilla JS entry: imports Fontawesome/Fontsource CSS and `main.scss`, sets up the sticky-navbar-on-scroll class toggle (replacement for Bootstrap 3's removed "Affix"), closes the mobile nav on link click via Bootstrap 5's `Collapse`, and sets the footer's copyright year dynamically.
- `public/CNAME` — copied verbatim into `dist/` by Vite for the GitHub Pages custom domain.
- `.github/workflows/deploy.yml` — CI: builds with `npm run build` and deploys `dist/` to GitHub Pages on push to `master`.

## Notes

- The site was migrated off gulp/LESS/jQuery to Vite/Sass/vanilla-JS; if you see references to `gulpfile.js`, `less/`, `vendor/`, or jQuery in old commits/docs, they no longer apply.

# Vite + Bootstrap 5 + Vanilla JS Migration

## Context

`yiskang.github.io` is a single-page personal resume site currently built with gulp,
Bootstrap 3 (LESS), and jQuery, served directly from the repo root by GitHub Pages
("Deploy from a branch"). The build output (`css/*.min.css`, `js/*.min.js`) and a
copied `vendor/` folder are committed manually — there is no CI.

Investigation during design turned up two important facts that shrink this project's
real scope:

- `js/contact_me.js` and `js/jqBootstrapValidation.js` are **dead code**. Neither is
  referenced by any `<script>` tag in `index.html`, and there is no `<form>` in the
  page at all — the contact form (and its `mail/contact_me.php` backend, which was
  never part of this repo) was removed when the site pivoted from the original
  "Freelancer" template to a resume page in 2017. No form-handling design is needed;
  these files are simply deleted.
- The live `js/freelancer.js` behavior — smooth-scroll and scrollspy — targets nav
  items that are almost all external links (GitHub, Blog) plus one hidden `#page-top`
  anchor. There are no real internal page sections to scroll-spy on. Per the user's
  direction, this functionality is dropped rather than ported, leaving only the two
  effects that visibly matter today (mobile-menu-closes-on-click, sticky navbar
  background on scroll).

## Goals

1. Replace the gulp build with **Vite**.
2. Remove **jQuery** and all jQuery-dependent code/plugins.
3. Upgrade **Bootstrap 3 → Bootstrap 5** (LESS → Sass), preserving the current visual
   design.
4. Resolve security exposure in the toolchain and remove un-integrity-checked CDN
   scripts.
5. **Do not touch, move, or modify the root `CNAME` file.**

## Non-goals

- No visual/content redesign — the goal is preserving the current look under new
  tooling, not restyling.
- No reintroduction of contact-form functionality.
- No test suite — this is a static personal page; verification is manual (see
  Testing/Verification below).

## Architecture

### Build tooling

- Vite becomes the only build tool. `index.html` stays at the repo root as Vite's
  entry point (Vite convention). `package.json` gains real scripts:
  - `dev` — `vite` (local dev server with HMR)
  - `build` — `vite build` (outputs to `dist/`)
  - `preview` — `vite preview` (serve the production build locally)
- All dependencies (Bootstrap 5, Sass, Font Awesome) are installed via npm and
  imported from source (`src/js/main.js`, `src/scss/main.scss`) rather than copied
  into a committed `vendor/` folder.
- `gulpfile.js`, `vendor/`, and the gulp-related devDependencies are deleted.
- Static images move into `public/`, which Vite copies into `dist/` unprocessed.
- `dist/` is a build artifact, not committed to the repo (git-ignored).

### Deployment

- A new GitHub Actions workflow (`.github/workflows/deploy.yml`) builds the site with
  Vite on push to `master` and deploys it:
  1. Checkout, `npm ci`, `npm run build`
  2. `actions/upload-pages-artifact` on `dist/`
  3. `actions/deploy-pages`
- `public/CNAME` is added with the same content as the existing root `CNAME`, so Vite
  copies it into `dist/` and the custom domain (`www.yiskang.tw`) keeps working under
  Actions-based deploys. **The existing root `CNAME` file is left completely
  untouched** — it is not read, moved, or deleted by anything in this migration.
- Rollout sequencing: merge and verify the workflow runs green (via `workflow_dispatch`
  or a push) *before* flipping **Settings → Pages → Source** from "Deploy from a
  branch" to "GitHub Actions", so the live site has no gap in availability. GitHub
  Pages keeps serving the last successful deployment until the new one succeeds,
  regardless of source type, and the custom-domain setting itself is stored at the
  repository level independent of which source mode is active.

### HTML / CSS (Bootstrap 3 → 5)

- Markup updated for Bootstrap 5's renamed classes/attributes:
  - `data-toggle` / `data-target` → `data-bs-toggle` / `data-bs-target`
  - `.navbar-toggle` → `.navbar-toggler`
  - `.sr-only` → `.visually-hidden`
  - `.img-responsive` → `.img-fluid`
  - `.hidden` → `d-none`
  - `.list-inline` children get `.list-inline-item`
  - `navbar-default` / `navbar-fixed-top` restructured to `navbar` + `fixed-top` +
    `navbar-light` / `bg-*` utilities
- IE8 shims (`html5shiv`, `respond.js` conditional comments) removed — Bootstrap 5
  doesn't support IE, so these are dead weight.
- `less/` is ported to `src/scss/`, importing Bootstrap 5's Sass source and
  overriding its variables (`$primary`, `$success`, gray scale, etc.) with the
  existing theme values, instead of hand-rolling overrides against compiled CSS.
  Custom rules (`.navbar-custom`, header/`.intro-text`, social buttons) are ported
  to Sass as-is to preserve the current look.
- Dead CSS tied to the already-removed contact form (`.floating-label-form-group`
  and related rules, ~50 lines in `freelancer.less`) is deleted.
- `css/main.css` (the small hand-written override file) is folded into the new Sass
  structure rather than kept as a separate loose CSS file.
- Font Awesome upgrades from the vendored v4 copy to **Font Awesome 6 Free**
  (`@fortawesome/fontawesome-free` — fully open-source, no account or commercial
  license required, distinct from the separately-sold `@fortawesome/fontawesome-pro`),
  imported into the Sass build instead of a copied `vendor/font-awesome` folder.
  Icon markup updates accordingly:
  - `fa fa-github-alt` → `fab fa-github` (the `-alt` variant was removed after v4)
  - `fa fa-facebook` → `fab fa-facebook`
  - `fa fa-linkedin` → `fab fa-linkedin`
  - `fa fa-envelope` → `fas fa-envelope`
  - `fa fa-bars` → `fas fa-bars`
  - `fa-fw` is unchanged

### JavaScript (jQuery removal)

- `js/contact_me.js` and `js/jqBootstrapValidation.js` are deleted outright (dead
  code, see Context).
- `js/freelancer.js` is replaced by a small vanilla-JS `src/js/main.js` covering only
  what's actually live today:
  - Close the mobile nav menu on nav-link click, using Bootstrap 5's native
    `bootstrap.Collapse` API.
  - Sticky-navbar-background-on-scroll effect (replacing the removed `Affix`
    plugin) via a small `scroll` event listener toggling a class, mirroring the
    current `.navbar-custom.affix` CSS.
  - Scrollspy and smooth-scroll-to-anchor are dropped, not ported (confirmed with
    user — no real internal sections to spy on currently; straightforward to
    reintroduce later via Bootstrap 5's native `data-bs-spy="scroll"` if sections
    are added back).
- Bootstrap 5's JS is imported from the npm package into `main.js`, importing only
  the `Collapse` component (not the full bundle) to keep bundle size down.
- jQuery, both/all copies of jQuery Migrate, and the CDN-loaded jQuery Easing plugin
  are all removed — nothing in the surviving JS depends on them.

### Security cleanup

- After the npm/Vite migration, run `npm audit` and resolve anything flagged.
  Expected to be minimal, since gulp 3.x, browser-sync, and old uglify — the likely
  sources of stale transitive dependencies — are all removed by this migration.
- CDN scripts loaded without Subresource Integrity hashes (`html5shiv`, `respond.js`,
  `jquery.easing`) are removed as part of the IE8-shim/jQuery cleanup above, rather
  than patched with SRI — they're no longer needed at all.

## Testing / Verification

No automated test suite exists today, and none is being added — this is a static
personal page. Verification for this migration is manual:

- `npm run dev` — visual check of the migrated page against the current live site.
- `npm run build && npm run preview` — confirm the production build renders
  identically to dev.
- `npm audit` — confirm no outstanding vulnerabilities in the new toolchain.
- A successful run of the new GitHub Actions deploy workflow (via
  `workflow_dispatch`) before flipping the Pages source setting.

## Out of scope / explicitly preserved

- Root `CNAME` file — untouched throughout.
- Overall visual design/branding — preserved as closely as the Sass port allows.
- Google Fonts `<link>` tags (Montserrat, Lato) — left as-is; no SRI hardening was
  requested beyond removing the now-dead CDN scripts.

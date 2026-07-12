# Vite + Bootstrap 5 + Vanilla JS Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the gulp/Bootstrap 3/jQuery toolchain of this static personal site with Vite/Bootstrap 5/vanilla JS, resolve toolchain security exposure, and switch deployment to a GitHub Actions Pages workflow — without touching the root `CNAME` file.

**Architecture:** `index.html` stays at the repo root as Vite's entry point. All theme/behavior source moves under `src/` (`src/scss/`, `src/js/`) and is imported from a single `src/js/main.js` module, which Vite bundles into `dist/`. Dependencies (Bootstrap 5, Sass, Font Awesome, self-hosted fonts) are npm packages, not committed vendor copies. A new GitHub Actions workflow builds and deploys `dist/` to GitHub Pages.

**Tech Stack:** Vite 8, Sass (Dart Sass) via the `sass` npm package, Bootstrap 5.3 (Sass source + the standalone `Collapse` JS module), `@fortawesome/fontawesome-free` 7 (free tier), `@fontsource/montserrat` + `@fontsource/lato` for self-hosted fonts.

## Global Constraints

- Do not touch, move, or modify the root `CNAME` file (spec requirement, verified untouched throughout this plan).
- No visual/content redesign — preserve the current rendered look; only the plumbing underneath changes.
- No contact-form functionality is reintroduced (it was already dead code, confirmed unreferenced in `index.html`).
- No automated test suite is added — this is a static personal page; verification is manual per task.
- Use `@fortawesome/fontawesome-free` (the open-source tier) — never `@fortawesome/fontawesome-pro`.
- Any CSS with no matching element in current `index.html` (portfolio/modal/section/scroll-top/btn-primary/btn-success/star-primary/img-centered/footer-above/footer-col) is deleted, not ported — confirmed with user.
- `npm audit` must report 0 vulnerabilities against the dependency set introduced by this plan (already verified during planning: `vite@^8.1.4`, `sass@^1.101.0`, `bootstrap@^5.3.8`, `@fortawesome/fontawesome-free@^7.3.0`, `@fontsource/montserrat@^5.2.8`, `@fontsource/lato@^5.2.7` — 0 vulnerabilities as of plan-writing time).

---

## File Structure

**Created:**
- `package.json` — rewritten (Vite scripts, new dependency set)
- `.gitignore` — new (`node_modules/`, `dist/`)
- `public/CNAME` — new, same content as root `CNAME`, so Vite copies it into `dist/`
- `src/scss/_variables.scss` — theme color variables, mapped onto Bootstrap's own `$primary`/`$success`
- `src/scss/main.scss` — Bootstrap import + all surviving custom rules from `freelancer.less`/`main.css`
- `src/js/main.js` — Vite entry: font/icon CSS imports, Bootstrap `Collapse` import, sticky-nav-on-scroll + close-menu-on-click behavior
- `.github/workflows/deploy.yml` — GitHub Actions build+deploy workflow

**Modified:**
- `index.html` — Bootstrap 5 markup/attribute updates, dead `<link>`/`<script>`/`<meta>` removal, new Vite entry `<script>` tag

**Deleted:**
- `gulpfile.js`
- `vendor/` (entire directory — Bootstrap 3, jQuery, jQuery Migrate ×2, Font Awesome 4, all manually copied)
- `css/` (entire directory — `freelancer.css`, `freelancer.min.css`, `main.css`; folded into `src/scss/main.scss`)
- `less/` (entire directory — `freelancer.less`, `variables.less`, `mixins.less`; ported to `src/scss/`)
- `js/contact_me.js` (dead code, unreferenced)
- `js/jqBootstrapValidation.js` (dead code, unreferenced)
- `js/freelancer.js` / `js/freelancer.min.js` (replaced by `src/js/main.js`)

**Untouched:**
- Root `CNAME`
- `LICENSE`
- `img/` (already unused — `index.html`'s profile photo is an external URL — left as-is, out of scope)

---

### Task 1: Vite/npm scaffolding — replace the gulp toolchain

**Files:**
- Modify: `package.json` (full rewrite)
- Create: `.gitignore`
- Delete: `gulpfile.js`, `vendor/`, `css/`, `less/`

**Interfaces:**
- Produces: `npm run dev`, `npm run build`, `npm run preview` scripts that later tasks (and the final verification task) rely on. `sass` and `bootstrap`'s Sass source become available under `node_modules` for Task 4. `bootstrap/js/dist/collapse` and the font/icon packages become available for Task 5.

- [ ] **Step 1: Rewrite `package.json`**

```json
{
  "name": "freelancer",
  "title": "Freelancer",
  "version": "3.3.7+1",
  "homepage": "http://yiskang.github.io",
  "author": "yiskang",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/yiskang/yiskang.github.io.git"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "vite": "^8.1.4",
    "sass": "^1.101.0"
  },
  "dependencies": {
    "bootstrap": "^5.3.8",
    "@fortawesome/fontawesome-free": "^7.3.0",
    "@fontsource/montserrat": "^5.2.8",
    "@fontsource/lato": "^5.2.7"
  }
}
```

- [ ] **Step 2: Create `.gitignore`**

```
node_modules/
dist/
```

- [ ] **Step 3: Delete the old toolchain files**

```bash
git rm -r gulpfile.js vendor css less
```

- [ ] **Step 4: Install dependencies and verify**

Run: `npm install`
Expected: install succeeds, `node_modules/` is created, no errors. Note: npm may warn about blocked install scripts for `@parcel/watcher`/`fsevents` (macOS-only optional native deps used by Vite's file watcher) — this is expected and harmless, not a failure.

Run: `npm audit`
Expected: `found 0 vulnerabilities`

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json .gitignore
git commit -m "Replace gulp toolchain with Vite/npm scaffolding"
```

(The deletions from Step 3 are already staged by `git rm`; they'll be included in this commit automatically alongside the two `git add` targets above — check `git status` shows `gulpfile.js`, `vendor/`, `css/`, `less/` as deleted before committing.)

---

### Task 2: Delete dead JavaScript files

**Files:**
- Delete: `js/contact_me.js`, `js/jqBootstrapValidation.js`, `js/freelancer.js`, `js/freelancer.min.js`

**Interfaces:**
- Consumes: nothing (these files are already unreferenced by `index.html` — verified during brainstorming: no `<script>` tag loads `contact_me.js` or `jqBootstrapValidation.js`, and no `<form>` exists in the page at all).
- Produces: an empty `js/` directory (removed in this task since nothing remains in it).

- [ ] **Step 1: Confirm the files are truly unreferenced before deleting**

Run: `grep -rn "contact_me\|jqBootstrapValidation\|freelancer.js\|freelancer.min.js" index.html`
Expected: no output (confirms nothing in the current HTML loads these files — `js/freelancer.js`/`.min.js` are still referenced today since `index.html` hasn't been updated yet in this plan; if that grep DOES show a hit for `freelancer.min.js`, that's expected at this point in the plan and is resolved by Task 6, not this task).

- [ ] **Step 2: Delete the dead files and the now-empty directory**

```bash
git rm js/contact_me.js js/jqBootstrapValidation.js js/freelancer.js js/freelancer.min.js
rmdir js
```

- [ ] **Step 3: Verify**

Run: `ls js 2>&1`
Expected: `ls: js: No such file or directory` (or platform equivalent)

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Delete dead contact-form JS and old freelancer.js (replaced in later tasks)"
```

---

### Task 3: Add `public/CNAME` for Actions-based deploys

**Files:**
- Create: `public/CNAME`

**Interfaces:**
- Produces: `public/CNAME`, which Vite's build copies verbatim into `dist/CNAME` (verified during planning: `vite build` copies files from `public/` unprocessed into the output root).

- [ ] **Step 1: Read the existing root CNAME's exact content (do not modify it)**

Run: `cat CNAME` (for reference only — do not edit this file, per the Global Constraints)
Expected output: `www.yiskang.tw` (no trailing newline)

- [ ] **Step 2: Create `public/CNAME` with identical content**

Create `public/CNAME` containing exactly:
```
www.yiskang.tw
```
(No trailing newline — match the root file's exact byte content. If your editor auto-appends a trailing newline, verify with `xxd public/CNAME | tail -2` that the last line ends in `74 77` (`tw`) with no trailing `0a`.)

- [ ] **Step 3: Verify the root CNAME is untouched**

Run: `git status --short CNAME`
Expected: no output (file is not modified/staged — it must not appear in `git status` at all)

- [ ] **Step 4: Commit**

```bash
git add public/CNAME
git commit -m "Add public/CNAME so the Vite build carries the custom domain into dist/"
```

---

### Task 4: Port the LESS theme to Sass, dropping CSS with no matching HTML

**Files:**
- Create: `src/scss/_variables.scss`
- Create: `src/scss/main.scss`

**Interfaces:**
- Consumes: `bootstrap/scss/bootstrap` (from Task 1's `bootstrap` dependency), `sass:color` built-in module.
- Produces: a single compiled stylesheet (imported by `src/js/main.js` in Task 5) providing `.navbar-custom`, `.navbar-custom.affix`, `header`/`.intro-text`, `hr.star-light`, `.btn-outline`, `.btn-social`, `footer .footer-below`, and base typography — matching the current rendered page exactly, with all CSS for elements not present in `index.html` (portfolio, modal, section, scroll-top, `.btn-primary`/`.btn-success`, `hr.star-primary`, `.img-centered`, `footer .footer-above`/`.footer-col`) removed rather than ported.

- [ ] **Step 1: Create `src/scss/_variables.scss`**

```scss
$theme-primary: #2C3E50;
$theme-success: #18BC9C;

// Map onto Bootstrap's own theme variables so its generated component
// styles (e.g. .btn-primary, .bg-primary) pick up the same palette.
$primary: $theme-primary;
$success: $theme-success;
```

- [ ] **Step 2: Create `src/scss/main.scss`**

```scss
@use "sass:color";

@import "variables";
@import "bootstrap/scss/bootstrap";

body {
  font-family: 'Lato', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  overflow-x: hidden;
}

p {
  font-size: 20px;
}

p.small {
  font-size: 16px;
}

a,
a:hover,
a:focus,
a:active,
a.active {
  color: $theme-success;
  outline: none;
}

h1, h2, h3, h4, h5, h6 {
  font-family: "Montserrat", "Helvetica Neue", Helvetica, Arial, sans-serif;
  text-transform: uppercase;
  font-weight: 700;
}

hr.star-light {
  padding: 0;
  border: none;
  border-top: solid 5px;
  text-align: center;
  max-width: 250px;
  margin: 25px auto 30px;
  border-color: white;

  &:after {
    content: "\f005";
    font-family: "Font Awesome 7 Free";
    font-weight: 900;
    display: inline-block;
    position: relative;
    top: -0.8em;
    font-size: 2em;
    padding: 0 0.25em;
    background-color: $theme-success;
    color: white;
  }
}

header {
  text-align: center;
  background: $theme-success;
  color: white;

  .container {
    padding-top: 100px;
    padding-bottom: 50px;
  }

  img {
    display: block;
    margin: 0 auto 20px;
  }

  img.img-profile {
    border-radius: 50%;
    width: 320px;
  }

  .intro-text {
    .name {
      display: block;
      font-family: "Montserrat", "Helvetica Neue", Helvetica, Arial, sans-serif;
      text-transform: uppercase;
      font-weight: 700;
      font-size: 2em;
    }

    .skills {
      font-size: 1.25em;
      font-weight: 300;
    }
  }
}

@media (min-width: 768px) {
  header {
    .container {
      padding-top: 200px;
      padding-bottom: 100px;
    }

    .intro-text {
      .name {
        font-size: 4.75em;
      }

      .skills {
        font-size: 1.75em;
      }
    }
  }
}

.navbar-custom {
  background: $theme-primary;
  font-family: "Montserrat", "Helvetica Neue", Helvetica, Arial, sans-serif;
  text-transform: uppercase;
  font-weight: 700;
  border: none;

  a:focus {
    outline: none;
  }

  .navbar-brand {
    color: white;

    &:hover,
    &:focus,
    &:active,
    &.active {
      color: white;
    }
  }

  .navbar-nav {
    letter-spacing: 1px;

    li {
      a {
        color: white;

        &:hover {
          color: $theme-success;
          outline: none;
        }

        &:focus,
        &:active {
          color: white;
        }
      }

      &.active {
        a {
          color: white;
          background: $theme-success;

          &:hover,
          &:focus,
          &:active {
            color: white;
            background: $theme-success;
          }
        }
      }
    }
  }

  .navbar-toggler {
    color: white;
    text-transform: uppercase;
    font-size: 10px;
    border-color: white;

    &:hover,
    &:focus {
      background-color: $theme-success;
      color: white;
      border-color: $theme-success;
    }
  }
}

// NOTE: padding here is 15px (not the 25px in the original freelancer.less)
// because css/main.css loaded after freelancer.min.css in the old index.html
// and overrode it to 15px — this preserves the site's actual current look.
@media (min-width: 768px) {
  .navbar-custom {
    padding: 15px 0;
    transition: padding 0.3s;

    .navbar-brand {
      font-size: 2em;
      transition: all 0.3s;
    }
  }

  .navbar-custom.affix {
    padding: 10px 0;

    .navbar-brand {
      font-size: 1.5em;
    }
  }
}

footer {
  color: white;

  .footer-below {
    padding: 25px 0;
    background-color: color.adjust($theme-primary, $lightness: -5%);
  }
}

.btn-outline {
  color: white;
  font-size: 20px;
  border: solid 2px white;
  background: transparent;
  transition: all 0.3s ease-in-out;
  margin-top: 15px;

  &:hover,
  &:focus,
  &:active,
  &.active {
    color: $theme-success;
    background: white;
    border: solid 2px white;
  }
}

.btn-social {
  display: inline-block;
  height: 50px;
  width: 50px;
  border: 2px solid white;
  border-radius: 100%;
  text-align: center;
  font-size: 20px;
  line-height: 45px;
}

.btn:focus,
.btn:active,
.btn.active {
  outline: none;
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npx vite build 2>&1 | tail -30`

(This will fail at this point in the plan because `src/js/main.js` and the updated `index.html` don't exist yet — Task 5 and Task 6 create them. For this step, instead directly verify Sass compiles standalone:)

Run: `npx sass --load-path=node_modules src/scss/main.scss /tmp/main-check.css 2>&1 | tail -20`
Expected: compiles successfully (a `.css` file is written to `/tmp/main-check.css`). You will see many repeated deprecation warnings originating from `node_modules/bootstrap/scss/_functions.scss` (e.g. `color.channel(...)` suggestions) — this is a known upstream Bootstrap 5.3.x issue with newer Dart Sass versions, not something introduced by this change, and does not fail the build. Then clean up: `rm /tmp/main-check.css`

- [ ] **Step 4: Commit**

```bash
git add src/scss
git commit -m "Port freelancer.less theme to Sass, dropping CSS unused by current index.html"
```

---

### Task 5: Create the vanilla-JS entry point

**Files:**
- Create: `src/js/main.js`

**Interfaces:**
- Consumes: `src/scss/main.scss` (Task 4), `bootstrap/js/dist/collapse` (Bootstrap's standalone Collapse module — no Popper dependency), `@fortawesome/fontawesome-free/css/all.min.css`, `@fontsource/montserrat/{400,700}.css`, `@fontsource/lato/{400,700,400-italic,700-italic}.css`.
- Produces: the single Vite entry module referenced by `index.html` as `<script type="module" src="/src/js/main.js">` in Task 6. Expects the final `index.html` to have `<nav id="mainNav">` and, inside the collapsible nav menu, links carrying the `.nav-link` class (both set up in Task 6) — `main.js` queries `#mainNav` for the sticky-scroll effect and `.nav-link` (scoped to the collapse container) for the close-on-click behavior.

- [ ] **Step 1: Create `src/js/main.js`**

```js
import '@fortawesome/fontawesome-free/css/all.min.css';
import '@fontsource/montserrat/400.css';
import '@fontsource/montserrat/700.css';
import '@fontsource/lato/400.css';
import '@fontsource/lato/700.css';
import '@fontsource/lato/400-italic.css';
import '@fontsource/lato/700-italic.css';
import '../scss/main.scss';

import Collapse from 'bootstrap/js/dist/collapse';

// Sticky navbar background once the page scrolls past 100px
// (replaces the removed Bootstrap 3 "Affix" plugin).
const mainNav = document.getElementById('mainNav');

function updateAffixState() {
  mainNav.classList.toggle('affix', window.scrollY > 100);
}

window.addEventListener('scroll', updateAffixState);
updateAffixState();

// Close the mobile nav menu when a nav link is clicked.
const navCollapseEl = document.getElementById('bs-example-navbar-collapse-1');

navCollapseEl.querySelectorAll('.nav-link').forEach((link) => {
  link.addEventListener('click', () => {
    Collapse.getOrCreateInstance(navCollapseEl, { toggle: false }).hide();
  });
});
```

- [ ] **Step 2: Verify it's syntactically valid**

Run: `node --check src/js/main.js`
Expected: no output (exit code 0 — `--check` only parses, it doesn't execute imports, so the browser-only `import.meta`/CSS imports won't cause errors here; full functional verification happens in Task 7 once `index.html` exists).

- [ ] **Step 3: Commit**

```bash
git add src/js/main.js
git commit -m "Add vanilla-JS entry point replacing freelancer.js and jQuery"
```

---

### Task 6: Update `index.html` for Bootstrap 5 and the Vite entry point

**Files:**
- Modify: `index.html` (full rewrite of `<head>` and `<body>`)

**Interfaces:**
- Consumes: `src/js/main.js` (Task 5), which transitively pulls in `src/scss/main.scss` (Task 4).
- Produces: the final `<nav id="mainNav">` / `#bs-example-navbar-collapse-1` / `.nav-link` structure that `main.js` (Task 5) depends on.

- [ ] **Step 1: Rewrite `index.html`**

```html
<!DOCTYPE html>
<html lang="en">

<head>

    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="">
    <meta name="author" content="">

    <title>Eason Kang</title>

</head>

<body id="page-top" class="index">

    <!-- Navigation -->
    <nav id="mainNav" class="navbar navbar-expand-md fixed-top navbar-custom">
        <div class="container">
            <a class="navbar-brand" href="#page-top"></a>
            <button type="button" class="navbar-toggler" data-bs-toggle="collapse" data-bs-target="#bs-example-navbar-collapse-1" aria-controls="bs-example-navbar-collapse-1" aria-expanded="false" aria-label="Toggle navigation">
                <span class="visually-hidden">Toggle navigation</span> Menu <i class="fas fa-bars"></i>
            </button>

            <!-- Collect the nav links, forms, and other content for toggling -->
            <div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item">
                        <a class="nav-link" href="https://github.com/yiskang">GihHub</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="https://yiskang.github.io/blog">Blog</a>
                    </li>
                </ul>
            </div>
            <!-- /.navbar-collapse -->
        </div>
        <!-- /.container-fluid -->
    </nav>

    <!-- Header -->
    <header>
        <div class="container">
            <div class="row">
                <div class="col-lg-12">
                    <img class="img-fluid img-profile" src="https://avatars3.githubusercontent.com/u/5725083?v=3&s=460" alt="">
                    <div class="intro-text">
                        <span class="name">Eason Kang</span>
                        <hr class="star-light">
                        <span class="skills">BIM Charmer - Web Developer</span>
                        <ul class="list-inline">
                            <li class="list-inline-item">
                                <a href="https://www.facebook.com/yisheng.kang" class="btn-social btn-outline" target="_blank"><i class="fab fa-fw fa-facebook"></i></a>
                            </li>
                            <li class="list-inline-item">
                                <a href="https://www.linkedin.com/in/yi-sheng-kang-b4398492" class="btn-social btn-outline" target="_blank"><i class="fab fa-fw fa-linkedin"></i></a>
                            </li>
                            <li class="list-inline-item">
                                <a href="https://github.com/yiskang" class="btn-social btn-outline" target="_blank"><i class="fab fa-fw fa-github"></i></a>
                            </li>
                            <li class="list-inline-item">
                                <a href="mailto:M9805508@mail.ntust.edu.tw" class="btn-social btn-outline"><i class="fas fa-fw fa-envelope"></i></a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </header>

    <!-- Footer -->
    <footer class="text-center">
        <div class="footer-below">
            <div class="container">
                <div class="row">
                    <div class="col-lg-12">
                        Copyright &copy; Eason Kang 2017
                    </div>
                </div>
            </div>
        </div>
    </footer>

    <script type="module" src="/src/js/main.js"></script>

</body>

</html>
```

Note what changed from the original and why:
- `<meta http-equiv="X-UA-Compatible">` and the `<!--[if lt IE 9]>` shim block are removed — Bootstrap 5 doesn't support IE at all.
- The three Bootstrap/theme/Font Awesome `<link>` tags and both Google Fonts `<link>` tags are removed — all of that CSS is now pulled in through `src/js/main.js` (Task 5) instead.
- `.navbar-header` wrapper is removed (not a Bootstrap 5 concept); toggler button and brand link become direct children of `.container`, per Bootstrap 5's documented navbar structure.
- `data-toggle`/`data-target` → `data-bs-toggle`/`data-bs-target`; `.navbar-toggle` → `.navbar-toggler`; `.sr-only` → `.visually-hidden`; `.img-responsive` → `.img-fluid`; `.list-inline` children get `.list-inline-item`; `navbar-default navbar-fixed-top` → `navbar-expand-md fixed-top` (`navbar-expand-md` reproduces the original's ≥768px collapse breakpoint); `.navbar-right` → `.ms-auto`.
- The `<li class="hidden">`/hidden `#page-top` anchor and the `page-scroll` classes are removed — they existed only to support the scrollspy/smooth-scroll behavior that was confirmed dropped (see spec).
- Icon classes updated for Font Awesome 6/7's two-class syntax: `fa fa-bars` → `fas fa-bars`, `fa fa-facebook` → `fab fa-facebook`, `fa fa-linkedin` → `fab fa-linkedin`, `fa fa-github-alt` → `fab fa-github` (the `-alt` variant was removed after v4), `fa fa-envelope` → `fas fa-envelope`.
- All `<script>` tags (jQuery ×3, Bootstrap, jQuery Easing, freelancer.min.js) are replaced by the single `<script type="module" src="/src/js/main.js">`.

- [ ] **Step 2: Verify no leftover references to removed assets**

Run: `grep -n "vendor/\|css/freelancer\|css/main.css\|jquery\|fonts.googleapis\|html5shiv\|respond.js\|data-toggle=\|navbar-header\|fa fa-" index.html`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "Migrate index.html markup to Bootstrap 5 and the Vite entry point"
```

---

### Task 7: End-to-end build/dev verification and `npm audit`

**Files:** none (verification only)

**Interfaces:**
- Consumes: everything from Tasks 1–6.

- [ ] **Step 1: Start the dev server and visually check the page**

Run: `npm run dev` (leave running)

In a browser, open the printed local URL and confirm:
- Navbar renders with a dark background, "Menu"-labeled hamburger button + `fa-bars` icon at narrow widths, GitHub/Blog links at the right at ≥768px width.
- Header shows the circular profile photo, "Eason Kang" name in Montserrat, "BIM Charmer - Web Developer" skills line, the star icon between them, and the four circular social icon buttons (Facebook, LinkedIn, GitHub, envelope).
- Scrolling down past ~100px shrinks the navbar padding and brand font size (the `.affix` class effect).
- Clicking the hamburger button at a narrow browser width opens/closes the nav menu.
- Footer shows "Copyright © Eason Kang 2017" on a dark background.
- No errors in the browser devtools console.

Stop the dev server (Ctrl+C) once confirmed.

- [ ] **Step 2: Build and preview the production bundle**

Run: `npm run build`
Expected: succeeds, prints a `dist/` asset manifest (CSS, JS, font/icon files with hashed names), similar to:
```
✓ built in ...
dist/index.html
dist/assets/index-*.css
dist/assets/index-*.js
dist/assets/*.woff2
```
(You will see repeated Sass deprecation warnings from Bootstrap's own vendored `_functions.scss` during this build — expected, see Task 4 Step 3.)

Run: `cat dist/CNAME`
Expected: `www.yiskang.tw` (confirms Task 3's `public/CNAME` was copied into the build output)

Run: `npm run preview` (leave running), open the printed local URL, and repeat the same checks as Step 1.
Stop the preview server (Ctrl+C) once confirmed.

- [ ] **Step 3: Confirm no outstanding vulnerabilities**

Run: `npm audit`
Expected: `found 0 vulnerabilities`

- [ ] **Step 4: Confirm the root CNAME was never touched by this plan**

Run: `git log --oneline -- CNAME`
Expected: shows only pre-existing commits (e.g. `7a784b8 Create CNAME`) — no new commit from this migration should appear.

No commit for this task — it's verification-only. If any check fails, return to the relevant earlier task and fix it there.

---

### Task 8: Add the GitHub Actions deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: `npm run build` (Task 1), `public/CNAME` (Task 3).
- Produces: a `dist/` Pages artifact deployable via GitHub's `actions/deploy-pages`.

- [ ] **Step 1: Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [master]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Verify `package-lock.json` is already committed (needed by `npm ci` in the workflow)**

Run: `git ls-files package-lock.json`
Expected: `package-lock.json` (confirms it was committed back in Task 1, Step 5 — `npm ci` in this workflow requires it to be present).

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "Add GitHub Actions workflow to build and deploy via Vite"
```

- [ ] **Step 4: Manual step — do not perform automatically; hand off to the repo owner**

This step requires access to GitHub repository settings and is **not something an agent should do without the user present**:

1. Push this branch and merge it (or push directly to `master`, per the user's normal workflow).
2. In the GitHub repo, go to the **Actions** tab and confirm the "Deploy to GitHub Pages" workflow has run successfully at least once (trigger it manually via **Run workflow** / `workflow_dispatch` if it hasn't run from a push yet).
3. Only after that workflow shows green: go to **Settings → Pages → Build and deployment → Source**, and change it from "Deploy from a branch" to "GitHub Actions".
4. Reload `https://www.yiskang.tw` (or `https://yiskang.github.io`) and confirm the site still loads correctly over the custom domain.

This sequencing avoids any gap in the live site's availability (see the design spec's "Deployment" section for why).

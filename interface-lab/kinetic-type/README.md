# Kinetic Type — Interface Lab / 001

A standalone experiment in variable typography, magnetic pointer response, and accessible motion. Built with plain HTML, SCSS, and JavaScript; no framework or bundler required.

## Interaction design

- A dark, grid-backed type canvas responds to the pointer: individual letters are gently repelled and spring back to rest.
- A light control panel lets visitors edit the phrase, weight, tracking, magnetism, and influence radius.
- Pause/Resume stops all movement. Reset restores the original values. Copy CSS exports the typography settings.
- Reduced-motion preference starts with the animation paused; the visitor can opt in explicitly.
- Keyboard users can operate every control and read the complete phrase as a single accessible label.

## Technical architecture

- `index.html`: semantic page and native form controls.
- `styles.scss`: layout, tokens, styling, breakpoints, and reduced-motion handling. It intentionally uses CSS-compatible SCSS so `styles.css` can be included as a ready-to-run compiled equivalent.
- `styles.css`: a ready-to-run copy of the styles for instant preview, even without a watcher.
- `script.js`: local state and DOM rendering; per-letter spring animation scheduled with `requestAnimationFrame`; `ResizeObserver` to recalculate centers after resizing. The animation loop idles when all letters settle.

## Install

Place this directory at `portfolio/interface-lab/kinetic-type/` in your GitHub Pages repository. Visit:

`https://steampunkunicorn.github.io/portfolio/interface-lab/kinetic-type/`

Run it through a local server (such as VS Code Live Server), or open the HTML directly for most features. Clipboard copying generally needs HTTPS or localhost. The Google Fonts imports require a network connection.

If your SCSS watcher outputs `styles.min.css` instead of `styles.css`, update the link in `index.html` accordingly. Otherwise, the included `styles.css` works without compilation.

The top-left Interface Lab back-link expects a future lab index at `portfolio/interface-lab/`; until then, it leads to a not-yet-created page. The Portfolio link works with the suggested directory structure.

## Good next iterations

1. Add interactive presets (magnet, repel, wave) without changing the accessibility model.
2. Add a variable-font axis inspector.
3. Build a shareable URL state and export an SVG poster.
4. Test long phrases and mobile layouts across browsers before calling this production-ready.

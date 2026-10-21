# Interface Lab — Micro Experiments

Eight standalone, framework-free demos. Add the whole `micro-experiments` folder inside `portfolio/interface-lab/`.

## Structure

- `index.html` — collection landing page
- `shared.css` — shared look, layout, focus styles
- Each experiment folder contains `index.html`, `styles.scss`, `styles.css`, and `script.js`

The experiment stylesheets load `../shared.css`; `styles.scss` is intentionally valid plain CSS syntax so you can edit it with your existing SCSS watcher. The checked-in `styles.css` means these also run immediately without a compiler.

GitHub Pages URL pattern: `https://steampunkunicorn.github.io/portfolio/interface-lab/micro-experiments/<slug>/`.

Run with a local development server such as VS Code Live Server or `python3 -m http.server`. No dependencies or bundler.

## Engineering notes

- Motion respects `prefers-reduced-motion` on load and while changing OS preference where feasible.
- Demos intentionally isolate visual effects from real controls and avoid breaking keyboard behavior.
- Color Relationships uses sRGB relative luminance calculations for WCAG 2 contrast; it is not a full color-vision simulator.
- These are portfolio experiments, not comprehensive accessibility certification. Test keyboard and assistive technology behavior in actual browsers before publishing.

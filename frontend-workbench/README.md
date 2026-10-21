# Frontend Workbench

Four accessible, framework-free frontend utilities designed for Clair Smith's portfolio.

## Installation

Copy the `frontend-workbench/` folder into the root of your `portfolio/` repository alongside `pizza-maker/`, `card-experiments/`, and `interface-lab/`.

Published URL: `https://steampunkunicorn.github.io/portfolio/frontend-workbench/`

`index.html` loads `styles.css` and `script.js` locally. `styles.scss` is the editable SCSS source; the included `styles.css` is compiled from the Sass variables in the source file and is ready to use. An SCSS watcher may compile it to CSS (update the reference if changing the output name).

## Utilities

- **Fluid Type Studio**: generates interpolated CSS `clamp()` rules for two font sizes and viewport limits. The preview models a 16px root font size.
- **ARIA State Tester**: live disclosure, native polite status announcement, keyboard-accessible ARIA tabs, and markup snapshot.
- **Performance Budget**: user-entered, manually supplied resource sizes and their comparison with a page-weight budget. This is *not* network measurement or CWV scoring.
- **Focus Inspector**: shows keyboard focus order within its own contained demo. It does not inspect other pages.

No analytics, external data calls, proprietary client code, or dependencies are used (optional Google Fonts may be loaded). The interface should work offline with system font fallbacks.

## Notes

The ARIA snippet is a state snapshot illustrating attributes. It is not a complete drop-in implementation; the actual demo's JS implements its interactive behavior. WCAG conformance cannot be inferred from a snippet or an automated score alone.

The budget bars reflect fraction of the greater of resource total or entered budget, meaning an over-budget composition fills the full bar. All values are illustrative defaults until replaced by user measurements.

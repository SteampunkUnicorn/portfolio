# The Interface Lab — unified collection

This deployable folder combines **3 full experiments** and **8 micro experiments** with a unified gallery, filter/search controls, and cross-project navigation.

## Deployment

Copy the **contents** of this directory to `portfolio/interface-lab/` inside your existing GitHub Pages repository (not to an extra nested `interface-lab-complete` folder). Commit and push. All links are relative and assume `interface-lab` lives one directory below the portfolio homepage.

- `/portfolio/interface-lab/` — unified index
- `/portfolio/interface-lab/kinetic-type/` — Kinetic Type
- `/portfolio/interface-lab/floating-ui/` — Floating UI
- `/portfolio/interface-lab/accessible-by-design/` — Accessible by Design
- `/portfolio/interface-lab/micro-experiments/` — micro collection index
- `/portfolio/interface-lab/micro-experiments/<slug>/` — individual mini experiments

`styles.scss` and `styles.css` are both included at the root; each experiment keeps its own SCSS, CSS and JS. The unified navigation uses `lab-navigation.css` in the root, referenced by relative paths. A Sass watcher is optional for the included precompiled CSS.

To link from your portfolio homepage, point the **Interface Lab** project card to `./interface-lab/` and replace the original work-in-progress label with an active project link. A separate updated portfolio homepage file is available alongside the ZIP. Apply that file to your portfolio root only if you want its Interface Lab card linked.

## Accessibility & testing

The gallery works as standard links without JavaScript; filters and search enhance it. Controls are buttons with `aria-pressed` and a search input. Focus outlines and reduced-motion styles are provided. Each standalone experiment retains its existing functionality. Run manual browser/keyboard/screen-reader tests before production claims.

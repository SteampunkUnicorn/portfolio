# Interface Lab / 002 — Floating UI Laboratory

A standalone experiment in the native Popover API, CSS Anchor Positioning and collision fallback behavior.

## Interaction design
- **Stage:** drag the trigger or move it using the 3×3 keyboard-accessible dock control.
- **Floating panel:** click the trigger to open/dismiss; Escape and light dismiss work through the native Popover API.
- **Controls:** preferred placement, panel width, anchor gap, and collision fallback enable/disable.
- **Readouts:** requested side versus *inferred* rendered side; the readout compares element bounding boxes. It is not an internal browser-placement API.
- **Progressive enhancement:** supported browsers position in CSS; otherwise a small JavaScript fallback measures boxes on interaction, scroll and resize.

## Technical plan
1. Use `popovertarget` to establish an implicit CSS anchor relationship and handle top-layer display.
2. Apply `position-area` to select the preferred placement and `position-try-fallbacks` for viewport overflow.
3. Use CSS custom properties for sizing and spacing; use JavaScript only for controlling the playground.
4. Offer drag and dock controls to test placement at screen edges; keyboard users can use every feature without dragging.
5. Explain tradeoffs in a self-documenting section below the stage.

## Install
Put this folder under `portfolio/interface-lab/floating-ui/`.

    portfolio/
      interface-lab/
        floating-ui/
          index.html
          styles.scss
          styles.css
          script.js

The resulting URL will be `https://steampunkunicorn.github.io/portfolio/interface-lab/floating-ui/` when pushed and published.

`index.html` loads `styles.css` and `script.js` from the same folder. `styles.scss` currently contains standards-compliant CSS so `styles.css` is an identical, immediately usable stylesheet; you can edit it with your existing SCSS watcher and change the output filename if your watcher minifies to `styles.min.css`.

## Browser notes
- CSS anchor positioning with collision fallbacks is supported on current major browsers, but older browsers differ.
- Fallbacks prevent *viewport* overflow. The stage is a visual testing surface, **not** a clipping boundary for native position-try placement.
- `:popover-open` and CSS positioning changes render in the next frame; the side readout is an approximation.
- Native `popover=auto` offers light dismiss and Escape behavior; the fallback uses minimal JavaScript controls.

## Future enhancements
Add preset scenarios (tiny viewport, scrolling ancestor, oversized popover), a CSS code inspector, and a controlled comparison of native vs. library placement.


## Version 2 additions

- **Live CSS Inspector:** Generated CSS reflects preferred side, size, gap, and collision fallback settings. On browsers without CSS anchor positioning, the inspector labels the JavaScript fallback explicitly.
- **Copy CSS:** Copies the generated declarations using the Clipboard API on secure origins (GitHub Pages/localhost). If clipboard access is not available, selects the generated code for manual copying.
- **Five scenarios:** Open canvas, viewport edge, oversized popover, narrowed stage, and scrollable container.
- **Important collision caveat:** Native CSS position-try fallbacks evaluate the available viewport space rather than the stage's decorative boundaries. The narrow-stage preset is intended to teach this distinction.

The scroll scenario adds an internal scroll region; unlike the CSS position-try mechanism, the demonstration's fallback uses `getBoundingClientRect()` on scroll events.

# Accessible by Design — Interface Lab / 003

A standalone progressive-enhancement teaching experiment written in HTML, CSS/SCSS, and vanilla JavaScript. No framework, bundler, or dependencies beyond optional Google Fonts.

## Interaction design

Choose one of three UI patterns with the segmented controls. Compare two functional demos side by side:

1. **Dialog** — an in-page visual imitation versus a real `showModal()` `<dialog>`, with native focus containment, Escape to close, accessible naming, and browser-managed background inertness.
2. **Form feedback** — placeholder-only input and generic error versus persistent `<label>`, associated error text, `aria-invalid`, and focus on the invalid field.
3. **Status announcement** — a visually updated counter versus a counter with a dedicated `role="status"` live-region message.

The "Always show focus outlines" checkbox is a visual inspection aid. Keyboard users still receive standard `:focus-visible` styling regardless of that checkbox.

## Layout and accessibility decisions

- Both the segmented pattern selectors and the main demo interactions use native buttons.
- Demos not currently selected are `hidden` and excluded from tab order.
- The flawed dialog is intentionally **not** modal. It is contained within the flawed example, does not trap focus, and cannot block the overall experiment's navigation. This is an anti-pattern demonstration, not a recommended solution.
- The improved dialog uses `showModal()`, a visible close control, title/description relationships, and a `method="dialog"` form.
- Improved input validation is local only; no email is sent or saved.
- No fake screen-reader preview is provided: real testing with screen readers and keyboard is necessary.
- CSS includes reduced-motion and forced-colors accommodations.

## GitHub Pages

Place these files under `portfolio/interface-lab/accessible-by-design/`:

```
accessible-by-design/
├── index.html
├── styles.scss
├── styles.css
├── script.js
└── README.md
```

Published path (after committing and deployment):
`https://steampunkunicorn.github.io/portfolio/interface-lab/accessible-by-design/`

Open `index.html` locally to test. Since the Sass source uses regular CSS syntax, `styles.scss` is already valid SCSS; the included `styles.css` is an identical working stylesheet. Your watcher can compile or minify it normally; if it writes another filename, update the HTML link.

## Suggested manual test pass

- Navigate all tabs, demonstrations, and inspector controls without a mouse.
- Open the native dialog, Tab between controls, press Escape, and verify focus returns to the Open dialog button.
- Submit the improved form empty; verify the error text is referenced by `aria-describedby` and focus is on the input.
- Try VoiceOver and NVDA on the status example; confirm the concise live-region announcement.
- Test at 200% and 400% browser zoom, in forced-colors mode, and with reduced-motion enabled.

## Engineering notes

For production applications, validation messages and dialog behavior need testing with actual browser/screen-reader combinations. These samples are deliberately narrow comparisons, **not** accessibility conformance certifications. Browser native `<dialog>` behavior: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog. W3C tutorials: https://www.w3.org/WAI/tutorials/.

## Focus-order visualizer (Version 2)

Use **Show numbered focus stops** to overlay numbered markers on focusable controls in the workbench. **Focus next stop** steps through the currently rendered controls; **Refresh order** rebuilds the markers. The overlay repositions during resize and scroll and updates when the pattern changes. A native modal restricts the overlay to its own controls.

The **Same elements. Different sequence** example intentionally reorders buttons visually with Flexbox `order` in the flawed example. Keyboard tab sequence still follows DOM order. The improved example aligns visual order with DOM order. This is an educational approximation of sequential focus order, not a complete browser focus navigation model (positive `tabindex`, shadow roots, iframes, or complex CSS visibility and inert behavior are not fully represented).

## Semantics inspector (Version 3)

The **What does the markup communicate?** panel displays selected nodes from the active flawed and improved examples side by side. It updates when you change demos, open or close the modal, submit a form, or update a status. Rows list an inferred role, accessible name, available description, and relevant state. Select a row to temporarily outline the matching element in the demo. The Refresh button triggers a manual rebuild.

**Scope/limitations:** This is deliberately an educational DOM-derived approximation, **not** access to the real browser accessibility tree or the full AccName algorithm. It uses a small subset of HTML/ARIA naming rules and selected DOM elements. In particular, placeholder text is not treated as an accessible label. For authoritative behavior, examine the browser DevTools Accessibility panel and test with screen readers.

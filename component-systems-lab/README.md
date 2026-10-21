# Component Systems Lab

A dependency-free component showcase built for the portfolio. Includes button variants, disclosures, tabs, a native modal dialog, and form validation. Shared color, spacing, and radius tokens are configurable on-page. All five demos have copyable **illustrative** implementation snippets, not complete drop-in source modules.

## Install

Copy `component-systems-lab/` into `portfolio/`, then visit `/portfolio/component-systems-lab/`. `styles.css` is browser-ready. Edit `styles.scss` as the source of styles; recompile if you change it.

## Accessible interaction

- Skip link, visible keyboard focus, semantic buttons and native form controls.
- Disclosure synchronizes `aria-expanded` with visible panel content.
- Tabs support click, Left/Right arrows, Home, and End, with a roving `tabindex`.
- Native `<dialog>` provides modal behavior and Escape; focus returns to the launch control.
- Form errors set `aria-invalid`, append field-specific error descriptions and focus the first invalid field.
- Respects `prefers-reduced-motion`.

### Scope

This is a component pattern study, not a published full design-system package and not a certification of WCAG compliance. Test with keyboard, VoiceOver/NVDA, and your chosen browser before reuse. Clipboard operations may require localhost or HTTPS.

## Optional homepage link

Add this alongside the existing project cards:

```html
<a href="./component-systems-lab/">Explore Component Systems Lab ↗</a>
```

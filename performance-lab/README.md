# Performance Lab — Interface Lab / 004

Standalone HTML + SCSS + vanilla JS experiment. No dependency or build step required for deployment.

## Install

Copy this directory into `portfolio/interface-lab/performance-lab/` and link to `./performance-lab/` from the lab index. `styles.scss` is valid SCSS source; `styles.css` is the identical browser-ready CSS, so the project runs without Sass. If your watcher produces a minified CSS filename, update the `<link>` in `index.html` to point to that output or keep the supplied `styles.css`.

## Experiments

- **LCP:** Timed hero reveal with controllable artificial delays. These are **simulations**, not the browser's LCP PerformanceEntry values.
- **INP:** Click-to-next-render-opportunity illustration with synchronous blocking work versus immediate visual feedback followed by chunked work and `scheduler.yield()` (with `setTimeout` fallback). This **does not calculate INP**. Click the in-demo buttons to run each side separately. Avoid interpreting differences as field metrics.
- **CLS:** Reserves vertical space before a decorative content block appears, compared with an unreserved block. Readout is actual change in one element's `getBoundingClientRect().top`, **not the CLS score**.

All three run completely locally; no tracking or uploaded performance data.

## Technical notes

The simulated INP example intentionally blocks the main thread for around 180 ms per run; use browser DevTools if you wish to see actual event timing. `scheduler.yield()` is feature-detected. CLS results can vary with viewport/container sizes. The LCP demo uses timers, not network fetches, so it cannot reproduce full LCP behavior. Browser CPU throttling will change the timing numbers.

For real CWV, use Chrome DevTools, Lighthouse for lab diagnostics, and CrUX/RUM for field data. Published 'good' thresholds are LCP <=2.5s, INP <=200ms, CLS <=0.1 at the 75th percentile. The demo purposely avoids labeling any simulated number a CWV score.

## Browser timing inspector (v2)

The separate, opt-in **Browser Timings** section uses `PerformanceObserver` when supported for `largest-contentful-paint`, `event`, and `layout-shift` entries. Start / Stop / Clear controls manage observation and the display. It shows the latest captured LCP candidate, the longest observed event entry, a running sum of shifts without recent input, and a 40-row timing log. Values are local browser entries: **not field LCP/INP/CLS scores**. An event duration is not INP, and a summed layout-shift value is not the CLS session-window metric. Clear resets only the displayed values, not the browser timeline. Buffered entries may reappear after restarting observation; display entries are deduplicated within a viewing session. No data is transmitted.

## Recommended next iteration

Add an opt-in real PerformanceObserver inspector for `largest-contentful-paint`, `event`, and `layout-shift` entries on the page, with support notices and clear metric caveats. Keep that separated from the educational simulations.

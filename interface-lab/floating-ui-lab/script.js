"use strict";

(() => {
  const trigger = document.querySelector("#trigger");
  const panel = document.querySelector("#floating-panel");
  const stage = document.querySelector("#stage");
  const workspace = document.querySelector("#stage-workspace");
  const scenarioInput = document.querySelector("#scenario");
  const scenarioDescription = document.querySelector("#scenario-description");
  const cssOutput = document.querySelector("#css-output");
  const copyCssButton = document.querySelector("#copy-css");
  const copyStatus = document.querySelector("#copy-status");
  const placement = document.querySelector("#placement");
  const widthInput = document.querySelector("#panel-width");
  const gapInput = document.querySelector("#gap");
  const fallbacksInput = document.querySelector("#fall-backs");
  const autoOpen = document.querySelector("#auto-open");
  const dockButtons = [...document.querySelectorAll("[data-dock]")];
  const openButton = document.querySelector("#open-button");
  const resetButton = document.querySelector("#reset-button");
  const closeButton = document.querySelector("#close-panel");
  const requestedReadout = document.querySelector("#requested-readout");
  const renderedReadout = document.querySelector("#rendered-readout");
  const apiState = document.querySelector("#api-state");
  const nativePopover = typeof panel.showPopover === "function";
  const nativeAnchor = nativePopover && CSS.supports("anchor-name: --floating-trigger") && CSS.supports("position-area: bottom") && CSS.supports("position-try-fallbacks: flip-block");

  // The native relationship is provided by popovertarget on the trigger.
  // The fallback deliberately uses only bounding-box math, not a library.
  apiState.textContent = nativeAnchor && nativePopover
    ? "NATIVE ANCHOR POSITIONING"
    : "JS POSITIONING FALLBACK";

  const isOpen = () => nativePopover ? panel.matches(":popover-open") : panel.classList.contains("is-open");

  function openPanel() {
    if (!isOpen()) {
      if (nativePopover) panel.showPopover({ source: trigger });
      else { panel.hidden = false; panel.classList.add("is-open"); }
    }
    syncPosition();
  }

  function hidePanel() {
    if (!isOpen()) return;
    if (nativePopover) panel.hidePopover();
    else { panel.classList.remove("is-open"); panel.hidden = true; }
    renderedReadout.textContent = "—";
  }

  function togglePanel() { if (isOpen()) hidePanel(); else openPanel(); }

  function measuredPlacement() {
    if (!isOpen()) return "—";
    const anchor = trigger.getBoundingClientRect();
    const floating = panel.getBoundingClientRect();
    const dx = (floating.left + floating.right - anchor.left - anchor.right) / 2;
    const dy = (floating.top + floating.bottom - anchor.top - anchor.bottom) / 2;
    return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "RIGHT" : "LEFT") : (dy > 0 ? "BOTTOM" : "TOP");
  }

  function fallbackPosition() {
    if (!isOpen() || nativeAnchor) return;
    const triggerRect = trigger.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const gap = Number(gapInput.value);
    const margin = 12;
    const options = {
      bottom: () => ({ x: triggerRect.left + (triggerRect.width - panelRect.width) / 2, y: triggerRect.bottom + gap }),
      top: () => ({ x: triggerRect.left + (triggerRect.width - panelRect.width) / 2, y: triggerRect.top - panelRect.height - gap }),
      right: () => ({ x: triggerRect.right + gap, y: triggerRect.top + (triggerRect.height - panelRect.height) / 2 }),
      left: () => ({ x: triggerRect.left - panelRect.width - gap, y: triggerRect.top + (triggerRect.height - panelRect.height) / 2 })
    };
    const opposites = { bottom: "top", top: "bottom", right: "left", left: "right" };
    const requested = placement.value;
    const candidates = fallbacksInput.checked ? [...new Set([requested, opposites[requested], "bottom", "top", "right", "left"])] : [requested];
    const fits = ({x, y}) => x >= margin && y >= margin && x + panelRect.width <= innerWidth - margin && y + panelRect.height <= innerHeight - margin;
    const position = candidates.map(side => options[side]()).find(fits) ?? options[requested]();
    const x = Math.max(margin, Math.min(position.x, innerWidth - panelRect.width - margin));
    const y = Math.max(margin, Math.min(position.y, innerHeight - panelRect.height - margin));
    panel.style.left = `${x}px`;
    panel.style.top = `${y}px`;
  }

  let measureFrame = 0;
  function buildCss() {
    const side = placement.value;
    const tries = {
      bottom: "flip-block, flip-inline, right, left, top",
      top: "flip-block, flip-inline, right, left, bottom",
      right: "flip-inline, flip-block, top, bottom, left",
      left: "flip-inline, flip-block, top, bottom, right"
    };
    if (!nativeAnchor) return `/* This browser uses the JavaScript fallback. */\n.trigger { anchor-name: --floating-trigger; }\n.floating-panel {\n  position: fixed;\n  width: ${widthInput.value}px;\n  /* JS computes left/top using getBoundingClientRect(). */\n  /* Preferred: ${side}; gap: ${gapInput.value}px; */\n}`;
    return `.trigger {\n  anchor-name: --floating-trigger;\n}\n\n.floating-panel {\n  position: fixed;\n  position-anchor: --floating-trigger;\n  position-area: ${side};\n  width: min(${widthInput.value}px, calc(100vw - 24px));\n  margin: ${gapInput.value}px;\n  position-try-fallbacks: ${fallbacksInput.checked ? tries[side] : "none"};\n}`;
  }

  function syncPosition() {
    cssOutput.textContent = buildCss();
    requestedReadout.textContent = placement.value.toUpperCase();
    cancelAnimationFrame(measureFrame);
    measureFrame = requestAnimationFrame(() => {
      fallbackPosition();
      renderedReadout.textContent = measuredPlacement();
    });
  }

  function setTriggerPosition(x, y) {
    trigger.style.setProperty("--x", `${x}%`);
    trigger.style.setProperty("--y", `${y}%`);
    syncPosition();
  }

  const docks = {
    tl: [10, 10], tc: [50, 10], tr: [90, 10],
    ml: [10, 50], mc: [50, 50], mr: [90, 50],
    bl: [10, 90], bc: [50, 90], br: [90, 90]
  };

  function markDock(activeDock) {
    dockButtons.forEach(button => {
      const active = button.dataset.dock === activeDock;
      button.classList.toggle("is-current", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  dockButtons.forEach(button => button.addEventListener("click", () => {
    const [x, y] = docks[button.dataset.dock];
    setTriggerPosition(x, y);
    markDock(button.dataset.dock);
    if (autoOpen.checked) openPanel();
  }));

  placement.addEventListener("change", () => { panel.dataset.placement = placement.value; syncPosition(); });
  widthInput.addEventListener("input", () => {
    panel.style.setProperty("--panel-width", `${widthInput.value}px`);
    document.querySelector("#width-value").value = `${widthInput.value}px`;
    syncPosition();
  });
  gapInput.addEventListener("input", () => {
    panel.style.setProperty("--gap", `${gapInput.value}px`);
    document.querySelector("#gap-value").value = `${gapInput.value}px`;
    syncPosition();
  });
  fallbacksInput.addEventListener("change", () => {
    panel.dataset.fallbacks = fallbacksInput.checked ? "on" : "off";
    syncPosition();
  });

  // Drag without breaking the normal click-to-toggle interaction.
  // Drag is pointer-only; nine real dock buttons offer a keyboard equivalent.
  let pointerStart = null;
  let suppressClick = false;
  trigger.addEventListener("pointerdown", event => {
    if (event.button !== 0) return;
    pointerStart = { x: event.clientX, y: event.clientY, dragged: false };
    trigger.setPointerCapture(event.pointerId);
  });
  trigger.addEventListener("pointermove", event => {
    if (!pointerStart) return;
    if (Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 5) pointerStart.dragged = true;
    if (!pointerStart.dragged) return;
    trigger.classList.add("is-dragging");
    const rect = workspace.getBoundingClientRect();
    const x = Math.max(6, Math.min(94, (event.clientX - rect.left) / rect.width * 100));
    const y = Math.max(7, Math.min(93, (event.clientY - rect.top) / rect.height * 100));
    setTriggerPosition(x, y);
    markDock(null);
  });
  function finishDrag() {
    if (!pointerStart) return;
    suppressClick = pointerStart.dragged;
    pointerStart = null;
    trigger.classList.remove("is-dragging");
    if (suppressClick && autoOpen.checked) openPanel();
  }
  trigger.addEventListener("pointerup", finishDrag);
  trigger.addEventListener("pointercancel", finishDrag);
  trigger.addEventListener("click", event => {
    if (suppressClick) { event.preventDefault(); suppressClick = false; return; }
    // Let the native popovertarget handle click. In fallback mode, toggle manually.
    if (!nativePopover) togglePanel();
    else requestAnimationFrame(syncPosition);
  });

  openButton.addEventListener("click", () => { openPanel(); trigger.focus(); });
  closeButton.addEventListener("click", () => { hidePanel(); trigger.focus(); });
  if (nativePopover) panel.addEventListener("toggle", syncPosition);
  else {
    panel.hidden = true;
    document.addEventListener("keydown", event => { if (event.key === "Escape") hidePanel(); });
    document.addEventListener("pointerdown", event => {
      if (isOpen() && !panel.contains(event.target) && !trigger.contains(event.target) && !openButton.contains(event.target) && !event.target.closest("[data-dock]")) hidePanel();
    });
  }
  window.addEventListener("resize", syncPosition);
  window.addEventListener("scroll", syncPosition, { passive: true });

  const scenarios = {
    default: { dock: "mc", width: 260, placement: "bottom", description: "Freely move the trigger to test positioning." },
    edge: { dock: "tr", width: 260, placement: "right", description: "Anchor near the upper-right edge. Native collision detection uses the actual browser viewport." },
    oversized: { dock: "mc", width: 360, placement: "bottom", description: "Widen the surface and compare where fallbacks can fit. Resize the browser for more dramatic results." },
    constrained: { dock: "mr", width: 260, placement: "right", description: "The stage narrows, but native CSS anchor collision detection still uses the viewport—not the stage border." },
    scroll: { dock: "bc", width: 260, placement: "bottom", description: "Scroll inside the stage with the popover open to see how the top-layer surface follows its anchor." }
  };
  function applyScenario(name) {
    const config = scenarios[name] || scenarios.default;
    stage.dataset.scenario = name;
    scenarioDescription.textContent = config.description;
    stage.scrollTop = 0;
    widthInput.value = String(config.width);
    document.querySelector("#width-value").value = `${config.width}px`;
    panel.style.setProperty("--panel-width", `${config.width}px`);
    placement.value = config.placement;
    panel.dataset.placement = config.placement;
    const [x, y] = docks[config.dock];
    setTriggerPosition(x, y);
    markDock(config.dock);
    if (autoOpen.checked) openPanel();
    syncPosition();
  }
  scenarioInput.addEventListener("change", () => applyScenario(scenarioInput.value));
  stage.addEventListener("scroll", syncPosition, { passive: true });
  copyCssButton.addEventListener("click", async () => {
    const css = buildCss();
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(css);
      else {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(cssOutput);
        selection.removeAllRanges(); selection.addRange(range);
        copyStatus.textContent = "Select the code above and copy it (⌘C / Ctrl+C).";
        return;
      }
      copyStatus.textContent = "CSS copied to clipboard.";
    } catch {
      copyStatus.textContent = "Clipboard unavailable. Select and copy the code manually.";
    }
  });

  resetButton.addEventListener("click", () => {
    scenarioInput.value = "default";
    stage.dataset.scenario = "default";
    scenarioDescription.textContent = scenarios.default.description;
    stage.scrollTop = 0;
    placement.value = "bottom";
    widthInput.value = "260";
    gapInput.value = "12";
    fallbacksInput.checked = true;
    autoOpen.checked = true;
    panel.dataset.placement = "bottom";
    panel.dataset.fallbacks = "on";
    panel.style.setProperty("--panel-width", "260px");
    panel.style.setProperty("--gap", "12px");
    document.querySelector("#width-value").value = "260px";
    document.querySelector("#gap-value").value = "12px";
    setTriggerPosition(50, 50);
    markDock("mc");
    hidePanel();
    syncPosition();
  });

  // CSS fallback for older browsers: keep the popover in the top layer where possible,
  // but use fixed geometry instead of CSS anchor positioning.
  if (!nativeAnchor) {
    panel.classList.add("uses-js-position");
  }
  syncPosition();
})();

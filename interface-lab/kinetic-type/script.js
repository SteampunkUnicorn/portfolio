"use strict";

(() => {
  const $ = (selector) => document.querySelector(selector);
  const stage = $("#stage-content");
  const kinetic = $("#kinetic");
  const phrase = $("#phrase");
  const count = $("#character-count");
  const status = $("#stage-status");
  const coordinates = $("#stage-coordinates");
  const toggle = $("#toggle-motion");
  const reset = $("#reset");
  const copy = $("#copy-css");
  const announcer = $("#announcer");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const defaults = { phrase: "Make something move", weight: 700, spacing: 0, strength: 42, radius: 180 };
  const settings = { ...defaults };
  const controls = Object.fromEntries(["weight", "spacing", "strength", "radius"].map((id) => [id, $(`#${id}`)]));
  const values = Object.fromEntries(Object.keys(controls).map((id) => [id, $(`#${id}-value`)]));

  let letters = [];
  let pointer = null;
  let frame = null;
  let paused = reducedMotion.matches;
  let rectsDirty = true;

  const format = {
    weight: (value) => String(value),
    spacing: (value) => `${Number(value).toFixed(2)} em`,
    strength: (value) => `${value} px`,
    radius: (value) => `${value} px`,
  };

  function setMotionState() {
    toggle.setAttribute("aria-pressed", String(paused));
    toggle.innerHTML = paused ? 'Resume motion <span aria-hidden="true">▶</span>' : 'Pause motion <span aria-hidden="true">Ⅱ</span>';
    status.textContent = paused ? "MOTION PAUSED" : "MOTION ON";
    if (paused) {
      pointer = null;
      coordinates.textContent = "X — / Y —";
      letters.forEach((letter) => {
        letter.x = 0;
        letter.y = 0;
        letter.vx = 0;
        letter.vy = 0;
        letter.el.style.transform = "translate3d(0,0,0)";
      });
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
    } else {
      startAnimation();
    }
  }

  function renderPhrase() {
    const text = phrase.value || "Type something…";
    kinetic.replaceChildren();
    kinetic.setAttribute("aria-label", text);
    count.textContent = `${phrase.value.length} / ${phrase.maxLength}`;
    letters = [];
    // Group words so responsive wrapping never separates the letters of a word.
    text.split(/(\s+)/).forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) {
        const spacer = document.createElement("span");
        spacer.className = "kinetic__space";
        spacer.setAttribute("aria-hidden", "true");
        spacer.textContent = " ";
        kinetic.append(spacer);
        return;
      }
      const word = document.createElement("span");
      word.style.display = "inline-block";
      word.setAttribute("aria-hidden", "true");
      for (const character of part) {
        const span = document.createElement("span");
        span.className = "kinetic__char";
        span.textContent = character;
        word.append(span);
        letters.push({ el: span, x: 0, y: 0, vx: 0, vy: 0, cx: 0, cy: 0 });
      }
      kinetic.append(word);
    });
    rectsDirty = true;
  }

  function updateStyles() {
    kinetic.style.fontWeight = String(settings.weight);
    kinetic.style.letterSpacing = `${settings.spacing}em`;
    for (const id of Object.keys(controls)) {
      controls[id].value = String(settings[id]);
      values[id].textContent = format[id](settings[id]);
    }
    rectsDirty = true;
  }

  function measureLetters() {
    letters.forEach((letter) => {
      // The element's bounding rect includes its current transform; subtract it
      // to recover the stationary center for distance calculations.
      const box = letter.el.getBoundingClientRect();
      letter.cx = box.left + box.width / 2 - letter.x;
      letter.cy = box.top + box.height / 2 - letter.y;
    });
    rectsDirty = false;
  }

  function animate() {
    frame = null;
    if (paused || document.hidden) return;
    if (rectsDirty) measureLetters();

    for (const letter of letters) {
      let targetX = 0;
      let targetY = 0;
      if (pointer && settings.strength > 0) {
        const dx = letter.cx - pointer.x;
        const dy = letter.cy - pointer.y;
        const distance = Math.hypot(dx, dy);
        if (distance < settings.radius) {
          const falloff = (1 - distance / settings.radius) ** 2;
          const force = settings.strength * falloff;
          const angle = distance > 0.001 ? Math.atan2(dy, dx) : 0;
          targetX = Math.cos(angle) * force;
          targetY = Math.sin(angle) * force;
        }
      }
      // Damped spring: a small amount of inertia, with a steady rest position.
      letter.vx = (letter.vx + (targetX - letter.x) * 0.14) * 0.72;
      letter.vy = (letter.vy + (targetY - letter.y) * 0.14) * 0.72;
      letter.x += letter.vx;
      letter.y += letter.vy;
      if (Math.abs(letter.x) < 0.02 && Math.abs(letter.vx) < 0.02 && !pointer) { letter.x = 0; letter.vx = 0; }
      if (Math.abs(letter.y) < 0.02 && Math.abs(letter.vy) < 0.02 && !pointer) { letter.y = 0; letter.vy = 0; }
      letter.el.style.transform = `translate3d(${letter.x.toFixed(2)}px, ${letter.y.toFixed(2)}px, 0)`;
    }
    if (pointer || letters.some((l) => Math.abs(l.x) > 0.02 || Math.abs(l.y) > 0.02)) startAnimation();
  }

  function startAnimation() {
    if (frame === null && !paused && !document.hidden) frame = requestAnimationFrame(animate);
  }

  phrase.addEventListener("input", () => { renderPhrase(); startAnimation(); });
  for (const [id, control] of Object.entries(controls)) {
    control.addEventListener("input", () => {
      settings[id] = Number(control.value);
      updateStyles();
      startAnimation();
    });
  }

  stage.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch" || paused) return;
    pointer = { x: event.clientX, y: event.clientY };
    const bounds = stage.getBoundingClientRect();
    coordinates.textContent = `X ${Math.round(event.clientX - bounds.left)} / Y ${Math.round(event.clientY - bounds.top)}`;
    startAnimation();
  });
  stage.addEventListener("pointerleave", () => {
    pointer = null;
    coordinates.textContent = "X — / Y —";
    startAnimation();
  });
  toggle.addEventListener("click", () => {
    paused = !paused;
    setMotionState();
    announcer.textContent = paused ? "Letter motion paused" : "Letter motion enabled";
  });
  reset.addEventListener("click", () => {
    Object.assign(settings, defaults);
    phrase.value = defaults.phrase;
    pointer = null;
    renderPhrase();
    updateStyles();
    startAnimation();
    announcer.textContent = "Experiment reset to defaults";
  });

  copy.addEventListener("click", async () => {
    const css = `font-family: "Syne", sans-serif;\nfont-weight: ${settings.weight};\nletter-spacing: ${settings.spacing}em;`;
    try {
      await navigator.clipboard.writeText(css);
      announcer.textContent = "Typography CSS copied to clipboard";
      copy.firstChild.textContent = "Copied typography CSS ";
    } catch {
      announcer.textContent = "Clipboard access is unavailable. Use a secure localhost or HTTPS page.";
    }
  });

  const observer = new ResizeObserver(() => { rectsDirty = true; startAnimation(); });
  observer.observe(stage);
  window.addEventListener("scroll", () => { rectsDirty = true; startAnimation(); }, { passive: true });
  document.addEventListener("visibilitychange", () => { rectsDirty = true; startAnimation(); });
  reducedMotion.addEventListener("change", (event) => { paused = event.matches; setMotionState(); });
  document.fonts?.ready.then(() => { rectsDirty = true; startAnimation(); });

  renderPhrase();
  updateStyles();
  setMotionState();
})();

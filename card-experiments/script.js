"use strict";
(() => {
  const stage = document.querySelector("#stage");
  const cards = [...document.querySelectorAll(".study-card")];
  const modes = [...document.querySelectorAll('input[name="mode"]')];
  const intensity = document.querySelector("#intensity");
  const intensityValue = document.querySelector("#intensity-value");
  const motionCheckbox = document.querySelector("#motion");
  const arrows = document.querySelector("#arrows");
  const counter = document.querySelector("#count");
  const hint = document.querySelector("#instructions");
  const status = document.querySelector("#announcement");
  const readout = document.querySelector("#mode-readout");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  let mode = "hover";
  let active = 0;
  let power = 0.6;
  let motion = !reducedMotion.matches;

  const descriptions = {
    hover: "Hover or focus a card to lift it off the surface.",
    tilt: "Move across a card for deep 3D rotation, shifting highlights, and layered artwork. Tab to a card to preview its depth.",
    flip: "Select or press Enter on a card to read the other side.",
    stack: "Select the front card or use Next to cycle the stack. Left and Right arrow keys work too."
  };

  function announce(message) { status.textContent = message; }

  function resetFlips() {
    cards.forEach(card => {
      card.classList.remove("is-flipped");
      card.setAttribute("aria-label", card.getAttribute("aria-label").replace(/, back visible$/, ""));
    });
  }

  function resetTilt(card) {
    ["--rx", "--ry", "--lift", "--light-x", "--light-y"].forEach(prop => card.style.removeProperty(prop));
  }
  function resetTilts() { cards.forEach(resetTilt); }

  function setActive(next, speak = true) {
    const previous = cards[active];
    const nextIndex = (next + cards.length) % cards.length;
    const incoming = cards[nextIndex];

    // Move focus before making the previous card inert.
    if (mode === "stack") {
      incoming.inert = false;
      incoming.tabIndex = 0;
      if (incoming !== previous && previous.contains(document.activeElement)) {
        incoming.focus({ preventScroll: true });
      }
    }

    active = nextIndex;
    cards.forEach((card, i) => {
      const depth = (i - active + cards.length) % cards.length;
      card.style.setProperty("--depth", depth);
      card.dataset.depth = String(depth);
      card.removeAttribute("aria-hidden");
      card.tabIndex = mode === "stack" ? (i === active ? 0 : -1) : 0;
      card.inert = mode === "stack" && i !== active;
    });
    counter.textContent = `${String(active + 1).padStart(2, "0")} / ${String(cards.length).padStart(2, "0")}`;
    if (speak && mode === "stack") {
      announce(`${cards[active].querySelector(".card-bottom h3").textContent}, card ${active + 1} of ${cards.length}`);
    }
  }

  function paint() {
    stage.dataset.mode = mode;
    stage.style.setProperty("--power", String(power));
    stage.classList.toggle("is-still", !motion);
    readout.textContent = `${String(["hover", "tilt", "flip", "stack"].indexOf(mode) + 1).padStart(2, "0")} / ${mode.toUpperCase()}`;
    hint.textContent = descriptions[mode];
    arrows.hidden = mode !== "stack";
    resetFlips();
    resetTilts();
    setActive(0, false);
    announce(`${mode} experiment selected`);
  }

  modes.forEach(input => input.addEventListener("change", () => {
    if (input.checked) { mode = input.value; paint(); }
  }));

  intensity.addEventListener("input", () => {
    power = Number(intensity.value) / 100;
    intensityValue.textContent = `${intensity.value}%`;
    stage.style.setProperty("--power", String(power));
  });
  motionCheckbox.checked = motion;
  motionCheckbox.addEventListener("change", () => {
    motion = motionCheckbox.checked;
    paint();
  });

  function cycle(delta) {
    if (mode !== "stack") return;
    setActive(active + delta);
  }
  document.querySelector("#prev").addEventListener("click", () => cycle(-1));
  document.querySelector("#next").addEventListener("click", () => cycle(1));
  document.querySelector("#reset").addEventListener("click", () => {
    intensity.value = "60";
    intensityValue.textContent = "60%";
    power = 0.6;
    motion = !reducedMotion.matches;
    motionCheckbox.checked = motion;
    mode = "hover";
    document.querySelector('input[value="hover"]').checked = true;
    paint();
  });

  cards.forEach((card, i) => {
    card.addEventListener("pointermove", event => {
      if (mode !== "tilt" || !motion || power === 0 || event.pointerType === "touch") return;
      const rect = card.getBoundingClientRect();
      const x = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - 0.5) * 2));
      const y = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - 0.5) * 2));
      card.style.setProperty("--rx", `${(-y * 30 * power).toFixed(2)}deg`);
      card.style.setProperty("--ry", `${(x * 30 * power).toFixed(2)}deg`);
      card.style.setProperty("--lift", `${(-32 * power).toFixed(1)}px`);
      card.style.setProperty("--light-x", `${((x + 1) * 50).toFixed(1)}%`);
      card.style.setProperty("--light-y", `${((y + 1) * 50).toFixed(1)}%`);
    });
    card.addEventListener("pointerleave", () => resetTilt(card));
    card.addEventListener("focus", () => {
      if (mode === "tilt" && motion) {
        card.style.setProperty("--lift", `${-32 * power}px`);
        card.style.setProperty("--rx", `${-7 * power}deg`);
        card.style.setProperty("--ry", `${12 * power}deg`);
        card.style.setProperty("--light-x", "75%");
        card.style.setProperty("--light-y", "25%");
      }
    });
    card.addEventListener("blur", () => { if (mode === "tilt") resetTilts(); });

    function activate() {
      if (mode === "flip") {
        const flipped = card.classList.toggle("is-flipped");
        card.setAttribute("aria-label", `Card ${i + 1}, ${card.querySelector(".card-bottom h3").textContent}${flipped ? ", back visible" : ""}`);
        announce(flipped ? "Back of card revealed" : "Front of card revealed");
      } else if (mode === "stack" && i === active) {
        cycle(1);
      }
    }
    card.addEventListener("click", activate);
    card.addEventListener("keydown", event => {
      if (mode === "stack" && (event.key === "ArrowRight" || event.key === "ArrowLeft")) {
        event.preventDefault();
        cycle(event.key === "ArrowRight" ? 1 : -1);
      } else if ((event.key === "Enter" || event.key === " ") && (mode === "flip" || mode === "stack")) {
        event.preventDefault();
        activate();
      }
    });
  });

  document.querySelector("#year").textContent = new Date().getFullYear();
  paint();
})();

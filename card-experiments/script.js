"use strict";

(() => {
  const stage = document.querySelector("#stage");
  const cards = [...document.querySelectorAll(".study-card")];
  const modes = [...document.querySelectorAll('input[name="mode"]')];
  const slider = document.querySelector("#intensity");
  const sliderValue = document.querySelector("#intensity-value");
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

  const deck = document.querySelector("#deck");
  let gesture = null;
  let suppressClick = false;

  const now = () => performance.now();

  function slideDistance() {
    return deck.getBoundingClientRect().width * 0.93 * Math.max(power, 0.2);
  }

  // Drag is local to the active card.
  function clearDrag() {
    cards.forEach((card) => card.style.removeProperty("--drag-x"));
  }

  function setDragX(pixels) {
    cards[active].style.setProperty("--drag-x", `${pixels.toFixed(2)}px`);
  }

  function changeSlide(delta, focus = false) {
    if (mode !== "slider") return;

    clearDrag();
    setActive(active + delta);

    if (focus) cards[active].focus();
  }

  motionCheckbox.checked = motion;

  const descriptions = {
    hover: "Hover or focus a card to lift it off the surface.",
    tilt: "Move across a card for deep 3D rotation, shifting highlights, and layered artwork. Tab to a card to preview its depth.",
    flip: "Select or press Enter on a card to read the other side.",
    stack: "Select the front card or press Next to cycle the stack.",
    slider:
      "Drag cards to slide. A quick flick advances based on velocity; arrows and Left / Right keys work too.",
  };

  function announce(message) {
    status.textContent = message;
  }

  function resetFlips() {
    cards.forEach((card) => {
      card.classList.remove("is-flipped");

      card.setAttribute(
        "aria-label",
        card.getAttribute("aria-label").replace(/, back visible$/, ""),
      );
    });
  }

  function resetTilt(card) {
    ["--rx", "--ry", "--lift", "--light-x", "--light-y"].forEach((prop) =>
      card.style.removeProperty(prop),
    );
  }

  function resetTilts() {
    cards.forEach(resetTilt);
  }

  function isSequential() {
    return mode === "stack" || mode === "slider";
  }

  // --------------------------------
  // Active card and focus management
  // --------------------------------

  function setActive(next, speak = true) {
    const previousCard = cards[active];
    const nextIndex = (next + cards.length) % cards.length;
    const nextCard = cards[nextIndex];

    const focusWasInPrevious = previousCard.contains(document.activeElement);

    // Make the destination focusable before hiding the previous slide.
    // Pointer dragging can leave focus on the outgoing card.
    if (isSequential()) {
      nextCard.inert = false;
      nextCard.tabIndex = 0;

      if (nextCard !== previousCard && focusWasInPrevious) {
        nextCard.focus({ preventScroll: true });
      }
    }

    active = nextIndex;

    cards.forEach((card, i) => {
      const depth = (i - active + cards.length) % cards.length;

      let offset = i - active;

      if (offset > cards.length / 2) {
        offset -= cards.length;
      }

      if (offset < -cards.length / 2) {
        offset += cards.length;
      }

      card.style.setProperty("--depth", depth);
      card.style.setProperty("--offset", offset);

      // Calculate percentage in JS so CSS only adds compatible lengths.
      card.style.setProperty(
        "--slide-offset",
        `${(offset * 93 * power).toFixed(3)}%`,
      );

      card.style.setProperty("--absolute-offset", Math.abs(offset));

      card.dataset.depth = String(depth);
      card.dataset.offset = String(offset);
      card.dataset.offscreen = String(Math.abs(offset) > 1);

      // Inert handles inactive cards.
      // aria-hidden is redundant and can conflict with focused elements.
      card.removeAttribute("aria-hidden");

      card.tabIndex = isSequential() ? (i === active ? 0 : -1) : 0;

      card.inert = isSequential() && i !== active;
    });

    counter.textContent = `${String(active + 1).padStart(
      2,
      "0",
    )} / ${String(cards.length).padStart(2, "0")}`;

    if (speak && isSequential()) {
      announce(
        `${
          cards[active].querySelector(".card-bottom h3").textContent
        }, card ${active + 1} of ${cards.length}`,
      );
    }
  }

  // --------------------------------
  // Mode initialization
  // --------------------------------

  function paint() {
    clearDrag();
    gesture = null;

    stage.dataset.mode = mode;
    stage.style.setProperty("--power", String(power));
    stage.classList.toggle("is-still", !motion);

    readout.textContent = `${String(
      ["hover", "tilt", "flip", "stack", "slider"].indexOf(mode) + 1,
    ).padStart(2, "0")} / ${mode.toUpperCase()}`;

    hint.textContent = descriptions[mode];
    arrows.hidden = !isSequential();

    resetFlips();
    resetTilts();
    setActive(0, false);

    announce(`${mode} experiment selected`);
  }

  // --------------------------------
  // Controls
  // --------------------------------

  modes.forEach((input) => {
    input.addEventListener("change", () => {
      if (input.checked) {
        mode = input.value;
        paint();
      }
    });
  });

  slider.addEventListener("input", () => {
    clearDrag();

    power = Number(slider.value) / 100;
    sliderValue.textContent = `${slider.value}%`;

    stage.style.setProperty("--power", String(power));
    setActive(active, false);
  });

  motionCheckbox.addEventListener("change", () => {
    motion = motionCheckbox.checked;
    paint();
  });

  document.querySelector("#prev").addEventListener("click", () => {
    if (mode === "slider") {
      changeSlide(-1, true);
    } else {
      setActive(active - 1);
      cards[active].focus();
    }
  });

  document.querySelector("#next").addEventListener("click", () => {
    if (mode === "slider") {
      changeSlide(1, true);
    } else {
      setActive(active + 1);
      cards[active].focus();
    }
  });

  document.querySelector("#reset").addEventListener("click", () => {
    slider.value = "60";
    power = 0.6;
    sliderValue.textContent = "60%";

    active = 0;
    motion = !reducedMotion.matches;
    motionCheckbox.checked = motion;

    mode = "hover";
    document.querySelector('input[value="hover"]').checked = true;

    paint();
  });

  // --------------------------------
  // Individual card interactions
  // --------------------------------

  cards.forEach((card, i) => {
    card.addEventListener("pointermove", (event) => {
      if (
        mode !== "tilt" ||
        !motion ||
        power === 0 ||
        event.pointerType === "touch"
      ) {
        return;
      }

      const rect = card.getBoundingClientRect();

      const x = Math.max(
        -1,
        Math.min(1, ((event.clientX - rect.left) / rect.width - 0.5) * 2),
      );

      const y = Math.max(
        -1,
        Math.min(1, ((event.clientY - rect.top) / rect.height - 0.5) * 2),
      );

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

    card.addEventListener("blur", () => {
      if (mode === "tilt") resetTilts();
    });

    function activate() {
      if (mode === "flip") {
        const flipped = card.classList.toggle("is-flipped");

        card.setAttribute(
          "aria-label",
          `Card ${i + 1}, ${
            card.querySelector(".card-bottom h3").textContent
          }${flipped ? ", back visible" : ""}`,
        );

        announce(flipped ? "Back of card revealed" : "Front of card revealed");
      } else if (mode === "stack" && i === active) {
        setActive(active + 1);
        cards[active].focus();
      }
    }

    card.addEventListener("click", (event) => {
      if (suppressClick) {
        event.preventDefault();
        return;
      }

      activate();
    });

    card.addEventListener("keydown", (event) => {
      if (
        isSequential() &&
        (event.key === "ArrowRight" || event.key === "ArrowLeft")
      ) {
        event.preventDefault();

        const delta = event.key === "ArrowRight" ? 1 : -1;

        if (mode === "slider") {
          changeSlide(delta, true);
        } else {
          setActive(active + delta);
          cards[active].focus();
        }

        return;
      }

      if (event.key === "Enter" || event.key === " ") {
        if (mode === "flip" || mode === "stack") {
          event.preventDefault();
          activate();
        }
      }
    });
  });

  // Prevent native browser dragging.
  cards.forEach((card) => {
    card.addEventListener("dragstart", (event) => {
      event.preventDefault();
    });
  });

  // --------------------------------
  // Slider pointer gestures
  // --------------------------------

  stage.addEventListener("pointerdown", (event) => {
    if (
      mode !== "slider" ||
      !event.isPrimary ||
      (event.pointerType === "mouse" && event.button !== 0)
    ) {
      return;
    }

    const card = event.target.closest(".study-card");

    if (card !== cards[active]) return;

    clearDrag();

    const time = now();

    gesture = {
      id: event.pointerId,
      card,
      startX: event.clientX,
      lastX: event.clientX,
      samples: [{ x: event.clientX, t: time }],
      moved: false,
    };

    stage.setPointerCapture(event.pointerId);
    stage.classList.add("is-dragging");
  });

  stage.addEventListener("pointermove", (event) => {
    if (!gesture || gesture.id !== event.pointerId || mode !== "slider") {
      return;
    }

    const dx = event.clientX - gesture.startX;

    gesture.lastX = event.clientX;

    const time = now();

    gesture.samples.push({
      x: event.clientX,
      t: time,
    });

    gesture.samples = gesture.samples.filter((point) => time - point.t <= 120);

    if (Math.abs(dx) > 5) {
      gesture.moved = true;
    }

    if (gesture.moved) {
      setDragX(dx);
    }
  });

  // --------------------------------
  // Release and swipe detection
  // --------------------------------

  function finishDrag(event, cancelled = false) {
    if (!gesture || event.pointerId !== gesture.id) return;

    const current = gesture;
    gesture = null;

    const releasedX = Number.isFinite(event.clientX)
      ? event.clientX
      : current.lastX;

    const dx = releasedX - current.startX;
    const time = now();

    const samples = [
      ...current.samples.filter((point) => time - point.t < 120),
      { x: releasedX, t: time },
    ];

    const first = samples[0];

    const velocity =
      samples.length > 1
        ? (releasedX - first.x) / Math.max(1, time - first.t)
        : 0;

    const threshold = Math.min(60, slideDistance() * 0.18);

    const step =
      !cancelled &&
      (Math.abs(dx) >= threshold ||
        (Math.abs(dx) > 12 && Math.abs(velocity) > 0.45))
        ? dx < 0
          ? 1
          : -1
        : 0;

    if (current.moved) {
      suppressClick = true;

      setTimeout(() => {
        suppressClick = false;
      }, 0);
    }

    if (stage.hasPointerCapture(event.pointerId)) {
      stage.releasePointerCapture(event.pointerId);
    }

    // Update the active index before clearing temporary drag styles.
    if (step) {
      setActive(active + step);
    }

    requestAnimationFrame(() => {
      clearDrag();
      stage.classList.remove("is-dragging");
    });
  }

  stage.addEventListener("pointerup", (event) => {
    finishDrag(event);
  });

  stage.addEventListener("pointercancel", (event) => {
    finishDrag(event, true);
  });

  stage.addEventListener("lostpointercapture", (event) => {
    if (gesture && gesture.id === event.pointerId) {
      finishDrag(event, true);
    }
  });

  document.querySelector("#year").textContent = new Date().getFullYear();

  paint();
})();

"use strict";

const path = document.querySelector("#shape");
const duration = document.querySelector("#duration");
const status = document.querySelector("#icon-status");
const buttons = document.querySelectorAll("[data-icon]");
const complexShape = document.querySelector("#complex-shape");

const states = {
  menu: [
    [25, 30, 75, 30],
    [25, 50, 75, 50],
    [25, 70, 75, 70],
  ],

  close: [
    [28, 28, 72, 72],
    [50, 50, 50, 50],
    [72, 28, 28, 72],
  ],

  arrow: [
    [20, 50, 80, 50],
    [40, 30, 20, 50],
    [40, 70, 20, 50],
  ],

  "arrow-right": [
    [20, 50, 80, 50],
    [60, 30, 80, 50],
    [60, 70, 80, 50],
  ],

  "arrow-up": [
    [50, 80, 50, 20],
    [30, 40, 50, 20],
    [70, 40, 50, 20],
  ],

  "arrow-down": [
    [50, 20, 50, 80],
    [30, 60, 50, 80],
    [70, 60, 50, 80],
  ],

  check: [
    [18, 52, 42, 75],
    [42, 75, 82, 25],
    [82, 25, 82, 25],
  ],

  plus: [
    [25, 50, 75, 50],
    [50, 25, 50, 75],
    [50, 50, 50, 50],
  ],

  minus: [
    [25, 50, 75, 50],
    [50, 50, 50, 50],
    [50, 50, 50, 50],
  ],

  chevron: [
    [35, 25, 65, 50],
    [65, 50, 35, 75],
    [50, 50, 50, 50],
  ],

  play: [
    [35, 25, 70, 50],
    [70, 50, 35, 75],
    [35, 75, 35, 25],
  ],

  pause: [
    [32, 25, 32, 75],
    [50, 25, 50, 75],
    [68, 25, 68, 75],
  ],
};

const complexIcons = {
  heart: `
    <path d="M50 79 20 49 C2 29 27 12 42 29 L50 38
      58 29 C73 12 98 29 80 49 Z"
      fill="none" stroke="currentColor" stroke-width="5"
      stroke-linecap="round" stroke-linejoin="round"/>
  `,
  "heart-filled": `
    <path d="M50 79 20 49 C2 29 27 12 42 29 L50 38
      58 29 C73 12 98 29 80 49 Z"
      fill="currentColor" stroke="currentColor" stroke-width="3"
      stroke-linejoin="round"/>
  `,
  sun: `
    <circle cx="50" cy="50" r="17" fill="none"
      stroke="currentColor" stroke-width="5"/>
    <path d="M50 13 V23 M50 77 V87 M13 50 H23 M77 50 H87
      M24 24 L31 31 M69 69 L76 76
      M24 76 L31 69 M69 31 L76 24"
      fill="none" stroke="currentColor" stroke-width="5"
      stroke-linecap="round"/>
  `,
  moon: `
    <path d="M68 17 A36 36 0 1 0 83 69
      A29 29 0 0 1 68 17 Z"
      fill="none" stroke="currentColor" stroke-width="5"
      stroke-linejoin="round"/>
    <path d="M72 22 L72 22 M84 38 L84 38"
      stroke="currentColor" stroke-width="5"
      stroke-linecap="round"/>
  `,
  filter: `
    <path d="M15 20 H85 L59 49 V75 L41 84 V49 Z"
      fill="none" stroke="currentColor" stroke-width="5"
      stroke-linejoin="round"/>
  `,
  "filter-active": `
    <path d="M15 20 H85 L59 49 V75 L41 84 V49 Z"
      fill="none" stroke="currentColor" stroke-width="5"
      stroke-linejoin="round"/>
    <circle cx="76" cy="25" r="11" fill="currentColor"
      stroke="currentColor" stroke-width="3"/>
  `,
  eye: `
    <path d="M10 50 Q50 5 90 50 Q50 95 10 50 Z"
      fill="none" stroke="currentColor" stroke-width="5"
      stroke-linejoin="round"/>
    <circle cx="50" cy="50" r="13" fill="none"
      stroke="currentColor" stroke-width="5"/>
  `,
  "eye-off": `
    <path d="M12 50 Q23 35 37 29 M48 24
      Q73 24 90 50 Q81 63 69 69
      M39 75 Q26 70 12 50"
      fill="none" stroke="currentColor" stroke-width="5"
      stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="50" cy="50" r="12" fill="none"
      stroke="currentColor" stroke-width="5"/>
    <path d="M17 17 L83 83"
      stroke="currentColor" stroke-width="5"
      stroke-linecap="round"/>
  `,
};
let coords = states.menu.flat();
let raf = 0;

const d = (arr) =>
  `M ${arr[0]} ${arr[1]} L ${arr[2]} ${arr[3]} ` +
  `M ${arr[4]} ${arr[5]} L ${arr[6]} ${arr[7]} ` +
  `M ${arr[8]} ${arr[9]} L ${arr[10]} ${arr[11]}`;

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

function showComplexIcon(name) {
  cancelAnimationFrame(raf);

  // Fade out the current geometry before replacing it.
  path.style.opacity = "0";
  complexShape.style.opacity = "0";

  const ms = reduced.matches ? 0 : 180;

  window.setTimeout(() => {
    complexShape.innerHTML = complexIcons[name];
    complexShape.style.opacity = "0";

    requestAnimationFrame(() => {
      complexShape.style.opacity = "1";
    });

    // Keep the original geometry hidden.
    path.style.opacity = "0";
  }, ms);

  status.textContent = name[0].toUpperCase() + name.slice(1).replace("-", " ");

  buttons.forEach((button) => {
    const selected = button.dataset.icon === name;

    button.setAttribute("aria-pressed", String(selected));
    button.classList.toggle("secondary", !selected);
  });
}

function go(name) {
  if (complexIcons[name]) {
    showComplexIcon(name);
    return;
  }

  // Restore the original geometry when selecting a simple icon.
  complexShape.style.opacity = "0";
  path.style.opacity = "1";
  complexShape.innerHTML = "";
  cancelAnimationFrame(raf);

  const from = [...coords];
  const target = states[name].flat();
  const start = performance.now();
  const ms = reduced.matches ? 0 : Number(duration.value);

  function frame(t) {
    const p = ms ? Math.min(1, (t - start) / ms) : 1;
    const e = 1 - Math.pow(1 - p, 3);

    coords = from.map((v, i) => v + (target[i] - v) * e);

    path.setAttribute("d", d(coords));

    if (p < 1) {
      raf = requestAnimationFrame(frame);
    } else {
      coords = [...target];
    }
  }

  raf = requestAnimationFrame(frame);

  status.textContent = name[0].toUpperCase() + name.slice(1).replace("-", " ");

  buttons.forEach((button) => {
    const selected = button.dataset.icon === name;

    button.setAttribute("aria-pressed", String(selected));
    button.classList.toggle("secondary", !selected);
  });
}

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    go(button.dataset.icon);
  });
});

duration.addEventListener("input", () => {
  document.querySelector("#duration-out").textContent = duration.value;
});

path.setAttribute("d", d(coords));

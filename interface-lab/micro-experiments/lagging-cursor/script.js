"use strict";

function cursorFollow(stage) {
  const ring = stage.querySelector(".cf-ring");
  let tx = 0,
    ty = 0,
    x = 0,
    y = 0,
    raf = null;
  function tick() {
    x += (tx - x) * 0.18;
    y += (ty - y) * 0.18;
    ring.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    const moving = Math.abs(tx - x) > 0.1 || Math.abs(ty - y) > 0.1;
    raf = moving ? requestAnimationFrame(tick) : null;
  }
  stage.addEventListener("pointermove", (e) => {
    const r = stage.getBoundingClientRect();
    tx = e.clientX - r.left;
    ty = e.clientY - r.top;
    if (!ring.classList.contains("on")) {
      x = tx;
      y = ty;
    }
    ring.classList.add("on");
    if (!raf) raf = requestAnimationFrame(tick);
  });
  stage.addEventListener("pointerleave", () => ring.classList.remove("on"));
  stage.querySelectorAll("[data-cursor]").forEach((el) => {
    el.addEventListener("pointerenter", () => {
      ring.classList.add("big");
      ring.textContent = el.dataset.cursor;
    });
    el.addEventListener("pointerleave", () => {
      ring.classList.remove("big");
      ring.textContent = "";
    });
  });
}

cursorFollow(document.querySelector(".cf-stage"));

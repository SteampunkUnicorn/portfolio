"use strict";

function eyes(root) {
  const list = [...root.querySelectorAll(".eye")];
  window.addEventListener("pointermove", (e) => {
    list.forEach((eye) => {
      const r = eye.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const angle = Math.atan2(dy, dx);
      const dist = Math.min(Math.hypot(dx, dy) / 6, r.width / 2 - 18);
      eye.firstElementChild.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px)`;
    });
  });
}

eyes(document.querySelector(".eyes"));

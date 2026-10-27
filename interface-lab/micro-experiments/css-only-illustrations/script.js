"use strict";
const art = document.querySelector("#artboard"),
  sel = document.querySelector("#illustration"),
  scale = document.querySelector("#scale"),
  tone = document.querySelector("#tone");
function render() {
  art.dataset.item = sel.value;
  art.style.setProperty("--art-scale", scale.value);
  art.style.setProperty("--art-hue", tone.value);
  document.querySelector("#scale-out").textContent = Number(
    scale.value,
  ).toFixed(2);
  document.querySelector("#tone-out").textContent = tone.value;
}
for (const el of [sel, scale, tone]) el.addEventListener("input", render);
document.querySelector("#reset").addEventListener("click", () => {
  sel.value = "sun";
  scale.value = 1;
  tone.value = 45;
  render();
});
render();

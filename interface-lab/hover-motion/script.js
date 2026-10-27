(() => {
  const stage = document.querySelector('#stage');
  const cards = [...document.querySelectorAll('.demo-card')];
  const styleSelect = document.querySelector('#motion-style');
  const duration = document.querySelector('#duration');
  const intensity = document.querySelector('#intensity');
  const durationValue = document.querySelector('#duration-value');
  const intensityValue = document.querySelector('#intensity-value');
  const status = document.querySelector('#stage-status');
  const note = document.querySelector('#stage-note');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const notes = {
    lift: 'Lift + reveal: a restrained translation and a small content reveal provide clear feedback.',
    tilt: '3D tilt: pointer position changes perspective. Keep the angle small so text remains comfortable to read.',
    spotlight: 'Spotlight: the stage follows pointer position with a soft radial highlight. Content remains readable.',
    magnetic: 'Magnetic pull: cards shift slightly toward the pointer, but their hit areas and keyboard behavior stay stable.'
  };
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function applyControls() {
    stage.dataset.style = styleSelect.value;
    stage.style.setProperty('--duration', `${duration.value}ms`);
    stage.style.setProperty('--intensity', (Number(intensity.value) / 100).toString());
    durationValue.value = `${duration.value} ms`;
    intensityValue.value = `${intensity.value}%`;
    note.textContent = reducedMotion.matches
      ? 'Reduced motion is enabled on this device. Pointer-driven transforms are disabled; the examples remain available to explore.'
      : notes[styleSelect.value];
    cards.forEach(card => { card.style.transform = ''; });
    status.textContent = reducedMotion.matches ? 'REDUCED MOTION ACTIVE' : `MODE: ${styleSelect.options[styleSelect.selectedIndex].text.toUpperCase()}`;
  }

  function movePointer(event) {
    const rect = stage.getBoundingClientRect();
    const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
    stage.style.setProperty('--pointer-x', `${x * 100}%`);
    stage.style.setProperty('--pointer-y', `${y * 100}%`);
    if (reducedMotion.matches) return;
    const card = event.target.closest('.demo-card');
    if (!card || !stage.contains(card)) return;
    const cardRect = card.getBoundingClientRect();
    const px = (event.clientX - cardRect.left) / cardRect.width;
    const py = (event.clientY - cardRect.top) / cardRect.height;
    const power = Number(intensity.value) / 100;
    if (styleSelect.value === 'tilt') {
      const rx = (0.5 - py) * 12 * power;
      const ry = (px - 0.5) * 14 * power;
      card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-3px)`;
    } else if (styleSelect.value === 'magnetic') {
      const dx = (px - 0.5) * 18 * power;
      const dy = (py - 0.5) * 14 * power;
      card.style.transform = `translate(${dx}px, ${dy}px)`;
    }
  }

  function resetCard(event) {
    const card = event.target.closest('.demo-card');
    if (card) card.style.transform = '';
    if (!stage.matches(':hover')) {
      stage.style.setProperty('--pointer-x', '50%');
      stage.style.setProperty('--pointer-y', '50%');
    }
  }

  styleSelect.addEventListener('change', applyControls);
  duration.addEventListener('input', applyControls);
  intensity.addEventListener('input', applyControls);
  document.querySelector('#reset').addEventListener('click', () => {
    styleSelect.value = 'lift'; duration.value = '320'; intensity.value = '60'; applyControls();
  });
  stage.addEventListener('pointermove', movePointer);
  stage.addEventListener('pointerout', event => {
    if (!stage.contains(event.relatedTarget)) {
      cards.forEach(card => { card.style.transform = ''; });
      stage.style.setProperty('--pointer-x', '50%');
      stage.style.setProperty('--pointer-y', '50%');
    }
  });
  cards.forEach(card => {
    card.addEventListener('pointerleave', resetCard);
    card.addEventListener('blur', () => { card.style.transform = ''; });
    card.addEventListener('focus', () => { status.textContent = 'KEYBOARD FOCUS / INTERACTIVE CARD'; });
  });
  reducedMotion.addEventListener?.('change', applyControls);
  applyControls();
})();

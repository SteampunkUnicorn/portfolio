/** Keep the article table of contents aligned with the section being read. */
(() => {
  'use strict';

  const sections = [...document.querySelectorAll('.article-section[id]')];
  const links = [...document.querySelectorAll('.article-aside a[href^="#section-"]')];
  if (!sections.length || !links.length) return;

  const linkById = new Map(links.map(link => [link.hash.slice(1), link]));
  let activeId = '';
  let scheduled = false;

  function updateActiveSection() {
    scheduled = false;
    // A reading line just above the center works for tall and short sections.
    // Keep the first section selected while the introductory copy is visible.
    const readingLine = window.innerHeight * 0.35;
    let current = sections[0];
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= readingLine) {
        current = section;
      } else {
        break;
      }
    }
    if (current.id === activeId) return;
    activeId = current.id;
    for (const link of links) {
      if (link === linkById.get(activeId)) {
        link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }
    }
  }

  function scheduleUpdate() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(updateActiveSection);
  }

  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  window.addEventListener('hashchange', scheduleUpdate);
  // Also recalculates after font loading shifts the article layout.
  if (document.fonts) document.fonts.ready.then(scheduleUpdate);
  scheduleUpdate();
})();

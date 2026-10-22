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


(() => {
  const select=document.querySelector('#decision-choice');
  const title=document.querySelector('#decision-approach');
  const reason=document.querySelector('#decision-reason');
  if(!select||!title||!reason)return;
  const options={
    filter:['Conventional logic','Clear structured filters should be evaluated deterministically.'],
    language:['AI-assisted','Ambiguous natural-language input may benefit from interpretation by a model.'],
    hybrid:['Hybrid architecture','A model can interpret intent while conventional logic enforces business constraints and retrieves verified results.'],
    legacy:['Developer-led, AI-assisted','System history, regression risks, and hidden dependencies call for accountable engineering review.'],
    form:['Conventional logic','Validation requirements should be explicit, reliable, and consistently testable.']
  };
  select.addEventListener('change',()=>{const [a,b]=options[select.value];title.textContent=a;reason.textContent=b;});
})();

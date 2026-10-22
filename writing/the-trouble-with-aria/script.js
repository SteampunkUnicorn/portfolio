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
 'use strict';
 const picker=document.querySelector('#example-choice');
 const before=document.querySelector('#example-before');
 const after=document.querySelector('#example-after');
 const explanation=document.querySelector('#example-explanation');
 const copy=document.querySelector('#example-copy');
 const status=document.querySelector('#copy-status');
 if(!picker||!before||!after||!explanation||!copy||!status)return;
 const examples={
 button:{before:'<div role="button" onclick="save()">Save changes</div>',after:'<button type="button">Save changes</button>',why:'The native button supplies focus and keyboard activation. A role alone does not.'},
 label:{before:'<input aria-label="Email" placeholder="Email">',after:'<label for="email">Email</label>\n<input id="email" type="email">',why:'A visible, associated label names the field for everyone. An aria-label alone is not a visible substitute.'},
 heading:{before:'<div role="heading" aria-level="2">Overview</div>',after:'<h2>Overview</h2>',why:'Native heading elements already convey their role and level.'},
 hidden:{before:'<div aria-hidden="true">\n  <button>Continue</button>\n</div>',after:'<div hidden>\n  <button>Continue</button>\n</div>',why:'When content should also be visually unavailable, hidden removes it from layout and keyboard interaction. aria-hidden does neither.'}
 };
 function render(){const example=examples[picker.value];before.textContent=example.before;after.textContent=example.after;explanation.textContent=example.why;status.textContent='';}
 picker.addEventListener('change',render);
 copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(examples[picker.value].after);status.textContent='Copied';}catch{status.textContent='Select the better example to copy';}});
 render();
})();

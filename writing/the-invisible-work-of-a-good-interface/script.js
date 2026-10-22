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


// Native dialog: the browser provides modal focus containment and Escape handling.
(() => {
 const trigger=document.querySelector('#open-focus-dialog');
 const dialog=document.querySelector('#focus-dialog');
 const close=document.querySelector('#close-focus-dialog');
 const status=document.querySelector('#focus-status');
 if(!trigger||!dialog||!dialog.showModal)return;
 trigger.addEventListener('click',()=>{dialog.showModal();close.focus();status.textContent='Dialog is open; focus moved inside.';});
 close.addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>{trigger.focus();status.textContent='Dialog closed; focus returned to Open accessible dialog.';});
})();

// Demonstrate feedback lifecycle without network or external dependencies.
(() => {
 const form=document.querySelector('#feedback-form');if(!form)return;
 const email=document.querySelector('#demo-email'), status=document.querySelector('#feedback-status'), error=document.querySelector('#demo-email-error'), button=document.querySelector('#submit-feedback');
 let busy=false;
 form.addEventListener('submit',async e=>{
  e.preventDefault();if(busy)return;
  const thoughtful=document.querySelector('input[name=feedback-mode]:checked').value==='thoughtful';
  status.textContent='';error.textContent='';email.removeAttribute('aria-invalid');email.removeAttribute('aria-describedby');
  if(!email.validity.valid||!email.value.trim()){
   if(thoughtful){error.textContent='Enter a valid email address before continuing.';email.setAttribute('aria-invalid','true');email.setAttribute('aria-describedby','demo-email-error');email.focus();}
   return;
  }
  busy=true;button.disabled=true;if(thoughtful){status.textContent='Sending your request…';button.textContent='Sending…';}
  await new Promise(resolve=>setTimeout(resolve,800));
  if(thoughtful){status.textContent='Request sent. This is a demonstration; nothing was submitted.';}
  button.disabled=false;button.textContent='Send request';busy=false;
 });
})();

// Simulated reserved layout space: no timers or automated clicks are used.
(() => {
 const stage=document.querySelector('#layout-stage'),reveal=document.querySelector('#layout-reveal'),status=document.querySelector('#layout-status');if(!stage)return;
 const reset=()=>{stage.classList.remove('is-revealed');stage.classList.toggle('is-stable',document.querySelector('input[name=layout-mode]:checked').value==='stable');reveal.textContent='Reveal media';status.textContent=stage.classList.contains('is-stable')?'Space is reserved before media appears.':'No space reserved: the button will move when media appears.';};
 document.querySelectorAll('input[name=layout-mode]').forEach(r=>r.addEventListener('change',reset));
 reveal.addEventListener('click',()=>{const shown=stage.classList.toggle('is-revealed');reveal.textContent=shown?'Reset demo':'Reveal media';status.textContent=shown?(stage.classList.contains('is-stable')?'Media appeared without shifting the button.':'Media appeared and pushed the button downward.'):'Demo reset.';});
 reset();
})();

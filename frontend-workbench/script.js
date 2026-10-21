'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const toolButtons = [...document.querySelectorAll('[data-tool-target]')];
  const panels = [...document.querySelectorAll('[data-tool]')];
  const activateTool = (name, focus = false) => {
    toolButtons.forEach(button => {
      const selected = button.dataset.toolTarget === name;
      button.classList.toggle('is-active', selected);
      if (selected) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
    panels.forEach(panel => { panel.hidden = panel.dataset.tool !== name; });
    if (focus) $( `tool-${name}` ).querySelector('h2').setAttribute('tabindex', '-1');
    if (focus) $( `tool-${name}` ).querySelector('h2').focus({preventScroll:true});
  };
  toolButtons.forEach(button => button.addEventListener('click', () => activateTool(button.dataset.toolTarget, true)));
  if (location.hash.startsWith('#tool-') && $(location.hash.slice(1))) activateTool(location.hash.slice(6));

  // Fluid typography: interpolate min/max size across min/max viewport widths.
  const typeInputs = ['type-min','type-max','view-min','view-max'].map($);
  const viewportSlider = $('type-viewport');
  const fmt = n => Number(n.toFixed(4)).toString();
  const updateType = () => {
    const [min,max,vmin,vmax] = typeInputs.map(input => Number(input.value));
    const valid = [min,max,vmin,vmax].every(Number.isFinite) && min>0 && max>=min && vmin>=240 && vmax>vmin;
    $('type-error').textContent = valid ? '' : 'Enter valid sizes and increasing viewport boundaries.';
    if (!valid) { $('type-code').textContent = '/* Correct the input values to generate CSS. */'; return; }
    viewportSlider.min = vmin; viewportSlider.max = vmax;
    const viewport = Math.max(vmin, Math.min(vmax, Number(viewportSlider.value)));
    viewportSlider.value = String(viewport);
    $('type-view-label').textContent = `${viewport} px`;
    const slope = (max-min) / (vmax-vmin);
    const vw = slope * 100 * 16;
    const intercept = min - slope*vmin;
    const expression = `clamp(${fmt(min)}rem, calc(${fmt(intercept)}rem + ${fmt(vw)}vw), ${fmt(max)}rem)`;
    const size = min + slope*(viewport-vmin);
    $('type-measured').textContent = `${fmt(size)} rem / ${fmt(size*16)} px`;
    $('type-preview-text').style.fontSize = `${size}rem`;
    $('type-code').textContent = `.fluid-heading {\n  font-size: ${expression};\n}`;
  };
  [...typeInputs, viewportSlider].forEach(input => input.addEventListener('input', updateType));
  updateType();

  // Accessible disclosure / live region / ARIA tab pattern.
  const disclosure = $('disclosure-toggle');
  const disclosureContent = $('disclosure-content');
  const tabs = [$('tab-overview'), $('tab-details')];
  const tabPanels = [$('panel-overview'), $('panel-details')];
  const ariaSnapshot = () => {
    $('expanded-state').textContent = `aria-expanded="${disclosure.getAttribute('aria-expanded')}"`;
    $('selected-state').textContent = `aria-selected="${tabs.find(tab => tab.getAttribute('aria-selected') === 'true').getAttribute('aria-selected')}"`;
    $('aria-code').textContent = `<button aria-expanded="${disclosure.getAttribute('aria-expanded')}" aria-controls="disclosure-content">\n  Shipping details\n</button>\n<div id="disclosure-content"${disclosureContent.hidden?' hidden':''}>...</div>\n\n<div role="status" aria-live="polite">\n  ${$('aria-announcement').textContent}\n</div>\n\n<!-- Selected tab -->\n<button role="tab" aria-selected="true" aria-controls="${tabs.find(t=>t.getAttribute('aria-selected')==='true').getAttribute('aria-controls')}">...</button>`;
  };
  disclosure.addEventListener('click', () => {
    const open = disclosure.getAttribute('aria-expanded') !== 'true';
    disclosure.setAttribute('aria-expanded', String(open));
    disclosureContent.hidden = !open;
    ariaSnapshot();
  });
  let searchCount = 0;
  $('announce-button').addEventListener('click', () => {
    searchCount++;
    $('aria-announcement').textContent = searchCount % 3 === 0 ? 'Search complete. No matching results.' : `Search complete. ${searchCount+2} results found.`;
    ariaSnapshot();
  });
  const selectTab = (next, focus = false) => {
    tabs.forEach((tab,index) => {
      tab.setAttribute('aria-selected',String(index === next));
      tab.tabIndex = index === next ? 0 : -1;
      tabPanels[index].hidden = index !== next;
    });
    if (focus) tabs[next].focus();
    ariaSnapshot();
  };
  tabs.forEach((tab,index) => {
    tab.addEventListener('click', () => selectTab(index));
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length-1 : (index + (event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
      selectTab(next,true);
    });
  });
  ariaSnapshot();

  // Budget planner: user-entered transfer sizes, not network measurements.
  const budgetInputs = ['budget-images','budget-js','budget-css','budget-other','budget-limit'].map($);
  const updateBudget = () => {
    const values = budgetInputs.map(input => Number(input.value));
    const [images,js,css,other,limit] = values;
    const valid = values.every(Number.isFinite) && [images,js,css,other].every(v=>v>=0) && limit>0;
    if (!valid) {
      $('budget-status').textContent='Check inputs';
      $('budget-code').textContent='Enter nonnegative resource sizes and a positive budget.';
      return;
    }
    const total = images+js+css+other;
    const remaining = limit-total;
    const format = n=> `${n.toLocaleString('en-US',{maximumFractionDigits:1})} KB`;
    $('budget-total').textContent = format(total);
    $('budget-difference').textContent = `${format(Math.abs(remaining))} ${remaining>=0?'left':'over'}`;
    $('budget-status').textContent= remaining>=0?'Within budget':'Over budget';
    const denominator = Math.max(total,limit);
    [images,js,css,other].forEach((value,index) => {
      ['bar-images','bar-js','bar-css','bar-other'].map($)[index].style.width = `${(value/denominator)*100}%`;
    });
    $('budget-bar-label').setAttribute('aria-label',`${format(total)} entered against ${format(limit)} budget; ${remaining>=0?'within':'over'} budget`);
    $('budget-code').textContent=`Page weight budget (manual estimates)\nImages: ${format(images)}\nJavaScript: ${format(js)}\nCSS: ${format(css)}\nOther: ${format(other)}\nTOTAL: ${format(total)} / ${format(limit)}\nSTATUS: ${remaining>=0?'Within budget':'Over budget'}`;
  };
  budgetInputs.forEach(input=>input.addEventListener('input',updateBudget));
  updateBudget();

  // Sandbox-only focus explorer; native DOM order with real focus events.
  const sandbox = $('focus-sandbox');
  const focusable = [...sandbox.querySelectorAll('[data-focus-item]')];
  const focusLabels = ['Text input / Display name','Select / Topic','Checkbox / Updates','Button / Save preferences','Link / Read details'];
  const list = $('focus-list');
  focusable.forEach((element,i) => {
    const row = document.createElement('li');
    row.textContent = `${String(i+1).padStart(2,'0')} / ${focusLabels[i]}`;
    list.append(row);
  });
  const updateFocus = el => {
    const index = focusable.indexOf(el);
    [...list.children].forEach((row,i)=>row.classList.toggle('is-current',i===index));
    $('focus-current').textContent = index < 0 ? 'None in demo' : `${index+1} of ${focusable.length} · ${focusLabels[index]}`;
  };
  sandbox.addEventListener('focusin',event=>updateFocus(event.target));
  sandbox.addEventListener('focusout',()=>queueMicrotask(()=>{if(!sandbox.contains(document.activeElement))updateFocus(null)}));
  $('focus-next').addEventListener('click',()=>{
    const index = focusable.indexOf(document.activeElement);
    focusable[(index+1)%focusable.length].focus();
  });
  $('focus-reset').addEventListener('click',()=>{
    if(sandbox.contains(document.activeElement)) $('focus-reset').focus();
    updateFocus(null);
  });
  sandbox.querySelector('.focus-sandbox__actions button').addEventListener('click',()=>{});

  // Grid / Flexbox code generator and resizing preview.
  const layoutFields = ['layout-mode','layout-columns','layout-gap','layout-align','layout-width'].map($);
  function updateLayout() {
    const [mode,colsRaw,gapRaw,align,widthRaw] = layoutFields.map(e=>e.value);
    const cols=Math.min(6,Math.max(1,Number(colsRaw)||1));
    const gap=Math.min(64,Math.max(0,Number(gapRaw)||0));
    const width=Number(widthRaw);
    const items=$('layout-items');
    $('layout-viewport').style.width=`${width}px`;
    $('layout-width-out').textContent=`${width}px`;
    items.style.display=mode;
    items.style.gap=`${gap}px`;
    items.style.alignItems=align;
    items.style.gridTemplateColumns=mode==='grid'?`repeat(auto-fit, minmax(min(100%, ${Math.max(90,Math.floor((680-(cols-1)*gap)/cols))}px), 1fr))`:'';
    items.style.flexWrap=mode==='flex'?'wrap':'';
    [...items.children].forEach(el=>{el.style.flex=mode==='flex'?`1 1 ${Math.max(90,Math.floor((680-(cols-1)*gap)/cols))}px`:''});
    const columnWidth=Math.max(90,Math.floor((680-(cols-1)*gap)/cols));
    $('layout-code').textContent=mode==='grid'
      ?`.layout {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(min(100%, ${columnWidth}px), 1fr));\n  gap: ${gap}px;\n  align-items: ${align};\n}`
      :`.layout {\n  display: flex;\n  flex-wrap: wrap;\n  gap: ${gap}px;\n  align-items: ${align};\n}\n.layout > * {\n  flex: 1 1 ${columnWidth}px;\n}`;
  }
  layoutFields.forEach(el=>el.addEventListener('input',updateLayout)); updateLayout();

  // Exact sRGB relative luminance and WCAG 2.1 contrast math.
  const colorFields=['color-fg','color-bg','color-fg-hex','color-bg-hex'].map($);
  const hexValid=value=>/^#[0-9a-fA-F]{6}$/.test(value);
  function luminance(hex) {
    const c=[1,3,5].map(start=>parseInt(hex.slice(start,start+2),16)/255)
      .map(v=>v<=0.04045?v/12.92:Math.pow((v+0.055)/1.055,2.4));
    return .2126*c[0]+.7152*c[1]+.0722*c[2];
  }
  function updateColors() {
    const fg=$('color-fg-hex').value.trim(), bg=$('color-bg-hex').value.trim();
    if(!hexValid(fg)||!hexValid(bg)) {
      $('color-error').textContent='Enter two six-digit hex colors (for example #f4f5ed).';
      $('color-code').textContent='/* Fix colors to generate CSS. */'; return;
    }
    $('color-error').textContent='';
    $('color-fg').value=fg; $('color-bg').value=bg;
    const a=luminance(fg),b=luminance(bg);
    const ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
    const passes=t=>ratio>=t?'PASS':'FAIL';
    $('color-ratio').textContent=`${ratio.toFixed(2)}:1`;
    $('color-normal').textContent=`AA ${passes(4.5)} / AAA ${passes(7)}`;
    $('color-large').textContent=`AA ${passes(3)} / AAA ${passes(4.5)}`;
    const preview=$('color-preview');preview.style.color=fg;preview.style.backgroundColor=bg;
    $('color-code').textContent=`:root {\n  --text-color: ${fg};\n  --surface-color: ${bg};\n}\n.readable-panel {\n  color: var(--text-color);\n  background: var(--surface-color);\n}`;
  }
  ['fg','bg'].forEach(side=>{
    $(`color-${side}`).addEventListener('input',event=>{$(`color-${side}-hex`).value=event.target.value;updateColors()});
    $(`color-${side}-hex`).addEventListener('input',updateColors);
  });updateColors();

  // Real CSS transition preview with reduced-motion alternative.
  const motionFields=['motion-ease','motion-duration','motion-delay','motion-curve','motion-reduce'].map($);
  function motionSettings() {
    const easing=$('motion-ease').value==='custom'?`cubic-bezier(${$('motion-curve').value})`:$('motion-ease').value;
    const duration=Math.max(100,Math.min(4000,Number($('motion-duration').value)||650));
    const delay=Math.max(0,Math.min(2000,Number($('motion-delay').value)||0));
    const reduced=$('motion-reduce').checked;
    $('motion-code').textContent=`.animated-element {\n  transition: transform ${duration}ms ${easing} ${delay}ms;\n}\n.animated-element.is-active {\n  transform: translateX(200px);\n}\n@media (prefers-reduced-motion: reduce) {\n  .animated-element { transition: none; }\n  .animated-element.is-active { transform: none; }\n}`;
    return {easing,duration,delay,reduced};
  }
  let motionRun=0;
  function runMotion() {
    const {easing,duration,delay,reduced}=motionSettings();
    const elements=[$('motion-object'),$('motion-reference')];
    motionRun++;
    elements.forEach(el=>{el.style.transition='none';el.style.transform='translateX(0)';});
    void $('motion-object').offsetWidth;
    if(reduced)return;
    elements.forEach((el,i)=>{el.style.transition=`transform ${duration}ms ${i?'linear':easing} ${delay}ms`;const travel=Math.max(0,Math.min(200,el.parentElement.clientWidth-el.offsetWidth-24));el.style.transform=`translateX(${travel}px)`;});
  }
  motionFields.forEach(el=>el.addEventListener('input',motionSettings));
  $('motion-play').addEventListener('click',runMotion);motionSettings();

  // Native semantics examples; only the dialog intentionally requires a small JS controller.
  const semanticPatterns={
    button:{bad:'<div onclick="save()">Save</div>',good:'<button type="button">Save</button>',why:'Use a real button for actions. It provides keyboard activation, focusability and button semantics natively.',live:'<button type="button">Save example</button>'},
    nav:{bad:'<div><span onclick="go()">Home</span></div>',good:'<nav aria-label="Primary">\n  <a href="/">Home</a>\n</nav>',why:'Links navigate. A nav landmark groups them; its accessible label distinguishes it from other navigation.',live:'<nav aria-label="Example navigation"><a href="#semantic-title">Return to section heading ↗</a></nav>'},
    disclosure:{bad:'<div onclick="toggle()">More details</div>',good:'<details>\n  <summary>More details</summary>\n  <p>Additional information.</p>\n</details>',why:'Native details/summary supports an expandable disclosure without hand-built keyboard or ARIA state logic.',live:'<details><summary>More details</summary><p>Additional accessible information is available here.</p></details>'},
    form:{bad:'<input placeholder="Email">',good:'<label for="email">Email</label>\n<input id="email" type="email" autocomplete="email">',why:'Placeholder text does not replace a persistent programmatically associated form label.',live:'<label for="semantic-email">Email</label><input type="email" id="semantic-email" autocomplete="email">'},
    dialog:{bad:'<div class="popup">\n  <span>Preferences</span>\n</div>',good:'<dialog aria-labelledby="dialog-title">\n  <h2 id="dialog-title">Preferences</h2>\n  <button type="button">Close</button>\n</dialog>\n<!-- Open with dialog.showModal(); -->',why:'A modal opened via showModal() gains modal semantics, inert background and native focus handling. Provide a name, a close control and deliberate focus restoration.',live:'<button type="button" id="semantic-open">Open demo dialog</button><dialog aria-labelledby="semantic-dialog-title"><h3 id="semantic-dialog-title">Demo preferences</h3><p>This is a native modal.</p><button type="button" id="semantic-close">Close dialog</button></dialog>'}
  };
  function updateSemantic(){
    const p=semanticPatterns[$('semantic-pattern').value];
    $('semantic-bad').textContent=p.bad;$('semantic-good').textContent=p.good;$('semantic-explain').textContent=p.why;
    $('semantic-live').innerHTML=p.live;
    if($('semantic-pattern').value==='dialog'){
      const trigger=$('semantic-open'),dialog=$('semantic-live').querySelector('dialog');
      trigger.addEventListener('click',()=>dialog.showModal());
      $('semantic-close').addEventListener('click',()=>dialog.close());
      dialog.addEventListener('close',()=>trigger.focus());
    }
  }
  $('semantic-pattern').addEventListener('change',updateSemantic);updateSemantic();

  // Responsive image markup advisor. No file resizing or performance measurement.
  const imageInputs=['image-purpose','image-width','image-height','image-display','image-path'].map($);
  function updateImages(){
    const purpose=$('image-purpose').value,w=Number($('image-width').value),h=Number($('image-height').value),display=Number($('image-display').value);
    const base=$('image-path').value.trim();
    const valid=w>=200&&w<=8000&&h>=100&&h<=8000&&display>=100&&display<=3000&&/^[a-zA-Z0-9_-]+$/.test(base);
    $('image-error').textContent=valid?'':'Enter valid dimensions and a filename containing letters, numbers, - or _.';
    if(!valid){$('image-code').textContent='<!-- Correct the inputs to generate markup. -->';return}
    const candidates=[320,480,640,800,960,1200,1600,1920,2400,3200].filter(n=>n<=w);
    if(!candidates.includes(w))candidates.push(w);
    const chosen=[...new Set(candidates)].sort((a,b)=>a-b);
    const sizes=purpose==='hero'?'100vw':purpose==='content'?`(max-width: 700px) 100vw, ${display}px`:`(max-width: 640px) 50vw, ${Math.min(480,display)}px`;
    const props=purpose==='hero'?'loading="eager" fetchpriority="high"':'loading="lazy"';
    const source=chosen.map(n=>`    ${base}-${n}.webp ${n}w`).join(',\n');
    const markup=`<img\n  src="${base}-${chosen[chosen.length-1]}.webp"\n  srcset="\n${source}"\n  sizes="${sizes}"\n  width="${w}"\n  height="${h}"\n  alt="Describe meaningful image content"\n  decoding="async"\n  ${props}\n>`;
    $('image-code').textContent=markup;
    $('image-advice-title').textContent=purpose==='hero'?'Prioritize the likely LCP image':'Avoid loading imagery before it is needed';
    $('image-advice-text').textContent=purpose==='hero'?'A main hero image should normally be discovered early. Avoid lazy-loading a likely LCP image; consider preload only where needed.':'Below-the-fold images can use lazy loading; always reserve intrinsic dimensions to protect layout stability.';
  }
  imageInputs.forEach(el=>el.addEventListener('input',updateImages));updateImages();

  // Copy with fallback for local file previews and older browsers.
  const copyText = async text => {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    const area = document.createElement('textarea');
    area.value=text;area.style.position='fixed';area.style.opacity='0';
    document.body.append(area);area.select();
    const copied=document.execCommand('copy');area.remove();
    if(!copied) throw new Error('Clipboard unavailable');
  };
  document.querySelectorAll('[data-copy]').forEach(button=>button.addEventListener('click',async()=>{
    const original=button.textContent;
    try{await copyText($(button.dataset.copy).textContent);button.textContent='Copied ✓';}
    catch{button.textContent='Select code to copy';}
    window.setTimeout(()=>{button.textContent=original},2000);
  }));
})();

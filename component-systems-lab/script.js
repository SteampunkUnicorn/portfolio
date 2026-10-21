'use strict';
(() => {
  const $ = selector => document.querySelector(selector);
  const names = {
    buttons: ['01', 'Buttons', 'Semantic button elements with variant, size and disabled states.'],
    disclosure: ['02', 'Disclosure', 'A native button controls expandable content with a synchronized state.'],
    tabs: ['03', 'Tabs', 'A keyboard-operable tablist with roving focus and associated panels.'],
    dialog: ['04', 'Dialog', 'A modal using the native dialog element and browser-managed focus.'],
    form: ['05', 'Form fields', 'Accessible names, validation, descriptions and focus to the first error.']
  };
  const snippets = {
    buttons: () => `<button type="button" class="button ${$('#button-variant').value}${$('#button-size').value === 'regular' ? '' : ' ' + $('#button-size').value}"${$('#button-disabled').checked ? ' disabled' : ''}>Run action</button>\n\n/* Shared design tokens */\n.button {\n  padding: var(--control-py) var(--control-px);\n  border-radius: var(--radius);\n}\n.button:focus-visible { outline: 3px solid var(--accent); }`,
    disclosure: () => `<button type="button" aria-expanded="${$('#disclosure-toggle').getAttribute('aria-expanded')}" aria-controls="details">\n  What makes a disclosure accessible?\n</button>\n<div id="details"${$('#disclosure-content').hidden ? ' hidden' : ''}>Accessible disclosure content</div>\n\n// Keep aria-expanded and hidden in sync on toggle.`,
    tabs: () => `<div role="tablist" aria-label="Product details">\n  <button role="tab" id="tab-overview" aria-controls="panel-overview" aria-selected="${$('#tab-overview').getAttribute('aria-selected')}" tabindex="${$('#tab-overview').tabIndex}">Overview</button>\n  <button role="tab" id="tab-specs" aria-controls="panel-specs" aria-selected="${$('#tab-specs').getAttribute('aria-selected')}" tabindex="${$('#tab-specs').tabIndex}">Specs</button>\n  <button role="tab" id="tab-notes" aria-controls="panel-notes" aria-selected="${$('#tab-notes').getAttribute('aria-selected')}" tabindex="${$('#tab-notes').tabIndex}">Notes</button>\n</div>\n<!-- Each tab controls a tabpanel; add arrow-key handling. -->`,
    dialog: () => `<dialog aria-labelledby="dialog-title" aria-describedby="dialog-description">\n  <h2 id="dialog-title">Confirm action</h2>\n  <p id="dialog-description">This is a native modal dialog.</p>\n  <button type="button">Cancel</button>\n  <button type="button">Confirm</button>\n</dialog>\n\n// Use dialog.showModal() and dialog.close().`,
    form: () => `<label for="full-name">Full name</label>\n<input id="full-name" name="fullName" required aria-describedby="name-help${$('#name-error').hidden ? '' : ' name-error'}"${$('#full-name').getAttribute('aria-invalid') === 'true' ? ' aria-invalid="true"' : ''}>\n<small id="name-help">At least two characters.</small>\n<p id="name-error"${$('#name-error').hidden ? ' hidden' : ''}>Please enter at least two characters.</p>\n\n<!-- Associate each error with its field when validation fails. -->`
  };
  let selected = 'buttons';
  const renderSource = () => { $('#source-code').textContent = snippets[selected](); };
  const selectComponent = id => {
    selected = id;
    Object.keys(names).forEach(key => { $('#' + key).hidden = key !== id; });
    document.querySelectorAll('.nav-btn').forEach(btn => {
      const isCurrent = btn.dataset.target === id;
      btn.classList.toggle('is-active', isCurrent);
      if (isCurrent) btn.setAttribute('aria-current', 'true'); else btn.removeAttribute('aria-current');
    });
    const [number, title, description] = names[id];
    $('#panel-code').textContent = `COMPONENT / ${number}`;
    $('#panel-title').textContent = title;
    $('#panel-description').textContent = description;
    $('#copy-status').textContent = '';
    renderSource();
  };
  document.querySelectorAll('.nav-btn').forEach(btn => btn.addEventListener('click', () => selectComponent(btn.dataset.target)));
  const root = document.documentElement;
  $('#theme').addEventListener('change', e => root.dataset.theme = e.target.value);
  $('#radius').addEventListener('input', e => {root.style.setProperty('--radius', `${e.target.value}px`);$('#radius-value').textContent=`${e.target.value}px`;});
  $('#density').addEventListener('change', e => root.dataset.density = e.target.value);
  $('#reset').addEventListener('click', () => {$('#theme').value='lime';$('#radius').value='12';$('#density').value='comfortable';root.dataset.theme='lime';root.dataset.density='comfortable';root.style.setProperty('--radius','12px');$('#radius-value').textContent='12px';});
  function renderButton() {
    const button = $('#demo-button');
    button.className = `demo-button ${$('#button-variant').value} ${$('#button-size').value}`;
    button.disabled = $('#button-disabled').checked;
    renderSource();
  }
  ['button-variant','button-size','button-disabled'].forEach(id => $('#' + id).addEventListener('change', renderButton));
  let count = 0;
  $('#demo-button').addEventListener('click', () => {count++;$('#button-result').textContent=`Primary action invoked ${count} time${count===1?'':'s'}.`;});
  $('#demo-secondary').addEventListener('click', () => $('#button-result').textContent='Secondary action invoked.');
  function setDisclosure(open) {
    $('#disclosure-toggle').setAttribute('aria-expanded', String(open));
    $('#disclosure-content').hidden = !open;
    $('#disclosure-icon').textContent = open ? '−' : '+';
    $('#disclosure-status').textContent = open ? 'Expanded' : 'Collapsed';
    renderSource();
  }
  $('#disclosure-toggle').addEventListener('click', () => setDisclosure($('#disclosure-content').hidden));
  $('#disclosure-open').addEventListener('click', () => setDisclosure(true));
  $('#disclosure-close').addEventListener('click', () => setDisclosure(false));
  const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
  function activateTab(next, focus = true) {
    tabs.forEach((tab, i) => {
      const active = i === next;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      $('#' + tab.getAttribute('aria-controls')).hidden = !active;
    });
    if (focus) tabs[next].focus();
    renderSource();
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => activateTab(i, false));
    tab.addEventListener('keydown', event => {
      const key = event.key;
      if (!['ArrowLeft','ArrowRight','Home','End'].includes(key)) return;
      event.preventDefault();
      let next = key === 'Home' ? 0 : key === 'End' ? tabs.length-1 : (i+(key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
      activateTab(next);
    });
  });
  $('#tab-reset').addEventListener('click', () => activateTab(0, false));
  const dialog = $('#demo-dialog');
  const trigger = $('#dialog-open');
  trigger.addEventListener('click', () => {dialog.showModal();$('#dialog-status').textContent='Dialog open.';$('#dialog-cancel').focus();});
  $('#dialog-cancel').addEventListener('click', () => dialog.close('cancel'));
  $('#dialog-confirm').addEventListener('click', () => dialog.close('confirm'));
  dialog.addEventListener('close', () => {$('#dialog-status').textContent=dialog.returnValue==='confirm'?'Action confirmed.':'Dialog closed.';trigger.focus();});
  const form = $('#demo-form');
  function validateField(id, errorId, isValid) {
    const field = $('#' + id), error = $('#' + errorId);
    error.hidden = isValid;
    if (isValid) field.removeAttribute('aria-invalid'); else field.setAttribute('aria-invalid','true');
    field.setAttribute('aria-describedby', id==='full-name' ? `name-help${isValid?'':' name-error'}` : `email-help${isValid?'':' email-error'}`);
    return isValid;
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    const nameOk = validateField('full-name','name-error',$('#full-name').value.trim().length>=2);
    const email = $('#email');
    const emailOk = validateField('email','email-error',email.validity.valid && email.value.trim().length>0);
    $('#form-result').textContent = nameOk && emailOk ? 'Validation passed. Nothing was submitted.' : 'Please correct the highlighted fields.';
    if (!nameOk) $('#full-name').focus(); else if (!emailOk) email.focus();
    renderSource();
  });
  $('#form-reset').addEventListener('click', () => {
    form.reset();
    validateField('full-name','name-error',true);
    validateField('email','email-error',true);
    $('#form-result').textContent='';renderSource();
  });
  $('#copy-code').addEventListener('click', async () => {
    try {await navigator.clipboard.writeText($('#source-code').textContent);$('#copy-status').textContent='Code copied to clipboard.';}
    catch {$('#copy-status').textContent='Clipboard unavailable. Select and copy the code manually.';}
  });
  selectComponent('buttons');
})();

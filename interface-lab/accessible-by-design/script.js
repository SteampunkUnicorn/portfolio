"use strict";

const patterns = {
  dialog: {
    intro: "A modal needs more than a panel that looks like a modal.",
    flaws: ["No actual modal semantics or background inertness.", "Keyboard focus is not moved into the panel.", "Escape and focus restoration are not built in."],
    improvements: ["<dialog>.showModal() gives native modal behavior.", "The dialog has an accessible name and description.", "Escape closes it; focus generally returns to its invoker."],
    code: `<dialog id="preferences" aria-labelledby="dialog-title">\n  <h2 id="dialog-title">Preferences</h2>\n  <form method="dialog">\n    <button>Close</button>\n  </form>\n</dialog>\n\n// Open as a real modal\npreferences.showModal();`
  },
  form: {
    intro: "Errors need to be understandable, discoverable, and associated with their fields.",
    flaws: ["Placeholder text disappears when the user types.", "The error has no programmatic relationship with its input.", "There is no reliable way to discover the error after submission."],
    improvements: ["A persistent <label> identifies the input.", "aria-invalid and aria-describedby connect the error to the field.", "Focus moves to the invalid field for immediate correction."],
    code: `<label for="email">Email address</label>\n<input id="email" type="email"\n  required aria-describedby="email-error"\n  aria-invalid="true">\n<p id="email-error">Enter a valid email.</p>\n\n// After validating, focus the error field\nemail.focus();`
  },
  status: {
    intro: "Changing pixels isn't always enough to announce a meaningful state change.",
    flaws: ["Only the visible counter changes.", "There is no dedicated announcement of the completed action.", "A screen reader user may not discover the update without navigation."],
    improvements: ["role=status creates a polite live region.", "The status region exists before the update.", "Feedback is short and doesn't move keyboard focus."],
    code: `<p id="feedback" role="status"\n   aria-atomic="true"></p>\n\n// After the user activates the button\nfeedback.textContent =\n  "Item added. 3 items total.";`
  }
};

const patternButtons = [...document.querySelectorAll("[data-pattern-button]")];
const demos = [...document.querySelectorAll(".demo[data-pattern]")];
const codeElement = document.querySelector("#inspector-code");
const focusCheckbox = document.querySelector("#show-focus");

function renderList(selector, values) {
  const list = document.querySelector(selector);
  list.replaceChildren(...values.map(value => {
    const item = document.createElement("li");
    item.textContent = value;
    return item;
  }));
}

function choosePattern(key) {
  if (!patterns[key]) return;
  // Close an open demonstration before hiding its containing panel.
  const dialog = document.querySelector("#good-dialog");
  if (dialog.open) dialog.close();
  document.querySelector("#flawed-overlay").hidden = true;

  patternButtons.forEach(button => {
    const active = button.dataset.patternButton === key;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  demos.forEach(demo => { demo.hidden = demo.dataset.pattern !== key; });
  document.querySelector("#pattern-intro").textContent = patterns[key].intro;
  document.querySelector("#inspector-label").textContent = key.toUpperCase();
  renderList("#flaws-list", patterns[key].flaws);
  renderList("#improvements-list", patterns[key].improvements);
  codeElement.textContent = patterns[key].code;
}

patternButtons.forEach(button => button.addEventListener("click", () => choosePattern(button.dataset.patternButton)));
focusCheckbox.addEventListener("change", () => {
  document.body.classList.toggle("force-focus", focusCheckbox.checked);
});

const flawedOverlay = document.querySelector("#flawed-overlay");
document.querySelector("#flawed-open").addEventListener("click", () => { flawedOverlay.hidden = false; });
document.querySelector("#flawed-close").addEventListener("click", () => { flawedOverlay.hidden = true; });
const goodDialog = document.querySelector("#good-dialog");
document.querySelector("#good-open").addEventListener("click", () => goodDialog.showModal());

const isValidEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

document.querySelector("#flawed-form").addEventListener("submit", event => {
  event.preventDefault();
  const value = document.querySelector("#flawed-email").value;
  document.querySelector("#flawed-feedback").textContent = isValidEmail(value) ? "Thanks!" : "Invalid input.";
});

const goodEmail = document.querySelector("#good-email");
const goodFeedback = document.querySelector("#good-feedback");
document.querySelector("#good-form").addEventListener("submit", event => {
  event.preventDefault();
  if (!isValidEmail(goodEmail.value)) {
    goodEmail.setAttribute("aria-invalid", "true");
    goodEmail.setAttribute("aria-describedby", "good-email-hint good-feedback");
    goodFeedback.textContent = "Enter a valid email address, such as name@example.com.";
    goodEmail.focus();
    return;
  }
  goodEmail.removeAttribute("aria-invalid");
  goodEmail.setAttribute("aria-describedby", "good-email-hint");
  goodFeedback.textContent = "Thanks! This is a demo; no information was sent.";
});
goodEmail.addEventListener("input", () => {
  if (goodEmail.getAttribute("aria-invalid") !== "true") return;
  if (isValidEmail(goodEmail.value)) {
    goodEmail.removeAttribute("aria-invalid");
    goodEmail.setAttribute("aria-describedby", "good-email-hint");
    goodFeedback.textContent = "";
  }
});

let flawedCount = 0;
let goodCount = 0;
document.querySelector("#flawed-add").addEventListener("click", () => {
  document.querySelector("#flawed-count").textContent = String(++flawedCount);
});
document.querySelector("#good-add").addEventListener("click", () => {
  document.querySelector("#good-count").textContent = String(++goodCount);
  document.querySelector("#good-status").textContent = `Item added. ${goodCount} ${goodCount === 1 ? "item" : "items"} total.`;
});

document.querySelector("#copy-code").addEventListener("click", async () => {
  const feedback = document.querySelector("#copy-feedback");
  try {
    await navigator.clipboard.writeText(codeElement.textContent);
    feedback.textContent = "Example code copied.";
  } catch {
    feedback.textContent = "Clipboard unavailable. Select the code block to copy manually.";
  }
});

choosePattern("dialog");

// ----------------------------------------
// Focus-order visualization / experiment 003
// ----------------------------------------
const showOrder = document.querySelector("#show-order");
const stepFocus = document.querySelector("#step-focus");
const refreshOrder = document.querySelector("#refresh-order");
const orderCount = document.querySelector("#order-count");
const focusBadges = [];
let focusStops = [];
let focusIndex = -1;
let orderFrame = 0;

const focusSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const isFocusVisible = element => {
  if (element.closest('[hidden], [inert]')) return false;
  if (element.closest('dialog:not([open])')) return false;
  const style = getComputedStyle(element);
  if (style.display === 'none' || style.visibility !== 'visible') return false;
  return element.getClientRects().length > 0;
};

function removeBadges() {
  focusBadges.splice(0).forEach(badge => badge.remove());
}

function findFocusStops() {
  const modal = document.querySelector('#good-dialog');
  const root = modal.open ? modal : document.querySelector('.workbench');
  return [...root.querySelectorAll(focusSelector)].filter(isFocusVisible);
}

function drawFocusOrder() {
  removeBadges();
  if (!showOrder.checked) {
    focusStops = [];
    orderCount.textContent = 'Visualizer off';
    stepFocus.disabled = true;
    return;
  }
  focusStops = findFocusStops();
  focusStops.forEach((element, index) => {
    const rect = element.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight || rect.right < 0 || rect.left > window.innerWidth) return;
    const badge = document.createElement('span');
    badge.className = 'focus-order-badge';
    badge.textContent = String(index + 1);
    badge.setAttribute('aria-hidden', 'true');
    badge.style.left = `${Math.max(3, Math.min(window.innerWidth - 29, rect.left - 9))}px`;
    badge.style.top = `${Math.max(3, Math.min(window.innerHeight - 29, rect.top - 13))}px`;
    if (element === document.activeElement) badge.classList.add('focus-order-badge--active');
    document.body.append(badge);
    focusBadges.push(badge);
  });
  stepFocus.disabled = focusStops.length === 0;
  orderCount.textContent = `${focusStops.length} focus stops${document.querySelector('#good-dialog').open ? ' (modal only)' : ''}`;
}

function scheduleFocusOrder() {
  if (!showOrder.checked) return;
  cancelAnimationFrame(orderFrame);
  orderFrame = requestAnimationFrame(drawFocusOrder);
}

showOrder.addEventListener('change', () => {
  focusIndex = -1;
  drawFocusOrder();
});
stepFocus.disabled = true;
stepFocus.addEventListener('click', () => {
  focusStops = findFocusStops();
  if (!focusStops.length) return;
  const current = focusStops.indexOf(document.activeElement);
  focusIndex = (current + 1) % focusStops.length;
  focusStops[focusIndex].focus({ preventScroll: true });
  focusStops[focusIndex].scrollIntoView({ block: 'nearest', behavior: 'auto' });
  scheduleFocusOrder();
});
refreshOrder.addEventListener('click', drawFocusOrder);
document.addEventListener('focusin', scheduleFocusOrder);
window.addEventListener('resize', scheduleFocusOrder);
window.addEventListener('scroll', scheduleFocusOrder, { passive: true, capture: true });
const orderObserver = new MutationObserver(scheduleFocusOrder);
orderObserver.observe(document.querySelector('.workbench'), { subtree: true, attributes: true, attributeFilter: ['hidden', 'open', 'style', 'class', 'disabled'] });


// ----------------------------------------
// Semantics inspector / experiment 003
// Educational DOM-derived view: not a browser accessibility-tree API.
// ----------------------------------------
const treeRefresh = document.querySelector('#refresh-tree');
const treeUpdated = document.querySelector('#tree-updated');
const semanticNodes = {
  dialog: {
    flawed: ['flawed-open', 'flawed-overlay', 'flawed-close'],
    improved: ['good-open', 'good-dialog', 'good-dialog-title', 'good-dialog-description']
  },
  form: {
    flawed: ['flawed-email', 'flawed-feedback'],
    improved: ['good-email', 'good-feedback']
  },
  status: {
    flawed: ['flawed-add', 'flawed-count'],
    improved: ['good-add', 'good-count', 'good-status']
  }
};

const limitedRole = element => {
  if (element.hasAttribute('role')) return element.getAttribute('role');
  const tags = { BUTTON: 'button', INPUT: 'textbox', DIALOG: 'dialog', H4: 'heading', P: 'paragraph', STRONG: 'generic', DIV: 'generic' };
  return tags[element.tagName] || 'generic';
};

const textFromIds = (element, attr) => (element.getAttribute(attr) || '')
  .split(/\s+/).filter(Boolean)
  .map(id => document.getElementById(id)?.textContent.trim() || '')
  .filter(Boolean).join(' ');

// A deliberately small accessible-name heuristic. Placeholder is *not* a label.
const limitedName = element => {
  if (element.hasAttribute('aria-label')) return element.getAttribute('aria-label').trim();
  if (element.hasAttribute('aria-labelledby')) return textFromIds(element, 'aria-labelledby');
  if (element.id) {
    const label = [...document.querySelectorAll('label[for]')]
      .find(item => item.htmlFor === element.id);
    if (label) return label.textContent.trim().replace(/\s+/g, ' ');
  }
  if (element.tagName === 'BUTTON' || /^H[1-6]$/.test(element.tagName)) return element.textContent.trim().replace(/\s+/g, ' ');
  return '';
};

function semanticData(element) {
  const role = limitedRole(element);
  const name = limitedName(element);
  const description = element.hasAttribute('aria-describedby') ? textFromIds(element, 'aria-describedby') : '';
  const state = [];
  if (element.hasAttribute('aria-invalid')) state.push(`invalid: ${element.getAttribute('aria-invalid')}`);
  if (element.hasAttribute('aria-expanded')) state.push(`expanded: ${element.getAttribute('aria-expanded')}`);
  if (element.tagName === 'DIALOG') state.push(`open: ${element.open}`);
  if (element.hasAttribute('aria-live')) state.push(`live: ${element.getAttribute('aria-live')}`);
  if (role === 'status') state.push('live: polite (implicit)');
  if (element.hidden) state.push('hidden');
  return { role, name, description, state, tag: element.tagName.toLowerCase(), id: element.id };
}

let treeFrame = 0;
let highlightTimer;
function renderSemanticTree() {
  treeFrame = 0;
  const current = patternButtons.find(button => button.getAttribute('aria-pressed') === 'true')?.dataset.patternButton || 'dialog';
  for (const version of ['flawed', 'improved']) {
    const list = document.querySelector(`#tree-${version}`);
    list.replaceChildren();
    for (const id of semanticNodes[current][version]) {
      const element = document.getElementById(id);
      if (!element) continue;
      // Don't present closed / visually hidden descendants as active tree nodes.
      if (element.closest('[hidden]') || (element.closest('dialog') && !element.closest('dialog').open)) continue;
      const { role, name, description, state, tag } = semanticData(element);
      const item = document.createElement('li');
      const select = document.createElement('button');
      select.type = 'button';
      select.className = 'tree-lab__node';
      select.setAttribute('aria-label', `Locate ${tag} ${id} in ${version} example`);
      const heading = document.createElement('span');
      heading.className = 'tree-lab__node-heading';
      heading.textContent = `${role}  ·  <${tag}>`;
      const nameText = document.createElement('span');
      nameText.className = 'tree-lab__node-name';
      nameText.textContent = `Name: ${name ? `“${name}”` : '(none)'}`;
      select.append(heading, nameText);
      if (description) {
        const desc = document.createElement('span');
        desc.className = 'tree-lab__node-meta';
        desc.textContent = `Description: ${description}`;
        select.append(desc);
      }
      if (state.length) {
        const states = document.createElement('span');
        states.className = 'tree-lab__node-meta';
        states.textContent = `State: ${state.join(' · ')}`;
        select.append(states);
      }
      select.addEventListener('click', () => {
        clearTimeout(highlightTimer);
        document.querySelectorAll('.tree-highlight').forEach(node => node.classList.remove('tree-highlight'));
        element.scrollIntoView({ block: 'nearest', behavior: 'auto' });
        element.classList.add('tree-highlight');
        highlightTimer = setTimeout(() => element.classList.remove('tree-highlight'), 1800);
      });
      item.append(select);
      list.append(item);
    }
    if (!list.children.length) {
      const item = document.createElement('li');
      item.textContent = 'No exposed demo nodes in this state.';
      list.append(item);
    }
  }
}
function scheduleSemanticTree() {
  if (treeFrame) return;
  treeFrame = requestAnimationFrame(renderSemanticTree);
}
treeRefresh.addEventListener('click', () => {
  renderSemanticTree();
  treeUpdated.textContent = 'Semantic snapshot refreshed.';
});
// Observe only the demonstrations, never our own generated list output.
const semanticObserver = new MutationObserver(scheduleSemanticTree);
document.querySelectorAll('.comparison__pane').forEach(pane => {
  semanticObserver.observe(pane, { subtree: true, attributes: true, characterData: true, childList: true, attributeFilter: undefined });
});
patternButtons.forEach(button => button.addEventListener('click', scheduleSemanticTree));
scheduleSemanticTree();

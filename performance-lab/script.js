'use strict';
(() => {
  const $ = selector => document.querySelector(selector);
  const before = $('#before-stage');
  const after = $('#after-stage');
  const runButton = $('#run');
  const delay = $('#delay');
  const note = $('#experiment-note');
  const announcement = $('#experiment-status');
  let metric = 'lcp';
  let token = 0;
  let timers = [];
  let busy = false;

  const scenarios = {
    lcp: {
      eyebrow: 'LARGEST CONTENTFUL PAINT', title: 'The loading race.',
      description: 'Prioritizing the main content changes when the page feels ready.',
      insightTitle: 'Make the largest content discoverable early.',
      insight: 'This comparison simulates early versus late hero discovery. For real sites, investigate server response, preload discovery, resource priorities, and render delay.',
      note: 'Timed simulation only. These delays are controlled illustrations, not LCP measurements.',
      type: 'TIMED SIMULATION',
      code: `<img src="hero.webp" width="1200" height="720"\n     fetchpriority="high" alt="...">\n<!-- Ensure the main image is discoverable early. -->`
    },
    inp: {
      eyebrow: 'INTERACTION TO NEXT PAINT', title: 'The blocking button.',
      description: 'Expensive JavaScript can delay visible feedback to a user action.',
      insightTitle: 'Let the browser paint before heavy work.',
      insight: 'The left demo runs a synchronous busy loop before updating feedback. The right demo displays feedback first, yields for a paint, then chunks the same approximate work across tasks. Less work is preferable to scheduling unnecessary work.',
      note: 'Click-to-paint estimates are local illustrative timings, not INP. The real INP metric summarizes qualifying interactions over a page visit.',
      type: 'LOCAL TIMING',
      code: `button.addEventListener('click', async () => {\n  showImmediateFeedback();\n  await new Promise(requestAnimationFrame);\n  await yieldToMainThread();\n  await doWorkInChunks();\n});`
    },
    cls: {
      eyebrow: 'CUMULATIVE LAYOUT SHIFT', title: 'The shifting page.',
      description: 'Content that arrives without reserved space can push the rest of the page around.',
      insightTitle: 'Reserve space before the content arrives.',
      insight: 'An element with a known aspect ratio holds its place before it loads. The unstable example inserts an image-shaped block later and displaces nearby content.',
      note: 'The displacement readout uses bounding-box movement in this isolated demo, not the CLS algorithm. Real CLS excludes certain expected shifts after recent input.',
      type: 'GEOMETRY READOUT',
      code: `.media-slot {\n  aspect-ratio: 16 / 9;\n}\n.media-slot img {\n  width: 100%; height: 100%;\n  object-fit: cover;\n}`
    }
  };

  function schedule(callback, ms) {
    const id = setTimeout(callback, ms);
    timers.push(id);
  }
  function resetAsync() {
    token++;
    timers.forEach(clearTimeout);
    timers = [];
    busy = false;
    runButton.disabled = false;
    runButton.textContent = 'Run comparison ↗';
  }
  function setState(side, state, value='—', detail='Run the comparison') {
    $(`#${side}-state`).textContent = state;
    $(`#${side}-measure`).textContent = value;
    $(`#${side}-detail`).textContent = detail;
  }
  const hero = loaded => `<div class="mock-page"><div class="mock-nav"><b>STUDIO/</b><span>WORK &nbsp; ABOUT &nbsp; ↗</span></div><div class="mock-image ${loaded ? 'is-loaded' : ''}">${loaded ? '<div class="sun"></div><div class="mountain one"></div><div class="mountain two"></div>' : '<span class="placeholder">HERO IMAGE PENDING</span>'}</div><div class="mock-copy"><b>Designed for the moment.</b><span></span><span></span></div></div>`;
  const task = (side) => `<div class="task-demo"><div class="task-orbit" aria-hidden="true">✳</div><p>Request a visual update, then complete a heavy task.</p><button type="button" class="task-button" data-side="${side}">Update interface ↗</button><div class="task-feedback" aria-live="off">Waiting for interaction</div></div>`;
  const layout = reserved => `<div class="layout-demo"><div class="layout-head">THE WEEKLY DISPATCH <span>ISSUE 004</span></div><div class="layout-slot ${reserved?'is-reserved':''}"></div><div class="layout-target"><strong>FEATURED STORY</strong><div class="line"></div><div class="line short"></div><div class="line"></div></div><div class="layout-bottom">READ THE STORY →</div></div>`;

  function reset() {
    resetAsync();
    setState('before','READY');
    setState('after','READY');
    if(metric === 'lcp') {
      before.innerHTML = hero(false);
      after.innerHTML = hero(false);
    } else if(metric === 'inp') {
      before.innerHTML = task('before');
      after.innerHTML = task('after');
    } else {
      before.innerHTML = layout(false);
      after.innerHTML = layout(true);
    }
    announcement.textContent = `${metric.toUpperCase()} experiment reset.`;
  }

  function choose(next) {
    metric = next;
    const item = scenarios[metric];
    document.querySelectorAll('.metric-tab').forEach(button => {
      const selected = button.dataset.metric === metric;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    $('#metric-eyebrow').textContent = item.eyebrow;
    $('#metric-title').textContent = item.title;
    $('#metric-description').textContent = item.description;
    $('#insight-title').textContent = item.insightTitle;
    $('#insight-copy').textContent = item.insight;
    $('#test-type').textContent = item.type;
    $('#code-example').textContent = item.code;
    note.textContent = item.note;
    $('#delay-control').hidden = metric !== 'lcp';
    reset();
  }

  function runLcp() {
    const sequence = ++token;
    busy = true;
    runButton.disabled = true;
    setState('before','LOADING','…','Hero resource discovered late');
    setState('after','LOADING','…','Hero resource prioritized');
    const start = performance.now();
    const wait = Number(delay.value);
    schedule(() => {
      if(sequence !== token) return;
      after.innerHTML = hero(true);
      setState('after','VISIBLE',`${Math.round(performance.now()-start)}ms`,'Illustrative reveal delay');
    }, Math.round(wait * .32));
    schedule(() => {
      if(sequence !== token) return;
      before.innerHTML = hero(true);
      setState('before','VISIBLE',`${Math.round(performance.now()-start)}ms`,'Illustrative reveal delay');
      busy = false;
      runButton.disabled = false;
      announcement.textContent = 'Simulated loading comparison complete.';
    }, wait);
  }

  const yieldTask = () => globalThis.scheduler?.yield ? globalThis.scheduler.yield() : new Promise(resolve => setTimeout(resolve, 0));
  function spin(ms) {
    const end = performance.now() + ms;
    while(performance.now() < end) { Math.sqrt(64321); }
  }
  // Two animation frames give the browser an opportunity to render.
  const afterPaintOpportunity = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve(performance.now()))));
  async function runInp(side, button) {
    if(busy) return;
    busy = true;
    button.disabled = true;
    const start = performance.now();
    const feedback = button.parentElement.querySelector('.task-feedback');
    const work = 180;
    if(side === 'before') {
      spin(work);
      feedback.textContent = 'Updated after blocking work';
    } else {
      feedback.textContent = 'Feedback displayed — work continues';
    }
    const paintPromise = afterPaintOpportunity();
    const paintAt = await paintPromise;
    setState(side, 'FEEDBACK', `${Math.round(paintAt - start)}ms`, 'Approx. click-to-render opportunity');
    if(side === 'after') {
      const run = token;
      for(let i=0;i<9;i++) {
        if(run !== token) break;
        spin(work/9);
        await yieldTask();
      }
      if(run === token) feedback.textContent = 'Feedback first; background work completed';
    }
    busy = false;
    button.disabled = false;
    announcement.textContent = `${side} responsiveness demonstration complete.`;
  }
  function runCls() {
    const run = ++token;
    busy = true;
    runButton.disabled = true;
    before.innerHTML = layout(false);
    after.innerHTML = layout(true);
    setState('before','WAITING','…','Content about to arrive');
    setState('after','WAITING','…','Space already reserved');
    const targetA = before.querySelector('.layout-target');
    const targetB = after.querySelector('.layout-target');
    const firstA = targetA.getBoundingClientRect().top;
    const firstB = targetB.getBoundingClientRect().top;
    schedule(() => {
      if(run !== token) return;
      before.querySelector('.layout-slot').classList.add('is-loaded');
      after.querySelector('.layout-slot').classList.add('is-loaded');
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if(run !== token) return;
        const moveA = Math.abs(targetA.getBoundingClientRect().top-firstA);
        const moveB = Math.abs(targetB.getBoundingClientRect().top-firstB);
        setState('before','SHIFTED',`${Math.round(moveA)}px`,'Element displacement (not CLS)');
        setState('after','STABLE',`${Math.round(moveB)}px`,'Element displacement (not CLS)');
        busy = false;
        runButton.disabled = false;
        announcement.textContent = 'Layout displacement comparison complete.';
      }));
    }, 550);
  }

  document.querySelectorAll('.metric-tab').forEach(button => button.addEventListener('click', () => choose(button.dataset.metric)));
  $('#reset').addEventListener('click', reset);
  runButton.addEventListener('click', () => {
    if(busy) return;
    if(metric==='lcp') runLcp();
    if(metric==='cls') runCls();
    if(metric==='inp') {
      announcement.textContent = 'Click the Update interface button inside either comparison to measure feedback.';
      before.querySelector('.task-button').focus();
    }
  });
  document.addEventListener('click', event => {
    const button = event.target.closest('.task-button');
    if(button && metric==='inp') runInp(button.dataset.side,button);
  });
  delay.addEventListener('input', () => { $('#delay-value').textContent = `${delay.value}ms`; });
  $('#copy').addEventListener('click', async event => {
    const text = $('#code-example').textContent;
    try {
      await navigator.clipboard.writeText(text);
      event.currentTarget.textContent='Copied ✓';
      schedule(() => { event.currentTarget.textContent='Copy code ↗'; }, 1500);
    } catch {
      event.currentTarget.textContent='Select code to copy';
    }
  });

  // -----------------------------------------------
  // Real browser timing inspector (separate from demos)
  // -----------------------------------------------
  const observerRows = $('#obs-log');
  const inspectorStatus = $('#obs-status');
  const startObserving = $('#observe-start');
  const stopObserving = $('#observe-stop');
  const clearObserving = $('#observe-clear');
  const supported = new Set(window.PerformanceObserver?.supportedEntryTypes || []);
  const entryTypes = [
    ['largest-contentful-paint', 'lcp'],
    ['event', 'event'],
    ['layout-shift', 'cls']
  ];
  const watchers = [];
  let observing = false;
  let observedCount = 0;
  let largestEvent = 0;
  let shiftTotal = 0;
  let displayedLcp = null;
  let seenRows = new Set();

  function inspectorReset() {
    observedCount = 0;
    largestEvent = 0;
    shiftTotal = 0;
    displayedLcp = null;
    seenRows.clear();
    $('#obs-lcp-value').textContent = '—';
    $('#obs-event-value').textContent = '—';
    $('#obs-cls-value').textContent = '—';
    $('#obs-lcp-detail').textContent = 'No LCP candidate captured in this display.';
    $('#obs-event-detail').textContent = 'No qualifying event entry captured.';
    $('#obs-cls-detail').textContent = 'No qualifying shift captured.';
    $('#obs-entry-count').textContent = '0 entries';
    observerRows.replaceChildren();
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 4;
    td.textContent = 'No entries displayed. Interact with the page or reload to capture load-time entries.';
    tr.append(td);
    observerRows.append(tr);
  }

  function appendEntry(kind, time, value, context, key) {
    if (seenRows.has(key)) return;
    seenRows.add(key);
    if (observedCount === 0) observerRows.replaceChildren();
    observedCount++;
    const row = document.createElement('tr');
    for (const cell of [kind, `${Math.round(time)} ms`, value, context]) {
      const td = document.createElement('td');
      td.textContent = cell;
      row.append(td);
    }
    observerRows.prepend(row);
    while (observerRows.children.length > 40) observerRows.lastElementChild.remove();
    $('#obs-entry-count').textContent = `${observedCount} ${observedCount === 1 ? 'entry' : 'entries'} (latest 40 shown)`;
  }

  function consumeEntries(type, entries) {
    for (const entry of entries) {
      if (type === 'largest-contentful-paint') {
        const time = entry.renderTime || entry.loadTime || entry.startTime;
        if (displayedLcp === null || time >= displayedLcp) {
          displayedLcp = time;
          $('#obs-lcp-value').textContent = `${Math.round(time)} ms`;
          $('#obs-lcp-detail').textContent = 'Latest observed LCP candidate; not a 75th-percentile field metric.';
        }
        appendEntry('LCP', entry.startTime, `${Math.round(time)} ms`, entry.element?.tagName?.toLowerCase() || 'element unavailable', `lcp:${entry.startTime}:${entry.size}`);
      } else if (type === 'event') {
        largestEvent = Math.max(largestEvent, entry.duration);
        $('#obs-event-value').textContent = `${Math.round(largestEvent)} ms`;
        $('#obs-event-detail').textContent = 'Longest observed Event Timing entry (not INP).';
        appendEntry('Event', entry.startTime, `${Math.round(entry.duration)} ms`, entry.name || 'interaction event', `event:${entry.startTime}:${entry.duration}:${entry.name}`);
      } else if (type === 'layout-shift' && !entry.hadRecentInput) {
        shiftTotal += entry.value;
        $('#obs-cls-value').textContent = shiftTotal.toFixed(4);
        $('#obs-cls-detail').textContent = 'Running sum since observing started (not session-window CLS).';
        appendEntry('Shift', entry.startTime, entry.value.toFixed(4), 'No recent input', `shift:${entry.startTime}:${entry.value}`);
      }
    }
  }

  function setObserverControls() {
    startObserving.disabled = observing || supported.size === 0;
    stopObserving.disabled = !observing;
  }

  entryTypes.forEach(([type, id]) => {
    $(`#obs-${id}-support`).textContent = supported.has(type) ? 'Supported' : 'Unavailable';
  });

  startObserving.addEventListener('click', () => {
    if (observing || !window.PerformanceObserver) return;
    const failures = [];
    for (const [type] of entryTypes) {
      if (!supported.has(type)) continue;
      try {
        const observer = new PerformanceObserver(list => consumeEntries(type, list.getEntries()));
        const options = { type, buffered: true };
        if (type === 'event') options.durationThreshold = 16;
        observer.observe(options);
        watchers.push(observer);
      } catch (error) {
        failures.push(type);
      }
    }
    observing = watchers.length > 0;
    setObserverControls();
    inspectorStatus.textContent = observing
      ? `Observing ${watchers.length} timing type(s).${failures.length ? ` Could not start: ${failures.join(', ')}.` : ''}`
      : 'No supported timing observers could be started in this browser.';
  });

  stopObserving.addEventListener('click', () => {
    watchers.splice(0).forEach(observer => observer.disconnect());
    observing = false;
    setObserverControls();
    inspectorStatus.textContent = 'Observing stopped. Collected results remain visible.';
  });

  clearObserving.addEventListener('click', () => {
    inspectorReset();
    inspectorStatus.textContent = observing
      ? 'Display cleared; observation continues. Browser timeline is unchanged.'
      : 'Display cleared; observing remains off.';
  });

  setObserverControls();

  $('#year').textContent = new Date().getFullYear();
  choose('lcp');
})();

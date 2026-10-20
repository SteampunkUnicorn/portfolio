"use strict";
(() => {
  const buttons = [...document.querySelectorAll('[data-filter]')];
  const cards = [...document.querySelectorAll('.exp-card--micro')];
  const search = document.querySelector('#search');
  const count = document.querySelector('#count');
  const empty = document.querySelector('#empty');
  let category = 'all';
  function update() {
    const term = search.value.trim().toLocaleLowerCase();
    let shown = 0;
    cards.forEach(card => {
      const matchCategory = category === 'all' || card.dataset.category === category;
      const matchText = !term || card.dataset.search.includes(term);
      card.hidden = !(matchCategory && matchText);
      if (!card.hidden) shown++;
    });
    count.textContent = `Showing ${shown} ${shown === 1 ? 'experiment' : 'experiments'}`;
    empty.hidden = shown !== 0;
  }
  buttons.forEach(button => button.addEventListener('click', () => {
    category = button.dataset.filter;
    buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    update();
  }));
  search.addEventListener('input', update);
  update();
})();

"use strict";

// The first iteration is intentionally progressive-enhancement friendly:
// navigation, project links, and the layout work without JavaScript.

const year = document.querySelector("#year");
if (year) year.textContent = String(new Date().getFullYear());

// Keep the current section discoverable without changing the URL or
// interfering with keyboard focus or native anchor navigation.
const navigation = document.querySelector(".site-nav");
const sectionLinks = [...(navigation?.querySelectorAll('a[href^="#"]') ?? [])];
const targets = sectionLinks
  .map((link) => ({ link, target: document.querySelector(link.getAttribute("href")) }))
  .filter(({ target }) => target);

if ("IntersectionObserver" in window && targets.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        for (const { link, target } of targets) {
          if (target === entry.target) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        }
      }
    },
    { rootMargin: "-12% 0px -70% 0px" },
  );
  targets.forEach(({ target }) => observer.observe(target));
}

// Deep links should reveal collapsed resume content before scrolling to it.
// Native details/summary handles all toggle interaction and keyboard input.
function revealResumeHash() {
  const hash = window.location.hash;
  if (!hash || hash.length < 2) return;
  const target = document.getElementById(decodeURIComponent(hash.slice(1)));
  if (!target) return;
  const disclosure = target.closest(".resume-disclosure") || target.querySelector(".resume-disclosure");
  if (disclosure) disclosure.open = true;
}

revealResumeHash();
window.addEventListener("hashchange", revealResumeHash);

// Progressive enhancement: filter the technical inventory without affecting core skills.
const skillFilters = [...document.querySelectorAll('[data-skill-filter]')];
const skillModules = [...document.querySelectorAll('[data-skill-category]')];
skillFilters.forEach(button => {
  button.addEventListener('click', () => {
    const category = button.dataset.skillFilter;
    skillFilters.forEach(filter => {
      const selected = filter === button;
      filter.setAttribute('aria-pressed', String(selected));
      filter.classList.toggle('is-active', selected);
    });
    skillModules.forEach(module => {
      module.hidden = category !== 'all' && module.dataset.skillCategory !== category;
    });
  });
});

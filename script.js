"use strict";
console.log("hi clair");
// The first iteration is intentionally progressive-enhancement friendly:
// navigation, project links, and the layout work without JavaScript.

const year = document.querySelector("#year");
if (year) year.textContent = String(new Date().getFullYear());

// Keep the current section discoverable without changing the URL or
// interfering with keyboard focus or native anchor navigation.
const navigation = document.querySelector(".site-nav");
const sectionLinks = [...(navigation?.querySelectorAll('a[href^="#"]') ?? [])];
const targets = sectionLinks
  .map((link) => ({
    link,
    target: document.querySelector(link.getAttribute("href")),
  }))
  .filter(({ target }) => target);

if ("IntersectionObserver" in window && targets.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        for (const { link, target } of targets) {
          if (target === entry.target)
            link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        }
      }
    },
    { rootMargin: "-12% 0px -70% 0px" },
  );
  targets.forEach(({ target }) => observer.observe(target));
}

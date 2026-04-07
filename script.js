// Theme — apply before paint to avoid flash
(function () {
  try {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") {
      document.documentElement.setAttribute("data-theme", saved);
    }
  } catch (_) {}
})();

function getTheme() {
  return document.documentElement.getAttribute("data-theme") ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
}

function setThemeIcon(theme) {
  const toggle = document.getElementById("theme-toggle");
  if (toggle) toggle.textContent = theme === "dark" ? "🌙" : "☀️";
}

document.addEventListener("DOMContentLoaded", function () {
  // Year
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Theme toggle
  setThemeIcon(getTheme());
  const toggle = document.getElementById("theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      const next = getTheme() === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (_) {}
      setThemeIcon(next);
    });
  }

  // Mobile nav
  const navToggle = document.querySelector(".nav-toggle");
  const navList = document.getElementById("site-nav");
  if (navToggle && navList) {
    navToggle.addEventListener("click", function () {
      const expanded = this.getAttribute("aria-expanded") === "true";
      this.setAttribute("aria-expanded", String(!expanded));
      navList.setAttribute("aria-expanded", String(!expanded));
    });

    // Close nav when a link is clicked
    navList.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        navToggle.setAttribute("aria-expanded", "false");
        navList.setAttribute("aria-expanded", "false");
      });
    });

    // Close nav when clicking outside
    document.addEventListener("click", function (e) {
      if (!navToggle.contains(e.target) && !navList.contains(e.target)) {
        navToggle.setAttribute("aria-expanded", "false");
        navList.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Scroll animations
  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
  );

  document.querySelectorAll(".fade-in").forEach(function (el) {
    observer.observe(el);
  });

  // Cycling eyebrow titles with typewriter effect
  const eyebrowTitles = [
    "Software Engineer",
    "AI Builder",
    "Full Stack Developer",
    "Solutions Architect",
    "Cloud Engineer",
  ];
  const eyebrowEl = document.querySelector(".eyebrow-text");
  if (eyebrowEl) {
    let current = 0;

    function typeText(text, onDone) {
      eyebrowEl.textContent = "";
      let i = 0;
      var t = setInterval(function () {
        eyebrowEl.textContent += text[i];
        i++;
        if (i >= text.length) {
          clearInterval(t);
          if (onDone) setTimeout(onDone, 2200);
        }
      }, 60);
    }

    function eraseText(onDone) {
      var t = setInterval(function () {
        var txt = eyebrowEl.textContent;
        if (txt.length === 0) {
          clearInterval(t);
          if (onDone) onDone();
        } else {
          eyebrowEl.textContent = txt.slice(0, -1);
        }
      }, 35);
    }

    function cycle() {
      eraseText(function () {
        current = (current + 1) % eyebrowTitles.length;
        typeText(eyebrowTitles[current], cycle);
      });
    }

    typeText(eyebrowTitles[current], cycle);
  }

  // Active nav link on scroll
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-list a");

  const sectionObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          navLinks.forEach(function (link) {
            link.classList.remove("active");
            if (link.getAttribute("href") === "#" + entry.target.id) {
              link.classList.add("active");
            }
          });
        }
      });
    },
    { threshold: 0.4 }
  );

  sections.forEach(function (section) {
    sectionObserver.observe(section);
  });
});

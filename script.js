const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

function getTheme() {
  return document.documentElement.getAttribute("data-theme") ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
}

// data-mode always reflects the resolved theme so CSS can swap the toggle icon
function syncThemeMode() {
  document.documentElement.setAttribute("data-mode", getTheme());
}

function toggleTheme() {
  const next = getTheme() === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  try { localStorage.setItem("theme", next); } catch (_) {}
  syncThemeMode();
  document.dispatchEvent(new CustomEvent("themechange"));
  return next;
}

let toastTimer;
function toast(message) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { el.classList.remove("show"); }, 2200);
}

function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand("copy"); } catch (_) {}
  ta.remove();
  return Promise.resolve();
}

syncThemeMode();

document.addEventListener("DOMContentLoaded", function () {
  // Year
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Theme toggle
  const themeBtn = document.getElementById("theme-toggle");
  if (themeBtn) themeBtn.addEventListener("click", toggleTheme);

  // Mobile nav
  const navToggle = document.querySelector(".nav-toggle");
  const navList = document.getElementById("site-nav");
  if (navToggle && navList) {
    const setNav = function (open) {
      navToggle.setAttribute("aria-expanded", String(open));
      navList.setAttribute("aria-expanded", String(open));
    };
    navToggle.addEventListener("click", function () {
      setNav(this.getAttribute("aria-expanded") !== "true");
    });
    navList.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () { setNav(false); });
    });
    document.addEventListener("click", function (e) {
      if (!navToggle.contains(e.target) && !navList.contains(e.target)) setNav(false);
    });
  }

  // Header background + scroll progress
  const header = document.querySelector(".site-header");
  const onScroll = function () {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    document.documentElement.style.setProperty("--progress", max > 0 ? String(window.scrollY / max) : "0");
    if (header) header.classList.toggle("scrolled", window.scrollY > 10);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Reveal on scroll (staggered via --delay)
  const revealObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const delay = parseFloat(getComputedStyle(el).getPropertyValue("--delay")) || 0;
        setTimeout(function () { el.classList.add("visible"); }, delay * 1000);
        revealObserver.unobserve(el);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  document.querySelectorAll(".reveal").forEach(function (el) {
    if (reduceMotion) el.classList.add("visible");
    else revealObserver.observe(el);
  });

  // Hero name: split into letters that pop on hover
  const nameEl = document.querySelector(".hero-name");
  if (nameEl) {
    const text = nameEl.textContent;
    nameEl.textContent = "";
    Array.from(text).forEach(function (ch, i, arr) {
      const span = document.createElement("span");
      span.className = ch === " " ? "char space" : "char";
      span.setAttribute("aria-hidden", "true");
      span.textContent = ch === " " ? " " : ch;
      span.style.setProperty("--bgx", (i / (arr.length - 1)) * 100 + "%");
      nameEl.appendChild(span);
    });
    const pop = function (span) {
      if (reduceMotion || span.classList.contains("pop")) return;
      span.classList.add("pop");
      span.addEventListener("animationend", function () { span.classList.remove("pop"); }, { once: true });
    };
    nameEl.addEventListener("pointerover", function (e) {
      if (e.target.classList && e.target.classList.contains("char")) pop(e.target);
    });
    // Little intro wave
    if (!reduceMotion) {
      nameEl.querySelectorAll(".char").forEach(function (span, i) {
        setTimeout(function () { pop(span); }, 500 + i * 60);
      });
    }
  }

  // Eyebrow: scramble between titles
  const eyebrowTitles = [
    "Software Engineer",
    "AI Builder",
    "Full Stack Developer",
    "Solutions Architect",
    "Cloud Engineer",
  ];
  const eyebrowEl = document.querySelector(".eyebrow-text");
  if (eyebrowEl && !reduceMotion) {
    const glyphs = "!<>-_\\/[]{}—=+*^?#01";
    let current = 0;
    const scrambleTo = function (target, done) {
      const from = eyebrowEl.textContent;
      const len = Math.max(from.length, target.length);
      const queue = [];
      for (let i = 0; i < len; i++) {
        const start = Math.floor(Math.random() * 14);
        queue.push({ from: from[i] || "", to: target[i] || "", start: start, end: start + 6 + Math.floor(Math.random() * 14) });
      }
      let frame = 0;
      const tick = function () {
        let out = "";
        let complete = 0;
        for (const q of queue) {
          if (frame >= q.end) { complete++; out += q.to; }
          else if (frame >= q.start) out += glyphs[Math.floor(Math.random() * glyphs.length)];
          else out += q.from;
        }
        eyebrowEl.textContent = out;
        if (complete === queue.length) { done(); return; }
        frame++;
        requestAnimationFrame(tick);
      };
      tick();
    };
    const cycle = function () {
      setTimeout(function () {
        current = (current + 1) % eyebrowTitles.length;
        scrambleTo(eyebrowTitles[current], cycle);
      }, 2400);
    };
    cycle();
  }

  // Active nav link on scroll
  const navLinks = document.querySelectorAll(".nav-list a");
  const sectionObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) {
          link.classList.toggle("active", link.getAttribute("href") === "#" + entry.target.id);
        });
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  document.querySelectorAll("section[id]").forEach(function (s) { sectionObserver.observe(s); });

  initConstellation();
  initPointerEffects();
  initFilters();
  initCopy();
  initTerminal();
  initPalette();
});

// Interactive particle field in the hero
function initConstellation() {
  const canvas = document.querySelector(".hero-canvas");
  const hero = document.querySelector(".hero");
  if (!canvas || !hero) return;
  const ctx = canvas.getContext("2d");
  let w = 0, h = 0, dpr = 1, particles = [], rgb = "167, 139, 250";
  let running = false, rafId = 0;
  const mouse = { x: -9999, y: -9999, active: false };

  const readColor = function () {
    rgb = getComputedStyle(document.documentElement).getPropertyValue("--particle").trim() || rgb;
  };

  const resize = function () {
    const rect = hero.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = rect.width;
    h = rect.height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(120, Math.floor((w * h) / 12000));
    particles = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.6,
      });
    }
  };

  const draw = function () {
    ctx.clearRect(0, 0, w, h);
    const linkDist = 120;
    const mouseDist = 170;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (!reduceMotion) {
        // Gentle pull toward the cursor
        if (mouse.active) {
          const dx = mouse.x - p.x, dy = mouse.y - p.y;
          const d = Math.hypot(dx, dy);
          if (d < mouseDist && d > 0.1) {
            p.vx += (dx / d) * 0.012;
            p.vy += (dy / d) * 0.012;
          }
        }
        p.vx *= 0.99;
        p.vy *= 0.99;
        const speed = Math.hypot(p.vx, p.vy);
        if (speed < 0.08) { p.vx += (Math.random() - 0.5) * 0.05; p.vy += (Math.random() - 0.5) * 0.05; }
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = w + 10; else if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10; else if (p.y > h + 10) p.y = -10;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(" + rgb + ", 0.7)";
      ctx.fill();

      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j];
        const dx = p.x - q.x, dy = p.y - q.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < linkDist * linkDist) {
          const a = 1 - Math.sqrt(d2) / linkDist;
          ctx.strokeStyle = "rgba(" + rgb + ", " + (a * 0.22).toFixed(3) + ")";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
      }

      if (mouse.active) {
        const d = Math.hypot(p.x - mouse.x, p.y - mouse.y);
        if (d < mouseDist) {
          ctx.strokeStyle = "rgba(" + rgb + ", " + ((1 - d / mouseDist) * 0.6).toFixed(3) + ")";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
    }
  };

  const loop = function () {
    draw();
    if (running) rafId = requestAnimationFrame(loop);
  };
  const start = function () {
    if (running || reduceMotion) return;
    running = true;
    rafId = requestAnimationFrame(loop);
  };
  const stop = function () {
    running = false;
    cancelAnimationFrame(rafId);
  };

  hero.addEventListener("pointermove", function (e) {
    const rect = hero.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.active = true;
    if (reduceMotion) draw();
  });
  hero.addEventListener("pointerleave", function () { mouse.active = false; });
  // Click to burst particles away
  hero.addEventListener("click", function (e) {
    if (e.target.closest("a, button")) return;
    const rect = hero.getBoundingClientRect();
    const cx = e.clientX - rect.left, cy = e.clientY - rect.top;
    particles.forEach(function (p) {
      const dx = p.x - cx, dy = p.y - cy;
      const d = Math.hypot(dx, dy) || 1;
      if (d < 260) {
        const f = (1 - d / 260) * 6;
        p.vx += (dx / d) * f;
        p.vy += (dy / d) * f;
      }
    });
  });

  let resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { resize(); if (!running) draw(); }, 150);
  });
  document.addEventListener("themechange", function () { readColor(); if (!running) draw(); });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop();
  });

  new IntersectionObserver(function (entries) {
    entries[0].isIntersecting && !document.hidden ? start() : stop();
  }).observe(hero);
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden && hero.getBoundingClientRect().bottom > 0) start();
  });

  readColor();
  resize();
  draw();
}

// Cursor glow, card spotlights, 3D tilt, magnetic buttons, profile parallax
function initPointerEffects() {
  if (!finePointer) return;
  const root = document.documentElement;
  let pending = null;

  document.addEventListener("pointermove", function (e) {
    document.body.classList.add("has-pointer");
    if (pending) return;
    pending = requestAnimationFrame(function () {
      pending = null;
      root.style.setProperty("--cx", e.clientX + "px");
      root.style.setProperty("--cy", e.clientY + "px");
    });
  }, { passive: true });
  document.addEventListener("pointerleave", function () {
    document.body.classList.remove("has-pointer");
  });

  document.querySelectorAll(".spot").forEach(function (el) {
    el.addEventListener("pointermove", function (e) {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", e.clientX - r.left + "px");
      el.style.setProperty("--my", e.clientY - r.top + "px");
    });
  });

  if (reduceMotion) return;

  document.querySelectorAll(".tilt").forEach(function (el) {
    const max = el.classList.contains("featured-card") ? 3 : 7;
    el.addEventListener("pointermove", function (e) {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.classList.add("tilting");
      el.style.setProperty("--ry", (px * max * 2).toFixed(2) + "deg");
      el.style.setProperty("--rx", (-py * max * 2).toFixed(2) + "deg");
    });
    el.addEventListener("pointerleave", function () {
      el.classList.remove("tilting");
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    });
  });

  document.querySelectorAll(".magnetic").forEach(function (el) {
    el.addEventListener("pointermove", function (e) {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      el.style.setProperty("--tx", (x * 0.25).toFixed(1) + "px");
      el.style.setProperty("--ty", (y * 0.35).toFixed(1) + "px");
    });
    el.addEventListener("pointerleave", function () {
      el.style.setProperty("--tx", "0px");
      el.style.setProperty("--ty", "0px");
    });
  });

  const profile = document.querySelector(".profile-wrap");
  const hero = document.querySelector(".hero");
  if (profile && hero) {
    hero.addEventListener("pointermove", function (e) {
      const px = e.clientX / window.innerWidth - 0.5;
      const py = e.clientY / window.innerHeight - 0.5;
      profile.style.setProperty("--rx", (px * 16).toFixed(2) + "deg");
      profile.style.setProperty("--ry", (-py * 16).toFixed(2) + "deg");
    });
    hero.addEventListener("pointerleave", function () {
      profile.style.setProperty("--rx", "0deg");
      profile.style.setProperty("--ry", "0deg");
    });
  }
}

function initFilters() {
  const buttons = document.querySelectorAll(".filter");
  const cards = document.querySelectorAll(".grid.projects .card");
  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      const f = btn.dataset.filter;
      buttons.forEach(function (b) {
        b.classList.toggle("active", b === btn);
        b.setAttribute("aria-pressed", String(b === btn));
      });
      let n = 0;
      cards.forEach(function (card) {
        const show = f === "all" || card.dataset.category === f;
        card.classList.toggle("hidden", !show);
        card.classList.remove("enter");
        if (show) {
          card.classList.add("visible");
          void card.offsetWidth; // restart animation
          card.style.setProperty("--stagger", n++ * 0.06 + "s");
          card.classList.add("enter");
        }
      });
    });
  });
}

function initCopy() {
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      copyText(btn.dataset.copy).then(function () {
        btn.textContent = "Copied!";
        btn.classList.add("copied");
        toast("Email copied to clipboard ✓");
        setTimeout(function () {
          btn.textContent = "Copy";
          btn.classList.remove("copied");
        }, 1800);
      });
    });
  });
}

const LINKS = {
  email: "mailto:joseidd@hotmail.com",
  github: "https://github.com/joseidd",
  linkedin: "https://www.linkedin.com/in/joseiduran/",
  resume: "./assets/Jose_Duran_Resume.pdf",
};

const PROJECTS = [
  { name: "Rivia", slug: "rivia", url: "https://riviard.com/", tag: "Full Stack" },
  { name: "AI Chat App", slug: "ai-chat", url: "https://my-first-ai-app-production.up.railway.app", tag: "Full Stack" },
  { name: "News Explorer", slug: "news-explorer", url: "https://joseidd-news-explorer.netlify.app/", tag: "Full Stack" },
  { name: "What to Wear", slug: "what-to-wear", url: "https://wtwrduran.netlify.app/", tag: "Full Stack" },
  { name: "Spots", slug: "spots", url: "https://joseidd.github.io/se_project_spots/", tag: "Frontend" },
  { name: "To-Do App", slug: "todo", url: "https://joseidd.github.io/se_project_todo-app/", tag: "Frontend" },
  { name: "Coffee Shop", slug: "coffee-shop", url: "https://joseidd.github.io/se_project_coffeeshop/", tag: "Frontend" },
];

function scrollToId(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
}

function initTerminal() {
  const form = document.getElementById("term-form");
  const input = document.getElementById("term-cmd");
  const out = document.getElementById("term-output");
  if (!form || !input || !out) return;
  const history = [];
  let hIndex = 0;

  const print = function (html, cls) {
    const p = document.createElement("p");
    if (cls) p.className = cls;
    p.innerHTML = html;
    out.appendChild(p);
  };
  const esc = function (s) {
    return s.replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  const open = function (url, label) {
    print("Opening " + label + "…", "term-muted");
    window.open(url, url.startsWith("mailto:") ? "_self" : "_blank", "noopener");
  };

  const commands = {
    help: function () {
      print(
        "Available commands:\n" +
        "  <b>whoami</b>      who is this guy?\n" +
        "  <b>skills</b>      tech I work with\n" +
        "  <b>projects</b>    list projects\n" +
        "  <b>open</b> &lt;name&gt; open a project, e.g. <b>open rivia</b>\n" +
        "  <b>email</b>       send me an email\n" +
        "  <b>github</b>      open GitHub\n" +
        "  <b>linkedin</b>    open LinkedIn\n" +
        "  <b>theme</b>       toggle light / dark\n" +
        "  <b>goto</b> &lt;section&gt; about · skills · projects · contact\n" +
        "  <b>clear</b>       clear the screen"
      );
    },
    whoami: function () {
      print("Jose Duran — software engineer. I build fast, clean, and scalable web experiences, from polished frontends to production-ready backends. Currently building <b>Rivia</b>.");
    },
    skills: function () {
      print(
        "<b>frontend</b>  React · TypeScript · JavaScript · HTML · CSS · Tailwind\n" +
        "<b>backend</b>   Node.js · Express · Python · PostgreSQL · MongoDB · MySQL\n" +
        "<b>cloud</b>     AWS · Google Cloud · Azure · GitHub · AI Integration · REST APIs"
      );
    },
    projects: function () {
      print(PROJECTS.map(function (p) {
        return "  <b>" + p.slug.padEnd(14) + "</b>" + p.name + " <span class=\"term-muted\">(" + p.tag + ")</span>";
      }).join("\n") + "\n\nType <b>open &lt;name&gt;</b> to visit one.");
    },
    open: function (arg) {
      if (!arg) { print("Usage: open &lt;name&gt; — try <b>projects</b> for the list.", "term-err"); return; }
      const q = arg.toLowerCase();
      const p = PROJECTS.find(function (x) { return x.slug === q || x.name.toLowerCase().includes(q); });
      if (p) open(p.url, p.name);
      else print("No project called '" + esc(arg) + "'. Try <b>projects</b>.", "term-err");
    },
    email: function () { open(LINKS.email, "your mail app"); },
    github: function () { open(LINKS.github, "GitHub"); },
    linkedin: function () { open(LINKS.linkedin, "LinkedIn"); },
    resume: function () { open(LINKS.resume, "resume"); },
    theme: function () { print("Switched to " + toggleTheme() + " mode.", "term-muted"); },
    goto: function (arg) {
      const id = (arg || "").toLowerCase();
      if (["about", "skills", "projects", "contact"].includes(id)) { scrollToId(id); print("→ " + id, "term-muted"); }
      else print("Usage: goto about|skills|projects|contact", "term-err");
    },
    ls: function () { print("about/  skills/  projects/  contact/  resume.pdf"); },
    clear: function () { out.innerHTML = ""; },
    sudo: function () { print("Nice try. 😄 But you can <b>hire</b> me instead.", "term-err"); },
    hire: function () {
      print("Great choice! Opening your mail app… 🎉");
      window.open(LINKS.email + "?subject=" + encodeURIComponent("Let's work together"), "_self");
    },
    hello: function () { print("Hey there 👋 Type <b>help</b> to get started."); },
  };
  commands.hi = commands.hello;
  commands.contact = commands.email;
  commands.cd = commands.goto;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const raw = input.value.trim();
    input.value = "";
    if (!raw) return;
    history.push(raw);
    hIndex = history.length;
    print('<span>➜</span> ' + esc(raw), "term-cmd-line");
    const parts = raw.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(" ");
    if (commands[cmd]) commands[cmd](arg);
    else print("command not found: " + esc(cmd) + " — type <b>help</b>", "term-err");
    out.scrollTop = out.scrollHeight;
  });

  input.addEventListener("keydown", function (e) {
    if (e.key === "ArrowUp" && hIndex > 0) {
      e.preventDefault();
      input.value = history[--hIndex];
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      hIndex = Math.min(history.length, hIndex + 1);
      input.value = history[hIndex] || "";
    } else if (e.key === "Tab") {
      e.preventDefault();
      const v = input.value.toLowerCase();
      if (!v) return;
      const match = Object.keys(commands).find(function (c) { return c.startsWith(v); });
      if (match) input.value = match + " ";
    }
  });

  // Clicking anywhere in the terminal focuses the prompt
  const term = form.closest(".terminal");
  if (term) term.addEventListener("click", function (e) {
    if (!e.target.closest("a") && !window.getSelection().toString()) input.focus({ preventScroll: true });
  });
}

function initPalette() {
  const palette = document.getElementById("palette");
  const input = document.getElementById("palette-input");
  const list = document.getElementById("palette-list");
  const openBtn = document.getElementById("palette-open");
  if (!palette || !input || !list) return;

  const items = [
    { group: "Navigate", icon: "👋", label: "About", run: function () { scrollToId("about"); } },
    { group: "Navigate", icon: "🛠", label: "Skills", run: function () { scrollToId("skills"); } },
    { group: "Navigate", icon: "🚀", label: "Projects", run: function () { scrollToId("projects"); } },
    { group: "Navigate", icon: "✉️", label: "Contact", run: function () { scrollToId("contact"); } },
    { group: "Actions", icon: "🌓", label: "Toggle theme", hint: "T", run: function () { toast("Switched to " + toggleTheme() + " mode"); } },
    { group: "Actions", icon: "📋", label: "Copy email address", run: function () { copyText("joseidd@hotmail.com").then(function () { toast("Email copied to clipboard ✓"); }); } },
    { group: "Actions", icon: "⌨️", label: "Open the terminal", run: function () { scrollToId("contact"); setTimeout(function () { const t = document.getElementById("term-cmd"); if (t) t.focus({ preventScroll: true }); }, 600); } },
    { group: "Links", icon: "🐙", label: "GitHub", hint: "↗", run: function () { window.open(LINKS.github, "_blank", "noopener"); } },
    { group: "Links", icon: "💼", label: "LinkedIn", hint: "↗", run: function () { window.open(LINKS.linkedin, "_blank", "noopener"); } },
    { group: "Links", icon: "📧", label: "Send an email", run: function () { window.location.href = LINKS.email; } },
  ].concat(PROJECTS.map(function (p) {
    return { group: "Projects", icon: "◆", label: p.name, hint: p.tag, run: function () { window.open(p.url, "_blank", "noopener"); } };
  }));

  let filtered = items;
  let active = 0;
  let lastFocus = null;

  const render = function () {
    list.innerHTML = "";
    if (!filtered.length) {
      list.innerHTML = '<li class="palette-empty">No results. Try "projects" or "theme".</li>';
      return;
    }
    let group = "";
    filtered.forEach(function (item, i) {
      if (item.group !== group) {
        group = item.group;
        const g = document.createElement("li");
        g.className = "palette-group";
        g.setAttribute("role", "presentation");
        g.textContent = group;
        list.appendChild(g);
      }
      const li = document.createElement("li");
      li.className = "palette-item" + (i === active ? " active" : "");
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", String(i === active));
      li.dataset.index = String(i);
      li.innerHTML = '<span class="pi-icon" aria-hidden="true"></span><span class="pi-label"></span>' +
        (item.hint ? '<span class="pi-hint"></span>' : "");
      li.querySelector(".pi-icon").textContent = item.icon;
      li.querySelector(".pi-label").textContent = item.label;
      if (item.hint) li.querySelector(".pi-hint").textContent = item.hint;
      list.appendChild(li);
    });
    const el = list.querySelector(".palette-item.active");
    if (el) el.scrollIntoView({ block: "nearest" });
  };

  const openPalette = function () {
    lastFocus = document.activeElement;
    palette.hidden = false;
    input.value = "";
    filtered = items;
    active = 0;
    render();
    input.focus();
    document.body.style.overflow = "hidden";
  };
  const closePalette = function () {
    palette.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  };
  const choose = function (i) {
    const item = filtered[i];
    if (!item) return;
    closePalette();
    item.run();
  };

  input.addEventListener("input", function () {
    const q = input.value.trim().toLowerCase();
    filtered = items.filter(function (it) {
      return (it.label + " " + it.group + " " + (it.hint || "")).toLowerCase().includes(q);
    });
    active = 0;
    render();
  });
  input.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown") { e.preventDefault(); active = (active + 1) % Math.max(filtered.length, 1); render(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); active = (active - 1 + filtered.length) % Math.max(filtered.length, 1); render(); }
    else if (e.key === "Enter") { e.preventDefault(); choose(active); }
    else if (e.key === "Tab") { e.preventDefault(); }
  });
  list.addEventListener("click", function (e) {
    const li = e.target.closest(".palette-item");
    if (li) choose(Number(li.dataset.index));
  });
  list.addEventListener("pointermove", function (e) {
    const li = e.target.closest(".palette-item");
    if (li && Number(li.dataset.index) !== active) { active = Number(li.dataset.index); render(); }
  });
  palette.addEventListener("click", function (e) {
    if (e.target.hasAttribute("data-close")) closePalette();
  });
  if (openBtn) openBtn.addEventListener("click", openPalette);

  document.addEventListener("keydown", function (e) {
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      palette.hidden ? openPalette() : closePalette();
    } else if (e.key === "Escape" && !palette.hidden) {
      closePalette();
    } else if (!typing && palette.hidden && e.key === "/") {
      e.preventDefault();
      openPalette();
    } else if (!typing && palette.hidden && e.key.toLowerCase() === "t" && !e.metaKey && !e.ctrlKey && !e.altKey) {
      toast("Switched to " + toggleTheme() + " mode");
    }
  });

  // Show the right modifier key
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  if (!isMac) document.querySelectorAll(".kbd-hint, .hero-hint kbd").forEach(function (k) { k.textContent = "Ctrl K"; });
}

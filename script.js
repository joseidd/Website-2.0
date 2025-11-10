// Theme persistence
(function () {
	try {
		const saved = localStorage.getItem("theme");
		if (saved === "light" || saved === "dark") {
			document.documentElement.setAttribute("data-theme", saved);
		}
	} catch (_) {}
})();

// Update year
document.addEventListener("DOMContentLoaded", function () {
	const yearEl = document.getElementById("year");
	if (yearEl) yearEl.textContent = String(new Date().getFullYear());

	// Theme toggle
	const toggle = document.getElementById("theme-toggle");
	if (toggle) {
		toggle.addEventListener("click", function () {
			const current = document.documentElement.getAttribute("data-theme");
			const next = current === "light" ? "dark" : "light";
			document.documentElement.setAttribute("data-theme", next);
			try { localStorage.setItem("theme", next); } catch (_) {}
			toggle.textContent = next === "dark" ? "🌙" : "☀️";
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
	}
});



# Jose Duran — Portfolio Website

Personal portfolio site built with plain HTML, CSS, and JavaScript. No frameworks, no build step.

## Features

- Interactive particle field in the hero (follows your cursor, click to scatter)
- Hover-reactive gradient name, text-scramble role cycler, orbiting tech chips
- Cursor spotlight, 3D tilt cards, magnetic buttons, scroll progress bar
- Project filters (All / Full Stack / Frontend)
- Working mini terminal in the Contact section (type `help`)
- Command palette — `⌘K` / `Ctrl K` or `/` to jump anywhere, `T` toggles theme
- Light / dark theme with localStorage persistence
- Responsive, and respects `prefers-reduced-motion`

## Structure

```
├── index.html      # Main page
├── styles.css      # All styles + CSS variables for theming
├── script.js       # Theme toggle, mobile nav, scroll animations
├── assets/         # Images
└── public/         # Icons
```

## Run locally

No install needed. From the project folder run:

```bash
bun run dev
```

Then visit `http://localhost:3000`.

## Deploy

Hosted via GitHub Pages at [joseidd.github.io/Website-2.0](https://joseidd.github.io/Website-2.0)

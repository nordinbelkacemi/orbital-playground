# Orbital Playground

[![CI](https://github.com/nordinbelkacemi/orbital-playground/actions/workflows/deploy.yml/badge.svg)](https://github.com/nordinbelkacemi/orbital-playground/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![GitHub Pages](https://img.shields.io/badge/demo-live-brightgreen)](https://nordinbelkacemi.github.io/orbital-playground/)

An interactive N-body gravity simulator. Place stars, planets, and moons, fling them into orbit, and watch orbital mechanics unfold in real time.

![Orbital Playground](screenshot.png)

## Try It

**[Live Demo](https://nordinbelkacemi.github.io/orbital-playground/)** — runs entirely in your browser.

- **Click** to place a body
- **Drag** to set its velocity
- **Scroll** to zoom, **middle-click + drag** to pan
- **1/2/3** to switch between planet/star/moon
- **Space** to pause, **C** to clear

## Run Locally

```bash
git clone https://github.com/nordinbelkacemi/orbital-playground.git
cd orbital-playground
npm install
npm run dev        # http://localhost:3000
```

## Test

```bash
npm test           # run once
npm run test:watch # watch mode
```

## Architecture

Vanilla JavaScript with ES modules. No frameworks, no build step.

```
src/
  js/
    core/
      Vector2.js      # Immutable 2D vector math
      Body.js          # Celestial body entity
      Simulation.js    # N-body physics (Velocity Verlet)
    rendering/
      Camera.js        # Viewport transforms and zoom
      Renderer.js      # Canvas 2D drawing
    input/
      InputHandler.js  # Mouse/touch/keyboard abstraction
    config.js          # All tuneable constants
    app.js             # Composition root
  css/
    main.css           # Design tokens and UI styles
  index.html
```

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for design principles and data flow.

## License

MIT

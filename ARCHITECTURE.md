# Architecture

## Overview

Orbital Playground is a browser-based N-body gravity simulator built with
vanilla JavaScript and HTML5 Canvas. It uses ES modules for clean dependency
management with zero build tooling.

## Design Principles

- **Single Responsibility** — each module has one well-defined purpose.
- **Dependency Injection** — modules receive their dependencies, never reach
  for globals.
- **Configuration over Magic Numbers** — all tuneable constants live in
  `config.js`.
- **Immutable Value Objects** — `Vector2` returns new instances rather than
  mutating in place, keeping physics calculations predictable.
- **Composition over Inheritance** — favour small, composable units.

## Module Map

```
src/
├── index.html              Entry point
├── css/
│   └── main.css            Design tokens, base styles, component styles
└── js/
    ├── app.js              Bootstrap — wires modules, owns the game loop
    ├── config.js           Constants, body presets, color palettes
    ├── core/
    │   ├── Vector2.js      Immutable 2D vector math
    │   ├── Body.js         Celestial body entity
    │   └── Simulation.js   N-body physics engine (Velocity Verlet)
    ├── rendering/
    │   ├── Camera.js       Viewport ↔ world coordinate transforms
    │   └── Renderer.js     Canvas drawing (bodies, trails, effects)
    └── input/
        └── InputHandler.js Mouse / touch / keyboard event handling

tests/
├── Vector2.test.js         Vector math unit tests
└── Simulation.test.js      Physics engine integration tests
```

## Data Flow

```
InputHandler  ──▶  App  ──▶  Simulation.step()
                    │              │
                    │              ▼
                    └──▶  Renderer.render(Simulation, Camera)
                              │
                              ▼
                           Canvas
```

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| ES modules, no bundler | Zero config, deploys as-is to GitHub Pages |
| Velocity Verlet integration | Energy-conserving, stable for orbital sims |
| Sub-stepping | Multiple physics steps per frame for accuracy |
| Canvas 2D (not WebGL) | Simpler, sufficient for ≤100 bodies, wide support |
| Immutable Vector2 | Prevents subtle mutation bugs in physics code |

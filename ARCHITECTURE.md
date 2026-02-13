# Architecture

## Design Principles

1. **ES modules, no bundler** — each file is a standalone module loaded via `<script type="module">` and `importmap`.
2. **Single responsibility** — every module does one thing.
3. **Dependency injection** — `app.js` is the only file that knows about everything else. All other modules are decoupled.
4. **Immutable physics** — `Vector3` operations always return new instances. No mutation, no aliasing bugs.
5. **Read-only rendering** — the renderer reads simulation state but never writes to it.
6. **Zero build step** — Three.js loaded from CDN via import map.

## Module Map

```
src/js/
  app.js                      ← Composition root (wires everything)
  config.js                   ← All tuneable constants
  core/
    Vector3.js                ← Immutable 3D vector math
    Body.js                   ← Celestial body data (pos, vel, mass, trail)
    Simulation.js             ← Velocity Verlet N-body integrator
  rendering/
    Renderer3D.js             ← Three.js scene, camera, post-processing
```

## Data Flow

```
User Input (pointer events)
  → app.js (raycast to XZ plane → sim.addBody) 
  → Simulation.step() (Verlet physics, collision resolution)
  → Renderer3D.render() (sync Three.js meshes/trails to body state)
  → EffectComposer → Bloom → screen
```

## Key Decisions

### Three.js via Import Map
Three.js is loaded from `cdn.jsdelivr.net` using a `<script type="importmap">`. This means:
- Zero install / zero build for deployment
- Works on GitHub Pages out of the box
- Standard `import * as THREE from 'three'` syntax

### Velocity Verlet Integrator
Chosen over simple Euler because it's symplectic — it conserves energy, so orbits stay stable over thousands of frames. Uses configurable substeps per frame for close-encounter accuracy.

### Immutable Vector3
All vector operations return new `Vector3` instances. This prevents subtle bugs where two bodies share a velocity reference and one mutation affects both. The GC cost is negligible for the body counts we handle.

### Bloom Post-processing
The rendering pipeline uses Three.js `EffectComposer` with `UnrealBloomPass`. Stars emit light via `PointLight` and their emissive materials trigger the bloom threshold, creating a natural volumetric glow without any sprite tricks.

### XZ Plane Placement
Body placement raycasts from the camera through the mouse position to the y=0 plane. This keeps orbits viewable from the default 3D camera angle while allowing the camera to orbit freely around the system.

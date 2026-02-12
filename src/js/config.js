/**
 * @module config
 * Central configuration for all tuneable constants, body presets, and color
 * palettes. Pulling every magic number into one file makes the simulation
 * easy to balance and keeps the rest of the codebase declarative.
 */

/** Physics defaults. */
export const PHYSICS = Object.freeze({
    G: 800,
    SOFTENING: 8,
    SUBSTEPS: 6,
    MAX_FRAME_DT: 0.05,
    DEFAULT_TIME_SCALE: 2,
});

/** Body type definitions — mass, radius, and base visual style. */
export const BODY_TYPES = Object.freeze({
    star: { mass: 3000, radius: 22 },
    planet: { mass: 400, radius: 10 },
    moon: { mass: 30, radius: 5 },
});

/**
 * Color palettes per body type. Each entry defines the fill color, glow
 * rgba, and a trail color template where `ALPHA` is replaced at render time.
 */
export const PALETTES = Object.freeze({
    star: [
        { color: '#ffb347', glow: 'rgba(255,179,71,0.4)', trail: 'rgba(255,179,71,ALPHA)' },
        { color: '#ffe066', glow: 'rgba(255,224,102,0.4)', trail: 'rgba(255,224,102,ALPHA)' },
        { color: '#ff6b6b', glow: 'rgba(255,107,107,0.4)', trail: 'rgba(255,107,107,ALPHA)' },
        { color: '#c4b5fd', glow: 'rgba(196,181,253,0.4)', trail: 'rgba(196,181,253,ALPHA)' },
    ],
    planet: [
        { color: '#4e8cff', glow: 'rgba(78,140,255,0.35)', trail: 'rgba(78,140,255,ALPHA)' },
        { color: '#9b6dff', glow: 'rgba(155,109,255,0.35)', trail: 'rgba(155,109,255,ALPHA)' },
        { color: '#42d4ff', glow: 'rgba(66,212,255,0.35)', trail: 'rgba(66,212,255,ALPHA)' },
        { color: '#ff5ea0', glow: 'rgba(255,94,160,0.35)', trail: 'rgba(255,94,160,ALPHA)' },
        { color: '#50e89e', glow: 'rgba(80,232,158,0.35)', trail: 'rgba(80,232,158,ALPHA)' },
        { color: '#ff8c42', glow: 'rgba(255,140,66,0.35)', trail: 'rgba(255,140,66,ALPHA)' },
    ],
    moon: [
        { color: '#a0a8c0', glow: 'rgba(160,168,192,0.3)', trail: 'rgba(160,168,192,ALPHA)' },
        { color: '#d4c5a9', glow: 'rgba(212,197,169,0.3)', trail: 'rgba(212,197,169,ALPHA)' },
    ],
});

/** Rendering constants. */
export const RENDERING = Object.freeze({
    MAX_TRAIL_LENGTH: 200,
    BG_STAR_COUNT: 400,
    BG_STAR_PARALLAX: 0.3,
    SPAWN_ANIM_FRAMES: 15,
});

/** Input tuning. */
export const INPUT = Object.freeze({
    DRAG_VELOCITY_SCALE: 0.04,
    MAX_LAUNCH_SPEED: 150,
    ZOOM_IN_FACTOR: 1.08,
    ZOOM_OUT_FACTOR: 0.92,
    MIN_ZOOM: 0.15,
    MAX_ZOOM: 5,
});

/**
 * simulation.js — N-body gravitational physics engine
 *
 * Uses Velocity Verlet integration for energy-conserving,
 * stable orbital mechanics.
 */

const BODY_PRESETS = {
    star: { mass: 3000, radius: 22, color: '#ffb347', glow: 'rgba(255,179,71,0.4)', trailColor: 'rgba(255,179,71,0.TRAIL)' },
    planet: { mass: 400, radius: 10, color: '#4e8cff', glow: 'rgba(78,140,255,0.35)', trailColor: 'rgba(78,140,255,0.TRAIL)' },
    moon: { mass: 30, radius: 5, color: '#a0a8c0', glow: 'rgba(160,168,192,0.3)', trailColor: 'rgba(160,168,192,0.TRAIL)' },
};

/* Palette variations so not all planets look identical */
const PLANET_COLORS = [
    { color: '#4e8cff', glow: 'rgba(78,140,255,0.35)', trailColor: 'rgba(78,140,255,0.TRAIL)' },
    { color: '#9b6dff', glow: 'rgba(155,109,255,0.35)', trailColor: 'rgba(155,109,255,0.TRAIL)' },
    { color: '#42d4ff', glow: 'rgba(66,212,255,0.35)', trailColor: 'rgba(66,212,255,0.TRAIL)' },
    { color: '#ff5ea0', glow: 'rgba(255,94,160,0.35)', trailColor: 'rgba(255,94,160,0.TRAIL)' },
    { color: '#50e89e', glow: 'rgba(80,232,158,0.35)', trailColor: 'rgba(80,232,158,0.TRAIL)' },
    { color: '#ff8c42', glow: 'rgba(255,140,66,0.35)', trailColor: 'rgba(255,140,66,0.TRAIL)' },
];

const STAR_COLORS = [
    { color: '#ffb347', glow: 'rgba(255,179,71,0.4)', trailColor: 'rgba(255,179,71,0.TRAIL)' },
    { color: '#ffe066', glow: 'rgba(255,224,102,0.4)', trailColor: 'rgba(255,224,102,0.TRAIL)' },
    { color: '#ff6b6b', glow: 'rgba(255,107,107,0.4)', trailColor: 'rgba(255,107,107,0.TRAIL)' },
    { color: '#c4b5fd', glow: 'rgba(196,181,253,0.4)', trailColor: 'rgba(196,181,253,0.TRAIL)' },
];

const MOON_COLORS = [
    { color: '#a0a8c0', glow: 'rgba(160,168,192,0.3)', trailColor: 'rgba(160,168,192,0.TRAIL)' },
    { color: '#d4c5a9', glow: 'rgba(212,197,169,0.3)', trailColor: 'rgba(212,197,169,0.TRAIL)' },
];

let _planetIdx = 0;
let _starIdx = 0;
let _moonIdx = 0;

class Body {
    constructor(type, x, y, vx = 0, vy = 0) {
        const preset = BODY_PRESETS[type];

        /* Pick a color variation */
        let palette;
        if (type === 'planet') {
            palette = PLANET_COLORS[_planetIdx % PLANET_COLORS.length];
            _planetIdx++;
        } else if (type === 'star') {
            palette = STAR_COLORS[_starIdx % STAR_COLORS.length];
            _starIdx++;
        } else {
            palette = MOON_COLORS[_moonIdx % MOON_COLORS.length];
            _moonIdx++;
        }

        this.type = type;
        this.mass = preset.mass;
        this.radius = preset.radius;
        this.color = palette.color;
        this.glow = palette.glow;
        this.trailColor = palette.trailColor;

        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.ax = 0;
        this.ay = 0;

        /* Trail: ring buffer of positions */
        this.trail = [];
        this.maxTrail = 200;

        this.alive = true;
        this.age = 0; /* frames since creation */
    }
}

class Simulation {
    constructor() {
        this.bodies = [];
        this.G = 800;         /* gravitational constant — tuneable */
        this.softeningFactor = 8; /* prevents singularity when bodies are very close */
        this.elapsed = 0;
        this.paused = false;
        this.maxTrailLength = 200;
        this.substeps = 4;   /* integration substeps per frame for accuracy */
    }

    addBody(type, x, y, vx = 0, vy = 0) {
        const body = new Body(type, x, y, vx, vy);
        body.maxTrail = this.maxTrailLength;
        this.bodies.push(body);
        return body;
    }

    clear() {
        this.bodies = [];
        this.elapsed = 0;
    }

    /**
     * Calculate the circular orbital velocity for a body at distance `r`
     * from a central mass `M`: v = sqrt(G * M / r)
     */
    orbitalSpeed(centralMass, distance) {
        return Math.sqrt(this.G * centralMass / distance);
    }

    /** Create a demo solar system with stable orbits */
    createDemoScene() {
        this.clear();

        /* Central star at origin */
        this.addBody('star', 0, 0, 0, 0);

        /* Planets at various distances with correct circular velocities */
        const starMass = BODY_PRESETS.star.mass;
        const orbits = [
            { type: 'planet', distance: 120, angle: 0 },
            { type: 'planet', distance: 200, angle: Math.PI * 0.7 },
            { type: 'planet', distance: 310, angle: Math.PI * 1.3 },
            { type: 'moon', distance: 420, angle: Math.PI * 0.3 },
        ];

        for (const orbit of orbits) {
            const speed = this.orbitalSpeed(starMass, orbit.distance);
            /* Position on circle */
            const x = Math.cos(orbit.angle) * orbit.distance;
            const y = Math.sin(orbit.angle) * orbit.distance;
            /* Velocity perpendicular to radius (tangent) for circular orbit */
            const vx = -Math.sin(orbit.angle) * speed;
            const vy = Math.cos(orbit.angle) * speed;
            this.addBody(orbit.type, x, y, vx, vy);
        }
    }

    /** Compute gravitational accelerations for all bodies */
    computeAccelerations() {
        const n = this.bodies.length;
        /* Reset accelerations */
        for (let i = 0; i < n; i++) {
            this.bodies[i].ax = 0;
            this.bodies[i].ay = 0;
        }

        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const a = this.bodies[i];
                const b = this.bodies[j];

                const dx = b.x - a.x;
                const dy = b.y - a.y;
                const distSq = dx * dx + dy * dy + this.softeningFactor * this.softeningFactor;
                const dist = Math.sqrt(distSq);
                const force = this.G * a.mass * b.mass / distSq;

                const fx = force * dx / dist;
                const fy = force * dy / dist;

                a.ax += fx / a.mass;
                a.ay += fy / a.mass;
                b.ax -= fx / b.mass;
                b.ay -= fy / b.mass;
            }
        }
    }

    /** Handle collisions — merge bodies */
    handleCollisions() {
        const n = this.bodies.length;
        for (let i = 0; i < n; i++) {
            if (!this.bodies[i].alive) continue;
            for (let j = i + 1; j < n; j++) {
                if (!this.bodies[j].alive) continue;

                const a = this.bodies[i];
                const b = this.bodies[j];
                const dx = b.x - a.x;
                const dy = b.y - a.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const minDist = a.radius + b.radius;

                if (dist < minDist * 0.6) {
                    /* Merge: bigger absorbs smaller */
                    const [big, small] = a.mass >= b.mass ? [a, b] : [b, a];
                    const totalMass = big.mass + small.mass;

                    /* Conservation of momentum */
                    big.vx = (big.mass * big.vx + small.mass * small.vx) / totalMass;
                    big.vy = (big.mass * big.vy + small.mass * small.vy) / totalMass;

                    /* Weighted position */
                    big.x = (big.mass * big.x + small.mass * small.x) / totalMass;
                    big.y = (big.mass * big.y + small.mass * small.y) / totalMass;

                    big.mass = totalMass;
                    /* Grow radius proportional to cube root of mass ratio */
                    big.radius = big.radius * Math.pow(totalMass / (totalMass - small.mass), 1 / 3);

                    /* Promote to star if massive enough */
                    if (big.type !== 'star' && big.mass > 2000) {
                        big.type = 'star';
                        big.color = '#ffb347';
                        big.glow = 'rgba(255,179,71,0.4)';
                        big.trailColor = 'rgba(255,179,71,0.TRAIL)';
                    }

                    small.alive = false;
                }
            }
        }

        /* Remove dead bodies */
        this.bodies = this.bodies.filter(b => b.alive);
    }

    /**
     * Advance simulation using Velocity Verlet integration.
     * @param {number} frameDt — real elapsed seconds since last frame
     * @param {number} timeScale — user-controlled speed multiplier
     */
    step(frameDt, timeScale = 1) {
        if (this.paused) return;

        /* Clamp frameDt to avoid spiral-of-death when tab is inactive */
        const clampedDt = Math.min(frameDt, 0.05);
        const totalDt = clampedDt * timeScale;
        const subDt = totalDt / this.substeps;

        for (let s = 0; s < this.substeps; s++) {
            /* 1. Half-step velocity using current acceleration */
            for (const body of this.bodies) {
                body.vx += 0.5 * body.ax * subDt;
                body.vy += 0.5 * body.ay * subDt;
            }

            /* 2. Full-step position */
            for (const body of this.bodies) {
                body.x += body.vx * subDt;
                body.y += body.vy * subDt;
            }

            /* 3. Compute new accelerations */
            this.computeAccelerations();

            /* 4. Half-step velocity with new acceleration */
            for (const body of this.bodies) {
                body.vx += 0.5 * body.ax * subDt;
                body.vy += 0.5 * body.ay * subDt;
            }
        }

        /* Record trails (once per frame, not per substep) */
        for (const body of this.bodies) {
            body.trail.push({ x: body.x, y: body.y });
            if (body.trail.length > body.maxTrail) {
                body.trail.shift();
            }
            body.age++;
        }

        /* Handle collisions */
        this.handleCollisions();

        this.elapsed += totalDt;
    }
}

/* Export for other modules */
window.Simulation = Simulation;
window.BODY_PRESETS = BODY_PRESETS;

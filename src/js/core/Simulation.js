/**
 * @module Simulation
 * N-body gravitational physics engine using Velocity Verlet integration.
 *
 * Verlet is chosen over Euler because it conserves energy — orbits stay
 * stable over thousands of frames instead of spiralling outward.
 *
 * The engine uses sub-stepping: each visual frame is divided into multiple
 * smaller physics steps, which dramatically improves accuracy for close
 * encounters and fast-moving bodies.
 */
import Vector2 from './Vector2.js';
import Body from './Body.js';
import { PHYSICS, BODY_TYPES } from '../config.js';

export default class Simulation {
    /**
     * @param {object} [options]
     * @param {number} [options.G]          - Gravitational constant.
     * @param {number} [options.softening]  - Softening factor to prevent singularities.
     * @param {number} [options.substeps]   - Integration substeps per frame.
     */
    constructor(options = {}) {
        /** @type {Body[]} */
        this.bodies = [];

        /** @type {number} Gravitational constant. */
        this.G = options.G ?? PHYSICS.G;

        /** @type {number} Softening prevents infinite force at r→0. */
        this.softening = options.softening ?? PHYSICS.SOFTENING;

        /** @type {number} Substeps per frame for integration accuracy. */
        this.substeps = options.substeps ?? PHYSICS.SUBSTEPS;

        /** @type {number} Total elapsed simulation time (seconds). */
        this.elapsed = 0;

        /** @type {boolean} */
        this.paused = false;
    }

    /* ── Public API ── */

    /**
     * Add a body to the simulation.
     * @param {string}  type     - 'star' | 'planet' | 'moon'
     * @param {Vector2} position
     * @param {Vector2} [velocity]
     * @returns {Body} The created body.
     */
    addBody(type, position, velocity = Vector2.zero()) {
        const body = new Body(type, position, velocity);
        this.bodies.push(body);
        return body;
    }

    /** Remove all bodies and reset the clock. */
    clear() {
        this.bodies = [];
        this.elapsed = 0;
    }

    /**
     * Circular orbital speed for a body at distance `r` from a central mass.
     * Derived from v = √(G·M/r).
     * @param {number} centralMass
     * @param {number} distance
     * @returns {number}
     */
    orbitalSpeed(centralMass, distance) {
        return Math.sqrt(this.G * centralMass / distance);
    }

    /**
     * Spawn a demo solar system with analytically correct circular orbits.
     */
    createDemoScene() {
        this.clear();
        this.addBody('star', new Vector2(0, 0));

        const M = BODY_TYPES.star.mass;
        const orbits = [
            { type: 'planet', r: 120, angle: 0 },
            { type: 'planet', r: 200, angle: Math.PI * 0.7 },
            { type: 'planet', r: 310, angle: Math.PI * 1.3 },
            { type: 'moon', r: 420, angle: Math.PI * 0.3 },
        ];

        for (const { type, r, angle } of orbits) {
            const speed = this.orbitalSpeed(M, r);
            const pos = new Vector2(Math.cos(angle) * r, Math.sin(angle) * r);
            const vel = new Vector2(-Math.sin(angle) * speed, Math.cos(angle) * speed);
            this.addBody(type, pos, vel);
        }
    }

    /**
     * Advance the simulation by one visual frame.
     * @param {number} frameDt   - Real seconds elapsed since the last frame.
     * @param {number} timeScale - User-controlled speed multiplier.
     */
    step(frameDt, timeScale = 1) {
        if (this.paused) return;

        const dt = Math.min(frameDt, PHYSICS.MAX_FRAME_DT) * timeScale;
        const subDt = dt / this.substeps;

        for (let s = 0; s < this.substeps; s++) {
            this._integrateVerlet(subDt);
        }

        for (const body of this.bodies) {
            body.recordTrail();
            body.age++;
        }

        this._resolveCollisions();
        this.elapsed += dt;
    }

    /* ── Private ── */

    /**
     * One Velocity Verlet integration step.
     * @param {number} dt
     */
    _integrateVerlet(dt) {
        /* Half-step velocity */
        for (const b of this.bodies) {
            b.vel = b.vel.add(b.acc.scale(0.5 * dt));
        }

        /* Full-step position */
        for (const b of this.bodies) {
            b.pos = b.pos.add(b.vel.scale(dt));
        }

        /* Recompute accelerations */
        this._computeAccelerations();

        /* Half-step velocity with new accelerations */
        for (const b of this.bodies) {
            b.vel = b.vel.add(b.acc.scale(0.5 * dt));
        }
    }

    /** Compute gravitational accelerations for all body pairs. */
    _computeAccelerations() {
        for (const b of this.bodies) {
            b.acc = Vector2.zero();
        }

        const softSq = this.softening * this.softening;

        for (let i = 0; i < this.bodies.length; i++) {
            for (let j = i + 1; j < this.bodies.length; j++) {
                const a = this.bodies[i];
                const b = this.bodies[j];

                const dx = b.pos.x - a.pos.x;
                const dy = b.pos.y - a.pos.y;
                const distSq = dx * dx + dy * dy + softSq;
                const dist = Math.sqrt(distSq);
                const force = this.G * a.mass * b.mass / distSq;

                const fx = force * dx / dist;
                const fy = force * dy / dist;

                a.acc = new Vector2(a.acc.x + fx / a.mass, a.acc.y + fy / a.mass);
                b.acc = new Vector2(b.acc.x - fx / b.mass, b.acc.y - fy / b.mass);
            }
        }
    }

    /** Merge overlapping bodies (larger absorbs smaller). */
    _resolveCollisions() {
        for (let i = 0; i < this.bodies.length; i++) {
            if (!this.bodies[i].alive) continue;
            for (let j = i + 1; j < this.bodies.length; j++) {
                if (!this.bodies[j].alive) continue;

                const a = this.bodies[i];
                const b = this.bodies[j];
                const dist = Vector2.dist(a.pos, b.pos);

                if (dist < (a.radius + b.radius) * 0.6) {
                    const [big, small] = a.mass >= b.mass ? [a, b] : [b, a];
                    big.absorb(small);
                }
            }
        }

        this.bodies = this.bodies.filter(b => b.alive);
    }
}

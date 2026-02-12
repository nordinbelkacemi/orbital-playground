/**
 * @module Body
 * Represents a single celestial body in the simulation. Bodies are plain
 * data containers — all behaviour lives in the Simulation engine.
 */
import Vector2 from './Vector2.js';
import { BODY_TYPES, PALETTES, RENDERING } from '../config.js';

/** Running palette index per type, so consecutive bodies get different colors. */
const _paletteIndex = { star: 0, planet: 0, moon: 0 };

export default class Body {
    /**
     * @param {string}  type - 'star' | 'planet' | 'moon'
     * @param {Vector2} position
     * @param {Vector2} velocity
     */
    constructor(type, position, velocity = Vector2.zero()) {
        const preset = BODY_TYPES[type];
        const palette = PALETTES[type];
        const colors = palette[_paletteIndex[type] % palette.length];
        _paletteIndex[type]++;

        /** @type {string} */
        this.type = type;

        /** @type {number} */
        this.mass = preset.mass;

        /** @type {number} */
        this.radius = preset.radius;

        /* Visual properties */
        /** @type {string} Hex fill color. */
        this.color = colors.color;

        /** @type {string} RGBA glow color. */
        this.glow = colors.glow;

        /** @type {string} Trail color template (replace ALPHA at render time). */
        this.trailColor = colors.trail;

        /* Physics state */
        /** @type {Vector2} */
        this.pos = position;

        /** @type {Vector2} */
        this.vel = velocity;

        /** @type {Vector2} */
        this.acc = Vector2.zero();

        /* Trail history */
        /** @type {Vector2[]} */
        this.trail = [];

        /** @type {number} */
        this.maxTrail = RENDERING.MAX_TRAIL_LENGTH;

        /** @type {boolean} */
        this.alive = true;

        /** @type {number} Frames since creation (used for spawn animation). */
        this.age = 0;
    }

    /** Record current position to the trail ring buffer. */
    recordTrail() {
        this.trail.push(this.pos);
        if (this.trail.length > this.maxTrail) {
            this.trail.shift();
        }
    }

    /**
     * Absorb another body (conservation of momentum).
     * @param {Body} other - the smaller body being absorbed.
     */
    absorb(other) {
        const totalMass = this.mass + other.mass;

        /* Conservation of momentum */
        this.vel = this.vel.scale(this.mass / totalMass)
            .add(other.vel.scale(other.mass / totalMass));

        /* Mass-weighted position */
        this.pos = this.pos.scale(this.mass / totalMass)
            .add(other.pos.scale(other.mass / totalMass));

        /* Grow radius ∝ cube root of mass ratio */
        this.radius *= Math.cbrt(totalMass / this.mass);
        this.mass = totalMass;

        /* Promote to star if massive enough */
        if (this.type !== 'star' && this.mass > 2000) {
            this.type = 'star';
            const colors = PALETTES.star[0];
            this.color = colors.color;
            this.glow = colors.glow;
            this.trailColor = colors.trail;
        }

        other.alive = false;
    }
}

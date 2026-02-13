/**
 * @module Vector3
 * Immutable 3D vector used throughout the physics engine.
 * Every operation returns a NEW Vector3 — no mutation, no bugs.
 */
export default class Vector3 {
    /**
     * @param {number} [x=0]
     * @param {number} [y=0]
     * @param {number} [z=0]
     */
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    /* ── Arithmetic (all return new Vector3) ── */

    /** @param {Vector3} v */
    add(v) { return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z); }

    /** @param {Vector3} v */
    sub(v) { return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z); }

    /** @param {number} s */
    scale(s) { return new Vector3(this.x * s, this.y * s, this.z * s); }

    /* ── Geometry ── */

    /** Squared magnitude (avoids sqrt). */
    get magSq() { return this.x * this.x + this.y * this.y + this.z * this.z; }

    /** Magnitude. */
    get mag() { return Math.sqrt(this.magSq); }

    /** Unit vector in same direction, or zero if magnitude is 0. */
    get normalized() {
        const m = this.mag;
        return m === 0 ? new Vector3() : this.scale(1 / m);
    }

    /* ── Static helpers (allocation-free where possible) ── */

    /** Squared distance between two vectors. */
    static distSq(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dz = a.z - b.z;
        return dx * dx + dy * dy + dz * dz;
    }

    /** Euclidean distance between two vectors. */
    static dist(a, b) { return Math.sqrt(Vector3.distSq(a, b)); }

    /** @returns {Vector3} origin */
    static zero() { return new Vector3(0, 0, 0); }
}

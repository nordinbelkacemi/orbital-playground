/**
 * @module Vector2
 * Immutable 2D vector. Every operation returns a new instance, which
 * eliminates an entire class of mutation bugs in the physics engine.
 *
 * For hot-path performance the class avoids allocations where possible
 * by offering static methods that return plain numbers (e.g. `distSq`).
 */
export default class Vector2 {
    /**
     * @param {number} x
     * @param {number} y
     */
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    /* ── Arithmetic ── */

    /** @returns {Vector2} Component-wise sum. */
    add(v) { return new Vector2(this.x + v.x, this.y + v.y); }

    /** @returns {Vector2} Component-wise difference. */
    sub(v) { return new Vector2(this.x - v.x, this.y - v.y); }

    /** @returns {Vector2} Scalar multiplication. */
    scale(s) { return new Vector2(this.x * s, this.y * s); }

    /* ── Geometry ── */

    /** @returns {number} Squared magnitude (avoids sqrt). */
    get magSq() { return this.x * this.x + this.y * this.y; }

    /** @returns {number} Magnitude. */
    get mag() { return Math.sqrt(this.magSq); }

    /** @returns {Vector2} Unit vector, or zero vector if magnitude is 0. */
    get normalized() {
        const m = this.mag;
        return m === 0 ? new Vector2() : this.scale(1 / m);
    }

    /* ── Static helpers (allocation-free for hot paths) ── */

    /**
     * Squared distance between two points.
     * @param {Vector2} a
     * @param {Vector2} b
     * @returns {number}
     */
    static distSq(a, b) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        return dx * dx + dy * dy;
    }

    /**
     * Distance between two points.
     * @param {Vector2} a
     * @param {Vector2} b
     * @returns {number}
     */
    static dist(a, b) {
        return Math.sqrt(Vector2.distSq(a, b));
    }

    /** @returns {Vector2} */
    static zero() { return new Vector2(0, 0); }
}

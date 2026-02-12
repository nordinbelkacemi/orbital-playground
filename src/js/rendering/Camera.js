/**
 * @module Camera
 * Manages the viewport — world ↔ screen coordinate transforms, zoom, and pan.
 * Stateless aside from its position and zoom level.
 */
import { INPUT } from '../config.js';

export default class Camera {
    /**
     * @param {number} screenWidth
     * @param {number} screenHeight
     */
    constructor(screenWidth, screenHeight) {
        /** @type {number} World-space X of the viewport centre. */
        this.x = 0;

        /** @type {number} World-space Y of the viewport centre. */
        this.y = 0;

        /** @type {number} Zoom level (1 = 100%). */
        this.zoom = 1;

        /** @type {number} */
        this.width = screenWidth;

        /** @type {number} */
        this.height = screenHeight;
    }

    /**
     * Convert world coordinates to screen pixels.
     * @param {number} wx
     * @param {number} wy
     * @returns {{ x: number, y: number }}
     */
    worldToScreen(wx, wy) {
        return {
            x: (wx - this.x) * this.zoom + this.width / 2,
            y: (wy - this.y) * this.zoom + this.height / 2,
        };
    }

    /**
     * Convert screen pixels to world coordinates.
     * @param {number} sx
     * @param {number} sy
     * @returns {{ x: number, y: number }}
     */
    screenToWorld(sx, sy) {
        return {
            x: (sx - this.width / 2) / this.zoom + this.x,
            y: (sy - this.height / 2) / this.zoom + this.y,
        };
    }

    /** Update viewport dimensions (call on window resize). */
    resize(width, height) {
        this.width = width;
        this.height = height;
    }

    /**
     * Zoom toward a screen-space point (e.g. the cursor).
     * @param {number} screenX
     * @param {number} screenY
     * @param {number} delta - Positive = zoom in, negative = zoom out.
     */
    zoomAt(screenX, screenY, delta) {
        const factor = delta > 0 ? INPUT.ZOOM_IN_FACTOR : INPUT.ZOOM_OUT_FACTOR;
        const newZoom = Math.max(INPUT.MIN_ZOOM, Math.min(INPUT.MAX_ZOOM, this.zoom * factor));

        /* Adjust camera so the point under the cursor stays fixed */
        const before = this.screenToWorld(screenX, screenY);
        this.zoom = newZoom;
        const after = this.screenToWorld(screenX, screenY);
        this.x -= (after.x - before.x);
        this.y -= (after.y - before.y);
    }

    /**
     * Pan by a screen-space delta.
     * @param {number} dx - Screen pixels moved horizontally.
     * @param {number} dy - Screen pixels moved vertically.
     */
    pan(dx, dy) {
        this.x -= dx / this.zoom;
        this.y -= dy / this.zoom;
    }
}

/**
 * @module InputHandler
 * Centralises all user input — mouse, touch, keyboard, and scroll.
 * Translates raw DOM events into semantic callbacks that the app layer
 * can act on without knowing about event plumbing.
 */
import Vector2 from '../core/Vector2.js';
import { INPUT } from '../config.js';

export default class InputHandler {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {object} callbacks
     * @param {(worldPos: Vector2, screenPos: {x:number,y:number}) => void} callbacks.onDragStart
     * @param {(screenPos: {x:number,y:number}) => void} callbacks.onDragMove
     * @param {(worldStart: Vector2, worldEnd: Vector2) => void} callbacks.onDragEnd
     * @param {(screenX: number, screenY: number, delta: number) => void} callbacks.onZoom
     * @param {(dx: number, dy: number) => void} callbacks.onPan
     * @param {(key: string) => void} callbacks.onKey
     */
    constructor(canvas, callbacks) {
        this._canvas = canvas;
        this._cb = callbacks;

        /** Coordinate converter — set by app after renderer is ready. */
        this._screenToWorld = null;

        /* Internal drag/pan state */
        this._dragging = false;
        this._panning = false;
        this._panLast = { x: 0, y: 0 };
        this._dragStart = { x: 0, y: 0 };

        this._bindMouse();
        this._bindTouch();
        this._bindWheel();
        this._bindKeyboard();
    }

    /**
     * Provide the screen→world converter function (from Camera/Renderer).
     * @param {(sx: number, sy: number) => { x: number, y: number }} fn
     */
    setScreenToWorld(fn) {
        this._screenToWorld = fn;
    }

    /* ── Mouse ── */

    _bindMouse() {
        const c = this._canvas;

        c.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                this._startDrag(e.clientX, e.clientY);
            } else if (e.button === 1 || e.button === 2) {
                e.preventDefault();
                this._panning = true;
                this._panLast = { x: e.clientX, y: e.clientY };
            }
        });

        c.addEventListener('mousemove', (e) => {
            if (this._dragging) {
                this._cb.onDragMove({ x: e.clientX, y: e.clientY });
            }
            if (this._panning) {
                const dx = e.clientX - this._panLast.x;
                const dy = e.clientY - this._panLast.y;
                this._cb.onPan(dx, dy);
                this._panLast = { x: e.clientX, y: e.clientY };
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button === 0 && this._dragging) {
                this._endDrag(e.clientX, e.clientY);
            }
            if (e.button === 1 || e.button === 2) {
                this._panning = false;
            }
        });

        c.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    /* ── Touch ── */

    _bindTouch() {
        const c = this._canvas;

        c.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const t = e.touches[0];
            this._startDrag(t.clientX, t.clientY);
        }, { passive: false });

        c.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!this._dragging) return;
            const t = e.touches[0];
            this._cb.onDragMove({ x: t.clientX, y: t.clientY });
        }, { passive: false });

        c.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (!this._dragging) return;
            /* Use last known drag position since touchend has no coordinates */
            this._endDrag(this._panLast.x, this._panLast.y);
        }, { passive: false });
    }

    /* ── Scroll ── */

    _bindWheel() {
        this._canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this._cb.onZoom(e.clientX, e.clientY, e.deltaY < 0 ? 1 : -1);
        }, { passive: false });
    }

    /* ── Keyboard ── */

    _bindKeyboard() {
        window.addEventListener('keydown', (e) => {
            this._cb.onKey(e.key);
            if (e.key === ' ') e.preventDefault();
        });
    }

    /* ── Helpers ── */

    _startDrag(sx, sy) {
        this._dragging = true;
        this._dragStart = { x: sx, y: sy };
        this._panLast = { x: sx, y: sy };
        if (this._screenToWorld) {
            const world = this._screenToWorld(sx, sy);
            this._cb.onDragStart(
                new Vector2(world.x, world.y),
                { x: sx, y: sy },
            );
        }
    }

    _endDrag(sx, sy) {
        this._dragging = false;
        if (this._screenToWorld) {
            const startWorld = this._screenToWorld(this._dragStart.x, this._dragStart.y);
            const endWorld = this._screenToWorld(sx, sy);
            this._cb.onDragEnd(
                new Vector2(startWorld.x, startWorld.y),
                new Vector2(endWorld.x, endWorld.y),
            );
        }
    }
}

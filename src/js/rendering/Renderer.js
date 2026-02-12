/**
 * @module Renderer
 * Canvas 2D rendering engine. Draws the space background, celestial bodies
 * with glow/corona effects, gradient trails, and the drag-velocity arrow.
 *
 * The renderer is purely a view — it reads from Simulation and Camera but
 * never mutates them.
 */
import Camera from './Camera.js';
import { RENDERING, BODY_TYPES } from '../config.js';

export default class Renderer {
    /** @param {HTMLCanvasElement} canvas */
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        /** @type {Camera} */
        this.camera = new Camera(window.innerWidth, window.innerHeight);

        /** @type {{ x:number, y:number, r:number, alpha:number, speed:number, offset:number }[]} */
        this.bgStars = [];
        this._generateBgStars(RENDERING.BG_STAR_COUNT);

        this._resize();
        window.addEventListener('resize', () => this._resize());
    }

    /* ── Public API ── */

    /**
     * Draw one frame.
     * @param {import('../core/Simulation.js').default} sim
     * @param {object|null} drag - Current drag state (if any).
     * @param {number} frame     - Monotonic frame counter.
     */
    render(sim, drag, frame) {
        const { ctx } = this;
        const w = this.camera.width;
        const h = this.camera.height;

        this._drawBackground(ctx, w, h);
        this._drawBgStars(ctx, frame);

        for (const body of sim.bodies) {
            this._drawTrail(ctx, body);
        }
        for (const body of sim.bodies) {
            this._drawBody(ctx, body, frame);
        }

        if (drag?.active) {
            this._drawDragArrow(ctx, drag);
        }
    }

    /* ── Private: Background ── */

    /** @param {number} count */
    _generateBgStars(count) {
        this.bgStars = Array.from({ length: count }, () => ({
            x: Math.random() * 4000 - 2000,
            y: Math.random() * 4000 - 2000,
            r: Math.random() * 1.2 + 0.3,
            alpha: Math.random() * 0.5 + 0.15,
            speed: Math.random() * 0.02 + 0.005,
            offset: Math.random() * Math.PI * 2,
        }));
    }

    /** @param {CanvasRenderingContext2D} ctx */
    _drawBackground(ctx, w, h) {
        ctx.fillStyle = '#05060f';
        ctx.fillRect(0, 0, w, h);

        /* Subtle radial vignette from the centre */
        const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.7);
        grad.addColorStop(0, 'rgba(15, 20, 50, 0.4)');
        grad.addColorStop(1, 'rgba(5, 6, 15, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
    }

    /** @param {CanvasRenderingContext2D} ctx */
    _drawBgStars(ctx, frame) {
        const p = RENDERING.BG_STAR_PARALLAX;
        const cam = this.camera;

        for (const s of this.bgStars) {
            const px = (s.x - cam.x * p) * cam.zoom * p + cam.width / 2;
            const py = (s.y - cam.y * p) * cam.zoom * p + cam.height / 2;
            if (px < -10 || px > cam.width + 10 || py < -10 || py > cam.height + 10) continue;

            const twinkle = Math.sin(frame * s.speed + s.offset) * 0.15;
            ctx.beginPath();
            ctx.arc(px, py, s.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(200,210,240,${Math.max(0.05, s.alpha + twinkle)})`;
            ctx.fill();
        }
    }

    /* ── Private: Trails ── */

    /**
     * Draw a body's orbital trail as a gradient line that fades from
     * transparent (oldest point) to opaque (newest).
     * @param {CanvasRenderingContext2D} ctx
     * @param {import('../core/Body.js').default} body
     */
    _drawTrail(ctx, body) {
        const { trail } = body;
        if (trail.length < 2) return;

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let i = 1; i < trail.length; i++) {
            const t = i / trail.length;
            const from = this.camera.worldToScreen(trail[i - 1].x, trail[i - 1].y);
            const to = this.camera.worldToScreen(trail[i].x, trail[i].y);

            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
            ctx.strokeStyle = body.trailColor.replace('ALPHA', (t * 0.6).toFixed(3));
            ctx.lineWidth = Math.max(0.5, t * 3 * this.camera.zoom);
            ctx.stroke();
        }
    }

    /* ── Private: Bodies ── */

    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {import('../core/Body.js').default} body
     * @param {number} frame
     */
    _drawBody(ctx, body, frame) {
        const pos = this.camera.worldToScreen(body.pos.x, body.pos.y);
        const r = body.radius * this.camera.zoom;
        const spawnScale = Math.min(1, body.age / RENDERING.SPAWN_ANIM_FRAMES);
        const drawR = r * spawnScale;

        this._drawGlow(ctx, pos, drawR, body);

        if (body.type === 'star') {
            this._drawCorona(ctx, pos, drawR, body, frame);
        }

        this._drawSphere(ctx, pos, drawR, body);
    }

    /** Soft outer glow around every body. */
    _drawGlow(ctx, pos, r, body) {
        const size = body.type === 'star' ? r * 4 : r * 2.5;
        const grad = ctx.createRadialGradient(pos.x, pos.y, r * 0.3, pos.x, pos.y, size);
        grad.addColorStop(0, body.glow);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
        ctx.fill();
    }

    /** Pulsating corona ring for stars. */
    _drawCorona(ctx, pos, r, body, frame) {
        const pulse = Math.sin(frame * 0.04) * 0.15 + 1;
        const coronaR = r * 1.8 * pulse;
        const grad = ctx.createRadialGradient(pos.x, pos.y, r, pos.x, pos.y, coronaR);
        grad.addColorStop(0, body.glow.replace('0.4', '0.25'));
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, coronaR, 0, Math.PI * 2);
        ctx.fill();
    }

    /** Lit sphere with highlight. */
    _drawSphere(ctx, pos, r, body) {
        const grad = ctx.createRadialGradient(
            pos.x - r * 0.3, pos.y - r * 0.3, r * 0.1,
            pos.x, pos.y, r,
        );
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, body.color);
        grad.addColorStop(1, Renderer._darken(body.color, 0.4));

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
    }

    /* ── Private: Drag Arrow ── */

    /** @param {CanvasRenderingContext2D} ctx */
    _drawDragArrow(ctx, drag) {
        const start = this.camera.worldToScreen(drag.worldX, drag.worldY);
        const end = { x: drag.screenX, y: drag.screenY };
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const len = Math.sqrt(dx * dx + dy * dy);

        if (len < 5) return;

        ctx.save();

        /* Dashed velocity line */
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        ctx.setLineDash([]);

        /* Arrowhead */
        const angle = Math.atan2(dy, dx);
        const headLen = 10;
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(end.x - headLen * Math.cos(angle - Math.PI / 6), end.y - headLen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(end.x - headLen * Math.cos(angle + Math.PI / 6), end.y - headLen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();

        /* Speed label */
        ctx.font = '500 11px Inter, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.textAlign = 'center';
        const speed = len / this.camera.zoom;
        ctx.fillText(`${speed.toFixed(0)} u/s`, (start.x + end.x) / 2, (start.y + end.y) / 2 - 10);

        ctx.restore();

        /* Ghost body preview */
        const preset = BODY_TYPES[drag.type];
        const ghostR = preset.radius * this.camera.zoom;
        ctx.globalAlpha = 0.4;
        this._drawSphere(ctx, start, ghostR, { color: '#4e8cff' });
        ctx.globalAlpha = 1;
    }

    /* ── Private: Utilities ── */

    _resize() {
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = window.innerHeight * dpr;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.camera.resize(window.innerWidth, window.innerHeight);
    }

    /**
     * Darken a hex color by a factor.
     * @param {string} hex    - e.g. '#4e8cff'
     * @param {number} factor - 0 = no change, 1 = black
     * @returns {string} RGB color string.
     */
    static _darken(hex, factor) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        const f = 1 - factor;
        return `rgb(${Math.round(r * f)},${Math.round(g * f)},${Math.round(b * f)})`;
    }
}

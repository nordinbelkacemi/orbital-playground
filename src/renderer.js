/**
 * renderer.js — Canvas rendering engine
 *
 * Draws celestial bodies with glow effects, gradient trails,
 * stars background, and the velocity arrow when dragging.
 */

class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        /* Camera / viewport */
        this.camera = { x: 0, y: 0, zoom: 1 };

        /* Background stars (static, random) */
        this.bgStars = [];
        this._generateBgStars(400);

        /* Resize handling */
        this._resize();
        window.addEventListener('resize', () => this._resize());
    }

    _resize() {
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = window.innerHeight * dpr;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.width = window.innerWidth;
        this.height = window.innerHeight;
    }

    _generateBgStars(count) {
        this.bgStars = [];
        for (let i = 0; i < count; i++) {
            this.bgStars.push({
                x: Math.random() * 4000 - 2000,
                y: Math.random() * 4000 - 2000,
                r: Math.random() * 1.2 + 0.3,
                alpha: Math.random() * 0.5 + 0.15,
                twinkleSpeed: Math.random() * 0.02 + 0.005,
                twinkleOffset: Math.random() * Math.PI * 2,
            });
        }
    }

    /** Convert world coords to screen coords */
    worldToScreen(wx, wy) {
        const sx = (wx - this.camera.x) * this.camera.zoom + this.width / 2;
        const sy = (wy - this.camera.y) * this.camera.zoom + this.height / 2;
        return { x: sx, y: sy };
    }

    /** Convert screen coords to world coords */
    screenToWorld(sx, sy) {
        const wx = (sx - this.width / 2) / this.camera.zoom + this.camera.x;
        const wy = (sy - this.height / 2) / this.camera.zoom + this.camera.y;
        return { x: wx, y: wy };
    }

    /** Main render method */
    render(simulation, dragState, frameCount) {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;

        /* Clear */
        ctx.fillStyle = '#05060f';
        ctx.fillRect(0, 0, w, h);

        /* Draw subtle radial gradient background */
        const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.7);
        bgGrad.addColorStop(0, 'rgba(15, 20, 50, 0.4)');
        bgGrad.addColorStop(1, 'rgba(5, 6, 15, 0)');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        /* Background stars */
        this._drawBgStars(ctx, frameCount);

        /* Trails */
        for (const body of simulation.bodies) {
            this._drawTrail(ctx, body);
        }

        /* Bodies */
        for (const body of simulation.bodies) {
            this._drawBody(ctx, body, frameCount);
        }

        /* Drag arrow (velocity preview) */
        if (dragState && dragState.dragging) {
            this._drawDragArrow(ctx, dragState);
        }
    }

    _drawBgStars(ctx, frame) {
        for (const star of this.bgStars) {
            /* Simple parallax: bg stars move at 30% speed */
            const parallax = 0.3;
            const px = (star.x - this.camera.x * parallax) * this.camera.zoom * 0.3 + this.width / 2;
            const py = (star.y - this.camera.y * parallax) * this.camera.zoom * 0.3 + this.height / 2;

            /* Skip if off-screen */
            if (px < -10 || px > this.width + 10 || py < -10 || py > this.height + 10) continue;

            const twinkle = Math.sin(frame * star.twinkleSpeed + star.twinkleOffset);
            const alpha = star.alpha + twinkle * 0.15;

            ctx.beginPath();
            ctx.arc(px, py, star.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(200, 210, 240, ${Math.max(0.05, alpha)})`;
            ctx.fill();
        }
    }

    _drawTrail(ctx, body) {
        const trail = body.trail;
        if (trail.length < 2) return;

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let i = 1; i < trail.length; i++) {
            const t = i / trail.length; /* 0 = oldest, 1 = newest */
            const from = this.worldToScreen(trail[i - 1].x, trail[i - 1].y);
            const to = this.worldToScreen(trail[i].x, trail[i].y);

            const alpha = t * 0.6;
            const width = t * 2.5 * this.camera.zoom;

            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
            ctx.strokeStyle = body.trailColor.replace('TRAIL', alpha.toFixed(3));
            ctx.lineWidth = Math.max(0.5, width);
            ctx.stroke();
        }
    }

    _drawBody(ctx, body, frame) {
        const pos = this.worldToScreen(body.x, body.y);
        const r = body.radius * this.camera.zoom;

        /* Spawn-in animation */
        const spawnScale = Math.min(1, body.age / 15);
        const drawR = r * spawnScale;

        /* Outer glow */
        const glowSize = body.type === 'star' ? drawR * 4 : drawR * 2.5;
        const glowGrad = ctx.createRadialGradient(pos.x, pos.y, drawR * 0.3, pos.x, pos.y, glowSize);
        glowGrad.addColorStop(0, body.glow);
        glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, glowSize, 0, Math.PI * 2);
        ctx.fill();

        /* Star corona pulsation */
        if (body.type === 'star') {
            const pulse = Math.sin(frame * 0.04) * 0.15 + 1;
            const coronaR = drawR * 1.8 * pulse;
            const coronaGrad = ctx.createRadialGradient(pos.x, pos.y, drawR, pos.x, pos.y, coronaR);
            coronaGrad.addColorStop(0, body.glow.replace('0.4', '0.25'));
            coronaGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = coronaGrad;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, coronaR, 0, Math.PI * 2);
            ctx.fill();
        }

        /* Body sphere */
        const bodyGrad = ctx.createRadialGradient(
            pos.x - drawR * 0.3, pos.y - drawR * 0.3, drawR * 0.1,
            pos.x, pos.y, drawR
        );
        bodyGrad.addColorStop(0, '#ffffff');
        bodyGrad.addColorStop(0.3, body.color);
        bodyGrad.addColorStop(1, this._darken(body.color, 0.4));

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, drawR, 0, Math.PI * 2);
        ctx.fillStyle = bodyGrad;
        ctx.fill();
    }

    _drawDragArrow(ctx, drag) {
        const start = this.worldToScreen(drag.startX, drag.startY);
        const end = { x: drag.screenX, y: drag.screenY };

        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const len = Math.sqrt(dx * dx + dy * dy);

        if (len < 5) return;

        /* Dashed line */
        ctx.save();
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
        ctx.lineTo(
            end.x - headLen * Math.cos(angle - Math.PI / 6),
            end.y - headLen * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
            end.x - headLen * Math.cos(angle + Math.PI / 6),
            end.y - headLen * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();

        /* Speed label */
        const speed = len / this.camera.zoom;
        ctx.font = '500 11px Inter, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.textAlign = 'center';
        ctx.fillText(`${speed.toFixed(0)} u/s`, (start.x + end.x) / 2, (start.y + end.y) / 2 - 10);

        ctx.restore();

        /* Ghost preview body */
        const preset = BODY_PRESETS[drag.type];
        const ghostR = preset.radius * this.camera.zoom;
        ctx.globalAlpha = 0.4;
        const ghostGrad = ctx.createRadialGradient(
            start.x - ghostR * 0.3, start.y - ghostR * 0.3, ghostR * 0.1,
            start.x, start.y, ghostR
        );
        const ghostColor = preset.color;
        ghostGrad.addColorStop(0, '#ffffff');
        ghostGrad.addColorStop(0.3, ghostColor);
        ghostGrad.addColorStop(1, this._darken(ghostColor, 0.4));

        ctx.beginPath();
        ctx.arc(start.x, start.y, ghostR, 0, Math.PI * 2);
        ctx.fillStyle = ghostGrad;
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    /** Darken a hex color by a factor (0 = no change, 1 = black) */
    _darken(hex, factor) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgb(${Math.round(r * (1 - factor))}, ${Math.round(g * (1 - factor))}, ${Math.round(b * (1 - factor))})`;
    }
}

window.Renderer = Renderer;

/**
 * @module app
 * Application entry point. Instantiates all modules, wires them together,
 * and owns the main game loop. This is the only file that knows about
 * every other module — all other modules are decoupled from each other.
 */
import Simulation from './core/Simulation.js';
import Renderer from './rendering/Renderer.js';
import InputHandler from './input/InputHandler.js';
import { INPUT, PHYSICS } from './config.js';

/* ── Instances ── */

const canvas = document.getElementById('sim-canvas');
const sim = new Simulation();
const renderer = new Renderer(canvas);

/* ── State ── */

let selectedType = 'planet';
let timeScale = PHYSICS.DEFAULT_TIME_SCALE;
let frameCount = 0;
let lastTime = performance.now();
let fpsSmooth = 60;
let hintDismissed = false;

/** Live drag state shared with the renderer. */
const drag = {
    active: false,
    type: 'planet',
    worldX: 0,
    worldY: 0,
    screenX: 0,
    screenY: 0,
};

/* ── UI References ── */

const ui = {
    bodyBtns: document.querySelectorAll('.body-btn'),
    btnClear: document.getElementById('btn-clear'),
    btnPause: document.getElementById('btn-pause'),
    pauseIcon: document.getElementById('pause-icon'),
    pauseLabel: document.getElementById('pause-label'),
    hint: document.getElementById('hint-overlay'),
    infoCount: document.getElementById('info-count'),
    infoTime: document.getElementById('info-time'),
    infoFps: document.getElementById('info-fps'),
    sliderTrail: document.getElementById('slider-trail'),
    sliderSpeed: document.getElementById('slider-speed'),
    sliderGravity: document.getElementById('slider-gravity'),
};

/* ── UI Event Wiring ── */

ui.bodyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        ui.bodyBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedType = btn.dataset.type;
    });
});

ui.btnClear.addEventListener('click', () => sim.clear());

ui.btnPause.addEventListener('click', () => {
    sim.paused = !sim.paused;
    ui.pauseIcon.textContent = sim.paused ? '▶' : '❚❚';
    ui.pauseLabel.textContent = sim.paused ? 'Play' : 'Pause';
});

ui.sliderTrail.addEventListener('input', () => {
    const val = parseInt(ui.sliderTrail.value, 10);
    for (const body of sim.bodies) {
        body.maxTrail = val;
        if (body.trail.length > val) {
            body.trail = body.trail.slice(-val);
        }
    }
});

ui.sliderSpeed.addEventListener('input', () => {
    timeScale = parseFloat(ui.sliderSpeed.value);
});

ui.sliderGravity.addEventListener('input', () => {
    sim.G = parseFloat(ui.sliderGravity.value) * 100;
});

/* ── Input Handler ── */

function dismissHint() {
    if (!hintDismissed) {
        hintDismissed = true;
        ui.hint.classList.add('hidden');
    }
}

const input = new InputHandler(canvas, {
    onDragStart(worldPos, screenPos) {
        dismissHint();
        drag.active = true;
        drag.type = selectedType;
        drag.worldX = worldPos.x;
        drag.worldY = worldPos.y;
        drag.screenX = screenPos.x;
        drag.screenY = screenPos.y;
    },

    onDragMove(screenPos) {
        drag.screenX = screenPos.x;
        drag.screenY = screenPos.y;
    },

    onDragEnd(worldStart, worldEnd) {
        drag.active = false;
        let vel = worldEnd.sub(worldStart).scale(INPUT.DRAG_VELOCITY_SCALE);

        /* Clamp to max launch speed (preserving direction) */
        if (vel.mag > INPUT.MAX_LAUNCH_SPEED) {
            vel = vel.normalized.scale(INPUT.MAX_LAUNCH_SPEED);
        }

        sim.addBody(drag.type, worldStart, vel);
    },

    onZoom(sx, sy, delta) {
        renderer.camera.zoomAt(sx, sy, delta);
    },

    onPan(dx, dy) {
        renderer.camera.pan(dx, dy);
    },

    onKey(key) {
        const keyActions = {
            ' ': () => ui.btnPause.click(),
            'c': () => ui.btnClear.click(),
            'C': () => ui.btnClear.click(),
            '1': () => selectType('planet'),
            '2': () => selectType('star'),
            '3': () => selectType('moon'),
        };
        keyActions[key]?.();
    },
});

/* Provide the coordinate converter to the input handler */
input.setScreenToWorld((sx, sy) => renderer.camera.screenToWorld(sx, sy));

function selectType(type) {
    selectedType = type;
    ui.bodyBtns.forEach(b => {
        b.classList.toggle('active', b.dataset.type === type);
    });
}

/* ── Game Loop ── */

function loop(now) {
    requestAnimationFrame(loop);

    const delta = now - lastTime;
    lastTime = now;
    if (delta > 0) {
        fpsSmooth = fpsSmooth * 0.95 + (1000 / delta) * 0.05;
    }

    sim.step(delta / 1000, timeScale);
    renderer.render(sim, drag, frameCount);

    /* Update HUD (throttled) */
    if (frameCount % 6 === 0) {
        ui.infoCount.textContent = sim.bodies.length;
        ui.infoTime.textContent = sim.elapsed.toFixed(1) + 's';
        ui.infoFps.textContent = Math.round(fpsSmooth);
    }

    frameCount++;
}

/* ── Bootstrap ── */

sim.createDemoScene();
requestAnimationFrame(loop);

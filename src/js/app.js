/**
 * @module app
 * Application entry point. Instantiates all modules, wires them together,
 * and owns the main game loop. This is the only file that knows about
 * every other module — all other modules are decoupled from each other.
 */
import Simulation from './core/Simulation.js';
import Vector3 from './core/Vector3.js';
import Renderer3D from './rendering/Renderer3D.js';
import { INPUT, PHYSICS } from './config.js';

/* ── Instances ── */

const canvas = document.getElementById('sim-canvas');
const sim = new Simulation();
const renderer = new Renderer3D(canvas);

/* ── State ── */

let selectedType = 'planet';
let timeScale = PHYSICS.DEFAULT_TIME_SCALE;
let frameCount = 0;
let lastTime = performance.now();
let fpsSmooth = 60;
let hintDismissed = false;

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

/* ── Body Placement (click on canvas → raycast to XZ plane) ── */

function dismissHint() {
    if (!hintDismissed) {
        hintDismissed = true;
        ui.hint.classList.add('hidden');
    }
}

/** Convert screen pixel coords to NDC (-1..1). */
function screenToNDC(x, y) {
    return {
        x: (x / window.innerWidth) * 2 - 1,
        y: -(y / window.innerHeight) * 2 + 1,
    };
}

let dragStart = null;

canvas.addEventListener('pointerdown', (e) => {
    /* Ignore right-click and middle-click (used by OrbitControls) */
    if (e.button !== 0) return;

    /* Ignore if the camera is being dragged (shift/ctrl held) */
    if (e.shiftKey || e.ctrlKey || e.metaKey) return;

    const ndc = screenToNDC(e.clientX, e.clientY);
    const worldPos = renderer.raycastToPlane(ndc.x, ndc.y);

    if (worldPos) {
        dismissHint();
        dragStart = worldPos;
    }
});

canvas.addEventListener('pointerup', (e) => {
    if (e.button !== 0 || !dragStart) return;

    const ndc = screenToNDC(e.clientX, e.clientY);
    const worldEnd = renderer.raycastToPlane(ndc.x, ndc.y);

    if (worldEnd && dragStart) {
        const dx = worldEnd.x - dragStart.x;
        const dz = worldEnd.z - dragStart.z;
        let vx = dx * INPUT.DRAG_VELOCITY_SCALE;
        let vz = dz * INPUT.DRAG_VELOCITY_SCALE;

        /* Clamp to max launch speed */
        const speed = Math.sqrt(vx * vx + vz * vz);
        if (speed > INPUT.MAX_LAUNCH_SPEED) {
            const ratio = INPUT.MAX_LAUNCH_SPEED / speed;
            vx *= ratio;
            vz *= ratio;
        }

        const pos = new Vector3(dragStart.x, 0, dragStart.z);
        const vel = new Vector3(vx, 0, vz);
        sim.addBody(selectedType, pos, vel);
    }

    dragStart = null;
});

/* Keyboard shortcuts */
window.addEventListener('keydown', (e) => {
    const keyActions = {
        ' ': () => ui.btnPause.click(),
        'c': () => ui.btnClear.click(),
        'C': () => ui.btnClear.click(),
        '1': () => selectType('planet'),
        '2': () => selectType('star'),
        '3': () => selectType('moon'),
    };
    keyActions[e.key]?.();
});

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
    renderer.render(sim);

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

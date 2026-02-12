/**
 * main.js — Application controller
 *
 * Wires up input handling, UI controls, and the main game loop.
 */

(function () {
    'use strict';

    /* ── Instances ── */
    const canvas = document.getElementById('sim-canvas');
    const sim = new Simulation();
    const renderer = new Renderer(canvas);

    /* ── State ── */
    let selectedType = 'planet';
    let frameCount = 0;
    let lastTime = performance.now();
    let fpsSmooth = 60;
    let timeScale = 2;

    const dragState = {
        dragging: false,
        startX: 0,  // world coords
        startY: 0,
        screenX: 0, // screen coords (for arrow endpoint)
        screenY: 0,
        type: 'planet',
    };

    /* ── UI References ── */
    const bodyBtns = document.querySelectorAll('.body-btn');
    const btnClear = document.getElementById('btn-clear');
    const btnPause = document.getElementById('btn-pause');
    const pauseIcon = document.getElementById('pause-icon');
    const pauseLabel = document.getElementById('pause-label');
    const hintOverlay = document.getElementById('hint-overlay');

    const infoCount = document.getElementById('info-count');
    const infoTime = document.getElementById('info-time');
    const infoFps = document.getElementById('info-fps');

    const sliderTrail = document.getElementById('slider-trail');
    const sliderSpeed = document.getElementById('slider-speed');
    const sliderGravity = document.getElementById('slider-gravity');

    /* ── Body type selection ── */
    bodyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            bodyBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedType = btn.dataset.type;
        });
    });

    /* ── Clear ── */
    btnClear.addEventListener('click', () => {
        sim.clear();
    });

    /* ── Pause / Resume ── */
    btnPause.addEventListener('click', () => {
        sim.paused = !sim.paused;
        pauseIcon.textContent = sim.paused ? '▶' : '❚❚';
        pauseLabel.textContent = sim.paused ? 'Play' : 'Pause';
    });

    /* ── Sliders ── */
    sliderTrail.addEventListener('input', () => {
        const val = parseInt(sliderTrail.value, 10);
        sim.maxTrailLength = val;
        for (const body of sim.bodies) {
            body.maxTrail = val;
            if (body.trail.length > val) {
                body.trail = body.trail.slice(-val);
            }
        }
    });

    sliderSpeed.addEventListener('input', () => {
        timeScale = parseFloat(sliderSpeed.value);
    });

    sliderGravity.addEventListener('input', () => {
        sim.G = parseFloat(sliderGravity.value) * 100;
    });

    /* ── Mouse interaction ── */
    let hintDismissed = false;

    function dismissHint() {
        if (!hintDismissed) {
            hintDismissed = true;
            hintOverlay.classList.add('hidden');
        }
    }

    canvas.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return; /* left click only */
        dismissHint();

        const world = renderer.screenToWorld(e.clientX, e.clientY);
        dragState.dragging = true;
        dragState.startX = world.x;
        dragState.startY = world.y;
        dragState.screenX = e.clientX;
        dragState.screenY = e.clientY;
        dragState.type = selectedType;
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!dragState.dragging) return;
        dragState.screenX = e.clientX;
        dragState.screenY = e.clientY;
    });

    canvas.addEventListener('mouseup', (e) => {
        if (!dragState.dragging) return;
        dragState.dragging = false;

        /* Calculate velocity from drag distance.
         * Scale factor tuned so a moderate drag ≈ circular orbital speed */
        const endWorld = renderer.screenToWorld(e.clientX, e.clientY);
        const vx = (endWorld.x - dragState.startX) * 0.08;
        const vy = (endWorld.y - dragState.startY) * 0.08;

        sim.addBody(dragState.type, dragState.startX, dragState.startY, vx, vy);
    });

    /* ── Touch support ── */
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        dismissHint();

        const world = renderer.screenToWorld(touch.clientX, touch.clientY);
        dragState.dragging = true;
        dragState.startX = world.x;
        dragState.startY = world.y;
        dragState.screenX = touch.clientX;
        dragState.screenY = touch.clientY;
        dragState.type = selectedType;
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (!dragState.dragging) return;
        const touch = e.touches[0];
        dragState.screenX = touch.clientX;
        dragState.screenY = touch.clientY;
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
        if (!dragState.dragging) return;
        dragState.dragging = false;

        const endWorld = renderer.screenToWorld(dragState.screenX, dragState.screenY);
        const vx = (endWorld.x - dragState.startX) * 0.08;
        const vy = (endWorld.y - dragState.startY) * 0.08;

        sim.addBody(dragState.type, dragState.startX, dragState.startY, vx, vy);
    });

    /* ── Scroll to zoom ── */
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomFactor = e.deltaY > 0 ? 0.92 : 1.08;
        const newZoom = Math.max(0.15, Math.min(5, renderer.camera.zoom * zoomFactor));

        /* Zoom toward cursor position */
        const mouseWorld = renderer.screenToWorld(e.clientX, e.clientY);
        renderer.camera.zoom = newZoom;
        const newMouseWorld = renderer.screenToWorld(e.clientX, e.clientY);
        renderer.camera.x -= (newMouseWorld.x - mouseWorld.x);
        renderer.camera.y -= (newMouseWorld.y - mouseWorld.y);
    }, { passive: false });

    /* ── Middle-click / right-click drag to pan ── */
    let panning = false;
    let panLastX = 0;
    let panLastY = 0;

    canvas.addEventListener('mousedown', (e) => {
        if (e.button === 1 || e.button === 2) {
            e.preventDefault();
            panning = true;
            panLastX = e.clientX;
            panLastY = e.clientY;
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!panning) return;
        const dx = e.clientX - panLastX;
        const dy = e.clientY - panLastY;
        renderer.camera.x -= dx / renderer.camera.zoom;
        renderer.camera.y -= dy / renderer.camera.zoom;
        panLastX = e.clientX;
        panLastY = e.clientY;
    });

    window.addEventListener('mouseup', (e) => {
        if (e.button === 1 || e.button === 2) {
            panning = false;
        }
    });

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    /* ── Keyboard shortcuts ── */
    window.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Spacebar') {
            e.preventDefault();
            btnPause.click();
        } else if (e.key === 'c' || e.key === 'C') {
            btnClear.click();
        } else if (e.key === '1') {
            bodyBtns.forEach(b => b.classList.remove('active'));
            document.getElementById('btn-planet').classList.add('active');
            selectedType = 'planet';
        } else if (e.key === '2') {
            bodyBtns.forEach(b => b.classList.remove('active'));
            document.getElementById('btn-star').classList.add('active');
            selectedType = 'star';
        } else if (e.key === '3') {
            bodyBtns.forEach(b => b.classList.remove('active'));
            document.getElementById('btn-moon').classList.add('active');
            selectedType = 'moon';
        }
    });

    /* ── Main loop ── */
    function loop(now) {
        requestAnimationFrame(loop);

        /* FPS calculation */
        const delta = now - lastTime;
        lastTime = now;
        if (delta > 0) {
            fpsSmooth = fpsSmooth * 0.95 + (1000 / delta) * 0.05;
        }

        /* Physics — pass real frame delta (in seconds) and user time scale */
        const frameDt = delta / 1000;
        sim.step(frameDt, timeScale);

        /* Render */
        renderer.render(sim, dragState, frameCount);

        /* Update UI (throttled to every 6 frames) */
        if (frameCount % 6 === 0) {
            infoCount.textContent = sim.bodies.length;
            infoTime.textContent = sim.elapsed.toFixed(1) + 's';
            infoFps.textContent = Math.round(fpsSmooth);
        }

        frameCount++;
    }

    /* ── Start with demo scene ── */
    sim.createDemoScene();
    requestAnimationFrame(loop);

})();

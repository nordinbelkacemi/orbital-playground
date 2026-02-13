/**
 * @module Renderer3D
 * Three.js-based 3D renderer for the orbital simulation.
 * Reads body state immutably from the Simulation and creates/updates
 * Three.js objects to reflect it. Owns the scene, camera, and render loop.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/** Max trail segments per body. */
const MAX_TRAIL_POINTS = 200;

export default class Renderer3D {
    /** @param {HTMLCanvasElement} canvas */
    constructor(canvas) {
        /* ── Core Three.js ── */
        this.renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: false,
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;

        /* ── Scene ── */
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x060810);

        /* ── Camera ── */
        this.camera = new THREE.PerspectiveCamera(
            55,
            window.innerWidth / window.innerHeight,
            1,
            10000,
        );
        this.camera.position.set(0, 500, 300);
        this.camera.lookAt(0, 0, 0);

        /* ── Controls ── */
        this.controls = new OrbitControls(this.camera, canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;
        this.controls.minDistance = 80;
        this.controls.maxDistance = 3000;
        this.controls.maxPolarAngle = Math.PI * 0.85;

        /* ── Lighting ── */
        this.scene.add(new THREE.AmbientLight(0x222244, 0.5));

        /* ── Post-processing (bloom) ── */
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));

        const bloom = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.2,   /* strength */
            0.5,   /* radius */
            0.3,   /* threshold */
        );
        this.composer.addPass(bloom);
        this.composer.addPass(new OutputPass());

        /* ── Background stars ── */
        this._createStarfield();

        /* ── Grid plane ── */
        this._createGrid();

        /* ── Body mesh cache ── */
        /** @type {Map<Body, THREE.Group>} */
        this._meshMap = new Map();

        /** @type {Map<Body, THREE.Line>} */
        this._trailMap = new Map();

        /* ── Resize handler ── */
        window.addEventListener('resize', () => this._onResize());

        /* ── Shared geometries (reused for all bodies of same type) ── */
        this._sphereGeo = new THREE.SphereGeometry(1, 32, 24);
    }

    /* ── Public ── */

    /**
     * Render one frame.
     * @param {import('../core/Simulation.js').default} sim
     */
    render(sim) {
        this.controls.update();

        /* Sync Three.js objects with simulation bodies */
        this._syncBodies(sim.bodies);
        this._syncTrails(sim.bodies);

        /* Remove meshes for dead bodies */
        this._pruneDeadBodies(sim.bodies);

        this.composer.render();
    }

    /**
     * Raycast from screen coords to the XZ plane (y=0).
     * Used for placing bodies with mouse clicks.
     * @param {number} screenX - normalised device x (-1 to 1)
     * @param {number} screenY - normalised device y (-1 to 1)
     * @returns {{ x: number, z: number }}
     */
    raycastToPlane(screenX, screenY) {
        const raycaster = new THREE.Raycaster();
        const ndc = new THREE.Vector2(screenX, screenY);
        raycaster.setFromCamera(ndc, this.camera);

        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const target = new THREE.Vector3();
        raycaster.ray.intersectPlane(plane, target);

        return target ?? new THREE.Vector3(0, 0, 0);
    }

    /* ── Private: Starfield ── */

    _createStarfield() {
        const count = 2000;
        const positions = new Float32Array(count * 3);
        const sizes = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            const r = 1500 + Math.random() * 3000;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);
            sizes[i] = 0.5 + Math.random() * 2;
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const mat = new THREE.PointsMaterial({
            color: 0xaabbdd,
            size: 1.5,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.6,
        });

        this.scene.add(new THREE.Points(geo, mat));
    }

    /* ── Private: Grid ── */

    _createGrid() {
        const grid = new THREE.GridHelper(1200, 40, 0x1a2040, 0x111830);
        grid.material.transparent = true;
        grid.material.opacity = 0.25;
        grid.position.y = -0.5;
        this.scene.add(grid);
    }

    /* ── Private: Body sync ── */

    /**
     * Create or update Three.js meshes for each simulation body.
     * @param {import('../core/Body.js').default[]} bodies
     */
    _syncBodies(bodies) {
        for (const body of bodies) {
            let group = this._meshMap.get(body);

            if (!group) {
                group = this._createBodyGroup(body);
                this._meshMap.set(body, group);
                this.scene.add(group);
            }

            /* Update position */
            group.position.set(body.pos.x, body.pos.y, body.pos.z);

            /* Update scale (handles merging — radius can grow) */
            const s = body.radius;
            group.scale.set(s, s, s);

            /* Animate point light intensity for stars */
            if (body.type === 'star' && group.userData.light) {
                group.userData.light.intensity = body.mass * 0.08;
            }
        }
    }

    /**
     * Build a Three.js group for a body (sphere + glow + optional light).
     * @param {import('../core/Body.js').default} body
     * @returns {THREE.Group}
     */
    _createBodyGroup(body) {
        const group = new THREE.Group();
        const color = new THREE.Color(body.color);

        /* Main sphere */
        const mat = new THREE.MeshStandardMaterial({
            color,
            emissive: color,
            emissiveIntensity: body.type === 'star' ? 2.0 : 0.4,
            roughness: 0.7,
            metalness: 0.1,
        });
        const mesh = new THREE.Mesh(this._sphereGeo, mat);
        group.add(mesh);

        /* Glow sphere (slightly larger, additive) */
        const glowMat = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: body.type === 'star' ? 0.15 : 0.08,
            side: THREE.BackSide,
        });
        const glow = new THREE.Mesh(this._sphereGeo, glowMat);
        glow.scale.setScalar(body.type === 'star' ? 2.5 : 1.6);
        group.add(glow);

        /* Point light for stars */
        if (body.type === 'star') {
            const light = new THREE.PointLight(color, body.mass * 0.08, 800);
            group.add(light);
            group.userData.light = light;
        }

        return group;
    }

    /* ── Private: Trails ── */

    /**
     * Sync trail lines for each body.
     * @param {import('../core/Body.js').default[]} bodies
     */
    _syncTrails(bodies) {
        for (const body of bodies) {
            if (body.trail.length < 2) continue;

            let line = this._trailMap.get(body);

            if (!line) {
                const geo = new THREE.BufferGeometry();
                const positions = new Float32Array(MAX_TRAIL_POINTS * 3);
                geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
                geo.setDrawRange(0, 0);

                const mat = new THREE.LineBasicMaterial({
                    color: new THREE.Color(body.color),
                    transparent: true,
                    opacity: 0.4,
                });

                line = new THREE.Line(geo, mat);
                line.frustumCulled = false;
                this._trailMap.set(body, line);
                this.scene.add(line);
            }

            /* Update trail positions */
            const posAttr = line.geometry.getAttribute('position');
            const count = Math.min(body.trail.length, MAX_TRAIL_POINTS);
            const start = body.trail.length - count;

            for (let i = 0; i < count; i++) {
                const p = body.trail[start + i];
                posAttr.array[i * 3] = p.x;
                posAttr.array[i * 3 + 1] = p.y;
                posAttr.array[i * 3 + 2] = p.z;
            }

            posAttr.needsUpdate = true;
            line.geometry.setDrawRange(0, count);
        }
    }

    /* ── Private: Cleanup ── */

    /**
     * Remove meshes/trails for bodies no longer in the simulation.
     * @param {import('../core/Body.js').default[]} bodies
     */
    _pruneDeadBodies(bodies) {
        const bodySet = new Set(bodies);

        for (const [body, group] of this._meshMap) {
            if (!bodySet.has(body)) {
                this.scene.remove(group);
                this._meshMap.delete(body);
            }
        }

        for (const [body, line] of this._trailMap) {
            if (!bodySet.has(body)) {
                this.scene.remove(line);
                this._trailMap.delete(body);
            }
        }
    }

    /* ── Private: Resize ── */

    _onResize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
        this.composer.setSize(w, h);
    }
}

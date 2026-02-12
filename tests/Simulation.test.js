/**
 * @file Simulation integration tests.
 * Tests the physics engine: body management, gravitational calculations,
 * orbital stability, collision resolution, and pause/resume.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import Simulation from '../src/js/core/Simulation.js';
import Vector2 from '../src/js/core/Vector2.js';

describe('Simulation', () => {
    /** @type {Simulation} */
    let sim;

    beforeEach(() => {
        sim = new Simulation();
    });

    describe('body management', () => {
        it('starts with no bodies', () => {
            expect(sim.bodies).toHaveLength(0);
        });

        it('adds a body and returns it', () => {
            const body = sim.addBody('planet', new Vector2(100, 0));
            expect(sim.bodies).toHaveLength(1);
            expect(body.type).toBe('planet');
            expect(body.pos.x).toBe(100);
        });

        it('clear removes all bodies and resets time', () => {
            sim.addBody('star', new Vector2(0, 0));
            sim.addBody('planet', new Vector2(100, 0));
            sim.step(0.016, 1);
            sim.clear();
            expect(sim.bodies).toHaveLength(0);
            expect(sim.elapsed).toBe(0);
        });
    });

    describe('physics', () => {
        it('advances elapsed time', () => {
            sim.addBody('star', new Vector2(0, 0));
            sim.step(0.016, 1);
            expect(sim.elapsed).toBeGreaterThan(0);
        });

        it('gravitational attraction moves bodies toward each other', () => {
            sim.addBody('star', new Vector2(0, 0), Vector2.zero());
            sim.addBody('planet', new Vector2(200, 0), Vector2.zero());

            const initialDist = 200;
            sim.step(0.016, 1);
            const newDist = Vector2.dist(sim.bodies[0].pos, sim.bodies[1].pos);

            expect(newDist).toBeLessThan(initialDist);
        });

        it('does not move bodies when paused', () => {
            sim.addBody('planet', new Vector2(100, 0), new Vector2(0, 10));
            sim.paused = true;
            sim.step(0.016, 1);
            expect(sim.bodies[0].pos.x).toBe(100);
            expect(sim.elapsed).toBe(0);
        });
    });

    describe('orbital stability', () => {
        it('circular orbit remains bound over 500 frames', () => {
            const stableSim = new Simulation({ substeps: 8 });
            stableSim.addBody('star', new Vector2(0, 0));
            const r = 300;
            const v = stableSim.orbitalSpeed(3000, r);
            stableSim.addBody('planet', new Vector2(r, 0), new Vector2(0, v));

            for (let i = 0; i < 500; i++) {
                stableSim.step(0.016, 1);
            }

            const planet = stableSim.bodies[1];
            const finalR = planet.pos.mag;
            /* Body should remain gravitationally bound — not escape */
            expect(finalR).toBeLessThan(r * 2);
            /* Body should not collapse into the star */
            expect(finalR).toBeGreaterThan(r * 0.2);
        });
    });

    describe('collisions', () => {
        it('merges overlapping bodies', () => {
            sim.addBody('star', new Vector2(0, 0));
            sim.addBody('planet', new Vector2(5, 0));
            sim.step(0.016, 1);
            expect(sim.bodies).toHaveLength(1);
        });

        it('merged body conserves total mass', () => {
            const a = sim.addBody('star', new Vector2(0, 0));
            const b = sim.addBody('planet', new Vector2(5, 0));
            const totalMass = a.mass + b.mass;
            sim.step(0.016, 1);
            expect(sim.bodies[0].mass).toBe(totalMass);
        });
    });

    describe('demo scene', () => {
        it('creates a system with 5 bodies', () => {
            sim.createDemoScene();
            expect(sim.bodies).toHaveLength(5);
        });

        it('first body is a star at origin', () => {
            sim.createDemoScene();
            const star = sim.bodies[0];
            expect(star.type).toBe('star');
            expect(star.pos.x).toBe(0);
            expect(star.pos.y).toBe(0);
        });
    });

    describe('orbitalSpeed', () => {
        it('computes v = sqrt(G * M / r)', () => {
            const v = sim.orbitalSpeed(3000, 200);
            const expected = Math.sqrt(800 * 3000 / 200);
            expect(v).toBeCloseTo(expected, 5);
        });
    });
});

/**
 * @file Vector2 unit tests.
 * Covers arithmetic, geometry, immutability guarantees, and static helpers.
 */
import { describe, it, expect } from 'vitest';
import Vector2 from '../src/js/core/Vector2.js';

describe('Vector2', () => {
    describe('construction', () => {
        it('defaults to (0, 0)', () => {
            const v = new Vector2();
            expect(v.x).toBe(0);
            expect(v.y).toBe(0);
        });

        it('stores x and y', () => {
            const v = new Vector2(3, 4);
            expect(v.x).toBe(3);
            expect(v.y).toBe(4);
        });
    });

    describe('arithmetic', () => {
        it('adds two vectors', () => {
            const result = new Vector2(1, 2).add(new Vector2(3, 4));
            expect(result.x).toBe(4);
            expect(result.y).toBe(6);
        });

        it('subtracts two vectors', () => {
            const result = new Vector2(5, 7).sub(new Vector2(2, 3));
            expect(result.x).toBe(3);
            expect(result.y).toBe(4);
        });

        it('scales by a scalar', () => {
            const result = new Vector2(3, 4).scale(2);
            expect(result.x).toBe(6);
            expect(result.y).toBe(8);
        });

        it('scales by zero', () => {
            const result = new Vector2(3, 4).scale(0);
            expect(result.x).toBe(0);
            expect(result.y).toBe(0);
        });
    });

    describe('geometry', () => {
        it('computes magnitude for 3-4-5 triangle', () => {
            expect(new Vector2(3, 4).mag).toBe(5);
        });

        it('computes squared magnitude', () => {
            expect(new Vector2(3, 4).magSq).toBe(25);
        });

        it('normalizes to unit length', () => {
            const n = new Vector2(0, 5).normalized;
            expect(n.x).toBeCloseTo(0);
            expect(n.y).toBeCloseTo(1);
        });

        it('normalizing zero vector returns zero', () => {
            const n = new Vector2(0, 0).normalized;
            expect(n.x).toBe(0);
            expect(n.y).toBe(0);
        });
    });

    describe('immutability', () => {
        it('add returns a new instance', () => {
            const a = new Vector2(1, 2);
            const b = a.add(new Vector2(1, 1));
            expect(a.x).toBe(1);
            expect(b.x).toBe(2);
            expect(a).not.toBe(b);
        });

        it('scale returns a new instance', () => {
            const a = new Vector2(3, 4);
            const b = a.scale(10);
            expect(a.x).toBe(3);
            expect(b.x).toBe(30);
        });
    });

    describe('static helpers', () => {
        it('distSq computes squared distance', () => {
            const a = new Vector2(0, 0);
            const b = new Vector2(3, 4);
            expect(Vector2.distSq(a, b)).toBe(25);
        });

        it('dist computes distance', () => {
            const a = new Vector2(1, 1);
            const b = new Vector2(4, 5);
            expect(Vector2.dist(a, b)).toBe(5);
        });

        it('zero() returns origin', () => {
            const z = Vector2.zero();
            expect(z.x).toBe(0);
            expect(z.y).toBe(0);
        });
    });
});

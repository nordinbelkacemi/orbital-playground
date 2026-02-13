/**
 * @file Vector3 unit tests.
 * Covers arithmetic, geometry, immutability guarantees, and static helpers.
 */
import { describe, it, expect } from 'vitest';
import Vector3 from '../src/js/core/Vector3.js';

describe('Vector3', () => {
    describe('construction', () => {
        it('defaults to (0, 0, 0)', () => {
            const v = new Vector3();
            expect(v.x).toBe(0);
            expect(v.y).toBe(0);
            expect(v.z).toBe(0);
        });

        it('stores x, y, z', () => {
            const v = new Vector3(3, 4, 5);
            expect(v.x).toBe(3);
            expect(v.y).toBe(4);
            expect(v.z).toBe(5);
        });
    });

    describe('arithmetic', () => {
        it('adds two vectors', () => {
            const result = new Vector3(1, 2, 3).add(new Vector3(4, 5, 6));
            expect(result.x).toBe(5);
            expect(result.y).toBe(7);
            expect(result.z).toBe(9);
        });

        it('subtracts two vectors', () => {
            const result = new Vector3(5, 7, 9).sub(new Vector3(2, 3, 4));
            expect(result.x).toBe(3);
            expect(result.y).toBe(4);
            expect(result.z).toBe(5);
        });

        it('scales by a scalar', () => {
            const result = new Vector3(3, 4, 5).scale(2);
            expect(result.x).toBe(6);
            expect(result.y).toBe(8);
            expect(result.z).toBe(10);
        });

        it('scales by zero', () => {
            const result = new Vector3(3, 4, 5).scale(0);
            expect(result.x).toBe(0);
            expect(result.y).toBe(0);
            expect(result.z).toBe(0);
        });
    });

    describe('geometry', () => {
        it('computes magnitude', () => {
            expect(new Vector3(1, 2, 2).mag).toBe(3);
        });

        it('computes squared magnitude', () => {
            expect(new Vector3(1, 2, 2).magSq).toBe(9);
        });

        it('normalizes to unit length', () => {
            const n = new Vector3(0, 0, 5).normalized;
            expect(n.x).toBeCloseTo(0);
            expect(n.y).toBeCloseTo(0);
            expect(n.z).toBeCloseTo(1);
        });

        it('normalizing zero vector returns zero', () => {
            const n = new Vector3(0, 0, 0).normalized;
            expect(n.x).toBe(0);
            expect(n.y).toBe(0);
            expect(n.z).toBe(0);
        });
    });

    describe('immutability', () => {
        it('add returns a new instance', () => {
            const a = new Vector3(1, 2, 3);
            const b = a.add(new Vector3(1, 1, 1));
            expect(a.x).toBe(1);
            expect(b.x).toBe(2);
            expect(a).not.toBe(b);
        });

        it('scale returns a new instance', () => {
            const a = new Vector3(3, 4, 5);
            const b = a.scale(10);
            expect(a.x).toBe(3);
            expect(b.x).toBe(30);
        });
    });

    describe('static helpers', () => {
        it('distSq computes squared distance', () => {
            const a = new Vector3(0, 0, 0);
            const b = new Vector3(1, 2, 2);
            expect(Vector3.distSq(a, b)).toBe(9);
        });

        it('dist computes distance', () => {
            const a = new Vector3(1, 1, 1);
            const b = new Vector3(4, 5, 1);
            expect(Vector3.dist(a, b)).toBe(5);
        });

        it('zero() returns origin', () => {
            const z = Vector3.zero();
            expect(z.x).toBe(0);
            expect(z.y).toBe(0);
            expect(z.z).toBe(0);
        });
    });
});

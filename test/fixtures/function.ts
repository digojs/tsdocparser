/**
 * func
 * @param x x
 * @param [y] y
 * @returns returns
 */
export function func(x, y = 2) { }

export async function async(...r) { }

export function* generator() { }

/**
 * @template T T
 */
export function generic<T>(): void { }

/**
 * override1
 */
export function override(p: 1)
/**
 * override2
 */
export function override(p: 2)
/**
 * override
 */
export function override(p: number) { }

/**
 * Class
 */
export function Class() { }
/**
 * Class1
 */
export interface Class { i(): void }
/**
 * Class2
 */
export namespace Class { export const n = 1 }
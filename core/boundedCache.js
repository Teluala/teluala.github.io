/*!
 * Copyright (c) 2026 The Teluala Authors
 * SPDX-License-Identifier: MIT
 */
export class BoundedCache {
    #entries = new Map();
    #limit;
    #sizeOf;
    constructor(options) {
        if (!Number.isFinite(options.limit) || options.limit < 0) {
            throw new RangeError('cache limit must be a non-negative number');
        }
        this.#limit = options.limit;
        this.#sizeOf = options.sizeOf ?? (() => 1);
    }
    get size() {
        return this.#entries.size;
    }
    get limit() {
        return this.#limit;
    }
    /** Summed sizeOf() of the entries, read at call time. */
    get total() {
        let total = 0;
        for (const value of this.#entries.values())
            total += this.#sizeOf(value);
        return total;
    }
    has(key) {
        return this.#entries.has(key);
    }
    /** Read without touching recency (identity checks, snapshots). */
    peek(key) {
        return this.#entries.get(key);
    }
    /** Read and mark as most recently used. */
    get(key) {
        const value = this.#entries.get(key);
        if (value !== undefined) {
            this.#entries.delete(key);
            this.#entries.set(key, value);
        }
        return value;
    }
    /** Insert or replace as most recently used. */
    set(key, value) {
        this.#entries.delete(key);
        this.#entries.set(key, value);
    }
    delete(key) {
        const value = this.#entries.get(key);
        if (value !== undefined)
            this.#entries.delete(key);
        return value;
    }
    clear() {
        this.#entries.clear();
    }
    /** Least recently used first. Deleting during iteration is safe; get() is not (it re-inserts). */
    keys() {
        return this.#entries.keys();
    }
    values() {
        return this.#entries.values();
    }
    entries() {
        return this.#entries.entries();
    }
    [Symbol.iterator]() {
        return this.#entries.entries();
    }
    /** Evict least recently used entries until total <= limit, never a protected
     * or zero-sized one. Returns what was dropped. `limit` overrides the
     * constructor's for this call — an owner whose protected set varies per
     * frame bounds what it keeps BEYOND that set (protected.size + retained). */
    prune(isProtected, limit = this.#limit) {
        if (!Number.isFinite(limit) || limit < 0) {
            throw new RangeError('cache limit must be a non-negative number');
        }
        const dropped = [];
        let total = this.total;
        if (total <= limit)
            return dropped;
        for (const [key, value] of this.#entries) {
            const size = this.#sizeOf(value);
            // Dropping a zero-sized entry frees nothing: it is outside the budget.
            if (size === 0 || isProtected?.(key, value))
                continue;
            this.#entries.delete(key);
            total -= size;
            dropped.push([key, value]);
            if (total <= limit)
                break;
        }
        return dropped;
    }
}

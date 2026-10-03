/*!
 * Copyright (c) 2026 The Teluala Authors
 * SPDX-License-Identifier: MIT
 */
/**
 * The shell every controller + backend layer shares: a controller decides
 * WHAT to draw (its update() yields render entries), a backend owns the GPU
 * resources that draw them, and this class binds the two to the engine's
 * GlobeLayer contract — validation, init with rollback, the entries copy,
 * attribution, idempotent destroy. Packages subclass it and add what is
 * theirs (labels, picking) through the protected hooks.
 */
import { LAYER_SPEC, } from './layer.js';
function requireMethod(value, method, label) {
    if (!value || typeof value[method] !== 'function') {
        throw new TypeError(`${label}.${method} is required`);
    }
}
export class ControllerLayer {
    layerSpec = LAYER_SPEC;
    name;
    sortKey;
    controller;
    backend;
    #context = null;
    #entries = [];
    // The controller's own array behind #entries: handed the same array again,
    // the layer keeps its copy, so a backend that compares array identity can
    // skip its per-frame diff.
    #sourceEntries = null;
    #destroyed = false;
    /** `kind` names the layer in errors ('vector layer is destroyed'). */
    constructor(kind, options, defaults) {
        const name = options.name ?? defaults.name;
        const sortKey = options.sortKey ?? defaults.sortKey;
        if (typeof name !== 'string' || name.length === 0) {
            throw new TypeError(`${kind} layer name is required`);
        }
        if (!Number.isFinite(sortKey))
            throw new TypeError('sortKey must be finite');
        requireMethod(options.controller, 'update', 'controller');
        requireMethod(options.controller, 'destroy', 'controller');
        requireMethod(options.backend, 'init', 'backend');
        requireMethod(options.backend, 'draw', 'backend');
        requireMethod(options.backend, 'destroy', 'backend');
        this.#kind = kind;
        this.name = name;
        this.sortKey = sortKey;
        this.controller = options.controller;
        this.backend = options.backend;
    }
    #kind;
    /** The entries of the last update (a copy; empty after destroy). */
    get entries() {
        return this.#entries;
    }
    get destroyed() {
        return this.#destroyed;
    }
    init(context) {
        if (this.#destroyed)
            throw new Error(`${this.#kind} layer is destroyed`);
        if (this.#context)
            throw new Error(`${this.#kind} layer is already initialized`);
        if (!context || typeof context.invalidate !== 'function') {
            throw new TypeError('LayerContext.invalidate is required');
        }
        this.#context = context;
        try {
            this.backend.init(context);
            this.controller.init?.(context);
        }
        catch (error) {
            try {
                this.controller.destroy();
            }
            catch {
                /* Preserve the initialization error. */
            }
            try {
                this.backend.destroy();
            }
            catch {
                /* Preserve the initialization error. */
            }
            this.#context = null;
            throw error;
        }
    }
    update(frame) {
        this.requireInitialized();
        const update = this.controller.update(frame);
        if (update?.entries !== undefined) {
            if (!Array.isArray(update.entries)) {
                throw new TypeError('controller update entries must be an array');
            }
            if (update.entries !== this.#sourceEntries) {
                this.#sourceEntries = update.entries;
                this.#entries = [...update.entries];
            }
        }
        this.onUpdate?.(update);
        return Boolean(update?.needsRender);
    }
    draw(pass, frame) {
        this.requireInitialized();
        this.backend.draw(pass, frame, this.#entries);
        this.onDraw?.(pass, frame);
    }
    attribution() {
        this.requireInitialized();
        const values = this.controller.attribution?.() ?? [];
        if (!Array.isArray(values) || !values.every((value) => typeof value === 'string')) {
            throw new TypeError('controller attribution must return strings');
        }
        return [...new Set(values)];
    }
    destroy() {
        if (this.#destroyed)
            return;
        this.#destroyed = true;
        this.#entries = [];
        this.#sourceEntries = null;
        this.onDestroy?.();
        try {
            this.backend.destroy();
        }
        finally {
            // A caller-supplied backend may throw; the controller must still stop
            // its worker, abort in-flight fetches, and clear retry timers.
            this.controller.destroy();
            this.#context = null;
        }
    }
    requireInitialized() {
        if (this.#destroyed)
            throw new Error(`${this.#kind} layer is destroyed`);
        if (!this.#context)
            throw new Error(`${this.#kind} layer is not initialized`);
    }
}

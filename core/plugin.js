/*!
 * Copyright (c) 2026 The Teluala Authors
 * SPDX-License-Identifier: MIT
 */
export const HOST_API = 0;
export function usePlugins(ctx, plugins) {
    const full = { ...ctx, hostApi: HOST_API };
    let disposed = false;
    const live = [];
    const cleanup = (entry) => {
        if (entry.cleaned)
            return;
        entry.cleaned = true;
        try {
            entry.plugin.dispose();
        }
        catch {
            /* Continue disposing other plugins. */
        }
    };
    for (const plugin of plugins) {
        const entry = { plugin, ready: false, cleaned: false };
        live.push(entry);
        try {
            const setup = plugin.setup(full);
            if (setup && typeof setup.then === 'function') {
                void Promise.resolve(setup).then(() => {
                    entry.ready = true;
                    if (disposed)
                        cleanup(entry);
                }, (error) => {
                    entry.ready = true;
                    cleanup(entry);
                    console.warn(`[teluala] Plugin "${plugin.name}" setup failed`, error);
                });
            }
            else
                entry.ready = true;
        }
        catch (error) {
            entry.ready = true;
            cleanup(entry);
            console.warn(`[teluala] Plugin "${plugin.name}" setup failed`, error);
        }
    }
    return {
        dispose() {
            if (disposed)
                return;
            disposed = true;
            for (const entry of live)
                if (entry.ready)
                    cleanup(entry);
        },
    };
}

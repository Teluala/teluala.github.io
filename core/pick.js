/*!
 * Copyright (c) 2026 The Teluala Authors
 * SPDX-License-Identifier: MIT
 */
/**
 * Build a view-projection matrix that maps one viewport pixel onto a 1x1 target.
 * nx and ny are the selected point in normalized device coordinates.
 */
export function pickViewProjection(vp, nx, ny, viewportWidth, viewportHeight) {
    if (!(vp instanceof Float32Array || vp instanceof Float64Array) || vp.length !== 16) {
        throw new TypeError('vp must be a 16-value Float32Array or Float64Array');
    }
    if (![nx, ny, viewportWidth, viewportHeight].every(Number.isFinite)) {
        throw new TypeError('pick coordinates and viewport dimensions must be finite');
    }
    if (viewportWidth <= 0 || viewportHeight <= 0) {
        throw new RangeError('pick viewport dimensions must be positive');
    }
    const result = new vp.constructor(16);
    for (let column = 0; column < 4; column++) {
        const offset = column * 4;
        result[offset] = viewportWidth * (vp[offset] - nx * vp[offset + 3]);
        result[offset + 1] = viewportHeight * (vp[offset + 1] - ny * vp[offset + 3]);
        result[offset + 2] = vp[offset + 2];
        result[offset + 3] = vp[offset + 3];
    }
    return result;
}

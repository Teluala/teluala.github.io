/*!
 * Copyright (c) 2026 The Teluala Authors
 * SPDX-License-Identifier: MIT
 */
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
/** World units per CSS pixel at the look-at point: the frustum height at the
 * camera target divided by the viewport's CSS height. */
export function worldPerCssPixel(frame) {
    return ((2 * frame.camera.range * Math.tan(frame.fovYRad / 2)) /
        (frame.viewportPx.height / (frame.viewportPx.dpr || 1)));
}
/** World units per sampled pixel: the CSS resolution refined by `detail`. */
function worldPerSampleOf(frame, detail) {
    const resolved = detail ?? Math.log2(frame.viewportPx.dpr || 1);
    if (!Number.isFinite(resolved))
        throw new RangeError('detail must be finite');
    return worldPerCssPixel(frame) / 2 ** resolved;
}
/** Select the visible cells of a scheme for a frame, nearest to the look-at point first. */
export function selectTiles(frame, scheme, options) {
    const { minLevel, maxLevel, maxCells, detail } = options;
    const bbox = frame.viewBBox;
    if (!bbox)
        return [];
    if (!Number.isFinite(frame.camera?.lon) ||
        !Number.isFinite(frame.camera?.lat) ||
        !Number.isFinite(frame.camera?.range) ||
        frame.camera.range <= 0) {
        throw new RangeError('FrameState camera must contain a positive range and finite coordinates');
    }
    if (!Number.isFinite(frame.fovYRad) || frame.fovYRad <= 0 || frame.fovYRad >= Math.PI) {
        throw new RangeError('FrameState fovYRad must be within 0..PI');
    }
    if (!Number.isFinite(frame.viewportPx?.height) || frame.viewportPx.height <= 0) {
        throw new RangeError('FrameState viewport height must be positive');
    }
    const lookAt = { lon: frame.camera.lon, lat: frame.camera.lat };
    let level = clamp(scheme.levelFor(worldPerSampleOf(frame, detail)), minLevel, maxLevel);
    while (level > minLevel && scheme.cover(bbox, lookAt, level).count > maxCells)
        level--;
    const candidates = [...scheme.cover(bbox, lookAt, level).cells()];
    candidates.sort((a, b) => a.distance - b.distance);
    return candidates.slice(0, maxCells).map(({ cell }) => cell);
}
/** Continuous Web Mercator zoom at which a tile edge of `tileSize` pixels
 * spans that many sampled pixels; the scheme picks the nearest integer. */
function webMercatorZoomOf(worldPerSample, tileSize) {
    return Math.log2((2 * Math.PI) / (tileSize * worldPerSample));
}
/** Continuous Web Mercator zoom of a frame under the given tile size and
 * detail (defaults as in selection). `{ detail: 0 }` is the map zoom in CSS
 * pixels that data conventions use; the default is the zoom the selection
 * rounds to pick a level. */
export function webMercatorZoom(frame, options = {}) {
    const { tileSize, detail } = resolveWebMercatorTileOptions(options);
    return webMercatorZoomOf(worldPerSampleOf(frame, detail), tileSize);
}
/** Inverse of webMercatorZoom(): the camera range at which a frame with this
 * viewport, field of view and dpr sits exactly at `zoom`. With the defaults
 * this is the range where selectWebMercatorTiles() picks that level before
 * the maxTiles budget coarsens it. */
export function webMercatorRangeForZoom(frame, zoom, options = {}) {
    if (!Number.isFinite(zoom))
        throw new RangeError('zoom must be finite');
    const { tileSize, detail } = resolveWebMercatorTileOptions(options);
    const resolvedDetail = detail ?? Math.log2(frame.viewportPx.dpr || 1);
    const worldPerSample = (2 * Math.PI) / (tileSize * 2 ** zoom);
    const cssHeight = frame.viewportPx.height / (frame.viewportPx.dpr || 1);
    return (worldPerSample * 2 ** resolvedDetail * cssHeight) / (2 * Math.tan(frame.fovYRad / 2));
}
/** Reject a tile address that no XYZ source can serve: non-integer
 * coordinates (TypeError), a zoom outside 0..maxZoom, or x/y outside the
 * 2^z grid (RangeError). One check for every package that names tiles. */
export function assertWebMercatorTile(z, x, y, maxZoom = 30) {
    if (![z, x, y].every(Number.isInteger))
        throw new TypeError('tile coordinates must be integers');
    if (z < 0 || z > maxZoom)
        throw new RangeError(`tile zoom must be 0..${maxZoom}`);
    const width = 2 ** z;
    if (x < 0 || y < 0 || x >= width || y >= width) {
        throw new RangeError(`tile is outside zoom ${z}: ${x}/${y}`);
    }
}
/** Latitude where the Web Mercator square ends. */
export const WEB_MERCATOR_MAX_LATITUDE = 85.0511287798066;
/** Normalised Web Mercator y in [0, 1], north to south. */
export function webMercatorY(latitude) {
    const radians = (clamp(latitude, -WEB_MERCATOR_MAX_LATITUDE, WEB_MERCATOR_MAX_LATITUDE) * Math.PI) / 180;
    return (1 - Math.asinh(Math.tan(radians)) / Math.PI) / 2;
}
function unwrapLongitude(longitude, center) {
    return center + (((longitude - center + 540) % 360) - 180);
}
/** Web Mercator XYZ as a TileScheme: level is the zoom, a cell is {z, x, y},
 * and candidate distance is measured in tile units at that zoom. */
export function webMercatorScheme(tileSize) {
    return {
        levelFor(worldPerSample) {
            return Math.round(webMercatorZoomOf(worldPerSample, tileSize));
        },
        cover(bounds, lookAt, zoom) {
            const west = unwrapLongitude(bounds.west, lookAt.lon);
            let east = unwrapLongitude(bounds.east, lookAt.lon);
            if (east < west)
                east += 360;
            const south = clamp(bounds.south, -WEB_MERCATOR_MAX_LATITUDE, WEB_MERCATOR_MAX_LATITUDE);
            const north = clamp(bounds.north, -WEB_MERCATOR_MAX_LATITUDE, WEB_MERCATOR_MAX_LATITUDE);
            const width = 2 ** zoom;
            const x0 = Math.floor(((west + 180) / 360) * width);
            const x1 = Math.floor(((east + 180) / 360) * width);
            const y0 = clamp(Math.floor(webMercatorY(north) * width), 0, width - 1);
            const y1 = clamp(Math.floor(webMercatorY(south) * width), 0, width - 1);
            const xCount = Math.min(width, x1 - x0 + 1);
            const xLast = x0 + xCount - 1;
            return {
                count: xCount * (y1 - y0 + 1),
                *cells() {
                    const centerX = ((lookAt.lon + 180) / 360) * width;
                    const centerY = webMercatorY(lookAt.lat) * width;
                    for (let y = y0; y <= y1; y++) {
                        for (let rawX = x0; rawX <= xLast; rawX++) {
                            yield {
                                cell: { z: zoom, x: ((rawX % width) + width) % width, y },
                                distance: (rawX + 0.5 - centerX) ** 2 + (y + 0.5 - centerY) ** 2,
                            };
                        }
                    }
                },
            };
        },
    };
}
/** Apply the defaults and reject impossible ranges. Exposed so a layer can
 * fail at construction and derive its own limits from the resolved values. */
export function resolveWebMercatorTileOptions(options = {}) {
    const minZoom = options.minZoom ?? 0;
    const maxZoom = options.maxZoom ?? 22;
    const tileSize = options.tileSize ?? 256;
    const maxTiles = options.maxTiles ?? 64;
    if (![minZoom, maxZoom].every(Number.isInteger) ||
        minZoom < 0 ||
        maxZoom > 30 ||
        minZoom > maxZoom) {
        throw new RangeError('tile zoom range must be integer values within 0..30');
    }
    if (!Number.isFinite(tileSize) || tileSize <= 0) {
        throw new RangeError('tileSize must be positive');
    }
    if (!Number.isInteger(maxTiles) || maxTiles < 1) {
        throw new RangeError('maxTiles must be a positive integer');
    }
    if (options.detail !== undefined && !Number.isFinite(options.detail)) {
        throw new RangeError('detail must be finite');
    }
    return { minZoom, maxZoom, tileSize, maxTiles, detail: options.detail };
}
/** Select the visible Web Mercator tiles for a frame, nearest to the look-at point first. */
export function selectWebMercatorTiles(frame, options = {}) {
    const { minZoom, maxZoom, tileSize, maxTiles, detail } = resolveWebMercatorTileOptions(options);
    return selectTiles(frame, webMercatorScheme(tileSize), {
        minLevel: minZoom,
        maxLevel: maxZoom,
        maxCells: maxTiles,
        detail,
    });
}

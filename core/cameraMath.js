/*!
 * Copyright (c) 2026 The Teluala Authors
 * SPDX-License-Identifier: MIT
 */
import { mul4, perspectiveZ01, lookAt, v3, ecef, geodeticNormal, WGS84_A, } from './math3d.js';
export const FOV = 45 * (Math.PI / 180);
/** The near-plane policy every camera starts from: near = max(range * 0.25, 7.5e-6 ≈ 48 m); 7.5e-6 = 0.25 × the 3e-5 range floor. */
export const DEFAULT_NEAR_POLICY = { nearScale: 0.25, nearMin: 7.5e-6 };
/** near = max(range * scale(range), nearMin) (defaults DEFAULT_NEAR_POLICY); far reaches past the horizon. */
export function nearFar(range, policy) {
    const nearScale = policy?.nearScale ?? DEFAULT_NEAR_POLICY.nearScale, nearMin = policy?.nearMin ?? DEFAULT_NEAR_POLICY.nearMin;
    let scale = nearScale;
    const closeNearScale = policy?.closeNearScale;
    if (closeNearScale !== undefined) {
        const closeRange = policy?.closeRange ?? 0, farRange = Math.max(policy?.farRange ?? closeRange * 10, closeRange);
        if (range <= closeRange)
            scale = closeNearScale;
        else if (range < farRange) {
            const t = (Math.log(range) - Math.log(closeRange)) / (Math.log(farRange) - Math.log(closeRange));
            scale = closeNearScale + (nearScale - closeNearScale) * t;
        }
    }
    const altC = Math.max(1e-5, range);
    const horizon = Math.sqrt(2 * WGS84_A * altC + altC * altC);
    return { near: Math.max(range * scale, nearMin), far: range + horizon + 0.08 * WGS84_A };
}
function viewBasis(c, targetAlt = 0) {
    const t = ecef(c.lon, c.lat, targetAlt);
    const up = geodeticNormal(c.lon, c.lat);
    const east = v3.norm(v3.cross([0, 0, 1], up));
    const north = v3.cross(up, east);
    const chd = Math.cos(c.heading), shd = Math.sin(c.heading);
    const cp = Math.cos(c.pitch), sp = Math.sin(c.pitch);
    const dir = [
        cp * (chd * north[0] + shd * east[0]) + sp * up[0],
        cp * (chd * north[1] + shd * east[1]) + sp * up[1],
        cp * (chd * north[2] + shd * east[2]) + sp * up[2],
    ];
    return { t, up, east, north, chd, shd, dir };
}
export function cameraEye(c, targetAlt = 0) {
    const { t, dir } = viewBasis(c, targetAlt);
    return [t[0] - dir[0] * c.range, t[1] - dir[1] * c.range, t[2] - dir[2] * c.range];
}
/** Eye, look-at target and the (near-vertical / roll adjusted) up hint shared by the view matrix and the NDC rays. */
function viewFrame(c, targetAlt = 0) {
    const { t, up, east, north, chd, shd, dir } = viewBasis(c, targetAlt);
    const eye = [t[0] - dir[0] * c.range, t[1] - dir[1] * c.range, t[2] - dir[2] * c.range];
    const upHint = c.pitch < -Math.PI / 2 + 0.05
        ? [
            chd * north[0] + shd * east[0],
            chd * north[1] + shd * east[1],
            chd * north[2] + shd * east[2],
        ]
        : up;
    let finalUp = upHint;
    if (c.roll) {
        const k = v3.norm(dir), cr = Math.cos(c.roll), sr = Math.sin(c.roll);
        const kv = v3.cross(k, upHint);
        const kd = k[0] * upHint[0] + k[1] * upHint[1] + k[2] * upHint[2];
        finalUp = [
            upHint[0] * cr + kv[0] * sr + k[0] * kd * (1 - cr),
            upHint[1] * cr + kv[1] * sr + k[1] * kd * (1 - cr),
            upHint[2] * cr + kv[2] * sr + k[2] * kd * (1 - cr),
        ];
    }
    return { eye, t, up: finalUp };
}
export function cameraViewProj(c, aspect, targetAlt = 0, near) {
    const { eye, t, up } = viewFrame(c, targetAlt);
    const nf = nearFar(c.range, near);
    return mul4(perspectiveZ01(FOV, aspect, nf.near, nf.far), lookAt(eye, t, up));
}
/** Precomputes the camera basis once so many rays (e.g. a view-bounds grid) share the trigonometry. */
export function cameraRayCaster(c, aspect, targetAlt = 0) {
    const { eye, t, up } = viewFrame(c, targetAlt);
    const back = v3.norm(v3.sub(eye, t));
    const right = v3.norm(v3.cross(up, back));
    const camUp = v3.cross(back, right);
    const k = Math.tan(FOV / 2), ka = k * aspect;
    return (nx, ny) => {
        const kx = nx * ka, ky = ny * k;
        return {
            origin: eye,
            dir: v3.norm([
                kx * right[0] + ky * camUp[0] - back[0],
                kx * right[1] + ky * camUp[1] - back[1],
                kx * right[2] + ky * camUp[2] - back[2],
            ]),
        };
    };
}
export function cameraRay(c, aspect, nx, ny, targetAlt = 0) {
    return cameraRayCaster(c, aspect, targetAlt)(nx, ny);
}
export function regionScreenPixels(vp, widthPx, heightPx, dpr, west, south, east, north) {
    const lonlat = [
        [west, south],
        [east, south],
        [east, north],
        [west, north],
    ];
    const clip = lonlat.map(([lon, lat]) => {
        const p = ecef(lon, lat, 0);
        return [
            vp[0] * p[0] + vp[4] * p[1] + vp[8] * p[2] + vp[12],
            vp[1] * p[0] + vp[5] * p[1] + vp[9] * p[2] + vp[13],
            vp[3] * p[0] + vp[7] * p[1] + vp[11] * p[2] + vp[15],
        ];
    });
    const EPS = 1e-6;
    const poly = [];
    for (let i = 0; i < clip.length; i++) {
        const a = clip[i], b = clip[(i + 1) % clip.length];
        const aIn = a[2] > EPS, bIn = b[2] > EPS;
        if (aIn)
            poly.push(a);
        if (aIn !== bIn) {
            const t = (EPS - a[2]) / (b[2] - a[2]);
            poly.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, EPS]);
        }
    }
    if (poly.length < 3)
        return null;
    const sx = [], sy = [];
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [cx, cy, cw] of poly) {
        const x = ((cx / cw) * 0.5 + 0.5) * widthPx;
        const y = (0.5 - (cy / cw) * 0.5) * heightPx;
        sx.push(x);
        sy.push(y);
        if (x < minX)
            minX = x;
        if (x > maxX)
            maxX = x;
        if (y < minY)
            minY = y;
        if (y > maxY)
            maxY = y;
    }
    if (maxX < 0 || minX > widthPx || maxY < 0 || minY > heightPx)
        return null;
    let area2 = 0;
    for (let i = 0; i < sx.length; i++) {
        const j = (i + 1) % sx.length;
        area2 += sx[i] * sy[j] - sx[j] * sy[i];
    }
    return Math.sqrt(Math.abs(area2) / 2) / dpr;
}

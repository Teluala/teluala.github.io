/*!
 * Copyright (c) 2026 The Teluala Authors
 * SPDX-License-Identifier: MIT
 */
import { GlobeEngine } from './core/index.js';

// Camera targets for the example buttons under the core demo.
const examples = {
  create: { lon: 0, lat: 20, range: 2.4, heading: 0, pitch: -Math.PI / 2 },
  fly: { lon: 0, lat: 0, range: 1.8, heading: 0, pitch: -Math.PI / 2 },
};
const $ = (selector) => document.querySelector(selector);
const loading = $('#loading');
const buttons = [...document.querySelectorAll('[data-example]')];
const tabs = [...document.querySelectorAll('[data-demo]')];
const labels = {
  core: ['WGS84 ellipsoid', 'Core only · no basemap'],
};
let globe, dispose, generation = 0;

for (const button of buttons) {
  button.addEventListener('click', () => {
    const key = button.dataset.example;
    buttons.forEach((b) => {
      const selected = b === button;
      b.classList.toggle('selected', selected);
      b.setAttribute('aria-pressed', String(selected));
    });
    if (!globe) return;
    globe.cancelFly();
    if (key === 'orbit') {
      globe.camera.heading = Math.PI / 4;
      globe.camera.pitch = -Math.PI / 3;
      globe.invalidate();
    } else {
      globe.flyTo(examples[key], matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1500);
    }
  });
}

// Resolve CSS color tokens into normalized channels for the WebGPU options.
function themeOptions() {
  const styles = getComputedStyle(document.documentElement);
  const swatch = document.createElement('canvas').getContext('2d');
  const rgb = (name) => {
    swatch.fillStyle = styles.getPropertyValue(name).trim();
    swatch.fillRect(0, 0, 1, 1);
    return [...swatch.getImageData(0, 0, 1, 1).data].slice(0, 3).map((c) => c / 255);
  };
  const [r, g, b] = rgb('--color-deep');
  return { background: { r, g, b }, earthColor: rgb('--color-globe') };
}

function setCredit(credit = []) {
  const node = $('#demo-credit');
  node.replaceChildren();
  for (const [text, href] of credit) {
    const link = document.createElement('a');
    link.href = href;
    link.textContent = text;
    node.append(link, ' ');
  }
}

// Each demo gets a fresh canvas: a WebGPU context belongs to one device.
function freshCanvas() {
  const old = $('#globe');
  const canvas = old.cloneNode(false);
  old.replaceWith(canvas);
  return canvas;
}

async function show(name) {
  const mine = ++generation;
  tabs.forEach((tab) => tab.setAttribute('aria-selected', String(tab.dataset.demo === name)));
  $('#view-controls').hidden = name !== 'core';
  globe?.destroy();
  dispose?.();
  globe = dispose = undefined;
  loading.hidden = false;
  loading.textContent = 'Loading…';
  setCredit();
  $('#pick-status').textContent = 'Click the globe to read coordinates.';
  const canvas = freshCanvas();
  try {
    let demo;
    if (name === 'core') {
      demo = { globe: await GlobeEngine.create(canvas, themeOptions()), caption: labels.core };
    } else {
      const module = await import(`./demos/${name}.js`);
      demo = await module.start(canvas, themeOptions());
    }
    if (mine !== generation) {
      demo.globe.destroy();
      demo.dispose?.();
      return;
    }
    ({ globe, dispose } = demo);
    const [caption, detail] = Array.isArray(demo.caption) ? demo.caption : demo.caption.split(' · ');
    $('#demo-caption').textContent = caption;
    $('#demo-package').textContent = detail ?? '';
    setCredit(demo.credit);
    globe.onPick = ({ lon, lat }) => {
      $('#pick-status').textContent = `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'} / ${Math.abs(lon).toFixed(4)}° ${lon >= 0 ? 'E' : 'W'}`;
    };
    loading.hidden = true;
    document.body.dataset.demo = 'ready';
    document.body.dataset.demoName = name;
    buttons.forEach((button) => { button.disabled = false; });
  } catch (error) {
    if (mine !== generation) return;
    loading.textContent = GlobeEngine.supported()
      ? `The ${name} demo could not start: ${error.message}`
      : 'This browser could not start WebGPU. Try a compatible browser and GPU on HTTPS or localhost.';
    document.body.dataset.demo = 'unavailable';
    buttons.forEach((button) => { button.hidden = true; });
  }
}

for (const tab of tabs) tab.addEventListener('click', () => show(tab.dataset.demo));
show('core');
window.addEventListener('pagehide', (event) => {
  if (!event.persisted) {
    globe?.destroy();
    dispose?.();
  }
});

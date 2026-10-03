/*!
 * Copyright (c) 2026 The Teluala Authors
 * SPDX-License-Identifier: MIT
 */
// Right-click (or the context-menu key) on a header logo marked with
// data-brand-menu opens a small menu with the brand kit and logo files.
// data-brand-base is the relative path from the page to the site root.

const KIT_SIZE = '1.3 MB';

function buildMenu(base) {
  const menu = document.createElement('div');
  menu.className = 'brand-menu';
  menu.setAttribute('role', 'menu');
  menu.setAttribute('aria-label', 'Brand assets');
  menu.hidden = true;
  const items = [
    ['Download brand kit', `ZIP · ${KIT_SIZE}`, `${base}downloads/teluala-brand-kit.zip`, true],
    ['Logo, white', 'SVG', `${base}assets/svg/logo-horizontal-white.svg`, true],
    ['Logo, black', 'SVG', `${base}assets/svg/logo-horizontal-black.svg`, true],
    ['Brand guidelines', '→', `${base}brand/`, false],
  ];
  const heading = document.createElement('p');
  heading.textContent = 'Teluala brand assets';
  menu.append(heading);
  for (const [label, detail, href, download] of items) {
    const link = document.createElement('a');
    link.href = href;
    link.setAttribute('role', 'menuitem');
    if (download) link.setAttribute('download', '');
    const note = document.createElement('span');
    note.textContent = detail;
    link.append(label, note);
    menu.append(link);
  }
  document.body.append(menu);
  return menu;
}

for (const logo of document.querySelectorAll('[data-brand-menu]')) {
  const menu = buildMenu(logo.dataset.brandBase ?? '');
  const links = () => [...menu.querySelectorAll('a')];
  const close = (restoreFocus) => {
    if (menu.hidden) return;
    menu.hidden = true;
    if (restoreFocus) logo.focus();
  };
  logo.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    menu.hidden = false;
    // The context-menu key reports (0, 0); anchor the menu to the logo then.
    const box = logo.getBoundingClientRect();
    const fromPointer = event.clientX || event.clientY;
    const x = fromPointer ? event.clientX : box.left;
    const y = fromPointer ? event.clientY : box.bottom;
    menu.style.left = `${Math.min(x, innerWidth - menu.offsetWidth - 8)}px`;
    menu.style.top = `${Math.min(y, innerHeight - menu.offsetHeight - 8)}px`;
    links()[0].focus();
  });
  menu.addEventListener('keydown', (event) => {
    const list = links();
    const index = list.indexOf(document.activeElement);
    if (event.key === 'Escape') close(true);
    else if (event.key === 'ArrowDown') list[(index + 1) % list.length].focus();
    else if (event.key === 'ArrowUp') list[(index - 1 + list.length) % list.length].focus();
    else if (event.key === 'Tab') return close(false);
    else return;
    event.preventDefault();
  });
  menu.addEventListener('click', () => close(false));
  document.addEventListener('pointerdown', (event) => {
    if (!menu.contains(event.target)) close(false);
  });
  addEventListener('scroll', () => close(false), { passive: true });
  addEventListener('resize', () => close(false));
}

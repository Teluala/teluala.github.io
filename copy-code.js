/*!
 * Copyright (c) 2026 The Teluala Authors
 * SPDX-License-Identifier: MIT
 */
// Shows the copy button on every code block and copies the block's text.
const status = document.querySelector('#copy-status');
for (const button of document.querySelectorAll('.code > .copy')) {
  const code = button.nextElementSibling.textContent;
  let timer;
  button.hidden = false;
  button.addEventListener('click', async () => {
    clearTimeout(timer);
    try {
      await navigator.clipboard.writeText(code);
      button.textContent = 'Copied';
      status.textContent = 'Code copied.';
    } catch {
      status.textContent = 'Copy unavailable. Select the code and copy it manually.';
    }
    timer = setTimeout(() => {
      button.textContent = 'Copy';
      status.textContent = '';
    }, 2500);
  });
}

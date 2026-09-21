// Runs before stylesheets to apply a saved preference without a light flash.
(function () {
  const key = 'wireless-lab-color-mode';
  const valid = (value) => ['light', 'dark', 'system'].includes(value) ? value : 'system';
  function apply(value) {
    const mode = valid(value);
    document.documentElement.dataset.colorMode = mode;
    document.querySelectorAll('[data-color-mode-select]').forEach((select) => { select.value = mode; });
  }
  function read() {
    try { return valid(window.localStorage.getItem(key)); }
    catch (_) { return 'system'; }
  }
  apply(read());
  function updateFromControl(event) {
    if (!event.target || !event.target.matches || !event.target.matches('[data-color-mode-select]')) return;
    const mode = valid(event.target.value);
    apply(mode);
    try { window.localStorage.setItem(key, mode); } catch (_) { /* Keep session choice. */ }
  }
  // Some mobile browsers update native select controls through `input` before
  // dispatching `change`; accept both so the palette updates immediately.
  document.addEventListener('input', updateFromControl);
  document.addEventListener('change', updateFromControl);
  window.addEventListener('storage', (event) => {
    if (event.key === key || event.key === null) apply(read());
  });
  document.addEventListener('DOMContentLoaded', () => apply(document.documentElement.dataset.colorMode));
  // System changes are handled live by prefers-color-scheme in CSS, including
  // when JavaScript or storage is unavailable. No OS setting is changed.
})();

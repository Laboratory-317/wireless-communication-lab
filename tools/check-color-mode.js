// Behaviour checks for early initialization, persistence and blocked storage.
const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');
const path = require('path');
const source = fs.readFileSync(path.join(__dirname, '../js/color-mode.js'), 'utf8');
function boot(saved, blocked = false) {
  const handlers = {};
  const dataset = {};
  const select = { value: '', matches: (selector) => selector === '[data-color-mode-select]' };
  const store = new Map([['wireless-lab-color-mode', saved]]);
  const document = {
    documentElement: { dataset }, querySelectorAll: () => [select],
    addEventListener: (event, callback) => { handlers[event] = callback; }
  };
  const window = {
    localStorage: {
      getItem: (key) => { if (blocked) throw Error('blocked'); return store.get(key); },
      setItem: (key, value) => { if (blocked) throw Error('blocked'); store.set(key, value); }
    },
    addEventListener: (event, callback) => { handlers[event] = callback; }
  };
  vm.runInNewContext(source, { document, window });
  return { dataset, select, store, handlers };
}
for (const mode of ['light', 'dark', 'system']) {
  const run = boot(mode);
  assert.equal(run.dataset.colorMode, mode);
  assert.equal(run.select.value, mode);
}
for (const value of [null, undefined, '', 'invalid']) assert.equal(boot(value).dataset.colorMode, 'system');
const normal = boot(null);
normal.select.value = 'dark'; normal.handlers.change({ target: normal.select });
assert.equal(normal.store.get('wireless-lab-color-mode'), 'dark');
normal.handlers.DOMContentLoaded();
assert.equal(normal.dataset.colorMode, 'dark');
normal.store.set('wireless-lab-color-mode', 'light'); normal.handlers.storage({ key: 'wireless-lab-color-mode' });
assert.equal(normal.dataset.colorMode, 'light');
normal.store.clear(); normal.handlers.storage({ key: null });
assert.equal(normal.dataset.colorMode, 'system');
normal.handlers.change({ target: { matches: () => false } });
assert.equal(normal.dataset.colorMode, 'system');
const blocked = boot('dark', true);
assert.equal(blocked.dataset.colorMode, 'system');
blocked.select.value = 'light'; blocked.handlers.change({ target: blocked.select });
assert.equal(blocked.dataset.colorMode, 'light');
console.log('Passed: color preference defaults, early initialization, persistence, cross-tab changes and blocked storage.');

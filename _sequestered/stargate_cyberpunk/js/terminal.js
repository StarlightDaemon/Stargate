// KV OPTERM 220 — amber phosphor log.

import { on, S } from './state.js';
import { after } from './clock.js';
import { AMBIENT_LINES } from './data.js';

let box, shell;
const MAX = 140;

export function initTerminal() {
  box = document.getElementById('crtLines');
  shell = document.getElementById('crt');
  on('line', print);

  print('KV OPTERM 220 — salvage firmware "dead ringer" b.11', 'dim');
  print('no credentials loaded. that has never stopped us.', 'dim');
  print('ring A7-113 cold. rig idle.', 'dim');

  scheduleAmbient();
}

export function print(text, cls = '') {
  const d = document.createElement('div');
  d.className = 'ln ' + cls;
  d.textContent = text;
  box.appendChild(d);
  while (box.children.length > MAX) box.removeChild(box.firstChild);
  shell.scrollTop = shell.scrollHeight;
}

let ambIdx = 0;
function scheduleAmbient() {
  after(21000 + (ambIdx * 7919) % 17000, () => {
    if (S.phase === 'idle') print(AMBIENT_LINES[ambIdx % AMBIENT_LINES.length], 'dim amb');
    ambIdx++;
    scheduleAmbient();
  });
}

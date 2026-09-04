import { spawn } from 'child_process';
import http from 'http';
import { existsSync } from 'fs';

// Browser resolution. No absolute local filesystem path is committed here:
// CHROME_PATH (or PUPPETEER_EXECUTABLE_PATH) wins, otherwise puppeteer's own
// executable path is used. Anything else is an explicit error.
async function resolveChrome() {
  const fromEnv = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH;
  if (fromEnv) return fromEnv;
  let why;
  try {
    const puppeteer = (await import('puppeteer').catch(() => import('puppeteer-core'))).default;
    const p = await puppeteer.executablePath();
    if (p && existsSync(p)) return p;
    why = p ? `puppeteer's executable path does not exist: ${p}` : 'puppeteer reported no executable path';
  } catch (e) {
    why = `puppeteer could not resolve an executable path (${e.message})`;
  }
  throw new Error(`No browser found: ${why}. Set CHROME_PATH to a Chrome/Chromium executable.`);
}
const PORT = 9225;

async function test() {
  const CHROME_PATH = await resolveChrome();
  const p = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1500));
  const res = await fetch(`http://localhost:${PORT}/json`);
  const targets = await res.json();
  const page = targets.find(t => t.type === 'page');

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  ws.onopen = () => {
    ws.send(JSON.stringify({ id: 1, method: 'Page.enable' }));
    ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));
    ws.send(JSON.stringify({ id: 3, method: 'Page.navigate', params: { url: 'http://localhost:8080' } }));
  };

  ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    if (data.method === 'Runtime.consoleAPICalled') {
      console.log('CONSOLE:', data.params.args.map(a => a.value || JSON.stringify(a)).join(' '));
    }
    if (data.method === 'Runtime.exceptionThrown') {
      console.error('EXCEPTION THROWN:', JSON.stringify(data.params.exceptionDetails, null, 2));
    }
    if (data.method === 'Page.loadEventFired') {
      setTimeout(() => {
        ws.send(JSON.stringify({
          id: 4,
          method: 'Runtime.evaluate',
          params: {
            expression: `({
              btns: document.querySelectorAll('.star-select-btn').length,
              starBox: document.getElementById('star-buttons-container').outerHTML,
              appJsError: window.__error
            })`,
            returnByValue: true
          }
        }));
      }, 500);
    }
    if (data.id === 4) {
      console.log('EVAL RESULT:', data.result);
      p.kill();
      process.exit(0);
    }
  };
}

test();

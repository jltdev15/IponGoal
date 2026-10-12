// Operates only on the isolated goal details preview in the dedicated QA emulator.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const adb = require('../scripts/android-sdk.cjs').adbPath();
const root = path.resolve(__dirname, '..');
const run = args =>
  execFileSync(adb, ['-s', 'emulator-5556', ...args], {
    timeout: 30000,
    windowsHide: true,
  });
const [action, value] = process.argv.slice(2);
function scroll(items) {
  const viewport = items.find(item => item.scrollable === 'true');
  if (!viewport) throw new Error('No scrollable viewport');
  const [left, top, right, bottom] = viewport.bounds.match(/\d+/g).map(Number);
  run(['shell', 'input', 'swipe', String(Math.round((left + right) / 2)), String(Math.round(top + (bottom - top) * 0.8)), String(Math.round(top + (bottom - top) * 0.2)), '450']);
}
function nodes() {
  run([
    'shell',
    'uiautomator',
    'dump',
    '/data/local/tmp/goal-details.xml',
  ]);
  const xml = run([
    'shell',
    'cat',
    '/data/local/tmp/goal-details.xml',
  ]).toString();
  if (!xml.includes('package="com.ipongoal.goaldetailsqa"')) {
    throw new Error('The isolated goal details preview must be foreground.');
  }
  return [...xml.matchAll(/<node\b[^>]+>/g)].map(match =>
    Object.fromEntries(
      [...match[0].matchAll(/([\w-]+)="([^"]*)"/g)].map(attribute => [
        attribute[1],
        attribute[2],
      ]),
    ),
  );
}
if (action === 'install') {
  console.log(
    run([
      'install',
      '-r',
      path.join(root, 'android/app/build/outputs/apk/debug/app-debug.apk'),
    ]).toString(),
  );
} else if (action === 'launch') {
  run(['shell', 'am', 'force-stop', 'com.ipongoal.goaldetailsqa']);
  console.log(
    run([
      'shell',
      'am',
      'start',
      '-W',
      '-n',
      'com.ipongoal.goaldetailsqa/com.ipongoal.MainActivity',
    ]).toString(),
  );
} else if (action === 'tap' || action === 'seek') {
  const matches = item => {
    const [left, top, right, bottom] = item.bounds.match(/\d+/g).map(Number);
    return right > left && bottom > top && item.clickable === 'true' && (item.text === value || item['content-desc'] === value);
  };
  let items = nodes();
  for (let attempt = 0; action === 'seek' && !items.some(matches) && attempt < 8; attempt++) {
    scroll(items);
    items = nodes();
  }
  const node = items.find(matches);
  if (!node) throw new Error('Visible button not found: ' + value);
  const [left, top, right, bottom] = node.bounds.match(/\d+/g).map(Number);
  run([
    'shell',
    'input',
    'tap',
    String(Math.round((left + right) / 2)),
    String(Math.round((top + bottom) / 2)),
  ]);
} else if (action === 'shot') {
  nodes();
  if (!/^[a-z0-9-]+$/.test(value)) throw new Error('Invalid screenshot name');
  fs.writeFileSync(
    path.join(root, 'docs/screenshots', value + '.png'),
    run(['exec-out', 'screencap', '-p']),
  );
} else if (action === 'read') {
  console.log(
    nodes()
      .filter(item => item.text || item['content-desc'])
      .map(item => ({
        label: item['content-desc'] || item.text,
        bounds: item.bounds,
      })),
  );
} else if (action === 'back') {
  nodes();
  run(['shell', 'input', 'keyevent', '4']);
} else if (action === 'scroll') {
  scroll(nodes());
} else if (action === 'small') {
  run(['shell', 'wm', 'size', '960x1704']);
  run(['shell', 'settings', 'put', 'system', 'font_scale', '1.5']);
} else if (action === 'restore') {
  run(['shell', 'wm', 'size', 'reset']);
  run(['shell', 'settings', 'put', 'system', 'font_scale', '1']);
} else throw new Error('Unknown QA action');


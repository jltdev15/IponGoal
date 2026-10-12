// Operates only on the isolated welcome preview in the dedicated QA emulator.
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
function nodes() {
  run([
    'shell',
    'uiautomator',
    'dump',
    '/data/local/tmp/onboarding-background.xml',
  ]);
  const xml = run([
    'shell',
    'cat',
    '/data/local/tmp/onboarding-background.xml',
  ]).toString();
  if (!xml.includes('package="com.ipongoal.welcomeqa"')) {
    throw new Error('The isolated welcome preview must be foreground.');
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
  run(['shell', 'am', 'force-stop', 'com.ipongoal.welcomeqa']);
  console.log(
    run([
      'shell',
      'am',
      'start',
      '-W',
      '-n',
      'com.ipongoal.welcomeqa/com.ipongoal.MainActivity',
    ]).toString(),
  );
} else if (action === 'tap') {
  const node = nodes().find(
    item =>
      item.clickable === 'true' &&
      (item.text === value || item['content-desc'] === value),
  );
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
} else if (action === 'small') {
  run(['shell', 'wm', 'size', '960x1704']);
  run(['shell', 'settings', 'put', 'system', 'font_scale', '1.5']);
} else if (action === 'restore') {
  run(['shell', 'wm', 'size', 'reset']);
  run(['shell', 'settings', 'put', 'system', 'font_scale', '1']);
} else throw new Error('Unknown QA action');

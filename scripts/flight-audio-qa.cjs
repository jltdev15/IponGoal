// Device-only helper for the isolated Flight QA package; never accesses app data.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const root = path.resolve(__dirname, '..');
const adb = require('./android-sdk.cjs').adbPath();
const run = args =>
  execFileSync(adb, args, { timeout: 20000, windowsHide: true });
const [action = 'read', value] = process.argv.slice(2);
if (action === 'shot') {
  if (!/^[a-z0-9-]+$/.test(value))
    throw new Error('Use a simple screenshot name');
  fs.writeFileSync(
    path.join(root, 'docs/screenshots', value + '.png'),
    run(['exec-out', 'screencap', '-p']),
  );
} else {
  function readNodes() {
    const dumped = run([
      'shell',
      'uiautomator',
      'dump',
      '/sdcard/flight-audio-ui.xml',
    ]).toString();
    if (!dumped.includes('UI hierchary dumped'))
      throw new Error('UI dump failed; refusing to use stale controls');
    const xml = run(['shell', 'cat', '/sdcard/flight-audio-ui.xml']).toString();
    if (!xml.includes('package="com.ipongoal.flightpolishqa"'))
      throw new Error('Flight QA is not foreground');
    return [...xml.matchAll(/<node\b[^>]+>/g)].map(match =>
      Object.fromEntries(
        [...match[0].matchAll(/([\w-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]),
      ),
    );
  }
  let nodes = readNodes();
  if (action === 'tap' || action === 'seek') {
    const matches = n => {
      if (n['content-desc'] !== value && n.text !== value) return false;
      const [x1, y1, x2, y2] = n.bounds.match(/\d+/g).map(Number);
      return n.clickable === 'true' && x2 > x1 && y2 - y1 >= 48;
    };
    for (let i = 0; action === 'seek' && !nodes.some(matches) && i < 6; i++) {
      const [, , width, height] = nodes[0].bounds.match(/\d+/g).map(Number);
      run([
        'shell',
        'input',
        'swipe',
        String(Math.round(width * 0.8)),
        String(Math.round(height * 0.82)),
        String(Math.round(width * 0.8)),
        String(Math.round(height * 0.26)),
        '450',
      ]);
      nodes = readNodes();
    }
    const node = nodes.find(matches);
    if (!node) throw new Error('Visible control not found: ' + value);
    const [x1, y1, x2, y2] = node.bounds.match(/\d+/g).map(Number);
    run([
      'shell',
      'input',
      'tap',
      String(Math.round((x1 + x2) / 2)),
      String(Math.round((y1 + y2) / 2)),
    ]);
  } else if (action === 'read') {
    console.log(
      nodes
        .filter(n => n.text || n['content-desc'])
        .map(n => ({
          label: n['content-desc'] || n.text,
          bounds: n.bounds,
          checked: n.checked,
          clickable: n.clickable,
        })),
    );
  } else throw new Error('Unknown action');
}

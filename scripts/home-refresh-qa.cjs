// UI helper restricted to the isolated Home QA app.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const adb = require('./android-sdk.cjs').adbPath();
const run = args =>
  execFileSync(adb, args, { timeout: 20000, windowsHide: true });
const [action = 'read', value] = process.argv.slice(2);
function readNodes() {
  const output = run([
    'shell',
    'uiautomator',
    'dump',
    '/data/local/tmp/home-refresh-ui.xml',
  ]).toString();
  if (!output.includes('UI hierchary dumped'))
    throw new Error('UI dump failed');
  const xml = run([
    'shell',
    'cat',
    '/data/local/tmp/home-refresh-ui.xml',
  ]).toString();
  if (!xml.includes('package="com.ipongoal.homeqa"'))
    throw new Error('Home QA is not foreground');
  fs.writeFileSync(path.join(root, 'artifacts/home-refresh-ui.xml'), xml);
  return [...xml.matchAll(/<node\b[^>]+>/g)].map(match =>
    Object.fromEntries(
      [...match[0].matchAll(/([\w-]+)="([^"]*)"/g)].map(m => [m[1], m[2]])
    )
  );
}
function scroll(nodes, direction) {
  const viewport = nodes.find(n => n.scrollable === 'true');
  if (!viewport) throw new Error('No scrollable viewport');
  const [x1, y1, x2, bottom] = viewport.bounds.match(/\d+/g).map(Number);
  const create = nodes.find(n => n['content-desc'] === 'Create new goal');
  const y2 = create
    ? Math.min(bottom, Number(create.bounds.match(/\d+/g)[1]) - 8)
    : bottom;
  const x = Math.round(x1 + (x2 - x1) * 0.85);
  const start = direction === 'down' ? 0.8 : 0.2;
  const end = direction === 'down' ? 0.2 : 0.8;
  run([
    'shell',
    'input',
    'swipe',
    String(x),
    String(Math.round(y1 + (y2 - y1) * start)),
    String(x),
    String(Math.round(y1 + (y2 - y1) * end)),
    '450',
  ]);
}
if (action === 'launch') {
  run(['shell', 'am', 'force-stop', 'com.ipongoal.homeqa']);
  run([
    'shell',
    'am',
    'start',
    '-W',
    '-n',
    'com.ipongoal.homeqa/com.ipongoal.MainActivity',
  ]);
} else {
  let nodes = readNodes();
  if (action === 'shot') {
    if (!/^[a-z0-9-]+$/.test(value))
      throw new Error('Use a simple screenshot name');
    fs.writeFileSync(
      path.join(root, 'docs/screenshots', value + '.png'),
      run(['exec-out', 'screencap', '-p'])
    );
  } else if (action === 'scroll') {
    if (value !== 'up' && value !== 'down') throw new Error('Use up or down');
    scroll(nodes, value);
  } else if (action === 'tap' || action === 'seek') {
    const matches = n =>
      (n['content-desc'] === value || n.text === value) &&
      n.clickable === 'true';
    for (let i = 0; action === 'seek' && !nodes.some(matches) && i < 8; i++) {
      scroll(nodes, 'down');
      nodes = readNodes();
    }
    let node = nodes.find(matches);
    for (let i = 0; action === 'tap' && !node && i < 3; i++) {
      nodes = readNodes();
      node = nodes.find(matches);
    }
    if (!node) throw new Error('Visible control not found: ' + value);
    const [x1, y1, x2, y2] = node.bounds.match(/\d+/g).map(Number);
    if (x2 <= x1 || y2 <= y1) throw new Error('Control has empty bounds');
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
          clickable: n.clickable,
        }))
    );
  } else throw new Error('Unknown action');
}

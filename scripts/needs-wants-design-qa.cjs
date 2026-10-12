// UI checks only for the isolated learning-game QA package on the dedicated emulator.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const adb = require('./android-sdk.cjs').adbPath();
const root = path.resolve(__dirname, '..');
const run = args =>
  execFileSync(adb, ['-s', 'emulator-5556', ...args], {
    timeout: 30000,
    windowsHide: true,
  });
const [action = 'read', value] = process.argv.slice(2);
const decode = text =>
  text
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
function readNodes() {
  const result = run([
    'shell',
    'uiautomator',
    'dump',
    '/data/local/tmp/needs-wants-design-ui.xml',
  ]).toString();
  if (!result.includes('UI hierchary dumped'))
    throw new Error('UI dump failed');
  const xml = run([
    'shell',
    'cat',
    '/data/local/tmp/needs-wants-design-ui.xml',
  ]).toString();
  if (!xml.includes('package="com.ipongoal.learningqa"'))
    throw new Error('Isolated learning QA app is not foreground');
  fs.writeFileSync(path.join(root, 'artifacts/needs-wants-design-ui.xml'), xml);
  return [...xml.matchAll(/<node\b[^>]+>/g)].map(match =>
    Object.fromEntries(
      [...match[0].matchAll(/([\w-]+)="([^"]*)"/g)].map(attribute => [
        attribute[1],
        decode(attribute[2]),
      ]),
    ),
  );
}
function scroll(nodes) {
  const node = nodes.find(candidate => candidate.scrollable === 'true');
  if (!node) throw new Error('No scrollable viewport');
  const [left, top, right, bottom] = node.bounds.match(/\d+/g).map(Number);
  run([
    'shell',
    'input',
    'swipe',
    String(Math.round((left + right) / 2)),
    String(Math.round(top + (bottom - top) * 0.8)),
    String(Math.round((left + right) / 2)),
    String(Math.round(top + (bottom - top) * 0.2)),
    '450',
  ]);
}
if (action === 'launch') {
  run([
    'shell',
    'am',
    'start',
    '-W',
    '-n',
    'com.ipongoal.learningqa/com.ipongoal.MainActivity',
  ]);
} else {
  let nodes = readNodes();
  if (action === 'read') {
    console.log(
      nodes
        .filter(node => node.text || node['content-desc'])
        .map(node => ({
          label: node['content-desc'] || node.text,
          bounds: node.bounds,
          clickable: node.clickable,
        })),
    );
  } else if (action === 'tap' || action === 'seek') {
    const matches = candidate =>
      candidate.clickable === 'true' &&
      (candidate.text === value || candidate['content-desc'] === value);
    for (
      let attempt = 0;
      action === 'seek' && !nodes.some(matches) && attempt < 6;
      attempt++
    ) {
      scroll(nodes);
      nodes = readNodes();
    }
    const node = nodes.find(matches);
    if (!node) throw new Error('Visible button not found: ' + value);
    const [left, top, right, bottom] = node.bounds.match(/\d+/g).map(Number);
    if (right <= left || bottom <= top)
      throw new Error('Button is outside the viewport');
    run([
      'shell',
      'input',
      'tap',
      String(Math.round((left + right) / 2)),
      String(Math.round((top + bottom) / 2)),
    ]);
  } else if (action === 'scroll') {
    scroll(nodes);
  } else if (action === 'shot') {
    if (!/^[a-z0-9-]+$/.test(value))
      throw new Error('Use a simple screenshot name');
    fs.writeFileSync(
      path.join(root, 'docs/screenshots', value + '.png'),
      run(['exec-out', 'screencap', '-p']),
    );
  } else throw new Error('Unknown QA action');
}

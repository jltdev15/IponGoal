const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const adb = require('../scripts/android-sdk.cjs').adbPath();
const serial = '21102102121';
const packageName = 'com.ipongoal.flightskyqa';
const run = args => execFileSync(adb, ['-s', serial, ...args], { timeout: 30000, windowsHide: true });
const [action = 'read', label] = process.argv.slice(2);
if (action === 'shot') {
  fs.writeFileSync(path.join(root, 'docs/screenshots/flight-sky-tablet.png'), run(['exec-out', 'screencap', '-p']));
} else {
  const dumped = run(['shell', 'uiautomator', 'dump', '/data/local/tmp/flight-sky-ui.xml']).toString();
  if (!dumped.includes('UI hierchary dumped')) throw new Error('UI dump failed; refusing stale controls');
  const xml = run(['shell', 'cat', '/data/local/tmp/flight-sky-ui.xml']).toString();
  if (!xml.includes(`package="${packageName}"`)) throw new Error('Flight preview is not foreground');
  const nodes = [...xml.matchAll(/<node\b[^>]+>/g)].map(match => Object.fromEntries([...match[0].matchAll(/([\w-]+)="([^"]*)"/g)].map(m => [m[1], m[2]])));
  if (action === 'tap') {
    const node = nodes.find(n => (n['content-desc'] === label || n.text === label) && n.clickable === 'true');
    if (!node) throw new Error('Missing control: ' + label);
    const [x1, y1, x2, y2] = node.bounds.match(/\d+/g).map(Number);
    run(['shell', 'input', 'tap', String(Math.round((x1+x2)/2)), String(Math.round((y1+y2)/2))]);
  } else {
    console.log(nodes.filter(n => n.package === packageName && (n.text || n['content-desc'])).map(n => ({ label: n['content-desc'] || n.text, bounds: n.bounds, clickable: n.clickable })));
  }
}

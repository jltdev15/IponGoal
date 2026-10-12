// Visual QA uses only synthetic records in the isolated Home package.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const adb = require('../scripts/android-sdk.cjs').adbPath();
const device = 'emulator-5558';
const packageName = 'com.ipongoal.homeqa';
const run = args =>
  execFileSync(adb, ['-s', device, ...args], {
    timeout: 30000,
    windowsHide: true,
  });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const decode = text =>
  text
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
function nodes() {
  run(['shell', 'uiautomator', 'dump', '/data/local/tmp/home-design-ui.xml']);
  const xml = run([
    'shell',
    'cat',
    '/data/local/tmp/home-design-ui.xml',
  ]).toString();
  if (!xml.includes(`package="${packageName}"`))
    throw new Error('Home QA is not foreground');
  return [...xml.matchAll(/<node\b[^>]+>/g)].map(match =>
    Object.fromEntries(
      [...match[0].matchAll(/([\w-]+)="([^"]*)"/g)].map(m => [
        m[1],
        decode(m[2]),
      ]),
    ),
  );
}
const bounds = node => node.bounds.match(/\d+/g).map(Number);
const label = node => node['content-desc'] || node.text;
function tap(current, name) {
  const node = current.find(n => label(n) === name && n.clickable === 'true');
  if (!node) throw new Error('Missing control: ' + name);
  const [left, top, right, bottom] = bounds(node);
  run([
    'shell',
    'input',
    'tap',
    String(Math.round((left + right) / 2)),
    String(Math.round((top + bottom) / 2)),
  ]);
}
function shot(name) {
  fs.writeFileSync(
    path.join(root, 'docs/screenshots', name + '.png'),
    run(['exec-out', 'screencap', '-p']),
  );
}
function scroll(current) {
  const viewport = current.find(n => n.scrollable === 'true');
  if (!viewport) throw new Error('No scrollable Home viewport');
  const [left, top, right, bottom] = bounds(viewport);
  const create = current.find(n => label(n) === 'Create new goal');
  const end = create ? Math.min(bottom, bounds(create)[1] - 8) : bottom;
  const x = Math.round(left + (right - left) * 0.88);
  run([
    'shell',
    'input',
    'swipe',
    String(x),
    String(Math.round(top + (end - top) * 0.82)),
    String(x),
    String(Math.round(top + (end - top) * 0.18)),
    '450',
  ]);
}
async function inspect(width, font, scenario) {
  run(['shell', 'am', 'force-stop', packageName]);
  run(['shell', 'wm', 'size', `${width * 3}x2532`]);
  run(['shell', 'wm', 'density', '480']);
  run(['shell', 'settings', 'put', 'system', 'font_scale', String(font)]);
  await pause(800);
  run([
    'shell',
    'am',
    'start',
    '-W',
    '-n',
    `${packageName}/com.ipongoal.MainActivity`,
  ]);
  await pause(1600);
  tap(nodes(), scenario);
  await pause(1600);
  const name = `home-redesign-${width}-${
    font === 1 ? 'normal' : 'large'
  }-${scenario.toLowerCase().replace(/ /g, '-')}`;
  let current = nodes();
  shot(name + '-top');
  const create = current.find(n => label(n) === 'Create new goal');
  const firstRecord = current.find(n =>
    label(n).startsWith('Record savings for '),
  );
  const firstActionAboveTabs =
    !!firstRecord && bounds(firstRecord)[3] <= bounds(create)[1];
  if (
    scenario === 'Populated' &&
    font === 1 &&
    !firstActionAboveTabs
  ) {
    throw new Error(
      'The first savings action must be visible above the tab bar',
    );
  }
  const seen = new Set(current.map(label));
  for (let i = 0; i < 16; i++) {
    const tip = current.find(n => n.text === 'Saving tip');
    const createButton = current.find(n => label(n) === 'Create new goal');
    const tipBody = tip && current.slice(current.indexOf(tip) + 1).find(n =>
      n.text && n.package === packageName && !['Home', 'History', 'Statistics', 'Profile'].includes(n.text),
    );
    if (tipBody && bounds(tipBody)[3] <= bounds(createButton)[1]) break;
    scroll(current);
    await pause(400);
    current = nodes();
    current.map(label).forEach(value => seen.add(value));
    if (i === 0 && scenario !== 'Populated') shot(name + '-middle');
  }
  shot(name + '-bottom');
  if (!seen.has('Explore learning games') || !seen.has('Saving tip')) {
    throw new Error('Learning games and saving tip must remain reachable');
  }
  if (scenario === 'Long content' && (!seen.has('Showing 3 of 30 active goals') || seen.has('View Savings goal 4'))) {
    throw new Error('Long-content Home must show the three-goal preview and complete count');
  }
  if (scenario === 'Empty' && !seen.has('Start your first savings goal')) throw new Error('Missing first-goal empty state');
  if (scenario === 'Completed only' && !seen.has('Ready for another goal?')) throw new Error('Missing returning-saver empty state');
  const result = {
    width,
    font,
    scenario,
    firstActionAboveTabs,
    labels: [...seen].filter(Boolean),
  };
  fs.writeFileSync(
    path.join(root, 'artifacts', name + '.json'),
    JSON.stringify(result, null, 2),
  );
  console.log(
    JSON.stringify({
      width,
      font,
      scenario,
      firstActionAboveTabs,
      screenshots: name,
    }),
  );
}
async function main() {
  const size = run(['shell', 'wm', 'size'])
    .toString()
    .match(/Override size: (\d+x\d+)/)?.[1];
  const density = run(['shell', 'wm', 'density'])
    .toString()
    .match(/Override density: (\d+)/)?.[1];
  const font = run(['shell', 'settings', 'get', 'system', 'font_scale'])
    .toString()
    .trim();
  try {
    if (process.argv[2] === '--matrix') {
      for (const width of [320, 390, 412])
        for (const scale of [1, 1.8]) await inspect(width, scale, 'Populated');
      await inspect(320, 1.8, 'Long content');
      await inspect(320, 1.8, 'Empty');
      await inspect(320, 1.8, 'Completed only');
    } else {
      await inspect(
        Number(process.argv[2] || 390),
        Number(process.argv[3] || 1),
        process.argv[4] || 'Populated',
      );
    }
  } finally {
    run(['shell', 'wm', 'size', size || 'reset']);
    run(['shell', 'wm', 'density', density || 'reset']);
    if (font === 'null')
      run(['shell', 'settings', 'delete', 'system', 'font_scale']);
    else run(['shell', 'settings', 'put', 'system', 'font_scale', font]);
  }
}
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

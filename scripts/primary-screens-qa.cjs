/* eslint-env node, es2021 */
// Uses the existing synthetic Home fixtures in an isolated emulator app only.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const packageName = 'com.ipongoal.primaryqa';
const fixedWidth = Number(process.argv[2] || 0);
const onlyTab = process.argv[3];
if (onlyTab && !['Home', 'History', 'Statistics', 'Profile'].includes(onlyTab))
  throw new Error('Choose Home, History, Statistics, or Profile');
if (fixedWidth && ![320, 390, 412].includes(fixedWidth))
  throw new Error('Use 320, 390, or 412 as the preconfigured width');
const adb = path.join(root, '.android-sdk/platform-tools/adb.exe');
const run = args =>
  execFileSync(adb, ['-s', 'emulator-5556', ...args], {
    timeout: 20000,
    windowsHide: true,
  });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
function readNodes() {
  const output = run([
    'shell',
    'uiautomator',
    'dump',
    '/data/local/tmp/primary-screens-ui.xml',
  ]).toString();
  if (!output.includes('dumped')) throw new Error('Fresh UI dump failed');
  const xml = run([
    'shell',
    'cat',
    '/data/local/tmp/primary-screens-ui.xml',
  ]).toString();
  const parsed = [...xml.matchAll(/<node\b[^>]+>/g)].map(match =>
    Object.fromEntries(
      [...match[0].matchAll(/([\w-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]),
    ),
  );
  if (!xml.includes(`package="${packageName}"`)) {
    const close = parsed.find(n => n.text === 'Close app');
    if (xml.includes('System UI') && xml.includes('responding') && close) {
      const [x1, y1, x2, y2] = bounds(close);
      run([
        'shell',
        'input',
        'tap',
        String(Math.round((x1 + x2) / 2)),
        String(Math.round((y1 + y2) / 2)),
      ]);
    }
    throw new Error('Isolated QA app is not foreground');
  }
  return parsed;
}
function nodes() {
  for (let attempt = 0; ; attempt++) {
    try {
      return readNodes();
    } catch (error) {
      if (attempt === 7) throw error;
    }
  }
}
function bounds(n) {
  return n.bounds.match(/\d+/g).map(Number);
}
function tap(label) {
  let n;
  for (let attempt = 0; attempt < 6 && !n; attempt++) {
    n = nodes().find(
      item =>
        item.clickable === 'true' &&
        (item['content-desc'] === label || item.text === label),
    );
  }
  if (!n) throw new Error('Visible control not found: ' + label);
  const [x1, y1, x2, y2] = bounds(n);
  run([
    'shell',
    'input',
    'tap',
    String(Math.round((x1 + x2) / 2)),
    String(Math.round((y1 + y2) / 2)),
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
  if (!viewport) throw new Error('No scrollable viewport');
  const [x1, y1, x2, bottom] = bounds(viewport);
  const create = current.find(n => n['content-desc'] === 'Create new goal');
  const y2 = create ? Math.min(bottom, bounds(create)[1] - 8) : bottom;
  const x = Math.round(x1 + (x2 - x1) * 0.85);
  run([
    'shell',
    'input',
    'swipe',
    String(x),
    String(Math.round(y1 + (y2 - y1) * 0.8)),
    String(x),
    String(Math.round(y1 + (y2 - y1) * 0.2)),
    '350',
  ]);
}
async function launch(scenario) {
  run(['shell', 'am', 'force-stop', packageName]);
  run([
    'shell',
    'am',
    'start',
    '-W',
    '-n',
    packageName + '/com.ipongoal.MainActivity',
  ]);
  await pause(1200);
  for (let attempt = 0; ; attempt++) {
    try {
      tap(scenario);
      await pause(800);
      if (nodes().some(n => n['content-desc'] === scenario))
        throw new Error('Fixture selection is still visible');
      break;
    } catch (error) {
      if (attempt === 5) throw error;
      await pause(500);
    }
  }
  await pause(800);
}
async function inspect(width, font, scenario, tabs) {
  run(['shell', 'am', 'force-stop', packageName]);
  if (!fixedWidth) {
    run(['shell', 'wm', 'size', `${width * 3}x2532`]);
    run(['shell', 'wm', 'density', '480']);
  }
  run(['shell', 'settings', 'put', 'system', 'font_scale', String(font)]);
  await pause(900);
  await launch(scenario);
  for (const tab of tabs.filter(candidate => !onlyTab || candidate === onlyTab)) {
    tap(tab);
    await pause(500);
    const prefix = `primary-${scenario
      .toLowerCase()
      .replaceAll(' ', '-')}-${width}-${
      font === 1 ? 'normal' : 'large'
    }-${tab.toLowerCase()}`;
    let current = nodes();
    if (
      !current.some(n =>
        (n['content-desc'] || n.text).includes(
          tab === 'Home' ? 'Saved so far' : tab,
        ),
      )
    )
      throw new Error('Screen content missing: ' + tab);
    shot(prefix + '-top');
    const target =
      tab === 'Home'
        ? scenario === 'Long content'
          ? 'Record savings for A new computer and school supplies for the coming school year'
          : 'Saving tip'
        : tab === 'History'
        ? scenario === 'Empty'
          ? 'Go to Goals'
          : scenario === 'Long content'
          ? 'A new computer and school supplies'
          : 'Last year’s trip'
        : tab === 'Statistics'
        ? scenario === 'Empty'
          ? 'Go to Goals'
          : 'Calculated from your records.'
        : 'Reset all device data';
    let reachable = false;
    for (let step = 0; step < 14; step++) {
      const create = current.find(n => n['content-desc'] === 'Create new goal');
      const limit = create ? bounds(create)[1] : 2400;
      reachable = current.some(
        n =>
          (n['content-desc'] || n.text).includes(target) &&
          bounds(n)[3] <= limit &&
          bounds(n)[3] > bounds(n)[1],
      );
      if (reachable) break;
      scroll(current);
      await pause(300);
      current = nodes();
    }
    if (reachable && current.some(n => n.scrollable === 'true')) {
      scroll(current);
      await pause(300);
    }
    shot(prefix + '-bottom');
    console.log(
      JSON.stringify({
        width,
        font,
        scenario,
        tab,
        finalContentReachable: reachable,
      }),
    );
    if (!reachable) throw new Error('Final content obscured: ' + prefix);
  }
}
(async () => {
  if (
    run(['shell', 'getprop', 'sys.boot_completed']).toString().trim() !== '1'
  ) {
    throw new Error('Wait for the dedicated QA emulator to finish booting');
  }
  const size = run(['shell', 'wm', 'size']).toString();
  const density = run(['shell', 'wm', 'density']).toString();
  const font = run(['shell', 'settings', 'get', 'system', 'font_scale'])
    .toString()
    .trim();
  fs.writeFileSync(
    path.join(root, 'artifacts/primary-screens-display-state.json'),
    JSON.stringify({ size, density, font }, null, 2),
  );
  try {
    if (
      fixedWidth &&
      (!size.includes(`${fixedWidth * 3}x2532`) || !density.includes('480'))
    )
      throw new Error(
        'Preconfigure this emulator to the requested width at 480dpi before booting',
      );
    for (const width of fixedWidth ? [fixedWidth] : [320, 390, 412])
      for (const scale of [1, 1.8])
        await inspect(width, scale, 'Populated', [
          'History',
          'Statistics',
          'Profile',
          'Home',
        ]);
    if (!fixedWidth || fixedWidth === 320) {
      await inspect(320, 1.8, 'Empty', ['History', 'Statistics']);
      await inspect(320, 1.8, 'Long content', [
        'Home',
        'History',
        'Statistics',
        'Profile',
      ]);
    }
  } finally {
    if (!fixedWidth) {
      run([
        'shell',
        'wm',
        'size',
        size.match(/Override size: (\d+x\d+)/)?.[1] || 'reset',
      ]);
      run([
        'shell',
        'wm',
        'density',
        density.match(/Override density: (\d+)/)?.[1] || 'reset',
      ]);
    }
    run([
      'shell',
      'settings',
      'put',
      'system',
      'font_scale',
      font === 'null' ? '1' : font,
    ]);
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

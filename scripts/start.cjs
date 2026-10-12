const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');
const { createInterface } = require('node:readline/promises');
const {
  configureAndroidEnvironment,
  findSdk: discoverSdk,
  sdkCandidates,
} = require('./android-sdk.cjs');

const root = path.resolve(__dirname, '..');
const executable = name =>
  process.platform === 'win32' ? `${name}.exe` : name;

function findSdk() {
  const properties = path.join(root, 'android', 'local.properties');
  const candidates = sdkCandidates();
  if (process.argv.includes('--diagnose')) {
    console.log(`Node: ${process.execPath} (${process.platform})`);
    console.log(`Project: ${root}`);
    console.log(`SDK properties file: ${properties}`);
    for (const candidate of candidates.filter(Boolean)) {
      const emulatorPath = path.join(
        candidate,
        'emulator',
        executable('emulator'),
      );
      try {
        fs.statSync(emulatorPath);
        console.log(`SDK executable accessible: ${emulatorPath}`);
      } catch (error) {
        console.log(`SDK executable ${error.code}: ${emulatorPath}`);
      }
    }
  }
  return discoverSdk();
}

function listEmulators(sdk) {
  if (!sdk) {
    return [];
  }
  let result = spawnSync(
    path.join(sdk, 'emulator', executable('emulator')),
    ['-list-avds'],
    { encoding: 'utf8', timeout: 10000 },
  );
  if (result.status === 0 && !result.stdout.trim()) {
    const defaultAvds = path.join(
      process.env.USERPROFILE || os.homedir(),
      '.android',
      'avd',
    );
    if (fs.existsSync(defaultAvds)) {
      const fallback = spawnSync(
        path.join(sdk, 'emulator', executable('emulator')),
        ['-list-avds'],
        {
          encoding: 'utf8',
          timeout: 10000,
          env: { ...process.env, ANDROID_AVD_HOME: defaultAvds },
        },
      );
      if (fallback.status === 0 && fallback.stdout.trim()) {
        process.env.ANDROID_AVD_HOME = defaultAvds;
        result = fallback;
      }
    }
  }
  if (result.status !== 0) {
    throw new Error(
      'Unable to list Android emulators. Check your Android SDK installation.',
    );
  }
  return result.stdout
    .split(/\r?\n/)
    .map(name => name.trim())
    .filter(Boolean);
}

function runningEmulators(sdk) {
  if (!sdk) {
    return new Set();
  }
  const adb = path.join(sdk, 'platform-tools', executable('adb'));
  // Query ADB to mark already-running virtual devices.
  const result = spawnSync(adb, ['devices'], {
    encoding: 'utf8',
    timeout: 3000,
  });
  const devices = (result.stdout || '')
    .split(/\r?\n/)
    .map(line => line.match(/^(emulator-\d+)\s+device\b/)?.[1])
    .filter(Boolean);
  return new Set(
    devices
      .map(serial => {
        const name = spawnSync(adb, ['-s', serial, 'emu', 'avd', 'name'], {
          encoding: 'utf8',
          timeout: 3000,
        });
        return name.stdout?.split(/\r?\n/)[0]?.trim();
      })
      .filter(Boolean),
  );
}

async function chooseEmulator(names, running) {
  console.log('\nPiggyPath · Android emulator selection\n');
  names.forEach((name, index) =>
    console.log(
      `  ${index + 1}. ${name}${running.has(name) ? ' (running)' : ''}`,
    ),
  );
  console.log(
    '  0. Start Metro only (physical device / emulator already selected)\n',
  );
  const prompt = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  try {
    while (true) {
      const answer =
        (await prompt.question('Select emulator [0]: ')).trim() || '0';
      if (/^\d+$/.test(answer) && Number(answer) <= names.length) {
        return Number(answer) === 0 ? undefined : names[Number(answer) - 1];
      }
      console.log(`Enter a number from 0 to ${names.length}.`);
    }
  } finally {
    prompt.close();
  }
}

async function launchEmulator(sdk, name) {
  const log = path.join(os.tmpdir(), `ipon-emulator-${Date.now()}.log`);
  const output = fs.openSync(log, 'a');
  const child = spawn(
    path.join(sdk, 'emulator', executable('emulator')),
    ['-avd', name],
    {
      detached: true,
      stdio: ['ignore', output, output],
    },
  );
  try {
    await new Promise((resolve, reject) => {
      child.once('spawn', resolve);
      child.once('error', reject);
    });
    child.unref();
    console.log(`\nLaunching ${name}. Emulator log: ${log}`);
  } finally {
    fs.closeSync(output);
  }
}

async function main() {
  const flags = process.argv.slice(2);
  configureAndroidEnvironment();
  if (flags.includes('--help')) {
    console.log(
      'npm start                         Choose an emulator, then start Metro\nnpm start -- --no-emulator         Start Metro only\nnpm start -- --emulator=AVD_NAME    Launch a specific installed emulator\nnpm run emulators                 List installed emulators\n\nOther flags, such as --reset-cache or --port, are passed to Metro.\nAfter the emulator boots, run npm run android in a second terminal.',
    );
    return;
  }
  const sdk = findSdk();
  if (sdk) {
    process.env.ANDROID_HOME = sdk;
    process.env.ANDROID_SDK_ROOT = sdk;
  }
  const names = listEmulators(sdk);
  if (flags.includes('--diagnose')) {
    console.log(`Selected SDK: ${sdk || '(none)'}`);
    console.log(`Emulators: ${names.join(', ') || '(none)'}`);
    return;
  }
  if (flags.includes('--list-emulators')) {
    if (names.length) {
      names.forEach((name, index) => console.log(`${index + 1}. ${name}`));
    } else {
      console.log(
        'No Android emulators found. On Windows, run scripts/setup-android.ps1 to create one; see README.md.',
      );
    }
    return;
  }
  const requested = flags
    .find(flag => flag.startsWith('--emulator='))
    ?.slice('--emulator='.length);
  let selected;
  if (requested !== undefined) {
    if (!names.includes(requested)) {
      throw new Error(
        `Emulator "${requested}" was not found. SDK: ${
          sdk || 'not found'
        }. AVD directory: ${
          process.env.ANDROID_AVD_HOME ||
          process.env.ANDROID_USER_HOME ||
          os.homedir()
        }. Run npm run emulators to list available names.`,
      );
    }
    selected = requested;
  } else if (
    !flags.includes('--no-emulator') &&
    process.stdin.isTTY &&
    process.stdout.isTTY
  ) {
    if (names.length) {
      selected = await chooseEmulator(names, runningEmulators(sdk));
    } else {
      console.log(
        '\nNo Android emulators found. On Windows, run scripts/setup-android.ps1 to create one; see README.md. Starting Metro only.\n',
      );
    }
  }
  if (selected) {
    if (runningEmulators(sdk).has(selected)) {
      console.log(`\n${selected} is already running.`);
    } else {
      await launchEmulator(sdk, selected);
    }
    console.log(
      'After it boots, run npm run android in another terminal to install/open PiggyPath.\n',
    );
  }
  const metroFlags = flags.filter(
    flag => flag !== '--no-emulator' && !flag.startsWith('--emulator='),
  );
  // Inherit the terminal so Metro keeps its r/d/j commands and Ctrl+C handling.
  const metro = spawn(
    process.execPath,
    [require.resolve('react-native/cli.js'), 'start', ...metroFlags],
    { cwd: root, stdio: 'inherit' },
  );
  metro.once('error', error => {
    console.error(error.message);
    process.exitCode = 1;
  });
  metro.once('exit', code => {
    process.exitCode = code ?? 0;
  });
  process.on('SIGINT', () => {
    metro.kill('SIGINT');
  });
  process.on('SIGTERM', () => {
    metro.kill('SIGTERM');
  });
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});

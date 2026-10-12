const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const executable = name =>
  process.platform === 'win32' ? `${name}.exe` : name;

function sdkCandidates() {
  const properties = path.join(root, 'android', 'local.properties');
  const configured = fs.existsSync(properties)
    ? fs.readFileSync(properties, 'utf8').match(/^sdk\.dir\s*=\s*(.+)$/m)?.[1]
    : undefined;
  return [
    configured?.trim().replace(/\\([\\: ])/g, '$1'),
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    process.platform === 'darwin'
      ? path.join(os.homedir(), 'Library', 'Android', 'sdk')
      : process.platform === 'win32'
      ? path.join(
          process.env.LOCALAPPDATA ||
            path.join(os.homedir(), 'AppData', 'Local'),
          'Android',
          'Sdk',
        )
      : path.join(os.homedir(), 'Android', 'Sdk'),
  ].filter(Boolean);
}

function findSdk() {
  return sdkCandidates().find(candidate =>
    fs.existsSync(path.join(candidate, 'platform-tools', executable('adb'))),
  );
}

function configureAndroidEnvironment(sdk = findSdk()) {
  if (sdk) {
    process.env.ANDROID_HOME = sdk;
    process.env.ANDROID_SDK_ROOT = sdk;
    process.env.PATH = [
      path.join(sdk, 'platform-tools'),
      path.join(sdk, 'emulator'),
      process.env.PATH || '',
    ].join(path.delimiter);
  }
  // Existing terminals can retain the old project-local AVD path after migration.
  if (
    process.env.ANDROID_AVD_HOME &&
    !fs.existsSync(process.env.ANDROID_AVD_HOME)
  ) {
    delete process.env.ANDROID_AVD_HOME;
  }
  return sdk;
}

function adbPath() {
  const sdk = configureAndroidEnvironment();
  if (!sdk) {
    throw new Error(
      'Android SDK not found. Set ANDROID_HOME or android/local.properties; on Windows, run scripts/setup-android.ps1.',
    );
  }
  return path.join(sdk, 'platform-tools', executable('adb'));
}

module.exports = {
  adbPath,
  configureAndroidEnvironment,
  findSdk,
  sdkCandidates,
};

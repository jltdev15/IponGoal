const fs = require('node:fs');
const path = require('node:path');
const process = require('node:process');
const {
  adbPath,
  configureAndroidEnvironment,
  findSdk,
} = require('../scripts/android-sdk.cjs');

const originalEnv = process.env;
const properties = path.resolve('android/local.properties');
const adbName = process.platform === 'win32' ? 'adb.exe' : 'adb';

beforeEach(() => {
  process.env = { ...originalEnv };
  delete process.env.ANDROID_HOME;
  delete process.env.ANDROID_SDK_ROOT;
  delete process.env.ANDROID_AVD_HOME;
});

afterEach(() => {
  process.env = originalEnv;
  jest.restoreAllMocks();
});

test('the configured SDK takes precedence over stale inherited paths', () => {
  const sdk = path.resolve('shared Android SDK');
  process.env.ANDROID_HOME = path.resolve('old-project/.android-sdk');
  jest
    .spyOn(fs, 'existsSync')
    .mockImplementation((file: unknown) =>
      [properties, path.join(sdk, 'platform-tools', adbName)].includes(
        String(file),
      ),
    );
  jest.spyOn(fs, 'readFileSync').mockReturnValue(`sdk.dir=${sdk}\n`);
  expect(findSdk()).toBe(sdk);
  expect(adbPath()).toBe(path.join(sdk, 'platform-tools', adbName));
  expect(process.env.ANDROID_HOME).toBe(sdk);
});

test('a missing configured SDK falls back to a working environment SDK', () => {
  const sdk = path.resolve('shared-sdk');
  process.env.ANDROID_HOME = path.resolve('missing-sdk');
  process.env.ANDROID_SDK_ROOT = sdk;
  jest
    .spyOn(fs, 'existsSync')
    .mockImplementation((file: unknown) =>
      [properties, path.join(sdk, 'platform-tools', adbName)].includes(
        String(file),
      ),
    );
  jest.spyOn(fs, 'readFileSync').mockReturnValue('sdk.dir=/missing/sdk\n');
  expect(findSdk()).toBe(sdk);
});

test('migration clears a missing AVD override but preserves a valid custom one', () => {
  const custom = path.resolve('custom-avds');
  jest.spyOn(fs, 'existsSync').mockImplementation(file => file === custom);
  process.env.ANDROID_AVD_HOME = path.resolve('old-project/.android-avd');
  configureAndroidEnvironment();
  expect(process.env.ANDROID_AVD_HOME).toBeUndefined();
  process.env.ANDROID_AVD_HOME = custom;
  configureAndroidEnvironment();
  expect(process.env.ANDROID_AVD_HOME).toBe(custom);
});

test('missing SDK reports how to configure it', () => {
  jest.spyOn(fs, 'existsSync').mockReturnValue(false);
  expect(adbPath).toThrow('Android SDK not found');
});

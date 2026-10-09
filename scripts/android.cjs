const fs = require('node:fs');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const javaName = process.platform === 'win32' ? 'java.exe' : 'java';
const projectSdk = path.join(root, '.android-sdk');
if (fs.existsSync(path.join(projectSdk, 'platform-tools'))) {
  process.env.ANDROID_HOME = projectSdk;
  process.env.ANDROID_SDK_ROOT = projectSdk;
  process.env.ANDROID_AVD_HOME = path.join(root, '.android-avd');
  process.env.PATH = `${path.join(projectSdk, 'platform-tools')}${
    path.delimiter
  }${path.join(projectSdk, 'emulator')}${path.delimiter}${
    process.env.PATH || ''
  }`;
}

function isJdk17(home) {
  if (
    !home ||
    !fs.existsSync(
      path.join(
        home,
        'bin',
        'javac' + (process.platform === 'win32' ? '.exe' : ''),
      ),
    )
  ) {
    return false;
  }
  const result = spawnSync(path.join(home, 'bin', javaName), ['-version'], {
    encoding: 'utf8',
    timeout: 10000,
  });
  return (
    result.status === 0 &&
    /version "17(?:\.|"|\-)/.test(result.stderr + result.stdout)
  );
}

function findJdk17() {
  const candidates = [process.env.JAVA_HOME];
  if (process.platform === 'darwin') {
    const result = spawnSync('/usr/libexec/java_home', ['-v', '17'], {
      encoding: 'utf8',
      timeout: 10000,
    });
    if (result.status === 0) {
      candidates.push(result.stdout.trim());
    }
  }
  const directories =
    process.platform === 'win32'
      ? ['Java', 'Eclipse Adoptium', 'Microsoft', 'Amazon Corretto'].map(name =>
          path.join(process.env.ProgramFiles || 'C:\\Program Files', name),
        )
      : process.platform === 'darwin'
      ? [
          '/Library/Java/JavaVirtualMachines',
          '/opt/homebrew/opt/openjdk@17',
          '/usr/local/opt/openjdk@17',
        ]
      : ['/usr/lib/jvm', '/usr/java'];
  for (const directory of directories) {
    if (!fs.existsSync(directory)) {
      continue;
    }
    candidates.push(directory);
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory() || entry.isSymbolicLink()) {
        candidates.push(path.join(directory, entry.name));
        candidates.push(path.join(directory, entry.name, 'Contents', 'Home'));
      }
    }
  }
  return [...new Set(candidates)].find(isJdk17);
}

const javaHome = findJdk17();
if (!javaHome) {
  console.error(
    'JDK 17 is required to build PiggyPath. Install JDK 17 and set JAVA_HOME to its directory, then rerun npm run android.',
  );
  process.exitCode = 1;
} else {
  console.log(`Using JDK 17: ${javaHome}`);
  const flags = process.argv.slice(2);
  const buildRelease = flags.includes('--build-release');
  const windowsRelease = buildRelease && process.platform === 'win32';
  if (!flags.includes('--jdk-check')) {
    // Windows batch files must be launched through cmd.exe.
    const child = spawn(
      windowsRelease
        ? process.env.ComSpec || 'cmd.exe'
        : buildRelease
        ? path.join(root, 'android', 'gradlew')
        : process.execPath,
      windowsRelease
        ? [
            '/d',
            '/s',
            '/c',
            'gradlew.bat assembleRelease -PreactNativeArchitectures=armeabi-v7a,arm64-v8a',
          ]
        : buildRelease
        ? [
            'assembleRelease',
            '-PreactNativeArchitectures=armeabi-v7a,arm64-v8a',
          ]
        : [require.resolve('react-native/cli.js'), 'run-android', ...flags],
      {
        cwd: buildRelease ? path.join(root, 'android') : root,
        stdio: 'inherit',
        env: {
          ...process.env,
          JAVA_HOME: javaHome,
          PATH: `${path.join(javaHome, 'bin')}${path.delimiter}${
            process.env.PATH || ''
          }`,
        },
      },
    );
    child.once('error', error => {
      console.error(error.message);
      process.exitCode = 1;
    });
    child.once('exit', code => {
      process.exitCode = code ?? 1;
      if (buildRelease && code === 0) {
        const directory = path.join(root, 'artifacts');
        const destination = path.join(directory, 'PiggyPath-release.apk');
        fs.mkdirSync(directory, { recursive: true });
        fs.copyFileSync(
          path.join(
            root,
            'android/app/build/outputs/apk/release/app-release.apk',
          ),
          destination,
        );
        const digest = require('node:crypto')
          .createHash('sha256')
          .update(fs.readFileSync(destination))
          .digest('hex');
        fs.writeFileSync(
          destination + '.sha256',
          `${digest}  PiggyPath-release.apk\n`,
        );
        console.log(
          `Phone release APK: ${destination} (${(
            fs.statSync(destination).size / 1e6
          ).toFixed(2)} MB)`,
        );
      }
    });
    process.on('SIGINT', () => child.kill('SIGINT'));
    process.on('SIGTERM', () => child.kill('SIGTERM'));
  }
}

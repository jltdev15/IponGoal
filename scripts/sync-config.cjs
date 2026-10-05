const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const config = fs.readFileSync(
  path.join(root, 'src/config/appConfig.ts'),
  'utf8',
);
const name = config.match(/APP_NAME:\s*'([^']+)'/)[1];
const version = config.match(/APP_VERSION:\s*'([^']+)'/)[1];
const xmlName = name
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/'/g, "\\'");
fs.writeFileSync(
  path.join(root, 'android/app/src/main/res/values/strings.xml'),
  `<resources>\n  <string name="app_name">${xmlName}</string>\n</resources>\n`,
);
const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json')));
app.displayName = name;
fs.writeFileSync(
  path.join(root, 'app.json'),
  JSON.stringify(app, null, 2) + '\n',
);
const plistName = name
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');
const plistPath = path.join(root, 'ios/PiggyPath/Info.plist');
fs.writeFileSync(
  plistPath,
  fs
    .readFileSync(plistPath, 'utf8')
    .replace(
      /(<key>CFBundleDisplayName<\/key>\s*<string>)[^<]*(<\/string>)/,
      `$1${plistName}$2`,
    ),
);
const gradlePath = path.join(root, 'android/app/build.gradle');
fs.writeFileSync(
  gradlePath,
  fs
    .readFileSync(gradlePath, 'utf8')
    .replace(/versionName "[^"]+"/, `versionName "${version}"`),
);

const theme = fs.readFileSync(path.join(root, 'src/theme/colors.ts'), 'utf8');
const primary = theme.match(/primary:\s*'([^']+)'/)[1];
const background = theme.match(/background:\s*'([^']+)'/)[1];
const white = theme.match(/white:\s*'([^']+)'/)[1];
const iconBackground = theme.match(/iconBackground:\s*'([^']+)'/)[1];
fs.writeFileSync(
  path.join(root, 'android/app/src/main/res/values/colors.xml'),
  `<resources>\n  <color name="app_primary">${primary}</color>\n  <color name="app_white">${white}</color>\n  <color name="app_background">${background}</color>\n  <color name="app_icon_background">${iconBackground}</color>\n</resources>\n`,
);

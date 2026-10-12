const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const projectRoot = path.resolve('.');
export {};

test('four original choice WAVs are distinct, audible, bounded and bundled for both platforms', () => {
  const hashes = new Set<string>();
  const android = fs.readFileSync(
    path.join(
      projectRoot,
      'android/app/src/main/java/com/ipongoal/sound/FlightSoundModule.kt',
    ),
    'utf8',
  );
  const ios = fs.readFileSync(
    path.join(projectRoot, 'ios/PiggyPath.xcodeproj/project.pbxproj'),
    'utf8',
  );
  for (const index of [1, 2, 3, 4]) {
    const name = `choice_${index}`;
    const wav = fs.readFileSync(
      path.join(projectRoot, `assets/audio/flight/${name}.wav`),
    );
    expect(wav.subarray(0, 4).toString()).toBe('RIFF');
    expect(wav.readUInt16LE(20)).toBe(1);
    expect(wav.readUInt16LE(22)).toBe(1);
    expect(wav.readUInt16LE(34)).toBe(16);
    const rate = wav.readUInt32LE(24);
    const sampleCount = wav.readUInt32LE(40) / 2;
    expect(sampleCount / rate).toBeLessThan(0.4);
    let peak = 0;
    for (let sample = 0; sample < sampleCount; sample++)
      peak = Math.max(peak, Math.abs(wav.readInt16LE(44 + sample * 2)));
    expect(peak).toBeGreaterThan(10000);
    expect(peak).toBeLessThan(32767);
    expect(Math.abs(wav.readInt16LE(44))).toBeLessThan(100);
    expect(Math.abs(wav.readInt16LE(wav.length - 2))).toBeLessThan(100);
    expect(
      wav.equals(
        fs.readFileSync(
          path.join(projectRoot, `android/app/src/main/res/raw/${name}.wav`),
        ),
      ),
    ).toBe(true);
    expect(android).toContain(`R.raw.${name}`);
    expect(ios).toContain(`${name}.wav in Resources`);
    hashes.add(crypto.createHash('sha256').update(wav).digest('hex'));
  }
  expect(hashes.size).toBe(4);
});

// Original additive-synthesis score and effects. No recordings or third-party samples.
const fs = require('fs');
const path = require('path');
const rate = 22050;
const root = path.resolve(__dirname, '..');
function write(name, samples) {
  const out = Buffer.alloc(44 + samples.length * 2);
  out.write('RIFF');
  out.writeUInt32LE(out.length - 8, 4);
  out.write('WAVEfmt ', 8);
  out.writeUInt32LE(16, 16);
  out.writeUInt16LE(1, 20);
  out.writeUInt16LE(1, 22);
  out.writeUInt32LE(rate, 24);
  out.writeUInt32LE(rate * 2, 28);
  out.writeUInt16LE(2, 32);
  out.writeUInt16LE(16, 34);
  out.write('data', 36);
  out.writeUInt32LE(samples.length * 2, 40);
  const peak = Math.max(
    0.001,
    samples.reduce((p, n) => Math.max(p, Math.abs(n)), 0),
  );
  samples.forEach((n, i) =>
    out.writeInt16LE(Math.round((n / peak) * 0.7 * 32767), 44 + i * 2),
  );
  for (const dir of ['assets/audio/flight', 'android/app/src/main/res/raw']) {
    fs.mkdirSync(path.join(root, dir), { recursive: true });
    fs.writeFileSync(path.join(root, dir, name + '.wav'), out);
  }
}
function pluck(samples, start, frequency, duration, gain, wrap = false) {
  for (let i = 0; i < duration * rate; i++) {
    const t = i / rate;
    const envelope =
      Math.min(1, t / 0.012) *
      Math.exp((-t * 4) / duration) *
      Math.min(1, (duration - t) / 0.035);
    const tone =
      Math.sin(2 * Math.PI * frequency * t) +
      0.18 * Math.sin(4 * Math.PI * frequency * t);
    const index = Math.round(start * rate) + i;
    if (wrap || index < samples.length)
      samples[index % samples.length] += tone * envelope * gain;
  }
}
// Eight bars in C major at 100 BPM, 19.2 seconds. Tails wrap across the loop seam.
const music = new Float64Array(Math.round(19.2 * rate));
const chords = [
  [48, 52, 55],
  [45, 48, 52],
  [41, 45, 48],
  [43, 47, 50],
];
const melody = [72, 76, 79, 76, 74, 72, 69, 72, 69, 72, 77, 76, 74, 71, 67, 71];
const hz = midi => 440 * 2 ** ((midi - 69) / 12);
for (let bar = 0; bar < 8; bar++) {
  const chord = chords[bar % 4];
  for (let beat = 0; beat < 4; beat++)
    pluck(music, bar * 2.4 + beat * 0.6, hz(chord[beat % 3]), 1.8, 0.2, true);
  for (let note = 0; note < 2; note++)
    pluck(
      music,
      bar * 2.4 + note * 1.2,
      hz(melody[bar * 2 + note]),
      1.1,
      0.16,
      true,
    );
}
write('flight_music', music);
const coin = new Float64Array(Math.round(0.32 * rate));
pluck(coin, 0, hz(84), 0.21, 0.5);
pluck(coin, 0.085, hz(91), 0.23, 0.45);
write('flight_coin', coin);
const bump = new Float64Array(Math.round(0.22 * rate));
for (let i = 0; i < bump.length; i++) {
  const t = i / rate;
  bump[i] =
    Math.sin(2 * Math.PI * (190 * t - 220 * t * t)) *
    Math.min(1, t / 0.008) *
    Math.exp(-t * 23) *
    Math.min(1, (0.22 - t) / 0.025);
}
write('flight_bump', bump);

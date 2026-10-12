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
// Sixteen playful bars in C major at 125 BPM (30.72 seconds).
// All instrumental and percussion tails wrap so the loop has no hard cut.
const beatSeconds = 60 / 125;
const music = new Float64Array(Math.round(16 * 4 * beatSeconds * rate));
const chords = [
  [48, 52, 55],
  [41, 45, 48],
  [43, 47, 50],
  [48, 52, 55],
  [45, 48, 52],
  [41, 45, 48],
  [43, 47, 50],
  [48, 52, 55],
];
const melody = [
  [72, 76, 79, 76, 74, 76],
  [77, 76, 72, 69, 72, 77],
  [74, 79, 77, 74, 71, 74],
  [76, 79, 84, 79, 76, 72],
  [76, 81, 79, 76, 72, 69],
  [77, 81, 79, 77, 76, 72],
  [74, 77, 79, 77, 74, 71],
  [72, 76, 79, 76, 74, 72],
];
const melodyBeats = [0, 0.75, 1.5, 2, 2.75, 3.5];
const hz = midi => 440 * 2 ** ((midi - 69) / 12);
function bell(start, note) {
  const duration = 0.42;
  const frequency = hz(note);
  for (let i = 0; i < duration * rate; i++) {
    const t = i / rate;
    const envelope =
      Math.min(1, t / 0.004) * Math.min(1, (duration - t) / 0.025);
    const tone =
      Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 10) +
      0.3 * Math.sin(2 * Math.PI * frequency * 3 * t) * Math.exp(-t * 24);
    music[(Math.round(start * rate) + i) % music.length] +=
      tone * envelope * 0.2;
  }
}
// Seeded noise keeps the light shaker/brush rhythm reproducible.
let noiseSeed = 17;
function percussion(start, gain, duration) {
  let previous = 0;
  for (let i = 0; i < duration * rate; i++) {
    noiseSeed = (Math.imul(noiseSeed, 1664525) + 1013904223) >>> 0;
    const noise = (noiseSeed / 4294967296) * 2 - 1;
    const t = i / rate;
    const envelope =
      Math.min(1, t / 0.003) *
      Math.exp((-t * 6) / duration) *
      Math.min(1, (duration - t) / 0.015);
    music[(Math.round(start * rate) + i) % music.length] +=
      (noise - previous) * envelope * gain;
    previous = noise;
  }
}
for (let bar = 0; bar < 16; bar++) {
  const start = bar * 4 * beatSeconds;
  const chord = chords[bar % 8];
  for (let beat = 0; beat < 4; beat++) {
    // Offbeat, lightly strummed chords and a rounded alternating bass.
    chord.forEach((note, string) =>
      pluck(
        music,
        start + (beat + 0.5) * beatSeconds + string * 0.012,
        hz(note + 12),
        0.3,
        0.045,
        true,
      ),
    );
    pluck(
      music,
      start + beat * beatSeconds,
      hz(beat % 2 === 0 ? chord[0] : chord[2] - 12),
      0.38,
      0.16,
      true,
    );
    percussion(start + beat * beatSeconds, beat % 2 ? 0.04 : 0.018, 0.1);
    percussion(start + (beat + 0.5) * beatSeconds, 0.018, 0.065);
  }
  melody[bar % 8].forEach((note, index) => {
    // The second phrase adds a few higher answers to the melody.
    const answer = bar >= 8 && (index === 2 || index === 5) ? 12 : 0;
    bell(start + melodyBeats[index] * beatSeconds, note + answer);
  });
}
write('flight_music', music);
const coin = new Float64Array(Math.round(0.32 * rate));
pluck(coin, 0, hz(84), 0.21, 0.5);
pluck(coin, 0.085, hz(91), 0.23, 0.45);
write('flight_coin', coin);
// A friendly descending boing with midrange harmonics for small phone speakers.
const bump = new Float64Array(Math.round(0.34 * rate));
for (let i = 0; i < bump.length; i++) {
  const t = i / rate;
  const phase = 2 * Math.PI * (720 * t - 620 * t * t);
  bump[i] =
    (Math.sin(phase) + 0.28 * Math.sin(2 * phase)) *
    Math.min(1, t / 0.004) *
    Math.exp(-t * 10) *
    (0.8 + 0.2 * Math.cos(2 * Math.PI * 18 * t)) *
    Math.min(1, (0.34 - t) / 0.035);
}
write('flight_bump', bump);
// Four equally cheerful choice signatures: low/high pitches and different rhythms.
// All finish before the native 400 ms effect-focus timeout.
const choiceNotes = [
  [72, 76],
  [79, 74],
  [76, 79, 84],
  [81, 77, 72],
];
choiceNotes.forEach((notes, index) => {
  const samples = new Float64Array(Math.round(0.36 * rate));
  notes.forEach((note, step) => {
    const start = step * (notes.length === 2 ? 0.1 : 0.075);
    pluck(samples, start, hz(note), 0.36 - start, 0.5);
  });
  write(`choice_${index + 1}`, samples);
});

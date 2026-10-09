/* eslint-env node, es2021 */
// Package two quick cartoon oinks from a CC0 vocal performance.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(
  path.join(root, 'assets/audio/source/piggy-oink-savreese-595471.wav'),
);
assert.equal(source.toString('ascii', 0, 4), 'RIFF');
assert.equal(source.toString('ascii', 8, 12), 'WAVE');
let format;
let pcm;
for (let offset = 12; offset + 8 <= source.length; ) {
  const size = source.readUInt32LE(offset + 4);
  const chunk = source.subarray(offset + 8, offset + 8 + size);
  const type = source.toString('ascii', offset, offset + 4);
  if (type === 'fmt ') {
    format = chunk;
  }
  if (type === 'data') {
    pcm = chunk;
  }
  offset += 8 + size + (size % 2);
}
assert.ok(format && pcm, 'Source WAV must contain format and audio chunks');
assert.equal(format.readUInt16LE(0), 1, 'Source must be PCM');
assert.equal(format.readUInt16LE(2), 1, 'Source must be mono');
assert.equal(format.readUInt16LE(14), 16, 'Source must be 16-bit');
const sampleRate = format.readUInt32LE(4);
// Retain the voiced part of the snort; remove quiet lead-in and trailing breath.
const startSample = Math.round(sampleRate * 0.045);
const endSample = Math.min(pcm.length / 2, Math.round(sampleRate * 0.305));
const inputSamples = endSample - startSample;
const filtered = new Float64Array(inputSamples);
const highPass = Math.exp((-2 * Math.PI * 170) / sampleRate);
const lowPass = 1 - Math.exp((-2 * Math.PI * 3600) / sampleRate);
let previousInput = 0;
let previousHigh = 0;
let low = 0;
let lowSecond = 0;
for (let i = 0; i < inputSamples; i++) {
  const input = pcm.readInt16LE((startSample + i) * 2);
  previousHigh = highPass * (previousHigh + input - previousInput);
  previousInput = input;
  low += lowPass * (previousHigh - low);
  lowSecond += lowPass * (low - lowSecond);
  filtered[i] = lowSecond;
}
// Broad, gentle nasal presence rather than an exaggerated squeaky pitch.
const angle = (2 * Math.PI * 900) / sampleRate;
const resonance = Math.sin(angle) / (2 * 0.85);
const gain = Math.pow(10, 3.5 / 40);
const b0 = 1 + resonance * gain;
const b1 = -2 * Math.cos(angle);
const b2 = 1 - resonance * gain;
const a0 = 1 + resonance / gain;
const a1 = b1;
const a2 = 1 - resonance / gain;
let x1 = 0;
let x2 = 0;
let y1 = 0;
let y2 = 0;
for (let i = 0; i < inputSamples; i++) {
  const input = filtered[i];
  const output = (b0 * input + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
  x2 = x1;
  x1 = input;
  y2 = y1;
  y1 = output;
  filtered[i] = output;
}
// A quick first oink and a slightly lower, softer answer sound less mechanical.
const pitches = [1.22, 1.12];
const levels = [1, 0.9];
const lengths = pitches.map(pitch => Math.floor(inputSamples / pitch));
const gap = Math.round(sampleRate * 0.11);
const samples = lengths[0] + gap + lengths[1];
const waveform = new Float64Array(samples);
const attackSamples = Math.round(sampleRate * 0.006);
const releaseSamples = Math.round(sampleRate * 0.025);
let cursor = 0;
let peak = 0;
for (let burst = 0; burst < pitches.length; burst++) {
  for (let i = 0; i < lengths[burst]; i++) {
    const sourcePosition = i * pitches[burst];
    const left = Math.floor(sourcePosition);
    const fraction = sourcePosition - left;
    const value =
      filtered[left] * (1 - fraction) + filtered[left + 1] * fraction;
    const fade = Math.min(
      1,
      i / attackSamples,
      (lengths[burst] - 1 - i) / releaseSamples,
    );
    waveform[cursor + i] = value * fade * levels[burst];
    peak = Math.max(peak, Math.abs(waveform[cursor + i]));
  }
  cursor += lengths[burst] + gap;
}
// Soften isolated transients so the nasal body remains clear at low volume.
let power = 0;
for (const value of waveform) {
  power += value * value;
}
const threshold = 3 * Math.sqrt(power / (lengths[0] + lengths[1]));
assert.ok(threshold > 0, 'Source must contain audible samples');
peak = 0;
for (let i = 0; i < samples; i++) {
  waveform[i] = threshold * Math.tanh(waveform[i] / threshold);
  peak = Math.max(peak, Math.abs(waveform[i]));
}
assert.ok(peak > 0, 'Source must contain audible samples');
const wav = Buffer.alloc(44 + samples * 2);
wav.write('RIFF', 0);
wav.writeUInt32LE(wav.length - 8, 4);
wav.write('WAVEfmt ', 8);
wav.writeUInt32LE(16, 16);
format.copy(wav, 20, 0, 16);
wav.write('data', 36);
wav.writeUInt32LE(samples * 2, 40);
for (let i = 0; i < samples; i++) {
  wav.writeInt16LE(Math.round((waveform[i] / peak) * 22000), 44 + i * 2);
}
for (const file of [
  'assets/audio/welcome-oink.wav',
  'android/app/src/main/res/raw/welcome_oink.wav',
]) {
  const target = path.join(root, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, wav);
}
console.log(
  `Packaged ${(samples / sampleRate).toFixed(3)}s cartoon oink pair (${
    wav.length
  } bytes).`,
);

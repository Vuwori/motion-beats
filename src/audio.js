import * as Tone from 'tone';

let started = false;

const kick = new Tone.MembraneSynth({
  pitchDecay: 0.05,
  octaves: 8,
  oscillator: { type: 'sine' },
  envelope: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.1 },
}).toDestination();

const snareNoise = new Tone.NoiseSynth({
  noise: { type: 'white' },
  envelope: { attack: 0.001, decay: 0.12, sustain: 0 },
}).toDestination();

const synth = new Tone.MonoSynth({
  oscillator: { type: 'sawtooth' },
  envelope: { attack: 0.02, decay: 0.1, sustain: 0.25, release: 0.2 },
  filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.2, baseFrequency: 120, octaves: 5 },
}).toDestination();

const filter = new Tone.Filter(800, 'lowpass').toDestination();
synth.disconnect();
synth.connect(filter);

export async function startAudio() {
  if (started) return;
  await Tone.start();
  started = true;
  synth.triggerAttack('C3');
}

export function triggerKick() {
  if (!started) return;
  kick.triggerAttackRelease('C1', '8n');
}

export function triggerSnare() {
  if (!started) return;
  snareNoise.triggerAttackRelease('16n');
}

export function setHandSpread(value01) {
  if (!started) return;
  const clamped = Math.max(0, Math.min(1, value01));
  const frequency = 180 + clamped * 5000;
  filter.frequency.rampTo(frequency, 0.04);
}

import * as Tone from 'tone';

let started = false;

// ---------------------------
// MASTER / EFFECTS
// ---------------------------

const master = new Tone.Gain(0.8).toDestination();

const reverb = new Tone.Reverb({
  decay: 2.5,
  wet: 0.2,
}).connect(master);

const filter = new Tone.Filter({
  frequency: 800,
  type: 'lowpass',
}).connect(master);

// ---------------------------
// KICK
// ---------------------------

const kick = new Tone.MembraneSynth({
  pitchDecay: 0.05,
  octaves: 8,
  oscillator: {
    type: 'sine',
  },
  envelope: {
    attack: 0.001,
    decay: 0.3,
    sustain: 0,
    release: 0.1,
  },
}).connect(master);

// ---------------------------
// SNARE / CLAP
// ---------------------------

const snare = new Tone.NoiseSynth({
  noise: {
    type: 'white',
  },
  envelope: {
    attack: 0.001,
    decay: 0.12,
    sustain: 0,
  },
}).connect(reverb);

// ---------------------------
// HI-HAT
// ---------------------------

const hiHat = new Tone.MetalSynth({
  frequency: 250,
  envelope: {
    attack: 0.001,
    decay: 0.06,
    release: 0.01,
  },
  harmonicity: 5.1,
  modulationIndex: 32,
  resonance: 3000,
  octaves: 1.5,
}).connect(master);

hiHat.volume.value = -12;

// ---------------------------
// RAVE STAB
// ---------------------------

const raveSynth = new Tone.PolySynth(Tone.Synth, {
  oscillator: {
    type: 'sawtooth',
  },
  envelope: {
    attack: 0.005,
    decay: 0.15,
    sustain: 0.05,
    release: 0.2,
  },
}).connect(filter);

// ---------------------------
// BASS SYNTH
// ---------------------------

const bass = new Tone.MonoSynth({
  oscillator: {
    type: 'square',
  },
  envelope: {
    attack: 0.01,
    decay: 0.15,
    sustain: 0.2,
    release: 0.1,
  },
  filterEnvelope: {
    attack: 0.01,
    decay: 0.2,
    sustain: 0.1,
    release: 0.1,
    baseFrequency: 80,
    octaves: 3,
  },
}).connect(filter);

// ---------------------------
// CRASH / DROP
// ---------------------------

const crash = new Tone.NoiseSynth({
  noise: {
    type: 'white',
  },
  envelope: {
    attack: 0.001,
    decay: 1.2,
    sustain: 0,
    release: 0.4,
  },
}).connect(reverb);

crash.volume.value = -6;

// ---------------------------
// EDM LOOP
// ---------------------------

const kickLoop = new Tone.Loop((time) => {
  kick.triggerAttackRelease('C1', '8n', time);
}, '4n');

const hatLoop = new Tone.Loop((time) => {
  hiHat.triggerAttackRelease('16n', time);
}, '8n');

const bassPattern = new Tone.Sequence(
  (time, note) => {
    bass.triggerAttackRelease(note, '8n', time);
  },
  ['C2', 'C2', 'Eb2', 'C2', 'G1', 'G1', 'Bb1', 'G1'],
  '8n'
);

// ---------------------------
// START AUDIO
// ---------------------------

export async function startAudio() {
  if (started) return;

  await Tone.start();

  Tone.Transport.bpm.value = 138;

  kickLoop.start(0);
  hatLoop.start('8n');
  bassPattern.start(0);

  Tone.Transport.start();

  started = true;
}

// ---------------------------
// GESTURE TRIGGERS
// ---------------------------

export function triggerKick() {
  if (!started) return;

  kick.triggerAttackRelease('C1', '8n');
}

export function triggerSnare() {
  if (!started) return;

  snare.triggerAttackRelease('16n');
}

export function triggerHiHat() {
  if (!started) return;

  hiHat.triggerAttackRelease('32n');
}

export function triggerRaveStab() {
  if (!started) return;

  raveSynth.triggerAttackRelease(
    ['C4', 'Eb4', 'G4', 'Bb4'],
    '8n'
  );
}

export function triggerCrash() {
  if (!started) return;

  crash.triggerAttackRelease('1n');

  bass.triggerAttackRelease('C1', '2n');
}

// ---------------------------
// HAND-SPREAD FILTER
// ---------------------------

export function setHandSpread(value01) {
  if (!started) return;

  const clamped = Math.max(
    0,
    Math.min(1, value01)
  );

  const minFrequency = 200;
  const maxFrequency = 7000;

  const frequency =
    minFrequency +
    clamped * (maxFrequency - minFrequency);

  filter.frequency.rampTo(
    frequency,
    0.05
  );
}
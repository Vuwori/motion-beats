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

const distortion = new Tone.Distortion({
  distortion: 0.45,
  wet: 0.35,
}).connect(master);

const bitCrusher = new Tone.BitCrusher(5).connect(distortion);

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
  frequency: 320,
  envelope: {
    attack: 0.001,
    decay: 0.08,
    release: 0.02,
  },
  harmonicity: 7.5,
  modulationIndex: 50,
  resonance: 5000,
  octaves: 2,
}).connect(master);

hiHat.volume.value = -10;

// ---------------------------
// METALLIC PERCUSSION
// ---------------------------

const metalHit = new Tone.MetalSynth({
  frequency: 110,
  envelope: {
    attack: 0.001,
    decay: 0.18,
    release: 0.08,
  },
  harmonicity: 12,
  modulationIndex: 64,
  resonance: 7000,
  octaves: 1.5,
}).connect(bitCrusher);

metalHit.volume.value = -7;

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
// METALLIC RAVE SEQUENCER
// ---------------------------

const kickPattern = [
  1, 0, 0, 0,
  1, 0, 0, 0,
  1, 0, 0, 0,
  1, 0, 0, 0,
];

const clapPattern = [
  0, 0, 0, 0,
  1, 0, 0, 0,
  0, 0, 0, 0,
  1, 0, 0, 0,
];

const hatPattern = [
  1, 0, 1, 1,
  1, 0, 1, 0,
  1, 1, 1, 0,
  1, 0, 1, 1,
];

const metalPattern = [
  0, 0, 0, 1,
  0, 0, 1, 0,
  0, 1, 0, 0,
  0, 0, 1, 1,
];

const bassNotes = [
  'C2', null, 'C2', null,
  'Eb2', null, 'C2', null,
  'C2', null, 'G1', null,
  'Bb1', null, 'C2', null,
];

let currentStep = 0;

const sequencer = new Tone.Loop((time) => {
  if (kickPattern[currentStep]) {
    kick.triggerAttackRelease('C1', '8n', time);
  }

  if (clapPattern[currentStep]) {
    snare.triggerAttackRelease('16n', time);
  }

  if (hatPattern[currentStep]) {
    hiHat.triggerAttackRelease('32n', time);
  }

  if (metalPattern[currentStep]) {
    metalHit.triggerAttackRelease('32n', time);
  }

  const note = bassNotes[currentStep];

  if (note) {
    bass.triggerAttackRelease(
      note,
      '16n',
      time
    );
  }

  currentStep =
    (currentStep + 1) % 16;

}, '16n');

// ---------------------------
// START AUDIO
// ---------------------------

export async function startAudio() {
  if (started) return;

  await Tone.start();

  Tone.Transport.bpm.value = 150;

  sequencer.start(0);

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

  bass.triggerAttackRelease(
    'C1',
    '2n'
  );
}

export function triggerMetalHit() {
  if (!started) return;

  metalHit.triggerAttackRelease(
    '32n'
  );
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
    clamped *
    (maxFrequency - minFrequency);

  filter.frequency.rampTo(
    frequency,
    0.05
  );
}
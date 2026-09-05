import './style.css';

import {
  startAudio,
  triggerKick,
  triggerSnare,
  triggerHiHat,
  triggerRaveStab,
  triggerCrash,
  setHandSpread,
} from './audio.js';

import {
  createPoseTracker,
  detectPose,
} from './motion.js';

const video =
  document.querySelector('#webcam');

const canvas =
  document.querySelector('#overlay');

const ctx =
  canvas.getContext('2d');

const startButton =
  document.querySelector('#startButton');

const statusEl =
  document.querySelector('#status');

const spreadFill =
  document.querySelector('#spreadFill');

let running = false;
let lastVideoTime = -1;

// ---------------------------
// GESTURE STATES
// ---------------------------

let rightWasUp = false;
let leftWasUp = false;

let bothHandsWereUp = false;
let handsWereClapped = false;

let baselineHipY = null;
let jumpInProgress = false;

let lastKickAt = 0;
let lastSnareAt = 0;
let lastClapAt = 0;
let lastRaveAt = 0;
let lastJumpAt = 0;

const cooldownMs = 250;

// ---------------------------
// HELPERS
// ---------------------------

function distance(a, b) {
  return Math.hypot(
    a.x - b.x,
    a.y - b.y
  );
}

function drawPoint(
  point,
  radius = 6
) {
  ctx.beginPath();

  ctx.arc(
    point.x * canvas.width,
    point.y * canvas.height,
    radius,
    0,
    Math.PI * 2
  );

  ctx.fill();
}

function drawLine(a, b) {
  ctx.beginPath();

  ctx.moveTo(
    a.x * canvas.width,
    a.y * canvas.height
  );

  ctx.lineTo(
    b.x * canvas.width,
    b.y * canvas.height
  );

  ctx.stroke();
}

// ---------------------------
// SKELETON
// ---------------------------

function renderSkeleton(lm) {
  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  ctx.lineWidth = 4;

  ctx.strokeStyle =
    'rgba(255,255,255,.75)';

  ctx.fillStyle =
    'rgba(255,255,255,.95)';

  const pairs = [
    [11, 12],
    [11, 13],
    [13, 15],
    [12, 14],
    [14, 16],
    [11, 23],
    [12, 24],
    [23, 24],
    [23, 25],
    [25, 27],
    [24, 26],
    [26, 28],
  ];

  pairs.forEach(
    ([a, b]) =>
      drawLine(lm[a], lm[b])
  );

  [
    11,
    12,
    15,
    16,
    23,
    24,
  ].forEach(
    (i) => drawPoint(lm[i])
  );
}

// ---------------------------
// GESTURE DETECTION
// ---------------------------

function handleMappings(
  lm,
  now
) {
  const leftShoulder = lm[11];
  const rightShoulder = lm[12];

  const leftWrist = lm[15];
  const rightWrist = lm[16];

  const leftHip = lm[23];
  const rightHip = lm[24];

  // -----------------------
  // RIGHT HAND → KICK
  // -----------------------

  const rightIsUp =
    rightWrist.y <
    rightShoulder.y - 0.05;

  if (
    rightIsUp &&
    !rightWasUp &&
    now - lastKickAt >
      cooldownMs
  ) {
    triggerKick();

    lastKickAt = now;

    statusEl.textContent =
      'KICK 🔊';
  }

  rightWasUp =
    rightIsUp;

  // -----------------------
  // LEFT HAND → SNARE
  // -----------------------

  const leftIsUp =
    leftWrist.y <
    leftShoulder.y - 0.05;

  if (
    leftIsUp &&
    !leftWasUp &&
    now - lastSnareAt >
      cooldownMs
  ) {
    triggerSnare();

    lastSnareAt = now;

    statusEl.textContent =
      'SNARE 👏';
  }

  leftWasUp =
    leftIsUp;

  // -----------------------
  // CLAP → HI-HAT
  // -----------------------

  const shoulderWidth =
    Math.max(
      distance(
        leftShoulder,
        rightShoulder
      ),
      0.001
    );

  const wristDistance =
    distance(
      leftWrist,
      rightWrist
    );

  const clapThreshold =
    shoulderWidth * 0.45;

  const handsAreClapped =
    wristDistance <
    clapThreshold;

  if (
    handsAreClapped &&
    !handsWereClapped &&
    now - lastClapAt > 220
  ) {
    triggerHiHat();

    lastClapAt = now;

    statusEl.textContent =
      'HI-HAT ⚡';
  }

  handsWereClapped =
    handsAreClapped;

  // -----------------------
  // BOTH HANDS UP
  // → RAVE STAB
  // -----------------------

  const bothHandsUp =
    leftWrist.y <
      leftShoulder.y - 0.15 &&
    rightWrist.y <
      rightShoulder.y - 0.15;

  if (
    bothHandsUp &&
    !bothHandsWereUp &&
    now - lastRaveAt > 600
  ) {
    triggerRaveStab();

    lastRaveAt = now;

    statusEl.textContent =
      'RAVE STAB 🚨';
  }

  bothHandsWereUp =
    bothHandsUp;

  // -----------------------
  // JUMP → CRASH
  // -----------------------

  const hipY =
    (leftHip.y + rightHip.y) / 2;

  // Establish standing position
  if (baselineHipY === null) {
    baselineHipY = hipY;
  }

  // Slowly update baseline while standing
  if (!jumpInProgress) {
    baselineHipY =
      baselineHipY * 0.95 +
      hipY * 0.05;
  }

  // Remember:
  // smaller Y = higher on screen
  const jumpHeight =
    baselineHipY - hipY;

  // Adjust this number if needed
  const jumpThreshold = 0.045;

  if (
    jumpHeight > jumpThreshold &&
    !jumpInProgress &&
    now - lastJumpAt > 800
  ) {
    jumpInProgress = true;

    triggerCrash();

    lastJumpAt = now;

    statusEl.textContent =
      'DROP 💥';
  }

  // Reset once you land
  if (
    jumpInProgress &&
    jumpHeight < 0.015
  ) {
    jumpInProgress = false;
  }

  // -----------------------
  // HAND SPREAD
  // → FILTER
  // -----------------------

  const handSpread =
    wristDistance /
    (
      shoulderWidth *
      3.2
    );

  const normalized =
    Math.max(
      0,
      Math.min(
        1,
        handSpread
      )
    );

  setHandSpread(
    normalized
  );

  spreadFill.style.width =
    `${normalized * 100}%`;
}

// ---------------------------
// CAMERA
// ---------------------------

async function enableCamera() {
  const stream =
    await navigator.mediaDevices
      .getUserMedia({
        video: {
          width: {
            ideal: 1280,
          },

          height: {
            ideal: 720,
          },

          facingMode:
            'user',
        },

        audio: false,
      });

  video.srcObject =
    stream;

  await video.play();
}

// ---------------------------
// CANVAS SIZE
// ---------------------------

function resizeCanvas() {
  const rect =
    video.getBoundingClientRect();

  canvas.width =
    Math.round(
      rect.width *
      devicePixelRatio
    );

  canvas.height =
    Math.round(
      rect.height *
      devicePixelRatio
    );
}

// ---------------------------
// MAIN TRACKING LOOP
// ---------------------------

function loop() {
  if (!running) return;

  if (
    video.currentTime !==
    lastVideoTime
  ) {
    lastVideoTime =
      video.currentTime;

    const result =
      detectPose(
        video,
        performance.now()
      );

    const lm =
      result?.landmarks?.[0];

    if (lm) {
      renderSkeleton(lm);

      handleMappings(
        lm,
        performance.now()
      );
    } else {
      ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      statusEl.textContent =
        'No pose detected — step back so your body is visible.';
    }
  }

  requestAnimationFrame(
    loop
  );
}

// ---------------------------
// START BUTTON
// ---------------------------

startButton.addEventListener(
  'click',
  async () => {
    startButton.disabled =
      true;

    statusEl.textContent =
      'Loading rave machine…';

    try {
      await Promise.all([
        createPoseTracker(),
        startAudio(),
        enableCamera(),
      ]);

      resizeCanvas();

      window.addEventListener(
        'resize',
        resizeCanvas
      );

      running = true;

      statusEl.textContent =
        'RAVE MODE ACTIVE 🔥';

      loop();
    } catch (error) {
      console.error(error);

      statusEl.textContent =
        'Could not start. Check camera permissions and console errors.';

      startButton.disabled =
        false;
    }
  }
);
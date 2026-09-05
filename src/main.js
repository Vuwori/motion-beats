import './style.css';

import {
  startAudio,
  triggerKick,
  triggerSnare,
  triggerHiHat,
  triggerRaveStab,
  triggerCrash,
  triggerMetalHit,
  setHandSpread,
} from './audio.js';

import {
  createPoseTracker,
  detectPose,
} from './motion.js';

import {
  createHandTracker,
  detectHands,
} from './hands.js';

import {
  createBodyGestureDetector,
} from './bodyGestures.js';

import {
  createHandGestureDetector,
} from './handGestures.js';

// ------------------------------------
// DOM
// ------------------------------------

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

// ------------------------------------
// APP STATE
// ------------------------------------

let running = false;
let lastVideoTime = -1;

// ------------------------------------
// POSE SMOOTHING
// ------------------------------------

let smoothedLandmarks = null;

const SMOOTHING = 0.55;
const MIN_VISIBILITY = 0.55;

function isReliable(point) {
  if (!point) return false;

  const visibility =
    point.visibility ?? 1;

  const presence =
    point.presence ?? 1;

  return (
    visibility >= MIN_VISIBILITY &&
    presence >= MIN_VISIBILITY
  );
}

function smoothPoint(
  previous,
  current
) {
  if (!previous) {
    return {
      ...current,
    };
  }

  return {
    ...current,

    x:
      previous.x * SMOOTHING +
      current.x *
        (1 - SMOOTHING),

    y:
      previous.y * SMOOTHING +
      current.y *
        (1 - SMOOTHING),

    z:
      previous.z * SMOOTHING +
      current.z *
        (1 - SMOOTHING),
  };
}

function smoothPose(
  landmarks
) {
  if (!smoothedLandmarks) {
    smoothedLandmarks =
      landmarks.map(
        (point) => ({
          ...point,
        })
      );

    return smoothedLandmarks;
  }

  smoothedLandmarks =
    landmarks.map(
      (point, index) =>
        smoothPoint(
          smoothedLandmarks[index],
          point
        )
    );

  return smoothedLandmarks;
}

// ------------------------------------
// BODY GESTURES
// ------------------------------------

const bodyGestures =
  createBodyGestureDetector({
    isReliable,

    onKick() {
      triggerKick();

      statusEl.textContent =
        'KICK 🔊';
    },

    onSnare() {
      triggerSnare();

      statusEl.textContent =
        'SNARE 👏';
    },

    onClap() {
      triggerHiHat();

      statusEl.textContent =
        'HI-HAT ⚡';
    },

    onRaveStab() {
      triggerRaveStab();

      statusEl.textContent =
        'RAVE STAB 🚨';
    },

    onJump() {
      triggerCrash();

      statusEl.textContent =
        'DROP 💥';
    },

    onHandSpread(value) {
      setHandSpread(value);

      if (spreadFill) {
        spreadFill.style.width =
          `${value * 100}%`;
      }
    },
  });

// ------------------------------------
// HAND / FINGER GESTURES
// ------------------------------------

const handGestures =
  createHandGestureDetector({
    onRockHorns() {
      triggerMetalHit();

      statusEl.textContent =
        'METAL 🤘';
    },

    onPoint() {
      triggerHiHat();

      statusEl.textContent =
        'POINT ⚡';
    },

    onPeace() {
      triggerMetalHit();

      statusEl.textContent =
        'GLITCH ✌️';
    },

    onFingerGun() {
      triggerRaveStab();

      statusEl.textContent =
        'FINGER GUN 👉';
    },

    onOpenPalm() {
      statusEl.textContent =
        'OPEN PALM 🖐';
    },

    onFist() {
      statusEl.textContent =
        'FIST ✊';
    },

    onPinchStart() {
      triggerMetalHit();

      statusEl.textContent =
        'PINCH 🤏';
    },

    onPinchAmount(value) {
      // Later we can connect this
      // continuously to distortion.
      //
      // value:
      // 0 = fingers apart
      // 1 = fully pinched
    },
  });

// ------------------------------------
// DRAWING HELPERS
// ------------------------------------

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

// ------------------------------------
// BODY SKELETON
// ------------------------------------

function renderSkeleton(lm) {
  ctx.lineWidth = 4;

  ctx.strokeStyle =
    'rgba(255,255,255,.65)';

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
    ([a, b]) => {
      if (
        isReliable(lm[a]) &&
        isReliable(lm[b])
      ) {
        drawLine(
          lm[a],
          lm[b]
        );
      }
    }
  );

  [
    11,
    12,
    15,
    16,
    23,
    24,
  ].forEach(
    (index) => {
      if (
        isReliable(
          lm[index]
        )
      ) {
        drawPoint(
          lm[index]
        );
      }
    }
  );
}

// ------------------------------------
// HAND SKELETON
// ------------------------------------

const HAND_CONNECTIONS = [
  // thumb
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],

  // index
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],

  // middle
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12],

  // ring
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16],

  // pinky
  [13, 17],
  [17, 18],
  [18, 19],
  [19, 20],

  // palm
  [0, 17],
];

function renderHand(hand) {
  ctx.strokeStyle =
    'rgba(255,255,255,.85)';

  ctx.fillStyle =
    'rgba(255,255,255,1)';

  ctx.lineWidth = 2;

  HAND_CONNECTIONS.forEach(
    ([a, b]) => {
      drawLine(
        hand[a],
        hand[b]
      );
    }
  );

  hand.forEach(
    (point, index) => {
      const isTip = [
        4,
        8,
        12,
        16,
        20,
      ].includes(index);

      drawPoint(
        point,
        isTip ? 5 : 3
      );
    }
  );
}

// ------------------------------------
// CAMERA
// ------------------------------------

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

// ------------------------------------
// CANVAS
// ------------------------------------

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

// ------------------------------------
// MAIN LOOP
// ------------------------------------

function loop() {
  if (!running) return;

  if (
    video.currentTime !==
    lastVideoTime
  ) {
    lastVideoTime =
      video.currentTime;

    const now =
      performance.now();

    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    // --------------------------------
    // BODY
    // --------------------------------

    const poseResult =
      detectPose(
        video,
        now
      );

    const rawPose =
      poseResult
        ?.landmarks
        ?.[0];

    if (rawPose) {
      const pose =
        smoothPose(
          rawPose
        );

      renderSkeleton(
        pose
      );

      bodyGestures.update(
        pose,
        now
      );
    } else {
      smoothedLandmarks =
        null;

      bodyGestures.reset();
    }

    // --------------------------------
    // HANDS
    // --------------------------------

    const handResult =
      detectHands(
        video,
        now
      );

    const hands =
      handResult
        ?.landmarks ??
      [];

    const handedness =
      handResult
        ?.handedness ??
      [];

    hands.forEach(
      (hand) => {
        renderHand(
          hand
        );
      }
    );

    handGestures.update(
      hands,
      handedness,
      now
    );

    // --------------------------------
    // STATUS
    // --------------------------------

    if (
      !rawPose &&
      hands.length === 0
    ) {
      statusEl.textContent =
        'No person detected — move into view.';
    }
  }

  requestAnimationFrame(
    loop
  );
}

// ------------------------------------
// START BUTTON
// ------------------------------------

startButton.addEventListener(
  'click',
  async () => {
    startButton.disabled =
      true;

    statusEl.textContent =
      'Loading sensors…';

    try {
      await Promise.all([
        createPoseTracker(),
        createHandTracker(),
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
      console.error(
        error
      );

      statusEl.textContent =
        'Could not start. Check camera permissions and console.';

      startButton.disabled =
        false;
    }
  }
);
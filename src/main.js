import './style.css';
import { startAudio, triggerKick, triggerSnare, setHandSpread } from './audio.js';
import { createPoseTracker, detectPose } from './motion.js';

const video = document.querySelector('#webcam');
const canvas = document.querySelector('#overlay');
const ctx = canvas.getContext('2d');
const startButton = document.querySelector('#startButton');
const statusEl = document.querySelector('#status');
const spreadFill = document.querySelector('#spreadFill');

let running = false;
let lastVideoTime = -1;
let rightWasUp = false;
let leftWasUp = false;
let lastKickAt = 0;
let lastSnareAt = 0;
const cooldownMs = 220;

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function drawPoint(point, radius = 6) {
  ctx.beginPath();
  ctx.arc(point.x * canvas.width, point.y * canvas.height, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawLine(a, b) {
  ctx.beginPath();
  ctx.moveTo(a.x * canvas.width, a.y * canvas.height);
  ctx.lineTo(b.x * canvas.width, b.y * canvas.height);
  ctx.stroke();
}

function renderSkeleton(lm) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(255,255,255,.75)';
  ctx.fillStyle = 'rgba(255,255,255,.95)';

  const pairs = [
    [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
    [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28]
  ];

  pairs.forEach(([a, b]) => drawLine(lm[a], lm[b]));
  [11, 12, 15, 16, 23, 24].forEach((i) => drawPoint(lm[i]));
}

function handleMappings(lm, now) {
  const leftShoulder = lm[11];
  const rightShoulder = lm[12];
  const leftWrist = lm[15];
  const rightWrist = lm[16];

  const rightIsUp = rightWrist.y < rightShoulder.y - 0.05;
  const leftIsUp = leftWrist.y < leftShoulder.y - 0.05;

  if (rightIsUp && !rightWasUp && now - lastKickAt > cooldownMs) {
    triggerKick();
    lastKickAt = now;
  }

  if (leftIsUp && !leftWasUp && now - lastSnareAt > cooldownMs) {
    triggerSnare();
    lastSnareAt = now;
  }

  rightWasUp = rightIsUp;
  leftWasUp = leftIsUp;

  const shoulderWidth = Math.max(distance(leftShoulder, rightShoulder), 0.001);
  const handSpread = distance(leftWrist, rightWrist) / (shoulderWidth * 3.2);
  const normalized = Math.max(0, Math.min(1, handSpread));

  setHandSpread(normalized);
  spreadFill.style.width = `${normalized * 100}%`;
}

async function enableCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
    audio: false,
  });
  video.srcObject = stream;
  await video.play();
}

function resizeCanvas() {
  const rect = video.getBoundingClientRect();
  canvas.width = Math.round(rect.width * devicePixelRatio);
  canvas.height = Math.round(rect.height * devicePixelRatio);
}

function loop() {
  if (!running) return;

  if (video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    const result = detectPose(video, performance.now());
    const lm = result?.landmarks?.[0];

    if (lm) {
      renderSkeleton(lm);
      handleMappings(lm, performance.now());
      statusEl.textContent = 'Tracking you — move your hands.';
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      statusEl.textContent = 'No pose detected. Step back so your upper body is visible.';
    }
  }

  requestAnimationFrame(loop);
}

startButton.addEventListener('click', async () => {
  startButton.disabled = true;
  statusEl.textContent = 'Loading pose model…';

  try {
    await Promise.all([createPoseTracker(), startAudio(), enableCamera()]);
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    running = true;
    statusEl.textContent = 'Ready — raise a hand.';
    loop();
  } catch (error) {
    console.error(error);
    statusEl.textContent = 'Could not start. Check camera permission and console errors.';
    startButton.disabled = false;
  }
});

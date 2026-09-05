import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

let poseLandmarker;

export async function createPoseTracker() {
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm'
  );

  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numPoses: 1,
  });

  return poseLandmarker;
}

export function detectPose(video, timestamp) {
  if (!poseLandmarker) return null;
  return poseLandmarker.detectForVideo(video, timestamp);
}

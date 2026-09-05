import {
  FilesetResolver,
  HandLandmarker,
} from '@mediapipe/tasks-vision';

let handLandmarker = null;

export async function createHandTracker() {
  const vision =
    await FilesetResolver
      .forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm'
      );

  handLandmarker =
    await HandLandmarker
      .createFromOptions(
        vision,
        {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',

            delegate:
              'GPU',
          },

          runningMode:
            'VIDEO',

          numHands: 2,

          minHandDetectionConfidence:
            0.55,

          minHandPresenceConfidence:
            0.55,

          minTrackingConfidence:
            0.55,
        }
      );

  return handLandmarker;
}

export function detectHands(
  video,
  timestamp
) {
  if (!handLandmarker) {
    return null;
  }

  return handLandmarker
    .detectForVideo(
      video,
      timestamp
    );
}
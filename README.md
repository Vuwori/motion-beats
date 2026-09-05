# Motion Beats

A browser-based motion instrument that turns webcam body movement into drums and synth controls.

## Features

- Webcam pose tracking with MediaPipe Pose Landmarker
- Right hand above shoulder → kick drum
- Left hand above shoulder → snare
- Distance between hands → synth filter brightness
- Tone.js audio engine
- No backend required

## Run locally

You need Node.js 20+.

```bash
npm install
npm run dev
```

Open the local URL Vite prints, then click **Start camera + audio** and allow camera access.

## Project structure

```text
motion-beats/
├── index.html
├── src/
│   ├── main.js      # app loop + gesture mappings
│   ├── motion.js    # MediaPipe pose tracking
│   ├── audio.js     # Tone.js instruments
│   └── style.css
├── package.json
└── README.md
```

## Gesture mapping idea

The important design rule is to separate pose detection from musical mappings. That way you can replace gestures without rewriting the audio engine.

Ideas to add next:

- clap detection → hi-hat
- jump → crash cymbal
- body lean → stereo panning
- hand height → pitch
- movement speed → distortion / volume
- BPM-synced looping
- sample pads
- recording
- MIDI output to Ableton Live

## GitHub setup

```bash
git init
git add .
git commit -m "Initial Motion Beats prototype"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

## Notes

MediaPipe model files are loaded from public Google/CDN URLs, so the first launch needs internet access. Camera access generally works on `localhost` or HTTPS.

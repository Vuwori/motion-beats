function distance(a, b) {
  return Math.hypot(
    a.x - b.x,
    a.y - b.y
  );
}

export function createBodyGestureDetector({
  isReliable,

  onKick = () => {},
  onSnare = () => {},
  onClap = () => {},
  onRaveStab = () => {},
  onJump = () => {},
  onHandSpread = () => {},
}) {
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

  function reset() {
    rightWasUp = false;
    leftWasUp = false;

    bothHandsWereUp = false;
    handsWereClapped = false;

    baselineHipY = null;
    jumpInProgress = false;
  }

  function update(
    lm,
    now
  ) {
    const leftShoulder =
      lm[11];

    const rightShoulder =
      lm[12];

    const leftWrist =
      lm[15];

    const rightWrist =
      lm[16];

    const leftHip =
      lm[23];

    const rightHip =
      lm[24];

    // --------------------------------
    // RELIABILITY
    // --------------------------------

    const upperReliable =
      isReliable(
        leftShoulder
      ) &&
      isReliable(
        rightShoulder
      ) &&
      isReliable(
        leftWrist
      ) &&
      isReliable(
        rightWrist
      );

    const hipsReliable =
      isReliable(
        leftHip
      ) &&
      isReliable(
        rightHip
      );

    // --------------------------------
    // UPPER BODY
    // --------------------------------

    if (upperReliable) {
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

      // ------------------------------
      // HAND UP THRESHOLD
      // ------------------------------

      const raiseAmount =
        shoulderWidth *
        0.35;

      const rightIsUp =
        rightWrist.y <
        rightShoulder.y -
          raiseAmount;

      const leftIsUp =
        leftWrist.y <
        leftShoulder.y -
          raiseAmount;

      // ------------------------------
      // BOTH HANDS UP
      // ------------------------------

      const bothHandsUp =
        rightIsUp &&
        leftIsUp;

      if (
        bothHandsUp &&
        !bothHandsWereUp &&
        now - lastRaveAt >
          600
      ) {
        onRaveStab();

        lastRaveAt =
          now;
      }

      // ------------------------------
      // RIGHT HAND
      // ------------------------------

      if (
        rightIsUp &&
        !rightWasUp &&
        !bothHandsUp &&
        now - lastKickAt >
          cooldownMs
      ) {
        onKick();

        lastKickAt =
          now;
      }

      // ------------------------------
      // LEFT HAND
      // ------------------------------

      if (
        leftIsUp &&
        !leftWasUp &&
        !bothHandsUp &&
        now - lastSnareAt >
          cooldownMs
      ) {
        onSnare();

        lastSnareAt =
          now;
      }

      // ------------------------------
      // CLAP
      // ------------------------------

      const clapThreshold =
        shoulderWidth *
        0.45;

      const clapped =
        wristDistance <
        clapThreshold;

      if (
        clapped &&
        !handsWereClapped &&
        now - lastClapAt >
          220
      ) {
        onClap();

        lastClapAt =
          now;
      }

      // ------------------------------
      // HAND SPREAD
      // ------------------------------

      const spread =
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
            spread
          )
        );

      onHandSpread(
        normalized
      );

      rightWasUp =
        rightIsUp;

      leftWasUp =
        leftIsUp;

      bothHandsWereUp =
        bothHandsUp;

      handsWereClapped =
        clapped;
    } else {
      rightWasUp = false;
      leftWasUp = false;

      bothHandsWereUp =
        false;

      handsWereClapped =
        false;
    }

    // --------------------------------
    // JUMP
    // --------------------------------

    if (
      hipsReliable &&
      isReliable(
        leftShoulder
      ) &&
      isReliable(
        rightShoulder
      )
    ) {
      const hipY =
        (
          leftHip.y +
          rightHip.y
        ) / 2;

      const shoulderY =
        (
          leftShoulder.y +
          rightShoulder.y
        ) / 2;

      const torsoHeight =
        Math.max(
          Math.abs(
            hipY -
            shoulderY
          ),
          0.05
        );

      if (
        baselineHipY ===
        null
      ) {
        baselineHipY =
          hipY;
      }

      if (
        !jumpInProgress
      ) {
        baselineHipY =
          baselineHipY *
            0.97 +
          hipY *
            0.03;
      }

      const jumpHeight =
        baselineHipY -
        hipY;

      const jumpThreshold =
        torsoHeight *
        0.18;

      const landingThreshold =
        torsoHeight *
        0.05;

      if (
        jumpHeight >
          jumpThreshold &&
        !jumpInProgress &&
        now - lastJumpAt >
          800
      ) {
        jumpInProgress =
          true;

        onJump();

        lastJumpAt =
          now;
      }

      if (
        jumpInProgress &&
        jumpHeight <
          landingThreshold
      ) {
        jumpInProgress =
          false;
      }
    }
  }

  return {
    update,
    reset,
  };
}
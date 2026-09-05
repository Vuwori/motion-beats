function distance(a, b) {
  return Math.hypot(
    a.x - b.x,
    a.y - b.y
  );
}

export function createHandGestureDetector({
  onRockHorns = () => {},
  onPoint = () => {},
  onPeace = () => {},
  onFingerGun = () => {},
  onOpenPalm = () => {},
  onFist = () => {},
  onPinchStart = () => {},
  onPinchAmount = () => {},
}) {
  const states =
    new Map();

  const COOLDOWN = 400;

  function fingerExtended(
    hand,
    tip,
    pip
  ) {
    return (
      hand[tip].y <
      hand[pip].y
    );
  }

  function thumbExtended(
    hand
  ) {
    const thumbTip =
      hand[4];

    const thumbBase =
      hand[2];

    const palm =
      hand[9];

    return (
      distance(
        thumbTip,
        palm
      ) >
      distance(
        thumbBase,
        palm
      ) *
        1.25
    );
  }

  function analyzeHand(
    hand
  ) {
    const thumb =
      thumbExtended(
        hand
      );

    const index =
      fingerExtended(
        hand,
        8,
        6
      );

    const middle =
      fingerExtended(
        hand,
        12,
        10
      );

    const ring =
      fingerExtended(
        hand,
        16,
        14
      );

    const pinky =
      fingerExtended(
        hand,
        20,
        18
      );

    const palmSize =
      Math.max(
        distance(
          hand[0],
          hand[9]
        ),
        0.001
      );

    const pinchDistance =
      distance(
        hand[4],
        hand[8]
      );

    const pinchRatio =
      pinchDistance /
      palmSize;

    const pinchAmount =
      Math.max(
        0,
        Math.min(
          1,
          1 -
            pinchRatio /
              0.75
        )
      );

    const pinched =
      pinchRatio <
      0.32;

    // 🤘
    const rockHorns =
      index &&
      pinky &&
      !middle &&
      !ring;

    // ☝️
    const point =
      index &&
      !middle &&
      !ring &&
      !pinky;

    // ✌️
    const peace =
      index &&
      middle &&
      !ring &&
      !pinky;

    // 👉
    const fingerGun =
      thumb &&
      index &&
      !middle &&
      !ring &&
      !pinky;

    // 🖐
    const openPalm =
      index &&
      middle &&
      ring &&
      pinky;

    // ✊
    const fist =
      !index &&
      !middle &&
      !ring &&
      !pinky;

    return {
      thumb,
      index,
      middle,
      ring,
      pinky,

      pinched,
      pinchAmount,

      rockHorns,
      point,
      peace,
      fingerGun,
      openPalm,
      fist,
    };
  }

  function triggerOnce(
    state,
    gestureName,
    active,
    now,
    callback
  ) {
    const previous =
      state.active[
        gestureName
      ] ?? false;

    const lastTime =
      state.lastTriggered[
        gestureName
      ] ?? 0;

    if (
      active &&
      !previous &&
      now - lastTime >
        COOLDOWN
    ) {
      callback();

      state.lastTriggered[
        gestureName
      ] = now;
    }

    state.active[
      gestureName
    ] = active;
  }

  function getState(
    key
  ) {
    if (
      !states.has(key)
    ) {
      states.set(
        key,
        {
          active: {},
          lastTriggered: {},
        }
      );
    }

    return states.get(
      key
    );
  }

  function update(
    hands,
    handedness,
    now
  ) {
    hands.forEach(
      (hand, index) => {
        const label =
          handedness?.[
            index
          ]?.[0]
            ?.categoryName ??
          `hand-${index}`;

        const state =
          getState(
            label
          );

        const gesture =
          analyzeHand(
            hand
          );

        // ----------------------------
        // PINCH CONTINUOUS CONTROL
        // ----------------------------

        onPinchAmount(
          gesture.pinchAmount,
          label
        );

        // ----------------------------
        // PINCH START
        // ----------------------------

        triggerOnce(
          state,
          'pinch',
          gesture.pinched,
          now,
          () =>
            onPinchStart(
              label
            )
        );

        // ----------------------------
        // ROCK HORNS
        // ----------------------------

        triggerOnce(
          state,
          'rockHorns',
          gesture.rockHorns,
          now,
          () =>
            onRockHorns(
              label
            )
        );

        // ----------------------------
        // PEACE
        // ----------------------------

        triggerOnce(
          state,
          'peace',
          gesture.peace,
          now,
          () =>
            onPeace(
              label
            )
        );

        // ----------------------------
        // FINGER GUN
        // ----------------------------

        triggerOnce(
          state,
          'fingerGun',
          gesture.fingerGun,
          now,
          () =>
            onFingerGun(
              label
            )
        );

        // ----------------------------
        // POINT
        // ----------------------------

        // Finger gun also has
        // index finger extended,
        // so prevent double trigger.

        triggerOnce(
          state,
          'point',
          gesture.point &&
            !gesture.fingerGun,
          now,
          () =>
            onPoint(
              label
            )
        );

        // ----------------------------
        // OPEN PALM
        // ----------------------------

        triggerOnce(
          state,
          'openPalm',
          gesture.openPalm,
          now,
          () =>
            onOpenPalm(
              label
            )
        );

        // ----------------------------
        // FIST
        // ----------------------------

        triggerOnce(
          state,
          'fist',
          gesture.fist,
          now,
          () =>
            onFist(
              label
            )
        );
      }
    );
  }

  function reset() {
    states.clear();
  }

  return {
    update,
    reset,
  };
}
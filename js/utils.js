/**
 * Small shared math / helper utilities. Plain globals (no bundler in this
 * project) — everything lives under window.Utils to avoid polluting scope.
 */
window.Utils = (function () {
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  // frame-rate independent easing factor: given a "per 60fps-frame" ease
  // amount, returns the equivalent factor for the actual elapsed ms.
  function easeFactor(perFrame, dtMs) {
    return 1 - Math.pow(1 - perFrame, dtMs / (1000 / 60));
  }

  // deterministic string -> 32bit int hash (djb2 variant)
  function hashString(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 33) ^ str.charCodeAt(i);
    }
    return hash >>> 0;
  }

  // mulberry32 PRNG — deterministic, seeded. Returns a function that
  // yields floats in [0, 1) on each call.
  function seededRandom(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // deterministic jitter helpers keyed off a city id — same id always
  // produces the same composition offsets, but each city looks distinct
  // and new cities get their own stable, unique variation automatically.
  function jitterFor(id) {
    const rand = seededRandom(hashString(id));
    return {
      x: (rand() * 2 - 1), // -1..1
      y: (rand() * 2 - 1),
      rotation: (rand() * 2 - 1),
      scale: (rand() * 2 - 1),
      lane: rand(),
    };
  }

  return { clamp, lerp, easeFactor, hashString, seededRandom, jitterFor };
})();

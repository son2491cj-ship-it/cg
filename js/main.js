/**
 * Bootstraps the FIRST SCREEN: custom cursor + city composition, driven by
 * a single shared requestAnimationFrame loop.
 */
(function () {
  function start() {
    const cursorEl = document.getElementById("custom-cursor");
    const compositionRoot = document.getElementById("composition");
    const rotationReadout = document.getElementById("rotation-readout");
    // the actual background ring — this is the real reference path city
    // text is anchored to, not a separately-invented curve. See composition.js.
    // Using the larger outer ring (.ring--b) — the inner one read too small.
    const orbitEl = document.querySelector(".ring--b");

    const cursor = new window.CustomCursor(cursorEl);
    const composition = new window.CityComposition({
      root: compositionRoot,
      cities: window.CITY_DATA,
      rotationReadout,
      orbitEl,
    });

    let lastTime = null;

    function frame(time) {
      if (lastTime === null) lastTime = time;
      // clamp dt so a background tab / dev-tools pause doesn't fling the wheel
      const dt = Math.min(time - lastTime, 48);
      lastTime = time;

      cursor.update(dt);
      composition.tick(dt);

      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);

    // keyboard: ESC reserved for SECOND SCREEN -> FIRST SCREEN navigation
    // once that view exists (see brief section 16). No-op for now.
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        document.dispatchEvent(new CustomEvent("navigation:escape"));
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();

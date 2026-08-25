/**
 * CityComposition — the FIRST SCREEN typographic centerpiece.
 *
 * Cities are not laid out on a grid. Each city is placed as if printed on
 * the rim of a large, mostly off-screen wheel that spins around a fixed
 * "invisible axis" point. Scrolling adds angular velocity to that wheel;
 * friction brings it to rest (inertia). The wheel has more circumference
 * than cities, so instances repeat as it turns — that repetition is what
 * makes the scroll feel infinite in both directions.
 *
 * Only three CSS properties are ever animated per frame: transform and
 * opacity (see section 18 of the brief) — no layout-triggering properties
 * are touched inside the animation loop.
 */
window.CityComposition = class CityComposition {
  constructor({ root, cities, rotationReadout, orbitEl }) {
    this.root = root;
    this.cities = cities;
    this.rotationReadoutEl = rotationReadout;
    // the actual rendered background ring (.ring--b, the outer one) — the
    // real reference path. Its live geometry (getBoundingClientRect) is
    // read every resize and used AS-IS for city anchoring; no separate curve.
    this.orbitEl = orbitEl;

    this.N = cities.length;
    this.LANES = [-1, 0, 1]; // duplicate loops rendered per city, see file header

    // wheel state
    this.position = 0; // continuous, in "item units" (1 = one city apart)
    this.velocity = 0; // item units / second
    this.lean = 0; // current eased whole-composition tilt, degrees
    this._lastReadout = null;

    // tunables ---------------------------------------------------------
    this.SENSITIVITY = 0.03; // wheel deltaY px -> item units/sec added
    this.MAX_VELOCITY = 10; // item units / sec
    this.DECAY_PER_SEC = 0.07; // fraction of velocity remaining after 1s
    this.LEAN_FACTOR = 1.15; // deg per (item unit/sec) of velocity
    this.MAX_LEAN = 9; // deg
    // desired on-screen px spacing between cities AT the center of the
    // orbit (theta=0) — used to derive a constant angular step so density
    // stays visually consistent across viewport sizes / orbit radii.
    this.CENTER_SPACING = 50; // px
    this.ROTATION_MULTIPLIER = 0.6; // fraction of the orbit angle applied as rotation (0.5-0.7 reads natural)
    this.ROTATION_CLAMP = 60; // deg, generous safety clamp only
    this.THETA_FADE_START = 50; // deg, full opacity within this angle of center
    this.THETA_FADE_END = 84; // deg, opacity reaches ~0 here — stays inside the circle's right hemisphere
    // --------------------------------------------------------------------

    this._buildDom();
    this._handleResize(); // establishes layout metrics
    this._bindEvents();
  }

  _buildDom() {
    this.wrapper = document.createElement("div");
    this.wrapper.className = "composition__wheel";
    this.root.appendChild(this.wrapper);

    this.slots = [];

    this.LANES.forEach((laneOffset) => {
      this.cities.forEach((city, phase) => {
        const slot = document.createElement("div");
        slot.className = "city-slot";

        const line = document.createElement("button");
        line.type = "button";
        line.className = "city-line js-cursor-hover";
        line.setAttribute("data-city-id", city.id);
        line.setAttribute("aria-label", `${city.city}, ${city.country}`);

        const name = document.createElement("span");
        name.className = "city-name";
        name.textContent = city.city;

        const sep = document.createElement("span");
        sep.className = "city-sep";
        sep.textContent = ",";

        const country = document.createElement("span");
        country.className = "city-country";
        country.textContent = city.country;

        line.appendChild(name);
        line.appendChild(sep);
        line.appendChild(country);
        slot.appendChild(line);
        this.wrapper.appendChild(slot);

        const jitter = window.Utils.jitterFor(city.id + ":" + laneOffset);

        this.slots.push({
          el: slot,
          lineEl: line,
          city,
          phase,
          laneOffset,
          jitter,
        });

        line.addEventListener("click", () => this._selectCity(city, line));
        line.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            this._selectCity(city, line);
          }
        });
      });
    });
  }

  _selectCity(city, lineEl) {
    lineEl.classList.add("city-line--pulse");
    window.setTimeout(() => lineEl.classList.remove("city-line--pulse"), 500);

    // SECOND SCREEN is not implemented yet (see brief, STEP 4+).
    // The event is dispatched now so that wiring can be added later
    // without touching this composition code.
    document.dispatchEvent(
      new CustomEvent("city:select", { detail: { city } })
    );
    // eslint-disable-next-line no-console
    console.log(
      `[world-clock] selected ${city.city}, ${city.country} — SECOND SCREEN not built yet.`
    );
  }

  _bindEvents() {
    window.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        const mode = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
        const delta = e.deltaY * mode;
        this.velocity = window.Utils.clamp(
          this.velocity + delta * this.SENSITIVITY,
          -this.MAX_VELOCITY,
          this.MAX_VELOCITY
        );
      },
      { passive: false }
    );

    window.addEventListener("resize", () => this._handleResize());
  }

  _handleResize() {
    this.viewportW = window.innerWidth;
    this.viewportH = window.innerHeight;

    // Read the ACTUAL background ring's live geometry — center + radius —
    // and use it as-is. This is the one and only source of truth for city
    // positioning; nothing here is a separately-invented curve, and the
    // ring's own size/position (css/styles.css `.ring--b`) is never
    // touched from here.
    const orbitRect = this.orbitEl.getBoundingClientRect();
    this.axisX = orbitRect.left + orbitRect.width / 2;
    this.centerY = orbitRect.top + orbitRect.height / 2;
    this.orbitRadius = orbitRect.width / 2;

    // constant clearance between the orbit line and the text's left edge,
    // applied along the LOCAL OUTWARD RADIAL direction at each anchor
    // (section 3) — a fixed magnitude, never varying city to city.
    this.orbitGap = window.Utils.clamp(this.viewportW * 0.026, 28, 46);

    // constant angular step between cities (section 5: equal arc length
    // along the orbit, not equal pixels) — derived so that spacing near
    // theta=0 (screen-center, where the arc is most "vertical") comes out
    // to roughly CENTER_SPACING px, and scales automatically with radius.
    this.angleStepDeg =
      (this.CENTER_SPACING / this.orbitRadius) * (180 / Math.PI);

    document.documentElement.style.setProperty(
      "--rings-x",
      `${this.axisX}px`
    );
    document.documentElement.style.setProperty(
      "--rings-y",
      `${this.centerY}px`
    );
  }

  /** Advance wheel physics + write transforms. Called once per rAF tick. */
  tick(dt) {
    const dtSec = dt / 1000;

    // integrate position, then decay velocity (frame-rate independent)
    this.position += this.velocity * dtSec;
    this.velocity *= Math.pow(this.DECAY_PER_SEC, dtSec);
    if (Math.abs(this.velocity) < 0.001) this.velocity = 0;

    // whole-composition lean, eased toward the current velocity
    const leanTarget = window.Utils.clamp(
      this.velocity * this.LEAN_FACTOR,
      -this.MAX_LEAN,
      this.MAX_LEAN
    );
    this.lean += (leanTarget - this.lean) * window.Utils.easeFactor(0.1, dt);
    this.wrapper.style.transform = `rotate(${this.lean.toFixed(3)}deg)`;

    this._layoutSlots();
    this._updateReadout();
  }

  _layoutSlots() {
    const N = this.N;
    const {
      position,
      axisX,
      centerY,
      orbitRadius,
      orbitGap,
      angleStepDeg,
      THETA_FADE_START,
      THETA_FADE_END,
    } = this;
    const DEG2RAD = Math.PI / 180;

    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      const k =
        Math.round((position - slot.phase) / N) + slot.laneOffset;
      const slotBase = slot.phase + N * k;

      // Equal ARC LENGTH spacing along the real orbit (section 5): a
      // constant angle per city, not a constant pixel step. theta=0 is
      // screen-center (the orbit's rightmost/"3 o'clock" point); theta
      // grows away from it in either direction as cities scroll past.
      const thetaDeg = (slotBase - position) * angleStepDeg;
      const thetaRad = thetaDeg * DEG2RAD;
      const cosT = Math.cos(thetaRad);
      const sinT = Math.sin(thetaRad);

      // The point ON the orbit itself (section 1/2) — this IS a point on
      // the real background circle, not an approximation of one.
      const onOrbitX = axisX + orbitRadius * cosT;
      const onOrbitY = centerY + orbitRadius * sinT;

      // Push outward along the LOCAL RADIAL direction by a constant
      // orbitGap (section 3) — (cosT, sinT) is exactly that direction at
      // this anchor, so the offset is always perpendicular clearance from
      // the line itself, never a same-city-varying amount.
      const xOffset = onOrbitX + orbitGap * cosT;
      const itemY = onOrbitY + orbitGap * sinT;

      // Rotation follows this SAME theta (the orbit's local angle at the
      // anchor), scaled down so text doesn't hug the circle too literally
      // (section 4) — continuous and deterministic, never per-city random.
      const rotation = window.Utils.clamp(
        thetaDeg * this.ROTATION_MULTIPLIER,
        -this.ROTATION_CLAMP,
        this.ROTATION_CLAMP
      );

      // Fade + shrink slightly as cities approach the back of the visible
      // (right-hemisphere) arc (section 6), instead of a separate pixel-
      // distance measure — everything is now driven by theta alone. theta
      // is unbounded (index distance keeps growing as items scroll past
      // and wrap), and cos/sin are periodic, so anything past
      // THETA_FADE_END must hit exactly 0 opacity — a nonzero floor here
      // reappears as a ghost trail wrapped around the far side of the
      // circle once enough wrapped-around slots stack up.
      const absTheta = Math.abs(thetaDeg);
      const edgeFade =
        1 -
        window.Utils.clamp(
          (absTheta - THETA_FADE_START) / (THETA_FADE_END - THETA_FADE_START),
          0,
          1
        );
      const opacity = window.Utils.clamp(edgeFade, 0, 1);
      const depthScale = 1 - Math.min(absTheta / THETA_FADE_END, 1) * 0.12;
      const scale = window.Utils.clamp(
        depthScale + slot.jitter.scale * 0.04,
        0.8,
        1.06
      );

      slot.el.style.transform = `translate3d(${xOffset.toFixed(
        1
      )}px, ${itemY.toFixed(1)}px, 0) rotate(${rotation.toFixed(
        2
      )}deg) scale(${scale.toFixed(3)})`;
      slot.el.style.opacity = opacity.toFixed(3);
      slot.el.style.zIndex = String(1000 - Math.round(absTheta * 10));
      // fully-culled instances (wrapped around behind the visible arc)
      // shouldn't be hit-testable either, even though they're invisible.
      slot.el.style.pointerEvents = opacity <= 0 ? "none" : "auto";
    }
  }

  _updateReadout() {
    if (!this.rotationReadoutEl) return;
    const angleStep = 360 / this.N;
    let deg = Math.round((this.position * angleStep) % 360);
    if (deg < 0) deg += 360;
    if (deg !== this._lastReadout) {
      this._lastReadout = deg;
      this.rotationReadoutEl.textContent =
        String(deg).padStart(3, "0") + "°";
    }
  }
};

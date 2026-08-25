# WORLD / TIME — Editorial World Clock

Experimental, desktop-only interactive world clock. Editorial typography +
an analog clock + art direction, not a utility dashboard. See the full
design brief that drove this build for the complete spec (colors, motion,
future screens, etc.).

## Status

- **STEP 1** — project analyzed, stack decided (see below).
- **STEP 2 / 3** — FIRST SCREEN implemented and polished: background,
  orbital city typography, custom cursor, scroll inertia, hover motion.
  **Considered final/locked** — nothing here should change while later
  steps are built.
- **STEP 4/5** — SECOND SCREEN is implemented and **data-driven per
  city** (`js/second-screen.js`) — **all 30 cities** in `cities.js` now
  navigate there on click. `second-screen.js` just listens for the
  `city:select` event `composition.js` already dispatched; no FIRST
  SCREEN file is touched. What's live for every city:
  - real-time analog clock (hour/minute/second hands, hour creeps with
    minutes) driven off that city's own IANA timezone via
    `Intl.DateTimeFormat`
  - live weekday/date/UTC-offset text, also `Intl`-only, no network
  - live weather (temp °C/°F + condition) from
    [Open-Meteo](https://open-meteo.com) — free, no API key, refetched
    every 15 min; falls back to "Weather unavailable" text if the
    request fails, so it never breaks layout
  - left panel background = a **solid** deep tone auto-picked from that
    city's `flagColors` (`pickPanelColor()` in `second-screen.js` —
    darkest color in the list by approximate luminance; if even that's
    too light to hold white text, as with Argentina's light-blue/white
    flag, it's darkened in HSL space, keeping its hue). Always legible,
    no per-city tuning needed. The actual flag lives in the small
    borderless chip, top right of the panel (`#detail-flagchip`) — for
    13 flags a plain stripe gradient would misrepresent (Nordic crosses,
    Switzerland, Japan's circle, the Union Jack family, US/China/Brazil's
    stars and emblems), it's a small bespoke SVG icon
    (`FLAG_ICON_BUILDERS`); every other flag is genuinely just stripes
    (`horizontal` or `vertical` per `flagOrientation`, matching how it's
    actually striped — France/Italy/Portugal/Belgium/Ireland/Canada/
    Mexico are vertical), so the plain gradient chip stays accurate
  - a generated, abstract monotone graphic fills the right panel.
    **Seoul** (ridge silhouette + eave-curve), **Berlin** (colonnade +
    pediment), **New York** (hard-edged skyscraper grid + signature
    tapered tower), **Tokyo** (concentric night glow + lattice-tower
    structure + scattered rings), and **Bangkok** (tiered wat roofline +
    chedi spire) have a bespoke motif in `CITYSCAPE_BUILDERS` so far;
    every other city uses `defaultCityscape()`, a generic
    layered-silhouette fallback — still abstract/monotone, just not
    city-specific yet. If a real photo is later dropped in at the path
    already in `cities.js` (e.g. `assets/cities/paris.jpg`), it loads
    automatically,
    grayscale-filtered, over whichever graphic is showing — nothing to
    wire up.
  - `← ALL CITIES` button and `Esc` both return to FIRST SCREEN (the
    `Esc` handler already existed in `main.js`, unused, from STEP 1)
- STEP 6/7 (bespoke cityscape motifs for the other 28 cities, full
  cinematic transition polish) are **not built yet**.

## Stack

No bundler — **Node.js / npm are not installed in this environment**, so
this is plain HTML/CSS/JS loaded as ordinary (non-module) `<script>` tags,
which also means it runs straight from `file://` with zero setup. If Node
becomes available later, this can be ported into a Vite/React project
without changing the design — the physics/layout logic is already isolated
in plain functions/classes.

```
index.html
css/
  styles.css         FIRST + SECOND SCREEN styles, design tokens
js/
  data/cities.js     the single source of truth for all city data
  utils.js           math + deterministic per-city jitter helpers
  cursor.js          CustomCursor — trailing, easing custom pointer
  composition.js     CityComposition — the orbital typography wheel
  main.js            bootstraps FIRST SCREEN, shared rAF loop
  second-screen.js   SECOND SCREEN — Seoul only for now (see Status)
```

## How to view it

Simplest: double-click `index.html`. Everything is plain `<script>` tags
(no `import`/`export`), so it works directly over `file://` — no local
server required. An internet connection is needed for the Inter typeface
(Google Fonts) and, on the Seoul SECOND SCREEN, for live weather
(Open-Meteo, called via `fetch`). If a browser ever balks at `fetch` from
a `file://` page, serving the folder with any static server (e.g. VS
Code's "Live Server") removes all doubt — everything else works
identically either way.

If you'd rather serve it (e.g. VS Code's "Live Server" extension, or any
static file server), that works identically.

## How the FIRST SCREEN composition works

Cities aren't placed on a grid. Each city is treated as if printed on the
rim of a large, mostly off-screen wheel that spins around a fixed
invisible axis point. The wheel has more
circumference than there are cities, so instances repeat as it turns —
that's what makes scrolling feel infinite in both directions, and it's why
adding a city to `js/data/cities.js` is enough: composition, spacing,
rotation jitter, and hover behavior are all derived from the data, not
hand-placed.

- **Scroll** adds angular velocity to the wheel (`composition.js`
  `_bindEvents`'s wheel handler); a `requestAnimationFrame` loop
  (`main.js`) integrates position from that velocity every frame and
  decays it (friction), producing the "spin, then settle" inertia feel.
  The whole composition also leans a few degrees in the scroll direction
  while moving, echoing "a big circular object spinning."
- **Layout** (`_layoutSlots`) is driven off the *actual* background ring
  (`.ring--b`, the larger outer one, in `css/styles.css`) — not a
  separately invented curve. `_handleResize` reads that element's live
  `getBoundingClientRect()` every resize and uses its center/radius as
  the one source of truth (`this.axisX/this.centerY/this.orbitRadius`).
  Cities are distributed along it by **equal arc length** (a constant
  `angleStepDeg`, not equal pixels), each city's true point on that
  circle computed with plain `cos`/`sin` (`theta=0` at screen-center,
  growing away from it in either direction). Since `theta` keeps growing
  unbounded as a city's index-distance from the current scroll position
  increases (it wraps around the circle many times over), anything past
  `THETA_FADE_END` is hard-culled to **exactly** `opacity: 0` (and
  `pointer-events: none`) — a nonzero floor there is what caused the
  earlier ghost-trail artifact once enough wrapped-around instances
  stacked up around the far side. The text's **left edge** is pushed a
  constant `orbitGap` outward along that point's own radial direction —
  a true perpendicular offset from the line, so it never overlaps it at
  any angle. Rotation reuses that same `theta`, scaled down by
  `ROTATION_MULTIPLIER` — continuous and deterministic, not per-city
  jitter (only scale gets a small `Utils.jitterFor`-seeded variation, for
  a touch of texture without disturbing position/rotation).
- **Cursor** (`cursor.js`) is a small blue dot that eases toward the real
  pointer position (lag in, decelerates when the mouse stops) and grows
  slightly over any element tagged `.js-cursor-hover`.
- **Hover** on a city nudges only its text rightward via a separate CSS
  transition on the inner `<button>` (decoupled from the per-frame
  position transform on its parent), so hover motion stays instant and
  cheap.

Only `transform` and `opacity` are touched inside the animation loop —
nothing that triggers layout — per the brief's performance requirement.

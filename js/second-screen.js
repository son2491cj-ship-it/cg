/**
 * SECOND SCREEN — city detail view.
 *
 * Data-driven per city — every city in js/data/cities.js now navigates
 * here (it just needs lat/lon + flagColors, which all 30 have). It
 * listens for the `city:select` event composition.js ALREADY dispatches
 * on every city click — nothing in composition.js/cursor.js/main.js is
 * touched to make this work.
 *
 * Only Seoul and Berlin have a bespoke CITYSCAPE_BUILDERS graphic so
 * far; every other city falls back to defaultCityscape() (a generic,
 * still-abstract/monotone silhouette) until one is added for it.
 *
 * Real-time data:
 *   - date/time: Intl.DateTimeFormat against the city's IANA timezone,
 *     no network call.
 *   - weather: Open-Meteo (https://open-meteo.com) — free, no API key,
 *     CORS-open. Needs the city's lat/lon (see js/data/cities.js).
 */
(function () {
  const WEATHER_CODES = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm, slight hail",
    99: "Thunderstorm, heavy hail",
  };

  const WEATHER_REFRESH_MS = 15 * 60 * 1000; // 15 min
  const CLOCK_RESYNC_MS = 30 * 1000; // 30 sec

  function hexToRgb(hex) {
    const clean = hex.replace("#", "");
    const full =
      clean.length === 3
        ? clean
            .split("")
            .map((c) => c + c)
            .join("")
        : clean;
    const int = parseInt(full, 16);
    return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
  }

  // approximate perceptual luminance (0 = black, ~255 = white) — good
  // enough for relative comparison, not a certified WCAG contrast ratio
  function luminance({ r, g, b }) {
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  // rgb -> hsl -> clamp lightness -> rgb, so a too-light color keeps its
  // hue (still reads as "that flag's color") but gets dark enough for
  // white text to sit on comfortably.
  function darkenHex(hex, maxLightness) {
    const { r, g, b } = hexToRgb(hex);
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
      else if (max === gn) h = (bn - rn) / d + 2;
      else h = (rn - gn) / d + 4;
      h /= 6;
    }
    if (l <= maxLightness) return hex; // already dark enough

    const hue2rgb = (p, q, t) => {
      let tt = t;
      if (tt < 0) tt += 1;
      if (tt > 1) tt -= 1;
      if (tt < 1 / 6) return p + (q - p) * 6 * tt;
      if (tt < 1 / 2) return q;
      if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
      return p;
    };
    const q = maxLightness < 0.5
      ? maxLightness * (1 + s)
      : maxLightness + s - maxLightness * s;
    const p = 2 * maxLightness - q;
    const r2 = s === 0 ? maxLightness : hue2rgb(p, q, h + 1 / 3);
    const g2 = s === 0 ? maxLightness : hue2rgb(p, q, h);
    const b2 = s === 0 ? maxLightness : hue2rgb(p, q, h - 1 / 3);
    const toHex = (v) =>
      Math.round(v * 255)
        .toString(16)
        .padStart(2, "0");
    return `#${toHex(r2)}${toHex(g2)}${toHex(b2)}`;
  }

  // Picks ONE deep tone from a flag's own colors for the solid info-panel
  // background (the full multi-color flag still shows in the small chip).
  // Takes the darkest color already in the list; if even that is too
  // light to hold white text (e.g. Argentina's light blue + white has no
  // dark option at all), darkens it while keeping its hue.
  const PANEL_LUMA_THRESHOLD = 140;
  const PANEL_MAX_LIGHTNESS = 0.32;
  function pickPanelColor(colors) {
    let darkest = colors[0];
    let darkestLuma = Infinity;
    colors.forEach((c) => {
      const luma = luminance(hexToRgb(c));
      if (luma < darkestLuma) {
        darkestLuma = luma;
        darkest = c;
      }
    });
    return darkestLuma > PANEL_LUMA_THRESHOLD
      ? darkenHex(darkest, PANEL_MAX_LIGHTNESS)
      : darkest;
  }

  /**
   * Equal-width stripes from a color list, in the given direction —
   * "horizontal" (top to bottom, the default) or "vertical" (left to
   * right), matching that flag's actual stripe direction where it has
   * one (see flagOrientation in js/data/cities.js).
   */
  function stripesGradient(colors, orientation) {
    const n = colors.length;
    const stops = [];
    colors.forEach((color, i) => {
      const start = ((i / n) * 100).toFixed(3);
      const end = (((i + 1) / n) * 100).toFixed(3);
      stops.push(`${color} ${start}%`, `${color} ${end}%`);
    });
    const direction = orientation === "vertical" ? "to right" : "to bottom";
    return `linear-gradient(${direction}, ${stops.join(", ")})`;
  }

  // Small (0 0 60 40) flag ICONS with their actual emblem — for flags a
  // plain stripe gradient badly misrepresents (crosses, a circle, unions,
  // stars). Every other city just keeps the plain stripesGradient() chip.
  function nordicCross(field, cross, fimbriation) {
    const fimb = fimbriation
      ? `<rect x="20" y="0" width="12" height="40" fill="${fimbriation}"/>
         <rect x="0" y="14" width="60" height="12" fill="${fimbriation}"/>`
      : "";
    return `
      <rect x="0" y="0" width="60" height="40" fill="${field}"/>
      ${fimb}
      <rect x="22" y="0" width="8" height="40" fill="${cross}"/>
      <rect x="0" y="16" width="60" height="8" fill="${cross}"/>
    `;
  }

  function swissCross() {
    return `
      <rect x="0" y="0" width="60" height="40" fill="#FF0000"/>
      <rect x="24" y="8" width="12" height="24" fill="#FFFFFF"/>
      <rect x="14" y="16" width="32" height="8" fill="#FFFFFF"/>
    `;
  }

  function japanCircle() {
    return `
      <rect x="0" y="0" width="60" height="40" fill="#FFFFFF"/>
      <circle cx="30" cy="20" r="11" fill="#BC002D"/>
    `;
  }

  // shared Union Jack diagonal+plus mark, scaled to fill (0,0)-(w,h)
  function unionJackMarks(w, h) {
    return `
      <path d="M0,0 L${w},${h} M${w},0 L0,${h}" stroke="#FFFFFF" stroke-width="${(h * 0.2).toFixed(2)}"/>
      <path d="M0,0 L${w},${h} M${w},0 L0,${h}" stroke="#C8102E" stroke-width="${(h * 0.08).toFixed(2)}"/>
      <path d="M${w / 2},0 L${w / 2},${h} M0,${h / 2} L${w},${h / 2}" stroke="#FFFFFF" stroke-width="${(h * 0.3).toFixed(2)}"/>
      <path d="M${w / 2},0 L${w / 2},${h} M0,${h / 2} L${w},${h / 2}" stroke="#C8102E" stroke-width="${(h * 0.15).toFixed(2)}"/>
    `;
  }

  function unionJack() {
    return `<rect x="0" y="0" width="60" height="40" fill="#012169"/>${unionJackMarks(60, 40)}`;
  }

  function unionJackCanton(starsSvg) {
    return `
      <rect x="0" y="0" width="60" height="40" fill="#00247D"/>
      ${unionJackMarks(30, 20)}
      ${starsSvg}
    `;
  }

  const AU_STARS = `
    <circle cx="45" cy="10" r="1.6" fill="#FFFFFF"/>
    <circle cx="52" cy="18" r="1.6" fill="#FFFFFF"/>
    <circle cx="48" cy="27" r="1.6" fill="#FFFFFF"/>
    <circle cx="40" cy="30" r="1.6" fill="#FFFFFF"/>
    <circle cx="18" cy="30" r="1.8" fill="#FFFFFF"/>
  `;
  const NZ_STARS = `
    <circle cx="46" cy="9" r="1.8" fill="#C8102E" stroke="#FFFFFF" stroke-width="0.6"/>
    <circle cx="53" cy="16" r="1.8" fill="#C8102E" stroke="#FFFFFF" stroke-width="0.6"/>
    <circle cx="48" cy="26" r="1.8" fill="#C8102E" stroke="#FFFFFF" stroke-width="0.6"/>
    <circle cx="40" cy="20" r="1.8" fill="#C8102E" stroke="#FFFFFF" stroke-width="0.6"/>
  `;

  function usaFlag() {
    let stripes = "";
    const stripeH = 40 / 7;
    for (let i = 0; i < 7; i++) {
      stripes += `<rect x="0" y="${(i * stripeH).toFixed(2)}" width="60" height="${stripeH.toFixed(2)}" fill="${i % 2 === 0 ? "#B31942" : "#FFFFFF"}"/>`;
    }
    const cantonH = (stripeH * 4).toFixed(2);
    const starPositions = [
      [6, 4], [13, 4], [20, 4],
      [9, 9], [16, 9],
      [6, 14], [13, 14], [20, 14],
    ];
    const stars = starPositions
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.2" fill="#FFFFFF"/>`)
      .join("");
    return `
      ${stripes}
      <rect x="0" y="0" width="26" height="${cantonH}" fill="#0A3161"/>
      ${stars}
    `;
  }

  function chinaFlag() {
    return `
      <rect x="0" y="0" width="60" height="40" fill="#DE2910"/>
      <path d="M12,6 L14,12 L20,12 L15,16 L17,22 L12,18 L7,22 L9,16 L4,12 L10,12 Z" fill="#FFDE00"/>
      <circle cx="24" cy="4" r="1.3" fill="#FFDE00"/>
      <circle cx="27" cy="8" r="1.3" fill="#FFDE00"/>
      <circle cx="27" cy="13" r="1.3" fill="#FFDE00"/>
      <circle cx="24" cy="17" r="1.3" fill="#FFDE00"/>
    `;
  }

  function brazilFlag() {
    return `
      <rect x="0" y="0" width="60" height="40" fill="#009739"/>
      <polygon points="30,4 54,20 30,36 6,20" fill="#FEDD00"/>
      <circle cx="30" cy="20" r="8" fill="#002776"/>
    `;
  }

  // one trigram (kwae) — 3 stacked bars, centered on its own local origin
  // so the caller can position + rotate it as a whole. pattern: 1 = solid
  // ("yang") bar, 0 = broken ("yin") bar (two halves with a gap).
  function trigram(pattern) {
    const barW = 9;
    const barH = 1.3;
    const rowGap = 1.6;
    const gapX = 1.5;
    return pattern
      .map((solid, i) => {
        const y = (i - 1) * (barH + rowGap) - barH / 2;
        if (solid) {
          return `<rect x="${(-barW / 2).toFixed(2)}" y="${y.toFixed(2)}" width="${barW}" height="${barH}" fill="#111111"/>`;
        }
        const half = (barW - gapX) / 2;
        return (
          `<rect x="${(-barW / 2).toFixed(2)}" y="${y.toFixed(2)}" width="${half.toFixed(2)}" height="${barH}" fill="#111111"/>` +
          `<rect x="${(gapX / 2).toFixed(2)}" y="${y.toFixed(2)}" width="${half.toFixed(2)}" height="${barH}" fill="#111111"/>`
        );
      })
      .join("");
  }

  // Taegukgi (Korea) — white field, the red/blue taegeuk swirl at center,
  // four trigrams (kwae) in the corners. Not a simplification: this is
  // the actual flag, just at icon scale.
  function koreaFlag() {
    const cx = 30;
    const cy = 20;
    const r = 8;
    const taegeuk = `
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="#003478"/>
      <path d="M${cx},${cy - r} A${r},${r} 0 0 1 ${cx},${cy + r} A${r / 2},${r / 2} 0 0 1 ${cx},${cy} A${r / 2},${r / 2} 0 0 0 ${cx},${cy - r} Z" fill="#C60C30"/>
    `;
    const geon = trigram([1, 1, 1]); // heaven
    const gon = trigram([0, 0, 0]); // earth
    const gam = trigram([0, 1, 0]); // water
    const ri = trigram([1, 0, 1]); // fire
    const corner = (x, y, angle, content) =>
      `<g transform="translate(${x},${y}) rotate(${angle})">${content}</g>`;
    return `
      <rect x="0" y="0" width="60" height="40" fill="#FFFFFF"/>
      ${taegeuk}
      ${corner(9, 8, -45, geon)}
      ${corner(51, 8, 45, gam)}
      ${corner(9, 32, 45, ri)}
      ${corner(51, 32, -45, gon)}
    `;
  }

  // only cities whose plain stripe chip would misrepresent the real flag
  // (crosses, a circle, a union, stars, a swirl+trigrams) get a bespoke
  // icon here — every other city keeps the plain stripesGradient() chip,
  // which is already an accurate simplification for those.
  const FLAG_ICON_BUILDERS = {
    seoul: () => koreaFlag(),
    oslo: () => nordicCross("#EF2B2D", "#002868", "#FFFFFF"),
    copenhagen: () => nordicCross("#C60C30", "#FFFFFF", null),
    helsinki: () => nordicCross("#FFFFFF", "#002F6C", null),
    stockholm: () => nordicCross("#006AA7", "#FECC00", null),
    zurich: () => swissCross(),
    tokyo: () => japanCircle(),
    london: () => unionJack(),
    auckland: () => unionJackCanton(NZ_STARS),
    sydney: () => unionJackCanton(AU_STARS),
    "san-francisco": () => usaFlag(),
    "new-york": () => usaFlag(),
    shanghai: () => chinaFlag(),
    "sao-paulo": () => brazilFlag(),
  };

  // Abstract, monotone background graphics for the right panel — one
  // motif per city's visualConcept (js/data/cities.js), never a literal
  // photo unless one is actually dropped in (see #detail-photo).
  const CITYSCAPE_BUILDERS = {
    seoul: () => `
      <rect x="0" y="0" width="800" height="1000" class="cityscape__base" />
      <path class="cityscape__ridge cityscape__ridge--back" d="M0,620 C120,560 220,660 340,600 C460,540 560,640 680,580 C740,550 780,590 800,570 L800,1000 L0,1000 Z" />
      <path class="cityscape__ridge cityscape__ridge--mid" d="M0,720 C100,680 200,750 320,700 C420,660 520,730 620,690 C700,660 760,700 800,680 L800,1000 L0,1000 Z" />
      <path class="cityscape__eave" d="M120,300 C200,255 250,345 340,300 C430,255 480,345 570,300" />
      <path class="cityscape__eave cityscape__eave--soft" d="M60,380 C150,330 210,430 320,380 C430,330 500,430 610,380" />
      <g class="cityscape__skyline">
        <rect x="20" y="860" width="46" height="140" /><rect x="90" y="800" width="34" height="200" />
        <rect x="150" y="900" width="60" height="100" /><rect x="230" y="760" width="30" height="240" />
        <rect x="280" y="850" width="50" height="150" /><rect x="350" y="820" width="38" height="180" />
        <rect x="410" y="880" width="56" height="120" /><rect x="490" y="740" width="26" height="260" />
        <rect x="540" y="830" width="44" height="170" /><rect x="610" y="790" width="34" height="210" />
        <rect x="670" y="860" width="52" height="140" /><rect x="740" y="810" width="40" height="190" />
      </g>
    `,
    berlin: () => {
      const count = 8;
      const marginX = 60;
      const colWidth = 46;
      const gap = (800 - marginX * 2 - colWidth * count) / (count - 1);
      let columns = "";
      for (let i = 0; i < count; i++) {
        const x = (marginX + i * (colWidth + gap)).toFixed(1);
        columns += `<rect x="${x}" y="560" width="${colWidth}" height="400" class="cityscape__column" />`;
      }
      return `
        <rect x="0" y="0" width="800" height="1000" class="cityscape__base" />
        <rect x="0" y="660" width="800" height="340" class="cityscape__ridge cityscape__ridge--back" />
        <polygon class="cityscape__pediment" points="250,420 550,420 400,300" />
        <rect x="220" y="420" width="360" height="70" class="cityscape__pediment" />
        <rect x="200" y="490" width="400" height="70" class="cityscape__ridge--mid" />
        ${columns}
        <rect x="40" y="920" width="720" height="40" class="cityscape__ridge--mid" />
      `;
    },
    "new-york": () => {
      // hard-edged skyscraper grid + one signature tapered tower — the
      // opposite of Seoul's soft ridges: axis-aligned, dense, uniform.
      const blocks = [
        [10, 210, 44], [64, 300, 36], [110, 180, 52],
        [172, 360, 32], [214, 260, 46], [270, 420, 30],
        [430, 260, 50], [490, 340, 34], [534, 190, 48],
        [592, 300, 36], [638, 240, 52], [700, 380, 30],
        [740, 210, 46],
      ];
      const rects = blocks
        .map(
          ([x, h, w]) =>
            `<rect x="${x}" y="${1000 - h}" width="${w}" height="${h}" />`
        )
        .join("");
      const towerX = 320;
      const towerW = 50;
      const towerH = 580;
      const towerTopY = 1000 - towerH;
      const midX = towerX + towerW / 2;
      // thin "window grid" lines over the signature tower — the "hard
      // verticals / graphic shadow" part of the motif
      let grid = "";
      for (let gx = towerX + 8; gx < towerX + towerW; gx += 10) {
        grid += `<line x1="${gx}" y1="${towerTopY + 20}" x2="${gx}" y2="990" class="cityscape__lattice" />`;
      }
      return `
        <rect x="0" y="0" width="800" height="1000" class="cityscape__base" />
        <g class="cityscape__skyline">${rects}</g>
        <rect x="${towerX}" y="${towerTopY}" width="${towerW}" height="${towerH}" class="cityscape__ridge cityscape__ridge--back" />
        ${grid}
        <line x1="${midX}" y1="${towerTopY}" x2="${midX}" y2="${towerTopY - 100}" class="cityscape__spire" />
      `;
    },
    tokyo: () => {
      // geometric circles / thin structural lines / night glow
      const cx = 420;
      const cy = 430;
      const glow = [340, 250, 170]
        .map((r) => `<circle cx="${cx}" cy="${cy}" r="${r}" class="cityscape__glow" />`)
        .join("");
      const baseY = 980;
      const topY = 140;
      const baseHalfW = 180;
      const lattice = `
        <line x1="${cx - baseHalfW}" y1="${baseY}" x2="${cx}" y2="${topY}" class="cityscape__lattice" />
        <line x1="${cx + baseHalfW}" y1="${baseY}" x2="${cx}" y2="${topY}" class="cityscape__lattice" />
        <line x1="${cx - baseHalfW * 0.55}" y1="${baseY - 260}" x2="${cx + baseHalfW * 0.55}" y2="${baseY - 260}" class="cityscape__lattice" />
        <line x1="${cx - baseHalfW * 0.25}" y1="${baseY - 520}" x2="${cx + baseHalfW * 0.25}" y2="${baseY - 520}" class="cityscape__lattice" />
        <line x1="${cx - baseHalfW * 0.55}" y1="${baseY - 260}" x2="${cx - baseHalfW}" y2="${baseY}" class="cityscape__lattice" />
        <line x1="${cx + baseHalfW * 0.55}" y1="${baseY - 260}" x2="${cx + baseHalfW}" y2="${baseY}" class="cityscape__lattice" />
      `;
      const rings = `
        <circle cx="140" cy="760" r="60" class="cityscape__ring" />
        <circle cx="660" cy="840" r="42" class="cityscape__ring" />
        <circle cx="90" cy="880" r="26" class="cityscape__ring" />
      `;
      return `
        <rect x="0" y="0" width="800" height="1000" class="cityscape__base" />
        ${glow}
        ${lattice}
        ${rings}
        <rect x="0" y="900" width="800" height="100" class="cityscape__ridge--mid" />
      `;
    },
    bangkok: () => {
      // tiered wat roofline, narrowing upward, upturned eave corners,
      // topped with a slender chedi spire — "gilded curves / dense warm
      // haze" via the low skyline band underneath.
      const tiers = [
        { y: 760, w: 520, h: 60 },
        { y: 650, w: 400, h: 60 },
        { y: 540, w: 300, h: 55 },
        { y: 440, w: 200, h: 50 },
      ];
      const tierShapes = tiers
        .map(({ y, w, h }) => {
          const x0 = 400 - w / 2;
          const x1 = 400 + w / 2;
          const upturn = h * 0.55;
          return `<path d="M${x0},${y + h} L${x0 - upturn},${y + h - upturn} L${x0 + 22},${y} L${x1 - 22},${y} L${x1 + upturn},${y + h - upturn} L${x1},${y + h} Z" class="cityscape__tier" />`;
        })
        .join("");
      return `
        <rect x="0" y="0" width="800" height="1000" class="cityscape__base" />
        <rect x="0" y="840" width="800" height="160" class="cityscape__ridge--mid" />
        ${tierShapes}
        <line x1="400" y1="440" x2="400" y2="260" class="cityscape__spire" />
        <circle cx="400" cy="250" r="9" class="cityscape__tier" />
      `;
    },
  };

  // Generic fallback for any city without its own CITYSCAPE_BUILDERS
  // entry — still abstract/monotone, just not city-specific.
  function defaultCityscape() {
    return `
      <rect x="0" y="0" width="800" height="1000" class="cityscape__base" />
      <path class="cityscape__ridge cityscape__ridge--back" d="M0,660 C160,610 260,700 400,650 C540,600 640,690 800,640 L800,1000 L0,1000 Z" />
      <rect x="0" y="760" width="800" height="240" class="cityscape__ridge--mid" />
    `;
  }

  class SecondScreen {
    constructor() {
      this.appEl = document.getElementById("app");
      this.screenEl = document.getElementById("second-screen");
      this.backBtn = document.getElementById("detail-back");
      this.clockHost = document.getElementById("detail-clock");
      this.photoEl = document.getElementById("detail-photo");
      this.infoEl = document.getElementById("detail-info");
      this.cityscapeEl = document.getElementById("detail-cityscape");
      this.flagChipEl = document.getElementById("detail-flagchip");

      this.els = {
        eyebrow: document.getElementById("detail-eyebrow"),
        subtitle: document.getElementById("detail-subtitle"),
        weekday: document.getElementById("detail-weekday"),
        date: document.getElementById("detail-date"),
        city: document.getElementById("detail-city"),
        temp: document.getElementById("detail-temp"),
        weather: document.getElementById("detail-weather"),
      };

      this.city = null;
      this.isOpen = false;

      this._weatherCache = {}; // { [cityId]: { data, fetchedAt } }

      this._rafId = null;
      this._resyncTimer = null;
      this._weatherTimer = null;
      this._baseCitySeconds = 0;
      this._baseSyncPerf = 0;

      this._buildClockFace();
      this._bindEvents();
    }

    _bindEvents() {
      document.addEventListener("city:select", (e) => {
        const city = e.detail && e.detail.city;
        if (!city) return;
        this.open(city);
      });

      document.addEventListener("navigation:escape", () => {
        if (this.isOpen) this.close();
      });

      this.backBtn.addEventListener("click", () => this.close());

      this.photoEl.addEventListener("load", () => {
        this.photoEl.classList.add("is-loaded");
      });
      this.photoEl.addEventListener("error", () => {
        this.photoEl.classList.remove("is-loaded");
      });
    }

    open(city) {
      this.city = city;
      this.isOpen = true;

      this.els.city.textContent = city.city;
      const flagColors = city.flagColors && city.flagColors.length
        ? city.flagColors
        : null;
      if (flagColors) {
        // solid panel = one deep tone picked FROM the flag (always
        // legible); the actual flag lives in the small chip — a real
        // emblem (cross/circle/union/stars) for flags a plain stripe
        // gradient would misrepresent, otherwise the plain gradient,
        // which is already an accurate simplification for those.
        this.infoEl.style.background = pickPanelColor(flagColors);
        const buildIcon = FLAG_ICON_BUILDERS[city.id];
        if (buildIcon) {
          this.flagChipEl.style.background = "none";
          this.flagChipEl.innerHTML = `<svg viewBox="0 0 60 40" preserveAspectRatio="none">${buildIcon()}</svg>`;
        } else {
          this.flagChipEl.innerHTML = "";
          this.flagChipEl.style.background = stripesGradient(
            flagColors,
            city.flagOrientation
          );
        }
        this.flagChipEl.style.display = "";
      } else {
        this.infoEl.style.background = "var(--accent)";
        this.flagChipEl.innerHTML = "";
        this.flagChipEl.style.display = "none";
      }

      const buildCityscape = CITYSCAPE_BUILDERS[city.id] || defaultCityscape;
      this.cityscapeEl.innerHTML = buildCityscape();

      this.photoEl.classList.remove("is-loaded");
      if (city.image) {
        this.photoEl.src = city.image;
      } else {
        this.photoEl.removeAttribute("src");
      }

      this.appEl.classList.add("showing-second");
      this.screenEl.hidden = false;
      // force layout so the opacity transition actually plays from 0
      void this.screenEl.offsetWidth;
      requestAnimationFrame(() => this.screenEl.classList.add("is-active"));

      this._syncClock();
      this._resyncTimer = window.setInterval(
        () => this._syncClock(),
        CLOCK_RESYNC_MS
      );
      this._startClockLoop();

      this._refreshWeather();
      this._weatherTimer = window.setInterval(
        () => this._refreshWeather(),
        WEATHER_REFRESH_MS
      );
    }

    close() {
      this.isOpen = false;
      this.screenEl.classList.remove("is-active");
      this.appEl.classList.remove("showing-second");

      window.clearInterval(this._resyncTimer);
      window.clearInterval(this._weatherTimer);
      this._stopClockLoop();

      // must be >= the .screen--second opacity transition (css/styles.css)
      // or `hidden` lands mid-fade and the screen just vanishes.
      window.setTimeout(() => {
        if (!this.isOpen) this.screenEl.hidden = true;
      }, 950);
    }

    // ---- date/time -----------------------------------------------------

    _syncClock() {
      const city = this.city;
      if (!city) return;
      const now = new Date();

      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: city.timezone,
        hour12: false,
        weekday: "long",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).formatToParts(now);
      const get = (type) => parts.find((p) => p.type === type).value;

      this._baseCitySeconds =
        Number(get("hour")) * 3600 +
        Number(get("minute")) * 60 +
        Number(get("second"));
      this._baseSyncPerf = performance.now();

      this.els.weekday.textContent = get("weekday");
      this.els.date.textContent = `${get("day")} ${get("month")}`;

      const offsetParts = new Intl.DateTimeFormat("en-US", {
        timeZone: city.timezone,
        timeZoneName: "shortOffset",
      }).formatToParts(now);
      const offset = offsetParts.find((p) => p.type === "timeZoneName");
      const utcLabel = offset ? offset.value.replace("GMT", "UTC") : "";

      this.els.eyebrow.textContent = `${city.city.toUpperCase()} DIGITAL TIME`;
      this.els.subtitle.textContent = `${city.city}, ${city.country} — ${utcLabel}`;
    }

    _startClockLoop() {
      if (this._rafId) return;
      const tick = () => {
        this._renderClockHands();
        this._rafId = requestAnimationFrame(tick);
      };
      this._rafId = requestAnimationFrame(tick);
    }

    _stopClockLoop() {
      if (this._rafId) cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }

    _renderClockHands() {
      const elapsed = (performance.now() - this._baseSyncPerf) / 1000;
      const totalSeconds = (this._baseCitySeconds + elapsed) % 86400;

      const seconds = totalSeconds % 60;
      const minutes = Math.floor(totalSeconds / 60) % 60;
      const hours = Math.floor(totalSeconds / 3600) % 12;

      const secDeg = seconds * 6;
      const minDeg = minutes * 6 + seconds * 0.1; // creeps with seconds
      const hourDeg = hours * 30 + minutes * 0.5; // creeps with minutes

      this._hourHand.style.transform = `rotate(${hourDeg.toFixed(2)}deg)`;
      this._minuteHand.style.transform = `rotate(${minDeg.toFixed(2)}deg)`;
      this._secondHand.style.transform = `rotate(${secDeg.toFixed(2)}deg)`;
    }

    // ---- weather ---------------------------------------------------------

    async _refreshWeather() {
      const city = this.city;
      if (!city || city.lat == null || city.lon == null) return;

      const cached = this._weatherCache[city.id];
      if (cached && Date.now() - cached.fetchedAt < WEATHER_REFRESH_MS) {
        this._renderWeather(cached.data);
        return;
      }

      try {
        const url =
          `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}` +
          `&longitude=${city.lon}&current_weather=true`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`weather http ${res.status}`);
        const json = await res.json();
        const data = json.current_weather;
        if (!data) throw new Error("no current_weather in response");
        this._weatherCache[city.id] = { data, fetchedAt: Date.now() };
        this._renderWeather(data);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("[world-clock] weather fetch failed:", err);
        this.els.temp.textContent = "—°C, —°F";
        this.els.weather.textContent = "Weather unavailable";
      }
    }

    _renderWeather(data) {
      const c = Math.round(data.temperature);
      const f = Math.round((data.temperature * 9) / 5 + 32);
      this.els.temp.textContent = `${c}°C, ${f}°F`;
      this.els.weather.textContent =
        WEATHER_CODES[data.weathercode] || "Unknown conditions";
    }

    // ---- clock face (built once, static SVG structure) ------------------

    _buildClockFace() {
      const NS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(NS, "svg");
      svg.setAttribute("viewBox", "0 0 200 200");

      const cx = 100;
      const cy = 100;
      const labelAt = { 0: "60", 90: "15", 180: "30", 270: "45" };

      // no outer ring — the reference dial is defined only by ticks/numbers

      const point = (angleDeg, r) => {
        const rad = ((angleDeg - 90) * Math.PI) / 180;
        return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
      };

      const addTick = (angle, inner, outer, className) => {
        const [x1, y1] = point(angle, inner);
        const [x2, y2] = point(angle, outer);
        const tick = document.createElementNS(NS, "line");
        tick.setAttribute("x1", x1.toFixed(2));
        tick.setAttribute("y1", y1.toFixed(2));
        tick.setAttribute("x2", x2.toFixed(2));
        tick.setAttribute("y2", y2.toFixed(2));
        tick.setAttribute("class", className);
        svg.appendChild(tick);
      };

      for (let i = 0; i < 60; i++) {
        const angle = i * 6;
        const isFive = angle % 30 === 0;

        if (isFive) {
          addTick(angle, 76, 90, "clockface__tick--five");
        } else {
          addTick(angle, 82, 90, "clockface__tick");
        }

        if (labelAt[angle] !== undefined) {
          const [tx, ty] = point(angle, 64);
          const text = document.createElementNS(NS, "text");
          text.setAttribute("x", tx.toFixed(2));
          text.setAttribute("y", ty.toFixed(2));
          text.setAttribute("class", "clockface__number");
          text.textContent = labelAt[angle];
          svg.appendChild(text);
        }
      }

      // all three hands share the same shape now — thin, straight
      // needles with a short tail past the pivot; only length/thickness
      // differ (hour: shortest + very slightly thicker than minute).
      const makeNeedleHand = (length, tail, className) => {
        const hand = document.createElementNS(NS, "line");
        hand.setAttribute("x1", cx);
        hand.setAttribute("y1", cy + tail);
        hand.setAttribute("x2", cx);
        hand.setAttribute("y2", cy - length);
        hand.setAttribute("class", `clockface__hand ${className}`);
        svg.appendChild(hand);
        return hand;
      };

      this._hourHand = makeNeedleHand(34, 3, "clockface__hand--hour");
      this._minuteHand = makeNeedleHand(52, 3, "clockface__hand--minute");
      this._secondHand = makeNeedleHand(64, 12, "clockface__hand--second");

      // plain flat pivot — no gradient/highlight/pattern
      const pivot = document.createElementNS(NS, "circle");
      pivot.setAttribute("cx", cx);
      pivot.setAttribute("cy", cy);
      pivot.setAttribute("r", 6.5);
      pivot.setAttribute("class", "clockface__pivot");
      svg.appendChild(pivot);

      this.clockHost.appendChild(svg);
    }
  }

  function start() {
    // eslint-disable-next-line no-unused-vars
    window.__secondScreen = new SecondScreen();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();

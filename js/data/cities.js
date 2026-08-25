/**
 * City data source — single source of truth for the world-clock composition.
 *
 * Add a new city to this array and it is automatically picked up by:
 *   - the FIRST SCREEN orbital typography composition
 *   - the SECOND SCREEN analog clock / editorial detail view
 *     (js/second-screen.js — every city here is supported there now)
 *
 * No component code needs to change when a city is added or removed.
 *
 * Shape (see section 17 of the brief):
 *   id              unique slug, used as DOM key + CSS/seed hashing input
 *   city            display name
 *   country         display name
 *   timezone        IANA timezone string (used with Intl.DateTimeFormat)
 *   image           editorial photograph for the SECOND SCREEN — path is a
 *                   placeholder; drop a real file there and it's picked up
 *                   automatically (grayscale-filtered), no code change
 *   symbol          short keyword naming this city's abstract graphic motif
 *   visualConcept   short phrase describing the city's visual language,
 *                   used to art-direct the SECOND SCREEN graphic system
 *   lat, lon        used for live weather (Open-Meteo, SECOND SCREEN)
 *   flagColors      that country's flag colors, in stripe order, used for
 *                   the SECOND SCREEN's left info panel background. These
 *                   are a stylized simplification (equal-width stripes),
 *                   not a literal flag reproduction — crosses/cantons/
 *                   emblems/circles are approximated by their dominant
 *                   colors, not redrawn.
 *   flagOrientation "horizontal" (default) or "vertical" — matches each
 *                   flag's actual stripe direction where it has one
 *                   (France/Italy/Portugal/Belgium/Ireland/Canada/Mexico
 *                   are vertical; most others are horizontal or a
 *                   horizontal approximation of a non-stripe flag)
 */

window.CITY_DATA = [
  {
    id: "berlin",
    city: "Berlin",
    country: "Germany",
    timezone: "Europe/Berlin",
    image: "assets/cities/berlin.jpg",
    symbol: "grid",
    visualConcept: "brutalist concrete / rigid vertical grid / cold light",
    lat: 52.52,
    lon: 13.405,
    flagColors: ["#000000", "#DD0000", "#FFCE00"], // Bundesflagge
  },
  {
    id: "oslo",
    city: "Oslo",
    country: "Norway",
    timezone: "Europe/Oslo",
    image: "assets/cities/oslo.jpg",
    symbol: "fjord-line",
    visualConcept: "timber lines / fjord horizon / muted cold palette",
    lat: 59.9139,
    lon: 10.7522,
    flagColors: ["#EF2B2D", "#FFFFFF", "#002868"], // Nordic cross, simplified
  },
  {
    id: "copenhagen",
    city: "Copenhagen",
    country: "Denmark",
    timezone: "Europe/Copenhagen",
    image: "assets/cities/copenhagen.jpg",
    symbol: "gable",
    visualConcept: "gabled silhouettes / soft pastel / harbourfront calm",
    lat: 55.6761,
    lon: 12.5683,
    flagColors: ["#C60C30", "#FFFFFF"], // Dannebrog, simplified
  },
  {
    id: "london",
    city: "London",
    country: "UK",
    timezone: "Europe/London",
    image: "assets/cities/london.jpg",
    symbol: "column",
    visualConcept: "classical columns / vertical structure / muted stone",
    lat: 51.5074,
    lon: -0.1278,
    flagColors: ["#012169", "#FFFFFF", "#C8102E"], // Union Jack, simplified
  },
  {
    id: "madrid",
    city: "Madrid",
    country: "Spain",
    timezone: "Europe/Madrid",
    image: "assets/cities/madrid.jpg",
    symbol: "arch",
    visualConcept: "stone arches / warm ochre light / plaza geometry",
    lat: 40.4168,
    lon: -3.7038,
    flagColors: ["#AA151B", "#F1BF00", "#AA151B"], // Rojigualda
  },
  {
    id: "helsinki",
    city: "Helsinki",
    country: "Finland",
    timezone: "Europe/Helsinki",
    image: "assets/cities/helsinki.jpg",
    symbol: "granite-facet",
    visualConcept: "granite facets / functionalist form / arctic grey",
    lat: 60.1699,
    lon: 24.9384,
    flagColors: ["#002F6C", "#FFFFFF"], // Nordic cross, simplified
  },
  {
    id: "shanghai",
    city: "Shanghai",
    country: "China",
    timezone: "Asia/Shanghai",
    image: "assets/cities/shanghai.jpg",
    symbol: "spire",
    visualConcept: "vertical spires / neon reflection / dense skyline",
    lat: 31.2304,
    lon: 121.4737,
    flagColors: ["#DE2910", "#FFDE00"], // simplified
  },
  {
    id: "san-francisco",
    city: "San Francisco",
    country: "USA",
    timezone: "America/Los_Angeles",
    image: "assets/cities/san-francisco.jpg",
    symbol: "cable-line",
    visualConcept: "suspension cables / sloped grid / fog gradient",
    lat: 37.7749,
    lon: -122.4194,
    flagColors: ["#B31942", "#FFFFFF", "#0A3161"], // Old Glory, simplified
  },
  {
    id: "tokyo",
    city: "Tokyo",
    country: "Japan",
    timezone: "Asia/Tokyo",
    image: "assets/cities/tokyo.jpg",
    symbol: "circle-grid",
    visualConcept: "geometric circles / thin structural lines / night glow",
    lat: 35.6762,
    lon: 139.6503,
    flagColors: ["#FFFFFF", "#BC002D"], // Hinomaru, simplified
  },
  {
    id: "seoul",
    city: "Seoul",
    country: "Korea",
    timezone: "Asia/Seoul",
    image: "assets/cities/seoul.jpg",
    symbol: "eave-curve",
    visualConcept: "layered eave curves / neon signage grid / dense night skyline",
    lat: 37.5665,
    lon: 126.978,
    flagColors: ["#C60C30", "#003478"], // Taegeukgi, red top / blue bottom
  },
  {
    id: "sao-paulo",
    city: "São Paulo",
    country: "Brazil",
    timezone: "America/Sao_Paulo",
    image: "assets/cities/sao-paulo.jpg",
    symbol: "curve-block",
    visualConcept: "modernist curves / concrete mass / dense grid",
    lat: -23.5505,
    lon: -46.6333,
    flagColors: ["#009739", "#FEDD00", "#002776"], // simplified
  },
  {
    id: "auckland",
    city: "Auckland",
    country: "New Zealand",
    timezone: "Pacific/Auckland",
    image: "assets/cities/auckland.jpg",
    symbol: "sail-line",
    visualConcept: "sail lines / volcanic curve / open horizon",
    lat: -36.8485,
    lon: 174.7633,
    flagColors: ["#00247D", "#CC142B", "#FFFFFF"], // simplified
  },
  {
    id: "sydney",
    city: "Sydney",
    country: "Australia",
    timezone: "Australia/Sydney",
    image: "assets/cities/sydney.jpg",
    symbol: "shell-arc",
    visualConcept: "layered shell arcs / harbour curve / bright white",
    lat: -33.8688,
    lon: 151.2093,
    flagColors: ["#00247D", "#F5333F", "#FFFFFF"], // simplified
  },
  {
    id: "new-york",
    city: "New York",
    country: "USA",
    timezone: "America/New_York",
    image: "assets/cities/new-york.jpg",
    symbol: "skyscraper-grid",
    visualConcept: "skyscraper grid / hard verticals / graphic shadow",
    lat: 40.7128,
    lon: -74.006,
    flagColors: ["#B31942", "#FFFFFF", "#0A3161"], // Old Glory, simplified
  },
  {
    id: "stockholm",
    city: "Stockholm",
    country: "Sweden",
    timezone: "Europe/Stockholm",
    image: "assets/cities/stockholm.jpg",
    symbol: "island-line",
    visualConcept: "archipelago lines / cool blue / clean structure",
    lat: 59.3293,
    lon: 18.0686,
    flagColors: ["#006AA7", "#FECC00"], // Nordic cross, simplified
  },
  {
    id: "paris",
    city: "Paris",
    country: "France",
    timezone: "Europe/Paris",
    image: "assets/cities/paris.jpg",
    symbol: "iron-arch",
    visualConcept: "wrought-iron arches / mansard lines / refined grey light",
    lat: 48.8566,
    lon: 2.3522,
    flagColors: ["#0055A4", "#FFFFFF", "#EF4135"],
    flagOrientation: "vertical",
  },
  {
    id: "rome",
    city: "Rome",
    country: "Italy",
    timezone: "Europe/Rome",
    image: "assets/cities/rome.jpg",
    symbol: "colonnade",
    visualConcept: "colonnades / weathered stone arcs / warm terracotta",
    lat: 41.9028,
    lon: 12.4964,
    flagColors: ["#008C45", "#FFFFFF", "#CD212A"],
    flagOrientation: "vertical",
  },
  {
    id: "lisbon",
    city: "Lisbon",
    country: "Portugal",
    timezone: "Europe/Lisbon",
    image: "assets/cities/lisbon.jpg",
    symbol: "tile-grid",
    visualConcept: "azulejo tile grid / hillside terraces / soft coastal light",
    lat: 38.7223,
    lon: -9.1393,
    flagColors: ["#046A38", "#DA020E"],
    flagOrientation: "vertical",
  },
  {
    id: "vienna",
    city: "Vienna",
    country: "Austria",
    timezone: "Europe/Vienna",
    image: "assets/cities/vienna.jpg",
    symbol: "facade-line",
    visualConcept: "ornate facade lines / imperial symmetry / muted gold",
    lat: 48.2082,
    lon: 16.3738,
    flagColors: ["#ED2939", "#FFFFFF", "#ED2939"],
  },
  {
    id: "prague",
    city: "Prague",
    country: "Czech Republic",
    timezone: "Europe/Prague",
    image: "assets/cities/prague.jpg",
    symbol: "spire-cluster",
    visualConcept: "gothic spire clusters / river curve / dusk amber",
    lat: 50.0755,
    lon: 14.4378,
    flagColors: ["#FFFFFF", "#D7141A"], // blue hoist wedge omitted
  },
  {
    id: "amsterdam",
    city: "Amsterdam",
    country: "Netherlands",
    timezone: "Europe/Amsterdam",
    image: "assets/cities/amsterdam.jpg",
    symbol: "canal-grid",
    visualConcept: "canal grid / narrow gable fronts / flat grey-green light",
    lat: 52.3676,
    lon: 4.9041,
    flagColors: ["#AE1C28", "#FFFFFF", "#21468B"],
  },
  {
    id: "brussels",
    city: "Brussels",
    country: "Belgium",
    timezone: "Europe/Brussels",
    image: "assets/cities/brussels.jpg",
    symbol: "guild-line",
    visualConcept: "guild-hall verticals / ornamental line work / warm bronze",
    lat: 50.8503,
    lon: 4.3517,
    flagColors: ["#000000", "#FAE042", "#ED2939"],
    flagOrientation: "vertical",
  },
  {
    id: "dublin",
    city: "Dublin",
    country: "Ireland",
    timezone: "Europe/Dublin",
    image: "assets/cities/dublin.jpg",
    symbol: "brick-line",
    visualConcept: "georgian brick lines / fanlight arcs / overcast green-grey",
    lat: 53.3498,
    lon: -6.2603,
    flagColors: ["#169B62", "#FFFFFF", "#FF883E"],
    flagOrientation: "vertical",
  },
  {
    id: "zurich",
    city: "Zurich",
    country: "Switzerland",
    timezone: "Europe/Zurich",
    image: "assets/cities/zurich.jpg",
    symbol: "precision-grid",
    visualConcept: "precision grid / lake horizon / cool neutral tone",
    lat: 47.3769,
    lon: 8.5417,
    flagColors: ["#FF0000", "#FFFFFF", "#FF0000"], // white cross, simplified
  },
  {
    id: "toronto",
    city: "Toronto",
    country: "Canada",
    timezone: "America/Toronto",
    image: "assets/cities/toronto.jpg",
    symbol: "tower-line",
    visualConcept: "vertical tower line / glass grid / crisp cold light",
    lat: 43.6532,
    lon: -79.3832,
    flagColors: ["#FF0000", "#FFFFFF", "#FF0000"], // maple leaf omitted
    flagOrientation: "vertical",
  },
  {
    id: "mexico-city",
    city: "Mexico City",
    country: "Mexico",
    timezone: "America/Mexico_City",
    image: "assets/cities/mexico-city.jpg",
    symbol: "mural-block",
    visualConcept: "muralist blocks / dense grid / high-altitude warm light",
    lat: 19.4326,
    lon: -99.1332,
    flagColors: ["#006847", "#FFFFFF", "#CE1126"], // eagle emblem omitted
    flagOrientation: "vertical",
  },
  {
    id: "buenos-aires",
    city: "Buenos Aires",
    country: "Argentina",
    timezone: "America/Argentina/Buenos_Aires",
    image: "assets/cities/buenos-aires.jpg",
    symbol: "balcony-line",
    visualConcept: "wrought balcony lines / avenue perspective / dusty rose light",
    lat: -34.6037,
    lon: -58.3816,
    flagColors: ["#75AADB", "#FFFFFF", "#75AADB"], // sun emblem omitted
  },
  {
    id: "dubai",
    city: "Dubai",
    country: "UAE",
    timezone: "Asia/Dubai",
    image: "assets/cities/dubai.jpg",
    symbol: "spire-facet",
    visualConcept: "faceted spires / desert gradient / mirrored glass",
    lat: 25.2048,
    lon: 55.2708,
    flagColors: ["#00732F", "#FFFFFF", "#000000"], // red hoist band omitted
  },
  {
    id: "singapore",
    city: "Singapore",
    country: "Singapore",
    timezone: "Asia/Singapore",
    image: "assets/cities/singapore.jpg",
    symbol: "lattice-tower",
    visualConcept: "lattice tower forms / tropical dense grid / humid glow",
    lat: 1.3521,
    lon: 103.8198,
    flagColors: ["#EE2536", "#FFFFFF"], // crescent/stars omitted
  },
  {
    id: "bangkok",
    city: "Bangkok",
    country: "Thailand",
    timezone: "Asia/Bangkok",
    image: "assets/cities/bangkok.jpg",
    symbol: "tiered-roof",
    visualConcept: "tiered roof lines / gilded curves / dense warm haze",
    lat: 13.7563,
    lon: 100.5018,
    flagColors: ["#A51931", "#F4F5F8", "#2D2A4A", "#F4F5F8", "#A51931"], // Trairanga
  },
];

import { PIXEL_ART_SAMPLES } from './pixelArtSamples.js';

// Built-in sample images for instant demonstration

// 1. Vibrant Sunset Mountain Tapestry
const SUNSET_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 700" width="600" height="700">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1A102F" />
      <stop offset="35%" stop-color="#7B1FA2" />
      <stop offset="60%" stop-color="#E64A19" />
      <stop offset="85%" stop-color="#FFA000" />
      <stop offset="100%" stop-color="#FFEB3B" />
    </linearGradient>
    <linearGradient id="sun" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFF9C4" />
      <stop offset="100%" stop-color="#FF8F00" />
    </linearGradient>
  </defs>
  <rect width="600" height="700" fill="url(#sky)" />
  <circle cx="300" cy="400" r="140" fill="url(#sun)" />
  <!-- Mountains -->
  <polygon points="0,550 180,380 340,540 500,390 600,480 600,700 0,700" fill="#311B92" opacity="0.9" />
  <polygon points="0,590 240,440 420,590 600,470 600,700 0,700" fill="#1A237E" opacity="0.95" />
  <polygon points="0,640 140,530 310,650 490,520 600,600 600,700 0,700" fill="#0A0E2A" />
  <!-- Pine trees foreground -->
  <polygon points="50,700 80,600 110,700" fill="#050B14" />
  <polygon points="120,700 160,580 200,700" fill="#050B14" />
  <polygon points="450,700 480,590 510,700" fill="#050B14" />
</svg>
`;

// 2. Cute Retro Pixel Fox
const FOX_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
  <rect width="500" height="500" fill="#263238" />
  <!-- Circle moon background -->
  <circle cx="250" cy="250" r="190" fill="#455A64" />
  <circle cx="250" cy="250" r="170" fill="#ECEFF1" />
  <!-- Fox face -->
  <polygon points="160,140 140,240 220,230" fill="#E65100" />
  <polygon points="340,140 360,240 280,230" fill="#E65100" />
  <polygon points="175,170 160,230 215,225" fill="#FFE0B2" />
  <polygon points="325,170 340,230 285,225" fill="#FFE0B2" />
  <!-- Head base -->
  <polygon points="140,240 360,240 250,380" fill="#F57C00" />
  <!-- White cheeks -->
  <polygon points="140,240 250,380 190,300" fill="#FFFFFF" />
  <polygon points="360,240 250,380 310,300" fill="#FFFFFF" />
  <!-- Eyes -->
  <ellipse cx="205" cy="275" rx="14" ry="18" fill="#212121" />
  <ellipse cx="295" cy="275" rx="14" ry="18" fill="#212121" />
  <circle cx="200" cy="270" r="5" fill="#FFFFFF" />
  <circle cx="290" cy="270" r="5" fill="#FFFFFF" />
  <!-- Nose -->
  <circle cx="250" cy="365" r="14" fill="#212121" />
</svg>
`;

// 3. Blooming Sun Sunflower Mandala
const SUNFLOWER_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
  <rect width="500" height="500" fill="#1B263B" />
  <g transform="translate(250,250)">
    <!-- Petals layer 1 -->
    <path d="M0,-190 Q25,-120 0,0 Q-25,-120 0,-190" fill="#F39C12" />
    <path d="M0,-190 Q25,-120 0,0 Q-25,-120 0,-190" fill="#F39C12" transform="rotate(30)" />
    <path d="M0,-190 Q25,-120 0,0 Q-25,-120 0,-190" fill="#F39C12" transform="rotate(60)" />
    <path d="M0,-190 Q25,-120 0,0 Q-25,-120 0,-190" fill="#F39C12" transform="rotate(90)" />
    <path d="M0,-190 Q25,-120 0,0 Q-25,-120 0,-190" fill="#F39C12" transform="rotate(120)" />
    <path d="M0,-190 Q25,-120 0,0 Q-25,-120 0,-190" fill="#F39C12" transform="rotate(150)" />
    <path d="M0,-190 Q25,-120 0,0 Q-25,-120 0,-190" fill="#F39C12" transform="rotate(180)" />
    <path d="M0,-190 Q25,-120 0,0 Q-25,-120 0,-190" fill="#F39C12" transform="rotate(210)" />
    <path d="M0,-190 Q25,-120 0,0 Q-25,-120 0,-190" fill="#F39C12" transform="rotate(240)" />
    <path d="M0,-190 Q25,-120 0,0 Q-25,-120 0,-190" fill="#F39C12" transform="rotate(270)" />
    <path d="M0,-190 Q25,-120 0,0 Q-25,-120 0,-190" fill="#F39C12" transform="rotate(300)" />
    <path d="M0,-190 Q25,-120 0,0 Q-25,-120 0,-190" fill="#F39C12" transform="rotate(330)" />
    <!-- Petals layer 2 (Yellow) -->
    <path d="M0,-160 Q20,-90 0,0 Q-20,-90 0,-160" fill="#F1C40F" transform="rotate(15)" />
    <path d="M0,-160 Q20,-90 0,0 Q-20,-90 0,-160" fill="#F1C40F" transform="rotate(45)" />
    <path d="M0,-160 Q20,-90 0,0 Q-20,-90 0,-160" fill="#F1C40F" transform="rotate(75)" />
    <path d="M0,-160 Q20,-90 0,0 Q-20,-90 0,-160" fill="#F1C40F" transform="rotate(105)" />
    <path d="M0,-160 Q20,-90 0,0 Q-20,-90 0,-160" fill="#F1C40F" transform="rotate(135)" />
    <path d="M0,-160 Q20,-90 0,0 Q-20,-90 0,-160" fill="#F1C40F" transform="rotate(165)" />
    <path d="M0,-160 Q20,-90 0,0 Q-20,-90 0,-160" fill="#F1C40F" transform="rotate(195)" />
    <path d="M0,-160 Q20,-90 0,0 Q-20,-90 0,-160" fill="#F1C40F" transform="rotate(225)" />
    <path d="M0,-160 Q20,-90 0,0 Q-20,-90 0,-160" fill="#F1C40F" transform="rotate(255)" />
    <path d="M0,-160 Q20,-90 0,0 Q-20,-90 0,-160" fill="#F1C40F" transform="rotate(285)" />
    <path d="M0,-160 Q20,-90 0,0 Q-20,-90 0,-160" fill="#F1C40F" transform="rotate(315)" />
    <path d="M0,-160 Q20,-90 0,0 Q-20,-90 0,-160" fill="#F1C40F" transform="rotate(345)" />
    <!-- Seed Center -->
    <circle cx="0" cy="0" r="75" fill="#4E342E" />
    <circle cx="0" cy="0" r="55" fill="#3E2723" />
    <circle cx="0" cy="0" r="35" fill="#271406" />
  </g>
</svg>
`;

// 4. Exact 24x28 Pixel Art Sprite (1 pixel = 1 bead)
const PIXEL_SPRITE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 28" width="24" height="28">
  <rect width="24" height="28" fill="#161616" />
  <!-- Heart shape pixel matrix -->
  <!-- Row 4-6 -->
  <rect x="4" y="4" width="6" height="3" fill="#D61C27" />
  <rect x="14" y="4" width="6" height="3" fill="#D61C27" />
  <!-- Row 7-12 -->
  <rect x="2" y="7" width="20" height="6" fill="#D61C27" />
  <rect x="4" y="8" width="3" height="3" fill="#FDFDFD" /> <!-- Highlight -->
  <!-- Row 13-18 -->
  <rect x="4" y="13" width="16" height="4" fill="#D61C27" />
  <!-- Row 17-21 -->
  <rect x="7" y="17" width="10" height="4" fill="#D61C27" />
  <!-- Row 21-24 -->
  <rect x="10" y="21" width="4" height="3" fill="#D61C27" />
</svg>
`;

function toDataUri(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`;
}

export const SAMPLE_IMAGES = [
  ...PIXEL_ART_SAMPLES,
  {
    id: 'sunset',
    name: 'Sunset Mountain Tapestry',
    description: 'Rich gradients & silhouettes for wall hangings',
    src: toDataUri(SUNSET_SVG),
    isExactMatrix: false
  },
  {
    id: 'fox',
    name: 'Retro Spirit Fox',
    description: 'Crisp colors and character shapes',
    src: toDataUri(FOX_SVG),
    isExactMatrix: false
  },
  {
    id: 'sunflower',
    name: 'Golden Sunflower Mandala',
    description: 'Radial floral patterns and high contrast',
    src: toDataUri(SUNFLOWER_SVG),
    isExactMatrix: false
  },
  {
    id: 'pixel-heart',
    name: 'Exact 24×28 Pixel Heart',
    description: 'Native 1:1 pixel matrix (1 pixel = 1 bead)',
    src: toDataUri(PIXEL_SPRITE_SVG),
    isExactMatrix: true
  }
];


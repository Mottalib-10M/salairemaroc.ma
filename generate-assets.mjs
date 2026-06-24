import sharp from 'sharp';

const BRAND = '#0D9488';
const WHITE = '#FFFFFF';

// --- og-default.png (1200x630) ---
const ogSvg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="${BRAND}"/>
  <rect x="60" y="60" width="1080" height="510" rx="24" fill="white" opacity="0.08"/>
  <text x="600" y="240" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-weight="800" font-size="72" fill="${WHITE}">Salaire Maroc</text>
  <text x="600" y="330" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-weight="400" font-size="36" fill="${WHITE}" opacity="0.85">Calculateur de salaire net, brut et IR</text>
  <line x1="480" y1="380" x2="720" y2="380" stroke="${WHITE}" stroke-width="2" opacity="0.3"/>
  <text x="600" y="430" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-weight="500" font-size="28" fill="${WHITE}" opacity="0.7">salairemaroc.ma</text>
</svg>`;

await sharp(Buffer.from(ogSvg)).png().toFile('public/og-default.png');
console.log('Created og-default.png (1200x630)');

// --- icon-192.png ---
const icon192Svg = `<svg width="192" height="192" xmlns="http://www.w3.org/2000/svg">
  <rect width="192" height="192" rx="36" fill="${BRAND}"/>
  <text x="96" y="96" text-anchor="middle" dominant-baseline="central" font-family="Inter,system-ui,sans-serif" font-weight="700" font-size="120" fill="${WHITE}">S</text>
</svg>`;

await sharp(Buffer.from(icon192Svg)).png().toFile('public/icon-192.png');
console.log('Created icon-192.png');

// --- icon-512.png ---
const icon512Svg = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="96" fill="${BRAND}"/>
  <text x="256" y="256" text-anchor="middle" dominant-baseline="central" font-family="Inter,system-ui,sans-serif" font-weight="700" font-size="320" fill="${WHITE}">S</text>
</svg>`;

await sharp(Buffer.from(icon512Svg)).png().toFile('public/icon-512.png');
console.log('Created icon-512.png');

console.log('All assets generated.');

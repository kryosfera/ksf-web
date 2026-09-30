import sharp from 'sharp';
const k = `<g transform="translate(820,150) scale(1.15)"><defs><linearGradient id="g" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="290" y2="275"><stop offset="0" stop-color="#89F4B4"/><stop offset="1" stop-color="#7BD9EF"/></linearGradient></defs><g fill="url(#g)"><polygon points="0,140 122,0 165,0 0,189"/><polygon points="0,204 178,0 222,0 0,255"/><polygon points="240,0 288,0 50,273 2,273"/><polygon points="140,190 163,162 260,273 210,273"/><polygon points="110,225 133,197 200,273 152,273"/><polygon points="80,258 102,230 140,273 93,273"/></g></g>`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#05090E"/>${k}
<text x="80" y="250" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="68" fill="#EEF5F6">Convertimos la ciencia</text>
<text x="80" y="330" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="68" fill="#7BD9EF">en experiencias</text>
<text x="80" y="420" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="#A3B5BD">Formación, eventos y tecnología para el sector salud.</text>
<text x="80" y="540" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="26" fill="#EEF5F6">KSF Digital Healthcare · ksf.es</text></svg>`;
await sharp(Buffer.from(svg)).png().toFile('public/og.png');
console.log('public/og.png generado');

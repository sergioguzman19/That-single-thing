// Genera todos los íconos de la app desde una sola geometría: el ícono "Umbral".
// Uso: node scripts/generate-icons.mjs
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const LIGHT = { bg: "#FFFFFF", stroke: "#16211D", fill: "#F2F8FA", dot: "#2F8FA6" };
const DARK = { bg: "#0F1513", stroke: "#E9EEEC", fill: "#1B2B2F", dot: "#4FB3CB" };

// Geometría en una grilla de 100. Arco romano: medio punto, jambas rectas y umbral.
// `small` engrosa trazo y punto para que el ícono aguante a 16–48 px.
function umbral({ bg, stroke, fill, dot }, { small = false, scale = 1, rounded = false } = {}) {
  // Proporción de puerta: alto ≈ 1.7 × ancho (tomada del render de ChatGPT).
  const sw = small ? 7 : 4.5;
  const r = small ? 7.5 : 5.5;
  const [x1, x2, top, bottom] = small ? [27, 73, 10, 90] : [33, 67, 20, 79];
  const cy = top + (x2 - x1) / 2;
  const arch = `M${x1} ${bottom} V${cy} A${(x2 - x1) / 2} ${(x2 - x1) / 2} 0 0 1 ${x2} ${cy} V${bottom} Z`;
  const dotY = small ? 67 : 62;
  const t = scale === 1 ? "" : ` transform="translate(50 50) scale(${scale}) translate(-50 -50)"`;
  return `<rect width="100" height="100" ${rounded ? 'rx="22.4"' : ""} fill="${bg}"/>
  <g${t}><path d="${arch}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>
  <circle cx="50" cy="${dotY}" r="${r}" fill="${dot}"/></g>`;
}

const svg = (body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${body}</svg>`;

// Favicon adaptable: sigue el tema del sistema.
const adaptive = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<style>
  .bg{fill:${LIGHT.bg}} .arch{fill:${LIGHT.fill};stroke:${LIGHT.stroke}} .dot{fill:${LIGHT.dot}}
  @media (prefers-color-scheme: dark){ .bg{fill:${DARK.bg}} .arch{fill:${DARK.fill};stroke:${DARK.stroke}} .dot{fill:${DARK.dot}} }
</style>
<rect class="bg" width="100" height="100" rx="22.4"/>
<path class="arch" d="M27 90 V33 A23 23 0 0 1 73 33 V90 Z" stroke-width="7" stroke-linejoin="round"/>
<circle class="dot" cx="50" cy="67" r="7.5"/>
</svg>
`;

const png = (body, size) => sharp(Buffer.from(svg(body)), { density: 72 * (size / 100) * 4 }).resize(size, size).png().toBuffer();

// ICO con PNG embebidos (formato válido desde Windows Vista y en todos los navegadores).
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = 6 + 16 * images.length;
  const entries = images.map(({ size, data }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    return e;
  });
  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

await mkdir("design/icon", { recursive: true });
await mkdir("public/icons", { recursive: true });

// Fuentes vectoriales (para diseño y para pedir variaciones).
await writeFile("design/icon/umbral-light.svg", svg(umbral(LIGHT)));
await writeFile("design/icon/umbral-dark.svg", svg(umbral(DARK)));
await writeFile("design/icon/umbral-small.svg", svg(umbral(LIGHT, { small: true })));

// Next.js: favicon, icon y apple-icon en src/app.
await writeFile("src/app/icon.svg", adaptive);
await writeFile("src/app/favicon.ico", ico(await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await png(umbral(LIGHT, { small: true, rounded: true }), size) })))));
await writeFile("src/app/apple-icon.png", await png(umbral(LIGHT), 180));

// Manifest: estándar y "maskable" (contenido dentro de la zona segura del 80 %).
await writeFile("public/icons/icon-192.png", await png(umbral(LIGHT), 192));
await writeFile("public/icons/icon-512.png", await png(umbral(LIGHT), 512));
await writeFile("public/icons/icon-maskable-512.png", await png(umbral(LIGHT, { scale: 0.86 }), 512));
await writeFile("public/icons/icon-1024.png", await png(umbral(LIGHT), 1024));
await writeFile("public/icons/icon-dark-1024.png", await png(umbral(DARK), 1024));

console.log("Íconos generados.");

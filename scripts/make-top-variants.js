// Biến thể màu cho áo mới: tee-cycling, tee-model-red, tee-aston-green, polo-ferrari → public/products/p-<mẫu>-<màu>.jpg (+ t-)
// Chạy: node scripts/make-top-variants.js [preview]
const sharp = require("sharp");
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const out = path.join(root, "public", "products");
const R = (f) => path.join(__dirname, "reference", f);
const W = 1200, H = 1500;
const clamp = (x) => Math.max(0, Math.min(1, x));

// ảnh gốc đã chuẩn khung 4:5 chính là ảnh sản phẩm hiện tại → đổi màu trực tiếp trên đó
const cur = (key) => path.join(out, `p-${key}.jpg`);
function rgb2hsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [((h * 60) + 360) % 360, mx ? d / mx : 0, mx];
}
function hsv2rgb(h, s, v) {
  const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}
const hd = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
// dịch màu chỉ với các điểm ảnh có hue gần `center` (±width) và đủ bão hoà: tránh da người, logo vàng/xanh
async function shift(file, { center, width, minSat, to, satMul = 1 }) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const o = Buffer.from(data);
  for (let i = 0; i < data.length; i += 3) {
    const [h, s, v] = rgb2hsv(data[i], data[i + 1], data[i + 2]);
    const w = clamp(1 - (hd(h, center) - width) / 18) * clamp((s - minSat) / 0.12);
    if (w <= 0) continue;
    const [r, g, b] = hsv2rgb((h - center + to + 360) % 360, Math.min(1, s * satMul), v);
    o[i] = Math.round(data[i] * (1 - w) + r * w); o[i + 1] = Math.round(data[i + 1] * (1 - w) + g * w); o[i + 2] = Math.round(data[i + 2] * (1 - w) + b * w);
  }
  return sharp(o, { raw: info }).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
}
const global = (file, deg) => sharp(file).modulate({ hue: deg }).jpeg({ quality: 90, mozjpeg: true }).toBuffer();

const sets = [
  { model: "tee-cycling", colors: { blue: 200, green: 130, teal: 170, yellow: 70 }, mk: (d) => global(cur("tee-cycling"), d) },
  { model: "tee-model-red", colors: { navy: 225, forest: 135, orange: 28, purple: 275 },
    mk: (to) => shift(cur("tee-model-red"), { center: 0, width: 16, minSat: 0.55, to }) },
  { model: "tee-aston-green", colors: { blue: 215, red: 355, purple: 280, orange: 25 },
    mk: (to) => shift(cur("tee-aston-green"), { center: 170, width: 22, minSat: 0.35, to }) },
  { model: "polo-ferrari", colors: { blue: 220, green: 140 },
    mk: (to) => shift(cur("polo-ferrari"), { center: 355, width: 14, minSat: 0.5, to }) },
];
(async () => {
  const preview = process.argv[2] === "preview";
  const v = Date.now(), mapPath = path.join(root, "lib", "images.json");
  const map = JSON.parse(fs.readFileSync(mapPath, "utf8"));
  for (const s of sets) for (const [name, arg] of Object.entries(s.colors)) {
    const full = await s.mk(arg), key = `${s.model}-${name}`;
    if (preview) { fs.writeFileSync(path.join(process.env.TMPDIR, `t-${key}.jpg`), full); continue; }
    fs.writeFileSync(path.join(out, `p-${key}.jpg`), full);
    fs.writeFileSync(path.join(out, `t-${key}.jpg`), await sharp(full).resize(720, 900).jpeg({ quality: 80, progressive: true }).toBuffer());
    map[`p-${key}`] = `/products/p-${key}.jpg?v=${v}`;
  }
  if (!preview) fs.writeFileSync(mapPath, JSON.stringify(map, null, 1));
  console.log("xong");
})();

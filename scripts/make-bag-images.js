// 3 balo mới từ scripts/reference/bag-*.webp → p-bg-<mẫu>.jpg + biến thể màu p-bg-<mẫu>-<màu>.jpg (+ t-) và lib/images.json
// Chạy: node scripts/make-bag-images.js [preview]
const sharp = require("sharp");
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const out = path.join(root, "public", "products");
const R = (f) => path.join(__dirname, "reference", f);
const W = 1200, H = 1500;
const clamp = (x) => Math.max(0, Math.min(1, x));
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
// đổi hue của các điểm ảnh có hue gần `center` (±width) — giữ nguyên da, nền, logo
async function shift(buf, { center, width, minSat, to }) {
  const { data, info } = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const o = Buffer.from(data);
  for (let i = 0; i < data.length; i += 3) {
    const [h, s, v] = rgb2hsv(data[i], data[i + 1], data[i + 2]);
    const w = clamp(1 - (hd(h, center) - width) / 18) * clamp((s - minSat) / 0.12);
    if (w <= 0) continue;
    const [r, g, b] = hsv2rgb((h - center + to + 360) % 360, s, v);
    o[i] = Math.round(data[i] * (1 - w) + r * w); o[i + 1] = Math.round(data[i + 1] * (1 - w) + g * w); o[i + 2] = Math.round(data[i + 2] * (1 - w) + b * w);
  }
  return sharp(o, { raw: info }).jpeg({ quality: 92 }).toBuffer();
}
const crop = (f, c) => sharp(R(f)).extract(c).resize(W, H, { kernel: "lanczos3" }).sharpen({ sigma: 0.7 }).jpeg({ quality: 92 }).toBuffer();
// ảnh Kamito: xoá chữ tiêu đề ở góc trên phải bằng cách kéo giãn một hàng nền sạch
const kamito = async () => {
  const strip = await sharp(R("bag-kamito.webp")).extract({ left: 860, top: 345, width: 260, height: 1 }).resize(260, 300, { fit: "fill" }).toBuffer();
  const clean = await sharp(R("bag-kamito.webp")).composite([{ input: strip, left: 860, top: 50 }]).png().toBuffer();
  return sharp(clean).extract({ left: 60, top: 255, width: 1008, height: 1260 }).resize(W, H, { kernel: "lanczos3" }).sharpen({ sigma: 0.7 }).jpeg({ quality: 92 }).toBuffer();
};
const sets = [
  { model: "bg-jogarbola", base: () => crop("bag-jogarbola.webp", { left: 170, top: 130, width: 856, height: 1070 }),
    colors: { green: (b) => shift(b, { center: 225, width: 35, minSat: 0.3, to: 150 }), orange: (b) => shift(b, { center: 225, width: 35, minSat: 0.3, to: 25 }), purple: (b) => shift(b, { center: 225, width: 35, minSat: 0.3, to: 280 }), black: (b) => sharp(b).modulate({ saturation: 0.05, brightness: 0.8 }).jpeg({ quality: 92 }).toBuffer() } },
  { model: "bg-acg", base: () => crop("bag-acg.webp", { left: 100, top: 0, width: 800, height: 1000 }),
    colors: { green: (b) => shift(b, { center: 275, width: 30, minSat: 0.3, to: 135 }), orange: (b) => shift(b, { center: 275, width: 30, minSat: 0.3, to: 25 }), blue: (b) => shift(b, { center: 275, width: 30, minSat: 0.3, to: 215 }), pink: (b) => shift(b, { center: 275, width: 30, minSat: 0.3, to: 330 }) } },
  { model: "bg-kamito", base: kamito,
    colors: { blue: (b) => sharp(b).modulate({ hue: 230 }).jpeg({ quality: 92 }).toBuffer(), green: (b) => sharp(b).modulate({ hue: 150 }).jpeg({ quality: 92 }).toBuffer(), orange: (b) => sharp(b).modulate({ hue: 40 }).jpeg({ quality: 92 }).toBuffer() } },
];
(async () => {
  const preview = process.argv[2] === "preview";
  const v = Date.now(), mapPath = path.join(root, "lib", "images.json");
  const map = JSON.parse(fs.readFileSync(mapPath, "utf8"));
  const save = async (key, full) => {
    if (preview) { fs.writeFileSync(path.join(process.env.TMPDIR, `b-${key}.jpg`), full); return; }
    fs.writeFileSync(path.join(out, `p-${key}.jpg`), full);
    fs.writeFileSync(path.join(out, `t-${key}.jpg`), await sharp(full).resize(720, 900).jpeg({ quality: 80, progressive: true }).toBuffer());
    map[`p-${key}`] = `/products/p-${key}.jpg?v=${v}`;
  };
  for (const s of sets) {
    const base = await s.base();
    await save(s.model, base);
    for (const [name, mk] of Object.entries(s.colors)) await save(`${s.model}-${name}`, await mk(base));
  }
  if (!preview) fs.writeFileSync(mapPath, JSON.stringify(map, null, 1));
  console.log("xong");
})();

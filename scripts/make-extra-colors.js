// Thêm nhiều màu cho các sản phẩm đã có: tạo ảnh p-<mẫu>-<màu>.jpg (+ t-) từ ảnh hiện tại và cập nhật lib/images.json
// Chạy: node scripts/make-extra-colors.js [preview]
const sharp = require("sharp");
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const out = path.join(root, "public", "products");
const cur = (k) => path.join(out, `p-${k}.jpg`);
const clamp = (x) => Math.max(0, Math.min(1, x));
const JPG = { quality: 92, mozjpeg: true };

// nhuộm vải tối (mũ, balo, giày đen) — giữ vùng sáng/nền
async function tintDark(file, [tr, tg, tb], thr = 100) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 3) {
    const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
    const w = clamp((thr - lum) / thr), shade = 0.55 + 0.9 * Math.min(1, lum / 110);
    data[i] = data[i] * (1 - w) + Math.min(255, tr * shade) * w;
    data[i + 1] = data[i + 1] * (1 - w) + Math.min(255, tg * shade) * w;
    data[i + 2] = data[i + 2] * (1 - w) + Math.min(255, tb * shade) * w;
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 3 } }).modulate({ saturation: 1.22 }).jpeg(JPG).toBuffer();
}
const hue = (file, deg) => sharp(file).modulate({ hue: deg }).jpeg(JPG).toBuffer();
// áo xám sáng (áo F1 Heather Grey): nhuộm thân áo, giữ logo/nền
async function tintGray(file, rgb) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const o = Buffer.from(data);
  for (let i = 0; i < data.length; i += 3) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), lum = (r + g + b) / 3, sat = mx ? (mx - mn) / mx : 0;
    const w = clamp((243 - lum) / 15) * clamp((lum - 120) / 40) * clamp(1 - (sat - 0.05) / 0.08);
    if (w <= 0) continue;
    const k = lum / 205;
    for (let c = 0; c < 3; c++) o[i + c] = Math.round(data[i + c] * (1 - w) + Math.min(255, rgb[c] * k) * w);
  }
  return sharp(o, { raw: info }).jpeg(JPG).toBuffer();
}
// dịch hue cục bộ (áo có người mẫu — giữ da)
function rgb2hsv(r, g, b) { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let h = 0; if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return [((h * 60) + 360) % 360, mx ? d / mx : 0, mx]; }
function hsv2rgb(h, s, v) { const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c; const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]; return [(r + m) * 255, (g + m) * 255, (b + m) * 255]; }
const hd = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
async function shift(file, { center, width, minSat, to }) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const o = Buffer.from(data);
  for (let i = 0; i < data.length; i += 3) {
    const [h, s, v] = rgb2hsv(data[i], data[i + 1], data[i + 2]);
    const w = clamp(1 - (hd(h, center) - width) / 18) * clamp((s - minSat) / 0.12);
    if (w <= 0) continue;
    const [r, g, b] = hsv2rgb((h - center + to + 360) % 360, s, v);
    o[i] = Math.round(data[i] * (1 - w) + r * w); o[i + 1] = Math.round(data[i + 1] * (1 - w) + g * w); o[i + 2] = Math.round(data[i + 2] * (1 - w) + b * w);
  }
  return sharp(o, { raw: info }).jpeg(JPG).toBuffer();
}

const C = { yellow: [214, 160, 30], orange: [214, 100, 30], pink: [200, 80, 130], sky: [60, 140, 210], red: [180, 40, 45], lime: [120, 170, 50], mint: [60, 160, 140], gold: [214, 163, 41], coral: [224, 108, 94], lavender: [140, 110, 200] };
const dark = (src, names) => names.map((n) => [`${src}-${n}`, () => tintDark(cur(src), C[n])]);
const hues = (src, m) => Object.entries(m).map(([n, d]) => [`${src}-${n}`, () => hue(cur(src), d)]);
const jobs = [
  ...dark("cap", ["yellow", "orange", "pink", "sky", "red", "lime"]),
  ...dark("bag", ["yellow", "orange", "pink", "sky", "red", "lime"]),
  ...dark("speedcat", ["yellow", "orange", "pink", "sky"]),
  ...Object.entries({ gold: C.gold, pink: C.pink, orange: C.orange, sky: C.sky }).map(([n, c]) => [`tee-black-${n}`, () => tintGray(cur("tee-black"), c)]),
  ...hues("tee-volt", { "x60": 60, "x120": 120, "x270": 270 }),
  ...hues("puffer", { "x40": 40, "x100": 100, "x200": 200 }),
  ...hues("tee-cycling", { "x40": 40, "x90": 90, "x300": 300 }),
  ...hues("pt-cycling-set", { "x100": 100, "x230": 230, "x300": 300 }),
  ...hues("bg-kamito", { "x270": 270, "x330": 330 }),
  ...hues("bg-jogarbola", { "x90": 90, "x330": 330 }),
  ["tee-model-red-teal", () => shift(cur("tee-model-red"), { center: 0, width: 16, minSat: 0.55, to: 175 })],
  ["tee-model-red-pink", () => shift(cur("tee-model-red"), { center: 0, width: 16, minSat: 0.55, to: 330 })],
  ["tee-model-red-mustard", () => shift(cur("tee-model-red"), { center: 0, width: 16, minSat: 0.55, to: 48 })],
  ["tee-aston-green-mustard", () => shift(cur("tee-aston-green"), { center: 170, width: 22, minSat: 0.35, to: 45 })],
  ["tee-aston-green-pink", () => shift(cur("tee-aston-green"), { center: 170, width: 22, minSat: 0.35, to: 330 })],
  ["tee-aston-green-cyan", () => shift(cur("tee-aston-green"), { center: 170, width: 22, minSat: 0.35, to: 195 })],
  ["polo-ferrari-purple", () => shift(cur("polo-ferrari"), { center: 355, width: 14, minSat: 0.5, to: 275 })],
  ["polo-ferrari-orange", () => shift(cur("polo-ferrari"), { center: 355, width: 14, minSat: 0.5, to: 28 })],
  ["polo-ferrari-teal", () => shift(cur("polo-ferrari"), { center: 355, width: 14, minSat: 0.5, to: 180 })],
  ["bg-acg-yellow", () => shift(cur("bg-acg"), { center: 275, width: 30, minSat: 0.3, to: 50 })],
  ["bg-acg-red", () => shift(cur("bg-acg"), { center: 275, width: 30, minSat: 0.3, to: 355 })],
];
(async () => {
  const preview = process.argv[2] === "preview";
  const v = Date.now(), mapPath = path.join(root, "lib", "images.json");
  const map = JSON.parse(fs.readFileSync(mapPath, "utf8"));
  for (const [key, mk] of jobs) {
    const full = await mk();
    if (preview) { fs.writeFileSync(path.join(process.env.TMPDIR, `x-${key}.jpg`), full); continue; }
    fs.writeFileSync(path.join(out, `p-${key}.jpg`), full);
    fs.writeFileSync(path.join(out, `t-${key}.jpg`), await sharp(full).resize(720, 900).jpeg({ quality: 80, progressive: true }).toBuffer());
    map[`p-${key}`] = `/products/p-${key}.jpg?v=${v}`;
  }
  if (!preview) fs.writeFileSync(mapPath, JSON.stringify(map, null, 1));
  console.log("xong", jobs.length);
})();

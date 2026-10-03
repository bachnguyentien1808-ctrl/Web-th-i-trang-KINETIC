// 15 ảnh mẫu trong scripts/reference/mau/ (mũ, balo, giày) → p-mau-<sXX>.jpg + biến thể màu (+ t-) và lib/images.json
// Chạy: node scripts/make-sample-images.js [preview]
const sharp = require("sharp");
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const out = path.join(root, "public", "products");
const M = (f) => path.join(__dirname, "reference", "mau", f);
const W = 1200, H = 1500;
const clamp = (x) => Math.max(0, Math.min(1, x));
const JPG = { quality: 92, mozjpeg: true };

// cắt đúng khổ 4:5 (left/top/width/height của ảnh gốc) rồi phóng to
const cover = (buf, c) => sharp(buf).extract(c).resize(W, H, { kernel: "lanczos3" }).sharpen({ sigma: 0.6 }).png().toBuffer();
// ảnh vuông/ngang: phóng to theo chiều ngang, nền trên/dưới là màu mép (phẳng), mép chuyển mờ
async function fit(buf, crop) {
  let img = sharp(buf).flatten({ background: "#fff" });
  if (crop) img = img.extract(crop);
  const src = await img.toBuffer();
  const body = await sharp(src).resize(W, null, { kernel: "lanczos3" }).sharpen({ sigma: 0.6 }).toBuffer();
  const h = (await sharp(body).metadata()).height, top = Math.floor((H - h) / 2), bottom = H - h - top;
  const avg = async (y) => { const p = await sharp(body).extract({ left: 0, top: y, width: W, height: 6 }).resize(1, 1).raw().toBuffer(); return { r: p[0], g: p[1], b: p[2] }; };
  const [ct, cb] = [await avg(0), await avg(h - 6)];
  const solid = (n, c) => sharp({ create: { width: W, height: n, channels: 3, background: c } }).png().toBuffer();
  const canvas = await sharp({ create: { width: W, height: H, channels: 3, background: "#fff" } }).composite([
    { input: await solid(top, ct), left: 0, top: 0 }, { input: body, left: 0, top }, { input: await solid(bottom, cb), left: 0, top: top + h }]).png().toBuffer();
  const mask = Buffer.alloc(W * H), feather = 90;
  for (let y = 0; y < H; y++) { const d = Math.min(y - top, top + h - 1 - y); mask.fill(Math.round((d < 0 ? 0 : Math.min(1, d / feather)) * 255), y * W, (y + 1) * W); }
  return canvas;
}
// xoá nền ô vuông giả "trong suốt" (ảnh s11): nền xám/trắng ít màu → trắng
async function clearChecker(buf) {
  const { data, info } = await sharp(buf).flatten({ background: "#fff" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const o = Buffer.from(data);
  for (let i = 0; i < data.length; i += 3) {
    const r = data[i], g = data[i + 1], b = data[i + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b), lum = (r + g + b) / 3, sat = mx ? (mx - mn) / mx : 0;
    const w = clamp((lum - 150) / 25) * clamp(1 - (sat - 0.04) / 0.08);
    if (w > 0) for (let c = 0; c < 3; c++) o[i + c] = Math.round(data[i + c] * (1 - w) + 255 * w);
  }
  return sharp(o, { raw: info }).png().toBuffer();
}
const rgb2hsv = (r, g, b) => { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let h = 0; if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return [((h * 60) + 360) % 360, mx ? d / mx : 0, mx]; };
const hsv2rgb = (h, s, v) => { const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c; const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]; return [(r + m) * 255, (g + m) * 255, (b + m) * 255]; };
const hd = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
// dịch hue cục bộ quanh `center` (giữ da người, nền)
async function shift(buf, { center, width, minSat, to, satMul = 1, feather = 18 }) {
  const { data, info } = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const o = Buffer.from(data);
  for (let i = 0; i < data.length; i += 3) {
    const [h, s, v] = rgb2hsv(data[i], data[i + 1], data[i + 2]);
    const w = clamp(1 - (hd(h, center) - width) / feather) * clamp((s - minSat) / 0.1);
    if (w <= 0) continue;
    const [r, g, b] = hsv2rgb((h - center + to + 360) % 360, Math.min(1, s * satMul), v);
    o[i] = Math.round(data[i] * (1 - w) + r * w); o[i + 1] = Math.round(data[i + 1] * (1 - w) + g * w); o[i + 2] = Math.round(data[i + 2] * (1 - w) + b * w);
  }
  return sharp(o, { raw: info }).png().toBuffer();
}
const hueAll = (buf, deg, sat = 1) => sharp(buf).modulate({ hue: deg, saturation: sat }).png().toBuffer();
async function tintDark(buf, [tr, tg, tb], thr = 110) {
  const { data, info } = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 3) {
    const lum = (data[i] + data[i + 1] + data[i + 2]) / 3, w = clamp((thr - lum) / thr), shade = 0.55 + 0.9 * Math.min(1, lum / 110);
    data[i] = data[i] * (1 - w) + Math.min(255, tr * shade) * w; data[i + 1] = data[i + 1] * (1 - w) + Math.min(255, tg * shade) * w; data[i + 2] = data[i + 2] * (1 - w) + Math.min(255, tb * shade) * w;
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 3 } }).modulate({ saturation: 1.2 }).png().toBuffer();
}
const TC = { navy: [40, 62, 130], red: [170, 40, 50], forest: [30, 110, 70], orange: [215, 105, 35], plum: [100, 45, 110], sky: [60, 140, 210] };
const sq = (x, y, w) => ({ left: x, top: y, width: w, height: Math.round(w * 1.25) });
// [khoá, ảnh gốc, hàm tạo khung 4:5, {màu: hàm đổi màu trên ảnh đã dựng}]
const ITEMS = [
  ["s00", "s00.avif", (b) => fit(b)],
  ["s01", "s01.webp", (b) => fit(b), { cam: (b) => hueAll(b, 0), xanh: (b) => hueAll(b, 150), hong: (b) => hueAll(b, 300, 0.9) }],
  ["s02", "s02.jpg", (b) => cover(b, { left: 0, top: 3, width: 755, height: 944 }), { navy: (b) => shift(b, { center: 358, width: 5, feather: 7, minSat: 0.6, to: 225 }), green: (b) => shift(b, { center: 358, width: 5, feather: 7, minSat: 0.6, to: 140 }), orange: (b) => shift(b, { center: 358, width: 5, feather: 7, minSat: 0.6, to: 28 }) }],
  ["s03", "s03.jpg", (b) => cover(b, { left: 0, top: 0, width: 800, height: 1000 })],
  ["s04", "s04.webp", (b) => cover(b, sq(60, 0, 480))],
  ["s05", "s05.jpg", (b) => cover(b, sq(0, 0, 480))],
  ["s06", "s06.webp", (b) => cover(b, { left: 0, top: 0, width: 480, height: 600 }), { green: (b) => hueAll(b, 120), blue: (b) => hueAll(b, 200), orange: (b) => hueAll(b, 60) }],
  ["s07", "s07.jpeg", (b) => cover(b, sq(60, 0, 443))],
  ["s08", "s08.jpeg", (b) => fit(b), { cream: (b) => hueAll(b, 40, 0.9), mint: (b) => hueAll(b, 170, 1.6), sky: (b) => hueAll(b, 230, 1.8), lilac: (b) => hueAll(b, 280, 1.7) }],
  ["s09", "s09.jpg", (b) => fit(b)],
  ["s10", "s10.webp", (b) => fit(b, { left: 0, top: 80, width: 1200, height: 820 }), { navy: (b) => tintDark(b, TC.navy), red: (b) => tintDark(b, TC.red), forest: (b) => tintDark(b, TC.forest), orange: (b) => tintDark(b, TC.orange) }],
  ["s11", "s11.png", async (b) => fit(await clearChecker(b)), { blue: (b) => hueAll(b, 200), purple: (b) => hueAll(b, 270) }],
  ["s12", "s12.webp", (b) => cover(b, sq(80, 0, 640))],
  ["s13", "s13.jpeg", (b) => cover(b, { left: 200, top: 0, width: 1600, height: 2000 }), { green: (b) => hueAll(b, 60), red: (b) => hueAll(b, 150), purple: (b) => hueAll(b, 300), teal: (b) => hueAll(b, 20) }],
  ["s14", "s14.jpg", (b) => fit(b)],
];
(async () => {
  const preview = process.argv[2] === "preview";
  const v = Date.now(), mapPath = path.join(root, "lib", "images.json");
  const map = JSON.parse(fs.readFileSync(mapPath, "utf8"));
  const save = async (key, png) => {
    const full = await sharp(png).jpeg(JPG).toBuffer();
    if (preview) { fs.writeFileSync(path.join(process.env.TMPDIR, `m-${key}.jpg`), full); return; }
    fs.writeFileSync(path.join(out, `p-mau-${key}.jpg`), full);
    fs.writeFileSync(path.join(out, `t-mau-${key}.jpg`), await sharp(full).resize(720, 900).jpeg({ quality: 80, progressive: true }).toBuffer());
    map[`p-mau-${key}`] = `/products/p-mau-${key}.jpg?v=${v}`;
  };
  for (const [key, file, mk, colors = {}] of ITEMS) {
    const base = await mk(fs.readFileSync(M(file)));
    await save(key, base);
    for (const [name, f] of Object.entries(colors)) await save(`${key}-${name}`, await f(base));
  }
  if (!preview) fs.writeFileSync(mapPath, JSON.stringify(map, null, 1));
  console.log("xong");
})();

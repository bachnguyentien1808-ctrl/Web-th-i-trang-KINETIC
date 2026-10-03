// 3 giày mới từ scripts/reference/shoe-*.png → p-sh-<mẫu>.jpg + biến thể màu (+ t-) và lib/images.json
// Chạy: node scripts/make-shoe-images.js [preview]
const sharp = require("sharp");
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const out = path.join(root, "public", "products");
const R = (f) => path.join(__dirname, "reference", f);
const W = 1200, H = 1500;
const clamp = (x) => Math.max(0, Math.min(1, x));
const JPG = { quality: 92, mozjpeg: true };

// ảnh vuông → khung 4:5: phóng to theo chiều ngang, nền trên/dưới là màu trung bình của mép (phẳng), mép chuyển mờ
async function frame(buf, bgFrom) {
  const body = await sharp(buf).resize(W, null, { kernel: "lanczos3" }).sharpen({ sigma: 0.7 }).toBuffer();
  const h = (await sharp(body).metadata()).height, top = Math.floor((H - h) / 2), bottom = H - h - top;
  const avg = async (y) => { const p = await sharp(body).extract({ left: 0, top: y, width: W, height: 8 }).resize(1, 1).raw().toBuffer(); return { r: p[0], g: p[1], b: p[2] }; };
  const ct = bgFrom === "white" ? { r: 255, g: 255, b: 255 } : await avg(0), cb = bgFrom === "white" ? { r: 255, g: 255, b: 255 } : await avg(h - 8);
  const canvas = await sharp({ create: { width: W, height: H, channels: 3, background: "#888" } }).composite([
    { input: await sharp({ create: { width: W, height: top, channels: 3, background: ct } }).png().toBuffer(), left: 0, top: 0 },
    { input: body, left: 0, top },
    { input: await sharp({ create: { width: W, height: bottom, channels: 3, background: cb } }).png().toBuffer(), left: 0, top: top + h }]).png().toBuffer();
  const soft = canvas, feather = 120, mask = Buffer.alloc(W * H);
  for (let y = 0; y < H; y++) { const d = Math.min(y - top, top + h - 1 - y); mask.fill(Math.round((d < 0 ? 0 : Math.min(1, d / feather)) * 255), y * W, (y + 1) * W); }
  const fg = await sharp(canvas).joinChannel(mask, { raw: { width: W, height: H, channels: 1 } }).png().toBuffer();
  // phần chuyển mờ giữa nền phẳng và ảnh
  const rect = await sharp({ create: { width: W, height: H, channels: 3, background: "#000" } }).png().toBuffer();
  void rect;
  return sharp(soft).composite([{ input: fg }]).jpeg(JPG).toBuffer();
}
const rgb2hsv = (r, g, b) => { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); return [0, mx ? (mx - mn) / mx : 0, mx]; };
// nhuộm vùng sáng ít màu (giày trắng): giữ nền xám tối hơn và chi tiết đen/xám
async function tintLight(file, rgb, { lo, hi }) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const o = Buffer.from(data);
  for (let i = 0; i < data.length; i += 3) {
    const r = data[i], g = data[i + 1], b = data[i + 2], lum = (r + g + b) / 3, sat = rgb2hsv(r, g, b)[1];
    const w = clamp((lum - lo) / (hi - lo)) * clamp(1 - (sat - 0.08) / 0.1);
    if (w <= 0) continue;
    const k = Math.min(1.1, lum / 235);
    for (let c = 0; c < 3; c++) o[i + c] = Math.round(data[i + c] * (1 - w) + Math.min(255, rgb[c] * k) * w);
  }
  return sharp(o, { raw: info }).png().toBuffer();
}
async function tintDark(file, [tr, tg, tb], thr = 150) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 3) {
    const lum = (data[i] + data[i + 1] + data[i + 2]) / 3, w = clamp((thr - lum) / thr), shade = 0.55 + 0.9 * Math.min(1, lum / 110);
    data[i] = data[i] * (1 - w) + Math.min(255, tr * shade) * w; data[i + 1] = data[i + 1] * (1 - w) + Math.min(255, tg * shade) * w; data[i + 2] = data[i + 2] * (1 - w) + Math.min(255, tb * shade) * w;
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 3 } }).modulate({ saturation: 1.15 }).png().toBuffer();
}
const C = { pink: [226, 120, 150], sky: [110, 170, 225], mint: [120, 205, 170], lilac: [170, 140, 220], peach: [240, 160, 120], yellow: [235, 205, 90], red: [190, 50, 55], navy: [45, 70, 140], forest: [40, 120, 80], brown: [120, 78, 45], orange: [225, 110, 35], plum: [110, 50, 120] };
const sets = [
  { model: "sh-white", src: () => sharp(R("shoe-white-chunky.png")).flatten({ background: "#fff" }).png().toBuffer(), bg: "edge",
    colors: Object.fromEntries(["pink", "sky", "mint", "lilac", "peach", "yellow"].map((n) => [n, (b) => tintLight(b, C[n], { lo: 205, hi: 232 })])) },
  { model: "sh-mint", src: () => sharp(R("shoe-mint-nmd.png")).flatten({ background: "#fff" }).png().toBuffer(), bg: "white",
    colors: Object.fromEntries(Object.entries({ pink: 150, lilac: 230, peach: 300, yellow: 60, sky: 180, rose: 270 }).map(([n, d]) => [n, (b) => sharp(b).modulate({ hue: d, saturation: 2.6 }).png().toBuffer()])) },
  { model: "sh-knit", src: () => sharp(R("shoe-knit-black.png")).extract({ left: 0, top: 55, width: 600, height: 545 }).flatten({ background: "#fff" }).png().toBuffer(), bg: "edge",
    colors: Object.fromEntries(["navy", "red", "forest", "brown", "orange", "plum"].map((n) => [n, (b) => tintDark(b, C[n], 120)])) },
];
(async () => {
  const preview = process.argv[2] === "preview";
  const v = Date.now(), mapPath = path.join(root, "lib", "images.json");
  const map = JSON.parse(fs.readFileSync(mapPath, "utf8"));
  const save = async (key, full) => {
    if (preview) { fs.writeFileSync(path.join(process.env.TMPDIR, `s-${key}.jpg`), full); return; }
    fs.writeFileSync(path.join(out, `p-${key}.jpg`), full);
    fs.writeFileSync(path.join(out, `t-${key}.jpg`), await sharp(full).resize(720, 900).jpeg({ quality: 80, progressive: true }).toBuffer());
    map[`p-${key}`] = `/products/p-${key}.jpg?v=${v}`;
  };
  for (const s of sets) {
    const base = await s.src();
    await save(s.model, await frame(base, s.bg));
    for (const [name, mk] of Object.entries(s.colors)) await save(`${s.model}-${name}`, await frame(await mk(base), s.bg));
  }
  if (!preview) fs.writeFileSync(mapPath, JSON.stringify(map, null, 1));
  console.log("xong");
})();

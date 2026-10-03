// Tạo biến thể màu cho 3 quần mới (p-pt-<mẫu>-<màu>.jpg + t-) bằng cách đổi màu ảnh gốc trong scripts/reference/pants-*.*
// Chạy: node scripts/make-pants-variants.js
const sharp = require("sharp");
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const out = path.join(root, "public", "products");
const W = 1200, H = 1500;
const clamp = (x) => Math.max(0, Math.min(1, x));
const rgbOf = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

// khung 4:5 giống make-pants-images.js
async function frame(buf, scale) {
  const body = await sharp(buf).resize({ width: Math.round(W * scale), height: Math.round(H * scale), fit: "inside", kernel: "lanczos3" }).sharpen({ sigma: 0.8 }).toBuffer();
  const { width, height } = await sharp(body).metadata();
  const top = Math.floor((H - height) / 2), left = Math.floor((W - width) / 2);
  return sharp(body).extend({ top, bottom: H - height - top, left, right: W - width - left, background: "#fff" }).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
}
// mặt nạ nền: loang từ viền qua các điểm gần trắng
function bgMask(data, w, h, thr) {
  const m = new Uint8Array(w * h), q = [];
  const isBg = (i) => data[i * 3] > thr && data[i * 3 + 1] > thr && data[i * 3 + 2] > thr;
  const push = (x, y) => { const i = y * w + x; if (!m[i] && isBg(i)) { m[i] = 1; q.push(i); } };
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
  const grow = () => { const c = m.slice(); for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const i = y * w + x; if (!c[i] && (c[i - 1] || c[i + 1] || c[i - w] || c[i + w])) m[i] = 1; } };
  while (q.length) { const i = q.pop(), x = i % w, y = (i / w) | 0; if (x > 0) push(x - 1, y); if (x < w - 1) push(x + 1, y); if (y > 0) push(x, y - 1); if (y < h - 1) push(x, y + 1); }
  grow(); grow(); grow();
  return m;
}
// nhuộm vùng xám/be/trắng của quần, giữ nguyên nền, vùng đen và màu neon
async function tint(src, rgb, { ref, bgThr, satMax }) {
  const { data, info } = await sharp(src).flatten({ background: "#fff" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const bg = bgMask(data, info.width, info.height, bgThr), o = Buffer.from(data);
  for (let p = 0, i = 0; p < bg.length; p++, i += 3) {
    if (bg[p]) continue;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), lum = (r + g + b) / 3, sat = mx ? (mx - mn) / mx : 0;
    const w = clamp((lum - 85) / 40) * clamp(1 - (sat - satMax) / 0.15);
    if (w <= 0) continue;
    const k = Math.min(1.15, lum / ref);
    for (let c = 0; c < 3; c++) o[i + c] = Math.round(data[i + c] * (1 - w) + Math.min(255, rgb[c] * k) * w);
  }
  return sharp(o, { raw: info }).png().toBuffer();
}
// xoay màu (cho bộ đồ đạp xe: phần đen giữ nguyên)
const hueShift = (src, deg) => sharp(src).flatten({ background: "#fff" }).modulate({ hue: deg }).toBuffer();

const R = (f) => path.join(__dirname, "reference", f);
const sets = [
  { model: "pt-fox-sand", src: R("pants-17.png"), scale: 0.96, mk: (c) => tint(R("pants-17.png"), rgbOf(c), { ref: 175, bgThr: 250, satMax: 0.25 }),
    colors: { olive: "#6b7d3a", navy: "#34508f", burgundy: "#9a3340", teal: "#2c8f8c" } },
  { model: "pt-fox-bw", src: R("pants-16.png"), scale: 0.96, mk: (c) => tint(R("pants-16.png"), rgbOf(c), { ref: 235, bgThr: 252, satMax: 0.2 }),
    colors: { red: "#c8323c", blue: "#2f62c4", orange: "#e8742a", green: "#2f9a5c" } },
  { model: "pt-cycling-set", src: R("pants-18.webp"), scale: 0.92, mk: (c) => hueShift(R("pants-18.webp"), +c),
    colors: { blue: 260, teal: 200, green: 140, orange: 60, yellow: 90 } },
];
(async () => {
  const only = process.argv[2];
  const v = Date.now();
  const mapPath = path.join(root, "lib", "images.json");
  const map = JSON.parse(fs.readFileSync(mapPath, "utf8"));
  for (const s of sets) for (const [name, c] of Object.entries(s.colors)) {
    const full = await frame(await s.mk(c), s.scale);
    const key = `${s.model}-${name}`;
    if (only === "preview") { fs.writeFileSync(path.join(process.env.TMPDIR, `v-${key}.jpg`), full); continue; }
    fs.writeFileSync(path.join(out, `p-${key}.jpg`), full);
    fs.writeFileSync(path.join(out, `t-${key}.jpg`), await sharp(full).resize(720, 900).jpeg({ quality: 80, progressive: true }).toBuffer());
    map[`p-${key}`] = `/products/p-${key}.jpg?v=${v}`;
  }
  if (only !== "preview") fs.writeFileSync(mapPath, JSON.stringify(map, null, 1));
  console.log("xong");
})();

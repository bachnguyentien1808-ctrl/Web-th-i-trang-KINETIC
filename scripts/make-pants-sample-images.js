// Quần từ ảnh mẫu (scripts/reference/mau/q*.*) → p-mau-q<N>.jpg + biến thể màu (+ t-) và lib/images.json
// Chạy: node scripts/make-pants-sample-images.js [preview]
const sharp = require("sharp");
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const out = path.join(root, "public", "products");
const M = (f) => path.join(__dirname, "reference", "mau", f);
const W = 1200, H = 1500;
const clamp = (x) => Math.max(0, Math.min(1, x));
const JPG = { quality: 92, mozjpeg: true };
const cover = (file, c) => sharp(file).extract(c).resize(W, H, { kernel: "lanczos3" }).sharpen({ sigma: 0.6 }).png().toBuffer();
// ảnh cao hẹp (nửa ảnh có 2 quần): phóng theo chiều cao, hai bên lấp bằng màu mép
async function fitSides(file, crop) {
  const body = await sharp(file).extract(crop).resize(null, H, { kernel: "lanczos3" }).sharpen({ sigma: 0.6 }).toBuffer();
  const w = (await sharp(body).metadata()).width, left = Math.floor((W - w) / 2), right = W - w - left;
  const avg = async (x) => { const p = await sharp(body).extract({ left: x, top: 0, width: 6, height: H }).resize(1, 1).raw().toBuffer(); return { r: p[0], g: p[1], b: p[2] }; };
  return sharp(body).extend({ left, right, background: await avg(0) }).png().toBuffer(); // hai bên cùng màu nền xám
}
async function tintDark(buf, [tr, tg, tb], thr = 75) {
  const { data, info } = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 3) {
    const lum = (data[i] + data[i + 1] + data[i + 2]) / 3, w = clamp((thr - lum) / thr), shade = 0.5 + 0.9 * Math.min(1, lum / 70);
    data[i] = data[i] * (1 - w) + Math.min(255, tr * shade) * w; data[i + 1] = data[i + 1] * (1 - w) + Math.min(255, tg * shade) * w; data[i + 2] = data[i + 2] * (1 - w) + Math.min(255, tb * shade) * w;
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 3 } }).modulate({ saturation: 1.2 }).png().toBuffer();
}
const C = { navy: [40, 62, 130], red: [175, 40, 50], forest: [30, 115, 70], olive: [100, 115, 55], plum: [100, 45, 115], teal: [25, 115, 120], brown: [115, 72, 40], royal: [36, 96, 200] };
const dark = (names) => Object.fromEntries(names.map((n) => [n, (b) => tintDark(b, C[n])]));
const ITEMS = [
  ["q0a", () => fitSides(M("q0.jpg"), { left: 0, top: 0, width: 742, height: 1200 }), dark(["navy", "red", "forest", "olive"])],
  ["q0b", () => fitSides(M("q0.jpg"), { left: 742, top: 0, width: 742, height: 1200 }), {}],
  ["q1", () => cover(M("q1.webp"), { left: 0, top: 0, width: 785, height: 981 }), {}],
  ["q2", () => cover(M("q2.jpg"), { left: 100, top: 0, width: 640, height: 800 }), {}],
  ["q3", () => cover(M("q3.jpg"), { left: 0, top: 0, width: 750, height: 937 }), dark(["navy", "red", "forest", "olive"])],
  ["q4", () => cover(M("q4.jpg"), { left: 0, top: 0, width: 600, height: 750 }), dark(["navy", "red", "forest", "olive", "plum", "royal"])],
];
(async () => {
  const preview = process.argv[2] === "preview";
  const v = Date.now(), mapPath = path.join(root, "lib", "images.json");
  const map = JSON.parse(fs.readFileSync(mapPath, "utf8"));
  const save = async (key, png) => {
    const full = await sharp(png).jpeg(JPG).toBuffer();
    if (preview) { fs.writeFileSync(path.join(process.env.TMPDIR, `n-${key}.jpg`), full); return; }
    fs.writeFileSync(path.join(out, `p-mau-${key}.jpg`), full);
    fs.writeFileSync(path.join(out, `t-mau-${key}.jpg`), await sharp(full).resize(720, 900).jpeg({ quality: 80, progressive: true }).toBuffer());
    map[`p-mau-${key}`] = `/products/p-mau-${key}.jpg?v=${v}`;
  };
  for (const [key, mk, colors] of ITEMS) {
    const base = await mk();
    await save(key, base);
    for (const [name, f] of Object.entries(colors)) await save(`${key}-${name}`, await f(base));
  }
  if (!preview) fs.writeFileSync(mapPath, JSON.stringify(map, null, 1));
  console.log("xong");
})();

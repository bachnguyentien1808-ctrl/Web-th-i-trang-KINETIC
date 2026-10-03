// Ảnh banner trang chủ: gốc chỉ 1408×768 nên phóng gấp 1,8 lần bằng Lanczos, làm nét có kiểm soát và thêm hạt mịn
// (hạt mịn giúp mắt thấy ảnh "nét" hơn và che vỡ khối khi phóng) → public/products/w-<tên>.jpg
// Ảnh gốc ở scripts/reference/hero/. Chạy: node scripts/make-hero-images.js [preview]
const sharp = require("sharp");
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const out = path.join(root, "public", "products");
const SRC = (n) => path.join(__dirname, "reference", "hero", `${n}.jpg`);
const WIDTH = 2560;
// focus = vùng người mẫu (tâm x/y và bán kính, tính theo tỉ lệ ảnh) → được làm sáng/nét/rực hơn, nền xung quanh hơi tối và nhạt màu để người nổi lên
const jobs = [
  ["spring-hero", { focus: { cx: 0.56, cy: 0.52, rx: 0.22, ry: 0.52 } }],
  ["summer-hero", { focus: { cx: 0.62, cy: 0.52, rx: 0.30, ry: 0.52 } }],
  ["winter-hero", { focus: { cx: 0.50, cy: 0.55, rx: 0.26, ry: 0.52 } }],
  ["shoe-winter", { focus: { cx: 0.51, cy: 0.55, rx: 0.15, ry: 0.54 } }],
  ["autumn-hero", { crop: { left: 0, top: 44, width: 1345, height: 710 }, focus: { cx: 0.58, cy: 0.52, rx: 0.13, ry: 0.54 } }],
];
async function make(name, { crop, focus }) {
  let img = sharp(SRC(name));
  if (crop) img = img.extract(crop);
  // 1) khử "đục": kéo giãn dải sáng, tăng tương phản và độ bão hoà nhẹ
  // 2) phóng to bằng Lanczos, 3) tăng tương phản cục bộ (CLAHE) và làm nét chi tiết (bán kính nhỏ)
  const base = await img
    .normalise({ lower: 1, upper: 99 })
    .linear(1.1, -10)
    .modulate({ saturation: 1.14 })
    .resize({ width: WIDTH, kernel: "lanczos3" })
    .clahe({ width: 96, height: 96, maxSlope: 2 })
    .sharpen({ sigma: 1.1, m1: 0.5, m2: 2.4, x1: 2, y2: 10, y3: 20 })
    .toBuffer();
  const { width, height } = await sharp(base).metadata();
  // hạt mịn (overlay) — nhẹ để không thấy nhiễu, chỉ tạo cảm giác chi tiết
  const noise = await sharp({ create: { width, height, channels: 3, background: "#808080", noise: { type: "gaussian", mean: 128, sigma: 14 } } }).png().toBuffer();
  let graded = base;
  if (focus) {
    const { width: w, height: h } = await sharp(base).metadata();
    // nền: tối hơn, nhạt màu hơn một chút
    const bg = await sharp(base).modulate({ brightness: 0.8, saturation: 0.82 }).toBuffer();
    // người: sáng hơn, rực hơn, tương phản và nét hơn
    const subj = await sharp(base).modulate({ brightness: 1.07, saturation: 1.12 }).linear(1.1, -8).sharpen({ sigma: 1.4, m1: 0.8, m2: 3 }).toBuffer();
    // mặt nạ hình elip làm mờ mép
    const blurPx = Math.round(Math.min(focus.rx * w, focus.ry * h) * 0.55);
    const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><defs><filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${blurPx}"/></filter></defs><rect width="100%" height="100%" fill="#000"/><ellipse cx="${focus.cx * w}" cy="${focus.cy * h}" rx="${focus.rx * w}" ry="${focus.ry * h}" fill="#fff" filter="url(#b)"/></svg>`;
    const mask = await sharp(Buffer.from(svg)).greyscale().raw().toBuffer({ resolveWithObject: true });
    const subjA = await sharp(subj).joinChannel(mask.data, { raw: { width: w, height: h, channels: 1 } }).png().toBuffer();
    graded = await sharp(bg).composite([{ input: subjA }]).png().toBuffer();
  }
  return sharp(graded).composite([{ input: noise, blend: "overlay" }]).jpeg({ quality: 86, mozjpeg: true, chromaSubsampling: "4:4:4" }).toBuffer();
}
(async () => {
  const preview = process.argv[2] === "preview";
  const v = Date.now(), mapPath = path.join(root, "lib", "images.json");
  const map = JSON.parse(fs.readFileSync(mapPath, "utf8"));
  for (const [name, opt] of jobs) {
    const buf = await make(name, opt);
    if (preview) { fs.writeFileSync(path.join(process.env.TMPDIR, `h-${name}.jpg`), buf); continue; }
    fs.writeFileSync(path.join(out, `w-${name}.jpg`), buf);
    map[name] = `/products/w-${name}.jpg?v=${v}`;
  }
  if (!preview) fs.writeFileSync(mapPath, JSON.stringify(map, null, 1));
  console.log("xong");
})();

// Banner lớn từ ảnh mẫu (scripts/reference/banners/*.img, gốc 740px): phóng 2 lần + làm nét + hạt mịn → public/products/w-ban-<tên>.jpg và lib/images.json
// Chạy: node scripts/make-banner-slides.js [preview]
const sharp = require("sharp");
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const out = path.join(root, "public", "products");
const SRC = (n) => path.join(__dirname, "reference", "banners", `${n}.img`);
const jobs = [
  ["sports-equipment-sale", {}], ["sports-gear-sale", {}], ["new-year-new-you", {}],
  // ảnh có khung sáng xung quanh: cắt sát vào bảng quảng cáo
  ["unleash-potential", { crop: { left: 48, top: 88, width: 644, height: 238 } }],
];
(async () => {
  const preview = process.argv[2] === "preview";
  const v = Date.now(), mapPath = path.join(root, "lib", "images.json");
  const map = JSON.parse(fs.readFileSync(mapPath, "utf8"));
  for (const [name, { crop }] of jobs) {
    let img = sharp(SRC(name));
    if (crop) img = img.extract(crop);
    const meta = await img.clone().metadata();
    const w = (crop ? crop.width : meta.width) * 2.4 | 0;
    const base = await img.resize({ width: w, kernel: "lanczos3" }).sharpen({ sigma: 1.0, m1: 0.5, m2: 2.2, x1: 2, y2: 10, y3: 20 }).toBuffer();
    const { width, height } = await sharp(base).metadata();
    const noise = await sharp({ create: { width, height, channels: 3, background: "#808080", noise: { type: "gaussian", mean: 128, sigma: 10 } } }).png().toBuffer();
    const buf = await sharp(base).composite([{ input: noise, blend: "overlay" }]).jpeg({ quality: 88, mozjpeg: true, chromaSubsampling: "4:4:4" }).toBuffer();
    if (preview) { fs.writeFileSync(path.join(process.env.TMPDIR, `bn-${name}.jpg`), buf); continue; }
    fs.writeFileSync(path.join(out, `w-ban-${name}.jpg`), buf);
    map[`ban-${name}`] = `/products/w-ban-${name}.jpg?v=${v}`;
  }
  if (!preview) fs.writeFileSync(mapPath, JSON.stringify(map, null, 1));
  console.log("xong");
})();

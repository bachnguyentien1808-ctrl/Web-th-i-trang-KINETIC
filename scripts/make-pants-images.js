// 4 sản phẩm quần/bộ đồ từ scripts/reference/pants-*.* → public/products/p-pt-<khoá>.jpg (+ t-) và lib/images.json
// Chạy: node scripts/make-pants-images.js
const sharp = require("sharp");
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const out = path.join(root, "public", "products");
const W = 1200, H = 1500;
// [khoá, file, vùng cắt (bỏ logo/viền thừa), tỉ lệ chiếm khung]
const jobs = [
  ["pt-genstex", "pants-15.png", { left: 0, top: 45, width: 400, height: 355 }, 0.96],
  ["pt-fox-bw", "pants-16.png", null, 0.96],
  ["pt-fox-sand", "pants-17.png", null, 0.96],
  ["pt-cycling-set", "pants-18.webp", null, 0.92],
];
(async () => {
  const v = Date.now();
  const map = JSON.parse(fs.readFileSync(path.join(root, "lib", "images.json"), "utf8"));
  for (const [key, file, crop, scale] of jobs) {
    let img = sharp(path.join(__dirname, "reference", file)).flatten({ background: "#fff" });
    if (crop) img = img.extract(crop);
    const buf = await img.toBuffer();
    const body = await sharp(buf).resize({ width: Math.round(W * scale), height: Math.round(H * scale), fit: "inside", kernel: "lanczos3" }).sharpen({ sigma: 0.8 }).toBuffer();
    const { width, height } = await sharp(body).metadata();
    const top = Math.floor((H - height) / 2), left = Math.floor((W - width) / 2);
    const full = await sharp(body).extend({ top, bottom: H - height - top, left, right: W - width - left, background: "#fff" }).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
    fs.writeFileSync(path.join(out, `p-${key}.jpg`), full);
    fs.writeFileSync(path.join(out, `t-${key}.jpg`), await sharp(full).resize(720, 900).jpeg({ quality: 80, progressive: true }).toBuffer());
    map[`p-${key}`] = `/products/p-${key}.jpg?v=${v}`;
  }
  fs.writeFileSync(path.join(root, "lib", "images.json"), JSON.stringify(map, null, 1));
  console.log("xong");
})();

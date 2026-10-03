// 3 áo khoác đua từ scripts/reference/jacket-*.png → public/products/p-jk-<khoá>.jpg (+ t-) và lib/images.json
// Chạy: node scripts/make-jacket-images.js
const sharp = require("sharp");
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const out = path.join(root, "public", "products");
const W = 1200, H = 1500;
const jobs = { "jk-harsh": "jacket-harsh.png", "jk-jd": "jacket-jd.png", "jk-harley": "jacket-harley.png" };
(async () => {
  const v = Date.now();
  const map = JSON.parse(fs.readFileSync(path.join(root, "lib", "images.json"), "utf8"));
  for (const [key, file] of Object.entries(jobs)) {
    const buf = await sharp(path.join(__dirname, "reference", file)).flatten({ background: "#fff" }).toBuffer();
    const px = await sharp(buf).extract({ left: 3, top: 3, width: 1, height: 1 }).raw().toBuffer();
    const body = await sharp(buf).resize(Math.round(W * 0.92), null, { kernel: "lanczos3" }).sharpen({ sigma: 0.8 }).toBuffer();
    const { width, height } = await sharp(body).metadata();
    const top = Math.floor((H - height) / 2), left = Math.floor((W - width) / 2);
    const full = await sharp(body).extend({ top, bottom: H - height - top, left, right: W - width - left, background: { r: px[0], g: px[1], b: px[2] } }).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
    fs.writeFileSync(path.join(out, `p-${key}.jpg`), full);
    fs.writeFileSync(path.join(out, `t-${key}.jpg`), await sharp(full).resize(720, 900).jpeg({ quality: 80, progressive: true }).toBuffer());
    map[`p-${key}`] = `/products/p-${key}.jpg?v=${v}`;
  }
  fs.writeFileSync(path.join(root, "lib", "images.json"), JSON.stringify(map, null, 1));
  console.log("xong");
})();

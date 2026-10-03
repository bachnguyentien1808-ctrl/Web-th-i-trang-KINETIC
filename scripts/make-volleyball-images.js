// Cắt 7 áo bóng chuyền Lucky từ scripts/reference/volleyball-lucky.webp → public/products/p-tee-black-<màu>.jpg (+ t-) và cập nhật lib/images.json
// Chạy: node scripts/make-volleyball-images.js
const sharp = require("sharp");
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const SRC = path.join(__dirname, "reference", "volleyball-lucky.webp");
const out = path.join(root, "public", "products");
// khoá màu cũ → tâm x của áo trong ảnh mẫu
const jerseys = { teal: 75, brown: 215, navy: 355, burgundy: 495, plum: 635, olive: 775, forest: 915 };
const W = 140, H = 175, TOP = 272;
(async () => {
  const v = Date.now();
  const map = JSON.parse(fs.readFileSync(path.join(root, "lib", "images.json"), "utf8"));
  for (const [color, cx] of Object.entries(jerseys)) {
    const left = Math.max(0, Math.min(1000 - W, cx - W / 2));
    const full = await sharp(SRC).extract({ left, top: TOP, width: W, height: H }).resize(1200, 1500, { kernel: "lanczos3" }).sharpen({ sigma: 1.2 }).jpeg({ quality: 88, mozjpeg: true }).toBuffer();
    fs.writeFileSync(path.join(out, `p-tee-black-${color}.jpg`), full);
    fs.writeFileSync(path.join(out, `t-tee-black-${color}.jpg`), await sharp(full).resize(720, 900).jpeg({ quality: 80, progressive: true }).toBuffer());
    map[`p-tee-black-${color}`] = `/products/p-tee-black-${color}.jpg?v=${v}`;
  }
  fs.writeFileSync(path.join(root, "lib", "images.json"), JSON.stringify(map, null, 1));
  console.log("xong");
})();

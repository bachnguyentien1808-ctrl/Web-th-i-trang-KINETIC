// 2 mẫu polo đua xe từ scripts/reference/polo-*.* → public/products/p-polo-gazoo.jpg, p-polo-ferrari.jpg (+ t-) và lib/images.json
// Chạy: node scripts/make-polo-images.js
const sharp = require("sharp");
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const ref = (f) => path.join(__dirname, "reference", f);
const out = path.join(root, "public", "products");
const W = 1200, H = 1500;
const jobs = {
  // ảnh vuông có nền chuyển sắc: cắt dọc về khổ 4:5
  "polo-gazoo": () => sharp(ref("polo-gazoo.webp")).extract({ left: 90, top: 0, width: 819, height: 1024 }).resize(W, H, { kernel: "lanczos3" }).jpeg({ quality: 90, mozjpeg: true }).toBuffer(),
  // ảnh nền trắng: đặt vào khung 4:5
  "polo-ferrari": async () => {
    const buf = await sharp(ref("polo-ferrari.png")).flatten({ background: "#fff" }).toBuffer();
    const body = await sharp(buf).resize(W, null, { kernel: "lanczos3" }).toBuffer();
    const h = (await sharp(body).metadata()).height, top = Math.floor((H - h) / 2);
    return sharp(body).extend({ top, bottom: H - h - top, background: "#fff" }).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
  },
};
(async () => {
  const v = Date.now();
  const map = JSON.parse(fs.readFileSync(path.join(root, "lib", "images.json"), "utf8"));
  for (const [key, make] of Object.entries(jobs)) {
    const full = await make();
    fs.writeFileSync(path.join(out, `p-${key}.jpg`), full);
    fs.writeFileSync(path.join(out, `t-${key}.jpg`), await sharp(full).resize(720, 900).jpeg({ quality: 80, progressive: true }).toBuffer());
    map[`p-${key}`] = `/products/p-${key}.jpg?v=${v}`;
  }
  fs.writeFileSync(path.join(root, "lib", "images.json"), JSON.stringify(map, null, 1));
  console.log("xong");
})();

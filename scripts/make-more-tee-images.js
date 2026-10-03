// Thêm 4 mẫu áo thun/jersey từ scripts/reference → public/products/p-tee-<khoá>.jpg (+ t-) và lib/images.json
// Chạy: node scripts/make-more-tee-images.js
const sharp = require("sharp");
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const ref = (f) => path.join(__dirname, "reference", f);
const out = path.join(root, "public", "products");
const W = 1200, H = 1500;
const bgOf = async (buf) => { const p = await sharp(buf).extract({ left: 3, top: 3, width: 1, height: 1 }).removeAlpha().raw().toBuffer(); return { r: p[0], g: p[1], b: p[2] }; };
// ảnh vuông/ngang: đặt vào khung 4:5, phần thừa lấp bằng màu nền
const fit = async (file) => {
  const buf = await sharp(ref(file)).flatten({ background: "#fff" }).toBuffer();
  const background = await bgOf(buf);
  const body = await sharp(buf).resize(W, null, { kernel: "lanczos3" }).toBuffer();
  const h = (await sharp(body).metadata()).height, top = Math.floor((H - h) / 2);
  return sharp(body).extend({ top, bottom: H - h - top, background }).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
};
const jobs = {
  "tee-cycling": () => sharp(ref("tee-cycling-dny.png")).extract({ left: 152, top: 105, width: 396, height: 495 }).resize(W, H, { kernel: "lanczos3" }).sharpen({ sigma: 0.8 }).jpeg({ quality: 90, mozjpeg: true }).toBuffer(),
  "tee-model-red": () => sharp(ref("tee-model-red.webp")).extract({ left: 0, top: 0, width: 1505, height: 1881 }).resize(W, H, { kernel: "lanczos3" }).jpeg({ quality: 90, mozjpeg: true }).toBuffer(),
  "tee-aston-green": () => fit("tee-aston-green.webp"),
  "tee-merc-black": () => fit("tee-merc-black.png"),
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

// Ảnh mũ cũ bị kéo giãn mờ ở phần trên/dưới: cắt đúng vùng nét và lấp phần thừa bằng màu nền phẳng.
// Ảnh gốc (đã sao lưu ở scripts/backup-cap/). Chạy: node scripts/fix-cap-images.js
const sharp = require("sharp");
const fs = require("fs"), path = require("path");
const out = path.join(__dirname, "..", "public", "products");
const src = path.join(__dirname, "backup-cap");
const BAND = { top: 385, bottom: 1112 }, W = 1200, H = 1500;
(async () => {
  for (const f of fs.readdirSync(src).filter((x) => /^p-cap.*\.jpg$/.test(x))) {
    const band = await sharp(path.join(src, f)).extract({ left: 0, top: BAND.top, width: W, height: BAND.bottom - BAND.top + 1 }).toBuffer();
    const px = await sharp(band).extract({ left: 4, top: 8, width: 24, height: 24 }).resize(1, 1).raw().toBuffer(); // nền của vùng nét
    const bg = { r: px[0], g: px[1], b: px[2] };
    const h = BAND.bottom - BAND.top + 1, top = Math.floor((H - h) / 2);
    const full = await sharp(band).extend({ top, bottom: H - h - top, background: bg }).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
    fs.writeFileSync(path.join(out, f), full);
    fs.writeFileSync(path.join(out, f.replace("p-", "t-")), await sharp(full).resize(720, 900).jpeg({ quality: 80, progressive: true }).toBuffer());
  }
  console.log("xong");
})();

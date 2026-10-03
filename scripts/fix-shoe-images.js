// Ảnh giày cũ bị kéo giãn thành các sọc mờ ở phần trên/dưới: giữ vùng nét, dựng lại nền bằng ảnh lật gương làm mờ.
// Ảnh gốc đã sao lưu ở scripts/backup-shoes/. Chạy: node scripts/fix-shoe-images.js
const sharp = require("sharp");
const fs = require("fs"), path = require("path");
const out = path.join(__dirname, "..", "public", "products");
const src = path.join(__dirname, "backup-shoes");
const W = 1200, H = 1500, MARGIN = 6;
async function band(file) {
  const { data, info } = await sharp(file).greyscale().raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height, rv = [];
  for (let y = 1; y < h; y++) { let a = 0; for (let x = 1; x < w; x++) a += Math.abs(data[y * w + x] - data[y * w + x - 1]) + Math.abs(data[y * w + x] - data[(y - 1) * w + x]); rv.push(a / w); }
  return [rv.findIndex((v) => v > 3), rv.length - 1 - [...rv].reverse().findIndex((v) => v > 3)];
}
(async () => {
  for (const f of fs.readdirSync(src).filter((x) => /^p-shoe-.*\.jpg$/.test(x))) {
    const file = path.join(src, f);
    let [y0, y1] = await band(file);
    y0 += MARGIN; y1 -= MARGIN;
    const h = y1 - y0 + 1;
    if (h > H * 0.8) { console.log("bỏ qua", f); continue; }
    const mid = await sharp(file).extract({ left: 0, top: y0, width: W, height: h }).toBuffer();
    const top = Math.floor((H - h) / 2), bottom = H - h - top;
    // nền trên/dưới = màu trung bình của mép vùng nét (phẳng), rồi chồng vùng nét lên với mép mờ dần
    const avg = async (from) => { const p = await sharp(mid).extract({ left: 0, top: from, width: W, height: 8 }).resize(1, 1).raw().toBuffer(); return { r: p[0], g: p[1], b: p[2] }; };
    const [ct, cb] = [await avg(0), await avg(h - 8)];
    const topArea = await sharp({ create: { width: W, height: top, channels: 3, background: ct } }).jpeg().toBuffer();
    const botArea = await sharp({ create: { width: W, height: bottom, channels: 3, background: cb } }).jpeg().toBuffer();
    const canvas = await sharp({ create: { width: W, height: H, channels: 3, background: "#888" } }).composite([{ input: topArea, left: 0, top: 0 }, { input: mid, left: 0, top }, { input: botArea, left: 0, top: top + h }]).jpeg({ quality: 95 }).toBuffer();
    const soft = await sharp(canvas).blur(2).toBuffer();
    const feather = 140;
    const mask = Buffer.alloc(W * H);
    for (let y = 0; y < H; y++) { const d = Math.min(y - top, top + h - 1 - y); const a = d < 0 ? 0 : Math.min(1, d / feather); mask.fill(Math.round(a * 255), y * W, (y + 1) * W); }
    const sharpPart = await sharp(canvas).joinChannel(mask, { raw: { width: W, height: H, channels: 1 } }).png().toBuffer();
    const full = await sharp(soft).composite([{ input: sharpPart }]).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
    fs.writeFileSync(path.join(out, f), full);
    fs.writeFileSync(path.join(out, f.replace("p-", "t-")), await sharp(full).resize(720, 900).jpeg({ quality: 80, progressive: true }).toBuffer());
  }
  console.log("xong");
})();

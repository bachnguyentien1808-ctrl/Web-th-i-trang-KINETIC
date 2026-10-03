// Áo thun F1 xám (scripts/reference/tee-puma-f1.webp) → ảnh áo gốc p-tee-black + 7 màu p-tee-black-<màu> (đổi màu thân áo, giữ nguyên logo)
// Chạy: node scripts/make-f1-tee-images.js
const sharp = require("sharp");
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const SRC = path.join(__dirname, "reference", "tee-puma-f1.webp");
const out = path.join(root, "public", "products");
const colors = { navy: [47, 75, 143], olive: [122, 138, 58], burgundy: [163, 50, 63], teal: [42, 157, 154], forest: [47, 143, 85], plum: [138, 74, 160], brown: [168, 105, 58] };
const clamp = (x) => Math.max(0, Math.min(1, x));
const SIZE = 1200;
async function frame(buf) {
  const bg = (await sharp(buf).extract({ left: 2, top: 2, width: 1, height: 1 }).raw().toBuffer());
  const background = { r: bg[0], g: bg[1], b: bg[2] };
  return sharp(buf).resize(SIZE, SIZE, { kernel: "lanczos3" }).extend({ top: 150, bottom: 150, background }).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
}
async function recolor(rgb) {
  const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const o = Buffer.from(data);
  for (let i = 0; i < data.length; i += 3) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), lum = (r + g + b) / 3;
    const sat = mx ? (mx - mn) / mx : 0;
    // chỉ nhuộm vùng vải xám: không phải nền trắng, không phải logo đỏ/vàng/đen
    const w = clamp((243 - lum) / 15) * clamp((lum - 120) / 40) * clamp(1 - (sat - 0.05) / 0.08);
    if (w <= 0) continue;
    const k = lum / 205;
    for (let c = 0; c < 3; c++) o[i + c] = Math.round(data[i + c] * (1 - w) + Math.min(255, rgb[c] * k) * w);
  }
  return sharp(o, { raw: info }).png().toBuffer();
}
(async () => {
  const v = Date.now();
  const map = JSON.parse(fs.readFileSync(path.join(root, "lib", "images.json"), "utf8"));
  const jobs = { "": await sharp(SRC).png().toBuffer() };
  for (const [name, rgb] of Object.entries(colors)) jobs["-" + name] = await recolor(rgb);
  for (const [suffix, buf] of Object.entries(jobs)) {
    const full = await frame(buf);
    fs.writeFileSync(path.join(out, `p-tee-black${suffix}.jpg`), full);
    fs.writeFileSync(path.join(out, `t-tee-black${suffix}.jpg`), await sharp(full).resize(720, 900).jpeg({ quality: 80, progressive: true }).toBuffer());
    map[`p-tee-black${suffix}`] = `/products/p-tee-black${suffix}.jpg?v=${v}`;
    if (!suffix) map.fleece = map["p-tee-black"];
  }
  fs.writeFileSync(path.join(root, "lib", "images.json"), JSON.stringify(map, null, 1));
  console.log("xong");
})();

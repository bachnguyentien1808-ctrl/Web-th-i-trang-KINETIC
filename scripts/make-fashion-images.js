// Tách ảnh thời trang từ bảng mẫu scripts/reference/fashion-sheet.webp:
//  - ảnh từng sản phẩm (chia ô đều trong từng dải) → public/products/p-f-<danh-mục>-<n>.jpg (4:5) và t-... (thu nhỏ)
//  - ảnh danh mục lớn (4 ô đầu, 8 ảnh giá treo, bộ sưu tập phụ kiện) → public/products/c-<tên>.jpg
// Chạy: node scripts/make-fashion-images.js
const sharp = require("sharp");
const fs = require("fs"), path = require("path");
const SRC = path.join(__dirname, "reference", "fashion-sheet.webp");
const out = path.join(__dirname, "..", "public", "products");
fs.mkdirSync(out, { recursive: true });

// [danh mục, left, top, width, height, số cột, số hàng]
const strips = [
  ["ao-nam", 12, 608, 285, 72, 5, 1], ["quan-nam", 322, 608, 290, 72, 6, 1], ["ao-nu", 636, 608, 295, 72, 5, 1], ["quan-nu", 952, 608, 295, 72, 6, 1],
  ["vay-nu", 12, 885, 290, 95, 5, 1], ["ao-khoac", 322, 885, 290, 95, 5, 1], ["giay-nam", 636, 925, 295, 55, 5, 1], ["giay-nu", 952, 925, 295, 55, 6, 1],
  ["dong-ho", 936, 1046, 142, 140, 3, 2],
];
// phụ kiện nằm chồng nhau trong ảnh mẫu nên cắt thủ công: [danh mục, gốc x, gốc y, [[x, y, w, h], ...]]
const manual = [
  ["mu", 555, 1042, [[10, 10, 54, 44], [62, 10, 54, 40], [108, 2, 46, 42], [56, 44, 50, 46], [102, 42, 58, 46], [6, 54, 56, 48], [34, 88, 60, 52], [90, 86, 60, 56]]],
  ["that-lung-vi", 745, 1042, [[2, 4, 86, 58], [64, 4, 66, 56], [0, 54, 62, 48], [0, 88, 74, 54], [72, 62, 88, 76]]],
  ["tui-xach", 328, 1042, [[2, 2, 74, 72], [90, 50, 58, 50], [144, 12, 62, 78], [24, 60, 60, 80], [92, 86, 46, 58], [144, 56, 56, 76]]],
];
// ảnh danh mục lớn [tên, left, top, width, height]
const scenes = [
  ["nam", 0, 0, 306, 396], ["nu", 313, 0, 308, 396], ["giay-dep", 628, 0, 310, 396], ["phu-kien", 947, 0, 307, 396],
  ["ao-nam", 12, 455, 288, 146], ["quan-nam", 325, 455, 286, 146], ["ao-nu", 640, 455, 288, 146], ["quan-nu", 955, 455, 290, 146],
  ["vay-nu", 12, 744, 288, 134], ["ao-khoac", 322, 744, 290, 134], ["giay-nam", 635, 744, 298, 178], ["giay-nu", 952, 744, 296, 178],
  ["tui-xach", 328, 1042, 208, 146], ["mu", 555, 1042, 170, 146], ["that-lung-vi", 745, 1042, 168, 146], ["dong-ho", 932, 1042, 148, 146], ["trang-suc", 1095, 1042, 148, 146],
];

(async () => {
  const meta = {};
  for (const [cat, l, t, w, h, cols, rows] of strips) {
    const cw = w / cols, ch = h / rows; meta[cat] = 0;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const pad = 2;
      const box = { left: Math.round(l + c * cw + pad), top: Math.round(t + r * ch + pad), width: Math.round(cw - 2 * pad), height: Math.round(ch - 2 * pad) };
      const n = r * cols + c + 1;
      // đưa về khổ 4:5, nền trắng, phóng to mịn
      const cell = await sharp(SRC).extract(box).resize(560, 700, { fit: "contain", background: "#f7f7f7", kernel: "lanczos3" }).sharpen({ sigma: 0.9 }).toBuffer();
      const full = await sharp(cell).resize(640, 800, { kernel: "lanczos3" }).jpeg({ quality: 88 }).toBuffer();
      fs.writeFileSync(path.join(out, `p-f-${cat}-${n}.jpg`), full);
      fs.writeFileSync(path.join(out, `t-f-${cat}-${n}.jpg`), await sharp(full).resize(320, 400).jpeg({ quality: 80, progressive: true }).toBuffer());
      meta[cat] = n;
    }
  }
  // cắt thủ công
  for (const [cat, ox, oy, boxes] of manual) {
    meta[cat] = 0;
    for (let i = 0; i < boxes.length; i++) {
      const [x, y, w, h] = boxes[i];
      const cell = await sharp(SRC).extract({ left: ox + x, top: oy + y, width: w, height: h }).resize(560, 700, { fit: "contain", background: "#eeebe7", kernel: "lanczos3" }).sharpen({ sigma: 0.9 }).toBuffer();
      const full = await sharp(cell).resize(640, 800, { kernel: "lanczos3" }).jpeg({ quality: 88 }).toBuffer();
      fs.writeFileSync(path.join(out, `p-f-${cat}-${i + 1}.jpg`), full);
      fs.writeFileSync(path.join(out, `t-f-${cat}-${i + 1}.jpg`), await sharp(full).resize(320, 400).jpeg({ quality: 80, progressive: true }).toBuffer());
      meta[cat] = i + 1;
    }
  }
  for (const [name, l, t, w, h] of scenes) {
    const buf = await sharp(SRC).extract({ left: l, top: t, width: w, height: h }).resize({ width: w * 3, kernel: "lanczos3" }).sharpen({ sigma: 1 }).jpeg({ quality: 88 }).toBuffer();
    fs.writeFileSync(path.join(out, `c-${name}.jpg`), buf);
  }
  console.log("số ảnh sản phẩm theo danh mục:", JSON.stringify(meta));
})();

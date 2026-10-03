// Tạo ảnh sản phẩm từ ảnh gốc trong thiết kế: cắt bỏ phần giao diện web, đổi màu để tạo các phiên bản,
// xuất ảnh khổ 4:5 (nền mờ tự động) vào public/products và cập nhật lib/images.json.
// Cần: node, sharp, curl. Chạy: node scripts/make-product-images.js
const sharp = require("sharp");
const fs = require("fs"), path = require("path"), { execSync } = require("child_process");

const root = path.join(__dirname, "..");
const SRC = require("./source-images.json");
const hiDir = process.env.HI_DIR || path.join(process.env.TMPDIR || "/tmp", "hi");
const outDir = path.join(root, "public", "products");
fs.mkdirSync(hiDir, { recursive: true }); fs.mkdirSync(outDir, { recursive: true });

for (const k of Object.keys(SRC)) {
  const f = path.join(hiDir, k + ".jpg");
  if (!fs.existsSync(f)) execSync(`curl -s -m 60 -o "${f}" "${SRC[k]}=w1600"`);
}
const load = (k) => fs.readFileSync(path.join(hiDir, k + ".jpg"));

// khung cắt theo tỉ lệ [x0, y0, x1, y1] của ảnh gốc
const frac = (buf, [x0, y0, x1, y1]) => sharp(buf).metadata().then((m) => sharp(buf).extract({
  left: Math.round(x0 * m.width), top: Math.round(y0 * m.height), width: Math.round((x1 - x0) * m.width), height: Math.round((y1 - y0) * m.height),
}).toBuffer());
// cắt sát sản phẩm trên nền đồng nhất, chừa lề
async function trim(buf, margin = 0.12) {
  const { info } = await sharp(buf).trim({ threshold: 22 }).toBuffer({ resolveWithObject: true });
  const m = await sharp(buf).metadata();
  const l = -info.trimOffsetLeft, t = -info.trimOffsetTop, mx = Math.round(info.width * margin), my = Math.round(info.height * margin);
  const left = Math.max(0, l - mx), top = Math.max(0, t - my);
  return sharp(buf).extract({ left, top, width: Math.min(m.width - left, info.width + 2 * mx), height: Math.min(m.height - top, info.height + 2 * my) }).toBuffer();
}
// ảnh gốc 1408x768 là 512x279 nhân 2,75: khung theo toạ độ 512
const px512 = (buf, [l, t, w, h]) => sharp(buf).extract({ left: Math.round(l * 2.75), top: Math.round(t * 2.75), width: Math.round(w * 2.75), height: Math.round(h * 2.75) }).toBuffer();

// màu trung bình của một dải biên (trên hoặc dưới) của ảnh
async function edgeColor(buf, top) {
  const m = await sharp(buf).metadata();
  const h = Math.max(2, Math.round(m.height * 0.04));
  const { data } = await sharp(buf).extract({ left: 0, top: top ? 0 : m.height - h, width: m.width, height: h }).resize(1, 1).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return [data[0], data[1], data[2]];
}
// khổ 4:5. mode "studio": nền chuyển sắc theo màu biên trên/dưới (ảnh chụp phông nền trơn);
// mode "blur": nền là bản mờ của chính ảnh (ảnh chụp ngoài trời / có chi tiết)
// Phóng gấp đôi bằng lanczos, làm nét (unsharp), rồi thu về kích thước đích: chữ và đường may sắc hơn hẳn so với phóng to một bước.
async function crisp(buf, w, h, fit) {
  const m = await sharp(buf).metadata();
  const up = await sharp(buf).resize({ width: m.width * 2, kernel: "lanczos3" }).sharpen({ sigma: 1.0, m1: 1.5, m2: 3.5, x1: 2, y2: 12, y3: 22 }).sharpen({ sigma: 5, m1: 0.5, m2: 0.5 }).toBuffer(); // chi tiết nhỏ + chút tương phản cục bộ (không để lại viền sáng)
  return sharp(up).resize(w, h, { fit, position: "centre", kernel: "lanczos3" }).sharpen({ sigma: 0.8, m1: 0.9, m2: 2.2 }).linear(1.04, -5).toBuffer({ resolveWithObject: true });
}
async function fit45(buf, w = 1200, h = 1500, mode = "edge") {
  const S = w / 800; // các hằng số bên dưới được thiết kế cho khổ 800 và nhân theo tỉ lệ
  if (mode !== "blur") {
    const m0 = await sharp(buf).metadata(), ratio = (m0.width / m0.height) / (w / h);
    if (ratio > 0.84 && ratio < 1.18) { // gần khổ 4:5: giữ nguyên tỉ lệ ảnh, không nới nền, không cắt (khung thẻ tự căn giữa)
      const tw = Math.min(w, Math.round(m0.width * 1.5)), th = Math.round((tw * m0.height) / m0.width);
      const { data } = await crisp(buf, tw, th, "fill");
      return sharp(data).jpeg({ quality: 93, chromaSubsampling: "4:4:4" }).toBuffer();
    }
  }
  if (mode === "blur") {
    const fg = await sharp(buf).resize(w, h, { fit: "inside" }).toBuffer();
    const bg = await sharp(buf).resize(w, h, { fit: "cover" }).blur(30 * S).toBuffer();
    return sharp(bg).composite([{ input: fg, gravity: "center" }]).jpeg({ quality: 88 }).toBuffer();
  }
  // "edge": mở rộng nền bằng đúng màu của vài dòng pixel ngoài cùng của ảnh (chỉ chứa nền, không lẫn sản phẩm),
  // làm mờ nhẹ rồi đặt ảnh sắc nét lên giữa với viền mờ dần → không lộ khung hình chữ nhật, không có vệt.
  const { data, info } = await crisp(buf, w, h, "inside");
  const fw = info.width, fh = info.height, dx = w - fw, dy = h - fh;
  const left = Math.floor(dx / 2), top = Math.floor(dy / 2);
  const N = 24, T = Math.max(3, Math.round(3 * S));
  const strip = async (box, rw, rh) => {
    const { data: px } = await sharp(data).extract(box).resize(rw, rh, { fit: "fill" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const out = []; for (let i = 0; i < px.length; i += 3) out.push([px[i], px[i + 1], px[i + 2]]); return out;
  };
  const top_ = await strip({ left: 0, top: 0, width: fw, height: T }, N, 1);
  const bot_ = await strip({ left: 0, top: fh - T, width: fw, height: T }, N, 1);
  const lef_ = await strip({ left: 0, top: 0, width: T, height: fh }, 1, N);
  const rig_ = await strip({ left: fw - T, top: 0, width: T, height: fh }, 1, N);
  const at = (arr, t) => { const p = Math.max(0, Math.min(1, t)) * (arr.length - 1), i = Math.floor(p), f = p - i, c = arr[i], d = arr[Math.min(arr.length - 1, i + 1)]; return [c[0] + (d[0] - c[0]) * f, c[1] + (d[1] - c[1]) * f, c[2] + (d[2] - c[2]) * f]; };
  const { data: fgRaw } = await sharp(data).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const raw = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const cx = Math.max(left, Math.min(left + fw - 1, x)), cy = Math.max(top, Math.min(top + fh - 1, y));
    const inside = x >= left && x < left + fw && y >= top && y < top + fh;
    if (inside) { const j = ((y - top) * fw + (x - left)) * 3, i2 = (y * w + x) * 3; raw[i2] = fgRaw[j]; raw[i2 + 1] = fgRaw[j + 1]; raw[i2 + 2] = fgRaw[j + 2]; continue; }
    let c;
    if (y < top) c = at(top_, (cx - left) / fw); else if (y >= top + fh) c = at(bot_, (cx - left) / fw);
    else if (x < left) c = at(lef_, (cy - top) / fh); else c = at(rig_, (cy - top) / fh);
    const i = (y * w + x) * 3; raw[i] = c[0]; raw[i + 1] = c[1]; raw[i + 2] = c[2];
  }
  const bg = await sharp(raw, { raw: { width: w, height: h, channels: 3 } }).blur(Math.round(45 * S)).png().toBuffer();
  const F = Math.round(70 * S), mask = Buffer.alloc(fw * fh);
  for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) {
    const fx = dx > 0 ? Math.min(x, fw - 1 - x) : 1e9, fy = dy > 0 ? Math.min(y, fh - 1 - y) : 1e9;
    mask[y * fw + x] = Math.round(255 * Math.min(1, Math.min(fx, fy) / F));
  }
  const fg = await sharp(data).ensureAlpha().composite([{ input: await sharp(mask, { raw: { width: fw, height: fh, channels: 1 } }).png().toBuffer(), blend: "dest-in" }]).png().toBuffer();
  return sharp(bg).composite([{ input: fg, left, top }]).jpeg({ quality: 93, chromaSubsampling: "4:4:4" }).toBuffer();
}
const hue = (buf, h) => sharp(buf).modulate({ hue: h }).toBuffer();
// nhuộm màu cho vải tối (đen) mà giữ nguyên vùng sáng/nền trắng
async function tintDark(buf, [tr, tg, tb], thr = 150) {
  const { data, info } = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 3) {
    const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
    const w = Math.max(0, Math.min(1, (thr - lum) / thr)); // càng tối càng đổi màu nhiều
    const shade = 0.55 + 0.9 * Math.min(1, lum / 110);
    data[i] = data[i] * (1 - w) + Math.min(255, tr * shade) * w;
    data[i + 1] = data[i + 1] * (1 - w) + Math.min(255, tg * shade) * w;
    data[i + 2] = data[i + 2] * (1 - w) + Math.min(255, tb * shade) * w;
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 3 } }).modulate({ saturation: 1.22 }).jpeg({ quality: 94, chromaSubsampling: "4:4:4" }).toBuffer();
}

(async () => {
  const base = {};
  base["jacket-mint"] = await frac(load("jacket-mint"), [0.08, 0.04, 0.92, 0.96]);
  base["tee-volt"] = await trim(load("tee-volt"));
  base["puffer"] = await frac(load("puffer"), [0.28, 0.14, 0.70, 0.97]);
  base["jacket-thermo"] = await frac(load("jacket-thermo"), [0.2, 0, 0.68, 1]);
  base["windbreaker"] = await trim(load("windbreaker"));
  base["softshell"] = await trim(load("pants"));
  base["vest"] = await frac(load("shoe-winter"), [0.28, 0, 0.66, 1]);
  base["tee-black"] = await frac(load("fleece"), [0.1, 0.05, 0.9, 0.95]);
  base["polo"] = await trim(load("polo"));
  base["shoe-trail"] = await px512(load("shoe-trail"), [38, 34, 436, 200]);
  {
    // xoá dòng chữ "Audi Sport" trên tường: chép một mảng tường sạch ngay bên dưới lên che
    const src = load("sneaker-summer"), m = await sharp(src).metadata();
    const rx = Math.round(0.62 * m.width), rw = Math.round(0.37 * m.width), rh = Math.round(0.13 * m.height);
    const patch = await sharp(src).extract({ left: rx, top: Math.round(0.2 * m.height), width: rw, height: rh }).blur(6).toBuffer();
    const cleaned = await sharp(src).composite([{ input: patch, left: rx, top: Math.round(0.06 * m.height) }]).jpeg({ quality: 95 }).toBuffer();
    base["shoe-airflow"] = await frac(cleaned, [0.12, 0.05, 0.92, 0.95]);
  }
  base["speedcat"] = await trim(load("speedcat"));
  base["pants-front"] = await px512(load("shorts"), [0, 40, 184, 232]);
  base["pants-back"] = await px512(load("shorts"), [352, 42, 154, 230]);
  base["bag"] = load("bag-front");
  base["bag-model"] = load("bag-model");
  base["bag-back"] = await trim(load("bag-back"));
  base["bag-laptop"] = await px512(load("bag-laptop"), [84, 48, 364, 222]);
  base["bag-buckle"] = await px512(load("bag-buckle"), [105, 55, 383, 195]);
  base["cap"] = await px512(load("cap"), [112, 12, 281, 176]);

  // [tên mới, ảnh gốc, hue]
  const variants = [
    ["jacket-mint-pink", "jacket-mint", 150], ["jacket-mint-peach", "jacket-mint", 210], ["jacket-mint-sand", "jacket-mint", 270],
    ["tee-aqua-violet", "tee-volt", 90], ["tee-aqua-rose", "tee-volt", 150], ["tee-pink-neon", "tee-volt", 210], ["tee-amber-mint", "tee-volt", 320],
    ["puffer-rose", "puffer", 150], ["puffer-green", "puffer", 270], ["puffer-teal", "puffer", 320],
    ["shoe-h30", "shoe-airflow", 30], ["shoe-h60", "shoe-airflow", 60], ["shoe-h120", "shoe-airflow", 120], ["shoe-h180", "shoe-airflow", 180], ["shoe-h240", "shoe-airflow", 240], ["shoe-h300", "shoe-airflow", 300], ["shoe-carbon", "shoe-airflow", 150], ["shoe-aqua", "shoe-airflow", 90], ["shoe-pink", "shoe-airflow", 210], ["shoe-coral", "shoe-airflow", 270], ["shoe-amber", "shoe-airflow", 320],
  ];
  const all = { ...base };
  for (const [name, from, h] of variants) all[name] = await hue(base[from], h);
  // [tên mới, ảnh gốc, màu RGB]
  const tints = [
    ["pants-front-royal", "pants-front", [36, 96, 200]], ["pants-front-forest", "pants-front", [28, 112, 66]], ["pants-front-teal", "pants-front", [24, 112, 112]], ["pants-front-brown", "pants-front", [112, 72, 40]], ["pants-front-plum", "pants-front", [98, 44, 104]], ["pants-front-mustard", "pants-front", [196, 150, 30]],
    ["pants-back-burgundy", "pants-back", [130, 40, 58]], ["pants-back-grey", "pants-back", [128, 134, 146]], ["pants-back-royal", "pants-back", [36, 96, 200]], ["pants-back-teal", "pants-back", [24, 112, 112]], ["pants-back-brown", "pants-back", [112, 72, 40]],
    ["pants-front-navy", "pants-front", [40, 62, 130]], ["pants-front-olive", "pants-front", [96, 112, 60]], ["pants-front-burgundy", "pants-front", [130, 40, 58]], ["pants-front-grey", "pants-front", [128, 134, 146]],
    ["pants-back-navy", "pants-back", [40, 62, 130]], ["pants-back-olive", "pants-back", [96, 112, 60]],
  ];
  for (const [name, from, rgb] of tints) all[name] = await tintDark(base[from], rgb);
  // áo đen: nhuộm các màu (ngưỡng thấp hơn để không đổi màu phông nền xám)
  const C = { navy: [40, 62, 130], olive: [96, 112, 60], burgundy: [130, 40, 58], grey: [128, 134, 146], teal: [24, 112, 112], royal: [36, 96, 200], forest: [28, 112, 66], brown: [112, 72, 40], plum: [98, 44, 104], mustard: [196, 150, 30] };
  const apparel = {
    windbreaker: ["navy", "olive", "burgundy", "grey", "royal", "teal", "forest", "brown"],
    "jacket-thermo": ["navy", "olive", "grey", "burgundy", "teal"], softshell: ["navy", "olive", "grey", "burgundy", "teal"],
    "tee-black": ["navy", "olive", "burgundy", "grey", "teal", "royal", "forest", "plum", "brown"],
    polo: ["navy", "olive", "burgundy", "grey", "royal", "forest", "teal", "brown"],
    bag: ["navy", "olive", "burgundy", "grey", "royal", "teal", "forest", "brown", "plum"],
    cap: ["navy", "olive", "burgundy", "grey", "teal", "royal", "forest", "brown", "plum"],
    speedcat: ["navy", "burgundy", "olive", "grey"],
  };
  for (const [from, colors] of Object.entries(apparel)) for (const c of colors) all[from + "-" + c] = await tintDark(base[from], C[c], 100);

  const VERSION = Date.now(); // gắn vào đường dẫn ảnh để trình duyệt không dùng lại ảnh cũ trong bộ nhớ đệm
  const map = {};
  for (const [name, buf] of Object.entries(all)) {
    const blurMode = ["bag-laptop", "bag-buckle", "bag-model", "vest"].includes(name);
    const mode = blurMode ? "blur" : "edge";
    const full = await fit45(buf, 1200, 1500, mode);
    fs.writeFileSync(path.join(outDir, `p-${name}.jpg`), full);
    // ảnh thu nhỏ cho thẻ sản phẩm, giỏ hàng, tìm kiếm... (nhẹ, tải tức thì)
    fs.writeFileSync(path.join(outDir, `t-${name}.jpg`), await sharp(full).resize({ width: 720, kernel: "lanczos3" }).sharpen({ sigma: 0.6, m1: 0.5, m2: 1.4 }).jpeg({ quality: 86, progressive: true, mozjpeg: true, chromaSubsampling: "4:4:4" }).toBuffer());
    map[`p-${name}`] = `/products/p-${name}.jpg?v=${VERSION}`;
  }

  // ảnh ngang dùng cho banner
  const wide = {
    "spring-hero": load("spring-hero"), "summer-hero": load("summer-hero"), "winter-hero": load("winter-hero"),
    "autumn-hero": await sharp(load("autumn-hero")).extract({ left: 0, top: 44, width: 1378, height: 724 }).toBuffer(),
    "shoe-winter": load("shoe-winter"),
    "shoe-trail": await sharp(base["shoe-trail"]).resize({ width: 1400 }).toBuffer(),
  };
  for (const [name, buf] of Object.entries(wide)) {
    const wm = await sharp(buf).metadata();
    // banner hiển thị rộng ~1700–1900px nên phóng gấp đôi (lanczos) + làm nét: nét hơn nhiều so với để trình duyệt tự kéo giãn
    const big = await sharp(buf).resize({ width: wm.width * 2, kernel: "lanczos3" }).sharpen({ sigma: 1.6, m1: 1.4, m2: 3 }).jpeg({ quality: 84, chromaSubsampling: "4:4:4", mozjpeg: true }).toBuffer();
    fs.writeFileSync(path.join(outDir, `w-${name}.jpg`), big);
    map[name] = `/products/w-${name}.jpg?v=${VERSION}`;
  }
  // giữ các khoá cũ để mã nguồn cũ không hỏng
  const legacy = { "jacket-mint": "p-jacket-mint", "tee-volt": "p-tee-volt", puffer: "p-puffer", pants: "p-softshell", shorts: "p-pants-front", fleece: "p-tee-black", "sneaker-summer": "p-shoe-airflow", "bag-front": "p-bag", "bag-model": "p-bag-model", "bag-laptop": "p-bag-laptop", "bag-buckle": "p-bag-buckle", "bag-back": "p-bag-back", polo: "p-polo", cap: "p-cap", speedcat: "p-speedcat", windbreaker: "p-windbreaker", "jacket-thermo": "p-jacket-thermo" };
  for (const [k, v] of Object.entries(legacy)) map[k] ??= map[v] ?? `/products/${v}.jpg?v=${VERSION}`;
  fs.writeFileSync(path.join(root, "lib", "images.json"), JSON.stringify(map, null, 1));
  console.log("xong:", fs.readdirSync(outDir).length, "ảnh");
})();

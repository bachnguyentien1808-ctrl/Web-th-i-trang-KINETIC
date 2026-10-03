"use client";
import { products, type Product } from "./products";

// Tìm sản phẩm theo ảnh: so khớp màu sắc (histogram HSV) và tỷ lệ hình dáng. Chạy hoàn toàn trên trình duyệt,
// KHÔNG phải nhận diện vật thể bằng AI - ảnh nền đơn giản, sản phẩm rõ ràng cho kết quả tốt nhất.

const SIZE = 48;
const HUE_BINS = 12;
interface Features { hist: number[]; aspect: number; fill: number }

function load(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error("Không đọc được ảnh"));
    img.src = src;
  });
}

function featuresOf(img: HTMLImageElement): Features {
  const c = document.createElement("canvas");
  c.width = c.height = SIZE;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, SIZE, SIZE);
  const d = ctx.getImageData(0, 0, SIZE, SIZE).data;
  const px = (x: number, y: number) => { const i = (y * SIZE + x) * 4; return [d[i], d[i + 1], d[i + 2]]; };

  // Ước lượng màu nền từ 4 góc để loại bỏ nền khỏi histogram
  const corners = [px(1, 1), px(SIZE - 2, 1), px(1, SIZE - 2), px(SIZE - 2, SIZE - 2)];
  const bg = [0, 1, 2].map((k) => corners.reduce((n, p) => n + p[k], 0) / 4);

  const hist = new Array(HUE_BINS + 3).fill(0);
  let count = 0, minX = SIZE, maxX = 0, minY = SIZE, maxY = 0;
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const [r, g, b] = px(x, y);
    if (Math.hypot(r - bg[0], g - bg[1], b - bg[2]) < 38) continue; // nền
    count++; minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), v = mx / 255, s = mx ? (mx - mn) / mx : 0;
    if (s < 0.2 || v < 0.2) { hist[HUE_BINS + (v < 0.3 ? 0 : v > 0.75 ? 2 : 1)]++; continue; } // đen / xám / trắng
    let h = 0; const df = mx - mn;
    if (mx === r) h = ((g - b) / df) % 6; else if (mx === g) h = (b - r) / df + 2; else h = (r - g) / df + 4;
    h = (h * 60 + 360) % 360;
    hist[Math.min(HUE_BINS - 1, Math.floor(h / (360 / HUE_BINS)))]++;
  }
  const total = hist.reduce((a, b) => a + b, 0) || 1;
  const w = Math.max(1, maxX - minX + 1), h2 = Math.max(1, maxY - minY + 1);
  return { hist: hist.map((x) => x / total), aspect: w / h2, fill: count / (SIZE * SIZE) };
}

const similarity = (a: Features, b: Features) => {
  const color = a.hist.reduce((n, v, i) => n + Math.min(v, b.hist[i]), 0); // giao histogram 0..1
  const shape = 1 - Math.min(1, Math.abs(Math.log(a.aspect / b.aspect)) / Math.log(3));
  return 0.8 * color + 0.2 * shape;
};

let catalog: Promise<{ p: Product; f: Features }[]> | null = null;
const thumb = (url: string) => url.replace("/products/p-", "/products/t-"); // ảnh nhỏ cùng origin → đọc được pixel

function getCatalog() {
  catalog ??= Promise.all(products.map(async (p) => ({ p, f: featuresOf(await load(thumb(p.image))) })));
  return catalog;
}

export interface ImageMatch { product: Product; score: number }

export async function searchByImage(file: File, limit = 6): Promise<ImageMatch[]> {
  const url = URL.createObjectURL(file);
  try {
    const q = featuresOf(await load(url));
    const cat = await getCatalog();
    return cat.map(({ p, f }) => ({ product: p, score: similarity(q, f) })).sort((a, b) => b.score - a.score).slice(0, limit);
  } finally { URL.revokeObjectURL(url); }
}

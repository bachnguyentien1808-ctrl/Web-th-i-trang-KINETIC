"use client";
import { useEffect, useState } from "react";
import type { Product } from "./products";

export interface Review {
  id: string; slug: string; orderId: string; email: string; name: string;
  rating: number; text: string; date: string;
  images?: string[]; // ảnh đã nén (data URL)
}
const KEY = "kinetic-reviews-v1";
const EVT = "kinetic-reviews-changed";

export function readReviews(): Review[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
/** Trả về false nếu bộ nhớ trình duyệt đầy (ảnh quá nặng). */
export function addReview(r: Omit<Review, "id" | "date">): boolean {
  const all = readReviews().filter((x) => !(x.email === r.email && x.slug === r.slug && x.orderId === r.orderId));
  try {
    localStorage.setItem(KEY, JSON.stringify([{ ...r, id: crypto.randomUUID(), date: new Date().toISOString() }, ...all]));
  } catch { return false; }
  window.dispatchEvent(new Event(EVT));
  return true;
}

/** Nén ảnh về tối đa 900px, JPEG chất lượng 0.72 để lưu gọn trong trình duyệt. */
export function compressImage(file: File, maxSide = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, maxSide / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Không đọc được ảnh")); };
    img.src = url;
  });
}

export function useReviews() {
  const [list, setList] = useState<Review[]>([]);
  useEffect(() => {
    const load = () => setList(readReviews());
    load();
    window.addEventListener(EVT, load);
    window.addEventListener("storage", load);
    return () => { window.removeEventListener(EVT, load); window.removeEventListener("storage", load); };
  }, []);
  return list;
}

/** Gộp điểm đánh giá mẫu của sản phẩm với đánh giá thật của khách. */
export function summarize(p: Product, mine: Review[]) {
  const count = p.reviews + mine.length;
  if (count === 0) return { avg: 0, count: 0 };
  const avg = (p.rating * p.reviews + mine.reduce((n, r) => n + r.rating, 0)) / count;
  return { avg: Math.round(avg * 10) / 10, count };
}

export function deleteReview(id: string) {
  localStorage.setItem(KEY, JSON.stringify(readReviews().filter((r) => r.id !== id)));
  window.dispatchEvent(new Event(EVT));
}

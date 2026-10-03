"use client";
import { useState } from "react";

/* eslint-disable @next/next/no-img-element */
export default function ReviewImages({ images }: { images?: string[] }) {
  const [open, setOpen] = useState<string | null>(null);
  if (!images?.length) return null;
  return (
    <>
      <div className="rv-imgs">
        {images.map((src, i) => <button key={i} onClick={() => setOpen(src)} aria-label="Xem ảnh lớn"><img src={src} alt={`Ảnh đánh giá ${i + 1}`} /></button>)}
      </div>
      {open && (
        <div className="lightbox" onClick={() => setOpen(null)} role="dialog" aria-modal="true">
          <img src={open} alt="Ảnh đánh giá" />
          <button aria-label="Đóng">✕</button>
        </div>
      )}
    </>
  );
}

"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { searchByImage, type ImageMatch } from "@/lib/imageSearch";
import { categories, products, thumb } from "@/lib/products";

export default function SearchBox() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<{ url: string; busy: boolean; matches: ImageMatch[]; error?: string } | null>(null);

  async function pickPhoto(file?: File | null) {
    if (!file || !file.type.startsWith("image/")) return;
    if (photo?.url) URL.revokeObjectURL(photo.url);
    const url = URL.createObjectURL(file);
    setOpen(true); setPhoto({ url, busy: true, matches: [] });
    try { setPhoto({ url, busy: false, matches: await searchByImage(file) }); }
    catch { setPhoto({ url, busy: false, matches: [], error: "Không phân tích được ảnh này. Hãy thử ảnh khác." }); }
  }
  const clearPhoto = () => { if (photo?.url) URL.revokeObjectURL(photo.url); setPhoto(null); };

  useEffect(() => {
    const out = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", out); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", out); document.removeEventListener("keydown", esc); };
  }, []);

  // Gợi ý mặc định: mỗi danh mục 1 sản phẩm nổi bật, rồi thêm vài sản phẩm đang giảm giá
  const picks = categories.map((c) => products.find((p) => p.category === c.slug && p.badge) ?? products.find((p) => p.category === c.slug)!);
  const suggested = [...picks, ...products.filter((p) => p.oldPrice && !picks.includes(p))].slice(0, 6);
  const term = q.trim().toLowerCase();
  const matches = term ? products.filter((p) => (p.name + " " + p.categoryLabel).toLowerCase().includes(term)) : [];
  const list = term ? matches.slice(0, 6) : suggested;
  const go = (url: string) => { setOpen(false); router.push(url); };

  return (
    <div className="search" ref={box}>
      <form onSubmit={(e) => { e.preventDefault(); if (term) go(`/products?q=${encodeURIComponent(q.trim())}`); }}>
        <input value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onClick={() => setOpen(true)}
          placeholder="tìm kiếm" aria-label="Tìm kiếm" autoComplete="off" />
        <button type="submit" className="cam-btn" aria-label="Tìm kiếm" title="Tìm kiếm">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="7" /><path d="m16 16 5 5" /></svg>
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { pickPhoto(e.target.files?.[0]); e.target.value = ""; }} />
      </form>
      {open && (
        <div className="search-pop" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pickPhoto(e.dataTransfer.files?.[0]); }}>
          {photo ? (
            <>
              <div className="ph-head">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url} alt="Ảnh bạn tải lên" />
                <div><b>TÌM THEO HÌNH ẢNH</b><small>So khớp theo màu sắc & hình dáng</small></div>
                <button type="button" onClick={clearPhoto}>Xoá ảnh</button>
              </div>
              {photo.busy && <p className="sp-empty">Đang phân tích ảnh…</p>}
              {photo.error && <p className="sp-empty">{photo.error}</p>}
              {photo.matches.map((m, i) => (
                <Link key={m.product.slug} href={`/products/${m.product.slug}`} className="sp-item" onClick={() => setOpen(false)}>
                  <span className="sp-img"><Image src={thumb(m.product.image)} alt="" fill sizes="44px" /></span>
                  <span className="sp-name">{m.product.name}<small>{m.product.categoryLabel}</small></span>
                  <span className={i === 0 ? "match top" : "match"}>{Math.round(m.score * 100)}%</span>
                </Link>
              ))}
              <button type="button" className="sp-all" onClick={() => fileRef.current?.click()}>Tải ảnh khác</button>
            </>
          ) : (
            <>
          <button type="button" className="photo-drop" onClick={() => fileRef.current?.click()}>📷 Tìm bằng hình ảnh - bấm để chọn ảnh hoặc kéo thả vào đây</button>
          {!term && (
            <>
              <small className="sp-title">DANH MỤC</small>
              <div className="sp-cats">
                {categories.map((c) => <button key={c.slug} onClick={() => go(`/products?cat=${c.slug}`)}>{c.label}</button>)}
                <button onClick={() => go("/products?sale=1")}>Outlet</button>
                <button onClick={() => go("/products")}>Tất cả</button>
              </div>
            </>
          )}
          <small className="sp-title">{term ? `KẾT QUẢ CHO “${q.trim()}”` : "GỢI Ý TỪ SHOP"}</small>
          {list.length === 0 && <p className="sp-empty">Không có sản phẩm phù hợp.</p>}
          {list.map((p) => (
            <Link key={p.slug} href={`/products/${p.slug}`} className="sp-item" onClick={() => setOpen(false)}>
              <span className="sp-img"><Image src={thumb(p.image)} alt="" fill sizes="44px" /></span>
              <span className="sp-name">{p.name}<small>{p.categoryLabel}</small></span>
            </Link>
          ))}
          {term && matches.length > 0 && <button className="sp-all" onClick={() => go(`/products?q=${encodeURIComponent(q.trim())}`)}>Xem tất cả {matches.length} kết quả →</button>}
            </>
          )}
        </div>
      )}
    </div>
  );
}

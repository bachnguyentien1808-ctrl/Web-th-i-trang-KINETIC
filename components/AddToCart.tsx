"use client";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import Image from "next/image";
import Link from "next/link";
import { getVariants, thumb, type Product } from "@/lib/products";

export default function AddToCart({ p }: { p: Product }) {
  const { add, setOpen } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const variants = getVariants(p);
  const first = p.sizes.find((s) => s.inStock)?.label ?? "";
  const [size, setSize] = useState(p.sizes.length === 1 ? first : "");
  const [qty, setQty] = useState(1);
  const [err, setErr] = useState(false);
  const [note, setNote] = useState("");

  const guard = (fn: () => void) => () => {
    if (!user) { router.push(`/login?next=${encodeURIComponent(pathname)}&need=1`); return; }
    if (!size) { setErr(true); return; }
    setErr(false); fn();
  };

  return (
    <div className="atc">
      {variants.length > 1 && (
        <div className="colors">
          <div className="colors-head"><b>CHỌN MÀU</b><span>{variants.find((v) => v.slug === p.slug)?.label}</span></div>
          <div className="colors-row">
            {variants.map((v) => (
              <Link key={v.slug} href={`/products/${v.slug}`} scroll={false} replace title={v.label} aria-label={v.label} aria-current={v.slug === p.slug} className={`color-opt${v.slug === p.slug ? " on" : ""}`}>
                <Image src={thumb(v.image)} alt={v.label} width={64} height={80} />
              </Link>
            ))}
          </div>
        </div>
      )}
      <div className="size-head"><b>CHỌN SIZE</b>{err && <span className="err">Vui lòng chọn size</span>}</div>
      <div className="sizes">
        {p.sizes.map((s) => (
          <button key={s.label} disabled={!s.inStock} className={`size ${size === s.label ? "sel" : ""} ${!s.inStock ? "oos" : ""}`} onClick={() => { setSize(s.label); setErr(false); }}>
            {s.label}
          </button>
        ))}
      </div>
      <label className="field note-field"><span>GHI CHÚ CHO SẢN PHẨM (TUỲ CHỌN)</span><textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="Ví dụ: gói quà, giao giờ hành chính..." rows={2} /></label>
      <div className="atc-row">
        <div className="qty big">
          <button onClick={() => setQty(Math.max(1, qty - 1))}>−</button><span>{qty}</span><button onClick={() => setQty(qty + 1)}>+</button>
        </div>
        <button className="btn btn-outline" onClick={guard(() => add(p.slug, size, qty, note.trim()))}>THÊM VÀO GIỎ HÀNG</button>
      </div>
      <button className="btn btn-black full" onClick={guard(() => { add(p.slug, size, qty, note.trim()); setOpen(false); router.push("/checkout"); })}>⚡ MUA NGAY - THANH TOÁN NHANH</button>
    </div>
  );
}

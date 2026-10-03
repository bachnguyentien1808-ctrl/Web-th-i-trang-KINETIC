"use client";
import CartColor from "@/components/CartColor";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatVnd, getProduct, thumb } from "@/lib/products";

export default function CartDrawer() {
  const { open, setOpen, lines, setQty, setNote, remove, selectedSubtotal, selectedLines, isSelected, toggle, toggleAll } = useCart();
  const allOn = lines.length > 0 && selectedLines.length === lines.length;
  return (
    <>
      <div className={open ? "overlay show" : "overlay"} onClick={() => setOpen(false)} />
      <aside className={open ? "drawer show" : "drawer"} aria-hidden={!open}>
        <div className="drawer-head">
          <h2>GIỎ HÀNG</h2>
          <button onClick={() => setOpen(false)} aria-label="Đóng">✕</button>
        </div>
        <div className="drawer-body">
          {lines.length === 0 && <p className="muted">Giỏ hàng của bạn đang trống.</p>}
          {lines.length > 0 && <label className="sel-all"><input type="checkbox" checked={allOn} onChange={(e) => toggleAll(e.target.checked)} /> Chọn tất cả ({selectedLines.length}/{lines.length})</label>}
          {lines.map((l) => {
            const p = getProduct(l.slug)!;
            return (
              <div className={isSelected(l.slug, l.size) ? "line" : "line unsel"} key={l.slug + l.size}>
                <input type="checkbox" className="line-chk" checked={isSelected(l.slug, l.size)} onChange={() => toggle(l.slug, l.size)} aria-label="Chọn để thanh toán" />
                <div className="line-img"><Image src={thumb(p.image)} alt={p.name} fill sizes="90px" /></div>
                <div className="line-info">
                  <Link href={`/products/${p.slug}`} onClick={() => setOpen(false)}>{p.name}</Link>
                  <small>Size: {l.size}</small>
                  <CartColor slug={l.slug} size={l.size} />
                  <div className="qty">
                    <button onClick={() => setQty(l.slug, l.size, l.qty - 1)}>−</button>
                    <span>{l.qty}</span>
                    <button onClick={() => setQty(l.slug, l.size, l.qty + 1)}>+</button>
                    <button className="rm" onClick={() => remove(l.slug, l.size)}>Xoá</button>
                  </div>
                  <input className="line-note" value={l.note ?? ""} maxLength={200} placeholder="Ghi chú cho sản phẩm..." onChange={(e) => setNote(l.slug, l.size, e.target.value)} />
                </div>
                <b className="price">{formatVnd(p.price * l.qty)}</b>
              </div>
            );
          })}
        </div>
        <div className="drawer-foot">
          <div className="total"><span>TẠM TÍNH ({selectedLines.length} đã chọn)</span><b>{formatVnd(selectedSubtotal)}</b></div>
          <Link href="/cart" className="btn btn-outline" onClick={() => setOpen(false)}>XEM GIỎ HÀNG</Link>
          <Link href="/checkout" className={selectedLines.length ? "btn btn-yellow" : "btn btn-yellow disabled"} onClick={() => setOpen(false)}>THANH TOÁN →</Link>
        </div>
      </aside>
    </>
  );
}

"use client";
import CartColor from "@/components/CartColor";
import Image from "next/image";
import Link from "next/link";
import RequireAuth from "@/components/RequireAuth";
import ProductCard from "@/components/ProductCard";
import { useCart } from "@/lib/cart";
import { formatVnd, getProduct, products, thumb } from "@/lib/products";

const FREE_SHIP = 899000;
const SHIP_FEE = 30000;

function CartView() {
  const { lines, count, setQty, setNote, remove, selectedLines, selectedCount, selectedSubtotal: subtotal, isSelected, toggle, toggleAll } = useCart();
  const allOn = lines.length > 0 && selectedLines.length === lines.length;
  const ship = subtotal === 0 || subtotal >= FREE_SHIP ? 0 : SHIP_FEE;
  const missing = Math.max(0, FREE_SHIP - subtotal);
  const inCart = new Set(lines.map((l) => l.slug));
  const suggestions = products.filter((p) => !inCart.has(p.slug)).slice(0, 4);

  return (
    <div className="container section">
      <div className="cart-title">
        <h1 className="h1">GIỎ HÀNG CỦA BẠN</h1>
        {count > 0 && <span>{count} sản phẩm</span>}
      </div>

      {lines.length === 0 ? (
        <div className="cart-empty">
          <p><b>Giỏ hàng của bạn đang trống</b></p>
          <p className="muted">Hãy thêm vài sản phẩm để bắt đầu.</p>
          <Link href="/products" className="btn btn-arrow">BẮT ĐẦU MUA SẮM <i>→</i></Link>
        </div>
      ) : (
        <div className="cart-grid">
          <div>
            <div className="ship-bar">
              {missing > 0
                ? <p>Mua thêm <b>{formatVnd(missing)}</b> để được <b>miễn phí vận chuyển</b></p>
                : <p>✓ Đơn hàng của bạn được <b>miễn phí vận chuyển</b></p>}
              <div className="bar"><i style={{ width: `${Math.min(100, (subtotal / FREE_SHIP) * 100)}%` }} /></div>
            </div>

            <label className="sel-all"><input type="checkbox" checked={allOn} onChange={(e) => toggleAll(e.target.checked)} /> Chọn tất cả ({selectedLines.length}/{lines.length} sản phẩm)</label>
            {lines.map((l) => {
              const p = getProduct(l.slug)!;
              return (
                <article className={isSelected(l.slug, l.size) ? "cart-item" : "cart-item unsel"} key={l.slug + l.size}>
                  <input type="checkbox" className="ci-chk" checked={isSelected(l.slug, l.size)} onChange={() => toggle(l.slug, l.size)} aria-label="Chọn để thanh toán" />
                  <Link href={`/products/${p.slug}`} className="ci-img"><Image src={thumb(p.image)} alt={p.name} fill sizes="180px" /></Link>
                  <div className="ci-body">
                    <div className="ci-top">
                      <div>
                        <Link href={`/products/${p.slug}`}><h3>{p.name}</h3></Link>
                        <small className="cat">{p.categoryLabel}</small>
                        <p className="ci-meta">Size: <b>{l.size}</b></p>
                        <CartColor slug={l.slug} size={l.size} />
                      </div>
                      <div className="ci-price">
                        <b className="price">{formatVnd(p.price * l.qty)}</b>
                        {l.qty > 1 && <small>{formatVnd(p.price)} / sản phẩm</small>}
                        {p.oldPrice && <s>{formatVnd(p.oldPrice * l.qty)}</s>}
                      </div>
                    </div>
                    <div className="ci-actions">
                      <label className="ci-qty">
                        <span>SỐ LƯỢNG</span>
                        <select value={l.qty} onChange={(e) => setQty(l.slug, l.size, Number(e.target.value))}>
                          {Array.from({ length: Math.max(10, l.qty) }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </label>
                      <button className="ci-remove" onClick={() => remove(l.slug, l.size)} aria-label="Xoá sản phẩm">🗑 Xoá</button>
                    </div>
                    <input className="line-note" value={l.note ?? ""} maxLength={200} placeholder="Ghi chú cho sản phẩm (gói quà, ...)" onChange={(e) => setNote(l.slug, l.size, e.target.value)} />
                  </div>
                </article>
              );
            })}
          </div>

          <aside className="cart-sum">
            <h2>TÓM TẮT ĐƠN HÀNG</h2>
            <div className="cs-row"><span>{selectedCount} sản phẩm đã chọn</span><b>{formatVnd(subtotal)}</b></div>
            <div className="cs-row"><span>Giao hàng</span><b>{ship ? formatVnd(ship) : "Miễn phí"}</b></div>
            <div className="cs-total"><span>TỔNG</span><b>{formatVnd(subtotal + ship)}</b></div>
            <small className="muted">Đã bao gồm thuế VAT</small>
            <p className="cs-voucher">🎟 Mã giảm giá (voucher) được áp dụng ở bước thanh toán.</p>
            {selectedLines.length ? <Link href="/checkout" className="btn btn-arrow full">THANH TOÁN ({selectedLines.length}) <i>→</i></Link> : <span className="btn btn-arrow full disabled">CHỌN SẢN PHẨM ĐỂ THANH TOÁN</span>}
            <div className="cs-pay"><small>CHẤP NHẬN THANH TOÁN</small><div><span>VNPAY-QR</span><span>MoMo</span><span>VISA</span><span>MASTER</span><span>COD</span></div></div>
            <ul className="cs-perks"><li>Đổi trả miễn phí trong 30 ngày</li><li>Giao hỏa tốc 2–4h nội thành</li><li>Bảo hành chính hãng 2 năm</li></ul>
          </aside>
        </div>
      )}

      <section className="section">
        <div className="sec-head"><h2>GỢI Ý CHO BẠN</h2><Link href="/products" className="more">XEM THÊM →</Link></div>
        <div className="grid">{suggestions.map((p) => <ProductCard key={p.slug} p={p} />)}</div>
      </section>
    </div>
  );
}

export default function CartPage() { return <RequireAuth><CartView /></RequireAuth>; }

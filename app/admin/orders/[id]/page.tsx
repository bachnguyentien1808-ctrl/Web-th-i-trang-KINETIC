"use client";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { loyaltyOf } from "@/lib/loyalty";
import { REFUND_AFTER_MS, cancelInfo, isOnlinePay, readAllOrders, stageOf, stages, updateOrder, type OrderWithOwner } from "@/lib/orders";
import { formatVnd, getProduct, thumb } from "@/lib/products";

const payLabel: Record<string, string> = { cod: "Thanh toán khi nhận hàng (COD)", vnpay: "VNPAY-QR", momo: "Ví MoMo", card: "Thẻ Visa / Mastercard" };
const fmt = (d: Date) => d.toLocaleString("vi-VN");
const compact = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(".", ",")} tr` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : String(n));

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [all, setAll] = useState<OrderWithOwner[] | null>(null);
  const reload = () => setAll(readAllOrders());
  useEffect(reload, []);
  if (!all) return null;

  const o = all.find((x) => x.id === id);
  if (!o) return <><h1 className="h1">KHÔNG TÌM THẤY ĐƠN HÀNG</h1><Link href="/admin/orders" className="ul">← Về danh sách đơn</Link></>;

  const mine = all.filter((x) => x.email === o.email);
  const live = mine.filter((x) => !x.cancel);
  const loy = loyaltyOf(mine);
  const first = [...mine].sort((a, b) => a.date.localeCompare(b.date))[0];
  const spent = live.reduce((n, x) => n + x.total, 0);
  const others = mine.filter((x) => x.id !== o.id);

  const st = stageOf(o);
  const ci = cancelInfo(o);
  const qty = o.items.reduce((n, i) => n + i.qty, 0);
  const subtotal = o.items.reduce((n, i) => n + i.price * i.qty, 0);
  const patch = (p: Parameters<typeof updateOrder>[2]) => { updateOrder(o.email, o.id, p); reload(); };
  const badge = o.cancel ? (o.cancel.confirmedAt ? "ĐÃ HUỶ" : "YÊU CẦU HUỶ") : stages.find((s) => s.key === st)!.label.toUpperCase();
  const idx = stages.findIndex((s) => s.key === st);

  return (
    <div className="od">
      <Link href="/admin/orders" className="od-back">← Danh sách đơn hàng</Link>

      <div className="od-sheet">

      <header className="od-hero">
        <div>
          <small>ĐƠN HÀNG</small>
          <h1>#{o.id}</h1>
          <div className="od-meta">
            <span className={`badge ${o.cancel ? "st-cancelled" : `st-${st}`}`}>{badge}</span>
            <span>🕒 {fmt(new Date(o.date))}</span>
            <span>💳 {payLabel[o.pay] ?? o.pay}</span>
          </div>
        </div>
        <div className="od-total">
          <small>TỔNG THANH TOÁN</small>
          <b>{formatVnd(o.total)}</b>
          {!o.cancel && <Link href={`/admin/invoice/${o.id}`} target="_blank" className="od-invoice">🧾 Xuất hoá đơn</Link>}
        </div>
      </header>

      <div className="od-stats">
        <div><i>📦</i><b>{qty}</b><small>Sản phẩm</small></div>
        <div><i>🎟</i><b>{o.voucher ?? "-"}</b><small>Voucher đã dùng</small></div>
        <div><i>⭐</i><b>{o.pointsUsed ? `−${o.pointsUsed.toLocaleString("vi-VN")}` : "0"}</b><small>Điểm đã dùng</small></div>
        <div><i>🎁</i><b>{o.earnPoints ? `+${o.earnPoints.toLocaleString("vi-VN")}` : "0"}</b><small>Điểm sẽ tích{o.tierName ? ` (${o.tierName})` : ""}</small></div>
      </div>

      {!o.cancel && (
        <section className="od-card">
          <h3>TIẾN TRÌNH GIAO HÀNG</h3>
          <ol className="stepper big">
            {stages.map((s, i) => <li key={s.key} className={i < idx ? "done" : i === idx ? "now" : ""}><i>{i <= idx ? "✓" : i + 1}</i><span>{s.label}</span></li>)}
          </ol>
          <div className="od-actions">
            {st === "processed" && <button className="btn btn-black sm" onClick={() => patch({ stage: "shipping" })}>BÀN GIAO VẬN CHUYỂN → ĐANG GIAO</button>}
            {st === "shipping" && <button className="btn btn-black sm" onClick={() => patch({ stage: "delivered" })}>ĐÁNH DẤU ĐÃ GIAO</button>}
            {st === "delivered" && <p className="refund-info ok">✅ Đơn đã giao thành công{o.earnPoints ? ` - khách được cộng ${o.earnPoints.toLocaleString("vi-VN")} điểm.` : "."}</p>}
          </div>
        </section>
      )}

      {o.cancel && ci && (
        <section className="od-card od-cancel">
          <h3>YÊU CẦU HUỶ ĐƠN</h3>
          <p><b>Lý do:</b> {o.cancel.reason}{o.cancel.note && <em className="note"> “{o.cancel.note}”</em>}<br /><small className="muted">Yêu cầu lúc {fmt(new Date(o.cancel.requestedAt))}</small></p>
          {ci.phase === "pending" && <button className="btn btn-red sm" onClick={() => patch({ cancel: { ...o.cancel!, confirmedAt: new Date().toISOString() } })}>XÁC NHẬN HUỶ ĐƠN</button>}
          {ci.phase !== "pending" && (isOnlinePay(o) ? (
            <>
              <p className="refund-info">Đã xác nhận huỷ lúc {fmt(ci.confirmedAt!)}. Hoàn <b>{formatVnd(o.total)}</b> về {payLabel[o.pay]} sau {REFUND_AFTER_MS / 3600000} giờ - <b>hạn: {fmt(ci.refundAt!)}</b></p>
              {ci.phase === "confirmed" ? <button className="btn btn-black sm" onClick={() => patch({ cancel: { ...o.cancel!, refundedAt: new Date().toISOString() } })}>ĐÁNH DẤU ĐÃ HOÀN TIỀN</button> : <p className="refund-info ok">Đã hoàn tiền lúc {fmt(ci.refundedAt!)}.</p>}
            </>
          ) : <p className="refund-info">Đơn COD - không cần hoàn tiền.</p>)}
        </section>
      )}

      <div className="od-grid">
        <div className="od-col">
          <section className="od-card">
            <h3>SẢN PHẨM ĐÃ MUA</h3>
            <div className="od-items">
              {o.items.map((i, n) => {
                const p = getProduct(i.slug);
                return (
                  <div key={n} className="od-item">
                    <div className="od-thumb">{p && <Image src={thumb(p.image)} alt="" fill sizes="80px" />}</div>
                    <div className="od-info">
                      {p ? <Link href={`/products/${p.slug}`} target="_blank"><b>{i.name}</b></Link> : <b>{i.name}</b>}
                      <div className="od-tags"><span>Size {i.size}</span><span>SL: {i.qty}</span><span>{formatVnd(i.price)}</span></div>
                      {i.note && <div className="od-note">📝 Ghi chú của khách: {i.note}</div>}
                    </div>
                    <b className="od-line">{formatVnd(i.price * i.qty)}</b>
                  </div>
                );
              })}
            </div>
            <div className="dt-sum">
              <div><span>Tạm tính</span><b>{formatVnd(subtotal)}</b></div>
              {!!o.discount && <div className="disc"><span>Voucher {o.voucher}</span><b>−{formatVnd(o.discount)}</b></div>}
              {!!o.pointsUsed && <div className="disc"><span>Dùng {o.pointsUsed.toLocaleString("vi-VN")} điểm</span><b>−{formatVnd(o.pointsUsed)}</b></div>}
              <div><span>Phí vận chuyển</span><b>{o.shipping ? formatVnd(o.shipping) : "Miễn phí"}</b></div>
              <div className="grand"><span>TỔNG THANH TOÁN</span><b>{formatVnd(o.total)}</b></div>
            </div>
          </section>

          <section className="od-card">
            <h3>CÁC ĐƠN KHÁC CỦA KHÁCH ({others.length})</h3>
            {others.length === 0 && <p className="muted small">Khách chưa có đơn hàng nào khác.</p>}
            {others.map((x) => (
              <Link key={x.id} href={`/admin/orders/${x.id}`} className="od-other">
                <b>#{x.id}</b>
                <span>{x.items.map((i) => i.name).join(", ")}</span>
                <small>{new Date(x.date).toLocaleDateString("vi-VN")}</small>
                <b>{formatVnd(x.total)}{x.cancel && <em className="late"> · huỷ</em>}</b>
              </Link>
            ))}
          </section>
        </div>

        <aside className="od-col">
          <section className="od-card cust-card" style={{ ["--tier" as string]: loy.tier.color }}>
            <div className="cust-top">
              <span className="avatar lg">{o.name.trim().charAt(0).toUpperCase()}</span>
              <div>
                <h2>{o.name}</h2>
                <span className="tier-pill"><i className="tier-dot" style={{ background: loy.tier.color }} /> Thẻ {loy.tier.name} · tích {loy.tier.rate}%</span>
                {loy.lapsed && <small className="late"> bị hạ do lâu không mua</small>}
              </div>
            </div>

            <ul className="contact">
              <li><i>📞</i><div><small>Điện thoại</small><b>{o.phone}</b></div><a href={`tel:${o.phone}`} className="mini-btn">Gọi</a></li>
              <li><i>✉️</i><div><small>Email</small><b>{o.email}</b></div><a href={`mailto:${o.email}`} className="mini-btn">Gửi mail</a></li>
              <li><i>📍</i><div><small>Địa chỉ giao hàng</small><b>{o.address}</b></div></li>
            </ul>

            <div className="tiles3">
              <div><b>{live.length}</b><small>Đơn thành công{mine.length > live.length ? ` · ${mine.length - live.length} huỷ` : ""}</small></div>
              <div><b>{compact(spent)}</b><small>Tổng chi tiêu</small></div>
              <div><b>{compact(loy.balance)}</b><small>Điểm khả dụng</small></div>
            </div>

            <dl className="kv">
              <dt>Mua lần đầu</dt><dd>{first ? new Date(first.date).toLocaleDateString("vi-VN") : "-"}{first?.id === o.id && <i className="v-best">ĐƠN ĐẦU TIÊN</i>}</dd>
              <dt>Mua gần nhất</dt><dd>{loy.lastPurchase ? new Date(loy.lastPurchase).toLocaleDateString("vi-VN") : "-"}</dd>
              <dt>Chi tiêu 12 tháng</dt><dd>{formatVnd(loy.spend12m)}</dd>
            </dl>
          </section>
        </aside>
      </div>
      </div>
    </div>
  );
}

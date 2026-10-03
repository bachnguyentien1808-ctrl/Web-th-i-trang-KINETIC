"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { REFUND_AFTER_MS, cancelInfo, isOnlinePay, readAllOrders, stageOf, stages, updateOrder, type OrderWithOwner, type Stage } from "@/lib/orders";
import { formatVnd } from "@/lib/products";

type Tab = "all" | Stage | "cancel-pending" | "cancelled";
const payLabel: Record<string, string> = { cod: "COD", vnpay: "VNPAY-QR", momo: "MoMo", card: "Thẻ" };
const fmt = (d: Date) => d.toLocaleString("vi-VN");

export default function AdminOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderWithOwner[] | null>(null);
  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState("");
  const reload = () => setOrders(readAllOrders());
  useEffect(reload, []);
  if (!orders) return null;

  const statusOf = (o: OrderWithOwner): Tab => (o.cancel ? (o.cancel.confirmedAt ? "cancelled" : "cancel-pending") : stageOf(o));
  const count = (t: Tab) => (t === "all" ? orders.length : orders.filter((o) => statusOf(o) === t).length);
  const term = q.trim().toLowerCase();
  const shown = orders.filter((o) => (tab === "all" || statusOf(o) === tab) && (!term || (o.id + o.name + o.phone + o.email).toLowerCase().includes(term)));
  const patch = (o: OrderWithOwner, p: Parameters<typeof updateOrder>[2]) => { updateOrder(o.email, o.id, p); reload(); };
  const tabs: { key: Tab; label: string }[] = [{ key: "all", label: "Tất cả" }, ...stages, { key: "cancel-pending", label: "Yêu cầu huỷ" }, { key: "cancelled", label: "Đã huỷ" }];

  return (
    <>
      <h1 className="h1">QUẢN LÝ ĐƠN HÀNG</h1>
      <div className="admin-bar">
        <div className="status-tabs">
          {tabs.map((t) => <button key={t.key} className={tab === t.key ? `st on ${t.key === "cancel-pending" || t.key === "cancelled" ? "cancelled" : ""}` : "st"} onClick={() => setTab(t.key)}>{t.label}<span>{count(t.key)}</span></button>)}
        </div>
        <input className="admin-search" placeholder="Tìm theo mã đơn, tên, SĐT, email..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {shown.length === 0 && <p className="muted pad">Không có đơn hàng phù hợp.</p>}
      {shown.map((o) => {
        const ci = cancelInfo(o);
        const st = stageOf(o);
        return (
          <div key={o.id + o.email} className="order admin-order clickable" role="link" tabIndex={0}
            onClick={(e) => { if (!(e.target as HTMLElement).closest("button, a")) router.push(`/admin/orders/${o.id}`); }}
            onKeyDown={(e) => { if (e.key === "Enter" && e.target === e.currentTarget) router.push(`/admin/orders/${o.id}`); }}>
            <div className="order-head">
              <b>#{o.id}</b><span>{new Date(o.date).toLocaleString("vi-VN")}</span>
              <span className={`badge ${o.cancel ? "st-cancelled" : `st-${st}`}`}>{o.cancel ? (o.cancel.confirmedAt ? "ĐÃ HUỶ" : "YÊU CẦU HUỶ") : stages.find((s) => s.key === st)!.label.toUpperCase()}</span>
              <span className="badge b-black">{payLabel[o.pay] ?? o.pay}</span>
              <b className="right">{formatVnd(o.total)}</b>
              <Link href={`/admin/orders/${o.id}`} className="ul detail-link">Chi tiết →</Link>
            </div>
            <p className="small"><b>{o.name}</b> · {o.phone} · {o.email}<br />{o.address}</p>
            {o.items.map((i, n) => (
              <div key={n} className="top-row"><span>{i.name} <small className="muted">· {i.size} × {i.qty}</small>{i.note && <em className="note"> Ghi chú: {i.note}</em>}</span><b>{formatVnd(i.price * i.qty)}</b></div>
            ))}
            {o.voucher && <p className="small muted">Voucher: {o.voucher} (−{formatVnd(o.discount ?? 0)})</p>}

            {o.cancel && ci && (
              <div className="cancel-box">
                <p><b>Lý do huỷ:</b> {o.cancel.reason}{o.cancel.note && <em className="note"> “{o.cancel.note}”</em>} <small className="muted">· yêu cầu lúc {fmt(new Date(o.cancel.requestedAt))}</small></p>
                {ci.phase === "pending" && <button className="btn btn-red sm" onClick={() => patch(o, { cancel: { ...o.cancel!, confirmedAt: new Date().toISOString() } })}>XÁC NHẬN HUỶ ĐƠN</button>}
                {ci.phase !== "pending" && (isOnlinePay(o) ? (
                  <>
                    <p className="refund-info">Đã xác nhận huỷ lúc {fmt(ci.confirmedAt!)}. Hoàn <b>{formatVnd(o.total)}</b> về {payLabel[o.pay]} sau {REFUND_AFTER_MS / 3600000} giờ - <b>hạn: {fmt(ci.refundAt!)}</b>{ci.phase === "confirmed" && Date.now() > ci.refundAt!.getTime() && <b className="late"> (QUÁ HẠN)</b>}</p>
                    {ci.phase === "confirmed" && <button className="btn btn-black sm" onClick={() => patch(o, { cancel: { ...o.cancel!, refundedAt: new Date().toISOString() } })}>ĐÁNH DẤU ĐÃ HOÀN TIỀN</button>}
                    {ci.phase === "refunded" && <p className="refund-info ok">Đã hoàn tiền lúc {fmt(ci.refundedAt!)}.</p>}
                  </>
                ) : <p className="refund-info">Đơn COD - không cần hoàn tiền.</p>)}
              </div>
            )}

            {!o.cancel && <div className="admin-actions"><Link href={`/admin/invoice/${o.id}`} target="_blank" className="btn btn-outline sm">XUẤT HOÁ ĐƠN</Link></div>}
            {!o.cancel && st !== "delivered" && (
              <div className="admin-actions">
                {st === "processed" && <button className="btn btn-black sm" onClick={() => patch(o, { stage: "shipping" })}>BÀN GIAO VẬN CHUYỂN → ĐANG GIAO</button>}
                {st === "shipping" && <button className="btn btn-black sm" onClick={() => patch(o, { stage: "delivered" })}>ĐÁNH DẤU ĐÃ GIAO</button>}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import RequireAuth from "@/components/RequireAuth";
import Stars from "@/components/Stars";
import { isAdmin } from "@/lib/admin";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { loyaltyOf } from "@/lib/loyalty";
import { addReview, compressImage, useReviews } from "@/lib/reviews";
import { toast } from "@/lib/toast";
import { OTHER_REASON, canCancel, cancelInfo, cancelReasons, isOnlinePay, readOrders, stageOf, stages, updateOrder, type Order, type Stage } from "@/lib/orders";
import { formatVnd, getProduct, products, thumb } from "@/lib/products";

type Tab = Stage | "cancelled" | "all";
const payLabel: Record<string, string> = { cod: "Thanh toán khi nhận hàng (COD)", vnpay: "VNPAY-QR", momo: "Ví MoMo", card: "Thẻ Visa / Mastercard" };
const fmt = (d: Date) => d.toLocaleString("vi-VN");

function CancelModal({ order, onClose, onConfirm }: { order: Order; onClose: () => void; onConfirm: (reason: string, note: string) => void }) {
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const online = isOnlinePay(order);

  function submit() {
    if (!reason) { setErr("Vui lòng chọn lý do huỷ đơn."); return; }
    if (reason === OTHER_REASON && !note.trim()) { setErr("Vui lòng mô tả lý do của bạn."); return; }
    onConfirm(reason, note.trim());
  }

  return (
    <div className="modal-wrap" role="dialog" aria-modal="true" aria-label="Huỷ đơn hàng">
      <div className="modal-bg" onClick={onClose} />
      <div className="modal">
        <h3>HUỶ ĐƠN #{order.id}</h3>
        <p className="muted small">Chọn lý do huỷ để chúng tôi phục vụ bạn tốt hơn.</p>
        <div className="reasons">
          {cancelReasons.map((r) => (
            <label key={r} className={reason === r ? "radio on" : "radio"}>
              <input type="radio" name="reason" checked={reason === r} onChange={() => { setReason(r); setErr(""); }} />{r}
            </label>
          ))}
        </div>
        <label className="field note-field"><span>GHI CHÚ THÊM {reason === OTHER_REASON ? "(BẮT BUỘC)" : "(TUỲ CHỌN)"}</span>
          <textarea rows={2} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <div className="refund-info">
          {online
            ? <>💳 Sau khi shop xác nhận huỷ đơn, tiền <b>{formatVnd(order.total)}</b> sẽ được hoàn về <b>{payLabel[order.pay] ?? order.pay}</b> <b>sau 24 giờ</b> kể từ lúc shop xác nhận.</>
            : <>💵 Đơn thanh toán khi nhận hàng (COD) - bạn chưa trả tiền nên không phát sinh hoàn tiền.</>}
        </div>
        {err && <p className="form-err">{err}</p>}
        <div className="modal-actions">
          <button className="btn btn-outline" onClick={onClose}>GIỮ ĐƠN HÀNG</button>
          <button className="btn btn-red" onClick={submit}>XÁC NHẬN HUỶ ĐƠN</button>
        </div>
      </div>
    </div>
  );
}

const ratingText = ["", "Rất tệ", "Tệ", "Bình thường", "Tốt", "Tuyệt vời"];

function ReviewModal({ item, onClose, onSubmit }: { item: { name: string; slug: string }; onClose: () => void; onSubmit: (rating: number, text: string, images: string[]) => void }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const p = getProduct(item.slug);

  async function pick(files: FileList | null) {
    if (!files) return;
    const room = 3 - images.length;
    const list = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, room);
    if (!list.length) return;
    setBusy(true); setErr("");
    try { setImages([...images, ...(await Promise.all(list.map((f) => compressImage(f))))]); }
    catch { setErr("Không đọc được ảnh, hãy thử ảnh khác."); }
    setBusy(false);
  }
  const shown = hover || rating;
  return (
    <div className="modal-wrap" role="dialog" aria-modal="true" aria-label="Đánh giá sản phẩm">
      <div className="modal-bg" onClick={onClose} />
      <div className="modal">
        <h3>ĐÁNH GIÁ SẢN PHẨM</h3>
        <div className="rv-prod">{p && <div className="sum-img"><Image src={thumb(p.image)} alt="" fill sizes="56px" /></div>}<b>{item.name}</b></div>
        <div className="star-pick" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" className={n <= shown ? "on" : ""} onMouseEnter={() => setHover(n)} onClick={() => { setRating(n); setErr(""); }} aria-label={`${n} sao`}>★</button>
          ))}
          <span>{shown ? ratingText[shown] : "Chọn số sao"}</span>
        </div>
        <label className="field note-field"><span>NHẬN XÉT (TUỲ CHỌN)</span>
          <textarea rows={3} maxLength={500} value={text} onChange={(e) => setText(e.target.value)} placeholder="Chất liệu, form dáng, size, giao hàng..." />
        </label>
        <div className="photo-pick">
          <span>ẢNH THỰC TẾ (TỐI ĐA 3)</span>
          <div className="photo-row">
            {images.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <div key={i} className="photo"><img src={src} alt={`Ảnh ${i + 1}`} /><button type="button" onClick={() => setImages(images.filter((_, n) => n !== i))} aria-label="Xoá ảnh">✕</button></div>
            ))}
            {images.length < 3 && (
              <label className="photo add">{busy ? "..." : "+ Thêm ảnh"}<input type="file" accept="image/*" multiple hidden onChange={(e) => { pick(e.target.files); e.target.value = ""; }} /></label>
            )}
          </div>
        </div>
        {err && <p className="form-err">{err}</p>}
        <div className="modal-actions">
          <button className="btn btn-outline" onClick={onClose}>ĐỂ SAU</button>
          <button className="btn btn-black" disabled={busy} onClick={() => (rating ? onSubmit(rating, text.trim(), images) : setErr("Vui lòng chọn số sao."))}>GỬI ĐÁNH GIÁ</button>
        </div>
      </div>
    </div>
  );
}

function List() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState("");
  const router = useRouter();
  const cart = useCart();
  const [cancelling, setCancelling] = useState<Order | null>(null);
  const [reviewing, setReviewing] = useState<{ order: Order; name: string; slug: string } | null>(null);
  const allReviews = useReviews();

  useEffect(() => { if (user) setOrders(readOrders(user.email)); }, [user]);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 5000); return () => clearInterval(t); }, []);
  if (!orders || !user) return null;

  const statusOf = (o: Order): Stage | "cancelled" => (o.cancel ? "cancelled" : stageOf(o, now));
  const withStatus = orders.map((o) => ({ o, s: statusOf(o) }));
  const count = (k: Tab) => (k === "all" ? withStatus.length : withStatus.filter((x) => x.s === k).length);
  const term = q.trim().toLowerCase();
  const shown = withStatus.filter((x) => (tab === "all" || x.s === tab) && (!term || (x.o.id + x.o.items.map((i) => i.name).join(" ")).toLowerCase().includes(term)));
  const loy = loyaltyOf(orders);
  const spent = orders.filter((o) => !o.cancel).reduce((n, o) => n + o.total, 0);
  const boughtSlugs = new Set(orders.flatMap((o) => o.items.map((i) => i.slug)));
  const suggestions = products.filter((p) => !boughtSlugs.has(p.slug)).slice(0, 4);
  const reorder = (o: Order) => { o.items.forEach((i) => { if (getProduct(i.slug)) cart.add(i.slug, i.size, i.qty, i.note); }); cart.setOpen(false); toast(`${o.items.length} sản phẩm từ đơn #${o.id} đã vào giỏ hàng.`, { title: "Đã thêm vào giỏ hàng", id: "cart" }); router.push("/cart"); };
  const tabs: { key: Tab; label: string }[] = [{ key: "all", label: "Tất cả" }, ...stages, { key: "cancelled", label: "Đã huỷ" }];

  function confirmCancel(reason: string, note: string) {
    if (!cancelling) return;
    updateOrder(user!.email, cancelling.id, { cancel: { reason, note: note || undefined, requestedAt: new Date().toISOString() } });
    setOrders(readOrders(user!.email));
    setCancelling(null);
    setNow(Date.now());
    setTab("cancelled");
    toast(`Đơn #${cancelling.id} đã được huỷ.`, { type: "info", title: "Huỷ đơn thành công" });
  }

  return (
    <div className="container section">
      <h1 className="h1">THEO DÕI ĐƠN HÀNG</h1>

      <div className="stats ot-stats">
        <div className="stat"><small>TỔNG ĐƠN HÀNG</small><b>{orders.length}</b><span>{orders.filter((o) => o.cancel).length} đơn đã huỷ</span></div>
        <div className="stat"><small>ĐANG XỬ LÝ / GIAO</small><b>{count("processed") + count("shipping")}</b><span>{count("processed")} đã xử lý · {count("shipping")} đang giao</span></div>
        <div className="stat"><small>ĐÃ GIAO</small><b>{count("delivered")}</b><span>Có thể đánh giá sản phẩm</span></div>
        <div className="stat"><small>TỔNG ĐÃ MUA</small><b>{formatVnd(spent)}</b><span>Không tính đơn huỷ</span></div>
        {!isAdmin(user.email) && <Link href="/account/points" className="stat link"><small>ĐIỂM · THẺ {loy.tier.name.toUpperCase()}</small><b>{loy.balance.toLocaleString("vi-VN")}</b><span>Tích {loy.tier.rate}% mỗi đơn · Xem điểm →</span></Link>}
      </div>

      <input className="admin-search ot-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔎  Tìm theo mã đơn hoặc tên sản phẩm..." />

      <div className="status-tabs" role="tablist">
        {tabs.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} className={tab === t.key ? `st on ${t.key}` : `st ${t.key}`} onClick={() => setTab(t.key)}>
            {t.label}<span>{count(t.key)}</span>
          </button>
        ))}
      </div>

      {orders.length === 0 && <p className="muted pad">Bạn chưa có đơn hàng nào. <Link href="/products" className="ul">Mua sắm ngay</Link></p>}
      {orders.length > 0 && shown.length === 0 && <p className="muted pad">Không có đơn hàng nào ở trạng thái này.</p>}

      {shown.map(({ o, s }) => {
        const ci = cancelInfo(o, now);
        const idx = s === "cancelled" ? -1 : stages.findIndex((x) => x.key === s);
        return (
          <div key={o.id} className="order">
            <div className="order-head">
              <b>#{o.id}</b><span>{new Date(o.date).toLocaleString("vi-VN")}</span>
              <span className={`badge st-${s}`}>{s === "cancelled" ? "ĐÃ HUỶ" : stages[idx].label.toUpperCase()}</span>
            </div>

            {ci && o.cancel ? (
              <div className="cancel-box">
                <ol className="stepper cancel">
                  <li className="done"><i>✓</i><span>Đã gửi yêu cầu huỷ</span></li>
                  <li className={ci.phase === "pending" ? "now" : "done"}><i>{ci.phase === "pending" ? "2" : "✓"}</i><span>{ci.phase === "pending" ? "Chờ shop xác nhận" : "Shop đã xác nhận huỷ"}</span></li>
                  {isOnlinePay(o) && <li className={ci.phase === "refunded" ? "done" : ci.phase === "confirmed" ? "now" : ""}><i>{ci.phase === "refunded" ? "✓" : "3"}</i><span>{ci.phase === "refunded" ? "Đã hoàn tiền" : "Hoàn tiền sau 24 giờ"}</span></li>}
                </ol>
                <p><b>Lý do huỷ:</b> {o.cancel.reason}{o.cancel.note && <em className="note"> “{o.cancel.note}”</em>}</p>
                {!isOnlinePay(o)
                  ? <p className="refund-info">💵 Đơn thanh toán khi nhận hàng (COD) - không phát sinh hoàn tiền.</p>
                  : ci.phase === "pending"
                    ? <p className="refund-info">⏳ Đang chờ shop xác nhận huỷ. Tiền <b>{formatVnd(o.total)}</b> sẽ được hoàn về <b>{payLabel[o.pay] ?? o.pay}</b> sau 24 giờ kể từ lúc shop xác nhận.</p>
                    : ci.phase === "confirmed"
                      ? <p className="refund-info">✅ Shop đã xác nhận huỷ lúc {fmt(ci.confirmedAt!)}. Tiền <b>{formatVnd(o.total)}</b> sẽ được hoàn về <b>{payLabel[o.pay] ?? o.pay}</b> vào lúc <b>{fmt(ci.refundAt!)}</b> (24 giờ sau khi xác nhận).</p>
                      : <p className="refund-info ok">💰 Đã hoàn <b>{formatVnd(o.total)}</b> về {payLabel[o.pay] ?? o.pay} lúc {fmt(ci.refundedAt!)}.</p>}
              </div>
            ) : (
              <ol className="stepper">
                {stages.map((st, i) => (
                  <li key={st.key} className={i < idx ? "done" : i === idx ? "now" : ""}><i>{i <= idx ? "✓" : i + 1}</i><span>{st.label}</span></li>
                ))}
              </ol>
            )}

            {o.items.map((i, n) => (
              <div key={n} className="sum-line item-row">{getProduct(i.slug) && <div className="sum-img"><Image src={thumb(getProduct(i.slug)!.image)} alt="" fill sizes="56px" /></div>}<span className="sum-name">{i.name}<small> · {i.size} × {i.qty}</small>{i.note && <em className="note"> Ghi chú: {i.note}</em>}</span><b>{formatVnd(i.price * i.qty)}</b>
                {s === "delivered" && (() => {
                  const mine = allReviews.find((r) => r.email === user.email && r.slug === i.slug && r.orderId === o.id);
                  return mine
                    ? <span className="reviewed"><Stars value={mine.rating} /> Đã đánh giá</span>
                    : <button className="review-btn" onClick={() => setReviewing({ order: o, name: i.name, slug: i.slug })}>★ Đánh giá</button>;
                })()}
              </div>
            ))}
            <p className="small muted">Giao tới: {o.name} · {o.phone} · {o.address}</p>
            {!!o.pointsUsed && <div className="sum-line disc"><span>Dùng {o.pointsUsed.toLocaleString("vi-VN")} điểm</span><b>−{formatVnd(o.pointsUsed)}</b></div>}
            {!!o.earnPoints && !o.cancel && <p className="small muted">⭐ {s === "delivered" ? "Đã tích" : "Sẽ tích"} {o.earnPoints.toLocaleString("vi-VN")} điểm ({o.tierName} · {o.earnRate}%){s === "delivered" ? "" : " khi giao thành công"}</p>}
            {!!o.discount && <div className="sum-line disc"><span>Voucher {o.voucher}</span><b>−{formatVnd(o.discount)}</b></div>}
            <div className="sum-total"><span>TỔNG</span><b>{formatVnd(o.total)}</b></div>
            <div className="order-foot">
              {canCancel(o, now) && <button className="cancel-btn" onClick={() => setCancelling(o)}>Huỷ đơn hàng</button>}
              <button className="reorder-btn" onClick={() => reorder(o)}>🔁 Mua lại</button>
              <Link href="/help" className="ul small">Cần hỗ trợ về đơn này?</Link>
            </div>
            {!o.cancel && s !== "processed" && s !== "cancelled" && <p className="small muted cancel-hint">Đơn đã bàn giao cho đơn vị vận chuyển nên không thể huỷ.</p>}
          </div>
        );
      })}

      {orders.length > 0 && (
        <section className="ot-help">
          <div><h3>Cần hỗ trợ về đơn hàng?</h3><p>Đơn đang giao có thể mất 2–5 ngày tuỳ khu vực. Bạn có thể đổi trả miễn phí trong 30 ngày kể từ khi nhận hàng.</p></div>
          <div className="help-cta-btns"><a href="tel:19008899" className="btn btn-black">GỌI 1900 8899</a><Link href="/help" className="btn btn-outline">TRUNG TÂM TRỢ GIÚP</Link></div>
        </section>
      )}

      <section className="section">
        <div className="sec-head"><h2>{orders.length ? "CÓ THỂ BẠN SẼ THÍCH" : "BẮT ĐẦU MUA SẮM"}</h2><Link href="/products" className="more">XEM TẤT CẢ →</Link></div>
        <div className="grid">{suggestions.map((p) => <ProductCard key={p.slug} p={p} />)}</div>
      </section>

      {reviewing && <ReviewModal item={reviewing} onClose={() => setReviewing(null)} onSubmit={(rating, text, images) => { if (addReview({ slug: reviewing.slug, orderId: reviewing.order.id, email: user.email, name: user.name, rating, text, images })) { setReviewing(null); toast("Cảm ơn bạn đã chia sẻ nhận xét về sản phẩm.", { title: "Đánh giá thành công" }); } else toast("Bộ nhớ trình duyệt đã đầy, hãy dùng ít ảnh hơn hoặc ảnh nhỏ hơn.", { type: "error", title: "Chưa gửi được đánh giá" }); }} />}
      {cancelling && <CancelModal order={cancelling} onClose={() => setCancelling(null)} onConfirm={confirmCancel} />}
    </div>
  );
}
export default function Orders() { return <RequireAuth><List /></RequireAuth>; }

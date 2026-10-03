"use client";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import ReviewImages from "@/components/ReviewImages";
import Stars from "@/components/Stars";
import { buildCustomers, statusInfo, type Customer } from "@/lib/customers";
import { MAINTAIN_MONTHS, tiers } from "@/lib/loyalty";
import { readAllOrders, stageOf, stages } from "@/lib/orders";
import { formatVnd, getProduct, thumb } from "@/lib/products";
import { useReviews } from "@/lib/reviews";

const compact = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1).replace(".", ",")} tr` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : String(n));
const day = (d: Date | null) => (d ? d.toLocaleDateString("vi-VN") : "-");

export default function CustomerDetail() {
  const { email: raw } = useParams<{ email: string }>();
  const email = decodeURIComponent(raw);
  const [c, setC] = useState<Customer | null | undefined>(undefined);
  const reviews = useReviews().filter((r) => r.email === email);
  useEffect(() => setC(buildCustomers(readAllOrders()).find((x) => x.email === email) ?? null), [email]);

  if (c === undefined) return null;
  if (c === null) return <><h1 className="h1">KHÔNG TÌM THẤY KHÁCH HÀNG</h1><Link href="/admin/customers" className="ul">← Danh sách khách hàng</Link></>;

  const { loy } = c;
  const mostBought = new Map<string, { name: string; qty: number; money: number }>();
  c.live.forEach((o) => o.items.forEach((i) => { const m = mostBought.get(i.slug) ?? { name: i.name, qty: 0, money: 0 }; m.qty += i.qty; m.money += i.price * i.qty; mostBought.set(i.slug, m); }));
  const top = [...mostBought.entries()].sort((a, b) => b[1].money - a[1].money).slice(0, 5);
  const progress = loy.next ? Math.min(100, ((loy.spend12m - loy.tier.min) / (loy.next.min - loy.tier.min)) * 100) : 100;

  return (
    <div className="od">
      <Link href="/admin/customers" className="od-back">← Danh sách khách hàng</Link>
      <div className="od-sheet">
        <header className="od-hero">
          <div className="cust-top">
            <span className="avatar lg">{c.name.trim().charAt(0).toUpperCase()}</span>
            <div>
              <small>KHÁCH HÀNG</small>
              <h1 style={{ fontSize: "clamp(26px,3.4vw,42px)", margin: "0 0 8px" }}>{c.name}</h1>
              <div className="od-meta">
                <span className="tier-pill dark"><i className="tier-dot" style={{ background: loy.tier.color }} /> Thẻ {loy.tier.name} · {loy.tier.rate}%</span>
                <i className={`cs cs-${c.status}`} title={statusInfo[c.status].hint}>{statusInfo[c.status].label}</i>
              </div>
            </div>
          </div>
          <div className="od-total">
            <small>TỔNG CHI TIÊU</small>
            <b>{formatVnd(c.spent)}</b>
            <span className="muted">{c.live.length} đơn thành công</span>
          </div>
        </header>

        <div className="od-stats">
          <div><i>🧾</i><b>{c.live.length}</b><small>Đơn thành công{c.orders.length > c.live.length ? ` · ${c.orders.length - c.live.length} huỷ` : ""}</small></div>
          <div><i>📊</i><b>{formatVnd(c.avg)}</b><small>Giá trị TB mỗi đơn</small></div>
          <div><i>⭐</i><b>{loy.balance.toLocaleString("vi-VN")}</b><small>Điểm khả dụng{loy.pending ? ` · ${loy.pending.toLocaleString("vi-VN")} chờ cộng` : ""}</small></div>
          <div><i>📅</i><b>{day(c.lastOrder)}</b><small>Mua gần nhất</small></div>
        </div>

        <div className="od-grid">
          <div className="od-col">
            <section className="od-card">
              <h3>LỊCH SỬ ĐƠN HÀNG ({c.orders.length})</h3>
              {c.orders.length === 0 && <p className="muted small">Khách chưa có đơn hàng nào.</p>}
              {c.orders.map((o) => (
                <Link key={o.id} href={`/admin/orders/${o.id}`} className="hist">
                  <div><b>#{o.id}</b><small className="muted">{new Date(o.date).toLocaleDateString("vi-VN")}</small></div>
                  <span className="hist-items">{o.items.map((i) => `${i.name} ×${i.qty}`).join(", ")}</span>
                  <span className={`badge ${o.cancel ? "st-cancelled" : `st-${stageOf(o)}`}`}>{o.cancel ? "ĐÃ HUỶ" : stages.find((s) => s.key === stageOf(o))!.label.toUpperCase()}</span>
                  <b>{formatVnd(o.total)}</b>
                </Link>
              ))}
            </section>

            <section className="od-card">
              <h3>SẢN PHẨM KHÁCH MUA NHIỀU NHẤT</h3>
              {top.length === 0 && <p className="muted small">Chưa có dữ liệu.</p>}
              {top.map(([slug, m]) => {
                const p = getProduct(slug);
                return (
                  <div key={slug} className="dt-item">
                    <div className="sum-img">{p && <Image src={thumb(p.image)} alt="" fill sizes="56px" />}</div>
                    <div>{p ? <Link href={`/admin/products/${slug}`} className="ul"><b>{m.name}</b></Link> : <b>{m.name}</b>}<small className="muted"> · {m.qty} sản phẩm</small></div>
                    <b>{formatVnd(m.money)}</b>
                  </div>
                );
              })}
            </section>

            <section className="od-card">
              <h3>ĐÁNH GIÁ CỦA KHÁCH ({reviews.length})</h3>
              {reviews.length === 0 && <p className="muted small">Khách chưa đánh giá sản phẩm nào.</p>}
              {reviews.map((r) => (
                <article key={r.id} className="rv"><div className="rv-head"><b>{getProduct(r.slug)?.name ?? r.slug}</b><small>{new Date(r.date).toLocaleDateString("vi-VN")}</small></div><Stars value={r.rating} />{r.text && <p>{r.text}</p>}<ReviewImages images={r.images} /></article>
              ))}
            </section>
          </div>

          <aside className="od-col">
            <section className="od-card cust-card" style={{ ["--tier" as string]: loy.tier.color }}>
              <h3>THÔNG TIN LIÊN HỆ</h3>
              <ul className="contact">
                <li><i>👤</i><div><small>Họ tên</small><b>{c.name}</b></div></li>
                <li><i>✉️</i><div><small>Email / tài khoản</small><b>{c.email}</b></div><a href={`mailto:${c.email}`} className="mini-btn">Gửi mail</a></li>
                <li><i>📞</i><div><small>Điện thoại</small><b>{c.phone || "Chưa có (khách chưa đặt đơn nào)"}</b></div>{c.phone && <a href={`tel:${c.phone}`} className="mini-btn">Gọi</a>}</li>
                <li><i>📍</i><div><small>Địa chỉ gần nhất</small><b>{c.address || "-"}</b></div></li>
              </ul>
              <dl className="kv"><dt>Mua lần đầu</dt><dd>{day(c.firstOrder)}</dd></dl>
            </section>

            <section className="od-card">
              <h3>THẺ HỘI VIÊN</h3>
              <dl className="kv">
                <dt>Hạng hiện tại</dt><dd><span className="tier-pill"><i className="tier-dot" style={{ background: loy.tier.color }} /> {loy.tier.name} · tích {loy.tier.rate}%</span></dd>
                <dt>Chi tiêu 12 tháng</dt><dd><b>{formatVnd(loy.spend12m)}</b></dd>
                <dt>Giữ hạng đến</dt><dd>{loy.deadline ? <>{day(loy.deadline)}{loy.lapsed && <small className="late"> (đã quá hạn, hạng bị hạ {loy.lapses} bậc)</small>}</> : "-"}</dd>
              </dl>
              {loy.next ? (
                <div className="tier-prog"><div className="prog"><i style={{ width: `${progress}%`, background: loy.next.color }} /></div><small>Còn <b>{formatVnd(loy.toNext)}</b> để lên hạng {loy.next.name} ({loy.next.rate}%)</small></div>
              ) : <small>🎉 Đã đạt hạng cao nhất.</small>}
              <small className="muted">Quy định: mua ít nhất 1 sản phẩm mỗi {MAINTAIN_MONTHS} tháng để giữ hạng.</small>
            </section>

            <section className="od-card">
              <h3>ĐIỂM THƯỞNG</h3>
              <div className="tiles3">
                <div><b>{compact(loy.earned)}</b><small>Tổng đã tích</small></div>
                <div><b>{compact(loy.spent)}</b><small>Đã dùng</small></div>
                <div><b>{compact(loy.balance)}</b><small>Khả dụng</small></div>
              </div>
              {loy.pending > 0 && <small className="muted">+ {loy.pending.toLocaleString("vi-VN")} điểm chờ cộng khi đơn giao thành công.</small>}
              <small className="muted">Các mức hạng: {tiers.map((t) => `${t.name} ${t.rate}%`).join(" · ")}</small>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

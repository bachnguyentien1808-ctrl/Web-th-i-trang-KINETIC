"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { readUsers } from "@/lib/admin";
import { readAllOrders, stageOf, stages, type OrderWithOwner } from "@/lib/orders";
import { formatVnd, products, thumb } from "@/lib/products";
import { buildBuckets } from "@/lib/revenue";

const short = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)}tr` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(n));

export default function Dashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderWithOwner[] | null>(null);
  const [customers, setCustomers] = useState(0);
  useEffect(() => { setOrders(readAllOrders()); setCustomers(readUsers().length); }, []);
  if (!orders) return null;

  const live = orders.filter((o) => !o.cancel);
  const revenue = live.reduce((n, o) => n + o.total, 0);
  const cancelled = orders.filter((o) => o.cancel).length;
  const pendingCancel = orders.filter((o) => o.cancel && !o.cancel.confirmedAt).length;
  const refundDue = orders.filter((o) => o.cancel?.confirmedAt && !o.cancel.refundedAt && o.pay !== "cod").length;
  const aov = live.length ? Math.round(revenue / live.length) : 0;
  const todayStr = new Date().toDateString();
  const today = live.filter((o) => new Date(o.date).toDateString() === todayStr);
  const todayRev = today.reduce((n, o) => n + o.total, 0);

  const days = buildBuckets(orders, "day", false).slice(-14);
  const maxDay = Math.max(1, ...days.map((d) => d.revenue));
  const rev14 = days.reduce((n, d) => n + d.revenue, 0);

  const byStage = [
    ...stages.map((s, i) => ({ label: s.label, n: live.filter((o) => stageOf(o) === s.key).length, color: ["#f5c400", "#3b82f6", "#16a34a"][i] })),
    { label: "Đã huỷ", n: cancelled, color: "#e11d2e" },
  ];
  const totalOrders = Math.max(1, orders.length);
  let acc = 0;
  const donut = byStage.map((s) => { const a = acc; acc += (s.n / totalOrders) * 100; return `${s.color} ${a}% ${acc}%`; }).join(",");

  const sold = new Map<string, number>();
  live.forEach((o) => o.items.forEach((i) => sold.set(i.slug, (sold.get(i.slug) ?? 0) + i.qty)));
  const top = [...sold.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topMax = Math.max(1, ...top.map((t) => t[1]));

  const kpis = [
    { icon: "💰", label: "Doanh thu", value: formatVnd(revenue), hint: `Hôm nay ${formatVnd(todayRev)}`, tone: "volt" },
    { icon: "🧾", label: "Đơn hàng", value: String(orders.length), hint: `${live.length} còn hiệu lực · ${today.length} hôm nay`, tone: "blue" },
    { icon: "👥", label: "Khách hàng", value: String(customers), hint: "Tài khoản đã đăng ký", tone: "green" },
    { icon: "📈", label: "Giá trị TB / đơn", value: formatVnd(aov), hint: "Trên đơn còn hiệu lực", tone: "violet" },
  ];
  const alerts = [
    { n: pendingCancel, text: "yêu cầu huỷ chờ xác nhận", href: "/admin/orders" },
    { n: refundDue, text: "đơn hoàn tiền chờ xử lý", href: "/admin/orders" },
  ].filter((a) => a.n > 0);
  const hour = new Date().getHours();
  const hi = hour < 11 ? "Chào buổi sáng" : hour < 18 ? "Chào buổi chiều" : "Chào buổi tối";

  return (
    <>
      <section className="dash-hero">
        <div>
          <small>{new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}</small>
          <h1>{hi}{user ? `, ${user.name}` : ""} 👋</h1>
          <p>Hôm nay có <b>{today.length}</b> đơn mới · doanh thu <b>{formatVnd(todayRev)}</b>.</p>
        </div>
        <div className="dash-quick">
          <Link href="/admin/orders">Xử lý đơn hàng</Link>
          <Link href="/admin/products/new">+ Thêm sản phẩm</Link>
          <Link href="/admin/vouchers">+ Tạo voucher</Link>
        </div>
      </section>

      {alerts.length > 0 && (
        <div className="dash-alerts">
          {alerts.map((a) => <Link key={a.text} href={a.href}><b>{a.n}</b> {a.text} <span>Xử lý ngay →</span></Link>)}
        </div>
      )}

      <div className="dash-kpis">
        {kpis.map((k) => (
          <div key={k.label} className={`dash-kpi ${k.tone}`}>
            <span className="ico">{k.icon}</span>
            <div><small>{k.label}</small><b>{k.value}</b><em>{k.hint}</em></div>
          </div>
        ))}
      </div>

      <div className="dash-row">
        <section className="panel dash-chart">
          <div className="panel-head"><h3>DOANH THU 14 NGÀY QUA</h3><span className="dash-total">{formatVnd(rev14)}</span></div>
          <div className="dash-bars">
            {days.map((d) => (
              <div key={d.key} className="dash-col" title={`${d.label}: ${formatVnd(d.revenue)} · ${d.orders} đơn`}>
                <span className="v">{d.revenue ? short(d.revenue) : ""}</span>
                <div className="b"><i style={{ height: `${(d.revenue / maxDay) * 100}%` }} /></div>
                <span className="l">{d.label}</span>
              </div>
            ))}
          </div>
          <Link href="/admin/revenue" className="ul">Xem báo cáo doanh thu chi tiết →</Link>
        </section>

        <section className="panel dash-status">
          <h3>ĐƠN THEO TRẠNG THÁI</h3>
          <div className="donut-wrap">
            <div className="donut" style={{ background: orders.length ? `conic-gradient(${donut})` : "#eee" }}><span><b>{orders.length}</b>đơn</span></div>
            <ul>
              {byStage.map((s) => <li key={s.label}><i style={{ background: s.color }} />{s.label}<b>{s.n}</b></li>)}
            </ul>
          </div>
        </section>
      </div>

      <div className="dash-row two">
        <section className="panel">
          <div className="panel-head"><h3>BÁN CHẠY NHẤT</h3><Link href="/admin/products" className="ul">{products.length} sản phẩm →</Link></div>
          {top.length === 0 && <p className="muted small">Chưa có dữ liệu bán hàng.</p>}
          {top.map(([slug, n], i) => {
            const p = products.find((x) => x.slug === slug);
            return (
              <Link key={slug} href={`/admin/products/${slug}`} className="dash-top">
                <em>{i + 1}</em>
                <span className="img">{p && <Image src={thumb(p.image)} alt="" fill sizes="44px" />}</span>
                <div><b>{p?.name ?? slug}</b><div className="meter"><i style={{ width: `${(n / topMax) * 100}%` }} /></div></div>
                <strong>{n}</strong>
              </Link>
            );
          })}
        </section>

        <section className="panel">
          <div className="panel-head"><h3>ĐƠN HÀNG MỚI NHẤT</h3><Link href="/admin/orders" className="ul">Tất cả →</Link></div>
          {orders.slice(0, 6).map((o) => {
            const st = o.cancel ? { cls: "cancelled", label: "Đã huỷ" } : { cls: stageOf(o), label: stages.find((s) => s.key === stageOf(o))?.label ?? "" };
            return (
              <div key={o.id + o.email} className="dash-order">
                <Link href={`/admin/customers/${encodeURIComponent(o.email)}`} className="do-cust" title="Xem khách hàng">
                  <span className="av">{o.name.trim().charAt(0).toUpperCase() || "?"}</span>
                  <div><b>{o.name}</b><small>{o.email}</small></div>
                </Link>
                <Link href={`/admin/orders/${o.id}`} className="do-order" title="Xem đơn hàng">
                  <div><b>#{o.id}</b><small>{new Date(o.date).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}</small></div>
                  <span className={`badge st-${st.cls}`}>{st.label}</span>
                  <strong>{formatVnd(o.total)}</strong>
                </Link>
              </div>
            );
          })}
          {orders.length === 0 && <p className="muted small">Chưa có đơn hàng nào.</p>}
        </section>
      </div>
    </>
  );
}

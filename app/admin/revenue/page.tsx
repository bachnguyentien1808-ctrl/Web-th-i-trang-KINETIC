"use client";
import { useEffect, useMemo, useState } from "react";
import { readAllOrders, type OrderWithOwner } from "@/lib/orders";
import { formatVnd } from "@/lib/products";
import { buildBuckets, periods, type Bucket, type Period } from "@/lib/revenue";

const short = (n: number) => (n >= 1e9 ? `${(n / 1e9).toFixed(1)} tỷ` : n >= 1e6 ? `${(n / 1e6).toFixed(1)}tr` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(n));

function BarChart({ buckets }: { buckets: Bucket[] }) {
  const max = Math.max(1, ...buckets.map((b) => b.revenue));
  return (
    <div className="chart" role="img" aria-label="Biểu đồ doanh thu">
      {buckets.map((b, i) => (
        <div key={b.key} className="col" title={`${b.label}: ${formatVnd(b.revenue)} · ${b.orders} đơn`}>
          <span className="val">{b.revenue ? short(b.revenue) : ""}</span>
          <div className="bar"><i className={i === buckets.length - 1 ? "now" : ""} style={{ height: `${(b.revenue / max) * 100}%` }} /></div>
          <small>{b.label}</small>
        </div>
      ))}
    </div>
  );
}

function RevTable({ buckets, label }: { buckets: Bucket[]; label: string }) {
  return (
    <div className="table rev">
      <div className="tr th"><span>{label}</span><span>Số đơn</span><span>Giảm giá (voucher)</span><span>Doanh thu</span></div>
      {[...buckets].reverse().map((b) => (
        <div key={b.key} className="tr"><span><b>{b.label}</b></span><span>{b.orders}</span><span>{b.discount ? `−${formatVnd(b.discount)}` : "-"}</span><span><b>{formatVnd(b.revenue)}</b></span></div>
      ))}
    </div>
  );
}

export default function Revenue() {
  const [orders, setOrders] = useState<OrderWithOwner[] | null>(null);
  const [period, setPeriod] = useState<Period>("day");
  const [deliveredOnly, setDeliveredOnly] = useState(false);
  useEffect(() => setOrders(readAllOrders()), []);

  const buckets = useMemo(() => (orders ? buildBuckets(orders, period, deliveredOnly) : []), [orders, period, deliveredOnly]);
  const overview = useMemo(() => (orders ? (["month", "quarter", "year"] as Period[]).map((p) => ({ p, b: buildBuckets(orders, p, deliveredOnly) })) : []), [orders, deliveredOnly]);
  if (!orders) return null;

  const meta = periods.find((p) => p.key === period)!;
  const cur = buckets[buckets.length - 1];
  const before = buckets[buckets.length - 2];
  const total = buckets.reduce((n, b) => n + b.revenue, 0);
  const totalOrders = buckets.reduce((n, b) => n + b.orders, 0);
  const change = before && before.revenue > 0 ? ((cur.revenue - before.revenue) / before.revenue) * 100 : null;
  const best = buckets.reduce((a, b) => (b.revenue > a.revenue ? b : a), buckets[0]);
  const curName = { day: "Hôm nay", week: "Tuần này", month: "Tháng này", quarter: "Quý này", year: "Năm nay" }[period];

  return (
    <>
      <h1 className="h1">DOANH THU</h1>
      <div className="rev-controls">
        <div className="seg">
          {periods.map((p) => <button key={p.key} className={period === p.key ? "on" : ""} onClick={() => setPeriod(p.key)}>{p.label}</button>)}
        </div>
        <label className="chk"><input type="checkbox" checked={deliveredOnly} onChange={(e) => setDeliveredOnly(e.target.checked)} /> Chỉ tính đơn đã giao</label>
      </div>
      <p className="muted small">{meta.hint}. {deliveredOnly ? "Chỉ tính đơn đã giao." : "Tính mọi đơn không bị huỷ."} Doanh thu là tổng thanh toán của khách (đã trừ voucher và điểm, gồm phí ship).</p>

      <div className="stats">
        <div className="stat"><small>{curName.toUpperCase()}</small><b>{formatVnd(cur.revenue)}</b>
          {change !== null ? <span className={change >= 0 ? "up" : "down"}>{change >= 0 ? "▲" : "▼"} {Math.abs(change).toFixed(0)}% so với kỳ trước</span> : <span>Chưa có kỳ trước để so sánh</span>}</div>
        <div className="stat"><small>SỐ ĐƠN {curName.toUpperCase()}</small><b>{cur.orders}</b><span>Giá trị TB: {cur.orders ? formatVnd(Math.round(cur.revenue / cur.orders)) : "-"}</span></div>
        <div className="stat"><small>TỔNG {meta.count} KỲ</small><b>{formatVnd(total)}</b><span>{totalOrders} đơn</span></div>
        <div className="stat"><small>KỲ CAO NHẤT</small><b>{best.revenue ? formatVnd(best.revenue) : "-"}</b><span>{best.revenue ? best.label : "Chưa có doanh thu"}</span></div>
      </div>

      <section className="panel">
        <h3>BIỂU ĐỒ DOANH THU THEO {meta.label.toUpperCase()}</h3>
        <BarChart buckets={buckets} />
      </section>
      <RevTable buckets={buckets} label={meta.label} />

      <h2 className="rev-sub">TỔNG HỢP THEO THÁNG · QUÝ · NĂM</h2>
      <div className="admin-grid three">
        {overview.map(({ p, b }) => {
          const m = periods.find((x) => x.key === p)!;
          return (
            <section key={p} className="panel">
              <h3>THEO {m.label.toUpperCase()}</h3>
              <small className="muted">{m.hint}</small>
              <BarChart buckets={b} />
              <RevTable buckets={b} label={m.label} />
            </section>
          );
        })}
      </div>
    </>
  );
}

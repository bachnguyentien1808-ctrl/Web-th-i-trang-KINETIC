"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { buildCustomers, statusInfo, type Customer, type CustomerStatus } from "@/lib/customers";
import { tiers } from "@/lib/loyalty";
import { readAllOrders } from "@/lib/orders";
import { formatVnd } from "@/lib/products";

type Sort = "spent" | "orders" | "recent" | "name";
const sorts: { key: Sort; label: string }[] = [{ key: "spent", label: "Chi tiêu cao nhất" }, { key: "orders", label: "Nhiều đơn nhất" }, { key: "recent", label: "Mua gần nhất" }, { key: "name", label: "Tên A → Z" }];
const compact = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1).replace(".", ",")} tr` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : String(n));

export default function Customers() {
  const router = useRouter();
  const [list, setList] = useState<Customer[] | null>(null);
  const [q, setQ] = useState("");
  const [tier, setTier] = useState("all");
  const [status, setStatus] = useState<CustomerStatus | "all">("all");
  const [sort, setSort] = useState<Sort>("spent");
  useEffect(() => setList(buildCustomers(readAllOrders())), []);

  const shown = useMemo(() => {
    if (!list) return [];
    const term = q.trim().toLowerCase();
    const out = list.filter((c) => (tier === "all" || c.loy.tier.key === tier) && (status === "all" || c.status === status)
      && (!term || (c.name + c.email + c.phone).toLowerCase().includes(term)));
    const by: Record<Sort, (a: Customer, b: Customer) => number> = {
      spent: (a, b) => b.spent - a.spent, orders: (a, b) => b.live.length - a.live.length, name: (a, b) => a.name.localeCompare(b.name, "vi"),
      recent: (a, b) => (b.lastOrder?.getTime() ?? 0) - (a.lastOrder?.getTime() ?? 0),
    };
    return out.sort(by[sort]);
  }, [list, q, tier, status, sort]);
  if (!list) return null;

  const total = list.reduce((n, c) => n + c.spent, 0);
  const buyers = list.filter((c) => c.live.length > 0).length;
  const vip = list.filter((c) => c.loy.index >= 2).length;
  const count = (s: CustomerStatus) => list.filter((c) => c.status === s).length;

  return (
    <>
      <div className="admin-head"><h1 className="h1">KHÁCH HÀNG</h1></div>

      <div className="stats">
        <div className="stat"><small>TỔNG KHÁCH HÀNG</small><b>{list.length}</b><span>{buyers} đã mua · {count("new")} chưa mua</span></div>
        <div className="stat"><small>TỔNG CHI TIÊU</small><b>{formatVnd(total)}</b><span>Không tính đơn huỷ</span></div>
        <div className="stat"><small>CHI TIÊU TRUNG BÌNH / KHÁCH MUA</small><b>{formatVnd(buyers ? Math.round(total / buyers) : 0)}</b></div>
        <div className="stat"><small>KHÁCH HẠNG VÀNG TRỞ LÊN</small><b>{vip}</b><span>Hạng Vàng, Kim cương</span></div>
        <div className={count("risk") + count("lapsed") ? "stat warn" : "stat"}><small>CẦN CHĂM SÓC</small><b>{count("risk") + count("lapsed")}</b><span>{count("risk")} sắp mất hạng · {count("lapsed")} lâu không mua</span></div>
      </div>

      <section className="panel cust-filters">
        <input className="admin-search" style={{ maxWidth: "none" }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔎  Tìm theo tên, email hoặc số điện thoại..." />
        <div className="cf-row">
          <div className="cf-group"><small>HẠNG THẺ</small>
            <div className="topic-chips">
              <button className={tier === "all" ? "chip on" : "chip"} onClick={() => setTier("all")}>Tất cả</button>
              {tiers.map((t) => <button key={t.key} className={tier === t.key ? "chip on" : "chip"} onClick={() => setTier(t.key)}><i className="tier-dot" style={{ background: t.color }} /> {t.name} ({list.filter((c) => c.loy.tier.key === t.key).length})</button>)}
            </div>
          </div>
          <div className="cf-group"><small>TRẠNG THÁI</small>
            <div className="topic-chips">
              <button className={status === "all" ? "chip on" : "chip"} onClick={() => setStatus("all")}>Tất cả</button>
              {(Object.keys(statusInfo) as CustomerStatus[]).map((s) => <button key={s} className={status === s ? "chip on" : "chip"} title={statusInfo[s].hint} onClick={() => setStatus(s)}>{statusInfo[s].label} ({count(s)})</button>)}
            </div>
          </div>
          <div className="cf-group"><small>SẮP XẾP</small>
            <select className="cf-sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>{sorts.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}</select>
          </div>
        </div>
      </section>

      <p className="muted small">Hiển thị {shown.length} / {list.length} khách hàng. Bấm vào một khách để xem hồ sơ chi tiết.</p>

      <div className="table cust2">
        <div className="tr th"><span>Khách hàng</span><span>Liên hệ</span><span>Hạng thẻ</span><span>Số đơn</span><span>Chi tiêu</span><span>Mua gần nhất</span><span>Trạng thái</span></div>
        {shown.map((c) => (
          <div key={c.email} className="tr click" role="link" tabIndex={0} onClick={() => router.push(`/admin/customers/${encodeURIComponent(c.email)}`)} onKeyDown={(e) => { if (e.key === "Enter") router.push(`/admin/customers/${encodeURIComponent(c.email)}`); }}>
            <span className="who"><span className="avatar">{c.name.trim().charAt(0).toUpperCase()}</span><span><b>{c.name}</b><small className="muted">{c.email}</small></span></span>
            <span>{c.phone ? <><b>{c.phone}</b><small className="muted addr">{c.address}</small></> : <span className="muted">Chưa có</span>}</span>
            <span><span className="tier-pill"><i className="tier-dot" style={{ background: c.loy.tier.color }} /> {c.loy.tier.name} · {c.loy.tier.rate}%</span><small className="muted">{c.loy.balance.toLocaleString("vi-VN")} điểm</small></span>
            <span><b>{c.live.length}</b>{c.orders.length > c.live.length && <small className="muted"> · {c.orders.length - c.live.length} huỷ</small>}</span>
            <span><b>{c.spent ? compact(c.spent) : "-"}</b>{c.live.length > 0 && <small className="muted">TB {compact(c.avg)}/đơn</small>}</span>
            <span>{c.lastOrder ? c.lastOrder.toLocaleDateString("vi-VN") : "-"}</span>
            <span><i className={`cs cs-${c.status}`} title={statusInfo[c.status].hint}>{statusInfo[c.status].label}</i></span>
          </div>
        ))}
        {shown.length === 0 && <p className="muted pad" style={{ padding: 20 }}>Không có khách hàng phù hợp. {list.length === 0 && <>Chưa có tài khoản nào đăng ký. <Link href="/register" className="ul">Đăng ký thử</Link></>}</p>}
      </div>
    </>
  );
}

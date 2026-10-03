"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import RequireAuth from "@/components/RequireAuth";
import { isAdmin } from "@/lib/admin";
import TierLadder from "@/components/TierLadder";
import { useAuth } from "@/lib/auth";
import { loyaltyOf, pointsHistory, type PointEntry, type PointType } from "@/lib/loyalty";
import { readOrders } from "@/lib/orders";
import { formatVnd } from "@/lib/products";

type Tab = "all" | PointType;
const tabs: { key: Tab; label: string }[] = [
  { key: "all", label: "Tất cả" }, { key: "earned", label: "Đã cộng" }, { key: "pending", label: "Chờ cộng" },
  { key: "used", label: "Đã dùng" }, { key: "refund", label: "Hoàn lại" },
];
const typeLabel: Record<PointType, string> = { earned: "ĐÃ CỘNG", pending: "CHỜ CỘNG", used: "ĐÃ DÙNG", refund: "HOÀN LẠI", void: "KHÔNG CỘNG" };
const n = (v: number) => v.toLocaleString("vi-VN");

function Points() {
  const { user } = useAuth();
  if (user && isAdmin(user.email)) notFound(); // admin không có thẻ/điểm hội viên
  const [data, setData] = useState<{ l: ReturnType<typeof loyaltyOf>; h: PointEntry[] } | null>(null);
  const [tab, setTab] = useState<Tab>("all");
  useEffect(() => { if (user) { const o = readOrders(user.email); setData({ l: loyaltyOf(o), h: pointsHistory(o) }); } }, [user]);
  if (!data) return null;

  const { l, h } = data;
  const shown = h.filter((e) => tab === "all" || e.type === tab);
  const count = (k: Tab) => (k === "all" ? h.length : h.filter((e) => e.type === k).length);

  return (
    <div className="container section">
      <div className="pts-top">
        <h1 className="h1">ĐIỂM CỦA TÔI</h1>
        <Link href="/account" className="ul">← Thẻ hội viên</Link>
      </div>

      <div className="pts-hero" style={{ ["--tier" as string]: l.tier.color }}>
        <div>
          <small>ĐIỂM KHẢ DỤNG</small>
          <b>{n(l.balance)}</b>
          <span>= {formatVnd(l.balance)} giảm giá khi thanh toán (1 điểm = 1₫)</span>
        </div>
        <div className="pts-tier"><i className="tier-dot" style={{ background: l.tier.color }} /> Thẻ <b>{l.tier.name}</b> · tích {l.tier.rate}%</div>
      </div>

      <div className="stats">
        <div className="stat"><small>TỔNG ĐIỂM ĐÃ TÍCH</small><b>{n(l.earned)}</b></div>
        <div className="stat"><small>ĐIỂM CHỜ CỘNG</small><b>{n(l.pending)}</b><span>Cộng khi đơn giao thành công</span></div>
        <div className="stat"><small>TỔNG ĐIỂM ĐÃ DÙNG</small><b>{n(l.spent)}</b></div>
      </div>

      <section className="panel ladder-panel">
        <h3>CÁC MỨC THẺ - ĐẠT ĐƯỢC NHƯ THẾ NÀO?</h3>
        <TierLadder l={l} />
      </section>

      <h2 className="rev-sub">LỊCH SỬ ĐIỂM</h2>
      <div className="status-tabs">
        {tabs.map((t) => <button key={t.key} className={tab === t.key ? "st on" : "st"} onClick={() => setTab(t.key)}>{t.label}<span>{count(t.key)}</span></button>)}
      </div>

      {shown.length === 0 && <p className="muted pad">{h.length === 0 ? <>Bạn chưa có giao dịch điểm nào. <Link href="/products" className="ul">Mua sắm để tích điểm</Link></> : "Không có giao dịch nào ở mục này."}</p>}
      <div className="pts-list">
        {shown.map((e) => (
          <div key={e.id} className={`pts-row ${e.type}`}>
            <div><b>{e.desc}</b><small>{e.date.toLocaleString("vi-VN")}</small></div>
            <span className={`badge pt-${e.type}`}>{typeLabel[e.type]}</span>
            <b className="pts-val">{e.type === "void" ? "-" : `${e.points > 0 ? "+" : ""}${n(e.points)}`}</b>
          </div>
        ))}
      </div>
    </div>
  );
}
export default function PointsPage() { return <RequireAuth><Points /></RequireAuth>; }

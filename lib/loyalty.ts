import type { Order } from "./orders";

export interface Tier { key: string; name: string; rate: number; min: number; color: string }

// Hạng thẻ theo tổng chi tiêu (đơn đã giao) trong 12 tháng gần nhất. Tích điểm = rate% giá trị đơn. 1 điểm = 1₫.
export const tiers: Tier[] = [
  { key: "bronze", name: "Đồng", rate: 5, min: 0, color: "#b87333" },
  { key: "silver", name: "Bạc", rate: 10, min: 5_000_000, color: "#9aa3ad" },
  { key: "gold", name: "Vàng", rate: 15, min: 20_000_000, color: "#e0a800" },
  { key: "diamond", name: "Kim cương", rate: 20, min: 50_000_000, color: "#5b6cff" },
];

export const MAINTAIN_MONTHS = 3; // mỗi 3 tháng phải mua ít nhất 1 sản phẩm để giữ hạng
export const ROLLING_MONTHS = 12;
export const MAX_REDEEM_RATIO = 0.5; // dùng điểm tối đa 50% giá trị đơn

const addMonths = (d: Date, n: number) => { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; };

export function loyaltyOf(orders: Order[], now = new Date()) {
  const live = orders.filter((o) => !o.cancel);
  const delivered = live.filter((o) => o.stage === "delivered");

  const since = addMonths(now, -ROLLING_MONTHS);
  const spend12m = delivered.filter((o) => new Date(o.date) >= since).reduce((n, o) => n + o.total + (o.pointsUsed ?? 0), 0);
  let baseIndex = 0;
  tiers.forEach((t, i) => { if (spend12m >= t.min) baseIndex = i; });

  const lastPurchase = live.length ? new Date(Math.max(...live.map((o) => new Date(o.date).getTime()))) : null;
  let lapses = 0;
  if (lastPurchase) while (addMonths(lastPurchase, MAINTAIN_MONTHS * (lapses + 1)) <= now) lapses++;
  const index = Math.max(0, baseIndex - lapses);
  const deadline = lastPurchase ? addMonths(lastPurchase, MAINTAIN_MONTHS) : null;

  const earned = delivered.reduce((n, o) => n + (o.earnPoints ?? 0), 0);
  const spent = live.reduce((n, o) => n + (o.pointsUsed ?? 0), 0);
  const pending = live.filter((o) => o.stage !== "delivered").reduce((n, o) => n + (o.earnPoints ?? 0), 0);
  const next = tiers[index + 1] ?? null;

  return {
    tier: tiers[index], index, baseIndex, lapses, spend12m, lastPurchase, deadline,
    atRisk: !!deadline && deadline > now && deadline.getTime() - now.getTime() < 30 * 86400000,
    lapsed: lapses > 0,
    next, toNext: next ? Math.max(0, next.min - spend12m) : 0,
    balance: Math.max(0, earned - spent), pending, earned, spent,
  };
}
export type Loyalty = ReturnType<typeof loyaltyOf>;

export type PointType = "earned" | "pending" | "used" | "refund" | "void";
export interface PointEntry { id: string; date: Date; type: PointType; points: number; desc: string }

/** Lịch sử điểm dựng từ các đơn hàng (mới nhất trước). Tổng earned + used + refund khớp với số dư. */
export function pointsHistory(orders: Order[]): PointEntry[] {
  const out: PointEntry[] = [];
  for (const o of orders) {
    const date = new Date(o.date);
    if (o.pointsUsed) {
      out.push({ id: `${o.id}-use`, date, type: "used", points: -o.pointsUsed, desc: `Dùng điểm thanh toán đơn #${o.id}` });
      if (o.cancel) out.push({ id: `${o.id}-refund`, date: new Date(o.cancel.requestedAt), type: "refund", points: o.pointsUsed, desc: `Hoàn điểm do huỷ đơn #${o.id}` });
    }
    if (o.earnPoints) {
      const tier = `${o.tierName ?? ""} ${o.earnRate ?? ""}%`.trim();
      if (o.cancel) out.push({ id: `${o.id}-void`, date, type: "void", points: 0, desc: `Đơn #${o.id} bị huỷ - không được cộng ${o.earnPoints.toLocaleString("vi-VN")} điểm` });
      else if (o.stage === "delivered") out.push({ id: `${o.id}-earn`, date, type: "earned", points: o.earnPoints, desc: `Tích điểm đơn #${o.id} (hạng ${tier})` });
      else out.push({ id: `${o.id}-pend`, date, type: "pending", points: o.earnPoints, desc: `Điểm chờ cộng đơn #${o.id} (hạng ${tier}) - cộng khi giao thành công` });
    }
  }
  return out.sort((a, b) => b.date.getTime() - a.date.getTime());
}

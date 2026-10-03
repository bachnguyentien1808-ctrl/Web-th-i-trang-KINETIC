import type { OrderWithOwner } from "./orders";

export type Period = "day" | "week" | "month" | "quarter" | "year";
export interface Bucket { key: string; label: string; start: Date; orders: number; revenue: number; discount: number }

export const periods: { key: Period; label: string; hint: string; count: number }[] = [
  { key: "day", label: "Ngày", hint: "30 ngày gần nhất", count: 30 },
  { key: "week", label: "Tuần", hint: "12 tuần gần nhất (tuần bắt đầu từ thứ Hai)", count: 12 },
  { key: "month", label: "Tháng", hint: "12 tháng gần nhất", count: 12 },
  { key: "quarter", label: "Quý", hint: "8 quý gần nhất", count: 8 },
  { key: "year", label: "Năm", hint: "5 năm gần nhất", count: 5 },
];

const startOf = (d: Date, p: Period) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  if (p === "week") x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); // về thứ Hai
  if (p === "month") x.setDate(1);
  if (p === "quarter") { x.setDate(1); x.setMonth(Math.floor(x.getMonth() / 3) * 3); }
  if (p === "year") { x.setDate(1); x.setMonth(0); }
  return x;
};
const prev = (d: Date, p: Period) => {
  const x = new Date(d);
  if (p === "day") x.setDate(x.getDate() - 1);
  if (p === "week") x.setDate(x.getDate() - 7);
  if (p === "month") x.setMonth(x.getMonth() - 1);
  if (p === "quarter") x.setMonth(x.getMonth() - 3);
  if (p === "year") x.setFullYear(x.getFullYear() - 1);
  return x;
};
const dm = (d: Date) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;

export function labelOf(d: Date, p: Period) {
  if (p === "day") return dm(d);
  if (p === "week") { const e = new Date(d); e.setDate(e.getDate() + 6); return `${dm(d)} – ${dm(e)}`; }
  if (p === "month") return `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  if (p === "year") return String(d.getFullYear());
  return `Q${Math.floor(d.getMonth() / 3) + 1}/${d.getFullYear()}`;
}

/** Doanh thu theo kỳ. Chỉ tính đơn không bị huỷ; deliveredOnly=true thì chỉ tính đơn đã giao. */
export function buildBuckets(orders: OrderWithOwner[], p: Period, deliveredOnly: boolean, now = new Date()): Bucket[] {
  const n = periods.find((x) => x.key === p)!.count;
  const buckets: Bucket[] = [];
  let cur = startOf(now, p);
  for (let i = 0; i < n; i++) {
    buckets.unshift({ key: cur.toISOString(), label: labelOf(cur, p), start: new Date(cur), orders: 0, revenue: 0, discount: 0 });
    cur = prev(cur, p);
  }
  const index = new Map(buckets.map((b) => [b.start.getTime(), b]));
  for (const o of orders) {
    if (o.cancel) continue;
    if (deliveredOnly && o.stage !== "delivered") continue;
    const b = index.get(startOf(new Date(o.date), p).getTime());
    if (!b) continue;
    b.orders += 1; b.revenue += o.total; b.discount += o.discount ?? 0;
  }
  return buckets;
}

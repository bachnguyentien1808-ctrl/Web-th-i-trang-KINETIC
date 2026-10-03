import { isAdmin, readUsers } from "./admin";
import { loyaltyOf, type Loyalty } from "./loyalty";
import type { OrderWithOwner } from "./orders";

export type CustomerStatus = "new" | "active" | "risk" | "lapsed";
export const statusInfo: Record<CustomerStatus, { label: string; hint: string }> = {
  new: { label: "Chưa mua hàng", hint: "Đã đăng ký tài khoản nhưng chưa có đơn" },
  active: { label: "Đang hoạt động", hint: "Có mua hàng trong 3 tháng gần đây" },
  risk: { label: "Sắp mất hạng", hint: "Còn dưới 30 ngày để mua hàng giữ hạng thẻ" },
  lapsed: { label: "Lâu không mua", hint: "Quá 3 tháng không mua, hạng thẻ đã bị hạ" },
};

export interface Customer {
  email: string; name: string; phone: string; address: string;
  orders: OrderWithOwner[]; live: OrderWithOwner[];
  spent: number; avg: number; loy: Loyalty; status: CustomerStatus;
  lastOrder: Date | null; firstOrder: Date | null;
}

/** Gộp tài khoản đã đăng ký với các đơn hàng (kể cả đơn của email chưa có trong danh sách tài khoản). */
export function buildCustomers(orders: OrderWithOwner[]): Customer[] {
  const emails = new Set<string>([...readUsers().map((u) => u.email), ...orders.map((o) => o.email)]);
  const users = new Map(readUsers().map((u) => [u.email, u]));
  const out: Customer[] = [];
  for (const email of emails) {
    if (isAdmin(email)) continue; // tài khoản quản trị không phải khách hàng
    const mine = orders.filter((o) => o.email === email).sort((a, b) => b.date.localeCompare(a.date));
    const live = mine.filter((o) => !o.cancel);
    const loy = loyaltyOf(mine);
    const spent = live.reduce((n, o) => n + o.total, 0);
    const status: CustomerStatus = !live.length ? "new" : loy.lapsed ? "lapsed" : loy.atRisk ? "risk" : "active";
    out.push({
      email, name: users.get(email)?.name ?? mine[0]?.name ?? email, phone: mine[0]?.phone ?? "", address: mine[0]?.address ?? "",
      orders: mine, live, spent, avg: live.length ? Math.round(spent / live.length) : 0, loy, status,
      lastOrder: loy.lastPurchase, firstOrder: mine.length ? new Date(mine[mine.length - 1].date) : null,
    });
  }
  return out;
}

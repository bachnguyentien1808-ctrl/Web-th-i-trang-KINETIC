export interface OrderItem { slug: string; name: string; size: string; qty: number; price: number; note?: string }
export interface Order {
  id: string; date: string; total: number; shipping: number; discount?: number; voucher?: string; pay: string;
  name: string; phone: string; address: string; items: OrderItem[]; status: string;
  pointsUsed?: number; // điểm đã dùng thanh toán (1 điểm = 1₫)
  earnRate?: number; earnPoints?: number; tierName?: string; // điểm sẽ được cộng khi đơn đã giao
  stage?: Stage; // do admin cập nhật; mặc định "processed"
  cancel?: { reason: string; note?: string; requestedAt: string; confirmedAt?: string; refundedAt?: string };
}
const key = (email: string) => `kinetic-orders-v1:${email}`;

export function readOrders(email: string): Order[] {
  try { return JSON.parse(localStorage.getItem(key(email)) || "[]"); } catch { return []; }
}
export function saveOrder(email: string, o: Order) {
  localStorage.setItem(key(email), JSON.stringify([o, ...readOrders(email)]));
}

export type Stage = "processed" | "shipping" | "delivered";
export const stages: { key: Stage; label: string }[] = [
  { key: "processed", label: "Đã xử lý" },
  { key: "shipping", label: "Đang giao đến bạn" },
  { key: "delivered", label: "Đã giao" },
];

// Trạng thái do admin cập nhật; đơn mới luôn bắt đầu ở "Đã xử lý".
export function stageOf(o: Order, _now?: number): Stage {
  return o.stage ?? "processed";
}

export function updateOrder(email: string, id: string, patch: Partial<Order>) {
  localStorage.setItem(key(email), JSON.stringify(readOrders(email).map((o) => (o.id === id ? { ...o, ...patch } : o))));
}

// ===== Huỷ đơn =====
export const cancelReasons = [
  "Muốn thay đổi địa chỉ giao hàng",
  "Muốn đổi sản phẩm (size, màu, số lượng)",
  "Đặt nhầm hoặc trùng đơn",
  "Tìm được giá tốt hơn ở nơi khác",
  "Thủ tục thanh toán quá rắc rối",
  "Không còn nhu cầu mua",
  "Lý do khác",
];
export const OTHER_REASON = "Lý do khác";

// Chỉ huỷ được khi đơn chưa bàn giao cho đơn vị vận chuyển (đang ở bước "Đã xử lý").
export const canCancel = (o: Order, now = Date.now()) => !o.cancel && stageOf(o, now) === "processed";

// Shop (admin) xác nhận huỷ → tiền hoàn sau đúng 24 giờ kể từ lúc xác nhận; admin đánh dấu khi đã hoàn.
export const REFUND_AFTER_MS = 24 * 60 * 60 * 1000;
export const isOnlinePay = (o: Order) => o.pay !== "cod";

export function cancelInfo(o: Order, _now?: number) {
  if (!o.cancel) return null;
  const confirmedAt = o.cancel.confirmedAt ? new Date(o.cancel.confirmedAt) : null;
  const refundAt = confirmedAt ? new Date(confirmedAt.getTime() + REFUND_AFTER_MS) : null;
  const refundedAt = o.cancel.refundedAt ? new Date(o.cancel.refundedAt) : null;
  const phase: "pending" | "confirmed" | "refunded" = !confirmedAt ? "pending" : refundedAt && isOnlinePay(o) ? "refunded" : "confirmed";
  return { phase, confirmedAt, refundAt, refundedAt };
}

export type OrderWithOwner = Order & { email: string };
const PREFIX = "kinetic-orders-v1:";

/** Tất cả đơn của mọi tài khoản trong trình duyệt này (dùng cho trang admin). */
export function readAllOrders(): OrderWithOwner[] {
  const out: OrderWithOwner[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith(PREFIX)) {
      const email = k.slice(PREFIX.length);
      readOrders(email).forEach((o) => out.push({ ...o, email }));
    }
  }
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

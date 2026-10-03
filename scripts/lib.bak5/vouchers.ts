export interface Voucher {
  code: string;
  title: string;
  desc: string;
  minSubtotal: number;
  kind: "percent" | "fixed" | "freeship";
  value: number; // percent (0-100) or amount in VND
  cap?: number; // max discount for percent vouchers
  excludes?: string[]; // mã không dùng chung được
  firstOrderOnly?: boolean; // chỉ dùng cho đơn hàng đầu tiên của tài khoản
}

export const baseVouchers: Voucher[] = [
  { code: "WELCOME50", title: "Giảm 50.000₫ đơn đầu tiên", desc: "Dành cho đơn hàng đầu tiên · Chọn 1 trong 2 với FREESHIP", minSubtotal: 0, kind: "fixed", value: 50000, excludes: ["FREESHIP"], firstOrderOnly: true },
  { code: "KINETIC10", title: "Giảm 10%", desc: "Tối đa 200.000₫ · Đơn từ 500.000₫", minSubtotal: 500000, kind: "percent", value: 10, cap: 200000 },
  { code: "GIAM100K", title: "Giảm 100.000₫", desc: "Đơn từ 1.000.000₫", minSubtotal: 1000000, kind: "fixed", value: 100000 },
  { code: "FREESHIP", title: "Miễn phí vận chuyển", desc: "Cho mọi đơn hàng · Chọn 1 trong 2 với WELCOME50", minSubtotal: 0, kind: "freeship", value: 0, excludes: ["WELCOME50"] },
];

/** Voucher đang dùng = mặc định + voucher admin thêm (nạp ở trình duyệt, xem lib/catalog.tsx). */
export const vouchers: Voucher[] = [...baseVouchers];

export type Applied = { ok: true; voucher: Voucher } | { ok: false; error: string };

export function checkVoucher(input: string, subtotal: number, firstOrder = true): Applied {
  const v = vouchers.find((x) => x.code === input.trim().toUpperCase());
  if (!v) return { ok: false, error: "Mã giảm giá không hợp lệ." };
  if (v.firstOrderOnly && !firstOrder) return { ok: false, error: `Mã ${v.code} chỉ áp dụng cho đơn hàng đầu tiên.` };
  if (subtotal < v.minSubtotal) return { ok: false, error: `Đơn hàng cần tối thiểu ${v.minSubtotal.toLocaleString("vi-VN")}₫ để dùng mã này.` };
  return { ok: true, voucher: v };
}

export function discountOf(v: Voucher | null, subtotal: number) {
  if (!v || v.kind === "freeship") return 0;
  const d = v.kind === "fixed" ? v.value : Math.round((subtotal * v.value) / 100);
  return Math.min(d, v.cap ?? d, subtotal);
}

export function totalDiscount(list: Voucher[], subtotal: number) {
  return Math.min(subtotal, list.reduce((n, v) => n + discountOf(v, subtotal), 0));
}

export interface Ranked { v: Voucher; saving: number }
export interface Locked { v: Voucher; need: number }

/** Voucher đủ điều kiện xếp theo mức tiết kiệm giảm dần; voucher chưa đủ điều kiện kèm số tiền cần mua thêm. */
export function recommend(subtotal: number, baseShip: number, firstOrder = true) {
  const usable = (v: Voucher) => !v.firstOrderOnly || firstOrder;
  const saving = (v: Voucher) => (v.kind === "freeship" ? baseShip : discountOf(v, subtotal));
  const eligible: Ranked[] = vouchers
    .filter((v) => usable(v) && subtotal >= v.minSubtotal && saving(v) > 0)
    .map((v) => ({ v, saving: saving(v) }))
    .sort((a, b) => b.saving - a.saving);
  const locked: Locked[] = vouchers
    .filter((v) => usable(v) && subtotal < v.minSubtotal)
    .map((v) => ({ v, need: v.minSubtotal - subtotal }))
    .sort((a, b) => a.need - b.need);
  const used = vouchers.filter((v) => !usable(v)); // chỉ dành cho đơn đầu tiên
  const idle = vouchers.filter((v) => usable(v) && subtotal >= v.minSubtotal && saving(v) <= 0); // đủ điều kiện nhưng không có giá trị với đơn này
  const best = eligible.reduce((n, r) => n + r.saving, 0);
  return { eligible, locked, idle, used, best };
}

/** Trả về voucher đã áp dụng đang xung đột với v (nếu có). */
export function conflictWith(v: Voucher, applied: Voucher[]) {
  return applied.find((a) => a.code !== v.code && (v.excludes?.includes(a.code) || a.excludes?.includes(v.code)));
}

/** Tổ hợp voucher tốt nhất không vi phạm luật loại trừ (tham lam theo mức tiết kiệm). */
export function bestSet(eligible: Ranked[]): Voucher[] {
  const out: Voucher[] = [];
  for (const { v } of eligible) if (!conflictWith(v, out)) out.push(v);
  return out;
}

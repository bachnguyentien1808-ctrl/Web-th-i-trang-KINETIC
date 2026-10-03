"use client";
import { toast } from "@/lib/toast";
import Link from "next/link";
import { useState } from "react";
import { formatVnd } from "@/lib/products";
import { vouchers, type Voucher } from "@/lib/vouchers";

const kindLabel = { percent: "GIẢM %", fixed: "GIẢM TIỀN", freeship: "FREESHIP" } as const;

export default function VoucherCard({ v, compact = false }: { v: Voucher; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(v.code); } catch {}
    setCopied(true); setTimeout(() => setCopied(false), 1500);
    toast(`Mã ${v.code} đã được sao chép, dán vào ô voucher khi thanh toán.`, { title: "Đã sao chép mã" });
  };
  const excl = v.excludes?.map((c) => vouchers.find((x) => x.code === c)?.code ?? c).join(", ");

  return (
    <div className={compact ? "vc compact" : "vc"}>
      <div className="vc-left">
        <small>{kindLabel[v.kind]}</small>
        <b>{v.kind === "percent" ? `${v.value}%` : v.kind === "fixed" ? `${v.value / 1000}K` : "SHIP 0₫"}</b>
      </div>
      <div className="vc-body">
        <h3>{v.title}</h3>
        <p>{v.desc}</p>
        <ul>
          <li>{v.minSubtotal ? `Đơn tối thiểu ${formatVnd(v.minSubtotal)}` : "Không yêu cầu đơn tối thiểu"}</li>
          {v.cap && <li>Giảm tối đa {formatVnd(v.cap)}</li>}
          {excl && <li>Không dùng chung với {excl}</li>}
          {v.firstOrderOnly && <li>Chỉ áp dụng cho đơn hàng đầu tiên</li>}
          {!compact && <li>Dùng chung được với các voucher khác (trừ mã loại trừ)</li>}
        </ul>
        <div className="vc-actions">
          <button className="vc-code" onClick={copy} title="Sao chép mã"><b>{v.code}</b><span>{copied ? "ĐÃ CHÉP ✓" : "SAO CHÉP"}</span></button>
          {!compact && <Link href="/products" className="vc-use">Mua sắm ngay →</Link>}
        </div>
      </div>
    </div>
  );
}

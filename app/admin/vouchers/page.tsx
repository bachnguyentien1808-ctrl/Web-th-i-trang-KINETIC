"use client";
import { useEffect, useState } from "react";
import { deleteVoucher, isCustomVoucher, saveVoucher } from "@/lib/catalog";
import { readAllOrders } from "@/lib/orders";
import { formatVnd } from "@/lib/products";
import { vouchers, type Voucher } from "@/lib/vouchers";

const blank = { code: "", title: "", desc: "", kind: "fixed" as Voucher["kind"], value: "", cap: "", minSubtotal: "", firstOrderOnly: false, excludes: [] as string[] };
type Draft = typeof blank & { editing?: boolean };

function VoucherForm({ initial, onClose }: { initial: Draft; onClose: () => void }) {
  const [d, setD] = useState<Draft>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const num = (s: string) => Number(s.replace(/\D/g, "")) || 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    const code = d.code.trim().replace(/\s+/g, " ").toUpperCase();
    const value = num(d.value);
    if (!/^[\p{L}\p{N}][\p{L}\p{N} _-]{2,23}$/u.test(code)) err.code = "Mã gồm 3–24 ký tự: chữ (có dấu được), số, khoảng trắng, gạch ngang";
    else if (!d.editing && vouchers.some((v) => v.code === code)) err.code = "Mã này đã tồn tại";
    if (!d.title.trim()) err.title = "Vui lòng nhập tên ưu đãi";
    if (d.kind !== "freeship" && value <= 0) err.value = "Giá trị phải lớn hơn 0";
    if (d.kind === "percent" && value > 100) err.value = "Phần trăm tối đa là 100";
    setErrors(err);
    if (Object.keys(err).length) return;

    const v: Voucher = {
      code, title: d.title.trim(), desc: d.desc.trim() || (d.minSubtotal ? `Đơn từ ${formatVnd(num(d.minSubtotal))}` : "Cho mọi đơn hàng"),
      minSubtotal: num(d.minSubtotal), kind: d.kind, value: d.kind === "freeship" ? 0 : value,
      cap: d.kind === "percent" && num(d.cap) ? num(d.cap) : undefined,
      firstOrderOnly: d.firstOrderOnly || undefined, excludes: d.excludes.length ? d.excludes : undefined,
    };
    if (!saveVoucher(v)) { alert("Bộ nhớ trình duyệt đã đầy."); return; }
    onClose();
  }

  const field = (key: string, label: string, node: React.ReactNode, hint?: string) => (
    <label className={errors[key] ? "field bad" : "field"}><span>{label}</span>{node}{hint && <small className="muted">{hint}</small>}{errors[key] && <em>{errors[key]}</em>}</label>
  );
  const others = vouchers.filter((v) => v.code !== d.code.trim().toUpperCase());

  return (
    <form className="vform" onSubmit={submit} noValidate>
      <h3>{d.editing ? `SỬA VOUCHER ${d.code}` : "THÊM VOUCHER MỚI"}</h3>
      <div className="two">
        {field("code", "MÃ VOUCHER *", <input value={d.code} disabled={d.editing} onChange={(e) => set("code", e.target.value.toUpperCase())} placeholder="Ví dụ: GIẢM GIÁ 30" />)}
        {field("title", "TÊN ƯU ĐÃI *", <input value={d.title} onChange={(e) => set("title", e.target.value)} placeholder="Ví dụ: Giảm 30.000₫" />)}
      </div>
      {field("desc", "MÔ TẢ ĐIỀU KIỆN (hiển thị cho khách)", <input value={d.desc} onChange={(e) => set("desc", e.target.value)} placeholder="Để trống để tự tạo từ đơn tối thiểu" />)}
      <div className="two">
        {field("kind", "LOẠI ƯU ĐÃI", <select value={d.kind} onChange={(e) => set("kind", e.target.value as Voucher["kind"])}><option value="fixed">Giảm số tiền cố định (₫)</option><option value="percent">Giảm theo phần trăm (%)</option><option value="freeship">Miễn phí vận chuyển</option></select>)}
        {d.kind !== "freeship" && field("value", d.kind === "percent" ? "PHẦN TRĂM GIẢM (%) *" : "SỐ TIỀN GIẢM (₫) *", <input inputMode="numeric" value={d.value} onChange={(e) => set("value", e.target.value.replace(/\D/g, ""))} />)}
      </div>
      <div className="two">
        {field("minSubtotal", "ĐƠN TỐI THIỂU (₫)", <input inputMode="numeric" value={d.minSubtotal} onChange={(e) => set("minSubtotal", e.target.value.replace(/\D/g, ""))} placeholder="0 = mọi đơn" />)}
        {d.kind === "percent" && field("cap", "GIẢM TỐI ĐA (₫)", <input inputMode="numeric" value={d.cap} onChange={(e) => set("cap", e.target.value.replace(/\D/g, ""))} placeholder="Để trống = không giới hạn" />)}
      </div>
      <label className="chk"><input type="checkbox" checked={d.firstOrderOnly} onChange={(e) => set("firstOrderOnly", e.target.checked)} /> Chỉ áp dụng cho <b>đơn hàng đầu tiên</b> của tài khoản</label>
      {others.length > 0 && (
        <div className="field"><span>KHÔNG DÙNG CHUNG VỚI</span>
          <div className="excl">
            {others.map((o) => (
              <label key={o.code} className="chk"><input type="checkbox" checked={d.excludes.includes(o.code)} onChange={(e) => set("excludes", e.target.checked ? [...d.excludes, o.code] : d.excludes.filter((c) => c !== o.code))} /> {o.code}</label>
            ))}
          </div>
        </div>
      )}
      <div className="form-actions">
        <button type="button" className="btn btn-outline" onClick={onClose}>HUỶ</button>
        <button className="btn btn-black">{d.editing ? "LƯU THAY ĐỔI" : "THÊM VOUCHER"}</button>
      </div>
    </form>
  );
}

export default function AdminVouchers() {
  const [used, setUsed] = useState<Record<string, number> | null>(null);
  const [form, setForm] = useState<Draft | null>(null);
  useEffect(() => {
    const m: Record<string, number> = {};
    readAllOrders().filter((o) => !o.cancel && o.voucher).forEach((o) => o.voucher!.split(",").map((c) => c.trim()).forEach((c) => { m[c] = (m[c] ?? 0) + 1; }));
    setUsed(m);
  }, []);
  if (!used) return null;

  const edit = (v: Voucher) => setForm({ editing: true, code: v.code, title: v.title, desc: v.desc, kind: v.kind, value: String(v.value || ""), cap: v.cap ? String(v.cap) : "", minSubtotal: v.minSubtotal ? String(v.minSubtotal) : "", firstOrderOnly: !!v.firstOrderOnly, excludes: v.excludes ?? [] });

  return (
    <>
      <div className="admin-head"><h1 className="h1">VOUCHER ({vouchers.length})</h1>{!form && <button className="btn btn-black sm" onClick={() => setForm({ ...blank })}>+ THÊM VOUCHER</button>}</div>
      <p className="muted small">Voucher admin thêm có nhãn <b>MỚI THÊM</b> và sửa/xoá được; voucher mặc định cũng sửa/xoá được. Khách thấy voucher mới ngay ở trang Ưu đãi và trang thanh toán.</p>
      {form && <VoucherForm initial={form} onClose={() => setForm(null)} />}
      <div className="table vch">
        <div className="tr th"><span>Mã</span><span>Ưu đãi</span><span>Điều kiện</span><span>Lượt dùng</span></div>
        {vouchers.map((v) => (
          <div key={v.code} className="tr">
            <span><b className="code">{v.code}</b>{isCustomVoucher(v.code) && <i className="v-best">MỚI THÊM</i>}</span>
            <span>{v.title}
              {<span className="row-actions" style={{ marginLeft: 0, marginTop: 4 }}>
                <button className="ul" onClick={() => edit(v)}>Sửa</button>
                <button className="ul danger" onClick={() => { if (confirm(`Xoá voucher ${v.code}?`)) deleteVoucher(v.code); }}>Xoá</button>
              </span>}
            </span>
            <span><small>{v.minSubtotal ? `Đơn từ ${formatVnd(v.minSubtotal)}` : "Mọi đơn"}{v.cap ? ` · tối đa ${formatVnd(v.cap)}` : ""}{v.firstOrderOnly ? " · đơn đầu tiên" : ""}{v.excludes ? ` · loại trừ ${v.excludes.join(", ")}` : ""}</small></span>
            <span><b>{used[v.code] ?? 0}</b></span>
          </div>
        ))}
      </div>
    </>
  );
}

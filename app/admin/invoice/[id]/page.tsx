"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { readAllOrders, stageOf, stages, type OrderWithOwner } from "@/lib/orders";
import { formatVnd } from "@/lib/products";

const payLabel: Record<string, string> = { cod: "Thanh toán khi nhận hàng (COD)", vnpay: "VNPAY-QR", momo: "Ví MoMo", card: "Thẻ Visa / Mastercard" };
const SELLER = { name: "CÔNG TY TNHH KINETIC VIỆT NAM", addr: "128 Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh", phone: "1900 8899", email: "care@kinetic.vn" };

const INVOICE_CSS = `@page{margin:0}.inv-cust{margin-bottom:-8px!important;line-height:1.3;font-size:15px;letter-spacing:.04em;font-weight:400!important;font-family:var(--body),Arial,sans-serif!important}.inv-cust span{margin-left:6px;font-weight:400}.inv .top{justify-content:center;text-align:center}.inv-logo{justify-content:center;display:flex;align-items:flex-end;gap:10px;margin-bottom:10px}.inv-logo span{font-family:Impact,"Arial Narrow",Arial,sans-serif;font-weight:900;font-size:30px;letter-spacing:.04em;line-height:1}body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:0;padding:16mm}.inv{max-width:760px;margin:0 auto}
h1{font-size:26px;margin:0}table{width:100%;border-collapse:collapse;margin:12px 0}th,td{border-bottom:1px solid #ddd;padding:8px;text-align:left;font-size:13px}
th{background:#111;color:#e2fa1e;font-size:11px;text-transform:uppercase}.r{text-align:right}.top{display:flex;justify-content:space-between;gap:16px}
.tot td{font-weight:bold;border-top:2px solid #111;font-size:15px}.muted{color:#666;font-size:12px}`;

export default function Invoice() {
  const { id } = useParams<{ id: string }>();
  const [o, setO] = useState<OrderWithOwner | null | undefined>(undefined);
  useEffect(() => setO(readAllOrders().find((x) => x.id === id) ?? null), [id]);

  if (o === undefined) return null;
  if (o === null) return <div className="center"><h1 className="h1">KHÔNG TÌM THẤY ĐƠN HÀNG</h1><p className="pad"><Link href="/admin/orders" className="ul">← Về danh sách đơn</Link></p></div>;

  const subtotal = o.items.reduce((n, i) => n + i.price * i.qty, 0);
  const st = o.cancel ? "Đã huỷ" : stages.find((s) => s.key === stageOf(o))!.label;
  const no = `HD-${o.id}`;

  const download = () => {
    const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${no}</title><style>${INVOICE_CSS}</style></head><body>${document.getElementById("invoice")!.outerHTML}</body></html>`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
    a.download = `${no}.html`; a.click(); URL.revokeObjectURL(a.href);
  };

  return (
    <>
      <div className="inv-bar no-print">
        <Link href="/admin/orders" className="ul">← Về danh sách đơn</Link>
        <div>
          <button className="btn btn-outline sm" onClick={download}>TẢI FILE .HTML</button>
          <button className="btn btn-black sm" onClick={() => window.print()}>IN / LƯU PDF</button>
        </div>
      </div>
      <p className="muted small no-print">Bấm “In / Lưu PDF” rồi chọn “Lưu dưới dạng PDF” ở mục máy in để xuất file PDF.</p>

      <article id="invoice" className="inv">
        <div className="top">
          <div>
            <div className="inv-logo">
              <svg width="40" height="34" viewBox="0 0 40 34" aria-hidden="true"><g fill="#111"><polygon points="2,34 9,34 15,10 8,10" /><polygon points="13,34 20,34 28,4 21,4" /><polygon points="24,34 31,34 40,0 33,0" /></g></svg>
              <span>KINETIC</span>
            </div>
            <h1>HOÁ ĐƠN BÁN HÀNG</h1>
            <p className="muted">Số: <b>{no}</b><br />Ngày: {new Date(o.date).toLocaleDateString("vi-VN")} {new Date(o.date).toLocaleTimeString("vi-VN")}<br />Trạng thái: {st}</p>
          </div>
        </div>

        <h3 className="inv-h inv-cust">KHÁCH HÀNG: <span>{o.name.toUpperCase()}</span></h3>
        <p>SĐT: {o.phone}<br />Email: {o.email}<br />Địa chỉ giao hàng: {o.address}<br />Thanh toán: {payLabel[o.pay] ?? o.pay}</p>

        <table>
          <thead><tr><th>#</th><th>Sản phẩm</th><th>Size</th><th className="r">SL</th><th className="r">Đơn giá</th><th className="r">Thành tiền</th></tr></thead>
          <tbody>
            {o.items.map((i, n) => (
              <tr key={n}>
                <td>{n + 1}</td><td>{i.name}{i.note && <div className="muted">Ghi chú: {i.note}</div>}</td><td>{i.size}</td>
                <td className="r">{i.qty}</td><td className="r">{formatVnd(i.price)}</td><td className="r">{formatVnd(i.price * i.qty)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><td colSpan={5} className="r">Tạm tính</td><td className="r">{formatVnd(subtotal)}</td></tr>
            {!!o.discount && <tr><td colSpan={5} className="r">Voucher {o.voucher}</td><td className="r">−{formatVnd(o.discount)}</td></tr>}
            {!!o.pointsUsed && <tr><td colSpan={5} className="r">Điểm thưởng đã dùng ({o.pointsUsed.toLocaleString("vi-VN")} điểm)</td><td className="r">−{formatVnd(o.pointsUsed)}</td></tr>}
            <tr><td colSpan={5} className="r">Phí vận chuyển</td><td className="r">{o.shipping ? formatVnd(o.shipping) : "Miễn phí"}</td></tr>
            <tr className="tot"><td colSpan={5} className="r">TỔNG THANH TOÁN</td><td className="r">{formatVnd(o.total)}</td></tr>
          </tfoot>
        </table>
        <div className="seller-foot">
          <h3 className="inv-h">THÔNG TIN CỬA HÀNG</h3>
          <p><b>{SELLER.name}</b><br />{SELLER.addr}<br />Hotline: {SELLER.phone}<br />Email: {SELLER.email}</p>
        </div>

        <p className="muted">Giá đã bao gồm thuế VAT. Đây là hoá đơn bán hàng của cửa hàng, không phải hoá đơn điện tử theo quy định của cơ quan thuế. Cảm ơn quý khách đã mua hàng tại KINETIC!</p>
      </article>
    </>
  );
}

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const perks = [
  ["🚚", "Giao hoả tốc 2-4h", "Nội thành HN & HCM"],
  ["↺", "Đổi trả 30 ngày", "Miễn phí, không cần lý do"],
  ["🛡", "Hàng chính hãng", "Cam kết 100%"],
  ["☎", "Hỗ trợ 8:00 - 22:00", "Hotline 1900 8899"],
];
const payments = ["COD", "VNPAY-QR", "MoMo", "Visa", "Mastercard"];

export default function Footer() {
  const path = usePathname();
  if (path.startsWith("/admin")) return null;

  return (
    <footer className="footer ft">
      <div className="container ft-perks">
        {perks.map(([icon, t, d]) => (
          <div key={t}><span aria-hidden="true">{icon}</span><p><b>{t}</b><small>{d}</small></p></div>
        ))}
      </div>

      <div className="container ft-grid">
        <div className="ft-brand">
          <div className="logo light"><span className="stripes"><i /><i /><i /></span>KINETIC</div>
          <p>Thương hiệu trang phục thể thao hiệu năng cao & streetwear kỹ thuật. Định hình tốc độ, năng lượng và tinh thần thể thao tại Việt Nam.</p>
          <div className="ft-social" aria-label="Mạng xã hội">
            {["Facebook", "Instagram", "YouTube", "TikTok"].map((s) => <span key={s} title={s}>{s.slice(0, 2).toUpperCase()}</span>)}
          </div>
        </div>
        <div><h4>Sản phẩm</h4>
          <Link href="/products?cat=ao">Áo</Link><Link href="/products?cat=quan">Quần</Link><Link href="/products?cat=giay">Giày</Link><Link href="/products?cat=phu-kien">Phụ kiện</Link>
          <Link href="/products?tag=new">Hàng mới về</Link><Link href="/products?sale=1">Đang giảm giá</Link>
        </div>
        <div><h4>Hỗ trợ khách hàng</h4>
          <Link href="/help">Trung tâm trợ giúp</Link><Link href="/orders">Theo dõi đơn hàng</Link><Link href="/help">Chính sách đổi trả 30 ngày</Link><Link href="/help">Bảo hành 365 ngày</Link><Link href="/help">Vận chuyển toàn quốc</Link><Link href="/help">Hướng dẫn chọn size</Link>
        </div>
        <div><h4>Về KINETIC</h4>
          <Link href="/stores">Hệ thống cửa hàng</Link><Link href="/offers">Ưu đãi & voucher</Link><Link href="/account">Hội viên & điểm thưởng</Link><Link href="/login">Đăng nhập</Link><Link href="/register">Đăng ký</Link>
        </div>
        <div className="ft-contact"><h4>Liên hệ</h4>
          <span>128 Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh</span>
          <span>Hotline: <b>1900 8899</b></span>
          <span>Email: care@kinetic.vn</span>
          <span>Giờ làm việc: 8:00 - 22:00 mỗi ngày</span>
        </div>
      </div>

      <div className="ft-bottom">
        <div className="container">
          <span>© 2025 KINETIC VIETNAM CO., LTD. Tất cả quyền được bảo lưu.</span>
          <div className="ft-pay" aria-label="Phương thức thanh toán">{payments.map((p) => <i key={p}>{p}</i>)}</div>
        </div>
      </div>
    </footer>
  );
}

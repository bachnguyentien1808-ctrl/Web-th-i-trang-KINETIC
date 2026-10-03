"use client";
import Link from "next/link";
import { useState } from "react";
import RequireAuth from "@/components/RequireAuth";

const topics = [
  { key: "order", icon: "🛒", label: "Đặt hàng" },
  { key: "pay", icon: "💳", label: "Thanh toán" },
  { key: "ship", icon: "🚚", label: "Vận chuyển" },
  { key: "return", icon: "↩️", label: "Đổi trả & huỷ đơn" },
  { key: "member", icon: "⭐", label: "Hội viên & điểm" },
  { key: "voucher", icon: "🎟", label: "Voucher" },
  { key: "warranty", icon: "🛡", label: "Bảo hành" },
  { key: "size", icon: "📏", label: "Size & sản phẩm" },
] as const;
type Topic = (typeof topics)[number]["key"];

const faqs: { t: Topic; q: string; a: string }[] = [
  { t: "order", q: "Làm sao để đặt hàng?", a: "Chọn sản phẩm, chọn size rồi bấm “Thêm vào giỏ hàng” (cần đăng nhập). Vào giỏ hàng kiểm tra và bấm “Thanh toán”, điền thông tin giao hàng và xác nhận đặt hàng. Bạn có thể bấm “Mua ngay” để đi thẳng tới bước thanh toán." },
  { t: "order", q: "Tôi có thể thêm ghi chú cho sản phẩm không?", a: "Có. Ở trang sản phẩm hoặc trong giỏ hàng, mỗi sản phẩm có ô “Ghi chú” (ví dụ: gói quà, giao giờ hành chính). Ghi chú được gửi kèm đơn hàng cho cửa hàng." },
  { t: "order", q: "Tôi có thể sửa đơn hàng sau khi đặt không?", a: "Bạn chỉ có thể huỷ đơn khi đơn còn ở bước “Đã xử lý”, sau đó đặt lại đơn mới với thông tin đúng. Đơn đã bàn giao vận chuyển không thể sửa hoặc huỷ." },
  { t: "order", q: "Sao tôi không thêm được sản phẩm vào giỏ hàng?", a: "Bạn cần đăng nhập hoặc đăng ký tài khoản trước khi thêm sản phẩm vào giỏ. Ngoài ra hãy chắc chắn đã chọn size còn hàng (size hết hàng bị gạch chéo)." },
  { t: "pay", q: "Kinetic hỗ trợ những hình thức thanh toán nào?", a: "Thanh toán khi nhận hàng (COD), VNPAY-QR, ví MoMo và thẻ Visa/Mastercard." },
  { t: "pay", q: "Thanh toán online có an toàn không?", a: "Mọi giao dịch trực tuyến được xử lý qua cổng thanh toán đối tác. Kinetic không lưu số thẻ của bạn." },
  { t: "pay", q: "Giá trên website đã gồm VAT chưa?", a: "Giá niêm yết đã bao gồm thuế VAT. Phí vận chuyển (nếu có) được hiển thị ở bước thanh toán." },
  { t: "ship", q: "Thời gian giao hàng là bao lâu?", a: "Nội thành Hà Nội và TP.HCM: hỏa tốc 2–4 giờ. Các tỉnh/thành khác: 2–5 ngày làm việc tuỳ khu vực." },
  { t: "ship", q: "Phí vận chuyển được tính thế nào?", a: "Miễn phí vận chuyển cho đơn từ 899.000₫. Đơn dưới mức này đồng giá 30.000₫. Bạn cũng có thể dùng voucher FREESHIP khi đơn chưa đủ mức miễn phí." },
  { t: "ship", q: "Làm sao theo dõi đơn hàng của tôi?", a: "Vào mục “Theo dõi đơn hàng” trên đầu trang. Đơn hàng sẽ lần lượt hiển thị: Đã xử lý → Đang giao đến bạn → Đã giao." },
  { t: "return", q: "Chính sách đổi trả như thế nào?", a: "Đổi trả miễn phí trong 30 ngày kể từ khi nhận hàng nếu sản phẩm còn nguyên tem mác, chưa giặt và chưa qua sử dụng." },
  { t: "return", q: "Tôi muốn huỷ đơn thì làm thế nào?", a: "Vào “Theo dõi đơn hàng”, chọn đơn đang ở bước “Đã xử lý” và bấm “Huỷ đơn hàng”, chọn lý do. Với đơn trả trước, tiền được hoàn về phương thức thanh toán sau 24 giờ kể từ lúc cửa hàng xác nhận huỷ. Đơn COD không phát sinh hoàn tiền." },
  { t: "return", q: "Khi nào tôi nhận lại được tiền?", a: "Sau khi cửa hàng xác nhận huỷ, tiền sẽ được hoàn sau 24 giờ. Thời gian hiển thị cụ thể ngay trong đơn hàng đã huỷ của bạn." },
  { t: "member", q: "Điểm thưởng được tích như thế nào?", a: "Mỗi đơn hàng được tích điểm theo hạng thẻ: Đồng 5%, Bạc 10%, Vàng 15%, Kim cương 20% giá trị thanh toán. Điểm được cộng khi đơn giao thành công. 1 điểm = 1₫." },
  { t: "member", q: "Làm sao để nâng hạng thẻ?", a: "Hạng thẻ xét theo tổng chi tiêu các đơn đã giao trong 12 tháng gần nhất. Xem chi tiết các mốc ở mục “Hội viên”." },
  { t: "member", q: "Làm sao để giữ hạng thẻ?", a: "Bạn cần mua ít nhất 1 sản phẩm trong mỗi 3 tháng. Quá 3 tháng không mua, hạng thẻ sẽ bị hạ 1 bậc; mua lại để khôi phục." },
  { t: "member", q: "Dùng điểm để thanh toán thế nào?", a: "Ở trang thanh toán, tích ô “Dùng điểm”. Mỗi đơn dùng tối đa 50% giá trị đơn bằng điểm." },
  { t: "voucher", q: "Tôi có thể dùng nhiều voucher cùng lúc không?", a: "Có, nếu đơn hàng đủ điều kiện và các voucher không loại trừ nhau. Riêng WELCOME50 và FREESHIP chỉ được chọn 1 trong 2." },
  { t: "voucher", q: "WELCOME50 áp dụng cho ai?", a: "Giảm 50.000₫ cho đơn hàng đầu tiên của tài khoản." },
  { t: "voucher", q: "Tôi xem các voucher đang có ở đâu?", a: "Vào mục “Ưu đãi” trên thanh menu, hoặc xem danh sách ngay ở trang thanh toán. Hệ thống cũng tự gợi ý combo tiết kiệm nhất cho đơn của bạn." },
  { t: "warranty", q: "Sản phẩm được bảo hành bao lâu?", a: "Sản phẩm chính hãng Kinetic được bảo hành 2 năm cho lỗi từ nhà sản xuất (đường may, khoá kéo, đế giày...)." },
  { t: "warranty", q: "Bảo hành có áp dụng cho hao mòn thông thường không?", a: "Không. Bảo hành không áp dụng cho hao mòn tự nhiên, hư hỏng do sử dụng sai cách hoặc tự ý sửa chữa." },
  { t: "size", q: "Tôi nên chọn size nào?", a: "Mỗi sản phẩm có danh sách size và thông số chiều dài, độ dày ở trang chi tiết. Nếu phân vân giữa 2 size, hãy chọn size lớn hơn cho đồ chạy bộ và tập luyện. Bạn có thể đổi size miễn phí trong 30 ngày." },
  { t: "size", q: "“Mỏng” và “dày” ở thông tin sản phẩm nghĩa là gì?", a: "Độ dày thể hiện độ ấm của chất liệu: Mỏng (thoáng, mùa hè), Vừa (quanh năm), Dày (giữ nhiệt, mùa đông). Chiều dài cho biết tay ngắn/dài hoặc quần dài/short." },
  { t: "size", q: "Tôi có thể tìm sản phẩm bằng hình ảnh không?", a: "Có. Bấm biểu tượng máy ảnh ở ô tìm kiếm, tải ảnh lên và hệ thống sẽ gợi ý các sản phẩm có màu sắc, hình dáng tương tự." },
];

const channels = [
  { icon: "📞", title: "Hotline", main: "1900 8899", sub: "08:00 – 22:00 mỗi ngày", href: "tel:19008899" },
  { icon: "✉️", title: "Email", main: "care@kinetic.vn", sub: "Phản hồi trong 24 giờ", href: "mailto:care@kinetic.vn" },
  { icon: "💬", title: "Chat với Kinetic", main: "Zalo · Messenger", sub: "Hỗ trợ trực tuyến 08:00 – 22:00", href: "#" },
  { icon: "🏬", title: "Đến cửa hàng", main: "Xem hệ thống cửa hàng", sub: "Nhân viên hỗ trợ trực tiếp", href: "/stores" },
];

function Help() {
  const [topic, setTopic] = useState<Topic | "all">("all");
  const [q, setQ] = useState("");
  const term = q.trim().toLowerCase();
  const shown = faqs.filter((f) => (topic === "all" || f.t === topic) && (!term || (f.q + " " + f.a).toLowerCase().includes(term)));

  return (
    <div className="container section">
      <section className="help-hero">
        <small className="tag">TRUNG TÂM TRỢ GIÚP</small>
        <h1>Chúng tôi có thể giúp gì cho bạn?</h1>
        <p>Tìm nhanh câu trả lời về đặt hàng, thanh toán, vận chuyển, đổi trả, điểm thưởng và nhiều hơn nữa.</p>
        <input className="help-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔎  Nhập từ khoá, ví dụ: hoàn tiền, đổi size, voucher..." />
      </section>

      <div className="help-channels">
        {channels.map((c) => (
          <a key={c.title} href={c.href} className="channel">
            <i>{c.icon}</i><div><small>{c.title}</small><b>{c.main}</b><span>{c.sub}</span></div>
          </a>
        ))}
      </div>

      <div className="sec-head" style={{ marginTop: 28 }}><h2>CÂU HỎI THƯỜNG GẶP</h2><small>{shown.length} câu hỏi</small></div>
      <div className="topic-chips">
        <button className={topic === "all" ? "chip on" : "chip"} onClick={() => setTopic("all")}>Tất cả ({faqs.length})</button>
        {topics.map((t) => <button key={t.key} className={topic === t.key ? "chip on" : "chip"} onClick={() => setTopic(t.key)}>{t.icon} {t.label} ({faqs.filter((f) => f.t === t.key).length})</button>)}
      </div>

      {shown.length === 0 && <p className="muted pad">Không tìm thấy câu hỏi phù hợp. Hãy thử từ khoá khác hoặc liên hệ trực tiếp với chúng tôi ở trên.</p>}
      <div className="faq wide">
        {shown.map((f) => (
          <details key={f.q}>
            <summary><span className="faq-tag">{topics.find((t) => t.key === f.t)!.icon}</span>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </div>

      <section className="help-cta">
        <div><h3>Chưa tìm được câu trả lời?</h3><p>Đội ngũ chăm sóc khách hàng của Kinetic luôn sẵn sàng hỗ trợ bạn mỗi ngày từ 08:00 đến 22:00.</p></div>
        <div className="help-cta-btns"><a href="tel:19008899" className="btn btn-black">GỌI 1900 8899</a><Link href="/orders" className="btn btn-outline">XEM ĐƠN HÀNG CỦA TÔI</Link></div>
      </section>
    </div>
  );
}
export default function HelpPage() { return <RequireAuth><Help /></RequireAuth>; }

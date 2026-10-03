import { colorOf, productDetails, type Product } from "@/lib/products";

/** Mô tả chi tiết + bảng thông số (chất liệu, xuất xứ, bảo quản...) hiển thị dưới thông tin sản phẩm. */
export default function ProductDetails({ p }: { p: Product }) {
  const { rows, feats, use } = productDetails(p);
  return (
    <section className="section pd" id="details">
      <div className="sec-head"><h2>MÔ TẢ CHI TIẾT SẢN PHẨM</h2></div>
      <div className="pd-grid">
        <div className="pd-text">
          <h3>Giới thiệu</h3>
          <p>{p.description}</p>
          <p>{p.name} màu <b>{colorOf(p)}</b> phù hợp để {use}. Sản phẩm được kiểm tra chất lượng từng lô trước khi đến tay khách hàng.</p>
          {feats.length > 0 && (
            <>
              <h3>Điểm nổi bật</h3>
              <ul>{feats.map((f) => <li key={f}>{f}</li>)}</ul>
            </>
          )}
          <h3>Cam kết của KINETIC</h3>
          <ul>
            <li>Hàng chính hãng, đúng mẫu và đúng màu như hình.</li>
            <li>Đổi trả trong 30 ngày, bảo hành 24 tháng.</li>
            <li>Giao hoả tốc 2–4h nội thành, miễn phí vận chuyển từ 899.000đ.</li>
          </ul>
        </div>
        <table className="pd-table">
          <tbody>{rows.map(([k, v]) => <tr key={k}><th>{k}</th><td>{v}</td></tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}

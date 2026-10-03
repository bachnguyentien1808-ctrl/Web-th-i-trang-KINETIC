"use client";
import Link from "next/link";
import TierLadder from "@/components/TierLadder";
import VoucherCard from "@/components/VoucherCard";
import { vouchers } from "@/lib/vouchers";

export default function Offers() {
  return (
    <div className="container section">
      <div className="offers-hero">
        <small className="tag">ƯU ĐÃI</small>
        <h1>VOUCHER & ƯU ĐÃI</h1>
        <p>Sao chép mã rồi nhập ở bước thanh toán, hoặc để Kinetic tự gợi ý mã tốt nhất cho đơn của bạn. Có thể dùng nhiều voucher cùng lúc nếu đủ điều kiện.</p>
      </div>
      <div className="sec-head"><h2>TẤT CẢ VOUCHER ({vouchers.length})</h2></div>
      <div className="vc-grid">{vouchers.map((v) => <VoucherCard key={v.code} v={v} />)}</div>
      <div className="sec-head" style={{ marginTop: 32 }}><h2>THẺ HỘI VIÊN & TÍCH ĐIỂM</h2><Link href="/account" className="more">XEM THẺ CỦA TÔI →</Link></div>
      <TierLadder />

      <div className="offers-note">
        <b>Lưu ý</b>
        <ul>
          <li>Voucher chỉ áp dụng ở bước <Link href="/checkout" className="ul">thanh toán</Link>, sau khi bạn đăng nhập và có sản phẩm trong giỏ.</li>
          <li><b>FREESHIP</b> và <b>WELCOME50</b> không dùng chung được với nhau.</li>
          <li>Đơn từ 899.000₫ đã được miễn phí vận chuyển.</li>
        </ul>
      </div>
    </div>
  );
}

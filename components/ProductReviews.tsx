"use client";
import ReviewImages from "./ReviewImages";
import Stars from "./Stars";
import { summarize, useReviews } from "@/lib/reviews";
import { sampleReviews } from "@/lib/sampleReviews";
import type { Product } from "@/lib/products";

export function RatingLine({ p }: { p: Product }) {
  const mine = useReviews().filter((r) => r.slug === p.slug);
  const { avg, count } = summarize(p, mine);
  return <div className="rating"><Stars value={avg} /> <b>{avg.toFixed(1)}</b> <span>({count} đánh giá)</span></div>;
}

export default function ProductReviews({ p }: { p: Product }) {
  const mine = useReviews().filter((r) => r.slug === p.slug);
  const { avg, count } = summarize(p, mine);
  const samples = sampleReviews(p);
  return (
    <section className="section" id="reviews">
      <div className="sec-head"><h2>ĐÁNH GIÁ SẢN PHẨM</h2></div>
      <div className="rv-summary">
        <div className="rv-score"><b>{avg.toFixed(1)}</b><Stars value={avg} size={20} /><small>{count} đánh giá</small></div>
        <p className="muted small">Chỉ khách hàng đã nhận sản phẩm mới có thể đánh giá. Vào “Theo dõi đơn hàng” → đơn “Đã giao” để đánh giá.</p>
      </div>
      <div className="rv-list">
        {mine.map((r) => (
          <article key={r.id} className="rv">
            <div className="rv-head"><b>{r.name}</b><span className="badge b-volt">ĐÃ MUA HÀNG</span><small>{new Date(r.date).toLocaleDateString("vi-VN")}</small></div>
            <Stars value={r.rating} />
            {r.text && <p>{r.text}</p>}
            <ReviewImages images={r.images} />
          </article>
        ))}
        {samples.map((r) => (
          <article key={r.id} className="rv">
            <div className="rv-head"><b>{r.name}</b><span className="badge b-black">ĐÁNH GIÁ MẪU</span><small>{new Date(r.date).toLocaleDateString("vi-VN")}</small></div>
            <Stars value={r.rating} />
            <p className="rv-meta">{r.meta}</p>
            <p>{r.text}</p>
          </article>
        ))}
      </div>
      <p className="muted small rv-note">Hiển thị {mine.length + samples.length} trong {count} đánh giá. Nhận xét “mẫu” là nội dung minh hoạ; đánh giá thật của khách sẽ hiện ở đầu danh sách.</p>
    </section>
  );
}

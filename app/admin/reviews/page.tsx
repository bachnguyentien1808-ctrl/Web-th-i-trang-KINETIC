"use client";
import ReviewImages from "@/components/ReviewImages";
import Stars from "@/components/Stars";
import { deleteReview, useReviews } from "@/lib/reviews";
import { getProduct } from "@/lib/products";

export default function AdminReviews() {
  const reviews = useReviews();
  return (
    <>
      <h1 className="h1">ĐÁNH GIÁ ({reviews.length})</h1>
      {reviews.length === 0 && <p className="muted pad">Chưa có đánh giá nào từ khách hàng.</p>}
      <div className="rv-list">
        {reviews.map((r) => (
          <article key={r.id} className="rv">
            <div className="rv-head"><b>{r.name}</b><small className="muted">{r.email}</small><small>{new Date(r.date).toLocaleString("vi-VN")}</small></div>
            <div><Stars value={r.rating} /> <small className="muted">· {getProduct(r.slug)?.name ?? r.slug} · đơn #{r.orderId}</small></div>
            {r.text && <p>{r.text}</p>}
            <ReviewImages images={r.images} />
            <button className="cancel-btn sm" onClick={() => { if (confirm("Xoá đánh giá này?")) deleteReview(r.id); }}>Xoá đánh giá</button>
          </article>
        ))}
      </div>
    </>
  );
}

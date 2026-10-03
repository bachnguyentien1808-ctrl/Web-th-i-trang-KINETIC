"use client";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ReviewImages from "@/components/ReviewImages";
import Stars from "@/components/Stars";
import { deleteProduct, isCustomProduct, useCatalogReady } from "@/lib/catalog";
import { readAllOrders, stageOf, stages, type OrderWithOwner } from "@/lib/orders";
import { formatVnd, getProduct, thicknessLabel } from "@/lib/products";
import { summarize, useReviews } from "@/lib/reviews";

const seasonLabel: Record<string, string> = { xuan: "Mùa Xuân", ha: "Mùa Hạ", thu: "Mùa Thu", dong: "Mùa Đông" };

export default function AdminProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const ready = useCatalogReady();
  const [orders, setOrders] = useState<OrderWithOwner[] | null>(null);
  const [img, setImg] = useState(0);
  const reviews = useReviews().filter((r) => r.slug === slug);
  useEffect(() => setOrders(readAllOrders()), []);

  const p = getProduct(slug);
  if (!orders || (!p && !ready)) return null;
  if (!p) return <><h1 className="h1">KHÔNG TÌM THẤY SẢN PHẨM</h1><Link href="/admin/products" className="ul">← Danh sách sản phẩm</Link></>;

  const custom = isCustomProduct(p.slug);
  const containing = orders.filter((o) => o.items.some((i) => i.slug === p.slug));
  const live = containing.filter((o) => !o.cancel);
  const lines = live.flatMap((o) => o.items.filter((i) => i.slug === p.slug).map((i) => ({ o, i })));
  const units = lines.reduce((n, l) => n + l.i.qty, 0);
  const revenue = lines.reduce((n, l) => n + l.i.price * l.i.qty, 0);
  const bySize = new Map<string, number>();
  lines.forEach((l) => bySize.set(l.i.size, (bySize.get(l.i.size) ?? 0) + l.i.qty));
  const sizeMax = Math.max(1, ...bySize.values());
  const { avg, count } = summarize(p, reviews);
  const off = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;

  return (
    <div className="od">
      <Link href="/admin/products" className="od-back">← Danh sách sản phẩm</Link>
      <div className="od-sheet">
        <header className="od-hero">
          <div>
            <small>{p.categoryLabel.toUpperCase()}</small>
            <h1 style={{ fontSize: "clamp(26px,3.4vw,44px)" }}>{p.name}</h1>
            <div className="od-meta">
              {custom && <span className="badge b-volt">MỚI THÊM</span>}
              {p.badge && <span className="badge b-black">{p.badge}</span>}
              {p.season && <span>🌤 {seasonLabel[p.season]}</span>}
              <span>⭐ {count ? `${avg.toFixed(1)} (${count} đánh giá)` : "Chưa có đánh giá"}</span>
            </div>
          </div>
          <div className="od-total">
            <small>GIÁ BÁN</small>
            <b>{formatVnd(p.price)}</b>
            {p.oldPrice && <span className="muted"><s>{formatVnd(p.oldPrice)}</s> · giảm {off}%</span>}
            <Link href={`/products/${p.slug}`} target="_blank" className="od-invoice">🛍 Xem trên shop</Link>
          </div>
        </header>

        <div className="od-stats">
          <div><i>📦</i><b>{units}</b><small>Đã bán</small></div>
          <div><i>💰</i><b>{formatVnd(revenue)}</b><small>Doanh thu sản phẩm</small></div>
          <div><i>🧾</i><b>{live.length}</b><small>Đơn có sản phẩm này{containing.length > live.length ? ` · ${containing.length - live.length} huỷ` : ""}</small></div>
          <div><i>⭐</i><b>{count ? avg.toFixed(1) : "-"}</b><small>Điểm đánh giá TB</small></div>
        </div>

        <div className="od-grid">
          <div className="od-col">
            <section className="od-card">
              <h3>HÌNH ẢNH & MÔ TẢ</h3>
              <div className="pd-gallery">
                <div className="pd-main"><Image src={p.gallery[img] ?? p.image} alt={p.name} fill sizes="480px" /></div>
                {p.gallery.length > 1 && (
                  <div className="pd-thumbs">
                    {p.gallery.map((src, n) => <button key={n} className={n === img ? "on" : ""} onClick={() => setImg(n)}><Image src={src} alt="" fill sizes="64px" /></button>)}
                  </div>
                )}
              </div>
              <p>{p.description}</p>
              {p.tech && <p className="tech">{p.tech}</p>}
            </section>

            <section className="od-card">
              <h3>ĐÁNH GIÁ CỦA KHÁCH ({reviews.length})</h3>
              <div className="pd-rating"><b>{count ? avg.toFixed(1) : "-"}</b><Stars value={avg} size={20} /><small className="muted">{count} lượt (gồm điểm mẫu của shop)</small></div>
              {reviews.length === 0 && <p className="muted small">Chưa có nhận xét chi tiết nào từ khách đã mua.</p>}
              {reviews.map((r) => (
                <article key={r.id} className="rv"><div className="rv-head"><b>{r.name}</b><small className="muted">{r.email}</small><small>{new Date(r.date).toLocaleDateString("vi-VN")}</small></div><Stars value={r.rating} />{r.text && <p>{r.text}</p>}<ReviewImages images={r.images} /></article>
              ))}
            </section>
          </div>

          <aside className="od-col">
            <section className="od-card">
              <h3>THÔNG TIN SẢN PHẨM</h3>
              <dl className="kv">
                <dt>Danh mục</dt><dd>{p.categoryLabel}</dd>
                {p.spec && <><dt>Chiều dài</dt><dd>{p.spec.length}</dd><dt>Độ dày</dt><dd>{thicknessLabel[p.spec.thickness]}</dd></>}
                <dt>Giá bán</dt><dd><b>{formatVnd(p.price)}</b></dd>
                <dt>Mã sản phẩm</dt><dd><code>{p.slug}</code></dd>
              </dl>
              <div className="field"><span>SIZE & TỒN KHO</span>
                <div className="pd-sizes">
                  {p.sizes.map((s) => <span key={s.label} className={s.inStock ? "sz" : "sz out"}>{s.label}{!s.inStock && " · hết"}</span>)}
                </div>
              </div>
              {(
                <div className="od-actions">
                  <Link href={`/admin/products/${p.slug}/edit`} className="btn btn-black sm">SỬA SẢN PHẨM</Link>
                  <button className="btn btn-red sm" onClick={() => { if (confirm(`Xoá sản phẩm "${p.name}"?`)) { deleteProduct(p.slug); router.push("/admin/products"); } }}>XOÁ</button>
                </div>
              )}
            </section>

            <section className="od-card">
              <h3>BÁN THEO SIZE</h3>
              {bySize.size === 0 && <p className="muted small">Chưa bán được chiếc nào.</p>}
              {[...bySize.entries()].sort((a, b) => b[1] - a[1]).map(([size, n]) => (
                <div key={size} className="bar-row"><span>Size {size}</span><div><i style={{ width: `${(n / sizeMax) * 100}%` }} /></div><b>{n}</b></div>
              ))}
            </section>

            <section className="od-card">
              <h3>ĐƠN HÀNG GẦN ĐÂY</h3>
              {containing.length === 0 && <p className="muted small">Chưa có đơn hàng nào.</p>}
              {containing.slice(0, 8).map((o) => {
                const it = o.items.find((i) => i.slug === p.slug)!;
                return (
                  <Link key={o.id} href={`/admin/orders/${o.id}`} className="od-other">
                    <b>#{o.id}</b><span>{o.name} · {it.qty} × size {it.size}</span>
                    <small>{o.cancel ? "Đã huỷ" : stages.find((s) => s.key === stageOf(o))!.label}</small>
                    <b>{new Date(o.date).toLocaleDateString("vi-VN")}</b>
                  </Link>
                );
              })}
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

"use client";
import Link from "next/link";
import AddToCart from "@/components/AddToCart";
import ProductCard from "@/components/ProductCard";
import Gallery from "@/components/Gallery";
import ProductDetails from "@/components/ProductDetails";
import ProductReviews, { RatingLine } from "@/components/ProductReviews";
import { useCatalogReady } from "@/lib/catalog";
import { formatVnd, getProduct, products, thicknessLabel } from "@/lib/products";

export default function ProductView({ slug }: { slug: string }) {
  const ready = useCatalogReady();
  const p = getProduct(slug);
  if (!p) {
    return (
      <div className="container section center">
        {ready ? <><h1 className="h1">KHÔNG TÌM THẤY SẢN PHẨM</h1><p className="pad"><Link href="/products" className="ul">← Xem tất cả sản phẩm</Link></p></> : <span className="muted">Đang tải...</span>}
      </div>
    );
  }
  const related = products.filter((x) => x.category === p.category && x.slug !== p.slug).slice(0, 4);
  const off = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;

  return (
    <div className="container section">
      <nav className="crumbs"><Link href="/">Trang chủ</Link> / <Link href={`/products?cat=${p.category}`}>{p.categoryLabel}</Link> / {p.name}</nav>
      <div className="pdp">
        <Gallery images={p.gallery} name={p.name} />
        <div className="pdp-info">
          <small className="cat">{p.categoryLabel}</small>
          <h1>{p.name}</h1>
          <RatingLine p={p} />
          <div className="pdp-price">
            <b>{formatVnd(p.price)}</b>
            {p.oldPrice && <><s>{formatVnd(p.oldPrice)}</s><span className="badge b-red">TIẾT KIỆM {off}%</span></>}
          </div>
          <p className="desc">{p.description}</p>
          <p className="tech">{p.tech}</p>
          {p.spec && (
            <div className="spec-row">
              <div><small>CHIỀU DÀI</small><b>{p.spec.length}</b></div>
              <div><small>ĐỘ DÀY</small><b>{thicknessLabel[p.spec.thickness]}</b><em className="thick" data-t={p.spec.thickness}><u /><u /><u /></em></div>
            </div>
          )}
          <AddToCart p={p} />
          <ul className="policy">
            <li><b>ĐỔI TRẢ 30 NGÀY</b> miễn phí</li>
            <li><b>GIAO HỎA TỐC</b> 2–4h nội thành</li>
            <li><b>BẢO HÀNH 2 NĂM</b> chính hãng</li>
          </ul>
        </div>
      </div>
      <ProductDetails p={p} />
      <ProductReviews p={p} />
      {related.length > 0 && (
        <section className="section">
          <div className="sec-head"><h2>SẢN PHẨM LIÊN QUAN</h2></div>
          <div className="grid">{related.map((r) => <ProductCard key={r.slug} p={r} />)}</div>
        </section>
      )}
    </div>
  );
}

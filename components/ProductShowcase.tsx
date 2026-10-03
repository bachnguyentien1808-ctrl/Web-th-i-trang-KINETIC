"use client";
import Link from "next/link";
import { useState } from "react";
import ProductCard from "@/components/ProductCard";
import { categories, products, type Product } from "@/lib/products";

const STEP = 10;

/** Xếp xen kẽ các danh mục để tab "Tất cả" không bị dồn toàn áo. */
function interleave(list: Product[]) {
  const groups = categories.map((c) => list.filter((p) => p.category === c.slug));
  const out: Product[] = [];
  for (let i = 0; groups.some((g) => i < g.length); i++) groups.forEach((g) => { if (g[i]) out.push(g[i]); });
  return out;
}

export default function ProductShowcase() {
  const [tab, setTab] = useState<"all" | string>("all");
  const [shown, setShown] = useState(10);
  const pool = tab === "all" ? interleave(products) : products.filter((p) => p.category === tab);
  const list = pool.slice(0, shown);

  const pick = (t: string) => { setTab(t); setShown(10); };

  return (
    <section className="showcase">
      <div className="sec-head"><h2>SẢN PHẨM NỔI BẬT</h2><Link href="/products" className="more">XEM TẤT CẢ {products.length} SẢN PHẨM →</Link></div>
      <div className="topic-chips">
        <button className={tab === "all" ? "chip on" : "chip"} onClick={() => pick("all")}>Tất cả ({products.length})</button>
        {categories.map((c) => <button key={c.slug} className={tab === c.slug ? "chip on" : "chip"} onClick={() => pick(c.slug)}>{c.label} ({products.filter((p) => p.category === c.slug).length})</button>)}
      </div>
      <div className="grid five">{list.map((p) => <ProductCard key={p.slug} p={p} />)}</div>
      <div className="show-more">
        {shown < pool.length
          ? <button className="btn btn-outline" onClick={() => setShown(shown + STEP)}>XEM THÊM {Math.min(STEP, pool.length - shown)} SẢN PHẨM ({shown}/{pool.length})</button>
          : <small className="muted">Đã hiển thị tất cả {pool.length} sản phẩm</small>}
      </div>
    </section>
  );
}

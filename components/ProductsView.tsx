"use client";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { filterProducts } from "@/lib/filter";
import { categories, products } from "@/lib/products";

export default function ProductsView({ sp }: { sp: Record<string, string | undefined> }) {
  const { cat, sub, q, season, sale, sort, tag, length, thick } = sp;
  let list = filterProducts({ cat, sub: cat === "phu-kien" ? sub : undefined, q, season, sale, tag, length, thick });
  if (sort === "asc") list = [...list].sort((a, b) => a.price - b.price);
  if (sort === "desc") list = [...list].sort((a, b) => b.price - a.price);

  // Gợi ý thêm bên dưới mọi danh sách đã lọc (nổi bật, hàng mới, bán chạy, giảm giá, danh mục, tìm kiếm...):
  // ưu tiên cùng danh mục / mùa, mỗi mẫu chỉ lấy 1 màu, bỏ các mẫu đã có trong kết quả, đủ ít nhất 10 món
  const filtered = !!(q || tag || sale || season || cat || sub || length || thick);
  const related = (() => {
    if (!filtered) return [];
    const fam = (p: (typeof products)[number]) => p.family ?? p.slug;
    const have = new Set(list.map(fam));
    const cats = new Set(list.map((p) => p.category));
    const seasons = new Set(list.map((p) => p.season));
    const score = (p: (typeof products)[number]) => (cats.has(p.category) ? 4 : 0) + (seasons.has(p.season) ? 2 : 0) + (p.badge ? 1 : 0) + p.rating / 10;
    const seen = new Set<string>();
    return [...products].sort((a, b) => score(b) - score(a)).filter((p) => {
      const k = fam(p);
      if (have.has(k) || seen.has(k)) return false;
      seen.add(k); return true;
    }).slice(0, Math.max(10, 15 - list.length));
  })();

  const href = (o: Record<string, string | undefined>) => {
    const sp = new URLSearchParams();
    Object.entries({ cat, sub, q, season, sale, sort, tag, length, thick, ...o }).forEach(([k, v]) => v && sp.set(k, v));
    return `/products?${sp}`;
  };
  const tagTitle: Record<string, string> = { new: "HÀNG MỚI VỀ", best: "BÁN CHẠY NHẤT", limited: "PHIÊN BẢN GIỚI HẠN" };
  const title = tag && tagTitle[tag] ? tagTitle[tag] : sale ? "OUTLET" : cat ? categories.find((c) => c.slug === cat)?.label.toUpperCase() : "TẤT CẢ SẢN PHẨM";

  return (
    <div className="container section">
      <div className="sec-head"><h1 className="h1">{q ? `KẾT QUẢ: "${q}"` : title}</h1><small>{list.length} sản phẩm</small></div>
      {!q && cat === "phu-kien" && (
        <div className="filters">
          <Link href={href({ sub: undefined })} className={!sub ? "chip on" : "chip"}>Tất cả</Link>
          <Link href={href({ sub: "ba-lo" })} className={sub === "ba-lo" ? "chip on" : "chip"}>Ba-lo</Link>
          <Link href={href({ sub: "mu" })} className={sub === "mu" ? "chip on" : "chip"}>Mũ</Link>
        </div>
      )}
      {!q && cat !== "phu-kien" && <div className="filters">
        <Link href={href({ cat: undefined })} className={!cat ? "chip on" : "chip"}>Tất cả</Link>
        {categories.map((c) => <Link key={c.slug} href={href({ cat: c.slug })} className={cat === c.slug ? "chip on" : "chip"}>{c.label}</Link>)}
        <span className="spacer" />
        <Link href={href({ sort: "asc" })} className={sort === "asc" ? "chip on" : "chip"}>Giá ↑</Link>
        <Link href={href({ sort: "desc" })} className={sort === "desc" ? "chip on" : "chip"}>Giá ↓</Link>
      </div>}
      {list.length ? <div className="grid five">{list.map((p) => <ProductCard key={p.slug} p={p} />)}</div> : <p className="muted pad">Không tìm thấy sản phẩm phù hợp.</p>}
      {related.length > 0 && (
        <section className="prow">
          <div className="sec-head"><h2>{list.length ? "CÓ THỂ BẠN CŨNG THÍCH" : "SẢN PHẨM LIÊN QUAN"}</h2></div>
          <div className="grid five">{related.map((p) => <ProductCard key={p.slug} p={p} />)}</div>
        </section>
      )}
    </div>
  );
}

import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/products";

export default function ProductRow({ title, href, items, note }: { title: string; href: string; items: Product[]; note?: string }) {
  if (!items.length) return null;
  return (
    <section className="prow">
      <div className="sec-head"><h2>{title}</h2><Link href={href} className="more">XEM TẤT CẢ →</Link></div>
      {note && <p className="muted small prow-note">{note}</p>}
      <div className="grid five">{items.map((p) => <ProductCard key={p.slug} p={p} />)}</div>
    </section>
  );
}

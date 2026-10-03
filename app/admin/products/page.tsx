"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { deleteProduct, isCustomProduct } from "@/lib/catalog";
import { readAllOrders } from "@/lib/orders";
import { formatVnd, products, thicknessLabel, thumb } from "@/lib/products";

export default function AdminProducts() {
  const [sold, setSold] = useState<Record<string, number> | null>(null);
  useEffect(() => {
    const m: Record<string, number> = {};
    readAllOrders().filter((o) => !o.cancel).forEach((o) => o.items.forEach((i) => { m[i.slug] = (m[i.slug] ?? 0) + i.qty; }));
    setSold(m);
  }, []);
  if (!sold) return null;
  return (
    <>
      <div className="admin-head"><h1 className="h1">SẢN PHẨM ({products.length})</h1><Link href="/admin/products/new" className="btn btn-black sm">+ THÊM SẢN PHẨM</Link></div>
      <p className="muted small">Mọi sản phẩm đều thêm / sửa / xoá được. Sản phẩm admin thêm có nhãn <b>MỚI THÊM</b>.</p>
      <div className="table prod">
        <div className="tr th"><span>Sản phẩm</span><span>Danh mục</span><span>Giá</span><span>Size</span><span>Đã bán</span></div>
        {products.map((p) => {
          const custom = isCustomProduct(p.slug);
          return (
            <div key={p.slug} className="tr">
              <span className="cellp"><span className="sum-img"><Image src={thumb(p.image)} alt="" fill sizes="56px" /></span>
                <Link href={`/admin/products/${p.slug}`} className="ul"><b>{p.name}</b></Link>
                {custom && <i className="v-best">MỚI THÊM</i>}{p.badge && <i className="v-best">{p.badge}</i>}
                {(
                  <span className="row-actions">
                    <Link href={`/admin/products/${p.slug}/edit`} className="ul">Sửa</Link>
                    <button className="ul danger" onClick={() => { if (confirm(`Xoá sản phẩm "${p.name}"?`)) deleteProduct(p.slug); }}>Xoá</button>
                  </span>
                )}
              </span>
              <span>{p.categoryLabel}{p.spec && <small className="muted"> · {p.spec.length}, {thicknessLabel[p.spec.thickness]}</small>}</span>
              <span><b>{formatVnd(p.price)}</b>{p.oldPrice && <s className="muted"> {formatVnd(p.oldPrice)}</s>}</span>
              <span>{p.sizes.map((s) => <small key={s.label} className={s.inStock ? "sz" : "sz out"}>{s.label}</small>)}</span>
              <span><b>{sold[p.slug] ?? 0}</b></span>
            </div>
          );
        })}
      </div>
    </>
  );
}

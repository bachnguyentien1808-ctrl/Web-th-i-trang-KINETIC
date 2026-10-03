"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import { getProduct } from "@/lib/products";
import { useEffect, useState } from "react";
import type { Product } from "@/lib/products";

export default function EditProduct() {
  const { slug } = useParams<{ slug: string }>();
  const [p, setP] = useState<Product | null | undefined>(undefined);
  useEffect(() => setP(getProduct(slug) ?? null), [slug]);
  if (p === undefined) return null;
  if (p === null) {
    return (
      <>
        <h1 className="h1">KHÔNG THỂ SỬA</h1>
        <p className="muted pad">Không tìm thấy sản phẩm.</p>
        <Link href="/admin/products" className="ul">← Về danh sách sản phẩm</Link>
      </>
    );
  }
  return <><h1 className="h1">SỬA SẢN PHẨM</h1><ProductForm initial={p} /></>;
}

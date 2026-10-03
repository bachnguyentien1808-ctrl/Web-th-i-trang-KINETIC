"use client";
import { useCart } from "@/lib/cart";
import { getProduct, getVariants } from "@/lib/products";

/** Đổi màu của một dòng trong giỏ hàng (chỉ hiện khi sản phẩm có nhiều màu). */
export default function CartColor({ slug, size }: { slug: string; size: string }) {
  const { changeColor } = useCart();
  const p = getProduct(slug);
  if (!p) return null;
  const variants = getVariants(p);
  if (variants.length < 2) return null;
  return (
    <label className="cart-color">
      <span>Màu:</span>
      <select value={slug} onChange={(e) => changeColor(slug, size, e.target.value)} aria-label="Chọn màu">
        {variants.map((v) => <option key={v.slug} value={v.slug}>{v.label}</option>)}
      </select>
    </label>
  );
}

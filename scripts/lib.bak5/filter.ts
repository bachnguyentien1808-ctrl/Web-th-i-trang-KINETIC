import { products, type Product } from "./products";

export interface Filters {
  cat?: string; sub?: string; q?: string; season?: string; sale?: string; tag?: string; length?: string; thick?: string;
}

const tagBadge: Record<string, string> = { new: "NEW DROP", best: "BESTSELLER", limited: "LIMITED DROP" };

export function filterProducts(f: Filters): Product[] {
  const q = f.q?.toLowerCase();
  return products.filter((p) =>
    (!f.cat || p.category === f.cat) && (!f.sub || (f.sub === "ba-lo" ? /^(ba-?lo|túi)/i.test(p.name) : /^mũ/i.test(p.name))) && (!f.season || p.season === f.season) && (!f.sale || p.oldPrice) &&
    (!f.tag || p.badge === tagBadge[f.tag]) && (!f.length || p.spec?.length === f.length) && (!f.thick || String(p.spec?.thickness) === f.thick) &&
    (!q || p.name.toLowerCase().includes(q) || p.categoryLabel.toLowerCase().includes(q)));
}

/** Số sản phẩm mà một đường dẫn /products?... sẽ hiển thị (dùng để ẩn liên kết trống trong menu). */
export function countForHref(href: string) {
  const [path, query = ""] = href.split("?");
  if (path !== "/products") return 1;
  const sp = new URLSearchParams(query);
  return filterProducts(Object.fromEntries(sp.entries())).length;
}

"use client";
import Image from "next/image";
import Link from "next/link";
import { countForHref } from "@/lib/filter";
import { categories, getProduct, products, thumb } from "@/lib/products";
import { vouchers } from "@/lib/vouchers";

export type MenuKey = "all" | "ao" | "quan" | "giay" | "phu-kien" | "outlet" | "offers";

export const menuItems: { key: MenuKey; label: string; href: string; className?: string }[] = [
  { key: "all", label: "Tất cả", href: "/products" },
  ...categories.map((c) => ({ key: c.slug as MenuKey, label: c.label, href: `/products?cat=${c.slug}` })),
  { key: "outlet", label: "Outlet", href: "/products?sale=1", className: "sale-link" },
  { key: "offers", label: "Ưu đãi", href: "/offers", className: "offer-link" },
];

type Col = { title: string; links: { label: string; href: string }[] };
interface Panel { cols: Col[]; features: string[]; footer: { label: string; href: string }[] }

const season = (cat: string): Col => ({
  title: "THEO MÙA",
  links: [["Mùa Xuân", "xuan"], ["Mùa Hạ", "ha"], ["Mùa Thu", "thu"], ["Mùa Đông", "dong"]].map(([label, s]) => ({ label, href: `/products?cat=${cat}&season=${s}` })),
});
const featured = (cat: string): Col => ({
  title: "NỔI BẬT",
  links: [
    { label: "Hàng mới về", href: `/products?cat=${cat}&tag=new` },
    { label: "Bán chạy nhất", href: `/products?cat=${cat}&tag=best` },
    { label: "Đang giảm giá", href: `/products?cat=${cat}&sale=1` },
    { label: "Phiên bản giới hạn", href: `/products?cat=${cat}&tag=limited` },
  ],
});

const panels: Record<Exclude<MenuKey, "offers">, Panel> = {
  all: {
    cols: [
      { title: "NỔI BẬT", links: [
        { label: "Hàng mới về", href: "/products?tag=new" }, { label: "Bán chạy nhất", href: "/products?tag=best" },
        { label: "Phiên bản giới hạn", href: "/products?tag=limited" }, { label: "Đang giảm giá", href: "/products?sale=1" },
      ] },
      { title: "DANH MỤC", links: categories.map((c) => ({ label: c.label, href: `/products?cat=${c.slug}` })) },
      { title: "THEO MÙA", links: [["Mùa Xuân", "xuan"], ["Mùa Hạ", "ha"], ["Mùa Thu", "thu"], ["Mùa Đông", "dong"]].map(([label, s]) => ({ label, href: `/products?season=${s}` })) },
      { title: "ĐỘ DÀY", links: [["Mỏng nhẹ", "1"], ["Vừa", "2"], ["Dày ấm", "3"]].map(([label, t]) => ({ label, href: `/products?thick=${t}` })) },
    ],
    features: ["balo-roll-top-hybrid-audi-revolut-f1", "giay-dua-kinetic-carbon-elite-pro-v3"],
    footer: [{ label: "Tất cả sản phẩm", href: "/products" }, { label: "Tất cả áo", href: "/products?cat=ao" }, { label: "Tất cả giày", href: "/products?cat=giay" }, { label: "Tất cả phụ kiện", href: "/products?cat=phu-kien" }],
  },
  ao: {
    cols: [
      featured("ao"),
      { title: "LOẠI ÁO", links: [["Áo thun", "thun"], ["Áo khoác", "khoác"], ["Áo gió", "gió"], ["Áo phao", "phao"], ["Áo polo", "polo"], ["Áo gile", "gile"]].map(([label, q]) => ({ label, href: `/products?cat=ao&q=${encodeURIComponent(q)}` })) },
      season("ao"),
      { title: "TAY ÁO & ĐỘ DÀY", links: [
        { label: "Tay ngắn", href: "/products?cat=ao&length=Tay%20ng%E1%BA%AFn" }, { label: "Tay dài", href: "/products?cat=ao&length=Tay%20d%C3%A0i" },
        { label: "Mỏng nhẹ", href: "/products?cat=ao&thick=1" }, { label: "Dày ấm", href: "/products?cat=ao&thick=3" },
      ] },
    ],
    features: ["ao-phao-the-thao-thermo-puffer", "ao-thun-chay-sieu-thoang-heat-rdy"],
    footer: [{ label: "Tất cả áo", href: "/products?cat=ao" }, { label: "Áo đang giảm giá", href: "/products?cat=ao&sale=1" }, { label: "Áo tay ngắn", href: "/products?cat=ao&length=Tay%20ng%E1%BA%AFn" }],
  },
  quan: {
    cols: [
      featured("quan"),
      { title: "LOẠI QUẦN", links: [
        { label: "Quần dài", href: "/products?cat=quan&length=Qu%E1%BA%A7n%20d%C3%A0i" }, { label: "Quần short", href: "/products?cat=quan&length=Qu%E1%BA%A7n%20short" },
        { label: "Quần jogger", href: "/products?cat=quan&q=jogger" }, { label: "Track pants", href: "/products?cat=quan&q=track" },
      ] },
      season("quan"),
      { title: "ĐỘ DÀY", links: [{ label: "Mỏng nhẹ", href: "/products?cat=quan&thick=1" }, { label: "Vừa", href: "/products?cat=quan&thick=2" }] },
    ],
    features: ["quan-jogger-tech-fleece-kinetic", "quan-track-pants-kinetic-audi-f1"],
    footer: [{ label: "Tất cả quần", href: "/products?cat=quan" }, { label: "Quần đang giảm giá", href: "/products?cat=quan&sale=1" }],
  },
  giay: {
    cols: [
      featured("giay"),
      { title: "LOẠI GIÀY", links: [["Giày đua", "đua"], ["Giày chạy bộ", "chạy"], ["Giày địa hình", "địa hình"], ["Giày Gore-Tex", "gore"]].map(([label, q]) => ({ label, href: `/products?cat=giay&q=${encodeURIComponent(q)}` })) },
      season("giay"),
    ],
    features: ["giay-dua-kinetic-carbon-elite-pro-v3", "giay-chay-dia-hinh-terrex-gtx"],
    footer: [{ label: "Tất cả giày", href: "/products?cat=giay" }, { label: "Giày đang giảm giá", href: "/products?cat=giay&sale=1" }],
  },
  "phu-kien": {
    cols: [
      featured("phu-kien"),
      { title: "LOẠI PHỤ KIỆN", links: [["Ba-lo", "ba-lo"], ["Mũ", "mu"]].map(([label, s]) => ({ label, href: `/products?cat=phu-kien&sub=${s}` })) },
      { title: "BỘ SƯU TẬP", links: [{ label: "Audi Revolut F1® Collection", href: "/products?cat=phu-kien&q=audi" }] },
    ],
    features: ["balo-roll-top-hybrid-audi-revolut-f1", "mu-luoi-trai-audi-f1-team-cap"],
    footer: [{ label: "Tất cả phụ kiện", href: "/products?cat=phu-kien" }],
  },
  outlet: {
    cols: [
      { title: "GIẢM GIÁ THEO LOẠI", links: categories.map((c) => ({ label: c.label, href: `/products?cat=${c.slug}&sale=1` })) },
      { title: "THEO MÙA", links: [["Mùa Xuân", "xuan"], ["Mùa Hạ", "ha"], ["Mùa Thu", "thu"], ["Mùa Đông", "dong"]].map(([label, s]) => ({ label, href: `/products?sale=1&season=${s}` })) },
    ],
    features: ["ao-phao-the-thao-thermo-puffer", "quan-jogger-tech-fleece-kinetic"],
    footer: [{ label: "Tất cả sản phẩm giảm giá", href: "/products?sale=1" }, { label: "Xem voucher & ưu đãi", href: "/offers" }],
  },
};

const short = (s: string) => (s.length > 78 ? s.slice(0, 75).trimEnd() + "…" : s);

export default function MegaMenu({ active, onClose }: { active: MenuKey; onClose: () => void }) {
  if (active === "offers") {
    return (
      <div className="mega" onClick={onClose}>
        <div className="container mega-vouchers">
          {vouchers.map((v) => <Link key={v.code} href="/offers"><b>{v.code}</b><span>{v.title}</span><small>{v.desc}</small></Link>)}
          <Link href="/offers" className="mega-more">XEM TẤT CẢ ƯU ĐÃI →</Link>
        </div>
      </div>
    );
  }
  const raw = panels[active];
  // Chỉ hiện liên kết thật sự có sản phẩm; bỏ cột/hàng trống
  const panel: Panel = {
    ...raw,
    cols: raw.cols.map((c) => ({ ...c, links: c.links.filter((l) => countForHref(l.href) > 0) })).filter((c) => c.links.length > 0),
    footer: raw.footer.filter((f) => countForHref(f.href) > 0),
  };
  return (
    <div className="mega" onClick={onClose}>
      <div className="container mega-in">
        <div className="mega-cols">
          {panel.cols.map((c) => (
            <div key={c.title} className="mega-col">
              <h4>{c.title}</h4>
              {c.links.map((l) => <Link key={l.label} href={l.href}>{l.label}</Link>)}
            </div>
          ))}
        </div>
        <div className="mega-feats">
          {panel.features.map((slug) => {
            const p = getProduct(slug) ?? products[0];
            return (
              <Link key={slug} href={`/products/${p.slug}`} className="mega-feat">
                <span className="mega-feat-img"><Image src={thumb(p.image)} alt={p.name} fill sizes="200px" /></span>
                <b>{p.name}</b>
                <small>{short(p.description)}</small>
              </Link>
            );
          })}
        </div>
      </div>
      <div className="mega-foot"><div className="container">{panel.footer.map((f) => <Link key={f.label} href={f.href}>{f.label}</Link>)}</div></div>
    </div>
  );
}

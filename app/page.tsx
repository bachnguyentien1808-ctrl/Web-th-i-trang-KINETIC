"use client";
import Image from "next/image";
import Link from "next/link";
import HeroCarousel from "@/components/HeroCarousel";
import ProductRow from "@/components/ProductRow";
import ProductShowcase from "@/components/ProductShowcase";
import PromoBanners from "@/components/PromoBanners";
import VoucherCard from "@/components/VoucherCard";
import { vouchers } from "@/lib/vouchers";
import { products } from "@/lib/products";
import images from "@/lib/images.json";

const img = images as Record<string, string>;

const tiles = [
  { href: "/products?cat=ao", tag: "ÁO", title: "ÁO THỂ THAO", sub: "Nhẹ nhàng · Thoáng khí · Hiện đại", src: img["winter-hero"] },
  { href: "/products?cat=quan", tag: "QUẦN", title: "QUẦN THỂ THAO", sub: "Co giãn · Linh hoạt · Quyến rũ", src: img["summer-hero"] },
  { href: "/products?cat=giay", tag: "GIÀY", title: "GIÀY THỂ THAO", sub: "Êm ái · Bền bỉ · Hiệu suất cao", src: img["shoe-trail"] },
  { href: "/products?cat=phu-kien", tag: "PHỤ KIỆN", title: "PHỤ KIỆN THỂ THAO", sub: "Tiện lợi · Thời trang · Đa năng", src: img["bag-model"] },
];

const mini = ["jacket-mint", "tee-volt", "shorts", "puffer"];

export default function Home() {
  const newest = products.filter((p) => p.badge === "NEW DROP").concat(products.slice().reverse()).filter((p, i, a) => a.indexOf(p) === i).slice(0, 10);
  const best = products.filter((p) => p.badge === "BESTSELLER" || p.rating >= 4.9).slice(0, 10);
  const sale = products.filter((p) => p.oldPrice).slice(0, 10);
  return (
    <>
      {/* BIG HERO - băng chuyền tự chạy */}
      <HeroCarousel />

      <div className="container home">
      {/* CATEGORY TILES */}
      <section className="hb-tiles">
        {tiles.map((t) => (
          <Link key={t.tag} href={t.href} className="hb-tile">
            <Image src={t.src} alt={t.title} fill sizes="25vw" />
            <div className="hb-shade" />
            <small>{t.tag}</small>
            <div className="hb-tile-txt">
              <h3>{t.title}</h3>
              <p>{t.sub}</p>
              <span className="ghost-btn">XEM NGAY →</span>
            </div>
          </Link>
        ))}
      </section>

      {/* COLLECTION BANNER */}
      <PromoBanners />

      <section className="hb-collection">
        <div className="hb-col-left">
          <small>BỘ SƯU TẬP MỚI</small>
          <h2>SPRING / SUMMER<br />COLLECTION 2025</h2>
          <p>Thoáng mát · Co giãn tốt · Thấm hút mồ hôi</p>
          <Link href="/products?season=ha" className="btn btn-black pill">KHÁM PHÁ NGAY →</Link>
        </div>
        <div className="hb-col-img"><Image src={img["summer-hero"]} alt="Bộ sưu tập hè" fill sizes="30vw" /></div>
        <div className="hb-col-right">
          <div className="mini-grid">
            {mini.map((k) => <div key={k} className="mini"><Image src={img[k]} alt="" fill sizes="120px" /></div>)}
          </div>
          <ul>
            <li><b>◎</b> Công nghệ thoáng khí</li>
            <li><b>◇</b> Chất liệu cao cấp</li>
            <li><b>☺</b> Dành cho mọi hoạt động</li>
          </ul>
        </div>
      </section>

      {/* OFFERS */}
      <section className="hb-offers-sec">
        <div className="sec-head"><h2>ƯU ĐÃI & VOUCHER</h2><Link href="/offers" className="more">XEM TẤT CẢ ƯU ĐÃI →</Link></div>
        <div className="vc-grid four">{vouchers.map((v) => <VoucherCard key={v.code} v={v} compact />)}</div>
      </section>

      {/* FEATURED */}
      <ProductShowcase />

      <ProductRow title="HÀNG MỚI VỀ" href="/products?tag=new" items={newest} />

      {/* TWO BANNERS */}
      <section className="hb-duo">
        <Link href="/products?season=thu" className="hb-banner">
          <Image src={img["autumn-hero"]} alt="Outdoor" fill sizes="50vw" />
          <div className="hb-shade" />
          <div className="hb-banner-txt">
            <small>DÀNH CHO NGƯỜI YÊU THIÊN NHIÊN</small>
            <h2>BỘ SƯU TẬP<br />OUTDOOR</h2>
            <p>Khám phá giới hạn bản thân</p>
            <span className="ghost-btn">KHÁM PHÁ NGAY →</span>
          </div>
        </Link>
        <Link href="/products?season=dong" className="hb-banner">
          <Image src={img["winter-hero"]} alt="Đồ tập" fill sizes="50vw" />
          <div className="hb-shade" />
          <div className="hb-banner-txt">
            <small>FITNESS</small>
            <h2>ĐỒ TẬP GYM</h2>
            <p>Tối ưu hiệu suất · Nâng tầm vóc dáng</p>
            <span className="ghost-btn">MUA NGAY →</span>
          </div>
        </Link>
      </section>

      <ProductRow title="BÁN CHẠY NHẤT" href="/products?tag=best" items={best} />

      {/* SALE */}
      <section className="hb-sale">
        <Image src={img["shoe-winter"]} alt="Sale" fill sizes="100vw" />
        <div className="hb-shade wide" />
        <div className="hb-sale-txt">
          <small className="tag">ƯU ĐÃI ĐẶC BIỆT</small>
          <h2>SALE THỂ THAO<br />LÊN ĐẾN <span>50%++</span></h2>
          <p>Số lượng có hạn · Đừng bỏ lỡ!</p>
          <Link href="/products?sale=1" className="btn btn-black pill">MUA NGAY →</Link>
        </div>
        <div className="hb-sale-perks">
          <div><b>🚚</b>Freeship<br />từ 500k</div>
          <div><b>🛡</b>Hàng chính hãng<br />100%</div>
          <div><b>↻</b>Đổi trả<br />trong 7 ngày</div>
        </div>
      </section>

      <ProductRow title="ĐANG GIẢM GIÁ" href="/products?sale=1" items={sale} note="Kết hợp nhiều voucher ở bước thanh toán để tiết kiệm thêm." />
      </div>
    </>
  );
}

import Image from "next/image";
import Link from "next/link";
import { formatVnd, getProduct, products, thumb, type Product } from "@/lib/products";

const pick = (slugs: string[], fallback: Product[]) => {
  const found = slugs.map((s) => getProduct(s)).filter((p): p is Product => !!p);
  return [...found, ...fallback.filter((p) => !found.includes(p))].slice(0, slugs.length);
};
const onSale = products.filter((p) => p.oldPrice);
const off = (p: Product) => (p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0);

function Card({ p, tilt, cls = "" }: { p: Product; tilt: number; cls?: string }) {
  return (
    <Link href={`/products/${p.slug}`} className={`pb-card ${cls}`} style={{ ["--r" as string]: `${tilt}deg` }} aria-label={p.name}>
      <span className="pb-img"><Image src={thumb(p.image)} alt={p.name} fill sizes="220px" /></span>
      {off(p) > 0 && <em className="pb-off">-{off(p)}%</em>}
      <span className="pb-info"><b>{p.name.replace(/ - .*$/, "")}</b><i>{formatVnd(p.price)}</i></span>
    </Link>
  );
}

/** 3 banner khuyến mãi: ưu đãi lớn (ngang), giày, phụ kiện - dựng bằng ảnh sản phẩm thật của shop. */
export default function PromoBanners() {
  const big = pick(["ao-phao-the-thao-thermo-puffer", "giay-sneaker-chunky-trang-xam", "balo-pickleball-jogarbola-xanh-navy"], onSale);
  const shoes = pick(["giay-sneaker-luoi-mint-boost", "giay-chay-bo-skechers-max-cushioning-trang-tim", "giay-sneaker-da-trang-kem"], onSale);
  const acc = pick(["mu-luoi-trai-la-cam-dat", "balo-mini-the-thao-keepfly-do", "mu-nua-dau-the-thao-hong-pastel"], onSale);
  return (
    <section className="pb" aria-label="Khuyến mãi nổi bật">
      <article className="pb-big">
        <div className="pb-big-txt">
          <small className="pb-tag">ƯU ĐÃI THÁNG NÀY</small>
          <h2>SPORTS GEAR<span>SALE</span></h2>
          <p>Giảm đến <b>50%++</b> cho áo, quần, giày và phụ kiện. Số lượng có hạn.</p>
          <div className="pb-cta"><Link href="/products?sale=1" className="pb-btn">MUA NGAY →</Link><span className="pb-limit">⏱ GIỚI HẠN THỜI GIAN</span></div>
        </div>
        <div className="pb-stack">
          <Card p={big[0]} tilt={-7} cls="a" /><Card p={big[1]} tilt={0} cls="b" /><Card p={big[2]} tilt={7} cls="c" />
        </div>
        <ul className="pb-perks"><li>🚚 Freeship từ 899.000₫</li><li>🛡 Hàng chính hãng 100%</li><li>↻ Đổi trả 30 ngày</li></ul>
      </article>

      <div className="pb-duo">
        <article className="pb-sm shoes">
          <div className="pb-sm-txt">
            <small className="pb-tag dark">SNEAKER & CHẠY BỘ</small>
            <h3>GIÀY<br /><span>MỚI VỀ</span></h3>
            <p>Êm chân, nhẹ bước, nhiều màu.</p>
            <Link href="/products?cat=giay" className="pb-btn sm">XEM GIÀY →</Link>
          </div>
          <div className="pb-stack sm"><Card p={shoes[0]} tilt={-6} cls="a" /><Card p={shoes[1]} tilt={5} cls="b" /></div>
        </article>
        <article className="pb-sm acc">
          <div className="pb-sm-txt">
            <small className="pb-tag dark">MŨ & BALO</small>
            <h3>PHỤ KIỆN<br /><span>HOT TREND</span></h3>
            <p>Hoàn thiện outfit thể thao của bạn.</p>
            <Link href="/products?cat=phu-kien" className="pb-btn sm">XEM PHỤ KIỆN →</Link>
          </div>
          <div className="pb-stack sm"><Card p={acc[0]} tilt={-6} cls="a" /><Card p={acc[1]} tilt={5} cls="b" /></div>
        </article>
      </div>
    </section>
  );
}

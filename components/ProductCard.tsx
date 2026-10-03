import Image from "next/image";
import Link from "next/link";
import Stars from "@/components/Stars";
import { formatVnd, thicknessLabel, type Product, thumb } from "@/lib/products";

const badgeClass: Record<string, string> = {
  BESTSELLER: "b-black", "MEMBER ONLY": "b-volt", "LIMITED DROP": "b-red", SALE: "b-red", "NEW DROP": "b-volt",
};

export default function ProductCard({ p }: { p: Product }) {
  const alt = p.gallery[1];
  return (
    <Link href={`/products/${p.slug}`} className="card">
      <div className="card-img">
        {p.badge && <span className={`badge ${badgeClass[p.badge]}`}>{p.badge}</span>}
        <Image src={thumb(p.image)} alt={p.name} fill sizes="(max-width:768px) 50vw, 25vw" className="img-a" />
        {p.spec && <div className="card-spec"><span>{p.spec.length}</span><i>·</i><span>{thicknessLabel[p.spec.thickness]}</span><em className="thick" data-t={p.spec.thickness}><u /><u /><u /></em></div>}
        {alt && <Image src={thumb(alt)} alt="" fill sizes="(max-width:768px) 50vw, 25vw" className="img-b" />}
      </div>
      <div className="card-info">
        <small className="cat">{p.categoryLabel}</small>
        <h3>{p.name}</h3>
        <span className="card-rate"><Stars value={p.rating} size={13} /><b>{p.rating.toFixed(1)}</b><small>({p.reviews})</small></span>
        <div className="prices">
          <b className="price">{formatVnd(p.price)}</b>
          {p.oldPrice && <s>{formatVnd(p.oldPrice)}</s>}
        </div>
      </div>
    </Link>
  );
}

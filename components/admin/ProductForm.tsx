"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveProduct } from "@/lib/catalog";
import { categories, products, type Category, type Product, type Season } from "@/lib/products";
import { compressImage } from "@/lib/reviews";

const BADGES = ["", "BESTSELLER", "MEMBER ONLY", "LIMITED DROP", "SALE", "NEW DROP"] as const;
const SEASONS: { v: Season | ""; l: string }[] = [{ v: "", l: "Quanh năm" }, { v: "xuan", l: "Mùa Xuân" }, { v: "ha", l: "Mùa Hạ" }, { v: "thu", l: "Mùa Thu" }, { v: "dong", l: "Mùa Đông" }];
const LENGTHS: Record<string, string[]> = { ao: ["Tay ngắn", "Tay dài", "Không tay"], quan: ["Quần dài", "Quần short"] };
const PRESET: Record<string, string> = { ao: "S, M, L, XL, XXL", quan: "S, M, L, XL, XXL", giay: "39, 40, 41, 42, 43, 44", "phu-kien": "FREE SIZE" };

const slugify = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const list = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

export default function ProductForm({ initial }: { initial?: Product }) {
  const router = useRouter();
  const editing = !!initial;
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState<Category>(initial?.category ?? "ao");
  const [label, setLabel] = useState(initial?.categoryLabel ?? "");
  const [price, setPrice] = useState(initial ? String(initial.price) : "");
  const [oldPrice, setOldPrice] = useState(initial?.oldPrice ? String(initial.oldPrice) : "");
  const [badge, setBadge] = useState<string>(initial?.badge ?? "");
  const [season, setSeason] = useState<string>(initial?.season ?? "");
  const [length, setLength] = useState(initial?.spec?.length ?? "");
  const [thick, setThick] = useState(initial?.spec ? String(initial.spec.thickness) : "");
  const [sizes, setSizes] = useState(initial ? initial.sizes.map((s) => s.label).join(", ") : PRESET.ao);
  const [outOfStock, setOutOfStock] = useState(initial ? initial.sizes.filter((s) => !s.inStock).map((s) => s.label).join(", ") : "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [tech, setTech] = useState(initial?.tech ?? "");
  const [images, setImages] = useState<string[]>(initial?.gallery ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  function changeCategory(c: Category) {
    if (Object.values(PRESET).includes(sizes) || !sizes) setSizes(PRESET[c]);
    setCategory(c); setLength("");
  }

  async function addImages(files: FileList | null) {
    if (!files) return;
    const room = 5 - images.length;
    const picked = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, room);
    if (!picked.length) return;
    setBusy(true);
    try { setImages([...images, ...(await Promise.all(picked.map((f) => compressImage(f, 900))))]); setErrors((e) => ({ ...e, images: "" })); }
    catch { setErrors((e) => ({ ...e, images: "Không đọc được ảnh, hãy thử ảnh khác." })); }
    setBusy(false);
  }
  const makeMain = (i: number) => setImages([images[i], ...images.filter((_, n) => n !== i)]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    const p = Number(price), op = oldPrice ? Number(oldPrice) : 0;
    const sz = list(sizes);
    if (!name.trim()) err.name = "Vui lòng nhập tên sản phẩm";
    if (!Number.isFinite(p) || p <= 0) err.price = "Giá phải lớn hơn 0";
    if (oldPrice && (!Number.isFinite(op) || op <= p)) err.oldPrice = "Giá gốc phải lớn hơn giá bán";
    if (!sz.length) err.sizes = "Nhập ít nhất 1 size";
    if (!description.trim()) err.description = "Vui lòng nhập mô tả";
    if (!images.length) err.images = "Cần ít nhất 1 ảnh sản phẩm";
    if ((length && !thick) || (!length && thick)) err.spec = "Chọn đủ cả chiều dài và độ dày, hoặc để trống cả hai";
    setErrors(err);
    if (Object.keys(err).length) return;

    let slug = initial?.slug ?? slugify(name);
    if (!editing) { const base = slug || "san-pham"; slug = base; for (let n = 2; products.some((x) => x.slug === slug); n++) slug = `${base}-${n}`; }
    const out = list(outOfStock).map((x) => x.toLowerCase());
    const catLabel = categories.find((c) => c.slug === category)!.label;

    const product: Product = {
      slug, name: name.trim(), category, categoryLabel: label.trim() || catLabel,
      season: (season || undefined) as Season | undefined, price: p, oldPrice: op || undefined,
      badge: (badge || undefined) as Product["badge"], image: images[0], gallery: images,
      rating: initial?.rating ?? 0, reviews: initial?.reviews ?? 0,
      sizes: sz.map((s) => ({ label: s, inStock: !out.includes(s.toLowerCase()) })),
      description: description.trim(), tech: tech.trim(),
      spec: length && thick ? { length, thickness: Number(thick) as 1 | 2 | 3 } : undefined,
    };
    if (!saveProduct(product)) { alert("Bộ nhớ trình duyệt đã đầy. Hãy dùng ít ảnh hơn hoặc ảnh nhỏ hơn."); return; }
    router.push("/admin/products");
  }

  const field = (key: string, labelText: string, node: React.ReactNode, hint?: string) => (
    <label className={errors[key] ? "field bad" : "field"}><span>{labelText}</span>{node}{hint && <small className="muted">{hint}</small>}{errors[key] && <em>{errors[key]}</em>}</label>
  );

  return (
    <form className="pform" onSubmit={submit} noValidate>
      {field("name", "TÊN SẢN PHẨM *", <input value={name} onChange={(e) => setName(e.target.value)} />)}
      <div className="two">
        {field("category", "DANH MỤC *", <select value={category} onChange={(e) => changeCategory(e.target.value as Category)}>{categories.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}</select>)}
        {field("label", "NHÃN DANH MỤC PHỤ", <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ví dụ: Heat.RDY Pro Cooling" />)}
      </div>
      <div className="two">
        {field("price", "GIÁ BÁN (₫) *", <input inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))} />)}
        {field("oldPrice", "GIÁ GỐC (₫) - nếu đang giảm giá", <input inputMode="numeric" value={oldPrice} onChange={(e) => setOldPrice(e.target.value.replace(/\D/g, ""))} />)}
      </div>
      <div className="two">
        {field("badge", "NHÃN NỔI BẬT", <select value={badge} onChange={(e) => setBadge(e.target.value)}>{BADGES.map((b) => <option key={b} value={b}>{b || "Không có"}</option>)}</select>)}
        {field("season", "MÙA", <select value={season} onChange={(e) => setSeason(e.target.value)}>{SEASONS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}</select>)}
      </div>
      {LENGTHS[category] && (
        <div className="two">
          {field("spec", "CHIỀU DÀI", <select value={length} onChange={(e) => setLength(e.target.value)}><option value="">- Không áp dụng -</option>{LENGTHS[category].map((x) => <option key={x}>{x}</option>)}</select>)}
          {field("spec2", "ĐỘ DÀY", <select value={thick} onChange={(e) => setThick(e.target.value)}><option value="">- Không áp dụng -</option><option value="1">Mỏng</option><option value="2">Vừa</option><option value="3">Dày</option></select>)}
        </div>
      )}
      <div className="two">
        {field("sizes", "CÁC SIZE * (cách nhau dấu phẩy)", <input value={sizes} onChange={(e) => setSizes(e.target.value)} />)}
        {field("outOfStock", "SIZE HẾT HÀNG", <input value={outOfStock} onChange={(e) => setOutOfStock(e.target.value)} placeholder="Ví dụ: XXL" />)}
      </div>
      {field("description", "MÔ TẢ *", <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />)}
      {field("tech", "THÔNG SỐ / CÔNG NGHỆ", <input value={tech} onChange={(e) => setTech(e.target.value)} placeholder="Ví dụ: Cotton 100% · Khô nhanh" />)}

      <div className={errors.images ? "field bad" : "field"}>
        <span>ẢNH SẢN PHẨM * (tối đa 5 · ảnh đầu tiên là ảnh chính)</span>
        <div className="photo-row">
          {images.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <div key={i} className="photo big"><img src={src} alt={`Ảnh ${i + 1}`} />
              {i === 0 ? <i className="v-best main">ẢNH CHÍNH</i> : <button type="button" className="mk" onClick={() => makeMain(i)}>Làm ảnh chính</button>}
              <button type="button" className="x" onClick={() => setImages(images.filter((_, n) => n !== i))} aria-label="Xoá ảnh">✕</button>
            </div>
          ))}
          {images.length < 5 && <label className="photo big add">{busy ? "..." : "+ Thêm ảnh"}<input type="file" accept="image/*" multiple hidden onChange={(e) => { addImages(e.target.files); e.target.value = ""; }} /></label>}
        </div>
        {errors.images && <em>{errors.images}</em>}
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-outline" onClick={() => router.push("/admin/products")}>HUỶ</button>
        <button className="btn btn-black" disabled={busy}>{editing ? "LƯU THAY ĐỔI" : "THÊM SẢN PHẨM"}</button>
      </div>
    </form>
  );
}

"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { isAdmin } from "@/lib/admin";
import { useAuth } from "@/lib/auth";
import AddressPicker, { type Address } from "@/components/AddressPicker";
import { loyaltyOf, MAX_REDEEM_RATIO } from "@/lib/loyalty";
import { readOrders, saveOrder } from "@/lib/orders";
import { readProfile } from "@/lib/profile";
import { toast } from "@/lib/toast";
import { bestSet, checkVoucher, conflictWith, discountOf, recommend, totalDiscount, vouchers, type Voucher } from "@/lib/vouchers";
import { useCart } from "@/lib/cart";
import { formatVnd, getProduct, thumb } from "@/lib/products";

const FREE_SHIP = 899000;

export default function Checkout() {
  const { selectedLines: lines, selectedSubtotal: subtotal, removePaid: clear } = useCart();
  const router = useRouter();
  const { user, ready } = useAuth();
  useEffect(() => { if (ready && !user) router.replace("/login?next=/checkout&need=1"); }, [ready, user, router]);
  const [pay, setPay] = useState("cod");
  // chọn sẵn phương thức thanh toán đã lưu trong hồ sơ
  useEffect(() => { if (user) { const m = readProfile(user.email).payment; if (m) setPay(m); } }, [user]);
  const [addr, setAddr] = useState<Address>({ province: "", district: "", ward: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [applied, setApplied] = useState<Voucher[]>([]);
  const [code, setCode] = useState("");
  const [vMsg, setVMsg] = useState("");
  const discount = totalDiscount(applied, subtotal);
  const freeShip = applied.some((v) => v.kind === "freeship");
  const baseShip = subtotal === 0 || subtotal >= FREE_SHIP ? 0 : 30000;
  const ship = freeShip ? 0 : baseShip;
  const loy = useMemo(() => (user && !isAdmin(user.email) ? loyaltyOf(readOrders(user.email)) : null), [user]);
  const [usePoints, setUsePoints] = useState(false);
  const payable = Math.max(0, subtotal - discount + ship);
  const pointsCap = loy ? Math.min(loy.balance, Math.floor(Math.max(0, subtotal - discount) * MAX_REDEEM_RATIO)) : 0;
  const pointsUsed = usePoints ? pointsCap : 0;
  const total = payable - pointsUsed;
  const earnPoints = loy ? Math.floor((total * loy.tier.rate) / 100) : 0;
  const firstOrder = useMemo(() => (user ? readOrders(user.email).length === 0 : false), [user]);
  const rec = recommend(subtotal, baseShip, firstOrder);
  const welcome = vouchers.find((x) => x.code === "WELCOME50")!;
  const freeship = vouchers.find((x) => x.code === "FREESHIP")!;
  const welcomeOn = applied.some((a) => a.code === "WELCOME50");
  const shipOn = applied.some((a) => a.code === "FREESHIP");
  const welcomeSave = discountOf(welcome, subtotal);
  const shipSave = baseShip;
  const choose = (which: "welcome" | "ship" | "none") => {
    const rest = applied.filter((a) => a.code !== "WELCOME50" && a.code !== "FREESHIP");
    setVMsg("");
    setApplied(which === "welcome" ? [...rest, welcome] : which === "ship" ? [...rest, freeship] : rest);
  };
  const pick = bestSet(rec.eligible);
  const pickSaving = rec.eligible.filter((r) => pick.some((p) => p.code === r.v.code)).reduce((n, r) => n + r.saving, 0);
  const allApplied = pick.length > 0 && pick.length === applied.length && pick.every((p) => applied.some((a) => a.code === p.code));
  const applyBest = () => { setApplied(pick); setVMsg(""); };

  function apply(c: string) {
    if (applied.some((v) => v.code === c.trim().toUpperCase())) { setVMsg("Mã này đã được áp dụng."); return; }
    const r = checkVoucher(c, subtotal, firstOrder);
    if (!r.ok) { setVMsg(r.error); return; }
    const clash = conflictWith(r.voucher, applied);
    if (clash) { setVMsg(`Mã ${r.voucher.code} không dùng chung được với ${clash.code}. Hãy bỏ ${clash.code} trước.`); return; }
    setApplied([...applied, r.voucher]); setCode(""); setVMsg("");
  }
  const toggle = (v: Voucher) => {
    setVMsg("");
    if (applied.some((a) => a.code === v.code)) { setApplied(applied.filter((a) => a.code !== v.code)); return; }
    apply(v.code);
  };

  if (!ready || !user) return <div className="container section center muted">Đang tải...</div>;

  if (lines.length === 0) {
    return <div className="container section center"><h1 className="h1">GIỎ HÀNG TRỐNG</h1><p className="muted pad">Hãy chọn sản phẩm trong giỏ hàng trước khi thanh toán.</p><Link href="/cart" className="btn btn-black">VỀ GIỎ HÀNG</Link></div>;
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const err: Record<string, string> = {};
    if (!String(f.get("name")).trim()) err.name = "Vui lòng nhập họ tên";
    if (!/^(0|\+84)\d{9}$/.test(String(f.get("phone")).replace(/\s/g, ""))) err.phone = "Số điện thoại không hợp lệ";
    if (!/^\S+@\S+\.\S+$/.test(String(f.get("email")))) err.email = "Email không hợp lệ";
    if (!addr.province) err.province = "Vui lòng chọn tỉnh/thành";
    if (!addr.district) err.district = "Vui lòng chọn quận/huyện";
    if (!addr.ward) err.ward = "Vui lòng chọn phường/xã";
    if (!String(f.get("street")).trim()) err.street = "Vui lòng nhập số nhà, tên đường";
    setErrors(err);
    if (Object.keys(err).length) return;
    const order = "KN" + Date.now().toString().slice(-8);
    const address = [String(f.get("street")).trim(), addr.ward, addr.district, addr.province].join(", ");
    saveOrder(user!.email, {
      id: order, date: new Date().toISOString(), total, shipping: ship, discount, pointsUsed, earnRate: loy?.tier.rate, earnPoints, tierName: loy?.tier.name, voucher: applied.map((v) => v.code).join(", ") || undefined, pay, status: "Đang xử lý",
      name: String(f.get("name")), phone: String(f.get("phone")), address,
      items: lines.map((l) => { const p = getProduct(l.slug)!; return { slug: l.slug, name: p.name, size: l.size, qty: l.qty, price: p.price, note: l.note }; }),
    });
    sessionStorage.setItem("kinetic-last-order", JSON.stringify({ earnPoints, tier: loy?.tier.name, rate: loy?.tier.rate, pointsUsed, items: lines.map((l) => l.slug), phone: String(f.get("phone")), order, total: total, name: f.get("name"), pay }));
    clear();
    toast(pay === "cod" ? `Đơn #${order} đã được ghi nhận, bạn thanh toán khi nhận hàng.` : `Đơn #${order} đã được thanh toán ${total.toLocaleString("vi-VN")}₫.`, { title: pay === "cod" ? "Đặt hàng thành công" : "Thanh toán thành công", duration: 6000 });
    router.push("/checkout/success");
  }

  const field = (name: string, label: string, type = "text") => (
    <label className={errors[name] ? "field bad" : "field"}>
      <span>{label}</span><input name={name} type={type} />{errors[name] && <em>{errors[name]}</em>}
    </label>
  );

  return (
    <div className="container section">
      <h1 className="h1">THANH TOÁN</h1>
      <div className="pay-banner">
        <div className="pay-banner-txt"><small className="tag">ĐƠN HÀNG CỦA BẠN</small><h2>SẮP SỞ HỮU {lines.reduce((n, l) => n + l.qty, 0)} MÓN KINETIC</h2><p>Miễn phí vận chuyển từ 899.000₫ · Đổi trả 30 ngày</p></div>
        <div className="pay-banner-imgs">
          {lines.slice(0, 5).map((l) => <div key={l.slug + l.size} className="pay-thumb"><Image src={thumb(getProduct(l.slug)!.image)} alt="" fill sizes="110px" />{l.qty > 1 && <span>×{l.qty}</span>}</div>)}
        </div>
      </div>
      <div className="co">
        <form onSubmit={submit} noValidate>
          <h3>THÔNG TIN GIAO HÀNG</h3>
          {field("name", "HỌ VÀ TÊN")}
          <div className="two">{field("phone", "SỐ ĐIỆN THOẠI", "tel")}{field("email", "EMAIL", "email")}</div>
          <AddressPicker onChange={setAddr} errors={errors} />
          {field("street", "SỐ NHÀ, TÊN ĐƯỜNG")}
          <h3>PHƯƠNG THỨC THANH TOÁN</h3>
          {[["cod", "Thanh toán khi nhận hàng (COD)"], ["vnpay", "VNPAY-QR"], ["momo", "Ví MoMo"], ["card", "Thẻ Visa / Mastercard"]].map(([v, l]) => (
            <label key={v} className="radio"><input type="radio" name="pay" checked={pay === v} onChange={() => setPay(v)} /><i />{l}</label>
          ))}
          <p className="muted small">Đây là bản demo - chưa kết nối cổng thanh toán thật, đơn hàng chỉ được xác nhận trên giao diện.</p>
          <button className="btn btn-black full" type="submit">ĐẶT HÀNG · {formatVnd(total)}</button>
        </form>
        <aside className="summary">
          <h3>ĐƠN HÀNG ({lines.length})</h3>
          {loy && (
            <div className="loy-box">
              <div className="loy-head"><b>THẺ {loy.tier.name.toUpperCase()}</b><span className="tier-dot" style={{ background: loy.tier.color }} /><small>tích {loy.tier.rate}% giá trị đơn</small></div>
              <p className="small">Đơn này tích <b>{earnPoints.toLocaleString("vi-VN")} điểm</b> (cộng khi đơn giao thành công). Điểm khả dụng: <b>{loy.balance.toLocaleString("vi-VN")}</b> điểm (1 điểm = 1₫).</p>
              <label className={pointsCap === 0 ? "chk off" : "chk"}>
                <input type="checkbox" disabled={pointsCap === 0} checked={usePoints && pointsCap > 0} onChange={(e) => setUsePoints(e.target.checked)} />
                {pointsCap > 0 ? <>Dùng <b>{pointsCap.toLocaleString("vi-VN")} điểm</b> để giảm {formatVnd(pointsCap)} <small className="muted">(tối đa {MAX_REDEEM_RATIO * 100}% giá trị đơn)</small></> : <span className="muted">Chưa có điểm để sử dụng</span>}
              </label>
            </div>
          )}
          <div className="choice">
            <b>CHỌN 1 TRONG 2 ƯU ĐÃI</b>
            <label className={`ch-card ${welcomeOn ? "on" : ""} ${!firstOrder ? "off" : ""}`}>
              <input type="radio" name="deal" disabled={!firstOrder} checked={welcomeOn} onChange={() => choose("welcome")} />
              <div><span>Giảm 50.000₫ cho đơn đầu tiên{firstOrder && welcomeSave >= shipSave && <i className="v-best">NÊN CHỌN</i>}</span><small>{firstOrder ? `Tiết kiệm ${formatVnd(welcomeSave)}` : "Chỉ áp dụng cho đơn hàng đầu tiên của tài khoản"}</small></div>
            </label>
            <label className={`ch-card ${shipOn ? "on" : ""} ${shipSave === 0 ? "off" : ""}`}>
              <input type="radio" name="deal" disabled={shipSave === 0} checked={shipOn} onChange={() => choose("ship")} />
              <div><span>Miễn phí vận chuyển{shipSave > welcomeSave && <i className="v-best">NÊN CHỌN</i>}</span><small>{shipSave === 0 ? "Đơn của bạn đã được miễn phí vận chuyển" : `Tiết kiệm ${formatVnd(shipSave)}`}</small></div>
            </label>
            {(welcomeOn || shipOn) && <button type="button" className="ch-clear" onClick={() => choose("none")}>Bỏ chọn</button>}
          </div>
          <div className="voucher">
            <b>MÃ GIẢM GIÁ / VOUCHER</b>
            <small className="muted">Có thể dùng nhiều voucher cùng lúc nếu đơn hàng đủ điều kiện.</small>
            <div className="v-row">
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Nhập mã voucher" />
              <button type="button" className="btn btn-black" onClick={() => apply(code)}>ÁP DỤNG</button>
            </div>
            {vMsg && <em className="v-err">{vMsg}</em>}
            {applied.length > 0 && <p className="v-ok">✓ Đã áp dụng {applied.length} voucher: {applied.map((v) => v.code).join(", ")} · <button type="button" onClick={() => setApplied([])}>Bỏ tất cả</button></p>}
            {rec.eligible.length > 0 && (
              <div className="v-rec">
                <div><b>★ GỢI Ý TỐT NHẤT CHO ĐƠN CỦA BẠN</b><span>Tiết kiệm tới <em>{formatVnd(pickSaving)}</em> với {pick.length} voucher</span></div>
                <button type="button" className="btn btn-black" disabled={allApplied} onClick={applyBest}>{allApplied ? "ĐÃ ÁP DỤNG" : "ÁP DỤNG TẤT CẢ"}</button>
              </div>
            )}
            <div className="v-list-head"><b>VOUCHER KHÁC</b><Link href="/offers" target="_blank" className="ul">Xem trang ưu đãi →</Link></div>
            <div className="v-list">
              {rec.eligible.filter((r) => r.v.code !== "WELCOME50" && r.v.code !== "FREESHIP").map((r, i) => {
                const clash = !applied.some((a) => a.code === r.v.code) ? conflictWith(r.v, applied) : undefined;
                return (
                <button type="button" key={r.v.code} disabled={!!clash} className={applied.some((a) => a.code === r.v.code) ? "v-card on" : clash ? "v-card locked" : "v-card"} onClick={() => toggle(r.v)}>
                  <b>{r.v.code}</b><span>{r.v.title}{i === 0 && <i className="v-best">TỐT NHẤT</i>}</span>
                  <small>{clash ? `Không dùng chung với ${clash.code}` : `${r.v.desc} · Tiết kiệm ${formatVnd(r.saving)}`}</small>
                </button>
              ); })}
              {rec.idle.filter((v) => v.code !== "FREESHIP").map((v) => (
                <div key={v.code} className="v-card locked">
                  <b>{v.code}</b><span>{v.title}</span>
                  <small>{v.kind === "freeship" ? "Đơn của bạn đã được miễn phí vận chuyển" : "Không có giá trị với đơn hàng này"}</small>
                </div>
              ))}
              {rec.locked.map(({ v, need }) => (
                <div key={v.code} className="v-card locked">
                  <b>{v.code}</b><span>{v.title}</span>
                  <small>🔒 Mua thêm {formatVnd(need)} để mở khoá</small>
                </div>
              ))}
            </div>
          </div>
          {lines.map((l) => { const p = getProduct(l.slug)!; return (
            <div className="sum-line" key={l.slug + l.size}><div className="sum-img"><Image src={thumb(p.image)} alt="" fill sizes="56px" /></div><span className="sum-name">{p.name}<small> · {l.size} × {l.qty}</small>{l.note && <em className="note"> Ghi chú: {l.note}</em>}</span><b>{formatVnd(p.price * l.qty)}</b></div>
          ); })}
          <div className="sum-line"><span>Tạm tính</span><b>{formatVnd(subtotal)}</b></div>
          {applied.map((v) => <div className="sum-line disc" key={v.code}><span>Voucher {v.code}</span><b>{v.kind === "freeship" ? "Miễn phí ship" : `−${formatVnd(discountOf(v, subtotal))}`}</b></div>)}
          {pointsUsed > 0 && <div className="sum-line disc"><span>Dùng {pointsUsed.toLocaleString("vi-VN")} điểm</span><b>−{formatVnd(pointsUsed)}</b></div>}
          <div className="sum-line"><span>Vận chuyển</span><b>{ship ? formatVnd(ship) : "Miễn phí"}</b></div>
          <div className="sum-total"><span>TỔNG</span><b>{formatVnd(total)}</b></div>
        </aside>
      </div>
    </div>
  );
}

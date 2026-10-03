"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import RequireAuth from "@/components/RequireAuth";
import { isAdmin } from "@/lib/admin";
import { useAuth } from "@/lib/auth";
import { loyaltyOf } from "@/lib/loyalty";
import { readOrders } from "@/lib/orders";
import { emptyProfile, genders, paymentMethods, readProfile, saveProfile, type Profile } from "@/lib/profile";
import { toast } from "@/lib/toast";

function ProfileView() {
  const { user, logout } = useAuth();
  const [saved, setSaved] = useState<Profile>(emptyProfile);
  const [prof, setProf] = useState<Profile>(emptyProfile);
  const [stats, setStats] = useState<{ orders: number; tier: string; color: string; rate: number } | null>(null);
  const admin = !!user && isAdmin(user.email);

  useEffect(() => {
    if (!user) return;
    const p = readProfile(user.email);
    setSaved(p); setProf(p);
    if (!isAdmin(user.email)) {
      const orders = readOrders(user.email), l = loyaltyOf(orders);
      setStats({ orders: orders.length, tier: l.tier.name, color: l.tier.color, rate: l.tier.rate });
    }
  }, [user]);
  if (!user) return null;

  const dirty = JSON.stringify(prof) !== JSON.stringify(saved);
  const checks = [saved.phone, saved.birth, saved.address, saved.gender, saved.height, saved.weight, saved.payment];
  const pct = Math.round(((2 + checks.filter(Boolean).length) / (2 + checks.length)) * 100);
  const upd = (patch: Partial<Profile>) => setProf((p) => ({ ...p, ...patch }));
  const num = (v: string, max: number) => v.replace(/[^\d]/g, "").slice(0, max);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = { ...prof, phone: prof.phone.trim(), address: prof.address.trim() };
    if (saveProfile(user.email, next)) { setSaved(next); setProf(next); toast("Thông tin cá nhân của bạn đã được cập nhật.", { title: "Đã lưu thay đổi" }); }
    else toast("Không lưu được, bộ nhớ trình duyệt đã đầy.", { type: "error" });
  };

  return (
    <div className="pf3">
      <div className="container pf3-wrap">
        <aside className="pf3-side">
          <div className="pf3-who">
            <span className="pf3-ava">{user.name.trim().charAt(0).toUpperCase()}</span>
            <div><b>{user.name}</b><small>{admin ? "Quản trị viên" : stats ? `Hạng ${stats.tier}` : "Thành viên"}</small></div>
          </div>
          <nav className="pf3-menu">
            <Link href="/account/profile" className="on">Hồ sơ của tôi</Link>
            {!admin && <Link href="/orders">Đơn hàng của tôi</Link>}
            {!admin && <Link href="/account">Thẻ & điểm hội viên</Link>}
            {admin && <Link href="/admin">Trang quản trị</Link>}
            <button onClick={logout}>Đăng xuất</button>
          </nav>
        </aside>

        <main className="pf3-main">
          <header className="pf3-head">
            <h1>Hồ sơ của tôi</h1>
            <p>Quản lý thông tin để việc đặt hàng và giao hàng nhanh hơn.</p>
          </header>

          <div className="pf3-body">
            <form className="pf3-form" onSubmit={submit}>
              <h2>Thông tin cơ bản</h2>
              <label><span>Email đăng nhập</span><div className="pf3-ro">{user.email}</div></label>
              <label><span>Họ và tên</span><div className="pf3-ro">{user.name}</div></label>
              <label><span>Số điện thoại</span><input inputMode="tel" maxLength={15} value={prof.phone} onChange={(e) => upd({ phone: e.target.value.replace(/[^\d+ ]/g, "") })} placeholder="0901 234 567" /></label>
              <label><span>Ngày sinh</span><input type="date" value={prof.birth} max={new Date().toISOString().slice(0, 10)} onChange={(e) => upd({ birth: e.target.value })} /></label>
              <label><span>Giới tính</span>
                <div className="pf3-seg">{genders.map((g) => <button type="button" key={g} className={prof.gender === g ? "on" : ""} onClick={() => upd({ gender: prof.gender === g ? "" : g })}>{g}</button>)}</div>
              </label>

              <h2>Địa chỉ giao hàng</h2>
              <label className="top"><span>Địa chỉ</span><textarea rows={3} maxLength={200} value={prof.address} onChange={(e) => upd({ address: e.target.value })} placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành" /></label>

              <h2>Số đo cơ thể</h2>
              <label><span>Chiều cao</span><div className="pf3-unit"><input inputMode="numeric" value={prof.height} onChange={(e) => upd({ height: num(e.target.value, 3) })} placeholder="170" /><em>cm</em></div></label>
              <label><span>Cân nặng</span><div className="pf3-unit"><input inputMode="numeric" value={prof.weight} onChange={(e) => upd({ weight: num(e.target.value, 3) })} placeholder="62" /><em>kg</em></div></label>

              <h2>Phương thức thanh toán</h2>
              <p className="pf3-note">Chọn cách bạn thường dùng, trang thanh toán sẽ tự chọn sẵn giúp bạn.</p>
              <div className="pf3-pay" role="radiogroup" aria-label="Phương thức thanh toán">
                {paymentMethods.map((m) => (
                  <button type="button" role="radio" aria-checked={prof.payment === m.key} key={m.key} className={prof.payment === m.key ? "on" : ""} onClick={() => upd({ payment: prof.payment === m.key ? "" : m.key })}>
                    <i aria-hidden="true" /><span><b>{m.label}</b><small>{m.note}</small></span>
                  </button>
                ))}
              </div>

              <h2>Nhận thông báo</h2>
              <label className="pf3-check"><input type="checkbox" checked={prof.notifyOrder} onChange={(e) => upd({ notifyOrder: e.target.checked })} /><span><b>Tình trạng đơn hàng</b><small>Xác nhận đặt hàng, giao hàng, đã giao</small></span></label>
              <label className="pf3-check"><input type="checkbox" checked={prof.notifyPromo} onChange={(e) => upd({ notifyPromo: e.target.checked })} /><span><b>Khuyến mãi & hàng mới</b><small>Voucher, flash sale, bộ sưu tập mới</small></span></label>

              <div className="pf3-act">
                <button type="submit" className="pf3-save" disabled={!dirty}>Lưu thay đổi</button>
                {dirty && <button type="button" className="pf3-reset" onClick={() => setProf(saved)}>Hoàn tác</button>}
                {!dirty && <small>Mọi thay đổi đã được lưu</small>}
              </div>
            </form>

            <aside className="pf3-badge">
              <span className="pf3-big">{user.name.trim().charAt(0).toUpperCase()}</span>
              <b>{user.name}</b>
              <div className="pf3-meter"><i style={{ width: `${pct}%` }} /></div>
              <small>Hồ sơ hoàn thiện {pct}%</small>
              {saved.payment && <div className="pf3-sizes"><span>{paymentMethods.find((m) => m.key === saved.payment)?.label.replace(/ \(COD\)/, "")}</span></div>}
              {!admin && stats && <div className="pf3-nums"><div><b>{stats.orders}</b><span>Đơn hàng</span></div><div><b>{stats.rate}%</b><span>Tích điểm</span></div></div>}
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function ProfilePage() { return <RequireAuth><ProfileView /></RequireAuth>; }

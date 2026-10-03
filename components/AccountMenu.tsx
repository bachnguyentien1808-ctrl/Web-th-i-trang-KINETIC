"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { isAdmin } from "@/lib/admin";
import { useAuth } from "@/lib/auth";
import { loyaltyOf } from "@/lib/loyalty";
import { readOrders } from "@/lib/orders";

/** Biểu tượng hình người ở đầu trang: bấm vào để xem thông tin tài khoản, điểm, hạng thẻ và đăng xuất. */
export default function AccountMenu() {
  const { user, logout, ready } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const [info, setInfo] = useState<{ tier: string; rate: number; color: string; points: number } | null>(null);
  const admin = isAdmin(user?.email);

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!user || admin) { setInfo(null); return; }
    const l = loyaltyOf(readOrders(user.email));
    setInfo({ tier: l.tier.name, rate: l.tier.rate, color: l.tier.color, points: l.balance });
  }, [user, admin, pathname, open]);
  useEffect(() => {
    const out = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", out); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", out); document.removeEventListener("keydown", esc); };
  }, []);

  return (
    <div className="acct" ref={box}>
      <button className={open ? "icon-btn on" : "icon-btn"} aria-label="Tài khoản" aria-expanded={open} onClick={() => setOpen(!open)}>
        <svg width="20" height="20" viewBox="0 0 512 512" fill="currentColor" aria-hidden="true"><path d="m256 292.1c33 0 63.5-9.3 87.9-25.1 18.9-12.1 43.5-10.1 60.1 5 46.1 41.8 72.3 101.1 72.2 163.4v26.7c0 27.6-22.4 49.9-50 49.9h-340.4c-27.6 0-50-22.3-50-49.9v-26.7c-.2-62.2 26-121.6 72.1-163.3 16.6-15.1 41.3-17.1 60.1-5 24.5 15.7 54.9 25 88 25z" /><circle cx="256" cy="123.8" r="123.8" /></svg>
        {user && <i className="acct-dot" />}
      </button>

      {open && ready && (
        <div className="acct-pop" role="menu">
          {user ? (
            <>
              <Link href="/account/profile" className="acct-head acct-head-btn" title="Trang thông tin cá nhân">
                <span className="avatar">{user.name.trim().charAt(0).toUpperCase()}</span>
                <div><b>{user.name}</b><small>{user.email}</small></div>
                <i className="acct-chev">›</i>
              </Link>
              {info && (
                <div className="acct-card" style={{ ["--tier" as string]: info.color }}>
                  <span><i className="tier-dot" style={{ background: info.color }} /> Thẻ <b>{info.tier}</b> · tích {info.rate}%</span>
                  <Link href="/account/points" className="acct-pts">⭐ {info.points.toLocaleString("vi-VN")} điểm</Link>
                </div>
              )}
              <nav className="acct-links">
                {admin && <Link href="/admin" className="acct-admin">🛠 Vào trang quản trị</Link>}
                {!admin && <Link href="/account">👤 Thông tin tài khoản</Link>}
                {!admin && <Link href="/orders">📦 Theo dõi đơn hàng</Link>}
                {!admin && <Link href="/account/points">⭐ Điểm của tôi</Link>}
                <Link href="/offers">🎟 Ưu đãi &amp; voucher</Link>
                <Link href="/stores">📍 Tìm cửa hàng</Link>
                <Link href="/help">❓ Trợ giúp</Link>
              </nav>
              <button className="acct-out" onClick={() => { setOpen(false); logout(); router.push("/"); }}>↪ Đăng xuất</button>
            </>
          ) : (
            <div className="acct-guest">
              <b>Chào mừng đến Kinetic</b>
              <p>Đăng nhập để thêm vào giỏ hàng, tích điểm và theo dõi đơn hàng.</p>
              <Link href="/login" className="btn btn-black">ĐĂNG NHẬP</Link>
              <Link href="/register" className="btn btn-outline">ĐĂNG KÝ</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

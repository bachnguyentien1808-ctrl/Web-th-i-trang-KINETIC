"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import AccountMenu from "./AccountMenu";
import MegaMenu, { menuItems, type MenuKey } from "./MegaMenu";
import SearchBox from "./SearchBox";
import TopBar from "./TopBar";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";

export default function Header() {
  const { count } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  const [active, setActive] = useState<MenuKey | null>(null);

  const openCart = () => {
    if (!user) { router.push(`/login?next=${encodeURIComponent(pathname)}&need=1`); return; }
    router.push("/cart");
  };

  if (pathname.startsWith("/admin")) return null;

  return (
    <header className="header" onMouseLeave={() => setActive(null)}>
      <div className="topbar">MIỄN PHÍ VẬN CHUYỂN TOÀN QUỐC CHO ĐƠN HÀNG TỪ 899.000₫</div>
      <TopBar />
      <div className="container nav">
        <button className="menu-btn" aria-label="Menu" onClick={() => setMenu(!menu)}>☰</button>
        <Link href="/" className="logo"><span className="stripes"><i /><i /><i /></span>KINETIC</Link>
        <nav className={menu ? "links open" : "links"} onClick={() => { setMenu(false); setActive(null); }}>
          {menuItems.map((m) => (
            <Link key={m.key} href={m.href} className={`${m.className ?? ""} ${active === m.key ? "hot" : ""}`}
              onMouseEnter={() => setActive(m.key)} onFocus={() => setActive(m.key)}>{m.label}</Link>
          ))}
        </nav>
        <SearchBox />
        <AccountMenu />
        <button className="cart-btn" onClick={openCart} aria-label="Giỏ hàng" data-tip="Giỏ hàng">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="m1 1c-.55228475 0-1 .44771525-1 1s.44771525 1 1 1h1.7792969a.69367162.69367162 35.784145 0 1 .65808707.47435058l3.2969911 9.8928369c.14641172.43923517.16502704.91215746.05273437 1.3613281l-.27148437 1.0878906c-.39834445 1.5933778.84195876 3.1835938 2.484375 3.1835938h12c.55228475 0 1-.44771525 1-1s-.44771525-1-1-1h-12c-.38938619 0-.6393619-.31950554-.54492188-.69726562l.20473297-.81770594a.64062109.64062109 142.02823 0 1 .6214389-.48502844h10.71875c.43057012.00022511.81295428-.27515444.94921875-.68359375l2.6660156-8c.21596464-.64778704-.26638007-1.3167178-.94921876-1.3164062h-16.111328a.69371294.69371294 35.782526 0 1 -.65811388-.47434165l-.94735487-2.8420646c-.13626447-.40843931-.51864863-.68381886-.94921875-.68359375zm7 19c-1.1045695 0-2 .8954305-2 2s.8954305 2 2 2 2-.8954305 2-2-.8954305-2-2-2zm12 0c-1.1045695 0-2 .8954305-2 2s.8954305 2 2 2 2-.8954305 2-2-.8954305-2-2-2z" />
          </svg>
          {(user ? count : 0) > 0 && <span className="cart-count">{count}</span>}
        </button>
      </div>
      {active && <MegaMenu active={active} onClose={() => setActive(null)} />}
    </header>
  );
}

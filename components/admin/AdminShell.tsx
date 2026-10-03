"use client";
import Link from "next/link";
import { notFound, usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { isAdmin } from "@/lib/admin";
import { useAuth } from "@/lib/auth";

const nav = [
  { href: "/admin", label: "Tổng quan" },
  { href: "/admin/orders", label: "Đơn hàng" },
  { href: "/admin/revenue", label: "Doanh thu" },
  { href: "/admin/customers", label: "Khách hàng" },
  { href: "/admin/products", label: "Sản phẩm" },
  { href: "/admin/vouchers", label: "Voucher" },
  { href: "/admin/reviews", label: "Đánh giá" },
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}&need=page`);
  }, [ready, user, router, pathname]);

  if (!ready || !user) return <div className="container section center muted">Đang tải...</div>;
  // Khách hàng (không phải admin) không được biết trang quản trị tồn tại → trả về 404
  if (!isAdmin(user.email)) notFound();

  return (
    <div className="admin">
      <aside className="admin-side">
        <Link href="/" className="logo" title="Về trang cửa hàng"><span className="stripes"><i /><i /><i /></span>KINETIC</Link>
        <small>QUẢN TRỊ</small>
        <Link href="/" className="admin-store">🏬 Về trang cửa hàng</Link>
        <nav>
          {nav.map((n) => {
            const on = n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href);
            return <Link key={n.href} href={n.href} className={on ? "on" : ""}>{n.label}</Link>;
          })}
        </nav>
        <Link href="/" className="admin-back">← Về cửa hàng</Link>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}

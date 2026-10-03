"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { isAdmin } from "@/lib/admin";
import { useAuth } from "@/lib/auth";
import { cancelInfo, readOrders, stageOf, stages } from "@/lib/orders";

type Note = { id: string; text: string; sub: string };

/** Hàng tiện ích trên cùng: Thông báo · Hỗ trợ · Ngôn ngữ · Tài khoản. */
export default function TopBar() {
  const { user, ready } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState<"" | "note" | "lang">("");
  const [notes, setNotes] = useState<Note[]>([]);
  const box = useRef<HTMLDivElement>(null);
  const admin = isAdmin(user?.email);

  useEffect(() => { setOpen(""); }, [pathname]);
  useEffect(() => {
    if (!user || admin) { setNotes([]); return; }
    const list: Note[] = [];
    for (const o of readOrders(user.email).slice(0, 8)) {
      const c = cancelInfo(o);
      const st = stages.find((s) => s.key === stageOf(o))?.label ?? "";
      const text = c ? (c.phase === "pending" ? "Yêu cầu huỷ đang chờ shop xác nhận" : c.phase === "refunded" ? "Đơn đã huỷ và hoàn tiền" : "Shop đã xác nhận huỷ đơn") : `Đơn hàng ${st.toLowerCase()}`;
      list.push({ id: o.id, text, sub: `#${o.id} · ${o.date}` });
    }
    setNotes(list);
  }, [user, admin, pathname, open]);
  useEffect(() => {
    const out = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(""); };
    document.addEventListener("mousedown", out);
    return () => document.removeEventListener("mousedown", out);
  }, []);

  return (
    <div className="container utility" ref={box}>
      <Link href="/stores">Tìm cửa hàng</Link>
      <Link href="/orders">Theo dõi đơn hàng</Link>
      <span className="spacer" />

      <div className="ut-wrap">
        <button className="ut-btn" onClick={() => setOpen(open === "note" ? "" : "note")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" /><path d="M10 21h4" /></svg>
          Thông Báo{notes.length > 0 && <i className="ut-badge">{notes.length}</i>}
        </button>
        {open === "note" && (
          <div className="ut-pop ut-notes">
            <b>Thông báo mới nhận</b>
            {!ready || !user ? <p className="muted small">Đăng nhập để xem thông báo đơn hàng.</p>
              : notes.length === 0 ? <p className="muted small">Chưa có thông báo nào.</p>
              : notes.map((n) => <Link key={n.id} href="/orders" className="ut-note"><span>{n.text}</span><small>{n.sub}</small></Link>)}
            <Link href="/orders" className="ut-more">Xem tất cả đơn hàng</Link>
          </div>
        )}
      </div>

      <Link href="/help" className="ut-btn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01" /></svg>
        Hỗ Trợ
      </Link>

      <div className="ut-wrap">
        <button className="ut-btn" onClick={() => setOpen(open === "lang" ? "" : "lang")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></svg>
          Tiếng Việt <small>▾</small>
        </button>
        {open === "lang" && (
          <div className="ut-pop ut-lang">
            <button className="on" onClick={() => setOpen("")}>Tiếng Việt ✓</button>
            <button disabled>English <small>(sắp có)</small></button>
          </div>
        )}
      </div>

      {ready && !user && (
        <>
          <Link href="/register" className="reg">Đăng ký</Link>
          <Link href="/login">Đăng nhập</Link>
        </>
      )}
    </div>
  );
}

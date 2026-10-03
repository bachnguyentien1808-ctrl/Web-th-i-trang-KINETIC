"use client";
import { useEffect, useState } from "react";

// Thông báo nổi (toast) dùng chung toàn web: gọi toast("nội dung", { type }) ở bất cứ đâu trong code phía trình duyệt.
export type ToastType = "success" | "error" | "info";
interface ToastOpts { type?: ToastType; title?: string; id?: string; duration?: number }
interface Item { key: number; id?: string; type: ToastType; title?: string; message: string; duration: number }

const EVT = "kinetic-toast";
const defaultTitle: Record<ToastType, string> = { success: "Thành công", error: "Có lỗi xảy ra", info: "Thông báo" };

export function toast(message: string, opts: ToastOpts = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVT, { detail: { message, ...opts } }));
}

let counter = 0;
export function ToastHost() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent<{ message: string } & ToastOpts>).detail;
      const type = d.type ?? "success";
      const item: Item = { key: ++counter, id: d.id, type, title: d.title ?? defaultTitle[type], message: d.message, duration: d.duration ?? (type === "error" ? 6000 : 3800) };
      // cùng `id` → thay thông báo cũ thay vì xếp chồng
      setItems((cur) => [...cur.filter((x) => !d.id || x.id !== d.id), item].slice(-4));
    };
    window.addEventListener(EVT, on);
    return () => window.removeEventListener(EVT, on);
  }, []);

  const close = (key: number) => setItems((cur) => cur.filter((x) => x.key !== key));

  return (
    <div className="toasts" aria-live="polite" aria-atomic="false">
      {items.map((t) => <ToastCard key={t.key} item={t} onClose={() => close(t.key)} />)}
    </div>
  );
}

const icons: Record<ToastType, string> = { success: "✓", error: "!", info: "i" };

function ToastCard({ item, onClose }: { item: Item; onClose: () => void }) {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const t = setTimeout(onClose, item.duration);
    return () => clearTimeout(t);
  }, [paused, item.duration, onClose]);
  return (
    <div className={`toast t-${item.type}`} role={item.type === "error" ? "alert" : "status"} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <span className="toast-ic" aria-hidden="true">{icons[item.type]}</span>
      <div className="toast-tx"><b>{item.title}</b><span>{item.message}</span></div>
      <button className="toast-x" onClick={onClose} aria-label="Đóng thông báo">✕</button>
      {!paused && <i className="toast-bar" style={{ animationDuration: `${item.duration}ms` }} />}
    </div>
  );
}

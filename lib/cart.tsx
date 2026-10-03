"use client";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getProduct } from "./products";
import { useAuth } from "./auth";
import { toast } from "./toast";

export interface CartLine { slug: string; size: string; qty: number; note?: string }

interface CartCtx {
  lines: CartLine[];
  count: number;
  subtotal: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (slug: string, size: string, qty?: number, note?: string) => void;
  setNote: (slug: string, size: string, note: string) => void;
  setQty: (slug: string, size: string, qty: number) => void;
  remove: (slug: string, size: string) => void;
  changeColor: (slug: string, size: string, newSlug: string) => void;
  clear: () => void;
  // chọn sản phẩm để thanh toán (mặc định chọn hết)
  selectedLines: CartLine[];
  selectedCount: number;
  selectedSubtotal: number;
  isSelected: (slug: string, size: string) => boolean;
  toggle: (slug: string, size: string) => void;
  toggleAll: (on: boolean) => void;
  removePaid: () => void;
}
const lk = (slug: string, size: string) => `${slug}|${size}`;

const Ctx = createContext<CartCtx | null>(null);
const KEY = "kinetic-cart-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);
  const [off, setOff] = useState<string[]>([]); // các dòng đang bỏ chọn
  const [ready, setReady] = useState(false);
  const { user, ready: authReady } = useAuth();
  const key = user ? `${KEY}:${user.email}` : null;

  useEffect(() => {
    if (!authReady) return;
    setReady(false);
    if (!key) { setLines([]); setOpen(false); return; }
    try { setLines(JSON.parse(localStorage.getItem(key) || "[]")); } catch { setLines([]); }
    setReady(true);
  }, [key, authReady]);
  useEffect(() => {
    if (ready && key) try { localStorage.setItem(key, JSON.stringify(lines)); } catch {}
  }, [lines, ready, key]);

  const value = useMemo<CartCtx>(() => {
    const valid = lines.filter((l) => getProduct(l.slug));
    const sel = valid.filter((l) => !off.includes(lk(l.slug, l.size)));
    return {
      selectedLines: sel,
      selectedCount: sel.reduce((n, l) => n + l.qty, 0),
      selectedSubtotal: sel.reduce((n, l) => n + getProduct(l.slug)!.price * l.qty, 0),
      isSelected: (slug, size) => !off.includes(lk(slug, size)),
      toggle: (slug, size) => setOff((cur) => (cur.includes(lk(slug, size)) ? cur.filter((k) => k !== lk(slug, size)) : [...cur, lk(slug, size)])),
      toggleAll: (on) => setOff(on ? [] : valid.map((l) => lk(l.slug, l.size))),
      removePaid: () => { setLines((cur) => cur.filter((l) => off.includes(lk(l.slug, l.size)))); },
      lines: valid,
      count: valid.reduce((n, l) => n + l.qty, 0),
      subtotal: valid.reduce((n, l) => n + getProduct(l.slug)!.price * l.qty, 0),
      open, setOpen,
      add: (slug, size, qty = 1, note = "") => {
        setLines((cur) => {
          const hit = cur.find((l) => l.slug === slug && l.size === size);
          return hit ? cur.map((l) => (l === hit ? { ...l, qty: l.qty + qty, note: note || l.note } : l)) : [...cur, { slug, size, qty, note }];
        });
        setOpen(true);
        const p = getProduct(slug);
        toast(`${p?.name ?? "Sản phẩm"}${size && size !== "FREE SIZE" ? ` · Size ${size}` : ""} × ${qty}`, { title: "Đã thêm vào giỏ hàng", id: "cart" });
      },
      setNote: (slug, size, note) => setLines((cur) => cur.map((l) => (l.slug === slug && l.size === size ? { ...l, note } : l))),
      setQty: (slug, size, qty) =>
        setLines((cur) => cur.flatMap((l) => (l.slug === slug && l.size === size ? (qty > 0 ? [{ ...l, qty }] : []) : [l]))),
      remove: (slug, size) => { setLines((cur) => cur.filter((l) => !(l.slug === slug && l.size === size))); toast(getProduct(slug)?.name ?? "Sản phẩm", { type: "info", title: "Đã xoá khỏi giỏ hàng", id: "cart" }); },
      changeColor: (slug, size, newSlug) =>
        setLines((cur) => {
          const line = cur.find((l) => l.slug === slug && l.size === size);
          if (!line || slug === newSlug) return cur;
          const rest = cur.filter((l) => l !== line);
          const hit = rest.find((l) => l.slug === newSlug && l.size === size);
          return hit ? rest.map((l) => (l === hit ? { ...l, qty: l.qty + line.qty, note: l.note || line.note } : l)) : cur.map((l) => (l === line ? { ...l, slug: newSlug } : l));
        }),
      clear: () => setLines([]),
    };
  }, [lines, open, off]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useCart = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
};

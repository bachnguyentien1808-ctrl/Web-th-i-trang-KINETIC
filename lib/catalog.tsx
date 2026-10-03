"use client";
import { createContext, Fragment, useContext, useEffect, useState, type ReactNode } from "react";
import { baseProducts, products, type Product } from "./products";
import { baseVouchers, vouchers, type Voucher } from "./vouchers";

// Sản phẩm / voucher do admin thêm được lưu trong trình duyệt (localStorage) và gộp vào danh sách chung.
// Khi có backend thật, chỉ cần thay các hàm đọc/ghi ở file này.
const KEY_P = "kinetic-catalog-products-v1";
const KEY_V = "kinetic-catalog-vouchers-v1";
const KEY_D = "kinetic-catalog-deleted-v1"; // slug/mã của mục mặc định đã bị admin xoá
const EVT = "kinetic-catalog-changed";

const read = <T,>(key: string): T[] => { try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; } };

export const customProducts = () => read<Product>(KEY_P);
export const customVouchers = () => read<Voucher>(KEY_V);
const readDeleted = (): { p: string[]; v: string[] } => { try { const d = JSON.parse(localStorage.getItem(KEY_D) || "{}"); return { p: d.p ?? [], v: d.v ?? [] }; } catch { return { p: [], v: [] }; } };

function write(key: string, list: unknown[], obj?: unknown) {
  try { localStorage.setItem(key, JSON.stringify(obj ?? list)); } catch { return false; }
  window.dispatchEvent(new Event(EVT));
  return true;
}

/** Trả về false nếu bộ nhớ trình duyệt đã đầy (thường do ảnh quá nặng). */
export const saveProduct = (p: Product) => {
  const list = customProducts();
  return write(KEY_P, list.some((x) => x.slug === p.slug) ? list.map((x) => (x.slug === p.slug ? p : x)) : [...list, p]);
};
export const deleteProduct = (slug: string) => {
  if (baseProducts.some((x) => x.slug === slug)) { const d = readDeleted(); if (!d.p.includes(slug)) write(KEY_D, [], { ...d, p: [...d.p, slug] }); }
  return write(KEY_P, customProducts().filter((x) => x.slug !== slug));
};
export const saveVoucher = (v: Voucher) => {
  const list = customVouchers();
  return write(KEY_V, list.some((x) => x.code === v.code) ? list.map((x) => (x.code === v.code ? v : x)) : [...list, v]);
};
export const deleteVoucher = (code: string) => {
  if (baseVouchers.some((x) => x.code === code)) { const d = readDeleted(); if (!d.v.includes(code)) write(KEY_D, [], { ...d, v: [...d.v, code] }); }
  return write(KEY_V, customVouchers().filter((x) => x.code !== code));
};

export const isCustomProduct = (slug: string) => !baseProducts.some((p) => p.slug === slug);
export const isCustomVoucher = (code: string) => !baseVouchers.some((v) => v.code === code);

function apply() {
  const cp = customProducts(), cv = customVouchers(), d = readDeleted();
  // mục tuỳ chỉnh cùng slug/mã với mục mặc định sẽ thay thế (sửa); mục mặc định bị xoá thì ẩn
  const baseP = baseProducts.filter((b) => !d.p.includes(b.slug)).map((b) => cp.find((c) => c.slug === b.slug) ?? b);
  const baseV = baseVouchers.filter((b) => !d.v.includes(b.code)).map((b) => cv.find((c) => c.code === b.code) ?? b);
  products.splice(0, products.length, ...baseP, ...cp.filter((c) => !baseProducts.some((b) => b.slug === c.slug)));
  vouchers.splice(0, vouchers.length, ...baseV, ...cv.filter((c) => !baseVouchers.some((b) => b.code === c.code)));
  return JSON.stringify([cp, cv, d]);
}

const Ctx = createContext({ ready: false });
export const useCatalogReady = () => useContext(Ctx).ready;

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState({ ready: false, version: 0, sig: "[[],[],{\"p\":[],\"v\":[]}]" });

  useEffect(() => {
    const sync = () => setState((s) => { const sig = apply(); return { ready: true, version: sig === s.sig ? s.version : s.version + 1, sig }; });
    sync();
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(EVT, sync); window.removeEventListener("storage", sync); };
  }, []);

  // đổi key khi danh sách thay đổi để mọi component đọc lại dữ liệu mới
  return <Ctx.Provider value={{ ready: state.ready }}><Fragment key={state.version}>{children}</Fragment></Ctx.Provider>;
}

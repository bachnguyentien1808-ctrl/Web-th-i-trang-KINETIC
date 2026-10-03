"use client";
import { toast } from "./toast";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface User { name: string; email: string }
interface Stored extends User { hash: string }
type Result = { ok: true } | { ok: false; error: string };

interface AuthCtx {
  user: User | null;
  ready: boolean;
  register: (name: string, email: string, password: string) => Promise<Result>;
  login: (email: string, password: string) => Promise<Result>;
  logout: () => void;
  hasAccount: (email: string) => boolean;
  resetPassword: (email: string, newPassword: string) => Promise<Result>;
}

const Ctx = createContext<AuthCtx | null>(null);
const USERS = "kinetic-users-v1";
const SESSION = "kinetic-session-v1";

async function hash(s: string) {
  if (!globalThis.crypto?.subtle) return s;
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
const readUsers = (): Stored[] => { try { return JSON.parse(localStorage.getItem(USERS) || "[]"); } catch { return []; } };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try { setUser(JSON.parse(localStorage.getItem(SESSION) || "null")); } catch {}
    setReady(true);
  }, []);

  const start = (u: Stored) => {
    const s = { name: u.name, email: u.email };
    localStorage.setItem(SESSION, JSON.stringify(s));
    setUser(s);
  };

  const value: AuthCtx = {
    user, ready,
    register: async (name, email, password) => {
      email = email.trim().toLowerCase();
      const users = readUsers();
      if (users.some((u) => u.email === email)) return { ok: false, error: "Email này đã được đăng ký. Hãy đăng nhập." };
      const u = { name: name.trim(), email, hash: await hash(password) };
      localStorage.setItem(USERS, JSON.stringify([...users, u]));
      start(u);
      toast(`Chào mừng ${u.name} đến với KINETIC.`, { title: "Đăng ký thành công" });
      return { ok: true };
    },
    login: async (email, password) => {
      email = email.trim().toLowerCase();
      const u = readUsers().find((x) => x.email === email);
      if (!u) return { ok: false, error: "Chưa có tài khoản với email này. Vui lòng đăng ký." };
      if (u.hash !== (await hash(password))) return { ok: false, error: "Mật khẩu không đúng." };
      start(u);
      toast(`Xin chào, ${u.name}!`, { title: "Đăng nhập thành công" });
      return { ok: true };
    },
    logout: () => { localStorage.removeItem(SESSION); setUser(null); toast("Hẹn gặp lại bạn.", { type: "info", title: "Đã đăng xuất" }); },
    hasAccount: (email) => readUsers().some((u) => u.email === email.trim().toLowerCase()),
    resetPassword: async (email, newPassword) => {
      email = email.trim().toLowerCase();
      const users = readUsers();
      if (!users.some((u) => u.email === email)) return { ok: false, error: "Không tìm thấy tài khoản với email này." };
      const h = await hash(newPassword);
      localStorage.setItem(USERS, JSON.stringify(users.map((u) => (u.email === email ? { ...u, hash: h } : u))));
      toast("Bạn có thể đăng nhập bằng mật khẩu mới.", { title: "Đổi mật khẩu thành công" });
      return { ok: true };
    },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
};

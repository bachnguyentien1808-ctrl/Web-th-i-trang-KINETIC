"use client";
import Link from "next/link";
import { useState } from "react";
import AuthShell from "@/components/AuthShell";
import { useAuth } from "@/lib/auth";

// Đặt lại mật khẩu: nhập email → nhập mã xác nhận 6 số → đặt mật khẩu mới.
// Chưa có dịch vụ gửi email nên mã được hiển thị ngay trên trang (chế độ demo, chỉ dùng trên máy này).
const KEY = "kinetic-reset-v1";
const TTL = 10 * 60 * 1000;
const MAX_TRIES = 5;

type Pending = { email: string; code: string; exp: number; tries: number };
const read = (): Pending | null => { try { return JSON.parse(sessionStorage.getItem(KEY) || "null"); } catch { return null; } };
const write = (p: Pending | null) => { try { p ? sessionStorage.setItem(KEY, JSON.stringify(p)) : sessionStorage.removeItem(KEY); } catch {} };
const newCode = () => String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, "0");

export default function ForgotForm() {
  const { hasAccount, resetPassword } = useAuth();
  const [step, setStep] = useState<"email" | "code" | "password" | "done">("email");
  const [email, setEmail] = useState("");
  const [shown, setShown] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    const em = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(em)) return setError("Email không hợp lệ");
    if (!hasAccount(em)) return setError("Chưa có tài khoản với email này. Vui lòng đăng ký.");
    const code = newCode();
    write({ email: em, code, exp: Date.now() + TTL, tries: 0 });
    setEmail(em); setShown(code); setError(""); setStep("code");
  }

  function verify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const entered = String(new FormData(e.currentTarget).get("code") ?? "").trim();
    const p = read();
    if (!p || p.email !== email) return setError("Phiên đã hết hạn. Vui lòng gửi lại mã.");
    if (Date.now() > p.exp) { write(null); return setError("Mã đã hết hạn. Vui lòng gửi lại mã."); }
    if (p.tries >= MAX_TRIES) { write(null); return setError("Nhập sai quá nhiều lần. Vui lòng gửi lại mã."); }
    if (entered !== p.code) { write({ ...p, tries: p.tries + 1 }); return setError(`Mã không đúng. Còn ${MAX_TRIES - p.tries - 1} lần thử.`); }
    setError(""); setStep("password");
  }

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget), pw = String(f.get("password")), confirm = String(f.get("confirm"));
    const p = read();
    if (!p || p.email !== email || Date.now() > p.exp) { write(null); setStep("email"); return setError("Phiên đã hết hạn. Vui lòng làm lại từ đầu."); }
    if (pw.length < 6) return setError("Mật khẩu tối thiểu 6 ký tự");
    if (pw !== confirm) return setError("Mật khẩu nhập lại không khớp");
    setBusy(true);
    const r = await resetPassword(email, pw);
    setBusy(false);
    if (!r.ok) return setError(r.error);
    write(null); setError(""); setStep("done");
  }

  return (
    <AuthShell eyebrow={step === "done" ? "HOÀN TẤT" : `BƯỚC ${step === "email" ? 1 : step === "code" ? 2 : 3} / 3`} title="QUÊN MẬT KHẨU">

      {step === "email" && (
        <form onSubmit={sendCode} noValidate>
          <p className="auth-sub">Nhập email đã đăng ký, chúng tôi sẽ cấp mã xác nhận để bạn đặt lại mật khẩu.</p>
          <label className={error ? "field bad" : "field"}>
            <span>EMAIL</span><input name="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
            {error && <em>{error}</em>}
          </label>
          <button className="btn btn-black full">GỬI MÃ XÁC NHẬN</button>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={verify} noValidate>
          <p className="notice">Mã xác nhận gồm 6 số dành cho <b>{email}</b>, có hiệu lực 10 phút.<br />
            <small>Hệ thống chưa kết nối dịch vụ gửi email nên mã được hiển thị tại đây: <b className="reset-code">{shown}</b></small></p>
          <label className={error ? "field bad" : "field"}>
            <span>MÃ XÁC NHẬN</span><input name="code" inputMode="numeric" maxLength={6} autoComplete="one-time-code" autoFocus />
            {error && <em>{error}</em>}
          </label>
          <button className="btn btn-black full">XÁC NHẬN</button>
          <p className="forgot"><button type="button" className="linkish" onClick={() => sendCode()}>Gửi lại mã</button></p>
        </form>
      )}

      {step === "password" && (
        <form onSubmit={save} noValidate>
          <p className="auth-sub">Đặt mật khẩu mới cho <b>{email}</b>.</p>
          <label className="field"><span>MẬT KHẨU MỚI</span><input name="password" type="password" autoComplete="new-password" autoFocus /></label>
          <label className="field"><span>NHẬP LẠI MẬT KHẨU MỚI</span><input name="confirm" type="password" autoComplete="new-password" /></label>
          {error && <p className="form-err">{error}</p>}
          <button className="btn btn-black full" disabled={busy}>ĐỔI MẬT KHẨU</button>
        </form>
      )}

      {step === "done" && (
        <div>
          <p className="notice">Đã đổi mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.</p>
          <Link href="/login" className="btn btn-black full">ĐĂNG NHẬP</Link>
        </div>
      )}

      {step !== "done" && <p className="switch"><Link href="/login">← Quay lại đăng nhập</Link></p>}
    </AuthShell>
  );
}

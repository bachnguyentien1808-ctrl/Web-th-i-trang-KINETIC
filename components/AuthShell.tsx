import type { ReactNode } from "react";

const perks = ["⚡ Giao hoả tốc 2–4h", "★ Tích điểm hội viên", "↺ Đổi trả 30 ngày"];

/** Nền ảnh toàn chiều ngang + thẻ kính mờ ở giữa, dùng chung cho đăng nhập / đăng ký / quên mật khẩu. */
export default function AuthShell({ eyebrow, title, tabs, children }: { eyebrow: string; title: string; tabs?: ReactNode; children: ReactNode }) {
  return (
    <div className="auth-stage">
      <div className="auth-card">
        <div className="auth-mark"><span className="stripes"><i /><i /><i /></span><b>KINETIC</b></div>
        {tabs}
        <p className="auth-eyebrow">{eyebrow}</p>
        <h1 className="auth-title">{title}</h1>
        {children}
      </div>
      <ul className="auth-perks">{perks.map((p) => <li key={p}>{p}</li>)}</ul>
    </div>
  );
}

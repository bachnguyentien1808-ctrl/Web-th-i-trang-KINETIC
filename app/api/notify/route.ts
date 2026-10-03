import { NextResponse } from "next/server";

// Gửi SMS xác nhận đơn hàng. Có TWILIO_* trong .env.local thì gửi thật qua Twilio,
// không có thì chỉ ghi log ở chế độ demo (không gửi gì ra ngoài).
const strip = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");

function toE164(phone: string) {
  const p = phone.replace(/[\s.-]/g, "");
  if (/^\+84\d{9}$/.test(p)) return p;
  if (/^0\d{9}$/.test(p)) return "+84" + p.slice(1);
  return null;
}

export async function POST(req: Request) {
  let body: { phone?: string; order?: string; total?: number; name?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Dữ liệu không hợp lệ" }, { status: 400 }); }

  const to = toE164(String(body.phone ?? ""));
  const order = String(body.order ?? "").slice(0, 20);
  const total = Number(body.total);
  if (!to || !/^KN\d{4,12}$/.test(order) || !Number.isFinite(total) || total <= 0) {
    return NextResponse.json({ ok: false, error: "Thông tin không hợp lệ" }, { status: 400 });
  }

  const text = strip(`KINETIC: Don hang #${order} da dat thanh cong. Tong thanh toan ${total.toLocaleString("vi-VN")}d. Cam on ${String(body.name ?? "ban").slice(0, 30)}!`);
  const { TWILIO_ACCOUNT_SID: sid, TWILIO_AUTH_TOKEN: token, TWILIO_FROM: from } = process.env;

  if (!sid || !token || !from) {
    console.log(`[SMS demo] -> ${to}: ${text}`);
    return NextResponse.json({ ok: true, mode: "demo" });
  }

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: { Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"), "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ To: to, From: from, Body: text }),
  });
  if (!res.ok) return NextResponse.json({ ok: false, error: "Nhà cung cấp SMS từ chối" }, { status: 502 });
  return NextResponse.json({ ok: true, mode: "live" });
}

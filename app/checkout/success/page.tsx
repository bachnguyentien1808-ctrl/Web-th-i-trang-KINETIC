"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { formatVnd, getProduct, products, thumb } from "@/lib/products";

interface Last { earnPoints?: number; tier?: string; rate?: number; pointsUsed?: number; items?: string[]; order: string; total: number; name: string; pay: string; phone?: string }
type Sms = "sending" | "live" | "demo" | "failed";

const mask = (p: string) => p.replace(/\s/g, "").replace(/^(.{3}).*(.{3})$/, "$1****$2");

export default function Success() {
  const [o, setO] = useState<Last | null>(null);
  const [sms, setSms] = useState<Sms | null>(null);
  const sent = useRef(false);

  useEffect(() => {
    let last: Last | null = null;
    try { last = JSON.parse(sessionStorage.getItem("kinetic-last-order") || "null"); } catch {}
    setO(last);
    if (!last?.phone || sent.current) return;
    sent.current = true;
    const flag = `kinetic-sms-${last.order}`;
    const prev = sessionStorage.getItem(flag);
    if (prev) { setSms(prev as Sms); return; }
    setSms("sending");
    fetch("/api/notify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: last.phone, order: last.order, total: last.total, name: last.name }) })
      .then((r) => r.json())
      .then((r) => { const s: Sms = r.ok ? (r.mode === "live" ? "live" : "demo") : "failed"; sessionStorage.setItem(flag, s); setSms(s); })
      .catch(() => setSms("failed"));
  }, []);

  const bought = new Set(o?.items ?? []);
  const more = products.filter((p) => !bought.has(p.slug)).slice(0, 8);

  return (
    <div className="container section">
      <div className="center">
        <div className="check">✓</div>
        <h1 className="h1">ĐẶT HÀNG THÀNH CÔNG</h1>
        {o ? <p className="pad">Cảm ơn <b>{o.name}</b>! Mã đơn <b>{o.order}</b> · Tổng <b>{formatVnd(o.total)}</b>. Chúng tôi sẽ liên hệ xác nhận trong ít phút.</p> : <p className="pad muted">Cảm ơn bạn đã mua hàng tại Kinetic.</p>}

        {o?.items && o.items.length > 0 && (
          <div className="pay-banner done">
            <div className="pay-banner-imgs">
              {o.items.slice(0, 5).map((s) => { const p = getProduct(s); return p ? <div key={s} className="pay-thumb"><Image src={thumb(p.image)} alt={p.name} fill sizes="110px" /></div> : null; })}
            </div>
          </div>
        )}

        {!!o?.earnPoints && (
          <div className="sms-note">⭐ Bạn sẽ nhận <b>{o.earnPoints.toLocaleString("vi-VN")} điểm</b> (thẻ {o.tier} · {o.rate}%) khi đơn hàng được giao thành công.</div>
        )}

        {o?.phone && sms && (
          <div className={`sms-note ${sms}`}>
            {sms === "sending" && <>📱 Đang gửi tin nhắn xác nhận tới <b>{mask(o.phone)}</b>…</>}
            {sms === "live" && <>📱 Đã gửi tin nhắn xác nhận tới số <b>{mask(o.phone)}</b>.</>}
            {sms === "demo" && <>📱 Tin nhắn xác nhận cho số <b>{mask(o.phone)}</b> đã được tạo. <small>(Chế độ demo: chưa kết nối nhà cung cấp SMS nên chưa gửi thật.)</small></>}
            {sms === "failed" && <>⚠ Chưa gửi được tin nhắn tới <b>{mask(o.phone)}</b>. Bạn vẫn có thể xem đơn ở mục “Theo dõi đơn hàng”.</>}
          </div>
        )}

        <div className="success-cta">
          <Link href="/orders" className="btn btn-outline">THEO DÕI ĐƠN HÀNG</Link>
          <Link href="/products" className="btn btn-black">TIẾP TỤC MUA SẮM</Link>
        </div>
      </div>

      <section className="section">
        <div className="sec-head"><h2>CÓ THỂ BẠN SẼ THÍCH</h2><Link href="/products" className="more">XEM TẤT CẢ →</Link></div>
        <div className="grid">{more.map((p) => <ProductCard key={p.slug} p={p} />)}</div>
      </section>
    </div>
  );
}

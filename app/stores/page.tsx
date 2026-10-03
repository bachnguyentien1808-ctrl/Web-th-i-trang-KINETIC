"use client";
import { useState } from "react";
import RequireAuth from "@/components/RequireAuth";

interface Store { name: string; city: string; addr: string; hours: string; phone: string; flagship?: boolean; services: string[] }
const SV = { try: "Thử đồ & giày", ret: "Đổi trả tại cửa hàng", pick: "Nhận hàng online", fit: "Tư vấn size", vip: "Phòng hội viên" };

const stores: Store[] = [
  { name: "Kinetic Flagship Store", city: "TP. Hồ Chí Minh", addr: "128 Nguyễn Trãi, Phường Bến Thành, Quận 1", hours: "08:00 – 22:00", phone: "028 3822 8899", flagship: true, services: [SV.try, SV.ret, SV.pick, SV.fit, SV.vip] },
  { name: "Kinetic Vincom Đồng Khởi", city: "TP. Hồ Chí Minh", addr: "72 Lê Thánh Tôn, Phường Bến Nghé, Quận 1", hours: "09:30 – 22:00", phone: "028 3822 7788", services: [SV.try, SV.ret, SV.pick] },
  { name: "Kinetic Thủ Đức", city: "TP. Hồ Chí Minh", addr: "216 Võ Văn Ngân, Phường Bình Thọ, TP. Thủ Đức", hours: "09:00 – 21:30", phone: "028 3722 6677", services: [SV.try, SV.ret, SV.fit] },
  { name: "Kinetic Hoàn Kiếm", city: "Hà Nội", addr: "25 Tràng Tiền, Phường Tràng Tiền, Quận Hoàn Kiếm", hours: "08:00 – 22:00", phone: "024 3933 8899", flagship: true, services: [SV.try, SV.ret, SV.pick, SV.fit, SV.vip] },
  { name: "Kinetic Cầu Giấy", city: "Hà Nội", addr: "88 Cầu Giấy, Phường Quan Hoa, Quận Cầu Giấy", hours: "09:00 – 21:30", phone: "024 3766 5544", services: [SV.try, SV.ret, SV.pick] },
  { name: "Kinetic Royal City", city: "Hà Nội", addr: "72A Nguyễn Trãi, Phường Thượng Đình, Quận Thanh Xuân", hours: "09:30 – 22:00", phone: "024 3555 6677", services: [SV.try, SV.ret] },
  { name: "Kinetic Hải Châu", city: "Đà Nẵng", addr: "90 Nguyễn Văn Linh, Phường Nam Dương, Quận Hải Châu", hours: "09:00 – 21:30", phone: "0236 3822 889", services: [SV.try, SV.ret, SV.pick, SV.fit] },
  { name: "Kinetic Sơn Trà", city: "Đà Nẵng", addr: "15 Võ Nguyên Giáp, Phường Phước Mỹ, Quận Sơn Trà", hours: "09:00 – 21:30", phone: "0236 3922 112", services: [SV.try, SV.ret] },
  { name: "Kinetic Ninh Kiều", city: "Cần Thơ", addr: "56 Hòa Bình, Phường Tân An, Quận Ninh Kiều", hours: "09:00 – 21:00", phone: "0292 3822 556", services: [SV.try, SV.ret, SV.pick] },
  { name: "Kinetic Nha Trang", city: "Khánh Hoà", addr: "34 Trần Phú, Phường Lộc Thọ, TP. Nha Trang", hours: "09:00 – 21:30", phone: "0258 3822 334", services: [SV.try, SV.ret] },
];
const cities = [...new Set(stores.map((s) => s.city))];

function Stores() {
  const [city, setCity] = useState("all");
  const [q, setQ] = useState("");
  const term = q.trim().toLowerCase();
  const shown = stores.filter((s) => (city === "all" || s.city === city) && (!term || (s.name + s.addr).toLowerCase().includes(term)));

  return (
    <div className="container section">
      <section className="help-hero">
        <small className="tag">HỆ THỐNG CỬA HÀNG</small>
        <h1>Tìm cửa hàng Kinetic gần bạn</h1>
        <p>{stores.length} cửa hàng tại {cities.length} tỉnh/thành. Ghé thử đồ, nhận tư vấn size và nhận hàng đặt online trực tiếp.</p>
        <input className="help-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔎  Tìm theo tên đường, quận, tên cửa hàng..." />
      </section>

      <div className="stats" style={{ margin: "16px 0" }}>
        <div className="stat"><small>CỬA HÀNG</small><b>{stores.length}</b><span>Trên toàn quốc</span></div>
        <div className="stat"><small>TỈNH / THÀNH</small><b>{cities.length}</b><span>{cities.join(" · ")}</span></div>
        <div className="stat"><small>GIỜ MỞ CỬA</small><b>08:00 – 22:00</b><span>Flagship mở cửa mỗi ngày</span></div>
        <div className="stat"><small>HOTLINE</small><b>1900 8899</b><span>Hỗ trợ tìm cửa hàng</span></div>
      </div>

      <div className="topic-chips">
        <button className={city === "all" ? "chip on" : "chip"} onClick={() => setCity("all")}>Tất cả ({stores.length})</button>
        {cities.map((c) => <button key={c} className={city === c ? "chip on" : "chip"} onClick={() => setCity(c)}>{c} ({stores.filter((s) => s.city === c).length})</button>)}
      </div>

      {shown.length === 0 && <p className="muted pad">Không tìm thấy cửa hàng phù hợp.</p>}
      <div className="store-grid">
        {shown.map((s) => (
          <article key={s.name} className="store-card">
            <header>
              <h3>{s.name}</h3>
              {s.flagship && <i className="v-best">FLAGSHIP</i>}
            </header>
            <ul>
              <li><i>📍</i><span>{s.addr}, {s.city}</span></li>
              <li><i>🕒</i><span>Mở cửa: {s.hours} (cả tuần)</span></li>
              <li><i>📞</i><span>{s.phone}</span></li>
            </ul>
            <div className="svc">{s.services.map((x) => <span key={x}>{x}</span>)}</div>
            <div className="store-actions">
              <a className="btn btn-black sm" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.name}, ${s.addr}, ${s.city}`)}`}>CHỈ ĐƯỜNG</a>
              <a className="btn btn-outline sm" href={`tel:${s.phone.replace(/\s/g, "")}`}>GỌI CỬA HÀNG</a>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
export default function StoresPage() { return <RequireAuth><Stores /></RequireAuth>; }

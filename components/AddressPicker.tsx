"use client";
import { useEffect, useState } from "react";

interface Item { code: number; name: string }
export interface Address { province: string; district: string; ward: string }

const API = "https://provinces.open-api.vn/api";

export default function AddressPicker({ onChange, errors }: { onChange: (a: Address) => void; errors: Record<string, string> }) {
  const [provinces, setProvinces] = useState<Item[]>([]);
  const [districts, setDistricts] = useState<Item[]>([]);
  const [wards, setWards] = useState<Item[]>([]);
  const [p, setP] = useState(""), [d, setD] = useState(""), [w, setW] = useState("");
  const [failed, setFailed] = useState(false);

  const get = (url: string) => fetch(url).then((r) => { if (!r.ok) throw new Error(); return r.json(); });

  useEffect(() => { get(`${API}/p/`).then(setProvinces).catch(() => setFailed(true)); }, []);

  const name = (list: Item[], code: string) => list.find((i) => String(i.code) === code)?.name ?? "";
  const emit = (pv: string, ds: string, wd: string, pl = provinces, dl = districts, wl = wards) =>
    onChange({ province: name(pl, pv), district: name(dl, ds), ward: name(wl, wd) });

  async function pickProvince(code: string) {
    setP(code); setD(""); setW(""); setDistricts([]); setWards([]);
    emit(code, "", "");
    if (!code) return;
    try { const r = await get(`${API}/p/${code}?depth=2`); setDistricts(r.districts); } catch { setFailed(true); }
  }
  async function pickDistrict(code: string) {
    setD(code); setW(""); setWards([]);
    emit(p, code, "");
    if (!code) return;
    try { const r = await get(`${API}/d/${code}?depth=2`); setWards(r.wards); } catch { setFailed(true); }
  }

  if (failed) {
    return (
      <div>
        <p className="form-err">Không tải được danh sách địa chỉ. Vui lòng nhập tay.</p>
        {(["province", "district", "ward"] as const).map((k, i) => (
          <label key={k} className={errors[k] ? "field bad" : "field"}>
            <span>{["TỈNH / THÀNH PHỐ", "QUẬN / HUYỆN", "PHƯỜNG / XÃ"][i]}</span>
            <input onChange={(e) => onChange({ province: "", district: "", ward: "", [k]: e.target.value } as Address)} />
            {errors[k] && <em>{errors[k]}</em>}
          </label>
        ))}
      </div>
    );
  }

  const select = (key: string, label: string, value: string, items: Item[], on: (v: string) => void, disabled?: boolean) => (
    <label className={errors[key] ? "field bad" : "field"}>
      <span>{label}</span>
      <select value={value} onChange={(e) => on(e.target.value)} disabled={disabled}>
        <option value="">- Chọn -</option>
        {items.map((i) => <option key={i.code} value={i.code}>{i.name}</option>)}
      </select>
      {errors[key] && <em>{errors[key]}</em>}
    </label>
  );

  return (
    <div>
      {select("province", "TỈNH / THÀNH PHỐ", p, provinces, pickProvince)}
      <div className="two">
        {select("district", "QUẬN / HUYỆN", d, districts, pickDistrict, !p)}
        {select("ward", "PHƯỜNG / XÃ", w, wards, (v) => { setW(v); emit(p, d, v); }, !d)}
      </div>
    </div>
  );
}

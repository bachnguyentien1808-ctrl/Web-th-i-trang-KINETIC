import { MAINTAIN_MONTHS, ROLLING_MONTHS, tiers, type Loyalty } from "@/lib/loyalty";
import { formatVnd } from "@/lib/products";

/** Lộ trình các hạng thẻ. Có `l` (đã đăng nhập) thì hiện tiến độ cá nhân, không thì hiện bảng mức chung. */
export default function TierLadder({ l }: { l?: Loyalty | null }) {
  return (
    <div className="ladder">
      {tiers.map((t, i) => {
        const state = !l ? "open" : i === l.index ? "current" : i < l.index ? "done" : i <= l.baseIndex ? "restore" : "locked";
        const need = l ? Math.max(0, t.min - l.spend12m) : t.min;
        const pct = l ? Math.min(100, t.min === 0 ? 100 : (l.spend12m / t.min) * 100) : 0;
        return (
          <article key={t.key} className={`tier ${state}`} style={{ ["--tier" as string]: t.color }}>
            <header>
              <span className="tier-name"><i className="tier-dot" style={{ background: t.color }} />{t.name}</span>
              {state === "current" && <em className="v-best">HẠNG CỦA BẠN</em>}
              {state === "done" && <em className="tick">✓ ĐÃ ĐẠT</em>}
            </header>
            <div className="tier-rate"><b>{t.rate}%</b><span>tích điểm mỗi đơn</span></div>
            <ul>
              <li>{t.min === 0 ? "Mặc định khi đăng ký" : <>Chi tiêu từ <b>{formatVnd(t.min)}</b> trong {ROLLING_MONTHS} tháng</>}</li>
              <li>Mua {formatVnd(1_000_000)} → tích <b>{((1_000_000 * t.rate) / 100).toLocaleString("vi-VN")} điểm</b></li>
              <li>Giữ hạng: mua ≥ 1 sản phẩm mỗi {MAINTAIN_MONTHS} tháng</li>
            </ul>
            {l && state === "locked" && (
              <div className="tier-prog">
                <div className="prog"><i style={{ width: `${pct}%`, background: t.color }} /></div>
                <small>Còn <b>{formatVnd(need)}</b> để đạt hạng này</small>
              </div>
            )}
            {l && state === "restore" && <small className="late">Bạn đủ điều kiện chi tiêu - mua hàng để khôi phục hạng này.</small>}
            {l && state === "current" && l.next && <small>Còn <b>{formatVnd(l.toNext)}</b> để lên hạng {l.next.name}.</small>}
            {l && state === "current" && !l.next && <small>🎉 Hạng cao nhất.</small>}
          </article>
        );
      })}
    </div>
  );
}

"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import RequireAuth from "@/components/RequireAuth";
import { isAdmin } from "@/lib/admin";
import TierLadder from "@/components/TierLadder";
import { useAuth } from "@/lib/auth";
import { MAINTAIN_MONTHS, ROLLING_MONTHS, loyaltyOf, tiers } from "@/lib/loyalty";
import { readOrders } from "@/lib/orders";
import { formatVnd } from "@/lib/products";

const day = (d: Date) => d.toLocaleDateString("vi-VN");
const daysLeft = (d: Date) => Math.ceil((d.getTime() - Date.now()) / 86400000);

function Account() {
  const { user } = useAuth();
  if (user && isAdmin(user.email)) notFound(); // admin không có thẻ/điểm hội viên
  const [l, setL] = useState<ReturnType<typeof loyaltyOf> | null>(null);
  useEffect(() => { if (user) setL(loyaltyOf(readOrders(user.email))); }, [user]);
  if (!l || !user) return null;

  const t = l.tier;
  const progress = l.next ? Math.min(100, ((l.spend12m - t.min) / (l.next.min - t.min)) * 100) : 100;

  return (
    <div className="container section">
      <h1 className="h1">HỘI VIÊN KINETIC</h1>

      <div className="member-card" style={{ ["--tier" as string]: t.color }}>
        <div>
          <small>THẺ HỘI VIÊN</small>
          <h2>{t.name.toUpperCase()}</h2>
          <p>{user.name}<br /><span>{user.email}</span></p>
        </div>
        <div className="mc-right">
          <b>{t.rate}%</b><span>tích điểm mỗi đơn</span>
        </div>
      </div>

      <div className="stats">
        <Link href="/account/points" className="stat link"><small>ĐIỂM KHẢ DỤNG</small><b>{l.balance.toLocaleString("vi-VN")}</b><span>= {formatVnd(l.balance)} · Xem lịch sử điểm →</span></Link>
        <div className="stat"><small>ĐIỂM CHỜ CỘNG</small><b>{l.pending.toLocaleString("vi-VN")}</b><span>Cộng khi đơn giao thành công</span></div>
        <div className="stat"><small>CHI TIÊU {ROLLING_MONTHS} THÁNG GẦN NHẤT</small><b>{formatVnd(l.spend12m)}</b><span>Tính đơn đã giao</span></div>
        <div className={l.lapsed || l.atRisk ? "stat warn" : "stat"}>
          <small>DUY TRÌ HẠNG</small>
          {l.deadline
            ? <><b>{l.lapsed ? "Đã quá hạn" : `Còn ${daysLeft(l.deadline)} ngày`}</b><span>{l.lapsed ? `Hạng bị hạ ${l.lapses} bậc. Mua hàng để khôi phục.` : `Mua ít nhất 1 sản phẩm trước ${day(l.deadline)}`}</span></>
            : <><b>Chưa mua</b><span>Mua đơn đầu tiên để bắt đầu tích điểm</span></>}
        </div>
      </div>

      <section className="panel">
        <h3>TIẾN ĐỘ LÊN HẠNG</h3>
        {l.next ? (
          <>
            <p className="small">Chi tiêu thêm <b>{formatVnd(l.toNext)}</b> trong {ROLLING_MONTHS} tháng để lên hạng <b>{l.next.name}</b> (tích {l.next.rate}%).</p>
            <div className="prog"><i style={{ width: `${progress}%`, background: l.next.color }} /></div>
            <small className="muted">{formatVnd(l.spend12m)} / {formatVnd(l.next.min)}</small>
          </>
        ) : <p className="small">🎉 Bạn đang ở hạng cao nhất - <b>Kim cương</b> (tích 20%).</p>}
        {l.lapsed && <p className="form-err">Do chưa mua hàng trong {MAINTAIN_MONTHS * l.lapses} tháng, thẻ bị hạ từ hạng {tiers[l.baseIndex].name} xuống {t.name}. <Link href="/products" className="ul">Mua sắm ngay →</Link></p>}
      </section>

      <section className="panel">
        <h3>CÁC MỨC THẺ & CÁCH ĐẠT ĐƯỢC</h3>
        <p className="small muted">Hạng xét theo tổng chi tiêu các đơn đã giao trong {ROLLING_MONTHS} tháng gần nhất. Bạn đã chi tiêu <b>{formatVnd(l.spend12m)}</b>.</p>
        <TierLadder l={l} />
      </section>

      <section className="panel">
        <h3>QUY ĐỊNH</h3>
        <ul className="rules">
          <li>Mọi hội viên bắt đầu ở hạng <b>Đồng (5%)</b>. Hạng cao nhất <b>Kim cương (20%)</b>.</li>
          <li>Hạng xét theo <b>tổng chi tiêu của các đơn đã giao trong {ROLLING_MONTHS} tháng gần nhất</b>.</li>
          <li>Điểm = % theo hạng × số tiền thanh toán, được cộng khi đơn <b>giao thành công</b>. 1 điểm = 1₫, dùng tối đa 50% giá trị mỗi đơn.</li>
          <li>Để <b>duy trì hạng</b>, cần mua ít nhất <b>1 sản phẩm trong mỗi {MAINTAIN_MONTHS} tháng</b>. Quá {MAINTAIN_MONTHS} tháng không mua, hạng bị hạ 1 bậc; mỗi {MAINTAIN_MONTHS} tháng tiếp theo hạ thêm 1 bậc (thấp nhất là Đồng).</li>
          <li>Mua lại sẽ khôi phục hạng theo chi tiêu hiện tại. Đơn bị huỷ không được tính, điểm đã dùng cho đơn huỷ được hoàn lại.</li>
        </ul>
      </section>
    </div>
  );
}
export default function AccountPage() { return <RequireAuth><Account /></RequireAuth>; }

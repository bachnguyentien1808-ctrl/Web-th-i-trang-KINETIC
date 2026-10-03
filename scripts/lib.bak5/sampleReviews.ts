import { colorOf, type Product } from "./products";

// Nhận xét mẫu cho từng sản phẩm (tạo theo công thức cố định từ mã sản phẩm, nên mỗi lần mở trang đều giống nhau).
// Đây là nội dung mẫu để trang không trống — thay bằng đánh giá thật của khách khi có.
export interface SampleReview { id: string; name: string; rating: number; text: string; date: string; meta: string }

const NAMES = ["Nguyễn Minh Anh", "Trần Quốc Bảo", "Lê Thu Hà", "Phạm Đức Huy", "Vũ Ngọc Lan", "Đặng Hoàng Nam", "Bùi Khánh Linh", "Hoàng Gia Hưng", "Ngô Thanh Tâm", "Dương Tuấn Kiệt",
  "Đỗ Phương Thảo", "Lý Văn Long", "Phan Mai Chi", "Võ Thành Đạt", "Trịnh Bảo Ngọc", "Mai Anh Tú", "Đinh Hải Yến", "Cao Minh Khoa", "Lương Thùy Dung", "Tạ Quang Vinh",
  "Hồ Thị Hương", "Nguyễn Đình Phúc", "Châu Kim Ngân", "Lâm Hữu Tài", "Huỳnh Diễm My", "Kiều Anh Dũng", "Thái Bích Phượng", "Âu Thế Vỹ"];

type Tpl = (c: string, s: string) => string;
const SHOE: Tpl[] = [
  (c) => `Giày mang rất êm, form chuẩn size, đi cả ngày không đau chân. Màu ${c} ngoài đời đẹp hơn trong ảnh.`,
  (_, s) => `Mình đi size ${s} vừa chân, lúc đầu hơi ôm nhẹ rồi thoải mái dần. Đế bám tốt, đi mưa không bị trơn.`,
  () => "Nhẹ, thoáng, chạy bộ buổi sáng rất ổn. Giao hàng nhanh, hộp đóng gói cẩn thận.",
  (c) => `Mua về mang đi làm lẫn đi chơi đều hợp. Màu ${c} dễ phối đồ, đường may chắc chắn.`,
  () => "Chất liệu tốt, vệ sinh dễ. Mang một tuần chưa thấy bung keo hay xô lệch gì, rất hài lòng.",
  () => "Giày đẹp, đúng mẫu như hình. Chỉ hơi cứng lúc mới mang, vài ngày sau là êm hẳn. Vẫn đáng tiền.",
  (_, s) => `Chọn size ${s} theo bảng size của shop là chuẩn, không phải đổi. Shop tư vấn nhiệt tình.`,
  () => "Đệm đế dày nên chạy cự ly dài đỡ mỏi chân hơn hẳn đôi cũ của mình.",
];
const BAG: Tpl[] = [
  (c) => `Balo màu ${c} đẹp, vải dày dặn, đường chỉ chắc. Nhiều ngăn nên sắp xếp đồ rất gọn.`,
  () => "Đựng vừa laptop, bình nước và quần áo đi tập. Quai đeo êm, đeo cả ngày không đau vai.",
  () => "Vải chống thấm tốt, đi mưa nhỏ đồ bên trong vẫn khô. Khoá kéo mượt.",
  (c) => `Màu ${c} ngoài đời đúng như hình, nhìn rất thể thao. Giao hàng nhanh, đóng gói kỹ.`,
  () => "Dáng gọn, nhẹ hơn mình nghĩ. Ngăn phụ bên hông tiện để vợt hoặc bình nước.",
  () => "Dùng đi học và đi tập đều hợp. Mới dùng hai tuần nhưng chưa thấy xù hay bung chỉ.",
  () => "Giá hợp lý so với chất lượng. Hơi nhỏ nếu mang nhiều đồ nhưng đúng như mô tả.",
];
const CAP: Tpl[] = [
  (c) => `Mũ màu ${c} đẹp, vải dày vừa phải, đội không bị nóng. Form mũ đứng, nhìn gọn mặt.`,
  () => "Khoá điều chỉnh phía sau chắc, đội vừa đầu mình. Chạy bộ ngoài nắng rất tiện.",
  () => "Thêu/in sắc nét, đường may đều. Đội đi chơi hay đi tập đều hợp.",
  (c) => `Mua thêm màu ${c} để đổi style. Chất vải mềm, thấm mồ hôi tốt.`,
  () => "Nhẹ, thoáng, che nắng ổn. Giao hàng nhanh, bọc hộp cẩn thận nên mũ không bị méo.",
  () => "Giá tốt cho chất lượng này. Vành mũ cong tự nhiên, không bị mềm nhũn.",
];
const PANTS: Tpl[] = [
  (c, s) => `Quần màu ${c}, mình mặc size ${s} vừa vặn, cạp thun co giãn thoải mái. Vải mềm, không bị bí.`,
  () => "Mặc tập gym và chạy bộ đều ổn, vận động thoải mái, không bị bó. Bo gấu ôm chân gọn.",
  (c) => `Màu ${c} ngoài đời đẹp, không phai sau lần giặt đầu. Đường may chắc.`,
  () => "Chất vải dày vừa, mặc đi chơi hay ở nhà đều hợp. Túi sâu, để điện thoại không rơi.",
  (_, s) => `Chiều cao mình hơi cao nhưng chọn size ${s} vẫn đủ dài. Shop tư vấn size chuẩn.`,
  () => "Giao nhanh, đóng gói gọn. Quần đúng mẫu, nhìn thể thao và dễ phối với áo thun.",
  () => "Giặt máy xong không co, không xù lông. Mặc mát, mình sẽ mua thêm màu khác.",
];
const TOP: Tpl[] = [
  (c, s) => `Áo màu ${c} đẹp, mình mặc size ${s} vừa người, vải mềm và thoáng. Mặc đi tập rất thoải mái.`,
  () => "Chất vải tốt, co giãn nhẹ, thấm hút mồ hôi nhanh. Đường may và logo in rất gọn.",
  (c) => `Màu ${c} ngoài đời đúng như hình, không bị lệch tông. Giao hàng nhanh, đóng gói cẩn thận.`,
  () => "Form áo đẹp, tôn dáng. Giặt máy vài lần chưa thấy phai màu hay xù lông.",
  (_, s) => `Mình cao 1m7, nặng 62kg mặc size ${s} là vừa. Shop tư vấn size nhiệt tình, không phải đổi.`,
  () => "Giá hợp lý so với chất lượng. Mặc đi chơi hay đi tập đều hợp, sẽ ủng hộ shop tiếp.",
  () => "Lớp vải dày vừa phải, giữ ấm tốt mà không bí. Khoá kéo/đường may chắc chắn.",
  () => "Áo nhìn sang hơn mình nghĩ, ngoài đời đẹp hơn ảnh. Đáng tiền.",
];
const MID: Tpl[] = [
  (c) => `Sản phẩm màu ${c} đẹp, chất lượng ổn. Chỉ có điều giao hơi lâu hơn dự kiến một chút, còn lại hài lòng.`,
  () => "Hàng đúng mô tả, dùng ổn. Mình mong shop có thêm nhiều size để chọn.",
  () => "Chất lượng tạm ổn so với giá tiền. Mới dùng nên chưa đánh giá được độ bền, tạm 4 sao.",
];

function hash(str: string) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed: number) { let s = seed || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

export function sampleReviews(p: Product): SampleReview[] {
  const r = rng(hash(p.slug));
  const group = p.category === "giay" ? SHOE : /^(ba-?lo|túi)/i.test(p.name) ? BAG : /^mũ/i.test(p.name) ? CAP : p.category === "quan" ? PANTS : TOP;
  const color = colorOf(p).toLowerCase();
  const sizes = p.sizes.filter((s) => s.inStock && s.label !== "FREE SIZE" && !/LÍT/.test(s.label)).map((s) => s.label);
  const ratings = p.rating >= 4.8 ? [5, 5, 5, 5, 4] : p.rating >= 4.6 ? [5, 5, 5, 4, 4] : [5, 5, 4, 4, 4];
  const n = 4 + Math.floor(r() * 2); // 4–5 nhận xét
  const pickedTpl = new Set<number>(), pickedName = new Set<number>(), out: SampleReview[] = [];
  const uniq = (set: Set<number>, len: number) => { let i = Math.floor(r() * len); while (set.has(i)) i = (i + 1) % len; set.add(i); return i; };
  const day0 = Date.UTC(2026, 8, 30);
  let day = 1 + Math.floor(r() * 3);
  for (let k = 0; k < n; k++) {
    const rating = ratings[k % ratings.length];
    const tpl = rating === 4 && r() < 0.35 ? MID[uniq(new Set<number>(), MID.length)] : group[uniq(pickedTpl, group.length)];
    const size = sizes.length ? sizes[Math.floor(r() * sizes.length)] : "";
    const name = NAMES[uniq(pickedName, NAMES.length)];
    out.push({
      id: `${p.slug}-${k}`, name, rating, text: tpl(color, size || "vừa"),
      date: new Date(day0 - day * 86400000).toISOString(),
      meta: [size && `Size: ${size}`, `Màu: ${colorOf(p)}`].filter(Boolean).join(" · "),
    });
    day += 2 + Math.floor(r() * 9);
  }
  return out;
}

export interface Profile {
  phone: string; birth: string; address: string;
  gender: string; height: string; weight: string; payment: string;
  notifyOrder: boolean; notifyPromo: boolean;
}
const key = (email: string) => `kinetic-profile-v1:${email}`;
export const emptyProfile: Profile = {
  phone: "", birth: "", address: "", gender: "", height: "", weight: "", payment: "",
  notifyOrder: true, notifyPromo: true,
};

export const genders = ["Nam", "Nữ", "Khác"];
// Phương thức thanh toán (khoá dùng chung với trang thanh toán)
export const paymentMethods: { key: string; label: string; note: string }[] = [
  { key: "cod", label: "Thanh toán khi nhận hàng (COD)", note: "Trả tiền mặt khi shipper giao hàng" },
  { key: "vnpay", label: "VNPAY-QR", note: "Quét mã QR bằng app ngân hàng" },
  { key: "momo", label: "Ví MoMo", note: "Thanh toán nhanh qua ví điện tử" },
  { key: "card", label: "Thẻ Visa / Mastercard", note: "Thẻ tín dụng hoặc ghi nợ quốc tế" },
];

export function readProfile(email: string): Profile {
  try { return { ...emptyProfile, ...JSON.parse(localStorage.getItem(key(email)) || "{}") }; } catch { return emptyProfile; }
}
export function saveProfile(email: string, p: Profile) {
  try { localStorage.setItem(key(email), JSON.stringify(p)); return true; } catch { return false; }
}
export const fmtBirth = (iso: string) => (iso ? iso.split("-").reverse().join("/") : "");

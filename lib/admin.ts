// Tài khoản admin: đăng ký (hoặc đăng nhập) bằng một trong các email dưới đây sẽ có quyền quản trị.
// Lưu ý: đây là bản demo chạy trên trình duyệt, KHÔNG an toàn cho môi trường thật - cần backend để phân quyền thật.
export const ADMIN_EMAILS = ["admin@kinetic.local"];
export const isAdmin = (email?: string | null) => !!email && ADMIN_EMAILS.includes(email.toLowerCase());

export interface StoredUser { name: string; email: string }
export function readUsers(): StoredUser[] {
  try { return (JSON.parse(localStorage.getItem("kinetic-users-v1") || "[]") as StoredUser[]).map((u) => ({ name: u.name, email: u.email })); } catch { return []; }
}

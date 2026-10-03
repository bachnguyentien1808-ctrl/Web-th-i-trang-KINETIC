export interface Profile { phone: string; birth: string; address: string }
const key = (email: string) => `kinetic-profile-v1:${email}`;
export const emptyProfile: Profile = { phone: "", birth: "", address: "" };

export function readProfile(email: string): Profile {
  try { return { ...emptyProfile, ...JSON.parse(localStorage.getItem(key(email)) || "{}") }; } catch { return emptyProfile; }
}
export function saveProfile(email: string, p: Profile) {
  try { localStorage.setItem(key(email), JSON.stringify(p)); return true; } catch { return false; }
}
export const fmtBirth = (iso: string) => (iso ? iso.split("-").reverse().join("/") : "");

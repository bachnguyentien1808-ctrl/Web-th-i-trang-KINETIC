import AdminShell from "@/components/admin/AdminShell";

export const metadata = { title: "Quản trị - KINETIC" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}

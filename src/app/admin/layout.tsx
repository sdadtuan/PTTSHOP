import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import "./admin.css";

export const metadata: Metadata = {
  title: "Admin PTT Shop",
  description: "Bảng quản trị cửa hàng PTT Shop",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}

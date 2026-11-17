import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import "./admin.css";

export const metadata: Metadata = {
  title: "Admin VIZFAS",
  description: "Bảng quản trị cửa hàng VIZFAS",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}

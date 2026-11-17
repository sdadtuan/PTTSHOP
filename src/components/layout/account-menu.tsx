"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { LogOut, User } from "lucide-react";

export function AccountMenu() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <span className="rounded-full p-2 text-neutral-400" aria-hidden>
        <User className="h-5 w-5" />
      </span>
    );
  }

  if (!session?.user) {
    return (
      <Link
        href="/dang-nhap"
        className="rounded-full p-2 text-neutral-700 transition hover:bg-black/5"
        aria-label="Đăng nhập"
      >
        <User className="h-5 w-5" />
      </Link>
    );
  }

  return (
    <div className="relative flex items-center gap-1">
      {session.user.role === "ADMIN" ? (
        <Link
          href="/admin"
          className="hidden rounded-full px-2 py-1 text-xs font-medium text-[var(--accent)] sm:inline"
        >
          Admin
        </Link>
      ) : null}
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="rounded-full p-2 text-neutral-700 transition hover:bg-black/5"
        aria-label="Đăng xuất"
        title={session.user.email || "Đăng xuất"}
      >
        <LogOut className="h-5 w-5" />
      </button>
    </div>
  );
}

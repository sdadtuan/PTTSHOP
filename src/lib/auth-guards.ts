import { auth } from "@/auth";
import { ApiError } from "@/lib/api";

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new ApiError("Bạn cần đăng nhập", 401);
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  if (session.user.role !== "ADMIN") {
    throw new ApiError("Không có quyền truy cập", 403);
  }
  return session;
}

export async function getOptionalSession() {
  return auth();
}

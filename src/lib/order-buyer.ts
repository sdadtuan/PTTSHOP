export function orderBuyerId(user: { id?: string; role?: string } | null | undefined) {
  if (!user?.id || user.role === "ADMIN") return null;
  return user.id;
}

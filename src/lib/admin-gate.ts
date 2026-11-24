export function adminEntryRedirect(
  origin: string,
  path: string,
  search: string,
  user: { role?: string } | null,
) {
  if (!path.startsWith("/admin")) return null;
  if (!user) {
    const url = new URL("/dang-nhap", origin);
    const returnTo = `${path}${search}`;
    url.searchParams.set("callbackUrl", returnTo.startsWith("/admin") ? returnTo : "/admin");
    return { status: 307 as const, location: url.pathname + url.search };
  }
  if (user.role !== "ADMIN") {
    return { status: 307 as const, location: "/" };
  }
  return null;
}

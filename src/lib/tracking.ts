export const COOKIE_CHOICE = "pttshop_cookie";

export function optionalTrackingAllowed() {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").includes(`${COOKIE_CHOICE}=all`);
}

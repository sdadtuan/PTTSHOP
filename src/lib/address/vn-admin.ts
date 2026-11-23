import data from "@/data/vn-admin-2025.json";

export const VN_ADMIN_SOURCE = data.source;

export type VnProvince = { code: string; name: string };
export type VnWard = { c: string; n: string; p: string };

const provinces = data.provinces as VnProvince[];
const wards = data.wards as VnWard[];

export function listProvinces() {
  return provinces;
}

export function listWards(provinceCode: string) {
  return wards.filter((ward) => ward.p === provinceCode).map((ward) => ({ code: ward.c, name: ward.n }));
}

export function resolveAddress(provinceCode: string, wardCode: string) {
  const province = provinces.find((item) => item.code === provinceCode);
  const ward = wards.find((item) => item.c === wardCode && item.p === provinceCode);
  if (!province || !ward) return null;
  return { provinceCode: province.code, provinceName: province.name, wardCode: ward.c, wardName: ward.n };
}

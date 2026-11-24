export type GhnWard = {
  provinceName: string;
  districtId: number;
  districtName: string;
  wardCode: string;
  wardName: string;
};

export function foldAddress(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(thanh pho|tp|tinh|quan|huyen|thi xa|phuong|xa|thi tran)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Ghép tỉnh + phường/xã của form hai cấp với bảng phường GHN.
 * Chỉ trả về khi đúng một quận/huyện. Không tự chọn khi trùng tên.
 */
export function matchGhnWard(
  input: { provinceName: string; wardName: string },
  wards: GhnWard[],
): { districtId: number; wardCode: string } | null {
  const province = foldAddress(input.provinceName);
  const ward = foldAddress(input.wardName);
  if (!province || !ward) return null;
  const hits = wards.filter(
    (row) => foldAddress(row.provinceName) === province && foldAddress(row.wardName) === ward,
  );
  const districts = new Set(hits.map((row) => row.districtId));
  if (hits.length === 0 || districts.size !== 1) return null;
  return { districtId: hits[0].districtId, wardCode: hits[0].wardCode };
}

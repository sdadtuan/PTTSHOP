/** NCC mẫu chỉ được tạo ngoài production. */
export function databaseName(databaseUrl: string) {
  const normalized = databaseUrl.replace(/^postgres(ql)?:/i, "http:");
  return new URL(normalized).pathname.replace(/^\//, "").split("?")[0];
}

export function assertDemoSupplierAllowed(databaseUrl: string) {
  if (databaseName(databaseUrl) === "pttshop_prod") {
    throw new Error("Không tạo NCC-DEMO trên production");
  }
}

export const DEMO_SUPPLIER_CODE = "NCC-DEMO";

export const RETAIL_NO_INVOICE = "Khách lẻ không lấy hóa đơn";

export function invoiceBuyer(order: {
  customerName: string;
  customerEmail: string | null;
  address: string;
  invoiceCompanyName: string | null;
  invoiceTaxCode: string | null;
  invoiceAddress: string | null;
  invoiceEmail: string | null;
}) {
  const company = order.invoiceCompanyName?.trim() || "";
  const tax = order.invoiceTaxCode?.trim() || "";
  if (company || tax) {
    return {
      buyerKind: "COMPANY" as const,
      buyerName: company || order.customerName,
      buyerTaxCode: tax || null,
      buyerAddress: order.invoiceAddress?.trim() || order.address,
      buyerEmail: order.invoiceEmail?.trim() || order.customerEmail,
    };
  }
  const name = order.customerName.trim();
  if (!name) {
    return {
      buyerKind: "RETAIL" as const,
      buyerName: RETAIL_NO_INVOICE,
      buyerTaxCode: null,
      buyerAddress: order.address,
      buyerEmail: order.customerEmail,
    };
  }
  return {
    buyerKind: "RETAIL" as const,
    buyerName: name,
    buyerTaxCode: null,
    buyerAddress: order.address,
    buyerEmail: order.customerEmail,
  };
}

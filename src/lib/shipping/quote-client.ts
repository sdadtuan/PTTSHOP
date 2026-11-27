/** Bỏ qua báo giá khi giỏ chưa tải xong hoặc đang trống. */
export function shouldQuoteShipping(input: { loading: boolean; itemCount: number }) {
  return !input.loading && input.itemCount > 0;
}

/** Phản hồi của một lần gọi cũ không được áp lên tạm tính hiện tại. */
export function shippingFeeFromQuote(input: {
  requestedSubtotal: number;
  currentSubtotal: number;
  responseFee: number;
}) {
  if (input.requestedSubtotal !== input.currentSubtotal) return null;
  return input.responseFee;
}

export function displayedShippingFee(input: {
  currentSubtotal: number;
  freeFrom: number | null;
  acceptedFee: number | null;
  fallbackFee: number | null;
}) {
  if (input.acceptedFee !== null) return input.acceptedFee;
  if (input.freeFrom != null && input.currentSubtotal >= input.freeFrom) return 0;
  return input.fallbackFee;
}

export function replayShippingQuotes(
  events: Array<{ requestedSubtotal: number; currentSubtotal: number; responseFee: number }>,
  freeFrom: number | null,
  fallbackFee: number | null,
) {
  let fee: number | null = fallbackFee;
  for (const event of events) {
    const accepted = shippingFeeFromQuote(event);
    fee = displayedShippingFee({
      currentSubtotal: event.currentSubtotal,
      freeFrom,
      acceptedFee: accepted,
      fallbackFee: fee,
    });
  }
  return fee;
}

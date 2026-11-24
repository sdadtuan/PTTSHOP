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
  freeFrom: number;
  acceptedFee: number | null;
  fallbackFee: number;
}) {
  if (input.acceptedFee !== null) return input.acceptedFee;
  return input.currentSubtotal >= input.freeFrom ? 0 : input.fallbackFee;
}

export function replayShippingQuotes(
  events: Array<{ requestedSubtotal: number; currentSubtotal: number; responseFee: number }>,
  freeFrom = 500_000,
  fallbackFee = 30_000,
) {
  let fee = fallbackFee;
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

import { CartPage } from "@/components/cart/cart-page";
import { RecommendationBlock } from "@/components/recommendations/block";

export default function GioHangPage() {
  return (
    <>
      <CartPage />
      <RecommendationBlock placement="cart" />
    </>
  );
}

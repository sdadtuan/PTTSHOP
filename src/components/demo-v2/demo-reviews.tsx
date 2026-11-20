import Link from "next/link";
import { Star } from "lucide-react";

export type DemoReview = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  userName: string;
  productName: string;
  productSlug: string;
};

function Stars({ rating }: { rating: number }) {
  return (
    <div className="dv2-reviews__stars" aria-label={`${rating} trên 5 sao`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className="h-3.5 w-3.5"
          fill={i < rating ? "currentColor" : "none"}
          strokeWidth={1.75}
          aria-hidden
        />
      ))}
    </div>
  );
}

export function DemoReviews({
  reviews,
  title = "Khách Hàng Nói Gì Về VIZFAS",
  emptyLine1 = "Chưa có đánh giá công khai.",
  emptyLine2 = "Khi khách mua hàng để lại review, chúng sẽ hiện tại đây.",
}: {
  reviews: DemoReview[];
  title?: string;
  emptyLine1?: string;
  emptyLine2?: string;
}) {
  return (
    <section
      id="danh-gia"
      className="dv2-section dv2-section--soft"
      data-testid="demo-v2-reviews"
      aria-labelledby="dv2-reviews-title"
    >
      <div className="dv2-wrap">
        <div className="dv2-section__head">
          <h2 id="dv2-reviews-title" className="dv2-section__title">
            <span className="dv2-slashes" aria-hidden>
              ///
            </span>
            {title}
          </h2>
        </div>

        {reviews.length === 0 ? (
          <div className="dv2-reviews__empty" data-testid="demo-v2-reviews-empty">
            <p>{emptyLine1}</p>
            <p>{emptyLine2}</p>
          </div>
        ) : (
          <div className="dv2-reviews__grid">
            {reviews.map((r) => (
              <article
                key={r.id}
                className="dv2-reviews__card"
                data-testid="demo-v2-review-card"
              >
                <div className="dv2-reviews__meta">
                  <strong>{r.userName}</strong>
                  <Stars rating={r.rating} />
                </div>
                <p className="dv2-reviews__comment">
                  {r.comment?.trim() || "Khách hàng đã đánh giá sản phẩm."}
                </p>
                <Link
                  href={`/san-pham/${r.productSlug}`}
                  className="dv2-reviews__product"
                >
                  {r.productName}
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

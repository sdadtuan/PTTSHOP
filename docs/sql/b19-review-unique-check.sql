-- Chỉ đọc. Chạy TRƯỚC migration 20261127220000_review_media.
-- PostgreSQL trên máy chủ là 18.6.
-- Có dòng trả về thì DỪNG, không migrate. Unique mới là (orderId, productId);
-- các dòng orderId NULL không tính là vi phạm vì PostgreSQL coi NULL là khác nhau.

SELECT "orderId", "productId", COUNT(*) AS copies
FROM "Review"
WHERE "orderId" IS NOT NULL
GROUP BY "orderId", "productId"
HAVING COUNT(*) > 1;

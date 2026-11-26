import type { NextConfig } from "next";

// HTML public: bỏ no-store để trình duyệt đưa trang vào back/forward cache.
// Vẫn private + max-age=0: không cache chung (phiên đăng nhập, xem nháp CMS)
// và không giữ giá/tồn lâu. Trang cá nhân giữ no-store.
const PUBLIC_HTML_CACHE = "private, no-cache, max-age=0";
const PRIVATE_HTML_CACHE = "private, no-cache, no-store, max-age=0, must-revalidate";
// 180 ngày. Không preload: chưa chứng minh mọi subdomain chỉ có HTTPS.
const HSTS = "max-age=15552000";

const PUBLIC_PAGES = [
  "/",
  "/san-pham",
  "/san-pham/:slug",
  "/ve-chung-toi",
  "/tin-tuc",
  "/danh-gia",
  "/tuyen-dung",
  "/bo-suu-tap",
  "/lien-he",
  "/ho-tro/:slug",
  "/chinh-sach/:slug",
  "/chinh-sach-bao-mat",
  "/chinh-sach-doi-tra",
  "/chinh-sach-giao-hang",
  "/chinh-sach-thanh-toan",
  "/dieu-khoan",
  "/khieu-nai",
  "/huong-dan-chon-size",
];

const PRIVATE_PAGES = [
  "/gio-hang",
  "/thanh-toan",
  "/tai-khoan",
  "/tai-khoan/:path*",
  "/dat-hang-thanh-cong",
  "/dang-nhap",
  "/dang-ky",
  "/admin",
  "/admin/:path*",
  "/api/:path*",
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      ...PUBLIC_PAGES.map((source) => ({
        source,
        headers: [{ key: "Cache-Control", value: PUBLIC_HTML_CACHE }],
      })),
      ...PRIVATE_PAGES.map((source) => ({
        source,
        headers: [{ key: "Cache-Control", value: PRIVATE_HTML_CACHE }],
      })),
      {
        source: "/:path*",
        has: [{ type: "header" as const, key: "x-forwarded-proto", value: "https" }],
        headers: [{ key: "Strict-Transport-Security", value: HSTS }],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "cdn.vietqr.io",
      },
    ],
    // Next.js 16 only allows listed qualities on next/image
    formats: ["image/avif", "image/webp"],
    qualities: [75, 85, 90],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 2400, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const n = await prisma.heroBanner.count();
if (n === 0) {
  await prisma.heroBanner.create({
    data: {
      imageUrl: "/images/home-v2/hero-main.jpg",
      title: "Mặc Đơn Giản",
      subtitle: "Vẫn Nổi Bật",
      ctaLabel: "Xem sản phẩm",
      ctaHref: "/san-pham",
      focalPoint: "50% 20%",
      gridCols: 2,
      gridRows: 3,
      sortOrder: 1,
      isActive: true,
    },
  });
  console.log("seeded default HeroBanner");
} else {
  console.log("HeroBanner count", n);
}
await prisma.$disconnect();

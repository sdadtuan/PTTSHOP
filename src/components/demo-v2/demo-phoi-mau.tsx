import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const strips = [
  "/images/home-v2/phoi-mau-1.jpg",
  "/images/home-v2/phoi-mau-4.jpg",
  "/images/home-v2/phoi-mau-6.jpg",
] as const;

export function DemoPhoiMau() {
  return (
    <section className="dv2-section dv2-section--soft" data-testid="demo-v2-phoi-mau">
      <div className="dv2-wrap">
        <div className="dv2-phoi">
          <div className="dv2-phoi__photo">
            <Image
              src="/images/home-v2/phoi-mau-main.jpg"
              alt="Phối đồ VIZFAS"
              fill
              sizes="30vw"
              className="object-cover"
              style={{ objectFit: "cover" }}
            />
          </div>

          <div className="dv2-phoi__copy">
            <h2>
              Phối Màu
              <br />
              <em>Tạo Chất</em>
            </h2>
            <p>Gợi ý outfit thời thượng cùng VIZFAS</p>
            <Link href="/bo-suu-tap" className="dv2-cta">
              Xem Gợi Ý Phối Đồ
              <ArrowRight />
            </Link>
          </div>

          <div className="dv2-phoi__strips" aria-hidden>
            {strips.map((src) => (
              <div key={src} className="dv2-strip">
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="120px"
                  className="object-cover"
                  style={{ objectFit: "cover" }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

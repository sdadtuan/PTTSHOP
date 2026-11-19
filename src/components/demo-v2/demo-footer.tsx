import Link from "next/link";

export function DemoFooter() {
  return (
    <footer className="dv2-footer" data-testid="demo-v2-footer">
      <div className="dv2-wrap">
        <div className="dv2-footer__grid">
          <div>
            <div className="dv2-footer__brand">VIZFAS</div>
            <p>
              Streetwear hiện đại cho phong cách của riêng bạn. Chất liệu bền,
              form dễ mặc mỗi ngày.
            </p>
          </div>
          <div>
            <h4>Cửa hàng</h4>
            <ul>
              <li>
                <Link href="/san-pham">Sản phẩm</Link>
              </li>
              <li>
                <Link href="/bo-suu-tap">Bộ sưu tập</Link>
              </li>
              <li>
                <Link href="/san-pham?new=1">Hàng mới</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4>Hỗ trợ</h4>
            <ul>
              <li>
                <Link href="/lien-he">Liên hệ</Link>
              </li>
              <li>
                <Link href="/ho-tro/doi-tra">Đổi trả</Link>
              </li>
              <li>
                <Link href="/chinh-sach/bao-mat">Chính sách</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4>VIZFAS</h4>
            <ul>
              <li>
                <Link href="/ve-chung-toi">Về chúng tôi</Link>
              </li>
              <li>
                <Link href="/">Homepage A</Link>
              </li>
              <li>
                <Link href="/demo-v2">Homepage B</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="dv2-footer__bottom">
          <span>© {new Date().getFullYear()} VIZFAS. Demo V2 — noindex.</span>
          <span>Orange · Black · White</span>
        </div>
      </div>
    </footer>
  );
}

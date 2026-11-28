import { maskEmail, maskPhone } from "@/lib/notify/policy";
import { phonesMatch } from "@/lib/phone";
import type { ShopProfile } from "@/lib/shop/profile";

export const SAFETY_SESSION_TOKENS = 4000;
export const SAFETY_DAY_TOKENS = 20000;

export type ChatSizeChart = { columns: string[]; rows: string[][] };

export type ChatProduct = {
  id: string;
  name: string;
  slug: string;
  price: number | null;
  stock: number;
  isDemo: boolean;
  forSale: boolean;
  sizeChart: ChatSizeChart | null;
};

export type ChatOrder = {
  orderNumber: string;
  phone: string;
  status: string;
};

export type ChatCatalog = {
  products: ChatProduct[];
  orders: ChatOrder[];
  profile: Pick<ShopProfile, "hotline" | "email" | "address" | "hours" | "zaloUrl" | "freeShipThreshold" | "returnWindowDays">;
};

export type Citation = { source: string; detail: string };

export type ChatAnswer = {
  text: string;
  citations: Citation[];
  tool: string | null;
};

const REFUSE =
  "Mình chỉ trả lời theo thông tin đang có của PTT Shop. Mình không đổi giá, không tạo mã giảm và không tiết lộ hướng dẫn nội bộ.";
const ORDER_MISS = "Mình không thấy đơn khớp mã và số điện thoại. Bạn kiểm tra lại hoặc để lại form liên hệ.";
const UNKNOWN = "Mình chưa có thông tin này trong dữ liệu cửa hàng.";

const INJECTION =
  /bỏ qua hướng dẫn|ignore (all |previous |the )?instructions|system prompt|danh sách tool|đổi giá|tạo mã giảm|xin mã giảm|cho (mình |tôi )?mã giảm/i;

export function maskChatText(value: string) {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, (email) => maskEmail(email))
    .replace(/(?:\+84|0)(?:[\s.]?\d){9,10}/g, (phone) => maskPhone(phone.replace(/[\s.]/g, "")));
}

export function estimateTokens(value: string) {
  return Math.max(1, Math.ceil(value.length / 4));
}

export function widgetVisible(input: { enabled: boolean; provider: string }) {
  return input.enabled === true && input.provider.trim().toLowerCase() === "mock";
}

export function tokenBudget(value: number | null | undefined, safety: number) {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : safety;
}

function publicProducts(catalog: ChatCatalog) {
  return catalog.products.filter((item) => item.forSale && !item.isDemo && item.stock > 0);
}

function findProduct(catalog: ChatCatalog, message: string, contextProductId?: string | null) {
  if (contextProductId) {
    const byId = catalog.products.find((item) => item.id === contextProductId);
    if (byId) return byId;
  }
  const folded = message.toLowerCase();
  return catalog.products.find((item) => folded.includes(item.name.toLowerCase()) || folded.includes(item.slug));
}

function money(value: number) {
  return `${value.toLocaleString("vi-VN")}đ`;
}

function policyAnswer(message: string, profile: ChatCatalog["profile"]): ChatAnswer | null {
  const text = message.toLowerCase();
  if (/freeship|miễn phí vận chuyển/.test(text)) {
    if (profile.freeShipThreshold == null) {
      return { text: "PTT Shop chưa công bố ngưỡng miễn phí vận chuyển.", citations: [{ source: "shop", detail: "freeShipThreshold" }], tool: null };
    }
    return {
      text: `Miễn phí vận chuyển từ ${money(profile.freeShipThreshold)}.`,
      citations: [{ source: "shop", detail: `freeShipThreshold=${profile.freeShipThreshold}` }],
      tool: null,
    };
  }
  if (/đổi trả|đổi hàng/.test(text)) {
    if (profile.returnWindowDays == null) {
      return { text: "PTT Shop chưa công bố số ngày đổi trả.", citations: [{ source: "shop", detail: "returnWindowDays" }], tool: null };
    }
    return {
      text: `Đổi hoặc trả trong ${profile.returnWindowDays} ngày kể từ khi nhận nếu còn tem/tag.`,
      citations: [{ source: "shop", detail: `returnWindowDays=${profile.returnWindowDays}` }],
      tool: null,
    };
  }
  return null;
}

function productAnswer(product: ChatProduct | undefined, askStock: boolean): ChatAnswer {
  if (!product || product.isDemo || !product.forSale) {
    return { text: `${UNKNOWN} Mình không nêu giá cho sản phẩm không có trong catalog đang bán.`, citations: [], tool: "get_product" };
  }
  const price = product.price == null ? "chưa có giá" : money(product.price);
  const stock = askStock ? ` Còn ${product.stock} sản phẩm.` : "";
  return {
    text: `${product.name}: ${price}.${stock}`.replace("..", "."),
    citations: [{ source: "product", detail: `${product.slug} price=${product.price ?? "null"} stock=${product.stock}` }],
    tool: "get_product",
  };
}

export function answerChat(input: { message: string; contextProductId?: string | null; catalog: ChatCatalog }): ChatAnswer {
  const message = input.message.trim();
  if (INJECTION.test(message)) return { text: REFUSE, citations: [], tool: null };

  const policy = policyAnswer(message, input.catalog.profile);
  if (policy) return policy;

  if (/đơn|tra cứu|mã đơn|PTT/i.test(message)) {
    const orderNumber = message.match(/PTT[A-Z0-9]+/i)?.[0]?.toUpperCase() ?? "";
    const phone = message.match(/(?:\+84|0)\d{8,10}/)?.[0] ?? "";
    if (!orderNumber || !phone) {
      return { text: "Để tra đơn, bạn gửi cả mã đơn và số điện thoại đặt hàng.", citations: [], tool: "lookup_order" };
    }
    const order = input.catalog.orders.find(
      (item) => item.orderNumber.toUpperCase() === orderNumber && phonesMatch(item.phone, phone),
    );
    if (!order) return { text: ORDER_MISS, citations: [], tool: "lookup_order" };
    return {
      text: `Đơn ${order.orderNumber} đang ở trạng thái ${order.status}.`,
      citations: [{ source: "order", detail: order.orderNumber }],
      tool: "lookup_order",
    };
  }

  if (/size|cao|nặng|số đo/i.test(message)) {
    const product = findProduct(input.catalog, message, input.contextProductId);
    if (!product?.sizeChart || product.sizeChart.rows.length === 0) {
      return {
        text: "Chưa có bảng size cho sản phẩm này, nên mình không đoán số đo.",
        citations: product ? [{ source: "product", detail: `${product.slug} sizeChart=null` }] : [],
        tool: "suggest_size",
      };
    }
    return {
      text: `Đã có bảng size của ${product.name} (cột ${product.sizeChart.columns.join(", ")}), nhưng bảng không ghi chiều cao và cân nặng nên mình không chọn size hộ bạn.`,
      citations: [{ source: "product", detail: `${product.slug} sizeChart` }],
      tool: "suggest_size",
    };
  }

  if (/zalo|gặp người|nhân viên/i.test(message)) {
    if (!input.catalog.profile.zaloUrl) {
      return {
        text: "PTT Shop chưa có liên kết Zalo. Bạn để lại lời nhắn tại form liên hệ /lien-he.",
        citations: [{ source: "shop", detail: "zaloUrl=null" }],
        tool: "handoff_zalo",
      };
    }
    return {
      text: `Bạn có thể nhắn Zalo tại ${input.catalog.profile.zaloUrl}.`,
      citations: [{ source: "shop", detail: "zaloUrl" }],
      tool: "handoff_zalo",
    };
  }

  if (/phối|outfit|mặc cùng/i.test(message)) {
    const self = findProduct(input.catalog, message, input.contextProductId);
    const picks = publicProducts(input.catalog).filter((item) => item.id !== self?.id).slice(0, 3);
    if (picks.length === 0) return { text: UNKNOWN, citations: [], tool: "suggest_outfit" };
    return {
      text: `Có thể phối với ${picks.map((item) => item.name).join(", ")}.`,
      citations: picks.map((item) => ({ source: "product", detail: item.slug })),
      tool: "suggest_outfit",
    };
  }

  if (/giá|bao nhiêu|tồn|còn hàng|còn không/i.test(message)) {
    return productAnswer(findProduct(input.catalog, message, input.contextProductId), /tồn|còn hàng|còn không/i.test(message));
  }

  if (/tìm|search|có gì/i.test(message)) {
    const hits = publicProducts(input.catalog).filter((item) => {
      const q = message.toLowerCase();
      return item.name.toLowerCase().split(" ").some((word) => word.length > 2 && q.includes(word));
    });
    if (hits.length === 0) return { text: UNKNOWN, citations: [], tool: "search_products" };
    const shown = hits.slice(0, 5);
    return {
      text: `Mình thấy ${shown.map((item) => `${item.name} (${item.price == null ? "chưa có giá" : money(item.price)})`).join("; ")}.`,
      citations: shown.map((item) => ({ source: "product", detail: item.slug })),
      tool: "search_products",
    };
  }

  return { text: UNKNOWN, citations: [], tool: null };
}

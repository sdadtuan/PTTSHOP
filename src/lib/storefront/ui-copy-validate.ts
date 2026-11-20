import { z } from "zod";
import { isSafeHref, sanitizePlainText } from "@/lib/cms/validate";
import {
  DEFAULT_STOREFRONT_UI,
  type StorefrontUiCopy,
  type UiCopySectionKey,
} from "@/lib/storefront/ui-copy-types";

const plain = z.string().transform((s) => sanitizePlainText(s));
const maybeUrl = z
  .string()
  .transform((s) => sanitizePlainText(s, 500))
  .refine((v) => !v || isSafeHref(v) || v.startsWith("https://www.google.com/maps"), {
    message: "URL không hợp lệ",
  });

function sectionSchema<T extends z.ZodRawShape>(shape: T) {
  return z.object(shape);
}

const contactSchema = sectionSchema({
  title: plain.pipe(z.string().max(120)),
  intro: plain.pipe(z.string().max(500)),
  showroomLabel: plain.pipe(z.string().max(40)),
  showroomAddress: plain.pipe(z.string().max(300)),
  emailLabel: plain.pipe(z.string().max(40)),
  phoneLabel: plain.pipe(z.string().max(40)),
  hoursLabel: plain.pipe(z.string().max(40)),
  useSiteContactFields: z.boolean(),
  email: plain.pipe(z.string().max(200)),
  phone: plain.pipe(z.string().max(80)),
  hours: plain.pipe(z.string().max(120)),
  mapEmbedUrl: maybeUrl,
  formHeading: plain.pipe(z.string().max(200)),
  formNamePlaceholder: plain.pipe(z.string().max(80)),
  formEmailPlaceholder: plain.pipe(z.string().max(80)),
  formMessagePlaceholder: plain.pipe(z.string().max(80)),
  submitLabel: plain.pipe(z.string().max(40)),
  demoSubmitAlert: plain.pipe(z.string().max(300)),
});

const short = (max = 120) => plain.pipe(z.string().max(max));

const storefrontUiSchema = z.object({
  contact: contactSchema,
  products: sectionSchema({
    title: short(),
    countSuffix: short(80),
    sortLabel: short(40),
    emptyMessage: short(200),
    filterAll: short(40),
    filterMen: short(40),
    filterWomen: short(40),
    filterNew: short(40),
    pagePrev: short(20),
    pageNext: short(20),
    pageOf: short(20),
  }),
  collections: sectionSchema({
    title: short(),
    subtitle: short(200),
    cardEyebrow: short(40),
  }),
  cart: sectionSchema({
    title: short(),
    loading: short(80),
    emptyTitle: short(120),
    emptyBody: short(300),
    emptyCta: short(80),
    summaryTitle: short(80),
    subtotalLabel: short(40),
    shippingLabel: short(40),
    shippingFree: short(40),
    totalLabel: short(40),
    shippingNote: short(200),
    checkoutCta: short(40),
  }),
  checkout: sectionSchema({
    title: short(),
    emptyTitle: short(200),
    emptyCta: short(80),
    shippingSectionTitle: short(80),
    paymentSectionTitle: short(80),
    paymentCod: short(120),
    paymentBank: short(120),
    orderSummaryTitle: short(80),
    couponPlaceholder: short(80),
    couponApply: short(40),
    submitLabel: short(40),
    submitLoading: short(80),
    fieldName: short(40),
    fieldPhone: short(40),
    fieldEmail: short(40),
    fieldAddress: short(40),
    fieldNote: short(40),
  }),
  orderSuccess: sectionSchema({
    eyebrow: short(40),
    title: short(120),
    orderLabel: short(40),
    body: short(300),
    ctaShop: short(40),
    ctaHome: short(40),
  }),
  wishlist: sectionSchema({
    title: short(),
    loading: short(80),
    emptyBody: short(300),
    emptyCta: short(80),
    guestHint: short(200),
    guestLoginLink: short(40),
    removeLabel: short(20),
  }),
  account: sectionSchema({
    title: short(),
    greeting: short(40),
    cardOrders: short(40),
    cardAddresses: short(40),
    cardWishlist: short(40),
    cardWishlistHint: short(80),
    recentOrdersTitle: short(80),
    recentOrdersLink: short(40),
    noOrders: short(200),
  }),
  orders: sectionSchema({
    breadcrumbAccount: short(40),
    breadcrumbCurrent: short(40),
    title: short(),
    empty: short(200),
    emptyCta: short(40),
  }),
  auth: sectionSchema({
    loginTitle: short(),
    loginDemoHint: short(300),
    loginAdminWarning: short(300),
    loginSubmit: short(40),
    loginSubmitLoading: short(80),
    loginHydrateWait: short(120),
    loginNoAccount: short(80),
    loginRegisterLink: short(40),
    loginForgotLink: short(40),
    loginHomeLink: short(40),
    registerTitle: short(),
    registerSubtitle: short(200),
    registerSubmit: short(40),
    registerSubmitLoading: short(80),
    registerHasAccount: short(80),
    registerLoginLink: short(40),
    forgotTitle: short(),
    forgotSubtitle: short(200),
    forgotSubmit: short(40),
    forgotSubmitLoading: short(80),
    forgotBackLogin: short(80),
  }),
  pdp: sectionSchema({
    colorLabel: short(40),
    sizeLabel: short(40),
    sizeChartLink: short(40),
    addToCart: short(80),
    addedToCart: short(80),
    stockAvailable: short(160),
    stockOut: short(120),
    stockNone: short(80),
  }),
});

export function parseStorefrontUi(raw: unknown): StorefrontUiCopy {
  const merged = deepMerge(DEFAULT_STOREFRONT_UI, raw);
  return storefrontUiSchema.parse(merged);
}

export function parseStorefrontUiSection<K extends UiCopySectionKey>(
  key: K,
  raw: unknown,
): StorefrontUiCopy[K] {
  const section = storefrontUiSchema.shape[key];
  const merged = { ...DEFAULT_STOREFRONT_UI[key], ...(raw && typeof raw === "object" ? raw : {}) };
  return section.parse(merged) as StorefrontUiCopy[K];
}

function deepMerge<T extends Record<string, unknown>>(base: T, patch: unknown): T {
  if (!patch || typeof patch !== "object") return base;
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(patch as Record<string, unknown>)) {
    if (v && typeof v === "object" && !Array.isArray(v) && k in out && typeof out[k] === "object") {
      out[k] = deepMerge(out[k] as Record<string, unknown>, v);
    } else if (v !== undefined) {
      out[k] = v;
    }
  }
  return out as T;
}
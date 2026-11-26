"use client";

import { useShopProfile } from "@/components/cms/shop-profile-context";
import { useStorefrontUi } from "@/components/cms/storefront-layout-context";
import { contactRows } from "@/lib/shop/profile";

export default function ContactPage() {
  const ui = useStorefrontUi().contact;
  const shop = useShopProfile();
  const rows = contactRows(shop, {
    address: ui.showroomLabel,
    email: ui.emailLabel,
    phone: ui.phoneLabel,
    hours: ui.hoursLabel,
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <h1 className="type-title text-3xl font-extrabold md:text-4xl">{ui.title}</h1>
      <p className="mt-3 text-sm text-neutral-600">{ui.intro}</p>
      {rows.length ? (
        <div className="mt-8 space-y-4 border border-neutral-100 bg-white p-6 text-sm text-neutral-700">
          {rows.map((row) => (
            <p key={row.key}>
              <strong>{row.label}</strong>{" "}
              {row.href ? (
                <a href={row.href} className="text-[var(--accent)]" target={row.href.startsWith("http") ? "_blank" : undefined} rel={row.href.startsWith("http") ? "noopener noreferrer" : undefined}>
                  {row.value}
                </a>
              ) : (
                row.value
              )}
            </p>
          ))}
        </div>
      ) : null}
      {ui.mapEmbedUrl ? (
        <div className="mt-6 aspect-video w-full overflow-hidden border border-neutral-100">
          <iframe
            title="Bản đồ"
            src={ui.mapEmbedUrl}
            className="h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      ) : null}
      <form
        className="mt-8 grid gap-3 border border-neutral-100 bg-white p-6"
        onSubmit={(e) => {
          e.preventDefault();
          alert(ui.demoSubmitAlert);
        }}
      >
        <p className="text-sm font-semibold">{ui.formHeading}</p>
        <input required placeholder={ui.formNamePlaceholder} className="rounded border px-3 py-2 text-sm" />
        <input required type="email" placeholder={ui.formEmailPlaceholder} className="rounded border px-3 py-2 text-sm" />
        <textarea required rows={4} placeholder={ui.formMessagePlaceholder} className="rounded border px-3 py-2 text-sm" />
        <button type="submit" className="rounded bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white">
          {ui.submitLabel}
        </button>
      </form>
    </div>
  );
}

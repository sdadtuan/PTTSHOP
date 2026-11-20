"use client";

import { useSiteBrand } from "@/components/cms/site-brand-context";
import { useStorefrontUi } from "@/components/cms/storefront-layout-context";

export default function ContactPage() {
  const ui = useStorefrontUi().contact;
  const brand = useSiteBrand();
  const email = ui.useSiteContactFields ? brand.contactEmail : ui.email;
  const phone = ui.useSiteContactFields ? brand.contactPhone : ui.phone;
  const hours = ui.useSiteContactFields ? brand.contactHours : ui.hours;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <h1 className="type-title text-3xl font-extrabold md:text-4xl">{ui.title}</h1>
      <p className="mt-3 text-sm text-neutral-600">{ui.intro}</p>
      <div className="mt-8 space-y-4 border border-neutral-100 bg-white p-6 text-sm text-neutral-700">
        <p>
          <strong>{ui.showroomLabel}</strong> {ui.showroomAddress}
        </p>
        <p>
          <strong>{ui.emailLabel}</strong>{" "}
          <a href={`mailto:${email}`} className="text-[var(--accent)]">
            {email}
          </a>
        </p>
        <p>
          <strong>{ui.phoneLabel}</strong>{" "}
          <a href={`tel:${phone.replace(/\s/g, "")}`} className="text-[var(--accent)]">
            {phone}
          </a>
        </p>
        <p>
          <strong>{ui.hoursLabel}</strong> {hours}
        </p>
      </div>
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
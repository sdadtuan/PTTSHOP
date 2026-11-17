import { MessageCircle, Phone } from "lucide-react";

const items = [
  {
    href: "https://zalo.me/0901234567",
    label: "Zalo",
    className: "bg-[#0068FF] text-white",
    icon: <span className="text-[10px] font-bold tracking-tight">Zalo</span>,
  },
  {
    href: "https://m.me/vizfas",
    label: "Messenger",
    className: "bg-[#0084FF] text-white",
    icon: <MessageCircle className="h-4 w-4" />,
  },
  {
    href: "tel:0901234567",
    label: "Gọi điện",
    className: "bg-[var(--accent)] text-white",
    icon: <Phone className="h-4 w-4" />,
  },
];

export function FloatingSocial() {
  return (
    <div
      className="pointer-events-none fixed right-3 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 flex flex-col gap-2 md:right-5 md:bottom-6"
      aria-label="Liên hệ nhanh"
    >
      {items.map((item) => (
        <a
          key={item.label}
          href={item.href}
          target={item.href.startsWith("tel:") ? undefined : "_blank"}
          rel={item.href.startsWith("tel:") ? undefined : "noopener noreferrer"}
          aria-label={item.label}
          className={`pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition hover:scale-105 md:h-11 md:w-11 ${item.className}`}
        >
          {item.icon}
        </a>
      ))}
    </div>
  );
}

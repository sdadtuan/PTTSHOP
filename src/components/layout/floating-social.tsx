import { MessageCircle, Phone } from "lucide-react";

const items = [
  {
    href: "https://zalo.me/0901234567",
    label: "Zalo",
    className: "bg-[#0068FF] text-white",
    icon: (
      <span className="text-[11px] font-bold tracking-tight">Zalo</span>
    ),
  },
  {
    href: "https://m.me/vizfas",
    label: "Messenger",
    className: "bg-[#0084FF] text-white",
    icon: <MessageCircle className="h-5 w-5" />,
  },
  {
    href: "tel:0901234567",
    label: "Gọi điện",
    className: "bg-[var(--accent)] text-white",
    icon: <Phone className="h-5 w-5" />,
  },
];

export function FloatingSocial() {
  return (
    <div className="fixed right-3 bottom-24 z-40 flex flex-col gap-2 md:right-5 md:bottom-8">
      {items.map((item) => (
        <a
          key={item.label}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={item.label}
          className={`flex h-11 w-11 items-center justify-center rounded-full shadow-lg transition hover:scale-105 ${item.className}`}
        >
          {item.icon}
        </a>
      ))}
    </div>
  );
}

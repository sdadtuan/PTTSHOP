"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { parseSearchQuery, searchPath } from "@/lib/search/parse";

type SuggestItem = { name?: string; label?: string; href: string; slug?: string };
type SuggestResponse = {
  products?: SuggestItem[];
  categories?: SuggestItem[];
  phrases?: SuggestItem[];
};

const DEBOUNCE_MS = 250;

export function SearchBox({
  value,
  onChange,
  onSubmit,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
}) {
  const router = useRouter();
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [data, setData] = useState<SuggestResponse>({});
  const abortRef = useRef<AbortController | null>(null);

  const options = [
    ...(data.phrases ?? []).map((item) => ({ ...item, group: "Câu gợi ý", name: item.label })),
    ...(data.categories ?? []).map((item) => ({ ...item, group: "Danh mục" })),
    ...(data.products ?? []).map((item) => ({ ...item, group: "Sản phẩm" })),
  ];

  useEffect(() => {
    const term = value.trim();
    if (term.length < 2) {
      abortRef.current?.abort();
      return;
    }
    const timer = window.setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      fetch(`/api/search/suggest?q=${encodeURIComponent(term.slice(0, 100))}&limit=8`, {
        signal: controller.signal,
        cache: "no-store",
      })
        .then((res) => (res.ok ? res.json() : { products: [], categories: [], phrases: [] }))
        .then((body: SuggestResponse) => {
          if (controller.signal.aborted) return;
          setData(body);
          setOpen(true);
          setActive(-1);
        })
        .catch(() => {
          if (!controller.signal.aborted) setData({});
        });
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [value]);

  function go(href: string, slug?: string) {
    if (slug && value.trim()) {
      void fetch("/api/search/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: value.slice(0, 100), targetSlug: slug }),
      }).catch(() => undefined);
    }
    onSubmit();
    router.push(href);
  }

  function submit() {
    const parsed = parseSearchQuery(value);
    onSubmit();
    router.push(value.trim() ? searchPath(value, parsed) : "/san-pham");
  }

  return (
    <div className="relative min-w-0 flex-1">
      <input
        name="q"
        role="combobox"
        aria-label="Tìm sản phẩm"
        aria-autocomplete="list"
        aria-expanded={open && options.length > 0}
        aria-controls={listId}
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        value={value}
        placeholder={placeholder}
        autoFocus
        className="w-full rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-neutral-900"
        onChange={(event) => {
          const next = event.target.value;
          onChange(next);
          if (next.trim().length < 2) {
            abortRef.current?.abort();
            setData({});
            setOpen(false);
            setActive(-1);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && options.length) {
            event.preventDefault();
            setOpen(true);
            setActive((current) => (current + 1) % options.length);
          } else if (event.key === "ArrowUp" && options.length) {
            event.preventDefault();
            setActive((current) => (current <= 0 ? options.length - 1 : current - 1));
          } else if (event.key === "Escape") {
            setOpen(false);
            setActive(-1);
          } else if (event.key === "Enter") {
            event.preventDefault();
            if (active >= 0 && options[active]) go(options[active].href, options[active].slug);
            else submit();
          }
        }}
        onFocus={() => {
          if (options.length) setOpen(true);
        }}
      />
      {open && options.length > 0 ? (
        <ul id={listId} role="listbox" aria-label="Gợi ý tìm kiếm" className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-neutral-200 bg-white py-1 shadow-lg">
          {options.map((option, index) => (
            <li key={`${option.group}-${option.href}-${index}`} role="presentation">
              <button
                id={`${listId}-${index}`}
                role="option"
                type="button"
                aria-selected={active === index}
                className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm ${active === index ? "bg-neutral-100" : ""}`}
                onMouseEnter={() => setActive(index)}
                onClick={() => go(option.href, option.slug)}
              >
                <span>{option.name}</span>
                <span className="text-xs text-neutral-400">{option.group}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

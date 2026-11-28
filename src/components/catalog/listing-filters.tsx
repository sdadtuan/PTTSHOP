type FilterFields = {
  q?: string;
  sort?: string;
  category?: string;
  gender?: string;
  collection?: string;
  new?: string;
  color?: string;
  size?: string;
  priceMin?: string;
  priceMax?: string;
  sale?: string;
};

export function ListingFilters({
  values,
  colors,
  sizes,
}: {
  values: FilterFields;
  colors: string[];
  sizes: string[];
}) {
  const hidden = (["q", "sort", "category", "gender", "collection", "new"] as const).filter((key) => values[key]);
  return (
    <details open className="mb-6 rounded-lg border border-neutral-200 bg-white md:contents">
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium md:hidden">Bộ lọc</summary>
      <form action="/san-pham" className="grid gap-3 p-4 md:mb-6 md:grid-cols-6 md:rounded-lg md:border md:border-neutral-200 md:bg-white">
        {hidden.map((key) => (
          <input key={key} type="hidden" name={key} value={values[key]} />
        ))}
        <label className="text-xs text-neutral-600">
          Giá từ
          <input name="priceMin" inputMode="numeric" defaultValue={values.priceMin || ""} className="mt-1 w-full rounded border border-neutral-200 px-2 py-2 text-sm" />
        </label>
        <label className="text-xs text-neutral-600">
          Đến
          <input name="priceMax" inputMode="numeric" defaultValue={values.priceMax || ""} className="mt-1 w-full rounded border border-neutral-200 px-2 py-2 text-sm" />
        </label>
        <label className="text-xs text-neutral-600">
          Màu
          <select name="color" defaultValue={values.color || ""} className="mt-1 w-full rounded border border-neutral-200 px-2 py-2 text-sm">
            <option value="">Tất cả</option>
            {colors.map((color) => (
              <option key={color} value={color}>{color}</option>
            ))}
          </select>
        </label>
        <label className="text-xs text-neutral-600">
          Size
          <select name="size" defaultValue={values.size || ""} className="mt-1 w-full rounded border border-neutral-200 px-2 py-2 text-sm">
            <option value="">Tất cả</option>
            {sizes.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </label>
        <label className="flex items-end gap-2 pb-2 text-sm text-neutral-700">
          <input type="checkbox" name="sale" value="1" defaultChecked={values.sale === "1"} />
          Đang giảm
        </label>
        <button type="submit" className="self-end rounded bg-neutral-900 px-3 py-2 text-sm text-white">Lọc</button>
      </form>
    </details>
  );
}

/**
 * Large stacked “PHỐI / MÀU / TẠO / CHẤT” — bold orange 4 lines (mock v2).
 */
export function PhoiMauType() {
  return (
    <div
      className="font-[family-name:var(--font-display)] text-5xl leading-[0.9] font-black tracking-tight text-[var(--accent)] select-none sm:text-6xl md:text-7xl lg:text-[5.5rem]"
      aria-hidden
    >
      <span className="block">PHỐI</span>
      <span className="mt-1 block">MÀU</span>
      <span className="mt-1 block">TẠO</span>
      <span className="mt-1 block">CHẤT</span>
    </div>
  );
}

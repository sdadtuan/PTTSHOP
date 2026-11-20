"use client";

import { useCallback, useState } from "react";
import type { SlugifyOptions } from "@/lib/slug";
import {
  EMPTY_AUTO_SLUG,
  autoSlugOnNameChange,
  autoSlugOnSlugBlur,
  autoSlugOnSlugChange,
  autoSlugStateForEdit,
  slugFromDisplayName,
  type AutoSlugFieldState,
} from "@/lib/auto-slug-field";

export function useAutoSlugField(opts?: SlugifyOptions) {
  const [state, setState] = useState<AutoSlugFieldState>(EMPTY_AUTO_SLUG);

  const setName = useCallback(
    (name: string) => setState((s) => autoSlugOnNameChange(s, name, opts)),
    [opts],
  );

  const setSlug = useCallback(
    (raw: string) => setState((s) => autoSlugOnSlugChange(s, raw, opts)),
    [opts],
  );

  const onSlugBlur = useCallback(() => setState((s) => autoSlugOnSlugBlur(s, opts)), [opts]);

  const reset = useCallback(
    (init?: { name?: string; slug?: string; preserveSlug?: boolean }) => {
      const name = init?.name ?? "";
      const slug = init?.slug ?? "";
      if (init?.preserveSlug) setState(autoSlugStateForEdit(name, slug));
      else setState({ name, slug: slugFromDisplayName(name, opts), slugManual: false });
    },
    [opts],
  );

  return {
    name: state.name,
    slug: state.slug,
    slugManual: state.slugManual,
    setName,
    setSlug,
    onSlugBlur,
    reset,
  };
}
import { slugify, type SlugifyOptions } from "@/lib/slug";

/** Slug shown in admin while typing a display name (empty name → empty slug). */
export function slugFromDisplayName(name: string, opts?: SlugifyOptions): string {
  return name.trim() ? slugify(name, opts) : "";
}

export type AutoSlugFieldState = {
  name: string;
  slug: string;
  /** User edited slug; cleared slug resumes auto from name. */
  slugManual: boolean;
};

export function autoSlugOnNameChange(
  state: AutoSlugFieldState,
  name: string,
  opts?: SlugifyOptions,
): AutoSlugFieldState {
  return {
    name,
    slug: state.slugManual ? state.slug : slugFromDisplayName(name, opts),
    slugManual: state.slugManual,
  };
}

export function autoSlugOnSlugChange(
  state: AutoSlugFieldState,
  raw: string,
  opts?: SlugifyOptions,
): AutoSlugFieldState {
  const sanitized = raw ? slugify(raw, { fallback: "", keepTrailingDash: true, ...opts }) : "";
  if (!sanitized) {
    return {
      name: state.name,
      slug: slugFromDisplayName(state.name, opts),
      slugManual: false,
    };
  }
  return { ...state, slug: sanitized, slugManual: true };
}

export function autoSlugOnSlugBlur(state: AutoSlugFieldState, opts?: SlugifyOptions): AutoSlugFieldState {
  if (!state.slug) return state;
  const slug = slugify(state.slug, { fallback: "", ...opts });
  return slug === state.slug ? state : { ...state, slug };
}

/** Existing record: keep slug when name changes until slug is cleared. */
export function autoSlugStateForEdit(name: string, slug: string): AutoSlugFieldState {
  return { name, slug, slugManual: Boolean(slug) };
}

export const EMPTY_AUTO_SLUG: AutoSlugFieldState = { name: "", slug: "", slugManual: false };
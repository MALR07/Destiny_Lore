const RELEASE_ICON_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function getReleaseIconUrl(slug: string | null | undefined): string | null {
  if (!slug || !RELEASE_ICON_SLUG.test(slug)) return null;
  return `/media/ishtar-releases/release-${slug}.svg`;
}

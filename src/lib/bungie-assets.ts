export function isBungieAsset(value: string | null | undefined): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "www.bungie.net";
  } catch {
    return false;
  }
}

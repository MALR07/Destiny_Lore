import he from "he";

export function decodeHtmlEntities(text: string): string {
  return he.decode(text);
}

export function stripHtmlMarkup(text: string): string {
  return decodeHtmlEntities(text)
    .replace(/<br\s*\/?>/giu, "\n")
    .replace(/<\/(?:p|div|li|h[1-6])\s*>/giu, "\n\n")
    .replace(/<[^>]*>/gu, "")
    .replace(/\n{3,}/gu, "\n\n")
    .trim();
}

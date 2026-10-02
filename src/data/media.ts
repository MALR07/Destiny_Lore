export interface MediaEntry {
  id: string;
  kind: "video" | "image";
  title: string;
  url: string;
  release?: string;
  releaseSlug?: string;
  language?: "es" | "en";
  description?: string;
  credit?: string;
}

export const mediaEntries: MediaEntry[] = [];

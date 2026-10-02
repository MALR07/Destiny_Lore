const BOOK_COVERS: Record<string, string> = {
  "Books of Sorrow": "/media/ishtar-books/books-of-sorrow.png",
  "The Maraid": "/media/ishtar-books/the-maraid.png",
};

export function getLoreBookCover(titleEn: string): string | null {
  return BOOK_COVERS[titleEn] ?? null;
}

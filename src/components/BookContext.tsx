import type { LoreGroup } from "../types/lore";
import { getLoreBookCover } from "../lib/book-covers";

interface BookContextProps {
  group: LoreGroup;
  books: LoreGroup[];
  onOpenBook: (book: LoreGroup) => void;
}

const BOOK_DESCRIPTIONS: Record<string, string> = {
  "Books of Sorrow":
    "Crónica sagrada de la Colmena: cuenta el origen de Aurash, Sathona y Xi Ro, el pacto con los gusanos y la lógica de la espada que lleva a Oryx, Savathûn y Xivu Arath a convertirse en dioses.",
  "The Maraid":
    "Dossier de las cacerías contra la Casa de los Lobos tras la rebelión de Skolas. Sus fichas identifican a los objetivos caídos y sitúan sus persecuciones en la Prisión de los Ancianos y el Arrecife.",
};

const RELATED_BOOKS: Record<string, Array<{ titleEn: string; context: string }>> = {
  "Books of Sorrow": [{
    titleEn: "The Maraid",
    context: "La Casa de los Lobos precede a El Rey de los Poseídos: sus expedientes sitúan la crisis del Arrecife antes de la llegada de Oryx.",
  }],
  "The Maraid": [{
    titleEn: "Books of Sorrow",
    context: "Estos capítulos aportan el trasfondo de la Colmena y de Oryx, cuyo avance desencadena el siguiente gran conflicto de los Despertados.",
  }],
};

function defaultDescription(group: LoreGroup): string {
  const release = group.releaseTitle ?? "el archivo de Bungie";
  const count = group.localEntryCount.toLocaleString("es-ES");
  const preview = group.lorePreview.map(({ title }) => title).filter(Boolean);
  const opening = preview.length > 0
    ? ` La vista previa comienza con ${preview.join(", ")}.`
    : "";
  return `Colección de ${count} relatos oficiales vinculados a ${release}.${opening} Abre cada relato para consultar sus referencias relacionadas.`;
}

export default function BookContext({ group, books, onOpenBook }: BookContextProps) {
  const description = BOOK_DESCRIPTIONS[group.titleEn] ?? defaultDescription(group);
  const bookCover = getLoreBookCover(group.titleEn);
  const relatedBooks = (RELATED_BOOKS[group.titleEn] ?? [])
    .flatMap((relation) => {
      const related = books.find((book) => book.titleEn === relation.titleEn);
      return related ? [{ ...relation, book: related }] : [];
    });

  return (
    <section className="book-context" aria-label="Contexto del libro">
      {(bookCover || group.imageUrl) && (
        <img
          alt=""
          className="book-context-art"
          loading="lazy"
          onError={(event) => { event.currentTarget.hidden = true; }}
          src={bookCover ?? group.imageUrl ?? undefined}
        />
      )}
      <div className="book-context-copy">
        <span className="eyebrow">DE QUÉ TRATA</span>
        <p>{description}</p>
        {relatedBooks.length > 0 && (
          <div className="book-related-list" aria-label="Libros relacionados">
            {relatedBooks.map(({ book, context }) => (
              <button
                className="book-related-link"
                key={book.id}
                onClick={() => onOpenBook(book)}
                type="button"
              >
                <strong>{book.title}</strong>
                <span>{context}</span>
                <i aria-hidden="true">↗</i>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

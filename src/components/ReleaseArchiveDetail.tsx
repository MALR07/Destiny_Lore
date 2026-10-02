import { useEffect, useState } from "react";
import { getCatalog, getLore } from "../lib/api";
import { describeTimelineRelease } from "../data/guardian-timeline";
import { mediaEntries } from "../data/media";
import type { CatalogCategory, CatalogEntry, CatalogPage, LoreGroup, LorePage } from "../types/lore";
import { isBungieAsset } from "../lib/bungie-assets";
import MediaArchive from "./MediaArchive";
import LoreCard from "./LoreCard";
import EquipmentTile from "./EquipmentTile";

interface ReleaseArchiveDetailProps {
  group: LoreGroup;
  search: string;
  onOpenLore: (id: string) => void;
  onOpenCatalog: (entry: CatalogEntry) => void;
}

type ReleaseSection = "equipment" | "lore";
type EquipmentCategory = "all" | "weapons" | "armor" | "objects";

const EQUIPMENT_CATEGORIES: Array<[EquipmentCategory, string]> = [
  ["all", "TODO"],
  ["weapons", "ARMAS"],
  ["armor", "ARMADURAS"],
  ["objects", "OTROS OBJETOS"],
];
const CLASSES = [
  ["all", "TODAS"],
  ["0", "TITÁN"],
  ["1", "CAZADOR"],
  ["2", "HECHICERO"],
] as const;

export default function ReleaseArchiveDetail({
  group,
  search,
  onOpenLore,
  onOpenCatalog,
}: ReleaseArchiveDetailProps) {
  const rarities = ["Excepcional", "Leyenda", "Peculiar", "Poco común", "Común"];
  const [section, setSection] = useState<ReleaseSection>("equipment");
  const [equipmentCategory, setEquipmentCategory] = useState<EquipmentCategory>("all");
  const [rarity, setRarity] = useState("");
  const [classType, setClassType] = useState("all");
  const [catalogPage, setCatalogPage] = useState(1);
  const [lorePage, setLorePage] = useState(1);
  const [catalogResult, setCatalogResult] = useState<CatalogPage | null>(null);
  const [loreResult, setLoreResult] = useState<LorePage | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [loreLoading, setLoreLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [loreError, setLoreError] = useState<string | null>(null);

  const category: CatalogCategory = equipmentCategory;
  const numericClassType = classType === "all" ? null : Number(classType);

  useEffect(() => {
    const controller = new AbortController();
    setCatalogLoading(true);
    setCatalogError(null);
    setCatalogResult(null);
    if (!group.releaseSlug) {
      setCatalogError("Este lanzamiento todavía no tiene una clasificación editorial de items.");
      setCatalogLoading(false);
      return () => controller.abort();
    }
    getCatalog(search, catalogPage, "all", category, controller.signal, {
      releaseSlug: group.releaseSlug,
      rarity,
      classType: numericClassType,
    })
      .then(setCatalogResult)
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setCatalogError(reason instanceof Error ? reason.message : "No se pudieron cargar los items.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setCatalogLoading(false);
      });
    return () => controller.abort();
  }, [category, catalogPage, group.releaseSlug, numericClassType, rarity, search]);

  useEffect(() => {
    const controller = new AbortController();
    setLoreLoading(true);
    setLoreError(null);
    setLoreResult(null);
    getLore(search, lorePage, false, "all", controller.signal, group.id)
      .then(setLoreResult)
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setLoreError(reason instanceof Error ? reason.message : "No se pudieron cargar los relatos.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoreLoading(false);
      });
    return () => controller.abort();
  }, [group.id, lorePage, search]);

  useEffect(() => {
    setCatalogPage(1);
    setLorePage(1);
  }, [search]);

  function setEquipmentFilter(next: {
    category?: EquipmentCategory;
    rarity?: string;
    classType?: string;
  }) {
    setCatalogPage(1);
    if (next.category !== undefined) {
      setEquipmentCategory(next.category);
      setClassType("all");
      setRarity("");
    }
    if (next.rarity !== undefined) setRarity(next.rarity);
    if (next.classType !== undefined) {
      setClassType(next.classType);
      if (next.classType !== "all") {
        setEquipmentCategory("armor");
        setRarity("");
      }
    }
  }

  const activeLoading = section === "equipment" ? catalogLoading : loreLoading;
  const activeError = section === "equipment" ? catalogError : loreError;
  const activeResult = section === "equipment" ? catalogResult : loreResult;
  const releaseVideos = mediaEntries.filter((entry) =>
    entry.kind === "video" && entry.releaseSlug === group.releaseSlug,
  );
  const releaseArtwork = group.releaseImageKind === "artwork" && isBungieAsset(group.releaseImageUrl)
    ? group.releaseImageUrl
    : null;

  return (
    <section className="release-detail" aria-label={`Archivo de ${group.title}`}>
      <header className="release-overview">
        <div className={`release-overview-art${releaseArtwork ? "" : " release-overview-art-empty"}`}>
          {releaseArtwork ? (
            <img
              alt=""
              onError={(event) => { event.currentTarget.hidden = true; }}
              src={releaseArtwork}
            />
          ) : (
            <span>ARTE DE LA EXPANSIÓN<br />PENDIENTE</span>
          )}
          {releaseArtwork && <small>ILUSTRACIÓN DEL MANIFIESTO · BUNGIE</small>}
        </div>
        <div className="release-overview-copy">
          <span className="eyebrow">
            {group.sourceGame === "destiny1" ? "DESTINY · LANZAMIENTO" : "DESTINY 2 · LANZAMIENTO"}
          </span>
          <h3>{group.title}</h3>
          {group.titleEn !== group.title && <p className="release-overview-original">{group.titleEn}</p>}
          <p className="release-overview-description">
            {describeTimelineRelease(group.releaseSlug, group.title)}
          </p>
          <p className="release-date">
            {`${(group.catalogItemCount ?? 0).toLocaleString("es-ES")} ITEMS · ${group.localEntryCount.toLocaleString("es-ES")} RELATOS`}
          </p>
          {group.releaseSlug && (
            <a
              className="release-classification-source"
              href={`https://www.ishtar-collective.net/releases/${group.releaseSlug}/items`}
              rel="noreferrer"
              target="_blank"
            >
              VER CLASIFICACIÓN DE ITEMS EN ISHTAR ↗
            </a>
          )}
        </div>
      </header>

      <section className="release-media-section" aria-labelledby="release-media-title">
        <div className="release-media-heading">
          <span className="eyebrow">TRÁILERS · CINEMÁTICAS · INCURSIÓN</span>
          <h3 id="release-media-title">Vívelo en vídeo</h3>
          <p>Material audiovisual asociado a este lanzamiento.</p>
        </div>
        {group.releaseSlug === "the-dark-below" && <CrotaSpotlight />}
        {releaseVideos.length > 0 ? (
          <MediaArchive entries={releaseVideos} search="" />
        ) : group.releaseSlug !== "the-dark-below" ? (
          <div className="release-media-empty">
            <span aria-hidden="true">▶</span>
            <div>
              <strong>Vídeos de este lanzamiento pendientes</strong>
              <p>Cuando estén seleccionados, se añadirán a <code>src/data/media.ts</code> con este lanzamiento.</p>
            </div>
          </div>
        ) : null}
      </section>

      <section className="release-contents" aria-labelledby="release-contents-title">
        <div className="release-contents-heading">
          <span className="eyebrow">ARCHIVO DE LA EXPANSIÓN</span>
          <h3 id="release-contents-title">Qué incluye</h3>
          <p>Equipo, objetos y relatos asociados a este lanzamiento; el contenido se consulta debajo de esta ficha.</p>
        </div>
        <nav className="release-detail-tabs" aria-label="Contenido del lanzamiento">
          <button
            aria-pressed={section === "equipment"}
            className={section === "equipment" ? "filter-active" : ""}
            onClick={() => setSection("equipment")}
            type="button"
          >
            ITEMS DEL JUEGO <span>{(group.catalogItemCount ?? 0).toLocaleString("es-ES")}</span>
          </button>
          <button
            aria-pressed={section === "lore"}
            className={section === "lore" ? "filter-active" : ""}
            onClick={() => setSection("lore")}
            type="button"
          >
            RELATOS Y GRIMORIO <span>{group.localEntryCount.toLocaleString("es-ES")}</span>
          </button>
        </nav>

        {section === "equipment" && (
          <div className="release-equipment-filters">
            <div className="archive-filters" aria-label="Tipo de item">
              {EQUIPMENT_CATEGORIES.map(([value, label]) => (
                <button
                  aria-pressed={equipmentCategory === value}
                  className={equipmentCategory === value ? "filter-active" : ""}
                  key={value}
                  onClick={() => setEquipmentFilter({ category: value })}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
            {(equipmentCategory === "all" || equipmentCategory === "weapons" || equipmentCategory === "armor" || equipmentCategory === "objects") && (
              <div className="archive-filters" aria-label="Rareza">
                <button
                  aria-pressed={!rarity}
                  className={!rarity ? "filter-active" : ""}
                  onClick={() => setEquipmentFilter({ rarity: "" })}
                  type="button"
                >
                  TODAS LAS RAREZAS
                </button>
                {rarities.map((value) => (
                  <button
                    aria-pressed={rarity === value}
                    className={rarity === value ? "filter-active" : ""}
                    key={value}
                    onClick={() => setEquipmentFilter({ rarity: value })}
                    type="button"
                  >
                    {value.toLocaleUpperCase("es")}
                  </button>
                ))}
              </div>
            )}
            {(equipmentCategory === "all" || equipmentCategory === "armor") && (
              <div className="archive-filters" aria-label="Clase de armadura">
                {CLASSES.map(([value, label]) => (
                  <button
                    aria-pressed={classType === value}
                    className={classType === value ? "filter-active" : ""}
                    key={value}
                    onClick={() => setEquipmentFilter({ classType: value })}
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {activeError && <p className="release-detail-message" role="alert">{activeError}</p>}
        {!activeError && !activeLoading && activeResult?.items.length === 0 && (
          <div className="release-detail-message">
            {search
              ? "No hay elementos que coincidan con esta búsqueda y estos filtros."
              : section === "equipment"
                ? "No hay items del manifiesto de Bungie enlazados a este lanzamiento."
                : "El manifiesto de Bungie no tiene relatos vinculados a este lanzamiento."}
          </div>
        )}
        {section === "equipment" ? (
          <div className="equipment-grid">
            {catalogResult?.items.map((entry) => (
              <EquipmentTile entry={entry} key={entry.id} onSelect={onOpenCatalog} />
            ))}
          </div>
        ) : (
          <div className="lore-grid">
            {loreResult?.items.map((entry) => (
              <LoreCard entry={entry} key={entry.id} onSelect={() => onOpenLore(entry.id)} />
            ))}
          </div>
        )}
        {activeResult && activeResult.total > activeResult.limit && (
          <div className="release-document-pagination">
            <button
              disabled={(section === "equipment" ? catalogPage : lorePage) <= 1 || activeLoading}
              onClick={() => section === "equipment"
                ? setCatalogPage((current) => current - 1)
                : setLorePage((current) => current - 1)}
              type="button"
            >
              ← ANTERIOR
            </button>
            <span>
              PÁGINA {section === "equipment" ? catalogPage : lorePage}
              {" / "}{Math.max(1, Math.ceil(activeResult.total / activeResult.limit))}
            </span>
            <button
              disabled={!activeResult.hasMore || activeLoading}
              onClick={() => section === "equipment"
                ? setCatalogPage((current) => current + 1)
                : setLorePage((current) => current + 1)}
              type="button"
            >
              SIGUIENTE →
            </button>
          </div>
        )}
      </section>
    </section>
  );
}

function CrotaSpotlight() {
  const [activeVideo, setActiveVideo] = useState<"trailer" | "raid" | null>(null);
  const videos = {
    trailer: {
      id: "WUEiKU0hkc0",
      title: "Tráiler oficial de La Profunda Oscuridad",
      note: "Tráiler oficial de la expansión, publicado por Bungie.",
    },
    raid: {
      id: "zcGdeHGRxSo",
      title: "El Fin de Crota: incursión completa",
      note: "Recorrido completo de la raid original. Se inicia silenciado; activa el reproductor si quieres verlo.",
    },
  } as const;
  const selectedVideo = activeVideo ? videos[activeVideo] : null;

  return (
    <section className="release-spotlight" aria-labelledby="crota-spotlight-title">
      <div className="release-spotlight-copy">
        <span className="eyebrow">DESTINY · LA PROFUNDA OSCURIDAD</span>
        <h3 id="crota-spotlight-title">La amenaza bajo la Luna</h3>
        <p>Descubre la expansión y luego adéntrate en la incursión de Crota con un recorrido completo.</p>
        <div className="release-spotlight-actions">
          <button
            aria-pressed={activeVideo === "trailer"}
            onClick={() => setActiveVideo(activeVideo === "trailer" ? null : "trailer")}
            type="button"
          >
            VER TRÁILER OFICIAL
          </button>
          <button
            aria-pressed={activeVideo === "raid"}
            onClick={() => setActiveVideo(activeVideo === "raid" ? null : "raid")}
            type="button"
          >
            VER RAID COMPLETA · SIN SONIDO
          </button>
        </div>
      </div>
      {selectedVideo && (
        <div className="release-spotlight-video">
          <iframe
            allow="autoplay; encrypted-media; picture-in-picture"
            loading="lazy"
            src={`https://www.youtube-nocookie.com/embed/${selectedVideo.id}?autoplay=1&mute=1&controls=1&playsinline=1&rel=0`}
            title={selectedVideo.title}
          />
          <p>{selectedVideo.note}</p>
        </div>
      )}
    </section>
  );
}

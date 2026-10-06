# Archivo del Viajero

Archivo en español para explorar Destiny 1 y Destiny 2: lore, equipo, personajes, lugares, lanzamientos, cinemáticas y línea temporal. Incluye búsqueda, fichas localizadas y colecciones de items organizadas por lanzamiento.

## Stack

- **Frontend:** React, TypeScript y Vite.
- **API:** Netlify Functions en Node.js.
- **Datos:** PostgreSQL local o Neon en producción.
- **Fuentes:** Manifiestos oficiales de Destiny 1 y Destiny 2 de Bungie, sincronizados en inglés y español.
- **Desarrollo local:** Docker Compose.
- **Despliegue:** Netlify.

La interfaz prioriza el texto oficial en español de los manifiestos de Destiny 1 y 2. Las consultas actuales a los manifiestos de Bungie usan `BUNGIE_API_KEY`. El Grimorio D1 se sincroniza desde sus bases SQLite localizadas y queda identificado y filtrable por separado del lore D2. Si una entrada no tiene texto oficial en español, D2 puede traducirse bajo demanda con OpenAI y guardarse en PostgreSQL. Los vídeos editoriales se asocian al lanzamiento correspondiente y muestran el idioma cuando se conoce.

La traducción bajo demanda tiene límites diarios por cliente y globales para proteger el presupuesto de la API.

El Archivo del Viajero es un proyecto comunitario sin ánimo de lucro y no oficial, sin afiliación con Bungie. Destiny y sus elementos pertenecen a sus respectivos titulares; esta aclaración no implica permiso para republicar ilustraciones protegidas. Añade arte de terceros solo cuando exista autorización o una licencia que permita ese uso, y conserva la atribución exigida.

## Inicio local con Docker

1. Instala Docker Desktop y crea `.env` a partir de `.env.example`.
2. Si ya tienes un volumen creado con PostgreSQL 16 y quieres empezar desde cero en PostgreSQL 17, elimina los volúmenes de este proyecto:

   ```sh
   docker compose down -v
   ```

   Esto borra la base de datos local y la caché de dependencias del contenedor; no borra los archivos del proyecto.
3. Arranca la base de datos y la web:

   ```sh
   docker compose up --build
   ```

   Al iniciar, la aplicación instala/actualiza el esquema y sincroniza el lore, los grupos, el catálogo y las asociaciones editoriales de items por lanzamiento una vez por versión del importador. Para ello configura `BUNGIE_API_KEY` en `.env` antes del primer arranque. Cuando el proyecto actualiza una versión de importación, la próxima reconstrucción actualiza las entradas oficiales existentes.
4. Abre <http://localhost:8888>. Si la API de Bungie no está disponible, la web arranca igualmente y el inicio siguiente vuelve a intentarlo.
5. Para comprobar manualmente el acceso a D1 cuando quieras:

   ```sh
   docker compose exec app npm run check:d1
   ```

   Para forzar una actualización de contenido ya sincronizado, ejecuta:

   ```sh
   docker compose exec app npm run sync:d1
   docker compose exec app npm run sync:lore
   docker compose exec app npm run sync:catalog:d1
   docker compose exec app npm run sync:catalog:d2
   docker compose exec app npm run sync:lore-groups
   docker compose exec app npm run sync:release-items
   ```

Docker expone el servidor de Netlify en `0.0.0.0:8888`, configurado en `[dev]` de `netlify.toml`. El contenedor de Node usa Debian, no Alpine, para que Netlify pueda ejecutar Deno en su entorno de funciones Edge. No pases `--host` al comando `netlify dev`: la CLI actual no acepta esa opción.

El contenedor local usa PostgreSQL 17. Cambiar la versión mayor de PostgreSQL requiere migrar los datos o reinicializar el volumen; el paso anterior empieza de cero. El esquema se aplica de forma idempotente al arrancar. Si ya tienes un PostgreSQL vacío fuera de Docker, ejecuta `npm run db:init`. El usuario que solicite traducción asistida también debe configurar `OPENAI_API_KEY`.

Si cambias la imagen del contenedor de desarrollo, recrea únicamente la aplicación con `docker compose up -d --build --force-recreate app`. El volumen de dependencias está versionado por imagen para evitar reutilizar módulos nativos de Alpine; no es necesario borrar el volumen de la base de datos. Este contenedor usa `npm ci` para instalar exactamente las dependencias del archivo de bloqueo.

## Variables de entorno

| Variable | Necesaria para | Nota |
| --- | --- | --- |
| `DATABASE_URL` | Web y sincronización | URL PostgreSQL; en Neon usa la cadena SSL que proporciona Neon. |
| `BUNGIE_API_KEY` | Sincronización de manifiestos Destiny 1 y 2 | Clave de aplicación de Bungie; solo se usa desde scripts del servidor y nunca se expone al navegador. |
| `OPENAI_API_KEY` | Traducción bajo demanda | Opcional si todas las entradas ya están traducidas oficialmente. |
| `OPENAI_MODEL` | Traducción bajo demanda | Opcional; por defecto `gpt-4o-mini`. |
No se guardan claves reales en el repositorio. Netlify necesita las variables de producción configuradas en su panel, y la base Neon debe inicializarse con `npm run db:init` antes del primer despliegue con datos.

## Fuentes y sincronización del lore

### Destiny 2

`npm run sync:lore` consulta el endpoint `/Platform/Destiny2/Manifest/` de Bungie con `BUNGIE_API_KEY`, encuentra las definiciones `DestinyLoreDefinition` en inglés y español, y actualiza `lore_entries`, incluida la ruta de icono oficial localizada cuando está disponible. Las traducciones e imágenes existentes no se sustituyen por valores vacíos durante la sincronización.

El catálogo de referencia se sincroniza por separado: `sync:catalog:d1` y `sync:catalog:d2` cargan los objetos de inventario (armas, armaduras y demás equipo), vendedores/personajes, razas/clases y facciones cuando la fuente oficial ofrece esos datos. Las fichas conservan por separado la descripción y el texto de ambientación del manifiesto en español y en inglés; la interfaz prioriza el español y señala cuándo solo existe texto en inglés. La rareza `Rare` se presenta como «Peculiar» tanto en Destiny 1 como en Destiny 2. Las fichas idénticas se agrupan en la consulta sin borrar definiciones distintas. Si una definición no contiene textos descriptivos, se muestra el resumen informativo del Archivo generado a partir de sus metadatos. Al cambiar la versión de sincronización, el siguiente inicio actualiza los registros existentes; también se pueden ejecutar los dos comandos de catálogo indicados arriba. Las entradas narrativas del Grimorio y Destiny Lore se conservan aparte con la localización oficial. En la lectura de un relato, las menciones detectadas de otros relatos y fichas del catálogo se pueden abrir directamente como referencias internas. Ishtar se usa solo como guía editorial para asignar items a lanzamientos; la interfaz, los textos y las fichas del proyecto son propios.

El catálogo general muestra armas, armaduras y otros objetos en casillas de inventario y permite filtrar por juego, categoría, rareza y clase. La página de Destiny original en Ishtar solo clasifica cartas del Grimorio y transcripciones, no equipo; por eso el equipo base de Destiny 1 se consulta desde el catálogo general y no se asigna artificialmente a ese lanzamiento.

La portada separa las rutas de Destiny y Destiny 2 y usa la imagen de la Última Ciudad en `public/media/site-art/portada/arte intro.jpg`. Cada portal da acceso al lore, al mapa estelar y al índice de raids; las expansiones se recorren en «Cronología de contenido» debajo de las rutas. Al abrir un lanzamiento se presenta primero su contexto y arte, después su sección de tráilers/cinemáticas y, más abajo, su equipo y lore. Las imágenes de lanzamientos se asocian por `releaseSlug` en `src/data/release-artwork.ts`; las tarjetas de Destiny 1 y 2 y sus fichas usan esa asociación antes que el arte del manifiesto, y los créditos atribuyen el arte a Bungie. Si no existe arte, muestran un espacio pendiente y no amplían un icono. El mapa obtiene nombres e imágenes de la categoría de lugares del catálogo local de Bungie y dibuja una disposición esquemática, no una representación astronómica a escala. «Crónicas» reúne libros, lanzamientos y el recorrido del Guardián; «Archivo del universo» conserva la búsqueda transversal. Los vídeos asociados a una expansión se registran en `src/data/media.ts` mediante `releaseSlug` y aparecen en su ficha y en su hito del recorrido, tanto si son en español como en inglés. En la ficha se elige cada vídeo mediante botones y se reproduce en un único reproductor grande. Cada raid muestra su recorrido completo cuando se ha verificado un vídeo. Su botín consulta el catálogo de Bungie para mostrar nombres localizados e imágenes; al seleccionar un objeto se abre su ficha ampliada. El índice de raids enlaza cada incursión con el archivo de su lanzamiento.

Para las imágenes, se priorizan capturas o ilustraciones oficiales de alta resolución cuando existen. Los iconos de inventario pequeños (por ejemplo, los JPEG de 96 × 96 px de D1) se muestran a tamaño nativo y no se amplían como fondos grandes, para evitar pixelado artificial. Los siete lanzamientos de Destiny 1 cuentan con imágenes locales en `public/media/site-art/lanzamientos/destiny1`; `src/data/release-artwork.ts` centraliza las rutas, créditos y enlaces a las fuentes. El material se atribuye a Bungie y se usa con el permiso facilitado para el proyecto.

«Libros» agrupa los nodos oficiales de Bungie por lanzamiento usando únicamente el índice editorial local `data/editorial-book-index.json` (títulos y slugs, sin textos importados); las fichas de libro muestran una descripción contextual y enlaces entre colecciones relacionadas. Los emblemas de lanzamientos de Ishtar Collective se guardan localmente en `public/media/ishtar-releases`; las portadas de «Libros del pesar» y «La incursión de Mara» se guardan en `public/media/ishtar-books`. Se usan bajo la licencia y permiso facilitados para este proyecto; las fuentes son [el archivo de lanzamientos](https://www.ishtar-collective.net/releases) y [el índice de libros de lore](https://www.ishtar-collective.net/books) de Ishtar Collective. Las colecciones del Grimorio de Destiny 1 conservan su título original para identificar las cartas de Bungie y muestran además sus títulos editoriales en español desde `data/d1-editorial-book-index.json`. Los relatos D2 se resuelven desde `DestinyPresentationNodeDefinition.children.records` a `DestinyRecordDefinition.loreHash`; sus textos siguen procediendo de los manifiestos oficiales de Bungie. El índice visible de «Lanzamientos» se limita a los 37 títulos del índice editorial local `data/release-index.json`, cotejado con Ishtar Collective. `data/release-item-index.json` clasifica localmente los items documentados en cada lanzamiento y los enlaza al catálogo oficial por título; el icono sirve para distinguir títulos repetidos y descartar coincidencias ambiguas. La aplicación nunca consulta Ishtar al navegar ni durante el inicio: `npm run index:release-items` regenera esa referencia editorial bajo demanda y `npm run sync:release-items` la asocia a los registros locales de Bungie. Dentro de cada lanzamiento, los items se muestran en casillas de inventario con filtros por tipo, rareza y clase; los relatos oficiales enlazados desde Bungie se mantienen en una sección separada. Las cifras de documentos de Ishtar mezclan lore, objetos, interacciones, transcripciones y otros tipos que no equivalen uno a uno a los relatos del manifiesto oficial.

«Recorrido del Guardián» ordena los lanzamientos del índice desde el despertar del Guardián y enlaza sus relatos y libros. Las notas son editoriales y los vídeos de cada lanzamiento se añaden manualmente en `src/data/media.ts` mediante `releaseSlug`; el idioma se indica cuando se conoce y no se consultan servicios externos de organización al navegar por la web. De momento, las fichas de Destiny 2 no muestran el aviso sobre añadir allí vídeos aún pendientes de selección. La posición es por orden de publicación, no una afirmación sobre fechas internas exactas del universo.

Los agradecimientos de la interfaz reconocen a Bungie como creadora de Destiny y de los manifiestos. El Archivo del Viajero es un proyecto comunitario para lectores de Latinoamérica y España, sin afiliación oficial.

### Destiny 1

El Grimorio de Destiny 1 no está en el manifiesto de D2. Su flujo es distinto:

1. `npm run check:d1` consulta `/d1/Platform/Destiny/Manifest/` con `BUNGIE_API_KEY` y verifica los idiomas sin imprimir la clave.
2. `npm run sync:d1` descarga los archivos `.content` oficiales en inglés y español, extrae en memoria el archivo ZIP/SQLite y lee `DestinyGrimoireCardDefinition`.
3. Importa las 834 definiciones de cartas del Grimorio, junto con el título, texto localizado, imagen oficial individual y fuente. La tabla `DestinyGrimoireDefinition` solo contiene configuración de organización (`themeCollection`), no cartas narrativas adicionales. Los identificadores llevan el prefijo `d1:` y la sincronización omite duplicados exactos (título y texto) frente a D2 o a otra carta D1.
4. Decodifica entidades HTML de Bungie (por ejemplo, `&#243;` a `ó`), elimina las etiquetas HTML de las cartas y conserva solo introducción/descripción narrativa, no el texto mecánico para desbloquear la carta. Elimina el encabezado duplicado «Versículo 5:6 - Aiat…» de la carta afectada. El índice editorial local clasifica 12 cartas oficiales en «The Maraid», incluida «WANTED: Skoriks, Archon-Slayer». Las referencias automáticas de los relatos solo enlazan personajes, lugares y armas. No se crea una copia temporal en disco ni se imprimen textos del Grimorio en los logs. Las entradas sin localización española mantienen el original en inglés.

El proyecto comunitario [aureliendossantos/destiny-grimoire](https://github.com/aureliendossantos/destiny-grimoire) confirma este flujo y mantiene exportaciones JSON estáticas en varios idiomas, además de corregir errores de traducción. La aplicación consulta directamente el manifiesto de Bungie; no copia sus exportaciones.

El `client_id` y la URL OAuth no son necesarios para consultar el manifiesto. Si una clave API se comparte en un chat, una captura o un repositorio, revócala y genera otra antes de usarla. Guarda la nueva clave solo en `.env`; no la subas al repositorio.

## Dónde guardar imágenes

Guarda las nuevas imágenes del sitio bajo `public/media/site-art/`, separadas por sección y juego. Se recomienda WebP o JPEG optimizado y estos nombres. El indicador compartido para las consultas a la API utiliza `public/media/carga.gif`.

```text
public/media/site-art/
  portada/viajero.webp
  lanzamientos/destiny1/<releaseSlug>.webp
  lanzamientos/destiny2/<releaseSlug>.webp
  destinos/destiny1/<id-del-lugar>.webp
  destinos/destiny2/<id-del-lugar>.webp
  raids/destiny1/<raid-id>.webp
  raids/destiny2/<raid-id>.webp
```

Usa el `releaseSlug` de `data/release-index.json`; los identificadores de raid están en `src/data/raids.ts`. El arte local de raids se configura en `src/data/raid-artwork.ts`, junto con el crédito y el enlace a la fuente. Las cuatro raids de Destiny 1 y las quince de Destiny 2 tienen imágenes locales atribuidas que aparecen tanto en las tarjetas como en sus fichas. Destiny 1 conserva su carta estelar clicable en `public/media/site-art/mapas/destiny1/solar-system-map.jpg`. Destiny 2 utiliza el mapa aportado en `public/media/site-art/destinos/destiny2/d2 mapa.jpg`; los puntos se colocan sobre sus destinos rotulados y las imágenes y descripciones breves de las fichas se asocian en `src/data/destination-artwork.ts`. Los destinos del legado, que no aparecen en esa carta, permanecen en la lista inferior sin puntos con posiciones inventadas. Las asociaciones entre lugares de D1 e imágenes y resúmenes propios de lore se mantienen en el mismo módulo; las entradas de Destino de expansión, Cámara, Tierra y Última Ciudad se excluyen de ese mapa. Los archivos de Pruebas de Osiris y Crisol permanecen en la carpeta, pero no se usan como destinos. Para agregar imágenes, guarda los archivos en `public/media/site-art/destinos/destiny1/` y añade una asociación explícita en ese módulo. Conserva las imágenes originales, su URL de origen y la atribución correspondiente. Los emblemas de Ishtar ya existentes van en `public/media/ishtar-releases`; las portadas de libros, en `public/media/ishtar-books`. Las raids se indexan en `src/data/raids.ts` y cada ficha enlaza a la expansión asociada.

## Vídeos y material de referencia

La lista editable de material contextual está en `src/data/media.ts`. Añade allí vídeos de YouTube o ficheros locales con `kind: "video"`. Organiza los ficheros locales por juego y lanzamiento: `public/media/videos/<destiny1|destiny2>/<releaseSlug>/<videoSlug>.mp4`; usa la ruta pública equivalente, por ejemplo `/media/videos/destiny1/the-dark-below/trailer.mp4`. Los vídeos asociados mediante `releaseSlug` se muestran en la ficha de expansión y en el hito correspondiente del recorrido. Si aún no hay vídeos, la ficha presenta una indicación para ese lanzamiento.

Ejemplo de vídeo:

```ts
{
  id: "renegades-cinematic-01",
  kind: "video",
  title: "Cinemática del lanzamiento",
  url: "https://youtu.be/VIDEO_ID",
  release: "Los Renegados",
  releaseSlug: "renegades",
  language: "es",
  description: "Contexto opcional."
}
```

Para un vídeo local, cambia `url` por la ruta pública del fichero bajo `/media/videos/`. `language` es opcional y documenta si el vídeo está en español o en inglés; conserva la fuente o atribución en `credit`.

Las relaciones locales entre libros y lanzamientos están en `data/editorial-book-index.json`. Si cambia esa clasificación, ejecuta `npm run db:init` y después `npm run sync:lore-groups` para recalcular los enlaces en PostgreSQL. La sincronización consulta las definiciones necesarias del manifiesto oficial de Bungie y no realiza llamadas a Ishtar. El índice de items se genera por separado cuando se quiera refrescar la clasificación: `npm run index:release-items` requiere la web local en ejecución y recorre las páginas de items de los lanzamientos; al terminar, ejecuta `npm run sync:release-items` para aplicar el JSON a PostgreSQL. El bootstrap solo lee el índice local y no consulta Ishtar.

## Comandos

```sh
npm run dev          # Vite sin funciones de Netlify
npm run dev:netlify  # Web + Netlify Functions
npm run build        # Comprobación TypeScript y build de producción
npm run db:init      # Crear tablas e índices en DATABASE_URL
npm run bootstrap    # Preparar esquema y sincronizar fuentes iniciales una vez
npm run sync:lore    # Sincronizar el manifiesto de Bungie
npm run sync:d1      # Sincronizar el Grimorio oficial de Destiny 1
npm run sync:catalog:d1 # Sincronizar armas, armaduras y referencias de D1
npm run sync:catalog:d2 # Sincronizar armas, armaduras y referencias de D2
npm run sync:lore-groups # Sincronizar libros, categorías y lanzamientos
npm run index:release-items # Actualizar el índice local (lectura extensa, solo manual)
npm run sync:release-items # Aplicar las asociaciones locales de items en la base de datos
npm run check:d1     # Comprobar acceso al manifiesto D1
```

## Estructura

```text
src/
  components/         Componentes de interfaz reutilizables
  data/               Índices editoriales de raids y vídeos
  lib/                Cliente de la API
  types/              Tipos compartidos del frontend
  App.tsx             Composición de la página
  styles.css          Estilos visuales y responsive
netlify/functions/    API y acceso compartido a PostgreSQL
database/init.sql     Esquema versionable de PostgreSQL
data/                 Títulos locales de lanzamientos no presentes como temporadas en Bungie
public/media/         Emblemas, portadas, site-art y vídeos locales
scripts/              Inicialización y sincronización del manifiesto
```

## Lanzamientos

Las fichas de lanzamiento consultan los relatos que la jerarquía oficial de Bungie vincula a cada temporada. Los títulos históricos que no aparecen como temporadas en el manifiesto se mantienen en el índice local, pero no se les atribuyen documentos externos.

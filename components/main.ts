const API_URL =
  "http://localhost:3000/api/pokemon";

const COLLECTIONS_URL =
  "http://localhost:3000/api/collections";

const TOOLS_URL =
  "http://localhost:3000/api/tools";

const RAG_URL =
  "/api/rag/query";

let ORGANIZATION_ID = 1;


/* ==================================================
   VISUALIZACIÓN RAG
================================================== */

interface RagResponse {
  success: boolean;
  consulta?: string;
  contexto?: string;
  error?: string;
}

const RAG_PAGE_SIZE = 12;
let ragResultRows: unknown[] | null = null;
let ragResultData: unknown;
let ragCurrentPage = 1;

interface RagCoincidence {
  id: string;
  sourceName: string;
  title: string;
  score: number;
  html: string;
}

let ragCoincidences: RagCoincidence[] = [];
const RAG_MATCH_PAGE_SIZE = 10;
let ragCoincidencePage = 1;
let ragSelectedCoincidence = 0;

function renderizarCoincidenciaSeleccionada(index = ragSelectedCoincidence): string {
  const selected = ragCoincidences[index];
  if (!selected) return "";
  const totalPages = Math.max(1, Math.ceil(ragCoincidences.length / RAG_MATCH_PAGE_SIZE));
  ragCoincidencePage = Math.min(Math.max(1, ragCoincidencePage), totalPages);
  const start = (ragCoincidencePage - 1) * RAG_MATCH_PAGE_SIZE;
  const options = ragCoincidences.slice(start, start + RAG_MATCH_PAGE_SIZE).map((match, optionIndex) => {
    const matchIndex = start + optionIndex;
    return `<button type="button" data-rag-match="${matchIndex}" class="${matchIndex === index ? "active" : ""}">${escaparHTML(match.title)} <small>· ${escaparHTML(match.sourceName)}</small></button>`;
  }).join("");
  const controls = totalPages > 1 ? `<button type="button" data-rag-match-page="${ragCoincidencePage - 1}" ${ragCoincidencePage === 1 ? "disabled" : ""}>Anterior</button><span>Página ${ragCoincidencePage} de ${totalPages}</span><button type="button" data-rag-match-page="${ragCoincidencePage + 1}" ${ragCoincidencePage === totalPages ? "disabled" : ""}>Siguiente</button>` : "";
  return `<section class="rag-source-results"><h3>${escaparHTML(selected.sourceName)}</h3>${selected.html}</section><nav class="rag-pagination rag-match-list" aria-label="Coincidencias">${options}</nav>${controls ? `<nav class="rag-pagination rag-match-controls" aria-label="Paginación de coincidencias">${controls}</nav>` : ""}`;
}

interface RagConfiguredSource {
  id: string;
  name: string;
  type: "api";
  url?: string;
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  itemsPath?: string;
  titlePath?: string;
  imagePath?: string;
  descriptionPath?: string;
}

interface RagDocumentMeta {
  id: string;
  name: string;
  groupName: string;
  sourceName: string;
  size: number;
  createdAt: string;
  updatedAt: string;
}

let ragDocumentMetadata: RagDocumentMeta[] = [];

const RAG_SOURCES_KEY = "pokemon-api-rag-sources-v1";
let ragConfiguredSources: RagConfiguredSource[] = cargarFuentesRag();

function cargarFuentesRag(): RagConfiguredSource[] {
  try {
    const saved = localStorage.getItem(RAG_SOURCES_KEY);
    const parsed: unknown = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed.filter(item => item && item.type === "api") : [];
  } catch {
    return [];
  }
}

function guardarFuentesRag(): void {
  localStorage.setItem(RAG_SOURCES_KEY, JSON.stringify(ragConfiguredSources.filter(source => source.type === "api")));
}

function parsearCSV(text: string): Record<string, unknown>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"' && quoted && text[i + 1] === '"') { cell += '"'; i++; }
    else if (char === '"') quoted = !quoted;
    else if (!quoted && (char === "," || char === "\t")) { row.push(cell); cell = ""; }
    else if (!quoted && (char === "\n" || char === "\r")) {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += char;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const headers = (rows.shift() || []).map((header, index) => header.trim() || `columna_${index + 1}`);
  return rows.filter(values => values.some(value => value.trim())).map(values =>
    Object.fromEntries(headers.map((header, index) => [header, values[index]?.trim() || ""]))
  );
}

async function leerEntradaZip(buffer: ArrayBuffer, targetName: string): Promise<string> {
  const view = new DataView(buffer);
  let end = -1;
  for (let offset = view.byteLength - 22; offset >= Math.max(0, view.byteLength - 65558); offset--) {
    if (view.getUint32(offset, true) === 0x06054b50) { end = offset; break; }
  }
  if (end < 0) throw new Error("El archivo no parece ser un Excel .xlsx válido.");
  const entries = view.getUint16(end + 10, true);
  let directoryOffset = view.getUint32(end + 16, true);
  const decoder = new TextDecoder();
  for (let index = 0; index < entries; index++) {
    if (view.getUint32(directoryOffset, true) !== 0x02014b50) break;
    const method = view.getUint16(directoryOffset + 10, true);
    const compressedSize = view.getUint32(directoryOffset + 20, true);
    const nameLength = view.getUint16(directoryOffset + 28, true);
    const extraLength = view.getUint16(directoryOffset + 30, true);
    const commentLength = view.getUint16(directoryOffset + 32, true);
    const localOffset = view.getUint32(directoryOffset + 42, true);
    const name = decoder.decode(new Uint8Array(buffer, directoryOffset + 46, nameLength));
    if (name === targetName) {
      const localNameLength = view.getUint16(localOffset + 26, true);
      const localExtraLength = view.getUint16(localOffset + 28, true);
      const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
      const compressed = new Uint8Array(buffer, dataOffset, compressedSize);
      if (method === 0) return decoder.decode(compressed);
      if (method !== 8 || typeof DecompressionStream === "undefined") throw new Error("Este navegador no puede descomprimir este Excel.");
      const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream("deflate-raw" as CompressionFormat));
      return decoder.decode(await new Response(stream).arrayBuffer());
    }
    directoryOffset += 46 + nameLength + extraLength + commentLength;
  }
  throw new Error(`No se encontró ${targetName} dentro del Excel.`);
}

async function parsearXLSX(file: File): Promise<Record<string, unknown>[]> {
  const buffer = await file.arrayBuffer();
  let sharedStrings: string[] = [];
  try {
    const xml = new DOMParser().parseFromString(await leerEntradaZip(buffer, "xl/sharedStrings.xml"), "application/xml");
    sharedStrings = Array.from(xml.getElementsByTagName("si")).map(item => item.textContent || "");
  } catch { /* Los libros sin strings compartidos usan inline strings. */ }
  const sheet = new DOMParser().parseFromString(await leerEntradaZip(buffer, "xl/worksheets/sheet1.xml"), "application/xml");
  const rows = Array.from(sheet.getElementsByTagName("row")).map(xmlRow => {
    const values: string[] = [];
    for (const cell of Array.from(xmlRow.getElementsByTagName("c"))) {
      const ref = cell.getAttribute("r") || "A1";
      const letters = ref.match(/[A-Z]+/i)?.[0] || "A";
      const column = Array.from(letters.toUpperCase()).reduce((value, letter) => value * 26 + letter.charCodeAt(0) - 64, 0) - 1;
      const value = cell.getElementsByTagName("v")[0]?.textContent || cell.getElementsByTagName("t")[0]?.textContent || "";
      values[column] = cell.getAttribute("t") === "s" ? sharedStrings[Number(value)] || "" : value;
    }
    return values;
  });
  const headers = (rows.shift() || []).map((header, index) => header?.trim() || `columna_${index + 1}`);
  return rows.filter(values => values.some(Boolean)).map(values => Object.fromEntries(headers.map((header, index) => [header, values[index] || ""])));
}

async function consultarFuenteRag(source: RagConfiguredSource, query: string): Promise<unknown> {
  if (!source.url) throw new Error("La fuente no tiene una URL configurada.");
  const response = await fetch("/api/rag/api-query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source, query })
  });
  const result = await response.json() as { success?: boolean; data?: unknown; error?: string };
  if (!response.ok || !result.success) throw new Error(result.error || "No se pudo consultar la API.");
  return result.data;
}

function valorPorRutaRag(data: unknown, path?: string): unknown {
  if (!path?.trim()) return undefined;
  return path.replace(/\[(\d+)\]/g, ".$1").split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[key];
  }, data);
}

function extraerFilasFuenteRag(data: unknown, itemsPath?: string): unknown[] | null {
  const mappedItems = valorPorRutaRag(data, itemsPath);
  if (Array.isArray(mappedItems)) return mappedItems;
  let rows: unknown[] | null = Array.isArray(data) ? data : null;
  if (!rows && data && typeof data === "object") {
    const objectData = data as Record<string, unknown>;
    for (const key of ["resultados", "results", "items", "data", "characters", "collection", "meals"]) {
      const candidate = objectData[key];
      if (Array.isArray(candidate)) { rows = candidate; break; }
      if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
        const nested = candidate as Record<string, unknown>;
        for (const nestedKey of ["results", "items", "data", "characters", "meals"]) {
          if (Array.isArray(nested[nestedKey])) { rows = nested[nestedKey] as unknown[]; break; }
        }
        if (rows) break;
      }
    }
  }
  return rows;
}

function textoParaRelevancia(item: unknown): string {
  if (item === null || item === undefined) return "";
  if (typeof item === "string" || typeof item === "number") return String(item);
  if (Array.isArray(item)) return item.slice(0, 5).map(textoParaRelevancia).join(" ");
  if (typeof item === "object") {
    return Object.entries(item as Record<string, unknown>)
      .slice(0, 12)
      .map(([key, value]) => `${key} ${textoParaRelevancia(value)}`)
      .join(" ");
  }
  return "";
}

function puntuarResultadoRag(item: unknown, query: string): number {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const record = item && typeof item === "object" && !Array.isArray(item)
    ? item as Record<string, unknown>
    : {};
  const title = [record.name, record.title, record.nombre, record.id]
    .find(value => typeof value === "string" || typeof value === "number");
  const normalizedTitle = String(title ?? "").toLocaleLowerCase();
  const text = textoParaRelevancia(item).toLocaleLowerCase();
  if (normalizedTitle === normalizedQuery) return 1000;
  if (normalizedTitle.includes(normalizedQuery)) return 500;
  if (text.includes(normalizedQuery)) return 100;
  return 0;
}

function obtenerImagenFuenteRag(record: Record<string, unknown>): string {
  if (typeof record.image === "string" && /^https:\/\//i.test(record.image)) {
    return record.image;
  }

  // NASA EPIC entrega el nombre de imagen y su fecha; la foto se aloja en el archivo EPIC.
  if (typeof record.image === "string" && typeof record.date === "string") {
    const date = record.date.slice(0, 10).replaceAll("-", "/");
    if (/^\d{4}\/\d{2}\/\d{2}$/.test(date)) {
      return `https://epic.gsfc.nasa.gov/archive/natural/${date}/png/${record.image}.png`;
    }
  }

  return "";
}

function buscarValorRag(
  value: unknown,
  matcher: (key: string, candidate: unknown) => boolean,
  depth = 0
): unknown {
  if (!value || typeof value !== "object" || depth > 3) return undefined;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = buscarValorRag(item, matcher, depth + 1);
      if (found !== undefined) return found;
    }
    return undefined;
  }
  for (const [key, candidate] of Object.entries(value as Record<string, unknown>)) {
    if (matcher(key, candidate)) return candidate;
  }
  for (const candidate of Object.values(value as Record<string, unknown>)) {
    if (candidate && typeof candidate === "object") {
      const found = buscarValorRag(candidate, matcher, depth + 1);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

function obtenerTituloFuenteRag(record: Record<string, unknown>, fallback: string, titlePath?: string): string {
  const mappedTitle = valorPorRutaRag(record, titlePath);
  if (typeof mappedTitle === "string" || typeof mappedTitle === "number") return String(mappedTitle);
  const title = buscarValorRag(record, (key, value) =>
    ["name", "title", "nombre", "label", "strMeal"].includes(key) &&
    (typeof value === "string" || typeof value === "number")
  );
  return title === undefined ? fallback : String(title);
}

function obtenerImagenGenericaRag(record: Record<string, unknown>, imagePath?: string): string {
  const mappedImage = valorPorRutaRag(record, imagePath);
  if (typeof mappedImage === "string" && /^https:\/\//i.test(mappedImage)) return mappedImage;
  const knownImage = obtenerImagenFuenteRag(record);
  if (knownImage) return knownImage;
  const image = buscarValorRag(record, (key, value) =>
    ((/(?:image|thumbnail|thumb|poster|avatar|photo|cover)/i.test(key)) ||
      (key === "href" && typeof value === "string" && /\.(?:png|jpe?g|webp)(?:$|\?)/i.test(value))) &&
    typeof value === "string" && /^https:\/\//i.test(value)
  );
  return typeof image === "string" ? image : "";
}

function camposSimplesRag(record: Record<string, unknown>, title: string): Array<[string, string]> {
  const fields: Array<[string, string]> = [];
  const visit = (value: unknown, prefix = "", depth = 0): void => {
    if (fields.length >= 6 || depth > 2 || value === null || value === undefined) return;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      if (!/image|thumbnail|thumb|poster|avatar|photo|url/i.test(prefix) && String(value) !== title) {
        fields.push([prefix || "valor", String(value)]);
      }
      return;
    }
    if (Array.isArray(value)) {
      const values = value.filter(item => typeof item === "string" || typeof item === "number").slice(0, 3);
      if (values.length) fields.push([prefix, values.join(", ")]);
      return;
    }
    if (typeof value === "object") {
      Object.entries(value as Record<string, unknown>).forEach(([key, item]) => visit(item, prefix ? `${prefix}.${key}` : key, depth + 1));
    }
  };
  visit(record);
  return fields;
}

function renderizarResultadoFuente(data: unknown, rows: unknown[] | null, offset = 0, source?: RagConfiguredSource): string {
  if (rows) {
    if (!rows.length) return "<div class=\"rag-info-box\">No se encontraron coincidencias.</div>";
    const cards = rows.slice(0, 12).map((item, index) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return `<article class="rag-data-card"><h4>Resultado ${offset + index + 1}</h4><p>${escaparHTML(String(item))}</p></article>`;
      }
      const record = item as Record<string, unknown>;
      const title = obtenerTituloFuenteRag(record, `Resultado ${offset + index + 1}`, source?.titlePath);
      const imageUrl = obtenerImagenGenericaRag(record, source?.imagePath);
      const fields = camposSimplesRag(record, title);
      const description = valorPorRutaRag(record, source?.descriptionPath);
      if (typeof description === "string" && description.trim()) {
        fields.unshift(["descripción", description]);
      }
      return `<article class="rag-data-card">${imageUrl ? `<img src="${escaparHTML(imageUrl)}" alt="${escaparHTML(title)}" loading="lazy">` : ""}<h4>${escaparHTML(title)}</h4><dl>${fields.map(([key, value]) => `<div><dt>${escaparHTML(key)}</dt><dd>${escaparHTML(value)}</dd></div>`).join("")}</dl></article>`;
    }).join("");
    return `<div class="rag-data-grid">${cards}</div>`;
  }
  return `<pre class="rag-json">${escaparHTML(JSON.stringify(data, null, 2) || String(data))}</pre>`;
}

function mostrarPaginaResultadosRag(visual: HTMLElement, pagination: HTMLElement): void {
  if (!ragResultRows) {
    visual.innerHTML = renderizarResultadoFuente(ragResultData, null);
    pagination.hidden = true;
    pagination.innerHTML = "";
    return;
  }
  const totalPages = Math.max(1, Math.ceil(ragResultRows.length / RAG_PAGE_SIZE));
  ragCurrentPage = Math.min(Math.max(1, ragCurrentPage), totalPages);
  const start = (ragCurrentPage - 1) * RAG_PAGE_SIZE;
  visual.innerHTML = renderizarResultadoFuente(ragResultData, ragResultRows.slice(start, start + RAG_PAGE_SIZE), start);
  pagination.hidden = totalPages <= 1;
  pagination.innerHTML = totalPages <= 1 ? "" : `
    <button type="button" data-rag-page="${ragCurrentPage - 1}" ${ragCurrentPage === 1 ? "disabled" : ""}>Anterior</button>
    <span>Página ${ragCurrentPage} de ${totalPages} · ${ragResultRows.length} resultados</span>
    <button type="button" data-rag-page="${ragCurrentPage + 1}" ${ragCurrentPage === totalPages ? "disabled" : ""}>Siguiente</button>`;
}

function escaparHTML(value: string): string {
  const entities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  };
  return value.replace(/[&<>"']/g, character => entities[character] || character);
}

function extraerCampoRag(contexto: string, etiqueta: string): string {
  const match = contexto.match(new RegExp(`^${etiqueta}:\\s*(.*)$`, "im"));
  return match?.[1]?.trim() || "No disponible";
}

function renderizarContextoRag(contexto: string): string {
  const nombre = extraerCampoRag(contexto, "Nombre");
  const id = extraerCampoRag(contexto, "ID");
  const image = extraerCampoRag(contexto, "Imagen");
  const tipos = extraerCampoRag(contexto, "Tipos").split(",").map(item => item.trim()).filter(Boolean);
  const habilidades = extraerCampoRag(contexto, "Habilidades");
  const evolucion = extraerCampoRag(contexto, "Evolución");
  const statNames = ["HP", "Ataque", "Defensa", "Ataque especial", "Defensa especial", "Velocidad"];
  const stats = statNames.map(label => ({
    label,
    value: Number(extraerCampoRag(contexto, label)) || 0
  }));
  const imageUrl = /^https:\/\//i.test(image) ? image : "";

  return `
    <article class="rag-card">
      <header class="rag-card-top">
        ${imageUrl ? `<img src="${escaparHTML(imageUrl)}" alt="Ilustración de ${escaparHTML(nombre)}" loading="lazy">` : ""}
        <div>
          <span class="rag-number">#${escaparHTML(id)}</span>
          <h3>${escaparHTML(nombre)}</h3>
          <div class="rag-tags">${tipos.map(type => `<span class="rag-tag">${escaparHTML(type)}</span>`).join("")}</div>
        </div>
      </header>
      <div class="rag-card-body">
        <section>
          <h4>Estadísticas base</h4>
          ${stats.map(stat => `<div class="rag-stat"><span>${escaparHTML(stat.label)}</span><div class="rag-track"><div class="rag-fill" style="width:${Math.min(stat.value, 255) / 255 * 100}%"></div></div><strong>${stat.value}</strong></div>`).join("")}
        </section>
        <div class="rag-side">
          <section class="rag-info-box"><h4>Habilidades</h4><p>${escaparHTML(habilidades)}</p></section>
          <section class="rag-info-box"><h4>Línea evolutiva</h4><p>${escaparHTML(evolucion)}</p></section>
        </div>
      </div>
    </article>`;
}

function inicializarRagVisual(): void {
  const form = document.getElementById("ragForm") as HTMLFormElement | null;
  const input = document.getElementById("ragQuery") as HTMLInputElement | null;
  const button = document.getElementById("ragSubmit") as HTMLButtonElement | null;
  const status = document.getElementById("ragStatus");
  const visual = document.getElementById("ragResult");
  const pagination = document.getElementById("ragPagination");
  const contextResults = document.getElementById("ragContextResults");
  const queryContext = document.getElementById("ragQueryContext") as HTMLSelectElement | null;

  if (!form || !input || !button || !status || !visual || !pagination || !contextResults || !queryContext) return;

  pagination.addEventListener("click", event => {
    const target = event.target as HTMLElement;
    const page = Number(target.dataset.ragPage);
    if (!Number.isInteger(page) || page < 1 || !ragResultRows) return;
    ragCurrentPage = page;
    mostrarPaginaResultadosRag(visual, pagination);
  });

  visual.addEventListener("click", event => {
    const target = event.target as HTMLElement;
    const matchButton = target.closest<HTMLButtonElement>("[data-rag-match]");
    const pageButton = target.closest<HTMLButtonElement>("[data-rag-match-page]");
    if (matchButton) {
      const index = Number(matchButton.dataset.ragMatch);
      if (!Number.isInteger(index) || !ragCoincidences[index]) return;
      ragSelectedCoincidence = index;
      ragCoincidencePage = Math.floor(index / RAG_MATCH_PAGE_SIZE) + 1;
      visual.innerHTML = renderizarCoincidenciaSeleccionada();
      return;
    }
    if (pageButton) {
      const page = Number(pageButton.dataset.ragMatchPage);
      if (!Number.isInteger(page) || page < 1) return;
      ragCoincidencePage = page;
      visual.innerHTML = renderizarCoincidenciaSeleccionada();
    }
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const consulta = input.value.trim();
    if (!consulta) {
      status.textContent = "Escribe el nombre o ID de un Pokémon.";
      input.focus();
      return;
    }

    button.disabled = true;
    status.textContent = `Buscando información de ${consulta}...`;
    visual.innerHTML = "";
    contextResults.innerHTML = "";
    pagination.hidden = true;
    pagination.innerHTML = "";
    ragResultRows = null;
    ragCoincidences = [];
    ragCoincidencePage = 1;
    ragSelectedCoincidence = 0;

    try {
      const sourceSelector = document.getElementById("ragActiveSource") as HTMLSelectElement | null;
      const activeSourceIds = sourceSelector
        ? Array.from(sourceSelector.selectedOptions).map(option => option.value)
        : ["pokemon"];
      if (!activeSourceIds.length) activeSourceIds.push("pokemon");
      const contextSelection = queryContext.value;
      const selectedContextIds = contextSelection === "*"
        ? ragDocumentMetadata.map(item => item.id)
        : contextSelection
          ? ragDocumentMetadata.filter(item => item.groupName === contextSelection).map(item => item.id)
          : [];
      const wantsDocuments = activeSourceIds.includes("documents");
      const builtInSources = [
        ...(activeSourceIds.includes("pokemon") ? [{ id: "pokemon" as const, name: "PokéAPI" }] : []),
        ...(activeSourceIds.includes("rickandmorty") ? [{ id: "rickandmorty" as const, name: "Rick and Morty API" }] : [])
      ];
      const apiSources = activeSourceIds
        .filter(id => id !== "pokemon" && id !== "rickandmorty" && id !== "documents")
        .map(id => ragConfiguredSources.find(source => source.id === id))
        .filter((source): source is RagConfiguredSource => Boolean(source));

      if (wantsDocuments && !selectedContextIds.length) {
        throw new Error("Elige un grupo en «Documentos a consultar».");
      }

      let bestResult: { sourceName: string; score: number; html: string } | null = null;
      const errors: string[] = [];
      const builtInResults = await Promise.allSettled(builtInSources.map(async source => {
          const response = await fetch(RAG_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ consulta, source: source.id })
          });
          const result = await response.json() as RagResponse;
          if (!response.ok || !result.success || !result.contexto) throw new Error(result.error || "No se pudo consultar el RAG.");
          return { source, contexto: result.contexto };
      }));
      for (const result of builtInResults) {
        if (result.status === "fulfilled") {
          const match: RagCoincidence = {
            id: `builtin-${result.value.source.id}`,
            sourceName: result.value.source.name,
            title: extraerCampoRag(result.value.contexto, "Nombre"),
            score: 1000,
            html: renderizarContextoRag(result.value.contexto)
          };
          ragCoincidences.push(match);
          bestResult = bestResult || match;
        } else {
          errors.push(result.reason instanceof Error ? result.reason.message : "Una fuente interna no pudo responder.");
        }
      }

      const apiResults = await Promise.allSettled(apiSources.map(async source => ({
        source,
        data: await consultarFuenteRag(source, consulta)
      })));
      for (const result of apiResults) {
        if (result.status === "fulfilled") {
          const rows = extraerFilasFuenteRag(result.value.data, result.value.source.itemsPath);
          const candidates = rows || [result.value.data];
          candidates.slice(0, 50).forEach((item, index) => {
            const record = item && typeof item === "object" && !Array.isArray(item)
              ? item as Record<string, unknown>
              : {};
            const score = puntuarResultadoRag(item, consulta);
            ragCoincidences.push({
              id: `${result.value.source.id}-${index}`,
              sourceName: result.value.source.name,
              title: obtenerTituloFuenteRag(record, `Resultado ${index + 1}`),
              score,
              html: renderizarResultadoFuente(result.value.data, [item], 0, result.value.source)
            });
          });
          const bestCandidate = candidates.reduce<{ item: unknown; score: number } | null>((best, item) => {
            const score = puntuarResultadoRag(item, consulta);
            return !best || score > best.score ? { item, score } : best;
          }, null);
          if (bestCandidate && (!bestResult || bestCandidate.score > bestResult.score)) {
            bestResult = {
              sourceName: result.value.source.name,
              score: bestCandidate.score,
              html: renderizarResultadoFuente(result.value.data, [bestCandidate.item], 0, result.value.source)
            };
          }
        } else {
          errors.push(result.reason instanceof Error ? result.reason.message : "Una API no pudo responder.");
        }
      }
      ragCoincidences.sort((first, second) => second.score - first.score);
      ragCoincidences = ragCoincidences.slice(0, 50);
      visual.innerHTML = ragCoincidences.length
        ? renderizarCoincidenciaSeleccionada(0)
        : `<div class="ai-error"><strong>No hubo resultados.</strong><br>${escaparHTML(errors.join(" · ") || "No se pudo consultar ninguna fuente.")}</div>`;
      status.textContent = errors.length
        ? `Resultados recibidos con ${errors.length} fuente(s) con error.`
        : ragCoincidences.length ? `${ragCoincidences.length} coincidencia(s) encontradas. Mostrando la más relevante.` : "No se encontraron coincidencias.";

      if (wantsDocuments && selectedContextIds.length) {
        try {
          const response = await fetch("/api/rag/contexts/query", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ consulta, contextIds: selectedContextIds })
          });
          const data = await response.json() as { success?: boolean; error?: string; resultados?: Array<{ id: string; name: string; matches: Array<{ line: number; text: string }> }> };
          if (!response.ok || !data.success || !data.resultados) throw new Error(data.error || "No se pudieron consultar los documentos seleccionados.");
          contextResults.innerHTML = renderizarCoincidenciasDocumentales(data.resultados);
          status.textContent += ` · Consultados ${selectedContextIds.length} archivos documentales.`;
        } catch (error) {
          const message = error instanceof Error ? error.message : "Error consultando los documentos.";
          contextResults.innerHTML = `<div class="ai-error"><strong>Fallaron los documentos seleccionados.</strong><br>${escaparHTML(message)}</div>`;
          status.textContent += ` · ${message}`;
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error consultando el RAG.";
      status.textContent = message;
      contextResults.innerHTML = `<div class="ai-error"><strong>No fue posible completar la consulta.</strong><br>${escaparHTML(message)}</div>`;
    } finally {
      button.disabled = false;
    }
  });
}

inicializarRagVisual();

function inicializarFuentesRag(): void {
  const typeSelect = document.getElementById("ragSourceType") as HTMLSelectElement | null;
  const nameInput = document.getElementById("ragSourceName") as HTMLInputElement | null;
  const urlInput = document.getElementById("ragSourceUrl") as HTMLInputElement | null;
  const methodSelect = document.getElementById("ragSourceMethod") as HTMLSelectElement | null;
  const headersInput = document.getElementById("ragSourceHeaders") as HTMLTextAreaElement | null;
  const itemsPathInput = document.getElementById("ragSourceItemsPath") as HTMLInputElement | null;
  const titlePathInput = document.getElementById("ragSourceTitlePath") as HTMLInputElement | null;
  const imagePathInput = document.getElementById("ragSourceImagePath") as HTMLInputElement | null;
  const descriptionPathInput = document.getElementById("ragSourceDescriptionPath") as HTMLInputElement | null;
  const addButton = document.getElementById("ragAddSource");
  const activeSelect = document.getElementById("ragActiveSource") as HTMLSelectElement | null;
  const sourceList = document.getElementById("ragSourceList");
  let editingSourceId: string | null = null;

  if (!typeSelect || !nameInput || !urlInput || !methodSelect || !headersInput || !itemsPathInput || !titlePathInput || !imagePathInput || !descriptionPathInput || !addButton || !activeSelect || !sourceList) return;

  const refreshSources = (): void => {
    const selected = new Set(Array.from(activeSelect.selectedOptions).map(option => option.value));
    if (!selected.size) selected.add("pokemon");
    activeSelect.innerHTML = `<option value="pokemon">PokéAPI</option><option value="rickandmorty">Rick and Morty API</option><option value="documents">Documentos seleccionados</option>${ragConfiguredSources.map(source => `<option value="${escaparHTML(source.id)}">${escaparHTML(source.name)} · API</option>`).join("")}`;
    Array.from(activeSelect.options).forEach(option => { option.selected = selected.has(option.value); });
    const pokemonSource = `<span class="rag-source-chip ${selected.has("pokemon") ? "active" : ""}"><label><input type="checkbox" data-select-rag-source="pokemon" ${selected.has("pokemon") ? "checked" : ""}> PokéAPI</label></span>`;
    const rickAndMortySource = `<span class="rag-source-chip ${selected.has("rickandmorty") ? "active" : ""}"><label><input type="checkbox" data-select-rag-source="rickandmorty" ${selected.has("rickandmorty") ? "checked" : ""}> Rick and Morty API</label></span>`;
    const configuredSources = ragConfiguredSources.map(source => `<span class="rag-source-chip ${selected.has(source.id) ? "active" : ""}"><label><input type="checkbox" data-select-rag-source="${escaparHTML(source.id)}" ${selected.has(source.id) ? "checked" : ""}> ${escaparHTML(source.name)} · API</label><button type="button" data-edit-rag-source="${escaparHTML(source.id)}" aria-label="Editar ${escaparHTML(source.name)}">✎</button><button type="button" data-remove-rag-source="${escaparHTML(source.id)}" aria-label="Eliminar ${escaparHTML(source.name)}">×</button></span>`).join("");
    sourceList.innerHTML = pokemonSource + rickAndMortySource + configuredSources;
  };

  activeSelect.addEventListener("change", refreshSources);
  sourceList.addEventListener("click", event => {
    const target = event.target as HTMLElement;
    const editId = target.dataset.editRagSource;
    if (editId) {
      const source = ragConfiguredSources.find(item => item.id === editId);
      if (!source) return;
      editingSourceId = source.id;
      nameInput.value = source.name;
      urlInput.value = source.url || "";
      methodSelect.value = source.method || "GET";
      headersInput.value = JSON.stringify(source.headers || {}, null, 2);
      itemsPathInput.value = source.itemsPath || "";
      titlePathInput.value = source.titlePath || "";
      imagePathInput.value = source.imagePath || "";
      descriptionPathInput.value = source.descriptionPath || "";
      activeSelect.value = source.id;
      (addButton as HTMLButtonElement).textContent = "Guardar cambios";
      refreshSources();
      return;
    }
    const removeId = target.dataset.removeRagSource;
    if (!removeId) return;
    ragConfiguredSources = ragConfiguredSources.filter(source => source.id !== removeId);
    if (editingSourceId === removeId) {
      editingSourceId = null;
      (addButton as HTMLButtonElement).textContent = "Agregar fuente";
      nameInput.value = "";
      urlInput.value = "";
      headersInput.value = "";
      itemsPathInput.value = "";
      titlePathInput.value = "";
      imagePathInput.value = "";
      descriptionPathInput.value = "";
    }
    guardarFuentesRag();
    refreshSources();
  });
  sourceList.addEventListener("change", event => {
    const target = event.target as HTMLInputElement;
    const sourceId = target.dataset.selectRagSource;
    if (!sourceId) return;
    for (const option of Array.from(activeSelect.options)) {
      if (option.value === sourceId) option.selected = target.checked;
    }
    refreshSources();
  });
  addButton.addEventListener("click", async () => {
    try {
      const name = nameInput.value.trim() || "Nueva fuente API";
      const source: RagConfiguredSource = {
        id: editingSourceId || `source-${Date.now()}`,
        name,
        type: "api"
      };
      const url = urlInput.value.trim();
      if (!url) throw new Error("Indica la URL de consulta de la API.");
      let headers: Record<string, string> = {};
      if (headersInput.value.trim()) {
        const parsed: unknown = JSON.parse(headersInput.value);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Los headers deben ser un objeto JSON.");
        headers = parsed as Record<string, string>;
      }
      source.url = url;
      source.method = methodSelect.value as "GET" | "POST";
      source.headers = headers;
      source.itemsPath = itemsPathInput.value.trim() || undefined;
      source.titlePath = titlePathInput.value.trim() || undefined;
      source.imagePath = imagePathInput.value.trim() || undefined;
      source.descriptionPath = descriptionPathInput.value.trim() || undefined;
      const wasEditing = editingSourceId !== null;
      if (editingSourceId) {
        ragConfiguredSources = ragConfiguredSources.map(item => item.id === editingSourceId ? source : item);
      } else {
        ragConfiguredSources.push(source);
      }
      const savedId = source.id;
      editingSourceId = null;
      guardarFuentesRag();
      refreshSources();
      Array.from(activeSelect.options).forEach(option => {
        option.selected = option.value === savedId;
      });
      refreshSources();
      nameInput.value = "";
      urlInput.value = "";
      headersInput.value = "";
      itemsPathInput.value = "";
      titlePathInput.value = "";
      imagePathInput.value = "";
      descriptionPathInput.value = "";
      (addButton as HTMLButtonElement).textContent = "Agregar fuente";
      const status = document.getElementById("ragStatus");
      if (status) status.textContent = `Fuente API ${source.name} ${wasEditing ? "actualizada" : "guardada"}.`;
    } catch (error) {
      const status = document.getElementById("ragStatus");
      if (status) status.textContent = error instanceof Error ? error.message : "No se pudo agregar la fuente.";
    }
  });

  refreshSources();
}

inicializarFuentesRag();

function renderizarCoincidenciasDocumentales(contexts: Array<{ id: string; name: string; groupName?: string; matches: Array<{ line: number; text: string }> }>): string {
  return contexts.map(context => `<section class="rag-context-match"><h4>${escaparHTML(context.name)}${context.groupName ? ` <small>· ${escaparHTML(context.groupName)}</small>` : ""}</h4>${context.matches.length
    ? context.matches.map(match => `<p><strong>Línea ${match.line}:</strong> ${escaparHTML(match.text)}</p>`).join("")
    : `<p>No se encontraron coincidencias en este grupo de documentos.</p>`}</section>`).join("");
}

async function leerDocumentoComoTexto(file: File): Promise<string> {
  if (file.size > 8 * 1024 * 1024) throw new Error("El archivo supera el límite de 8 MB.");
  const extension = file.name.split(".").pop()?.toLocaleLowerCase();
  if (extension === "xlsx" || extension === "csv") {
    const rows = extension === "xlsx" ? await parsearXLSX(file) : parsearCSV(await file.text());
    if (!rows.length) throw new Error("El archivo no contiene filas de datos.");
    return rows.map(row => Object.entries(row).map(([key, value]) => `${key}: ${String(value)}`).join(" | ")).join("\n");
  }
  if (!["txt", "md", "json"].includes(extension || "")) throw new Error("Formato no admitido. Usa TXT, Markdown, JSON, CSV o XLSX.");
  const content = await file.text();
  if (!content.trim()) throw new Error("El archivo está vacío.");
  return content;
}

function inicializarBibliotecaRag(): void {
  const fileInput = document.getElementById("ragDocumentFile") as HTMLInputElement | null;
  const groupInput = document.getElementById("ragDocumentGroup") as HTMLInputElement | null;
  const newGroupName = document.getElementById("ragNewGroupName") as HTMLInputElement | null;
  const newGroupField = document.getElementById("ragNewGroupField");
  const queryContext = document.getElementById("ragQueryContext") as HTMLSelectElement | null;
  const uploadButton = document.getElementById("ragUploadDocument") as HTMLButtonElement | null;
  const status = document.getElementById("ragDocumentStatus");
  const list = document.getElementById("ragDocumentsList");
  const count = document.getElementById("ragDocumentCount");
  const dialog = document.getElementById("ragEditDialog") as HTMLDialogElement | null;
  const editForm = document.getElementById("ragEditForm") as HTMLFormElement | null;
  const editId = document.getElementById("ragEditId") as HTMLInputElement | null;
  const editName = document.getElementById("ragEditName") as HTMLInputElement | null;
  const editGroup = document.getElementById("ragEditGroup") as HTMLInputElement | null;
  const editContent = document.getElementById("ragEditContent") as HTMLTextAreaElement | null;
  const editCancel = document.getElementById("ragEditCancel");
  if (!fileInput || !groupInput || !newGroupName || !newGroupField || !queryContext || !uploadButton || !status || !list || !count || !dialog || !editForm || !editId || !editName || !editGroup || !editContent || !editCancel) return;

  let documents: RagDocumentMeta[] = [];
  const setStatus = (message: string, error = false): void => {
    status.textContent = message;
    status.classList.toggle("ai-error", error);
  };
  const apiRequest = async (url: string, init?: RequestInit): Promise<any> => {
    const response = await fetch(url, init);
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || "Falló la operación sobre el contexto.");
    return result.data;
  };
  const refresh = async (): Promise<void> => {
    try {
      const result = await apiRequest("/api/rag/contexts");
      documents = result as RagDocumentMeta[];
      ragDocumentMetadata = documents;
      const groups = new Map<string, RagDocumentMeta[]>();
      for (const item of documents) {
        const groupName = item.groupName || "Sin grupo";
        groups.set(groupName, [...(groups.get(groupName) || []), item]);
      }
      const selectedQueryContext = queryContext.value;
      queryContext.innerHTML = `<option value="">No incluir documentos</option><option value="*">Todos los documentos</option>${[...groups.keys()].map(groupName => `<option value="${escaparHTML(groupName)}">${escaparHTML(groupName)} · ${groups.get(groupName)?.length || 0} archivos</option>`).join("")}`;
      if (selectedQueryContext === "*" || groups.has(selectedQueryContext)) queryContext.value = selectedQueryContext;
      else queryContext.value = "";
      const selectedUploadGroup = groupInput.value;
      groupInput.innerHTML = `<option value="__new">Crear grupo nuevo…</option>${[...groups.keys()].map(groupName => `<option value="${escaparHTML(groupName)}">${escaparHTML(groupName)}</option>`).join("")}`;
      if (groups.has(selectedUploadGroup)) groupInput.value = selectedUploadGroup;
      else groupInput.value = "__new";
      newGroupField.hidden = groupInput.value !== "__new";
      list.innerHTML = documents.length ? [...groups.entries()].map(([groupName, groupDocuments]) => `
        <section class="rag-doc-group">
          <div class="rag-doc-group-header"><strong>${escaparHTML(groupName)} · ${groupDocuments.length} archivos</strong><div><button type="button" data-rag-group-rename="${escaparHTML(groupName)}">Renombrar grupo</button><button type="button" class="rag-delete-context" data-rag-group-delete="${escaparHTML(groupName)}">Eliminar grupo</button></div></div>
          ${groupDocuments.map(document => `
        <article class="rag-document-row" data-rag-document="${escaparHTML(document.id)}">
          <div class="rag-document-meta"><strong>${escaparHTML(document.name)}</strong><small>${escaparHTML(document.sourceName)} · ${document.size.toLocaleString()} caracteres · actualizado ${new Date(document.updatedAt).toLocaleString()}</small></div>
          <div class="rag-document-actions"><button type="button" data-rag-doc-edit="${escaparHTML(document.id)}">Editar</button><button type="button" data-rag-doc-replace="${escaparHTML(document.id)}">Reemplazar</button><button type="button" class="rag-delete-context" data-rag-doc-delete="${escaparHTML(document.id)}">Eliminar</button></div>
        </article>`).join("")}
        </section>`).join("") : `<div class="rag-doc-empty">Todavía no hay documentos en el RAG. Sube el primero con el formulario.</div>`;
      count.textContent = `${documents.length} archivos en ${groups.size} grupos.`;
      setStatus(`${documents.length} documentos disponibles en ${groups.size} grupos.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "No se pudo cargar la biblioteca RAG.", true);
    }
  };

  groupInput.addEventListener("change", () => { newGroupField.hidden = groupInput.value !== "__new"; });
  queryContext.addEventListener("change", () => {
    const activeSource = document.getElementById("ragActiveSource") as HTMLSelectElement | null;
    if (!activeSource) return;
    if (queryContext.value) activeSource.value = "documents";
    else if (!queryContext.value && activeSource.value === "documents") activeSource.value = "pokemon";
  });

  uploadButton.addEventListener("click", async () => {
    const files = Array.from(fileInput.files || []);
    if (!files.length) { setStatus("Selecciona uno o varios archivos.", true); return; }
    const groupName = groupInput.value === "__new" ? newGroupName.value.trim() : groupInput.value;
    if (!groupName) { setStatus("Escribe el nombre del grupo nuevo.", true); newGroupName.focus(); return; }
    uploadButton.disabled = true;
    try {
      for (const file of files) {
        const content = await leerDocumentoComoTexto(file);
        await apiRequest("/api/rag/contexts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: file.name, groupName, sourceName: file.name, content }) });
      }
      const activeSource = document.getElementById("ragActiveSource") as HTMLSelectElement | null;
      if (activeSource) activeSource.value = "documents";
      newGroupName.value = "";
      fileInput.value = "";
      await refresh();
      groupInput.value = groupName;
      newGroupField.hidden = true;
      queryContext.value = groupName;
      setStatus(`Se agregaron ${files.length} archivo(s) al grupo “${groupName}”.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "No se pudo subir el documento.", true);
    } finally { uploadButton.disabled = false; }
  });

  list.addEventListener("click", async event => {
    const target = event.target as HTMLElement;
    const renameGroup = target.dataset.ragGroupRename;
    const deleteGroup = target.dataset.ragGroupDelete;
    const deleteId = target.dataset.ragDocDelete;
    const replaceId = target.dataset.ragDocReplace;
    const openEditId = target.dataset.ragDocEdit;
    try {
      if (renameGroup) {
        const nextName = prompt("Nuevo nombre del grupo:", renameGroup)?.trim();
        if (!nextName || nextName === renameGroup) return;
        const queryWasOnGroup = queryContext.value === renameGroup;
        const uploadWasOnGroup = groupInput.value === renameGroup;
        await apiRequest(`/api/rag/context-groups/${encodeURIComponent(renameGroup)}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: nextName }) });
        await refresh();
        if (queryWasOnGroup) queryContext.value = nextName;
        if (uploadWasOnGroup) groupInput.value = nextName;
        setStatus(`Se renombró el grupo a “${nextName}”.`);
      } else if (deleteGroup) {
        const groupDocuments = documents.filter(item => (item.groupName || "Sin grupo") === deleteGroup);
        if (!confirm(`¿Eliminar el grupo “${deleteGroup}” y sus ${groupDocuments.length} archivos?`)) return;
        await apiRequest(`/api/rag/context-groups/${encodeURIComponent(deleteGroup)}`, { method: "DELETE" });
        if (queryContext.value === deleteGroup) queryContext.value = "";
        if (groupInput.value === deleteGroup) groupInput.value = "__new";
        await refresh();
        setStatus(`Se eliminó el grupo “${deleteGroup}” y sus archivos.`);
      } else if (deleteId) {
        const document = documents.find(item => item.id === deleteId);
        if (!document || !confirm(`¿Eliminar “${document.name}” del RAG?`)) return;
        await apiRequest(`/api/rag/contexts/${encodeURIComponent(deleteId)}`, { method: "DELETE" });
        await refresh();
        setStatus(`Se eliminó “${document.name}”.`);
      } else if (openEditId) {
        const document = await apiRequest(`/api/rag/contexts/${encodeURIComponent(openEditId)}`) as { id: string; name: string; groupName: string; content: string };
        editId.value = document.id;
        editName.value = document.name;
        editGroup.value = document.groupName || "Sin grupo";
        editContent.value = document.content;
        dialog.showModal();
      } else if (replaceId) {
        const replacementInput = document.createElement("input");
        replacementInput.type = "file";
        replacementInput.accept = ".txt,.md,.json,.csv,.xlsx";
        replacementInput.addEventListener("change", async () => {
          const file = replacementInput.files?.[0];
          const previous = documents.find(item => item.id === replaceId);
          if (!file || !previous) return;
          try {
            const content = await leerDocumentoComoTexto(file);
            await apiRequest(`/api/rag/contexts/${encodeURIComponent(replaceId)}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: previous.name, groupName: previous.groupName, sourceName: file.name, content }) });
            await refresh();
        setStatus(`Se reemplazó el contenido del documento “${previous.name}”.`);
          } catch (error) { setStatus(error instanceof Error ? error.message : "No se pudo reemplazar el documento.", true); }
        }, { once: true });
        replacementInput.click();
      }
    } catch (error) { setStatus(error instanceof Error ? error.message : "No se pudo completar la acción.", true); }
  });

  editCancel.addEventListener("click", () => dialog.close());
  editForm.addEventListener("submit", async event => {
    event.preventDefault();
    try {
      const previousGroup = documents.find(item => item.id === editId.value)?.groupName;
      await apiRequest(`/api/rag/contexts/${encodeURIComponent(editId.value)}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: editName.value, groupName: editGroup.value, content: editContent.value }) });
      dialog.close();
      if (queryContext.value === previousGroup && previousGroup !== editGroup.value) queryContext.value = "";
      await refresh();
      setStatus("Se guardaron los cambios del documento.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "No se pudo guardar el contexto.", true); }
  });
  void refresh();
}

inicializarBibliotecaRag();


const searchInput =
  document.getElementById(
    "search"
  ) as HTMLInputElement;

const typeFilter =
  document.getElementById(
    "typeFilter"
  ) as HTMLSelectElement;

const resultsContainer =
  document.getElementById(
    "results"
  ) as HTMLDivElement;

const paginationContainer =
  document.getElementById(
    "pagination"
  ) as HTMLDivElement;

const detailsContainer =
  document.getElementById(
    "details"
  ) as HTMLDivElement;

const searchButton =
  document.getElementById(
    "searchButton"
  ) as HTMLButtonElement;

const collectionNameInput =
  document.getElementById(
    "collectionName"
  ) as HTMLInputElement;

const createCollectionButton =
  document.getElementById(
    "createCollectionButton"
  ) as HTMLButtonElement;

const collectionsContainer =
  document.getElementById(
    "collections"
  ) as HTMLDivElement;

const limit = 10;


interface Pokemon {
  id?: number;
  name: string;
  image?: string;
  types: string[];
  abilities: string[];
  stats?: Record<string, number>;
  evolution?: string[];
}


interface PokemonListResponse {

  data: {
    name: string;
    url: string;
  }[];

  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}


interface Collection {
  id: number;
  name: string;
  organization_id: number;
  created_at: string;
}


interface Favorite {
  id: number;
  pokemon_id: number;
  pokemon_name: string;
  collection_id: number;
  created_at: string;
}


/* ==================================================
   OBTENER POKEMON
================================================== */

async function obtenerPokemon(
  nombre: string
): Promise<Pokemon> {

  const response =
    await fetch(
      `${API_URL}/${encodeURIComponent(nombre)}`
    );

  if (response.status === 404) {

    throw new Error(
      "Pokémon no encontrado"
    );
  }

  if (!response.ok) {

    throw new Error(
      "Error del servidor"
    );
  }

  return response.json();
}


/* ==================================================
   BUSCAR POKEMON
================================================== */

async function buscarPokemon(): Promise<void> {

  const nombre =
    searchInput.value
      .trim()
      .toLowerCase();

  if (!nombre) {

    cargarPokemons(1);

    return;
  }

  resultsContainer.innerHTML = `
    <p>
      Buscando Pokémon...
    </p>
  `;

  paginationContainer.innerHTML =
    "";

  try {

    const response =
      await fetch(
        `${API_URL}/search?name=${encodeURIComponent(nombre)}`
      );

    if (response.status === 404) {

      throw new Error(
        "Pokémon no encontrado"
      );
    }

    if (!response.ok) {

      throw new Error(
        "Error del servidor"
      );
    }

    const result =
      await response.json();

    mostrarPokemonBusqueda(
      result.data
    );

  } catch (error) {

    mostrarError(
      error instanceof Error
        ? error.message
        : "No se pudo realizar la búsqueda."
    );
  }
}


/* ==================================================
   MOSTRAR RESULTADO BUSQUEDA
================================================== */

function mostrarPokemonBusqueda(
  pokemon: Pokemon
): void {

  resultsContainer.innerHTML = `

    <div class="pokemon-card">

      <img
        src="${pokemon.image}"
        alt="${pokemon.name}"
      >

      <h3>
        ${pokemon.name}
      </h3>

      <p>
        <strong>Tipos:</strong>
        ${pokemon.types.join(", ")}
      </p>

      <button
        id="searchDetailsButton"
      >
        Ver detalles
      </button>

    </div>

  `;

  const button =
    document.getElementById(
      "searchDetailsButton"
    ) as HTMLButtonElement;

  button.addEventListener(
    "click",
    () => {

      mostrarDetalles(
        pokemon.name
      );

    }
  );
}


/* ==================================================
   ORGANIZACION
================================================== */

function crearSelectorOrganizacion(): void {

  const wrapper =
    document.createElement(
      "div"
    );

  wrapper.style.marginBottom =
    "20px";

  wrapper.innerHTML = `

    <label
      for="organizationSelect"
    >
      Organización:
    </label>

    <select id="organizationSelect">

      <option value="1">
        Organización Alpha
      </option>

      <option value="2">
        Organización Beta
      </option>

    </select>

  `;

  const select =
    wrapper.querySelector(
      "#organizationSelect"
    ) as HTMLSelectElement;

  select.value =
    String(
      ORGANIZATION_ID
    );

  select.addEventListener(
    "change",
    () => {

      ORGANIZATION_ID =
        Number(
          select.value
        );

      detailsContainer.innerHTML =
        "";

      cargarColecciones();

    }
  );

  collectionsContainer
    .parentElement
    ?.insertBefore(
      wrapper,
      collectionsContainer
    );
}


/* ==================================================
   CARGAR POKEMON
================================================== */

async function cargarPokemons(
  page: number = 1
): Promise<void> {

  resultsContainer.innerHTML = `

    <p>
      Cargando Pokémon...
    </p>

  `;

  try {

    const tipo =
      typeFilter.value;

    let url =
      `${API_URL}?page=${page}&limit=${limit}`;

    if (tipo) {

      url +=
        `&type=${encodeURIComponent(tipo)}`;

    }

    const response =
      await fetch(url);

    if (!response.ok) {

      throw new Error(
        "No se pudieron obtener los Pokémon"
      );
    }

    const result:
      PokemonListResponse =
      await response.json();

    mostrarLista(
      result.data
    );

    mostrarPaginacion(
      result.pagination
    );

  } catch (error) {

    mostrarError(
      error instanceof Error
        ? error.message
        : "Error al cargar los Pokémon."
    );
  }
}


/* ==================================================
   MOSTRAR LISTA
================================================== */

function mostrarLista(
  pokemons:
    PokemonListResponse["data"]
): void {

  resultsContainer.innerHTML =
    "";

  if (
    pokemons.length === 0
  ) {

    resultsContainer.innerHTML = `

      <p>
        No se encontraron Pokémon.
      </p>

    `;

    return;
  }

  pokemons.forEach(
    (pokemon) => {

      const id =
        obtenerIdDesdeUrl(
          pokemon.url
        );

      const card =
        document.createElement(
          "div"
        );

      card.className =
        "pokemon-card";

      card.innerHTML = `

        <img
          src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png"
          alt="${pokemon.name}"
        >

        <h3>
          ${pokemon.name}
        </h3>

        <button>
          Ver detalles
        </button>

      `;

      const button =
        card.querySelector(
          "button"
        ) as HTMLButtonElement;

      button.addEventListener(
        "click",
        () => {

          mostrarDetalles(
            pokemon.name
          );

        }
      );

      resultsContainer.appendChild(
        card
      );

    }
  );
}


/* ==================================================
   OBTENER ID
================================================== */

function obtenerIdDesdeUrl(
  url: string
): string {

  const partes =
    url.split("/");

  return partes[
    partes.length - 2
  ];
}


/* ==================================================
   PAGINACION
================================================== */

function mostrarPaginacion(
  pagination:
    PokemonListResponse["pagination"]
): void {

  paginationContainer.innerHTML =
    "";

  const anterior =
    document.createElement(
      "button"
    );

  anterior.textContent =
    "Anterior";

  anterior.disabled =
    pagination.page === 1;

  anterior.addEventListener(
    "click",
    () => {

      detailsContainer.innerHTML =
        "";

      cargarPokemons(
        pagination.page - 1
      );

    }
  );

  const pagina =
    document.createElement(
      "span"
    );

  pagina.textContent =
    `Página ${pagination.page} de ${pagination.totalPages}`;

  const siguiente =
    document.createElement(
      "button"
    );

  siguiente.textContent =
    "Siguiente";

  siguiente.disabled =
    pagination.page ===
    pagination.totalPages;

  siguiente.addEventListener(
    "click",
    () => {

      detailsContainer.innerHTML =
        "";

      cargarPokemons(
        pagination.page + 1
      );

    }
  );

  paginationContainer.appendChild(
    anterior
  );

  paginationContainer.appendChild(
    pagina
  );

  paginationContainer.appendChild(
    siguiente
  );
}


/* ==================================================
   DETALLES
================================================== */

async function mostrarDetalles(
  nombre: string
): Promise<void> {

  detailsContainer.innerHTML = `

    <p>
      Cargando información...
    </p>

  `;

  try {

    const pokemon =
      await obtenerPokemon(
        nombre
      );

    detailsContainer.innerHTML = `

      <div class="pokemon-details">

        <h2>
          ${pokemon.name}
        </h2>

        <img
          src="${pokemon.image}"
          alt="${pokemon.name}"
          width="200"
        >

        <p>

          <strong>
            Tipos:
          </strong>

          ${pokemon.types.join(", ")}

        </p>

        <p>

          <strong>
            Habilidades:
          </strong>

          ${pokemon.abilities.join(", ")}

        </p>

        <h3>
          Estadísticas
        </h3>

        <ul>

          ${
            pokemon.stats
              ? Object.entries(
                  pokemon.stats
                )

                  .map(
                    ([nombre, valor]) => `

                      <li>
                        ${nombre}: ${valor}
                      </li>

                    `
                  )

                  .join("")

              : `

                  <li>
                    No disponibles
                  </li>

                `
          }

        </ul>

        <h3>
          Evolución
        </h3>

        <p>

          ${
            pokemon.evolution
              ? pokemon.evolution.join(
                  " → "
                )
              : "No disponible"
          }

        </p>

        <button
          id="favoriteButton"
          class="favorite-button"
        >
          ⭐ Agregar a favoritos
        </button>

        <button id="closeDetails">
          Cerrar detalles
        </button>

        <div id="favoriteMessage"></div>

      </div>

    `;

    const favoriteButton =
      document.getElementById(
        "favoriteButton"
      ) as HTMLButtonElement;

    favoriteButton.addEventListener(
      "click",
      () => {

        mostrarSelectorColeccion(
          pokemon
        );

      }
    );

    const closeButton =
      document.getElementById(
        "closeDetails"
      ) as HTMLButtonElement;

    closeButton.addEventListener(
      "click",
      () => {

        detailsContainer.innerHTML =
          "";

        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });

      }
    );

    detailsContainer.scrollIntoView({
      behavior: "smooth"
    });

  } catch (error) {

    detailsContainer.innerHTML = `

      <p>

        ${
          error instanceof Error
            ? error.message
            : "No se pudo obtener la información."
        }

      </p>

    `;

  }
}


/* ==================================================
   SELECTOR DE COLECCION
================================================== */

async function mostrarSelectorColeccion(
  pokemon: Pokemon
): Promise<void> {

  const message =
    document.getElementById(
      "favoriteMessage"
    ) as HTMLDivElement;

  message.innerHTML = `

    <p>
      Cargando colecciones...
    </p>

  `;

  try {

    const response =
      await fetch(
        `${COLLECTIONS_URL}?organizationId=${ORGANIZATION_ID}`
      );

    if (!response.ok) {

      throw new Error(
        "No se pudieron cargar las colecciones"
      );

    }

    const collections:
      Collection[] =
      await response.json();

    if (
      collections.length === 0
    ) {

      message.innerHTML = `

        <p>

          No tienes colecciones.
          Crea una en la sección
          "Mis colecciones".

        </p>

      `;

      return;
    }

    message.innerHTML = `

      <div
        style="margin-top: 15px;"
      >

        <label>
          Selecciona una colección:
        </label>

        <select id="collectionSelect">

          ${
            collections
              .map(
                collection => `

                  <option
                    value="${collection.id}"
                  >

                    ${collection.name}

                  </option>

                `
              )
              .join("")
          }

        </select>

        <button
          id="saveFavoriteButton"
        >
          Guardar
        </button>

      </div>

    `;

    const saveButton =
      document.getElementById(
        "saveFavoriteButton"
      ) as HTMLButtonElement;

    saveButton.addEventListener(
      "click",
      async () => {

        const select =
          document.getElementById(
            "collectionSelect"
          ) as HTMLSelectElement;

        const collectionId =
          Number(
            select.value
          );

        await guardarFavorito(
          pokemon,
          collectionId
        );

      }
    );

  } catch (error) {

    message.innerHTML = `

      <p>

        ${
          error instanceof Error
            ? error.message
            : "Error cargando colecciones."
        }

      </p>

    `;

  }
}


/* ==================================================
   GUARDAR FAVORITO
================================================== */

async function guardarFavorito(
  pokemon: Pokemon,
  collectionId: number
): Promise<void> {

  const message =
    document.getElementById(
      "favoriteMessage"
    ) as HTMLDivElement;

  try {

    const response =
      await fetch(
        `${COLLECTIONS_URL}/${collectionId}/favorites`,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              pokemonId:
                pokemon.id,

              pokemonName:
                pokemon.name,

              organizationId:
                ORGANIZATION_ID
            })
        }
      );

    const result =
      await response.json();

    if (!response.ok) {

      throw new Error(
        result.message ||
        "No se pudo guardar el favorito"
      );

    }

    message.innerHTML = `

      <p>
        ⭐ Pokémon guardado correctamente.
      </p>

    `;

    cargarColecciones();

  } catch (error) {

    message.innerHTML = `

      <p>

        ${
          error instanceof Error
            ? error.message
            : "Error al guardar el favorito."
        }

      </p>

    `;

  }
}


/* ==================================================
   CARGAR COLECCIONES
================================================== */

async function cargarColecciones(): Promise<void> {

  try {

    const response =
      await fetch(
        `${COLLECTIONS_URL}?organizationId=${ORGANIZATION_ID}`
      );

    if (!response.ok) {

      throw new Error(
        "Error obteniendo colecciones"
      );

    }

    const collections:
      Collection[] =
      await response.json();

    collectionsContainer.innerHTML =
      "";

    if (
      collections.length === 0
    ) {

      collectionsContainer.innerHTML = `

        <p>
          No tienes colecciones todavía.
        </p>

      `;

      return;
    }

    for (
      const collection
      of collections
    ) {

      const div =
        document.createElement(
          "div"
        );

      div.className =
        "collection-card";

      div.innerHTML = `

        <h3>
          ${collection.name}
        </h3>

        <button
          class="view-favorites-button"
          data-id="${collection.id}"
        >
          Ver favoritos
        </button>

        <button
          class="delete-collection-button"
          data-id="${collection.id}"
        >
          Eliminar colección
        </button>

        <div
          id="favorites-${collection.id}"
        ></div>

      `;

      collectionsContainer.appendChild(
        div
      );
    }

    const viewButtons =
      document.querySelectorAll(
        ".view-favorites-button"
      );

    viewButtons.forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const id =
              Number(
                (button as HTMLElement)
                  .dataset.id
              );

            cargarFavoritos(
              id
            );

          }
        );

      }
    );

    const deleteButtons =
      document.querySelectorAll(
        ".delete-collection-button"
      );

    deleteButtons.forEach(
      button => {

        button.addEventListener(
          "click",
          async () => {

            const id =
              Number(
                (button as HTMLElement)
                  .dataset.id
              );

            await eliminarColeccion(
              id
            );

          }
        );

      }
    );

  } catch (error) {

    collectionsContainer.innerHTML = `

      <p>
        No se pudieron cargar las colecciones.
      </p>

    `;

  }
}


/* ==================================================
   CARGAR FAVORITOS
================================================== */

async function cargarFavoritos(
  collectionId: number
): Promise<void> {

  const container =
    document.getElementById(
      `favorites-${collectionId}`
    ) as HTMLDivElement;

  container.innerHTML = `

    <p>
      Cargando favoritos...
    </p>

  `;

  try {

    const response =
      await fetch(
        `${COLLECTIONS_URL}/${collectionId}/favorites?organizationId=${ORGANIZATION_ID}`
      );

    if (!response.ok) {

      throw new Error(
        "No se pudieron obtener los favoritos"
      );

    }

    const favorites:
      Favorite[] =
      await response.json();

    if (
      favorites.length === 0
    ) {

      container.innerHTML = `

        <p>
          Esta colección no tiene favoritos.
        </p>

      `;

      return;
    }

    container.innerHTML =
      favorites
        .map(
          favorite => `

            <div
              class="favorite-item"
            >

              <span>
                ⭐ ${favorite.pokemon_name}
              </span>

              <button
                data-collection="${collectionId}"
                data-pokemon="${favorite.pokemon_id}"
                class="delete-favorite-button"
              >
                Eliminar
              </button>

            </div>

          `
        )
        .join("");

    const buttons =
      container.querySelectorAll(
        ".delete-favorite-button"
      );

    buttons.forEach(
      button => {

        button.addEventListener(
          "click",
          async () => {

            const element =
              button as HTMLElement;

            const collection =
              Number(
                element.dataset.collection
              );

            const pokemon =
              Number(
                element.dataset.pokemon
              );

            await eliminarFavorito(
              collection,
              pokemon
            );

            cargarFavoritos(
              collection
            );

          }
        );

      }
    );

  } catch (error) {

    container.innerHTML = `

      <p>
        Error cargando favoritos.
      </p>

    `;

  }
}


/* ==================================================
   ELIMINAR FAVORITO
================================================== */

async function eliminarFavorito(
  collectionId: number,
  pokemonId: number
): Promise<void> {

  try {

    const response =
      await fetch(
        `${COLLECTIONS_URL}/${collectionId}/favorites/${pokemonId}?organizationId=${ORGANIZATION_ID}`,
        {
          method:
            "DELETE"
        }
      );

    if (!response.ok) {

      const result =
        await response.json();

      throw new Error(
        result.message ||
        "No se pudo eliminar"
      );

    }

  } catch (error) {

    alert(
      error instanceof Error
        ? error.message
        : "Error eliminando favorito"
    );

  }
}


/* ==================================================
   CREAR COLECCION
================================================== */

async function crearColeccion(): Promise<void> {

  const name =
    collectionNameInput.value
      .trim();

  if (!name) {

    alert(
      "Escribe un nombre para la colección."
    );

    return;
  }

  try {

    const response =
      await fetch(
        COLLECTIONS_URL,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              name,
              organizationId:
                ORGANIZATION_ID
            })
        }
      );

    const result =
      await response.json();

    if (!response.ok) {

      throw new Error(
        result.message ||
        "No se pudo crear la colección"
      );

    }

    collectionNameInput.value =
      "";

    cargarColecciones();

  } catch (error) {

    alert(
      error instanceof Error
        ? error.message
        : "Error creando colección."
    );

  }
}


/* ==================================================
   ELIMINAR COLECCION
================================================== */

async function eliminarColeccion(
  collectionId: number
): Promise<void> {

  const confirmar =
    confirm(
      "¿Quieres eliminar esta colección?"
    );

  if (!confirmar) {
    return;
  }

  try {

    const response =
      await fetch(
        `${COLLECTIONS_URL}/${collectionId}?organizationId=${ORGANIZATION_ID}`,
        {
          method:
            "DELETE"
        }
      );

    if (!response.ok) {

      throw new Error(
        "No se pudo eliminar la colección"
      );

    }

    cargarColecciones();

  } catch (error) {

    alert(
      error instanceof Error
        ? error.message
        : "Error eliminando colección."
    );

  }
}


/* ==================================================
   AI TOOLS
================================================== */

function capitalize(
  value: string
): string {

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
}


function mostrarJSON(
  element: HTMLElement,
  result: unknown
): void {

  element.textContent =
    JSON.stringify(
      result,
      null,
      2
    );
}


function mostrarErrorVisual(
  container: HTMLElement,
  result: any
): void {

  const message =
    result?.error?.message ||
    "No se pudo ejecutar la herramienta.";

  container.innerHTML = `

    <div class="ai-error">

      <strong>
        Error
      </strong>

      <p>
        ${message}
      </p>

      ${
        result?.error?.code
          ? `
            <small>
              Código:
              ${result.error.code}
            </small>
          `
          : ""
      }

    </div>

  `;
}


function renderPokemonVisual(
  container: HTMLElement,
  result: any,
  fullDetails = false
): void {

  if (
    !result?.success ||
    !result?.data
  ) {

    mostrarErrorVisual(
      container,
      result
    );

    return;
  }

  const pokemon =
    result.data;

  const types =
    Array.isArray(
      pokemon.types
    )
      ? pokemon.types
      : [];

  const abilities =
    Array.isArray(
      pokemon.abilities
    )
      ? pokemon.abilities
      : [];

  const stats =
    pokemon.stats &&
    typeof pokemon.stats === "object"
      ? Object.entries(
          pokemon.stats
        )
      : [];

  container.innerHTML = `

    <div class="ai-success">

      Herramienta ejecutada correctamente:

      <strong>
        ${result.tool}
      </strong>

    </div>


    <div class="ai-pokemon-card">

      ${
        pokemon.image
          ? `
            <img
              src="${pokemon.image}"
              alt="${pokemon.name}"
            >
          `
          : ""
      }


      <div class="ai-pokemon-info">

        <h3>
          ${pokemon.name}
        </h3>


        <p>

          <strong>
            ID:
          </strong>

          ${pokemon.id}

        </p>


        <p>

          <strong>
            Tipos:
          </strong>

          ${
            types.length
              ? types
                  .map(
                    (type: string) => `

                      <span class="ai-type">
                        ${type}
                      </span>

                    `
                  )
                  .join("")
              : "No disponibles"
          }

        </p>


        ${
          fullDetails &&
          abilities.length
            ? `

              <p>

                <strong>
                  Habilidades:
                </strong>

              </p>

              <div class="ai-abilities">

                ${
                  abilities
                    .map(
                      (ability: string) => `

                        <span class="ai-ability">
                          ${ability}
                        </span>

                      `
                    )
                    .join("")
                }

              </div>

            `
            : ""
        }

      </div>

    </div>


    ${
      fullDetails &&
      stats.length
        ? `

          <div class="ai-stats">

            ${
              stats
                .map(
                  ([name, value]) => `

                    <div class="ai-stat">

                      <strong>
                        ${value}
                      </strong>

                      <span>
                        ${name}
                      </span>

                    </div>

                  `
                )
                .join("")
            }

          </div>

        `
        : ""
    }


    ${
      fullDetails &&
      Array.isArray(
        pokemon.evolution
      )
        ? `

          <div class="ai-evolution">

            <strong>
              Evolución:
            </strong>

            <p>

              ${
                pokemon.evolution.length
                  ? pokemon.evolution.join(
                      " → "
                    )
                  : "No disponible"
              }

            </p>

          </div>

        `
        : ""
    }

  `;
}


function renderComparisonCard(
  pokemon: any
): string {

  const stats =
    pokemon.stats &&
    typeof pokemon.stats === "object"
      ? Object.entries(
          pokemon.stats
        )
      : [];

  return `

    <div class="ai-comparison-card">

      ${
        pokemon.image
          ? `
            <img
              src="${pokemon.image}"
              alt="${pokemon.name}"
            >
          `
          : ""
      }


      <h3>
        ${pokemon.name}
      </h3>


      <p>

        <strong>
          ID:
        </strong>

        ${pokemon.id}

      </p>


      <p>

        <strong>
          Tipos:
        </strong>

        ${
          Array.isArray(
            pokemon.types
          )
            ? pokemon.types
                .map(
                  (type: string) => `

                    <span class="ai-type">
                      ${type}
                    </span>

                  `
                )
                .join("")
            : "No disponibles"
        }

      </p>


      ${
        stats.length
          ? `

            <div class="ai-stats">

              ${
                stats
                  .map(
                    ([name, value]) => `

                      <div class="ai-stat">

                        <strong>
                          ${value}
                        </strong>

                        <span>
                          ${name}
                        </span>

                      </div>

                    `
                  )
                  .join("")
              }

            </div>

          `
          : ""
      }

    </div>

  `;
}


function renderComparisonVisual(
  container: HTMLElement,
  result: any
): void {

  if (
    !result?.success ||
    !result?.data
  ) {

    mostrarErrorVisual(
      container,
      result
    );

    return;
  }

  container.innerHTML = `

    <div class="ai-success">

      Herramienta ejecutada correctamente:

      <strong>
        compare_pokemon
      </strong>

    </div>


    <div class="ai-comparison">

      ${renderComparisonCard(
        result.data.pokemon1
      )}

      ${renderComparisonCard(
        result.data.pokemon2
      )}

    </div>

  `;
}


/* ==================================================
   CAMBIO VISUAL / JSON
================================================== */

function configurarVistaTool(
  toolName: string
): void {

  const buttons =
    document.querySelectorAll(
      `.tool-view-button[data-tool="${toolName}"]`
    );

  const visual =
    document.getElementById(
      `tool${capitalize(toolName)}Visual`
    ) as HTMLElement | null;

  const json =
    document.getElementById(
      `tool${capitalize(toolName)}Result`
    ) as HTMLElement | null;

  if (
    !visual ||
    !json
  ) {

    return;

  }

  /*
   * IMPORTANTE:
   * Al cargar la página:
   *
   * VISUAL = visible
   * JSON = oculto
   */

  visual.hidden =
    false;

  json.hidden =
    true;


  buttons.forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          const view =
            (
              button as HTMLElement
            ).dataset.view;

          buttons.forEach(
            item => {

              item.classList.remove(
                "active"
              );

            }
          );

          button.classList.add(
            "active"
          );


          if (
            view === "json"
          ) {

            visual.hidden =
              true;

            json.hidden =
              false;

          } else {

            visual.hidden =
              false;

            json.hidden =
              true;

          }

        }
      );

    }
  );
}


/* ==================================================
   SEARCH TOOL
================================================== */

async function ejecutarSearchTool(): Promise<void> {

  const input =
    document.getElementById(
      "toolSearchName"
    ) as HTMLInputElement;

  const visual =
    document.getElementById(
      "toolSearchVisual"
    ) as HTMLElement;

  const json =
    document.getElementById(
      "toolSearchResult"
    ) as HTMLElement;

  const name =
    input.value.trim();


  if (!name) {

    const result = {

      success:
        false,

      tool:
        "search_pokemon",

      error: {

        code:
          "INVALID_NAME",

        message:
          "Ingresa un nombre de Pokémon"

      }

    };

    mostrarJSON(
      json,
      result
    );

    mostrarErrorVisual(
      visual,
      result
    );

    return;
  }


  visual.innerHTML = `

    <p>
      Ejecutando herramienta...
    </p>

  `;


  try {

    const response =
      await fetch(
        `${TOOLS_URL}/search`,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              name
            })
        }
      );

    const result =
      await response.json();


    mostrarJSON(
      json,
      result
    );


    renderPokemonVisual(
      visual,
      result,
      false
    );

  } catch {

    const result = {

      success:
        false,

      tool:
        "search_pokemon",

      error: {

        code:
          "NETWORK_ERROR",

        message:
          "No se pudo conectar con el servidor"

      }

    };


    mostrarJSON(
      json,
      result
    );


    mostrarErrorVisual(
      visual,
      result
    );
  }
}


/* ==================================================
   DETAILS TOOL
================================================== */

async function ejecutarDetailsTool(): Promise<void> {

  const input =
    document.getElementById(
      "toolDetailsId"
    ) as HTMLInputElement;

  const visual =
    document.getElementById(
      "toolDetailsVisual"
    ) as HTMLElement;

  const json =
    document.getElementById(
      "toolDetailsResult"
    ) as HTMLElement;

  const id =
    input.value.trim();


  if (!id) {

    const result = {

      success:
        false,

      tool:
        "get_pokemon_details",

      error: {

        code:
          "INVALID_ID",

        message:
          "Ingresa un ID de Pokémon"

      }

    };


    mostrarJSON(
      json,
      result
    );


    mostrarErrorVisual(
      visual,
      result
    );

    return;
  }


  visual.innerHTML = `

    <p>
      Ejecutando herramienta...
    </p>

  `;


  try {

    const response =
      await fetch(
        `${TOOLS_URL}/details`,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              id
            })
        }
      );


    const result =
      await response.json();


    mostrarJSON(
      json,
      result
    );


    renderPokemonVisual(
      visual,
      result,
      true
    );

  } catch {

    const result = {

      success:
        false,

      tool:
        "get_pokemon_details",

      error: {

        code:
          "NETWORK_ERROR",

        message:
          "No se pudo conectar con el servidor"

      }

    };


    mostrarJSON(
      json,
      result
    );


    mostrarErrorVisual(
      visual,
      result
    );
  }
}


/* ==================================================
   COMPARE TOOL
================================================== */

async function ejecutarCompareTool(): Promise<void> {

  const input1 =
    document.getElementById(
      "toolPokemon1"
    ) as HTMLInputElement;

  const input2 =
    document.getElementById(
      "toolPokemon2"
    ) as HTMLInputElement;

  const visual =
    document.getElementById(
      "toolCompareVisual"
    ) as HTMLElement;

  const json =
    document.getElementById(
      "toolCompareResult"
    ) as HTMLElement;


  const pokemon1 =
    input1.value.trim();

  const pokemon2 =
    input2.value.trim();


  if (
    !pokemon1 ||
    !pokemon2
  ) {

    const result = {

      success:
        false,

      tool:
        "compare_pokemon",

      error: {

        code:
          "INVALID_PARAMETERS",

        message:
          "Debes ingresar los dos Pokémon"

      }

    };


    mostrarJSON(
      json,
      result
    );


    mostrarErrorVisual(
      visual,
      result
    );

    return;
  }


  visual.innerHTML = `

    <p>
      Ejecutando comparación...
    </p>

  `;


  try {

    const response =
      await fetch(
        `${TOOLS_URL}/compare`,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              pokemon1,
              pokemon2
            })
        }
      );


    const result =
      await response.json();


    mostrarJSON(
      json,
      result
    );


    renderComparisonVisual(
      visual,
      result
    );

  } catch {

    const result = {

      success:
        false,

      tool:
        "compare_pokemon",

      error: {

        code:
          "NETWORK_ERROR",

        message:
          "No se pudo conectar con el servidor"

      }

    };


    mostrarJSON(
      json,
      result
    );


    mostrarErrorVisual(
      visual,
      result
    );
  }
}


/* ==================================================
   EVENTOS AI TOOLS
================================================== */

const toolSearchButton =
  document.getElementById(
    "toolSearchButton"
  ) as HTMLButtonElement | null;

const toolDetailsButton =
  document.getElementById(
    "toolDetailsButton"
  ) as HTMLButtonElement | null;

const toolCompareButton =
  document.getElementById(
    "toolCompareButton"
  ) as HTMLButtonElement | null;


if (
  toolSearchButton
) {

  toolSearchButton.addEventListener(
    "click",
    ejecutarSearchTool
  );

}


if (
  toolDetailsButton
) {

  toolDetailsButton.addEventListener(
    "click",
    ejecutarDetailsTool
  );

}


if (
  toolCompareButton
) {

  toolCompareButton.addEventListener(
    "click",
    ejecutarCompareTool
  );

}


/* ENTER SEARCH */

const toolSearchInput =
  document.getElementById(
    "toolSearchName"
  ) as HTMLInputElement | null;

if (
  toolSearchInput
) {

  toolSearchInput.addEventListener(
    "keydown",
    (
      event: KeyboardEvent
    ) => {

      if (
        event.key === "Enter"
      ) {

        ejecutarSearchTool();

      }

    }
  );

}


/* ENTER DETAILS */

const toolDetailsInput =
  document.getElementById(
    "toolDetailsId"
  ) as HTMLInputElement | null;

if (
  toolDetailsInput
) {

  toolDetailsInput.addEventListener(
    "keydown",
    (
      event: KeyboardEvent
    ) => {

      if (
        event.key === "Enter"
      ) {

        ejecutarDetailsTool();

      }

    }
  );

}


/* ENTER COMPARE */

const toolPokemon1Input =
  document.getElementById(
    "toolPokemon1"
  ) as HTMLInputElement | null;

const toolPokemon2Input =
  document.getElementById(
    "toolPokemon2"
  ) as HTMLInputElement | null;


if (
  toolPokemon1Input
) {

  toolPokemon1Input.addEventListener(
    "keydown",
    (
      event: KeyboardEvent
    ) => {

      if (
        event.key === "Enter"
      ) {

        ejecutarCompareTool();

      }

    }
  );

}


if (
  toolPokemon2Input
) {

  toolPokemon2Input.addEventListener(
    "keydown",
    (
      event: KeyboardEvent
    ) => {

      if (
        event.key === "Enter"
      ) {

        ejecutarCompareTool();

      }

    }
  );

}


/* CONFIGURAR VISTAS */

configurarVistaTool(
  "search"
);

configurarVistaTool(
  "details"
);

configurarVistaTool(
  "compare"
);


/* ==================================================
   ERROR
================================================== */

function mostrarError(
  mensaje: string
): void {

  resultsContainer.innerHTML = `

    <p>
      ${mensaje}
    </p>

  `;
}


/* ==================================================
   EVENTOS PRINCIPALES
================================================== */

searchButton.addEventListener(
  "click",
  buscarPokemon
);


searchInput.addEventListener(
  "keydown",
  (
    event: KeyboardEvent
  ) => {

    if (
      event.key === "Enter"
    ) {

      buscarPokemon();

    }

  }
);


typeFilter.addEventListener(
  "change",
  () => {

    detailsContainer.innerHTML =
      "";

    cargarPokemons(
      1
    );

  }
);


createCollectionButton.addEventListener(
  "click",
  crearColeccion
);


collectionNameInput.addEventListener(
  "keydown",
  (
    event: KeyboardEvent
  ) => {

    if (
      event.key === "Enter"
    ) {

      crearColeccion();

    }

  }
);


/* ==================================================
   INICIO
================================================== */

cargarPokemons();

crearSelectorOrganizacion();

cargarColecciones();


(
  window as any
).mostrarDetalles =
  mostrarDetalles;

// ============================================================
// ELEVENLABS - ELEMENTOS
// ============================================================

const testPhoneNumber =
  document.getElementById(
    "testPhoneNumber"
  ) as HTMLInputElement | null;

const testCallButton =
  document.getElementById(
    "testCallButton"
  ) as HTMLButtonElement | null;

const testCallStatus =
  document.getElementById(
    "testCallStatus"
  ) as HTMLDivElement | null;

const permanentPrompt =
  document.getElementById(
    "permanentPrompt"
  ) as HTMLTextAreaElement | null;

const loadPermanentPromptButton =
  document.getElementById(
    "loadPermanentPromptButton"
  ) as HTMLButtonElement | null;

const savePermanentPromptButton =
  document.getElementById(
    "savePermanentPromptButton"
  ) as HTMLButtonElement | null;

const permanentPromptStatus =
  document.getElementById(
    "permanentPromptStatus"
  ) as HTMLDivElement | null;

const permanentFirstMessage =
  document.getElementById(
    "permanentFirstMessage"
  ) as HTMLTextAreaElement | null;

const loadAgentConfigurationButton =
  document.getElementById(
    "loadAgentConfigurationButton"
  ) as HTMLButtonElement | null;

const savePermanentFirstMessageButton =
  document.getElementById(
    "savePermanentFirstMessageButton"
  ) as HTMLButtonElement | null;

const permanentFirstMessageStatus =
  document.getElementById(
    "permanentFirstMessageStatus"
  ) as HTMLDivElement | null;

const temporaryPrompt =
  document.getElementById(
    "temporaryPrompt"
  ) as HTMLTextAreaElement | null;

const temporaryFirstMessage =
  document.getElementById(
    "temporaryFirstMessage"
  ) as HTMLTextAreaElement | null;

const clearTemporaryPromptButton =
  document.getElementById(
    "clearTemporaryPromptButton"
  ) as HTMLButtonElement | null;

const temporaryCallButton =
  document.getElementById(
    "temporaryCallButton"
  ) as HTMLButtonElement | null;

const temporaryPromptStatus =
  document.getElementById(
    "temporaryPromptStatus"
  ) as HTMLDivElement | null;


// ============================================================
// UTILIDADES ELEVENLABS
// ============================================================

function mostrarEstadoElevenLabs(
  elemento: HTMLElement | null,
  mensaje: string,
  tipo: "normal" | "loading" | "success" | "error"
): void {

  if (!elemento) {
    return;
  }

  elemento.className =
    `call-test-status ${tipo}`;

  elemento.textContent =
    mensaje;
}


function obtenerMensajeErrorElevenLabs(
  error: unknown
): string {

  return error instanceof Error
    ? error.message
    : "Ocurrió un error desconocido.";
}


function mostrarResultadoLlamada(
  elemento: HTMLElement | null,
  mensaje: string,
  conversationId?: string,
  sipCallId?: string
): void {

  if (!elemento) {
    return;
  }

  elemento.className =
    "call-test-status success";

  elemento.innerHTML = `
    <strong>
      ${mensaje}
    </strong>

    ${
      conversationId
        ? `
          <br>
          <small>
            Conversation ID: ${conversationId}
          </small>
        `
        : ""
    }

    ${
      sipCallId
        ? `
          <br>
          <small>
            SIP Call ID: ${sipCallId}
          </small>
        `
        : ""
    }
  `;
}


interface ElevenLabsResponse {
  success?: boolean;
  message?: string;
  error?: string;
  data?: {
    conversation_id?: string;
    sip_call_id?: string;
  };
  conversation_id?: string;
  sip_call_id?: string;
}


// ============================================================
// ELEVENLABS - CARGAR PROMPT PERMANENTE
// ============================================================

const cargarPromptPermanente =
  async (): Promise<void> => {

    if (!permanentPrompt) {
      return;
    }

    mostrarEstadoElevenLabs(
      permanentPromptStatus,
      "Cargando prompt desde ElevenLabs...",
      "loading"
    );

    try {

      const response =
        await fetch(
          "/api/elevenlabs/prompt"
        );

      const data =
        await response.json();

      if (!response.ok) {

        throw new Error(
          data.message ||
          data.error ||
          "No se pudo cargar el prompt."
        );
      }

      const prompt =
        typeof data === "string"
          ? data
          : data.prompt ||
            data.data?.prompt ||
            "";

      if (!prompt) {

        throw new Error(
          "ElevenLabs no devolvió ningún prompt."
        );
      }

      permanentPrompt.value =
        prompt;

      mostrarEstadoElevenLabs(
        permanentPromptStatus,
        "Prompt cargado correctamente.",
        "success"
      );

    } catch (error) {

      console.error(
        "Error cargando prompt de ElevenLabs:",
        error
      );

      mostrarEstadoElevenLabs(
        permanentPromptStatus,
        `❌ ${obtenerMensajeErrorElevenLabs(error)}`,
        "error"
      );
    }
  };


// ============================================================
// ELEVENLABS - GUARDAR PROMPT PERMANENTE
// ============================================================

const guardarPromptPermanente =
  async (): Promise<void> => {

    if (!permanentPrompt) {
      return;
    }

    const prompt =
      permanentPrompt.value.trim();

    if (!prompt) {

      mostrarEstadoElevenLabs(
        permanentPromptStatus,
        "El prompt no puede estar vacío.",
        "error"
      );

      return;
    }

    mostrarEstadoElevenLabs(
      permanentPromptStatus,
      "Guardando prompt...",
      "loading"
    );

    try {

      const response =
        await fetch(
          "/api/elevenlabs/prompt",
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              prompt
            })
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        throw new Error(
          data.message ||
          data.error ||
          JSON.stringify(data)
        );
      }

      mostrarEstadoElevenLabs(
        permanentPromptStatus,
        "Prompt permanente actualizado correctamente.",
        "success"
      );

    } catch (error) {

      console.error(
        "Error guardando prompt de ElevenLabs:",
        error
      );

      mostrarEstadoElevenLabs(
        permanentPromptStatus,
        `❌ Error al guardar: ${obtenerMensajeErrorElevenLabs(error)}`,
        "error"
      );
    }
  };


// ============================================================
// ELEVENLABS - CARGAR MENSAJE INICIAL PERMANENTE
// ============================================================

const cargarMensajeInicialPermanente =
  async (): Promise<void> => {

    if (!permanentFirstMessage) {
      return;
    }

    mostrarEstadoElevenLabs(
      permanentFirstMessageStatus,
      "Cargando configuración del agente...",
      "loading"
    );

    try {

      const response =
        await fetch(
          "/api/elevenlabs/prompt"
        );

      const data =
        await response.json();

      if (!response.ok) {

        throw new Error(
          data.message ||
          data.error ||
          "No se pudo cargar la configuración."
        );
      }

      const firstMessage =
        data.first_message ||
        data.firstMessage ||
        data.conversation_config?.agent?.first_message ||
        data.conversation_config?.agent?.firstMessage ||
        data.data?.first_message ||
        data.data?.firstMessage ||
        data.data?.conversation_config?.agent?.first_message ||
        data.data?.conversation_config?.agent?.firstMessage ||
        "";

      if (!firstMessage) {

        mostrarEstadoElevenLabs(
          permanentFirstMessageStatus,
          "⚠️ El backend actual no devuelve todavía el mensaje inicial.",
          "normal"
        );

        return;
      }

      permanentFirstMessage.value =
        firstMessage;

      mostrarEstadoElevenLabs(
        permanentFirstMessageStatus,
        "Mensaje inicial cargado correctamente.",
        "success"
      );

    } catch (error) {

      console.error(
        "Error cargando mensaje inicial:",
        error
      );

      mostrarEstadoElevenLabs(
        permanentFirstMessageStatus,
        `❌ ${obtenerMensajeErrorElevenLabs(error)}`,
        "error"
      );
    }
  };


// ============================================================
// ELEVENLABS - GUARDAR MENSAJE INICIAL PERMANENTE
// ============================================================

const guardarMensajeInicialPermanente =
  async (): Promise<void> => {

    if (!permanentFirstMessage) {
      return;
    }

    const firstMessage =
      permanentFirstMessage.value.trim();

    if (!firstMessage) {

      mostrarEstadoElevenLabs(
        permanentFirstMessageStatus,
        "El mensaje inicial no puede estar vacío.",
        "error"
      );

      return;
    }

    mostrarEstadoElevenLabs(
      permanentFirstMessageStatus,
      "Guardando mensaje inicial...",
      "loading"
    );

    try {

      const response =
        await fetch(
          "/api/elevenlabs/first-message",
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              firstMessage
            })
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        throw new Error(
          data.message ||
          data.error ||
          JSON.stringify(data)
        );
      }

      mostrarEstadoElevenLabs(
        permanentFirstMessageStatus,
        "Mensaje inicial actualizado correctamente.",
        "success"
      );

    } catch (error) {

      console.error(
        "Error guardando mensaje inicial:",
        error
      );

      mostrarEstadoElevenLabs(
        permanentFirstMessageStatus,
        `❌ Error al guardar: ${obtenerMensajeErrorElevenLabs(error)}`,
        "error"
      );
    }
  };


// ============================================================
// ELEVENLABS - LLAMADA NORMAL
// ============================================================

const realizarLlamadaElevenLabs =
  async (): Promise<void> => {

    if (!testPhoneNumber) {
      return;
    }

    const toNumber =
      testPhoneNumber.value.trim();

    if (!toNumber) {

      mostrarEstadoElevenLabs(
        testCallStatus,
        "Debes ingresar un número de destino.",
        "error"
      );

      return;
    }

    mostrarEstadoElevenLabs(
      testCallStatus,
      "📞 Iniciando llamada...",
      "loading"
    );

    if (testCallButton) {
      testCallButton.disabled = true;
    }

    try {

      const response =
        await fetch(
          "/api/elevenlabs/test-call",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              toNumber
            })
          }
        );

      const result:
        ElevenLabsResponse =
        await response.json();

      if (!response.ok ||
          !result.success) {

        throw new Error(
          result.error ||
          result.message ||
          "No se pudo iniciar la llamada."
        );
      }

      const conversationId =
        result.data?.conversation_id ||
        result.conversation_id;

      const sipCallId =
        result.data?.sip_call_id ||
        result.sip_call_id;

      mostrarResultadoLlamada(
        testCallStatus,
        "✅ Llamada iniciada correctamente.",
        conversationId,
        sipCallId
      );

    } catch (error) {

      console.error(
        "Error en llamada ElevenLabs:",
        error
      );

      mostrarEstadoElevenLabs(
        testCallStatus,
        `❌ ${obtenerMensajeErrorElevenLabs(error)}`,
        "error"
      );

    } finally {

      if (testCallButton) {
        testCallButton.disabled = false;
      }
    }
  };


// ============================================================
// ELEVENLABS - LLAMADA PERSONALIZADA
// ============================================================

const realizarLlamadaPersonalizadaElevenLabs =
  async (): Promise<void> => {

    if (
      !testPhoneNumber ||
      !temporaryPrompt ||
      !temporaryFirstMessage
    ) {
      return;
    }

    const toNumber =
      testPhoneNumber.value.trim();

    const customPrompt =
      temporaryPrompt.value.trim();

    const customFirstMessage =
      temporaryFirstMessage.value.trim();

    if (!toNumber) {

      mostrarEstadoElevenLabs(
        temporaryPromptStatus,
        "Primero ingresa el número de destino.",
        "error"
      );

      return;
    }

    if (!customPrompt) {

      mostrarEstadoElevenLabs(
        temporaryPromptStatus,
        "Escribe un prompt temporal.",
        "error"
      );

      return;
    }

    if (!customFirstMessage) {

      mostrarEstadoElevenLabs(
        temporaryPromptStatus,
        "Escribe el mensaje temporal.",
        "error"
      );

      return;
    }

    mostrarEstadoElevenLabs(
      temporaryPromptStatus,
      "📞 Iniciando llamada personalizada...",
      "loading"
    );

    if (temporaryCallButton) {
      temporaryCallButton.disabled = true;
    }

    try {

      const response =
        await fetch(
          "/api/elevenlabs/test-call",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              toNumber,
              temporaryPrompt:
                customPrompt,
              temporaryFirstMessage:
                customFirstMessage
            })
          }
        );

      const result:
        ElevenLabsResponse =
        await response.json();

      if (!response.ok ||
          !result.success) {

        throw new Error(
          result.error ||
          result.message ||
          "No se pudo iniciar la llamada personalizada."
        );
      }

      const conversationId =
        result.data?.conversation_id ||
        result.conversation_id;

      const sipCallId =
        result.data?.sip_call_id ||
        result.sip_call_id;

      mostrarResultadoLlamada(
        temporaryPromptStatus,
        "✅ Llamada personalizada iniciada correctamente.",
        conversationId,
        sipCallId
      );

    } catch (error) {

      console.error(
        "Error en llamada personalizada ElevenLabs:",
        error
      );

      mostrarEstadoElevenLabs(
        temporaryPromptStatus,
        `❌ ${obtenerMensajeErrorElevenLabs(error)}`,
        "error"
      );

    } finally {

      if (temporaryCallButton) {
        temporaryCallButton.disabled = false;
      }
    }
  };


// ============================================================
// ELEVENLABS - LIMPIAR TEMPORALES
// ============================================================

const limpiarCamposTemporales =
  (): void => {

    if (temporaryPrompt) {
      temporaryPrompt.value = "";
    }

    if (temporaryFirstMessage) {
      temporaryFirstMessage.value = "";
    }

    mostrarEstadoElevenLabs(
      temporaryPromptStatus,
      "Campos temporales limpiados.",
      "normal"
    );
  };


// ============================================================
// ELEVENLABS - EVENTOS
// ============================================================

if (testCallButton) {

  testCallButton.addEventListener(
    "click",
    realizarLlamadaElevenLabs
  );
}

if (loadPermanentPromptButton) {

  loadPermanentPromptButton.addEventListener(
    "click",
    cargarPromptPermanente
  );
}

if (savePermanentPromptButton) {

  savePermanentPromptButton.addEventListener(
    "click",
    guardarPromptPermanente
  );
}

if (loadAgentConfigurationButton) {

  loadAgentConfigurationButton.addEventListener(
    "click",
    cargarMensajeInicialPermanente
  );
}

if (savePermanentFirstMessageButton) {

  savePermanentFirstMessageButton.addEventListener(
    "click",
    guardarMensajeInicialPermanente
  );
}

if (temporaryCallButton) {

  temporaryCallButton.addEventListener(
    "click",
    realizarLlamadaPersonalizadaElevenLabs
  );
}

if (clearTemporaryPromptButton) {

  clearTemporaryPromptButton.addEventListener(
    "click",
    limpiarCamposTemporales
  );
}


// ============================================================
// INICIALIZACION ELEVENLABS
// ============================================================

// No ejecutamos llamadas automáticamente.
// El usuario decide cuándo llamar desde la interfaz.

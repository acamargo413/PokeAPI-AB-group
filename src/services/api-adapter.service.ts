export interface ApiFieldMap {
  id: string;
  name: string;
  image?: string;
  types?: string[];
  abilities?: string[];
  stats?: Record<string, string>;
  evolution?: string[];
}

export interface ApiAdapterConfig {
  /** URL externa que responde JSON. */
  url: string;
  /** Ruta al arreglo de elementos dentro de la respuesta, por ejemplo: results. */
  itemsPath?: string;
  fields: ApiFieldMap;
}

function valueAtPath(source: unknown, path: string): unknown {
  if (!path) return source;

  return path.replace(/\[(\d+)\]/g, ".$1").split(".").reduce<unknown>(
    (current, part) => {
      if (current === null || current === undefined || typeof current !== "object") {
        return undefined;
      }
      return (current as Record<string, unknown>)[part];
    },
    source
  );
}

function stringsAtPaths(source: unknown, paths: string[] = []): string[] {
  return paths.flatMap((path) => {
    const value = valueAtPath(source, path);
    const values = Array.isArray(value) ? value : [value];
    return values.filter((item): item is string | number =>
      typeof item === "string" || typeof item === "number"
    ).map(String);
  });
}

/** Convierte cualquier objeto JSON al contrato que usa actualmente la interfaz. */
export function normalizeApiItem(item: unknown, fields: ApiFieldMap) {
  const id = valueAtPath(item, fields.id);
  const name = valueAtPath(item, fields.name);

  if (id === undefined || name === undefined) {
    throw new Error("Los campos id y name deben existir en el mapeo");
  }

  const stats = Object.fromEntries(
    Object.entries(fields.stats ?? {}).map(([label, path]) => [
      label,
      valueAtPath(item, path)
    ])
  );

  return {
    id,
    name: String(name),
    image: fields.image ? String(valueAtPath(item, fields.image) ?? "") : "",
    types: stringsAtPaths(item, fields.types),
    abilities: stringsAtPaths(item, fields.abilities),
    stats,
    evolution: stringsAtPaths(item, fields.evolution)
  };
}

export async function previewApiAdapter(config: ApiAdapterConfig) {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(config.url);
  } catch {
    throw new Error("La URL de la API no es válida");
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("La URL debe usar HTTP o HTTPS");
  }

  const response = await fetch(parsedUrl);
  if (!response.ok) throw new Error(`La API respondió con ${response.status}`);

  const json: unknown = await response.json();
  const items = valueAtPath(json, config.itemsPath ?? "");
  const array = Array.isArray(items) ? items : [items];

  return array.map((item) => normalizeApiItem(item, config.fields));
}

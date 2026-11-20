import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export interface RagContextDocument {
  id: string;
  name: string;
  groupName: string;
  sourceName: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

const storePath = resolve(process.cwd(), "data", "rag-contexts.json");
let pendingWrite = Promise.resolve();

async function readDocuments(): Promise<RagContextDocument[]> {
  try {
    return JSON.parse(await readFile(storePath, "utf8")) as RagContextDocument[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function persistDocuments(documents: RagContextDocument[]): Promise<void> {
  await mkdir(dirname(storePath), { recursive: true });
  const temporaryPath = `${storePath}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(documents, null, 2), "utf8");
  await rename(temporaryPath, storePath);
}

function mutateDocuments<T>(mutator: (documents: RagContextDocument[]) => { documents: RagContextDocument[]; value: T }): Promise<T> {
  const operation = pendingWrite.then(async () => {
    const current = await readDocuments();
    const result = mutator(current);
    await persistDocuments(result.documents);
    return result.value;
  });
  pendingWrite = operation.then(() => undefined, () => undefined);
  return operation;
}

export async function listRagContexts(): Promise<RagContextDocument[]> {
  await pendingWrite;
  return readDocuments();
}

export async function listRagContextGroups(): Promise<Array<{ name: string; documentCount: number; updatedAt: string }>> {
  const documents = await listRagContexts();
  const groups = new Map<string, { name: string; documentCount: number; updatedAt: string }>();
  for (const document of documents) {
    const name = document.groupName || "Sin grupo";
    const existing = groups.get(name);
    if (existing) {
      existing.documentCount++;
      if (document.updatedAt > existing.updatedAt) existing.updatedAt = document.updatedAt;
    } else {
      groups.set(name, { name, documentCount: 1, updatedAt: document.updatedAt });
    }
  }
  return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name, "es"));
}

export async function renameRagContextGroup(currentName: string, nextName: string): Promise<number> {
  return mutateDocuments(documents => {
    let updatedCount = 0;
    const updated = documents.map(document => {
      if ((document.groupName || "Sin grupo") !== currentName) return document;
      updatedCount++;
      return { ...document, groupName: nextName.trim(), updatedAt: new Date().toISOString() };
    });
    return { documents: updated, value: updatedCount };
  });
}

export async function deleteRagContextGroup(name: string): Promise<number> {
  return mutateDocuments(documents => {
    const remaining = documents.filter(document => (document.groupName || "Sin grupo") !== name);
    return { documents: remaining, value: documents.length - remaining.length };
  });
}

export async function getRagContext(id: string): Promise<RagContextDocument | null> {
  const documents = await listRagContexts();
  return documents.find(document => document.id === id) || null;
}

export async function createRagContext(input: { name: string; groupName?: string; sourceName?: string; content: string }): Promise<RagContextDocument> {
  return mutateDocuments(documents => {
    const now = new Date().toISOString();
    const document: RagContextDocument = {
      id: randomUUID(),
      name: input.name.trim(),
      groupName: input.groupName?.trim() || "Sin grupo",
      sourceName: input.sourceName?.trim() || input.name.trim(),
      content: input.content,
      createdAt: now,
      updatedAt: now,
    };
    return { documents: [...documents, document], value: document };
  });
}

export async function updateRagContext(id: string, input: { name: string; groupName?: string; sourceName?: string; content: string }): Promise<RagContextDocument | null> {
  return mutateDocuments(documents => {
    const index = documents.findIndex(document => document.id === id);
    if (index < 0) return { documents, value: null };
    const previous = documents[index];
    const updated: RagContextDocument = {
      ...previous,
      name: input.name.trim(),
      groupName: input.groupName?.trim() || previous.groupName || "Sin grupo",
      sourceName: input.sourceName?.trim() || previous.sourceName,
      content: input.content,
      updatedAt: new Date().toISOString(),
    };
    const next = [...documents];
    next[index] = updated;
    return { documents: next, value: updated };
  });
}

export async function deleteRagContext(id: string): Promise<boolean> {
  return mutateDocuments(documents => {
    const remaining = documents.filter(document => document.id !== id);
    return { documents: remaining, value: remaining.length !== documents.length };
  });
}

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();
}

export async function searchRagContexts(ids: string[], query: string) {
  const documents = (await listRagContexts()).filter(document => ids.includes(document.id));
  const terms = [...new Set(normalize(query).split(/[^\p{L}\p{N}]+/u).filter(term => term.length > 1))];
  return documents.map(document => {
    const matches = document.content.split(/\r?\n/).map((line, index) => {
      const normalizedLine = normalize(line);
      const score = terms.reduce((total, term) => total + (normalizedLine.includes(term) ? 1 : 0), 0);
      return { line: index + 1, text: line.trim().slice(0, 600), score };
    }).filter(item => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 5);
    return { id: document.id, name: document.name, groupName: document.groupName || "Sin grupo", sourceName: document.sourceName, matches };
  });
}

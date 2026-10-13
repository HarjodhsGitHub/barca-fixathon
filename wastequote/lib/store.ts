// A small JSON-file store for accepted quotes and their photos (.data/,
// gitignored). Single process, so a promise chain is enough of a lock.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { QuoteRecord } from "./quote";

const DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DIR, "quotes.json");
const PHOTOS = path.join(DIR, "photos");

let chain: Promise<unknown> = Promise.resolve();
function locked<T>(fn: () => Promise<T>): Promise<T> {
  const next = chain.then(fn, fn);
  chain = next.catch(() => undefined);
  return next;
}

async function readAll(): Promise<QuoteRecord[]> {
  try {
    return JSON.parse(await readFile(FILE, "utf8")) as QuoteRecord[];
  } catch {
    return [];
  }
}

export async function listQuotes(): Promise<QuoteRecord[]> {
  const all = await readAll();
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getQuote(id: string): Promise<QuoteRecord | null> {
  return (await readAll()).find((q) => q.id === id) ?? null;
}

export function saveQuote(build: (seq: number) => QuoteRecord, photo: { bytes: Buffer; ext: string }) {
  return locked(async () => {
    await mkdir(PHOTOS, { recursive: true });
    const all = await readAll();
    const record = build(all.length + 1);
    record.photoFile = `${record.id}.${photo.ext}`;
    await writeFile(path.join(PHOTOS, record.photoFile), photo.bytes);
    all.push(record);
    await writeFile(FILE, JSON.stringify(all, null, 2));
    return record;
  });
}

export async function readPhoto(file: string) {
  if (!/^[\w-]+\.(jpg|jpeg|png|webp)$/.test(file)) throw new Error("bad photo name");
  return readFile(path.join(PHOTOS, file));
}

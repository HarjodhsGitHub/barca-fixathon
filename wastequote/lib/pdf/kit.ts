// A tiny layout kit on top of pdf-lib: A4 page, text with wrapping, rules
// and simple tables. The standard Helvetica font only has WinAnsi glyphs,
// so text is passed through `safe` first (CO₂ -> CO2, − -> -, etc.).
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type RGB } from "pdf-lib";

export const A4 = { w: 595.28, h: 841.89 };
export const M = 40; // page margin

export const C = {
  ink: rgb(0.082, 0.09, 0.102),
  ink2: rgb(0.294, 0.318, 0.341),
  muted: rgb(0.506, 0.529, 0.553),
  line: rgb(0.886, 0.871, 0.831),
  paper: rgb(0.953, 0.945, 0.918),
  circular: rgb(0.043, 0.443, 0.286),
  circularSoft: rgb(0.882, 0.941, 0.906),
  flag: rgb(0.706, 0.325, 0.035),
  flagSoft: rgb(0.988, 0.941, 0.871),
  white: rgb(1, 1, 1),
};

const MAP: Record<string, string> = {
  "₂": "2",
  "³": "3",
  "−": "-",
  "–": "-",
  "—": "-",
  "≈": "~",
  "→": "->",
  "←": "<-",
  "✓": "v",
  "✗": "x",
  "’": "'",
  "‘": "'",
  "“": '"',
  "”": '"',
  "…": "...",
  "\u00a0": " ",
  "\u202f": " ",
};

/** Map text onto WinAnsi so Helvetica can draw it. */
export function safe(s: string) {
  return Array.from(s)
    .map((ch) => {
      if (MAP[ch] !== undefined) return MAP[ch];
      const code = ch.codePointAt(0)!;
      if (code < 0x80) return ch;
      // Latin-1 supplement and the euro sign are in WinAnsi.
      if ((code >= 0xa0 && code <= 0xff) || ch === "€" || ch === "·" || ch === "×") return ch;
      return "?";
    })
    .join("");
}

export interface Kit {
  doc: PDFDocument;
  page: PDFPage;
  font: PDFFont;
  bold: PDFFont;
  mono: PDFFont;
  y: number;
}

export async function newKit(title: string): Promise<Kit> {
  const doc = await PDFDocument.create();
  doc.setTitle(safe(title));
  doc.setProducer("Selinsight (hackathon prototype)");
  doc.setCreator("Selinsight");
  const page = doc.addPage([A4.w, A4.h]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const mono = await doc.embedFont(StandardFonts.Courier);
  return { doc, page, font, bold, mono, y: A4.h - M };
}

export function text(
  k: Kit,
  s: string,
  x: number,
  y: number,
  o: { size?: number; font?: PDFFont; color?: RGB; maxWidth?: number; lineHeight?: number; align?: "left" | "right" } = {},
) {
  const size = o.size ?? 9;
  const font = o.font ?? k.font;
  const color = o.color ?? C.ink;
  const lh = o.lineHeight ?? size * 1.32;
  const lines = o.maxWidth ? wrap(safe(s), font, size, o.maxWidth) : [safe(s)];
  lines.forEach((line, i) => {
    const w = font.widthOfTextAtSize(line, size);
    k.page.drawText(line, { x: o.align === "right" ? x - w : x, y: y - i * lh, size, font, color });
  });
  return y - lines.length * lh; // next baseline
}

export function wrap(s: string, font: PDFFont, size: number, maxWidth: number) {
  const out: string[] = [];
  for (const para of s.split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/)) {
      const t = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(t, size) <= maxWidth) line = t;
      else {
        if (line) out.push(line);
        line = word;
      }
    }
    out.push(line);
  }
  return out;
}

export function hr(k: Kit, y: number, x0 = M, x1 = A4.w - M, color = C.line, thickness = 0.7) {
  k.page.drawLine({ start: { x: x0, y }, end: { x: x1, y }, thickness, color });
}

export function box(k: Kit, x: number, y: number, w: number, h: number, fill: RGB, border?: RGB) {
  k.page.drawRectangle({ x, y, width: w, height: h, color: fill, borderColor: border, borderWidth: border ? 0.7 : 0 });
}

/** Small uppercase label above a value. Returns next y. */
export function label(k: Kit, s: string, x: number, y: number) {
  text(k, s.toUpperCase(), x, y, { size: 6.5, font: k.bold, color: C.muted });
  return y - 11;
}

export const eurPdf = (n: number) =>
  `${n < 0 ? "-" : ""}€${Math.abs(n).toLocaleString("en-IE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const eurPdf0 = (n: number) =>
  `${n < 0 ? "-" : ""}€${Math.abs(Math.round(n)).toLocaleString("en-IE")}`;
export const kgPdf = (n: number) => `${n > 0 ? "+" : n < 0 ? "-" : ""}${Math.abs(Math.round(n)).toLocaleString("en-IE")} kg`;

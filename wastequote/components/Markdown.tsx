// Minimal Markdown for the Sailsrep assistant's replies and catalog specs:
// headings, bullet and numbered lists, paragraphs, **bold**, *italic*, `code`.
// No HTML is ever injected.
import type { ReactNode } from "react";

function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    if (t.startsWith("**")) out.push(<strong key={`${key}-${i++}`} className="font-semibold">{t.slice(2, -2)}</strong>);
    else if (t.startsWith("`")) out.push(<code key={`${key}-${i++}`} className="rounded bg-sunken px-1 font-mono text-[0.92em]">{t.slice(1, -1)}</code>);
    else out.push(<em key={`${key}-${i++}`}>{t.slice(1, -1)}</em>);
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ text, className, dropHeading }: { text: string; className?: string; dropHeading?: string }) {
  let lines = text.replace(/\r/g, "").split("\n");
  // A first heading that only repeats the card's own name adds nothing.
  if (dropHeading && /^#{1,4}\s/.test(lines[0] ?? "")) {
    const h = lines[0].replace(/^#{1,4}\s+/, "").toLowerCase();
    if (dropHeading.toLowerCase().startsWith(h.slice(0, 12))) lines = lines.slice(1);
  }
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let para: string[] = [];
  const flushPara = () => {
    if (para.length) blocks.push(<p key={`p${blocks.length}`}>{inline(para.join(" "), `p${blocks.length}`)}</p>);
    para = [];
  };
  const flushList = () => {
    if (!list) return;
    const items = list.items.map((it, i) => <li key={i}>{inline(it, `l${blocks.length}-${i}`)}</li>);
    blocks.push(
      list.ordered ? (
        <ol key={`l${blocks.length}`} className="list-decimal space-y-0.5 pl-5">{items}</ol>
      ) : (
        <ul key={`l${blocks.length}`} className="list-disc space-y-0.5 pl-5">{items}</ul>
      ),
    );
    list = null;
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    const h = line.match(/^#{1,4}\s+(.*)/);
    const ul = line.match(/^\s*[-*]\s+(.*)/);
    const ol = line.match(/^\s*\d+[.)]\s+(.*)/);
    if (!line.trim()) {
      flushPara();
      flushList();
    } else if (h) {
      flushPara();
      flushList();
      blocks.push(<p key={`h${blocks.length}`} className="font-semibold text-ink">{inline(h[1], `h${blocks.length}`)}</p>);
    } else if (ul || ol) {
      flushPara();
      const ordered = !!ol;
      if (!list || list.ordered !== ordered) {
        flushList();
        list = { ordered, items: [] };
      }
      list.items.push((ul ?? ol)![1]);
    } else {
      flushList();
      para.push(line.trim());
    }
  }
  flushPara();
  flushList();
  return <div className={className ?? "space-y-2"}>{blocks}</div>;
}

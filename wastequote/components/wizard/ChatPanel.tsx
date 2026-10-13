"use client";
// "Ask Sailsrep": the Sailsrep assistant on the quote's own configuration.
// It has seen the photo (the vision step ran on the same configuration), it
// knows the catalog and its rules, and it can change selections; any change
// it makes flows back into the wizard and is re-priced by the local engine.
import { useEffect, useRef, useState } from "react";
import { fromSailsrep, type WizardSelections } from "@/lib/sailsrep-ids";
import { Markdown } from "../Markdown";
import { cx } from "../ui";

interface QuestionVariant {
  id: string;
  name: string;
  status: string;
}
interface Question {
  id: string;
  kind: string;
  question: string;
  moduleId?: string;
  variants?: QuestionVariant[];
  options?: string[];
}
interface Msg {
  role: "user" | "assistant";
  text: string;
  question?: Question;
  changes?: string[];
  error?: boolean;
}

interface CfgModuleLite {
  id: string;
  name?: string;
  selection?: { variantId: string; source?: string; reason?: string };
  variants?: Array<{ id: string; name: string }>;
}

export function ChatPanel({
  open,
  setOpen,
  configurationId,
  selections,
  onSelections,
  suggestions,
  available,
  unavailableReason,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  configurationId: string | null;
  selections: WizardSelections;
  onSelections: (s: WizardSelections) => void;
  suggestions: string[];
  available: boolean;
  unavailableReason: string | null;
}) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [activity, setActivity] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [msgs, activity]);

  async function send(text: string, override?: WizardSelections) {
    const message = text.trim();
    if (!message || busy || !configurationId) return;
    setInput("");
    setBusy(true);
    setActivity("Thinking…");
    setMsgs((m) => [...m, { role: "user", text: message }, { role: "assistant", text: "" }]);
    const patch = (fn: (last: Msg) => Msg) =>
      setMsgs((m) => {
        const copy = m.slice();
        copy[copy.length - 1] = fn(copy[copy.length - 1]);
        return copy;
      });
    let lastModules: CfgModuleLite[] | null = null;
    try {
      const res = await fetch("/api/sailsrep/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configurationId, message, selections: { ...selections, ...override } }),
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `Chat failed (${res.status})`);
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        const parts = acc.split("\n\n");
        acc = parts.pop() ?? "";
        for (const p of parts) {
          const data = p
            .split("\n")
            .filter((l) => l.startsWith("data:"))
            .map((l) => l.slice(5).trim())
            .join("\n");
          if (!data) continue;
          let ev: { type: string; [k: string]: unknown };
          try {
            ev = JSON.parse(data);
          } catch {
            continue;
          }
          if (ev.type === "message.delta") patch((l) => ({ ...l, text: l.text + String(ev.text ?? "") }));
          else if (ev.type === "message.complete" && ev.text) patch((l) => ({ ...l, text: String(ev.text) }));
          else if (ev.type === "activity") setActivity(String(ev.label ?? ""));
          else if (ev.type === "question") patch((l) => ({ ...l, question: ev as unknown as Question }));
          else if (ev.type === "configuration.updated") lastModules = ((ev.configuration as { modules?: CfgModuleLite[] })?.modules ?? null);
          else if (ev.type === "error") {
            const err = ev.error as { message?: string } | undefined;
            patch((l) => ({ ...l, text: `${l.text}\n\n${err?.message ?? "The assistant hit an error."}`, error: true }));
          }
        }
      }
      if (lastModules) {
        const sel = lastModules.filter((m) => m.selection).map((m) => ({ moduleId: m.id, variantId: m.selection!.variantId }));
        const next = fromSailsrep(sel);
        const changes = lastModules
          .filter((m) => m.selection?.source === "agent")
          .map((m) => {
            const v = m.variants?.find((x) => x.id === m.selection!.variantId);
            return `${m.name ?? m.id}: ${v?.name ?? m.selection!.variantId}${m.selection!.reason ? `. ${m.selection!.reason}` : ""}`;
          });
        const changed = (Object.keys(next) as Array<keyof WizardSelections>).some((k) => next[k] && next[k] !== selections[k]);
        if (changed) {
          onSelections(next);
          if (changes.length) patch((l) => ({ ...l, changes }));
        }
      }
    } catch (e) {
      patch((l) => ({ ...l, text: e instanceof Error ? e.message : String(e), error: true }));
    } finally {
      setBusy(false);
      setActivity(null);
    }
  }

  function answer(q: Question, v: QuestionVariant) {
    const picked = q.moduleId ? fromSailsrep([{ moduleId: q.moduleId, variantId: v.id }]) : {};
    if (Object.keys(picked).length) onSelections({ ...selections, ...picked });
    send(v.name, picked);
  }

  return (
    <>
      {!open && (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-ink px-4 py-3 text-sm font-medium text-white shadow-lg transition-colors hover:bg-ink/85"
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
          <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3h9A2.5 2.5 0 0 1 17 5.5v6a2.5 2.5 0 0 1-2.5 2.5H9l-4 3v-3h0A2 2 0 0 1 3 12z" strokeLinejoin="round" />
        </svg>
        Ask Sailsrep
      </button>
      )}

      {open && (
        <aside className="fixed inset-x-0 bottom-0 top-14 z-30 flex flex-col border-l border-line bg-surface shadow-2xl sm:left-auto sm:w-[420px]">
          <div className="relative border-b border-line px-4 py-3 pr-12">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close the chat"
              className="absolute right-3 top-3 rounded-md px-2 py-1 text-lg leading-none text-muted hover:bg-sunken hover:text-ink"
            >
              ×
            </button>
            <div className="text-sm font-semibold">Ask Sailsrep</div>
            <div className="text-xs text-muted">
              The CPQ assistant on this quote&apos;s configuration. It has seen the photo, knows the rules and specs, and can change the
              selection.
            </div>
          </div>
          <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-sm">
            {!available && (
              <div className="rounded-lg bg-flag-soft px-3 py-2 text-xs text-flag">{unavailableReason ?? "Sailsrep is not available."}</div>
            )}
            {available && msgs.length === 0 && (
              <div className="space-y-2">
                <div className="text-xs text-muted">Try asking:</div>
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    disabled={busy || !configurationId}
                    className="block w-full rounded-lg border border-line px-3 py-2 text-left text-sm hover:border-ink-2 disabled:opacity-40"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={cx(m.role === "user" ? "ml-8 rounded-xl bg-ink px-3 py-2 text-white" : "mr-2")}>
                {m.role === "user" ? (
                  m.text
                ) : (
                  <div className={cx("leading-relaxed", m.error && "text-danger")}>
                    {m.text ? <Markdown text={m.text} /> : <span className="text-muted">…</span>}
                    {m.changes && m.changes.length > 0 && (
                      <div className="mt-2 rounded-lg border border-circular/30 bg-circular-soft px-3 py-2 text-xs text-circular">
                        <div className="font-semibold">Changed in the quote</div>
                        <ul className="mt-1 space-y-0.5">
                          {m.changes.map((c, j) => (
                            <li key={j}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {m.question?.variants && m.question.variants.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {m.question.variants
                          .filter((v) => v.status !== "blocked")
                          .slice(0, 8)
                          .map((v) => (
                            <button
                              key={v.id}
                              type="button"
                              disabled={busy}
                              onClick={() => answer(m.question!, v)}
                              className="rounded-full border border-line-2 px-3 py-1 text-xs hover:border-ink disabled:opacity-40"
                            >
                              {v.name}
                            </button>
                          ))}
                      </div>
                    )}
                    {m.question?.options && m.question.options.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {m.question.options.map((o) => (
                          <button
                            key={o}
                            type="button"
                            disabled={busy}
                            onClick={() => send(o)}
                            className="rounded-full border border-line-2 px-3 py-1 text-xs hover:border-ink disabled:opacity-40"
                          >
                            {o}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {activity && <div className="font-mono text-[11px] text-muted">{activity}</div>}
          </div>
          <form
            className="flex gap-2 border-t border-line p-3"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={!available || !configurationId}
              placeholder={configurationId ? "Ask about the stream, routes, specs…" : "Waiting for the configuration…"}
              className="flex-1 rounded-lg border border-line-2 bg-surface px-3 py-2 text-sm disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={busy || !input.trim() || !configurationId}
              className="rounded-lg bg-ink px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              Send
            </button>
          </form>
        </aside>
      )}
    </>
  );
}

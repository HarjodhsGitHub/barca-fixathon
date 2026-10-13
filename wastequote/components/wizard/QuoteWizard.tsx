"use client";
import "./motion.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { containerById, ewcByCode, frequencyById, materialById } from "@/lib/data";
import { defaultDistances, evaluate, suggestContainer } from "@/lib/engine";
import { eur, signedKg, tonnes } from "@/lib/format";
import { prepareImage } from "@/lib/image";
import type { RouteId, ServiceConfig } from "@/lib/types";
import type { VisionResponse } from "@/lib/vision/schema";
import { Pill, ROUTE_COLOR, SampleBadge, cx } from "../ui";
import { AnimatedNumber } from "./AnimatedNumber";
import { ChatPanel } from "./ChatPanel";
import { CompareStep } from "./CompareStep";
import { ConfigureStep } from "./ConfigureStep";
import { Analysing, PhotoStep, type ProgressItem } from "./PhotoStep";
import { ReviewStep } from "./ReviewStep";
import {
  STEPS,
  containerStatus,
  initialStream,
  routeStatus,
  type AppInfo,
  type Availability,
  type FieldKey,
  type PhotoState,
  type StepId,
  type StreamState,
} from "./shared";

/** POST the photo and read the SSE answer: progress events, then the result. */
async function streamVision(
  body: { image: string; mediaType: string; sha256: string; filename: string },
  onProgress: (p: ProgressItem) => void,
): Promise<VisionResponse> {
  const res = await fetch("/api/vision", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, stream: true }),
  });
  if (!res.ok || !res.body) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error ?? `Vision failed (${res.status})`);
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
    for (const part of parts) {
      const line = part.split("\n").find((l) => l.startsWith("data:"));
      if (!line) continue;
      const ev = JSON.parse(line.slice(5));
      if (ev.type === "progress") onProgress(ev as ProgressItem);
      else if (ev.type === "result") return ev.result as VisionResponse;
      else if (ev.type === "error") throw new Error(ev.message);
    }
  }
  throw new Error("The vision stream ended without a result.");
}

function defaultConfig(stream: StreamState, frequencyId = "weekly"): ServiceConfig {
  const pick = suggestContainer(stream, frequencyId);
  return {
    containerId: pick?.containerId ?? "skip_8_lid",
    containerCount: pick?.count ?? 1,
    frequencyId,
    distanceKm: defaultDistances(stream.material),
  };
}

export function QuoteWizard({ info }: { info: AppInfo }) {
  const router = useRouter();
  const [step, setStep] = useState<StepId>("photo");
  const [photo, setPhoto] = useState<PhotoState | null>(null);
  const [vision, setVision] = useState<VisionResponse | null>(null);
  const [visionError, setVisionError] = useState<string | null>(null);
  const [analysing, setAnalysing] = useState(false);
  const [progress, setProgress] = useState<ProgressItem[]>([]);
  const [stream, setStream] = useState<StreamState | null>(null);
  const [confirmed, setConfirmedSet] = useState<Set<FieldKey>>(new Set());
  const [config, setConfig] = useState<ServiceConfig | null>(null);
  const [customer, setCustomer] = useState(info.customer);
    const [chosen, setChosen] = useState<RouteId | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  // The Sailsrep configuration this quote lives on: created by the vision
  // step (or the first availability call) and reused by chat and validation.
  const [configurationId, setConfigurationId] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function showToast(text: string) {
    setToast(text);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }
  /** Move to a step and bring its top into view. */
  const [dir, setDir] = useState<1 | -1>(1);
  function goTo(next: StepId) {
    setDir(STEPS.findIndex((x) => x.id === next) >= STEPS.findIndex((x) => x.id === step) ? 1 : -1);
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Ask Sailsrep which routes, containers and frequencies are open whenever
  // the two answers that drive eligibility change. The answer is stored with
  // the key it was asked for, so a stale answer is never shown.
  const material = stream?.material;
  const contamination = stream?.contamination;
  const avKey = material && contamination ? `${material}|${contamination}` : null;
  const [avState, setAvState] = useState<{ key: string; data: Availability } | null>(null);
  const availability = avState && avState.key === avKey ? avState.data : null;
  useEffect(() => {
    if (!material || !contamination || !avKey) return;
    let stale = false;
    fetch("/api/sailsrep/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ material, contamination, configurationId }),
    })
      .then((r) => r.json())
      .then((a: Availability) => {
        if (stale) return;
        setAvState({ key: avKey, data: a });
        if (a.source === "sailsrep") setConfigurationId(a.configurationId);
      })
      .catch((e) => {
        if (!stale) setAvState({ key: avKey, data: { source: "local", reason: String(e) } });
      });
    return () => {
      stale = true;
    };
    // configurationId is read, not watched: availability follows the stream facts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avKey]);

  /** Change the stream; when the material changes, distances and an unoffered container follow. */
  function updateStream(next: StreamState) {
    const prev = stream;
    setStream(next);
    if (prev && prev.material !== next.material) {
      setConfig((c) => {
        if (!c) return c;
        const ok = containerStatus(null, next.material, c.containerId).status !== "blocked";
        return ok ? { ...c, distanceKm: defaultDistances(next.material) } : defaultConfig(next, c.frequencyId);
      });
    }
  }

  const ev = useMemo(() => (stream && config ? evaluate(stream, config) : null), [stream, config]);

  // The route on screen: the salesperson's pick while it stays open, else the
  // circular recommendation, else the first open route.
  const isOpen = (r: RouteId) =>
    !!ev && !!stream && routeStatus(availability, stream.material, stream.contamination, r).open && !!ev.routes.find((x) => x.route === r)?.eligible;
  const effectiveChosen: RouteId | null = !ev
    ? null
    : chosen && isOpen(chosen)
      ? chosen
      : ev.recommendedRoute && isOpen(ev.recommendedRoute)
        ? ev.recommendedRoute
        : (ev.routes.find((r) => isOpen(r.route))?.route ?? null);

  async function onPick(file: Blob, filename: string) {
    setVisionError(null);
    setAnalysing(true);
    try {
      const img = await prepareImage(file, filename);
      setPhoto(img);
      setProgress([]);
      const v = await streamVision(
        { image: img.base64, mediaType: img.mediaType, sha256: img.sha256, filename },
        (p) => setProgress((list) => [...list, p]),
      );
      // Show the finished configuration for a beat before moving on.
      setProgress((list) => [
        ...list,
        ...(list.some((x) => x.kind === "selection" && x.module.startsWith("Waste"))
          ? []
          : [{ kind: "selection" as const, module: "Waste stream", value: materialById(v.result.primary_stream.value)?.name ?? "", reason: null }]),
        ...(list.some((x) => x.kind === "selection" && x.module.startsWith("Contamination"))
          ? []
          : [{ kind: "selection" as const, module: "Contamination", value: v.result.contamination.value, reason: null }]),
        { kind: "selection" as const, module: "Volume", value: `${v.result.volume_m3.value} m³`, reason: v.result.volume_m3.basis },
        { kind: "selection" as const, module: "EWC code", value: v.result.ewc_code.value, reason: ewcByCode(v.result.ewc_code.value)?.description ?? null },
        { kind: "activity" as const, label: "Done" },
      ]);
      await new Promise((r) => setTimeout(r, 900));
      const s = initialStream(v);
      setVision(v);
      setConfigurationId(v.configurationId ?? null);
      setStream(s);
      setConfirmedSet(new Set());
      setConfig(defaultConfig(s));
      setChosen(null);
      setStep("review");
    } catch (e) {
      setVisionError(e instanceof Error ? e.message : String(e));
      setPhoto(null);
    } finally {
      setAnalysing(false);
    }
  }

  async function onAccept(routeOverride?: RouteId) {
    const route = routeOverride ?? effectiveChosen;
    if (!photo || !vision || !stream || !config || !route) return;
    if (routeOverride) setChosen(routeOverride);
    setAccepting(true);
    setAcceptError(null);
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer,
          vision: { mode: vision.mode, model: vision.model, ms: vision.ms, result: vision.result },
          stream,
          config: { ...config, distanceKm: { ...defaultDistances(stream.material), ...config.distanceKm } },
          chosenRoute: route,
          configurationId,
          confirmedFields: [...confirmed],
          photo: { dataUrl: photo.dataUrl, filename: photo.filename },
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? `Could not save the quote (${res.status})`);
      router.push(`/quotes/${j.id}`);
    } catch (e) {
      setAcceptError(e instanceof Error ? e.message : String(e));
      setAccepting(false);
    }
  }

  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const reachable = (id: StepId) => {
    if (id === "photo") return true;
    if (!vision) return false;
    return STEPS.findIndex((s) => s.id === id) <= stepIndex;
  };

  return (
    <div className="mx-auto max-w-[1320px] px-4 pb-16 pt-6 sm:px-6">
      <div className="mb-6 sm:hidden">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-semibold">{STEPS[stepIndex].label}</span>
          <span className="font-mono text-[11px] text-muted">
            Step {stepIndex + 1} of {STEPS.length}
          </span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-sunken">
          <div
            className="h-full rounded-full bg-circular transition-[width] duration-500 ease-out"
            style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>
      <ol className="mb-8 hidden flex-wrap items-center gap-2 text-sm sm:flex">
        {STEPS.map((s, i) => (
          <li key={s.id} className="flex items-center gap-2">
            <button
              type="button"
              disabled={!reachable(s.id)}
              onClick={() => setStep(s.id)}
              className={cx(
                "flex items-center gap-2 rounded-full px-3 py-1 transition-colors disabled:cursor-default",
                s.id === step ? "bg-ink text-white" : i < stepIndex ? "text-ink hover:bg-sunken" : "text-muted",
              )}
            >
              <span className="font-mono text-[11px]">{String(i + 1).padStart(2, "0")}</span>
              {s.label}
            </button>
            {i < STEPS.length - 1 && (
              <span className="relative h-px w-8 overflow-hidden bg-line-2">
                <span
                  className="absolute inset-0 origin-left bg-ink transition-transform duration-500 ease-out-expo"
                  style={{ transform: `scaleX(${i < stepIndex ? 1 : 0})` }}
                />
              </span>
            )}
          </li>
        ))}
      </ol>

      <div className={cx("grid gap-8", step !== "photo" && "lg:grid-cols-[minmax(0,1fr)_280px]")}>
        <main key={`${step}${analysing ? "-busy" : ""}`} className={cx("min-w-0", dir === 1 ? "wq-step-fwd" : "wq-step-back")}>
          {step === "photo" &&
            (analysing && photo ? (
              <Analysing dataUrl={photo.dataUrl} provider={info.vision.provider} label={info.vision.label} progress={progress} />
            ) : (
              <>
                {visionError && <div className="mb-4 rounded-lg bg-danger-soft px-4 py-2.5 text-sm text-danger">{visionError}</div>}
                <PhotoStep info={info} busy={analysing} onPick={onPick} />
              </>
            ))}
          {step === "review" && photo && vision && stream && (
            <ReviewStep
              photo={photo}
              vision={vision}
              stream={stream}
              setStream={updateStream}
              confirmed={confirmed}
              setConfirmed={(k, v) =>
                setConfirmedSet((prev) => {
                  const next = new Set(prev);
                  if (v) next.add(k);
                  else next.delete(k);
                  return next;
                })
              }
              onBack={() => goTo("photo")}
              onNext={() => goTo("configure")}
            />
          )}
          {step === "configure" && stream && config && (
            <ConfigureStep
              stream={stream}
              config={config}
              setConfig={setConfig}
              customer={customer}
              setCustomer={setCustomer}
              availability={availability}
              onBack={() => goTo("review")}
              onNext={() => goTo("compare")}
            />
          )}
          {step === "compare" && ev && (
            <CompareStep
              ev={ev}
              availability={availability}
              chosen={effectiveChosen}
              setChosen={setChosen}
              onBack={() => goTo("configure")}
              onAccept={onAccept}
              accepting={accepting}
              error={acceptError}
              onWhatIf={(level) => {
                updateStream({ ...stream!, contamination: level });
                setChosen(null);
                showToast(`Re-quoted at ${level} contamination: the customer separates general waste at source`);
              }}
            />
          )}
        </main>

        {step !== "photo" && stream && config && ev && (
          <aside className="hidden lg:block">
            <div className="sticky top-20 space-y-4 rounded-xl border border-line bg-surface p-4 text-sm">
              {photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo.dataUrl} alt="" className="aspect-[4/3] w-full rounded-lg object-cover" />
              )}
              <dl className="space-y-2">
                <Row k="Stream" v={materialById(stream.material)?.name} />
                <Row k="EWC" v={<span className="font-mono">{stream.ewc}</span>} sub={ewcByCode(stream.ewc)?.description} />
                <Row k="Contamination" v={stream.contamination} />
                <Row k="Volume" v={`${stream.volumePerWeekM3} m³/week`} sub={`≈ ${tonnes(ev.capacity.tonnesPerMonth)} t/month`} />
                <Row k="Container" v={`${config.containerCount} × ${containerById(config.containerId)?.name}`} />
                <Row k="Pickups" v={frequencyById(config.frequencyId)?.name} />
              </dl>
              {effectiveChosen && (() => {
                const r = ev.routes.find((x) => x.route === effectiveChosen);
                if (!r?.price || !r.co2) return null;
                return (
                  <div
                    key={r.route}
                    className={cx(
                      "wq-pop -mx-1 rounded-xl border px-3 py-3",
                      r.circular ? "wq-ring border-circular/40 bg-circular-soft" : "border-line bg-paper",
                    )}
                  >
                    <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted">
                      <span>Selected route</span>
                      {r.circular && <span className="font-semibold text-circular">circular</span>}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 font-medium">
                      <span className="h-2 w-2 rounded-full" style={{ background: ROUTE_COLOR[r.route] }} />
                      {r.routeName}
                    </div>
                    <div className="mt-1 text-2xl font-semibold">
                      <AnimatedNumber value={r.price.totalPerMonth} format={eur} />
                      <span className="text-sm font-normal text-muted">/mo</span>
                    </div>
                    <div className="font-mono text-xs text-ink-2">
                      <AnimatedNumber value={r.co2.totalKgPerT} format={(n) => signedKg(Math.round(n))} /> kg CO₂e/t
                    </div>
                    {r.usesSampleData && (
                      <div className="mt-2">
                        <SampleBadge />
                      </div>
                    )}
                  </div>
                );
              })()}
              <button
                type="button"
                onClick={() => setChatOpen(true)}
                className="wq-press hidden w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white hover:bg-ink/85 lg:flex"
              >
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                  <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3h9A2.5 2.5 0 0 1 17 5.5v6a2.5 2.5 0 0 1-2.5 2.5H9l-4 3v-3h0A2 2 0 0 1 3 12z" strokeLinejoin="round" />
                </svg>
                Ask Selinsight
              </button>
              <div className="border-t border-line pt-3 text-xs text-muted">
                {availability?.source === "sailsrep" ? (
                  <Pill tone="good">Rules: live CPQ engine</Pill>
                ) : availability ? (
                  <span title={availability.reason}><Pill tone="flag">Rules: local copy</Pill></span>
                ) : (
                  <Pill>Rules: checking…</Pill>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center px-4">
          <div className="wq-pop rounded-full bg-ink px-4 py-2.5 text-sm text-white shadow-lg">{toast}</div>
        </div>
      )}

      {step !== "photo" && stream && config && (
        <ChatPanel
          open={chatOpen}
          setOpen={setChatOpen}
          configurationId={configurationId}
          available={info.sailsrep.configured && availability?.source !== "local"}
          unavailableReason={
            !info.sailsrep.configured
              ? "The AI assistant is not set up on this machine."
              : availability?.source === "local"
                ? availability.reason
                : null
          }
          selections={{
            material: stream.material,
            contamination: stream.contamination,
            containerId: config.containerId,
            frequencyId: config.frequencyId,
            route: effectiveChosen ?? undefined,
          }}
          onSelections={(next) => {
            const what = [
              next.material && next.material !== stream.material ? `stream: ${materialById(next.material)?.name}` : null,
              next.contamination && next.contamination !== stream.contamination ? `contamination: ${next.contamination}` : null,
              next.containerId && next.containerId !== config.containerId ? `container: ${containerById(next.containerId)?.name}` : null,
              next.frequencyId && next.frequencyId !== config.frequencyId ? `pickups: ${frequencyById(next.frequencyId)?.name}` : null,
              next.route && next.route !== effectiveChosen ? `route: ${next.route}` : null,
            ].filter(Boolean);
            if (what.length) showToast(`Selinsight AI updated the quote · ${what.join(" · ")}`);
            if (stream && (next.material || next.contamination)) {
              updateStream({ ...stream, material: next.material ?? stream.material, contamination: next.contamination ?? stream.contamination });
            }
            if (next.containerId || next.frequencyId) {
              setConfig((c) => (c ? { ...c, containerId: next.containerId ?? c.containerId, frequencyId: next.frequencyId ?? c.frequencyId } : c));
            }
            if (next.route) setChosen(next.route);
          }}
          suggestions={
            step === "review"
              ? [
                  "What in the photo decides the contamination level?",
                  "Is there anything hazardous in this photo?",
                  "Which EWC code fits best, and why?",
                ]
              : step === "configure"
                ? ["Which container suits this stream and volume?", "What does each container hold and weigh?", "How often should we collect?"]
                : [
                    "Why are some routes not allowed for this stream?",
                    "What does the recycling route accept?",
                    "How could the customer make this stream recyclable?",
                  ]
          }
        />
      )}
    </div>
  );
}

function Row({ k, v, sub }: { k: string; v: React.ReactNode; sub?: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-muted">{k}</dt>
      <dd className="first-letter:uppercase">{v}</dd>
      {sub && <dd className="text-xs text-muted">{sub}</dd>}
    </div>
  );
}

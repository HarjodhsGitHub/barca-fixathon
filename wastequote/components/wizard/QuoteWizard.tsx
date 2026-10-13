"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { containerById, ewcByCode, frequencyById, materialById } from "@/lib/data";
import { defaultDistances, evaluate, suggestContainer } from "@/lib/engine";
import { eur, signedKg, tonnes } from "@/lib/format";
import { prepareImage } from "@/lib/image";
import type { RouteId, ServiceConfig } from "@/lib/types";
import type { VisionResponse } from "@/lib/vision/schema";
import { Pill, SampleBadge, cx } from "../ui";
import { ChatPanel } from "./ChatPanel";
import { CompareStep } from "./CompareStep";
import { ConfigureStep } from "./ConfigureStep";
import { Analysing, PhotoStep } from "./PhotoStep";
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
      const res = await fetch("/api/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: img.base64, mediaType: img.mediaType, sha256: img.sha256, filename }),
      });
      const v = (await res.json()) as VisionResponse & { error?: string };
      if (!res.ok) throw new Error(v.error ?? `Vision failed (${res.status})`);
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

  async function onAccept() {
    if (!photo || !vision || !stream || !config || !effectiveChosen) return;
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
          chosenRoute: effectiveChosen,
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
      <ol className="mb-8 flex flex-wrap items-center gap-2 text-sm">
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
            {i < STEPS.length - 1 && <span className="h-px w-6 bg-line-2" />}
          </li>
        ))}
      </ol>

      <div className={cx("grid gap-8", step !== "photo" && "lg:grid-cols-[minmax(0,1fr)_280px]")}>
        <main className="min-w-0">
          {step === "photo" &&
            (analysing && photo ? (
              <Analysing dataUrl={photo.dataUrl} provider={info.vision.provider} label={info.vision.label} />
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
              onBack={() => setStep("photo")}
              onNext={() => setStep("configure")}
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
              onBack={() => setStep("review")}
              onNext={() => setStep("compare")}
            />
          )}
          {step === "compare" && ev && (
            <CompareStep
              ev={ev}
              availability={availability}
              chosen={effectiveChosen}
              setChosen={setChosen}
              onBack={() => setStep("configure")}
              onAccept={onAccept}
              accepting={accepting}
              error={acceptError}
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
                  <div className="border-t border-line pt-3">
                    <div className="text-xs text-muted">Selected route</div>
                    <div className="font-medium">{r.routeName}</div>
                    <div className="mt-1 text-2xl font-semibold tabular">{eur(r.price.totalPerMonth)}<span className="text-sm font-normal text-muted">/mo</span></div>
                    <div className="font-mono text-xs text-ink-2">{signedKg(r.co2.totalKgPerT)} kg CO₂e/t</div>
                    {r.usesSampleData && <div className="mt-2"><SampleBadge /></div>}
                  </div>
                );
              })()}
              <div className="border-t border-line pt-3 text-xs text-muted">
                {availability?.source === "sailsrep" ? (
                  <Pill tone="good">Rules: Sailsrep CPQ</Pill>
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

      {step !== "photo" && stream && config && (
        <ChatPanel
          open={chatOpen}
          setOpen={setChatOpen}
          configurationId={configurationId}
          available={info.sailsrep.configured && availability?.source !== "local"}
          unavailableReason={
            !info.sailsrep.configured
              ? `Sailsrep is not configured (${info.sailsrep.reason}).`
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

// The eligibility rules two ways: a material x route x contamination matrix of
// what the engine decides, and the rules themselves, law apart from company policy.
import { materials, materialById, routes, routeById, rules, type Rule } from "@/lib/data";
import { checkEligibility } from "@/lib/engine";
import { CONTAMINATION_LEVELS, type Contamination } from "@/lib/types";
import { SampleBadge } from "@/components/ui";
import { Plate, RouteName, SourceText, cn, routeColor } from "./marks";
import { GroupRow, TD, TH, TableShell } from "./table";

const LEVEL = { low: "Low", medium: "Medium", high: "High" } as const;

function Cell({ material, route, level }: { material: (typeof materials)[number]; route: (typeof routes)[number]; level: Contamination }) {
  const { eligible, hits } = checkEligibility(material.id, route.id, level);
  // Show the rule that decided the cell, preferring one grounded in law or fact.
  const pick = (effect: "allow" | "deny") =>
    hits.find((h) => h.effect === effect && !h.is_sample && h.ruleId !== "DEFAULT") ?? hits.find((h) => h.effect === effect);
  const decider = pick(eligible ? "allow" : "deny");
  const surcharge = hits.filter((h) => h.effect === "surcharge");
  const warn = hits.filter((h) => h.effect === "warn");
  const law = !!decider && !decider.is_sample && decider.ruleId !== "DEFAULT";
  const title =
    `${material.name}, ${route.name.toLowerCase()}, ${level} contamination: ` +
    (eligible ? `allowed by ${decider?.ruleId}` : `not allowed (${decider?.ruleId})`) +
    (law ? " (law or fact)" : "") +
    (surcharge.length ? `; surcharge ${surcharge.map((h) => h.ruleId).join(", ")}` : "") +
    (warn.length ? `; warning ${warn.map((h) => h.ruleId).join(", ")}` : "");
  return (
    <div
      title={title}
      aria-label={title}
      className={cn(
        "flex h-10 flex-col items-center justify-center gap-0.5 rounded-[3px] font-mono text-[11px] leading-none",
        eligible ? "text-ink" : "hatch border border-line text-muted",
      )}
      style={
        eligible
          ? { background: `color-mix(in srgb, ${routeColor(route.id)} 16%, white)`, boxShadow: `inset 0 -2px 0 ${routeColor(route.id)}` }
          : undefined
      }
    >
      <span className={cn(!eligible && "rounded-[2px] bg-paper/90 px-0.5")}>{decider?.ruleId === "DEFAULT" ? "none" : decider?.ruleId}</span>
      {(law || surcharge.length > 0 || warn.length > 0) && (
        <span className="flex gap-1 text-[11px] font-semibold">
          {law && <span className="text-ink">§</span>}
          {surcharge.length > 0 && <span className="text-flag">+</span>}
          {warn.length > 0 && <span className="text-danger">!</span>}
        </span>
      )}
    </div>
  );
}

export function EligibilityMatrix() {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-ink-2">
        <span className="inline-flex items-center gap-1.5">
          <span className="block h-3.5 w-5 rounded-[2px] bg-circular-soft shadow-[inset_0_-2px_0_var(--color-circular)]" /> Allowed, by rule
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="hatch block h-3.5 w-5 rounded-[2px] border border-line" /> Not allowed, by rule
        </span>
        <span>
          <span className="font-mono font-semibold text-ink">§</span> decided by law or fact
        </span>
        <span>
          <span className="font-mono font-semibold text-flag">+</span> surcharge
        </span>
        <span>
          <span className="font-mono font-semibold text-danger">!</span> warning
        </span>
        <span className="text-muted">Columns within a route: low, medium, high contamination</span>
      </div>
      <TableShell minWidth={760} caption="Which routes are open, by material and contamination level">
        <thead>
          <tr>
            <th className={cn(TH, "sticky left-0 z-10 w-[118px] sm:w-[180px]")}>Material</th>
            {routes.map((r) => (
              <th key={r.id} className={cn(TH, "px-2")}>
                <RouteName route={r.id} name={r.name} className="text-[13px] font-semibold text-ink" />
                <div className="mt-1.5 grid grid-cols-3 gap-1 text-center font-mono text-[10px] font-normal text-muted">
                  {CONTAMINATION_LEVELS.map((l) => (
                    <span key={l} title={`${LEVEL[l]} contamination`}>
                      {l[0].toUpperCase()}
                    </span>
                  ))}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {materials.map((m) => (
            <tr key={m.id}>
              <th scope="row" className={cn(TD, "sticky left-0 z-10 bg-surface py-2.5 text-left align-middle text-[13px] font-medium leading-snug")}>
                {m.name}
              </th>
              {routes.map((r) => (
                <td key={r.id} className={cn(TD, "px-2 py-2.5 align-middle")}>
                  <div className="grid grid-cols-3 gap-1">
                    {CONTAMINATION_LEVELS.map((l) => (
                      <Cell key={l} material={m} route={r} level={l} />
                    ))}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </TableShell>
    </div>
  );
}

const EFFECT = {
  allow: { label: "Allow", className: "bg-circular-soft text-circular" },
  deny: { label: "Deny", className: "border border-ink/70 text-ink" },
  surcharge: { label: "Surcharge", className: "bg-flag-soft text-flag" },
  warn: { label: "Warning", className: "bg-danger-soft text-danger" },
} as const;

function scopeMaterials(r: Rule) {
  if (r.material === "*") return "All materials";
  if (Array.isArray(r.material)) return r.material.map((m) => materialById(m)?.name ?? m).join(", ");
  return materialById(r.material)?.name ?? r.material;
}

function scopeLevels(levels: Contamination[]) {
  if (levels.length === CONTAMINATION_LEVELS.length) return "Any contamination";
  const t = levels.map((l) => LEVEL[l].toLowerCase()).join(" or ");
  return `${t[0].toUpperCase()}${t.slice(1)} contamination`;
}

export function RuleList() {
  // Cross-material rules first, then one group per material, in data order within a group.
  const groups: Array<{ key: string; label: string; rows: Rule[] }> = [
    { key: "across", label: "Across materials", rows: rules.filter((r) => r.material === "*" || Array.isArray(r.material)) },
    ...materials.map((m) => ({ key: m.id, label: m.name, rows: rules.filter((r) => r.material === m.id) })),
  ].filter((g) => g.rows.length > 0);

  return (
    <TableShell minWidth={820} caption="Eligibility rules">
      <thead>
        <tr>
          <th className={cn(TH, "w-[110px]")}>Rule</th>
          <th className={cn(TH, "w-[220px]")}>Applies to</th>
          <th className={TH}>What it says, and the source</th>
          <th className={cn(TH, "w-[1%]")}>Basis</th>
        </tr>
      </thead>
      {groups.map((g) => (
        <tbody key={g.key}>
          <GroupRow colSpan={4}>{g.label}</GroupRow>
          {g.rows.map((r) => {
            const law = !r.is_sample;
            return (
              <tr key={r.id} className={law ? "bg-[color-mix(in_srgb,var(--color-ink)_3%,white)]" : undefined}>
                <td className={cn(TD, law && "shadow-[inset_3px_0_0_var(--color-ink)]")}>
                  <Plate>{r.id}</Plate>
                  <div className="mt-1.5">
                    <span className={cn("inline-block rounded-[3px] px-1.5 py-0.5 text-[11px] font-medium", EFFECT[r.effect].className)}>
                      {EFFECT[r.effect].label}
                    </span>
                  </div>
                </td>
                <td className={cn(TD, "text-[13px]")}>
                  <div>{r.route === "*" ? "All routes" : <RouteName route={r.route} name={routeById(r.route)?.name ?? r.route} className="font-medium" />}</div>
                  <div className="mt-1 text-ink-2">{scopeMaterials(r)}</div>
                  <div className="text-muted">{scopeLevels(r.contamination)}</div>
                </td>
                <td className={TD}>
                  <p className="max-w-[60ch] text-[13px] leading-snug text-ink">{r.text}</p>
                  <SourceText source={r.source} url={r.source_url} notes={r.notes} className="mt-1.5" />
                </td>
                <td className={cn(TD, "whitespace-nowrap")}>
                  {law ? (
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink">
                      <span className="font-mono">§</span> Law or fact
                    </span>
                  ) : (
                    <div className="space-y-1">
                      <div className="text-[12px] font-medium text-ink-2">Company rule</div>
                      <SampleBadge title="A sample acceptance or pricing rule of the fictional waste company" />
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      ))}
    </TableShell>
  );
}

# Selinsight wizard: design notes

> **Applied 14 Oct 2026.** Done: tokens and motion alignment, chat panel offset, P1 (status-weighted compare
> cards), P2 (verdict strip with its own accept), P3 (one-pass price lines), P4 (direction-tinted number
> changes, count-up on the recommended card), P5 (directional step transitions, filling stepper), P6, P8
> (continue jumps to the first field to check, meter refinements, sentence case), P9, P10 (launcher in the side
> panel on large screens, icon-only on phones), P11, most of P12. Skipped for the demo: P7.1 shared-element View
> Transitions (uneven browser support) and P7.2 dark drop zone.

Fixes for the files the design pass did not touch: `components/wizard/*.tsx`, `components/wizard/motion.css`
and `components/ui.tsx`. Reviewed live on 14 Oct 2026 at 1440x900 and 390x844 with the "Builders' skip" demo
photo, at high and medium contamination. Priorities run P1 (most visible at the demo) to P12.

---

## 0. Shared tokens now in `app/globals.css` (reuse these in the wizard)

All existing token names still work. Values that changed: `paper #f0eee7`, `circular #0b6b45` (was `#0b7149`),
`muted #656b71` (now AA on paper), `flag #a94f08`.

| Kind | Name | Use |
| --- | --- | --- |
| Colour | `circular-ink` `#07462d` | hover/pressed state of green buttons (`hover:bg-circular-ink`) |
| Colour | `circular-bright` `#3fbf7f` | accents on the dark analysing panel |
| Colour | `tablehead` `#f6f4ef` | opaque table header ground (`bg-tablehead`) |
| Colour | `hazard` `#e9a23b` | stripe edge, if a stronger sample marker is needed |
| Radius | `md 5px`, `lg 6px`, `xl 8px`, `2xl 12px` | sharper than Tailwind defaults. `rounded-xl` cards are now 8px; `rounded-2xl` 12px for the big panels |
| Shadow | `shadow-card`, `shadow-lift`, `shadow-pop` | rest, hover, chosen/primary panel |
| Easing | `ease-out-quart`, `ease-out-expo`, `ease-in-out-quart`, `ease-spring` | utilities (`ease-out-expo`) and CSS vars (`var(--ease-out-expo)`) |
| Duration | `--motion-fast 140ms`, `--motion-base 240ms`, `--motion-slow 480ms` | hand-written transitions |
| Animation | `animate-rise`, `animate-fade-in`, `animate-grow-x`, `animate-num-in`, `animate-pop` | entrances. `grow-x` scales from the element's transform-origin (add `origin-left` for bars) |
| Delay | `anim-delay-<ms>` (e.g. `anim-delay-120`) | animation-delay utility |
| Class | `.stagger` | children rise in sequence; tune with `[--stagger-start:300ms] [--stagger-step:70ms]` |
| Class | `.lift`, `.press`, `.draw-underline` | hover lift, pressed scale 0.97, underline that draws in |
| Class | `.hatch` | diagonal hatch for "not allowed" (used in the price book matrix and the quote list) |
| Class | `.sample-stripe`, `.tabular`, `.scanline`, `.anchor`, `.no-scrollbar` | as before / helpers |

Global rule: under `prefers-reduced-motion: reduce` every animation and transition in the app collapses to 1 ms
(and loops run once). `motion.css` can keep its own reduced-motion block, but it is no longer load-bearing.

Small alignment fixes in `components/wizard/motion.css`:

```css
:root { --wq-ease: var(--ease-out-expo); }              /* one curve across app and wizard */
@keyframes wq-ring {                                     /* was the old circular rgb(11 113 73) */
  0%   { box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-circular) 35%, transparent); }
  100% { box-shadow: 0 0 0 14px transparent; }
}
.wq-lift:hover:not(:disabled) { box-shadow: var(--shadow-lift); }
```

The header is now 64 px tall (`h-16`). `components/wizard/ChatPanel.tsx` line 170: change the panel's `top-14` to
`top-16`, or its first 8 px slide under the header.

---

## P1. Compare step: make the circular route the obvious, easy choice (`CompareStep.tsx`)

Today the four cards are equal width, the recommended card's price is the same 30 px as the others, and a closed
route (Reuse) takes a full quarter of the row. Weight the row by status instead, so the eye lands on the circular
card without hiding any cost.

1. **Column widths by status** (the `grid` in `CompareStep`, around line 290). Closed routes shrink, the
   recommended route grows, hierarchy order stays:

   ```tsx
   const cols = ev.routes
     .map((r) => (!isOpen(r) ? "minmax(0,0.62fr)" : r.tags.includes("circular_choice") ? "minmax(0,1.3fr)" : "minmax(0,1fr)"))
     .join(" ");
   <div
     className="wq-stagger mt-6 grid gap-4 md:grid-cols-2 xl:[grid-template-columns:var(--cols)]"
     style={{ "--cols": cols } as React.CSSProperties}
   >
   ```

2. **Recommended card** (`RouteCard`): lift it and enlarge its number, not its decoration.
   - wrapper: add `shadow-pop ring-1 ring-circular/35 xl:-translate-y-1.5` when `recommended && open`.
   - replace the uppercase band `Recommended · circular` with a sentence-case chip in the card header:
     `<span className="inline-flex items-center gap-1.5 rounded-full bg-circular px-2.5 py-1 text-[12px] font-semibold text-white">Recommended, circular</span>`
   - price: `text-[40px] font-semibold tracking-[-0.03em]` for the recommended card, `text-[28px] text-ink-2` for the
     other open cards.
3. **Selected state**: the 2 px ink ring reads as a focus or error state. Use the route colour and a check:
   `selected ? "border-transparent shadow-[0_0_0_2px_var(--color-circular)]"` and make the selected button
   `variant="circular"` with a check icon and the label `Selected`, not a solid ink block.
4. **Closed cards**: `xl:self-start` so they stop stretching to the tallest card, `hatch` on the 6 px top band
   (`<div className="hatch h-1.5" />` instead of the grey bar), title `text-muted`, and only the deciding rule plus
   its source. Keep the "law / fact" label but drop the middle dot: `Law or fact`.
5. **Mobile (390 px)**: the recommended-first, closed-last ordering is right. Keep it.

## P2. Decision strip as a verdict with its own accept button (`DecisionStrip`)

The strip is one 14 px sentence. Turn it into two big numbers and the shortest path to "yes":

```tsx
<div className="wq-fade-in grid gap-5 rounded-2xl border border-circular/25 bg-surface p-5 shadow-card sm:grid-cols-[auto_auto_minmax(0,1fr)] sm:items-center sm:gap-10 sm:p-6">
  <div>
    <div className="text-[12px] text-muted">{circ.routeName} vs {alt.routeName.toLowerCase()}, per month</div>
    <div className={cx("text-[32px] font-semibold leading-none tracking-[-0.03em]", dEur <= 0 ? "text-circular" : "text-ink")}>
      <AnimatedNumber value={Math.abs(dEur)} format={eur} />
    </div>
    <div className="mt-1 text-[13px] text-ink-2">{dEur <= 0 ? "saved" : "more"}</div>
  </div>
  <div>
    <div className="text-[12px] text-muted">CO₂e a year</div>
    <div className="text-[32px] font-semibold leading-none tracking-[-0.03em] text-circular">
      <AnimatedNumber value={Math.abs(dCo2TonnesYear)} format={(n) => (n < 10 ? n.toFixed(1) : int(n))} /> t
    </div>
    <div className="mt-1 text-[13px] text-ink-2">{dCo2TonnesYear >= 0 ? "avoided" : "added"}</div>
  </div>
  <div className="sm:justify-self-end">
    <Button variant="circular" className="wq-press px-5 py-3 text-[15px]" onClick={() => { setChosen(circ.route); onAccept(); }}>
      Accept {circ.routeName.toLowerCase()}
    </Button>
  </div>
</div>
```

`DecisionStrip` needs `setChosen` and `onAccept` passed down (accept only after `chosen` is set, e.g. accept with
the route id: `onAccept(circ.route)`). When the circular route costs more, keep the number in ink, not green, and
keep the `(€X per tonne CO₂e avoided)` line underneath. That honesty is the point.

## P3. Price breakdown that reads in one pass (`RouteCard`, price lines)

Dotted underlines on every label are noisy, and labels like `Treatment gate fee (+15% contamination)` wrap to two
lines in a quarter-width card.

```tsx
<ul className="mt-4 divide-y divide-line border-y border-line">
  {r.price.lines.map((l) => (
    <li key={l.key + l.label}>
      <details className="group">
        <summary className="grid grid-cols-[12px_minmax(0,1fr)_auto] items-center gap-2 py-2 text-[13px]">
          <svg viewBox="0 0 12 12" className="h-3 w-3 text-muted transition-transform duration-200 group-open:rotate-90" aria-hidden>
            <path d="M4 2.5L7.5 6 4 9.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="truncate text-ink-2 group-open:text-ink">{l.label.replace(/\s*\(.*\)$/, "")}</span>
          <span className={cx("font-mono tabular", l.amount < 0 && "text-circular")}>{eur(l.amount)}</span>
        </summary>
        <div className="wq-fade-in mb-2 ml-5 rounded-md bg-paper px-2.5 py-2"> ...formula + Citations... </div>
      </details>
    </li>
  ))}
  <li className="grid grid-cols-[12px_minmax(0,1fr)_auto] gap-2 py-2 text-[13px] font-semibold">
    <span /> <span>Total</span> <span className="font-mono tabular">{eur(r.price.totalPerMonth)}</span>
  </li>
</ul>
```

Show the contamination share once as a chip next to the price instead of inside a label:
`<span className="rounded bg-flag-soft px-1.5 py-0.5 text-[11px] font-medium text-flag">+15% contamination</span>`.
Optional, matches the quote page: a 6 px composition bar above the list
(`flex h-1.5 overflow-hidden rounded-full`, one segment per positive line, neutral tones
`#15181b #5d646b #a0a6ab #c9ccce`).

## P4. How a changing price should animate (`AnimatedNumber.tsx`, bottom bar, aside)

`AnimatedNumber` is right (450 ms, ease-out, skips the first render). Three refinements:

1. **Direction cue instead of a background flash.** A green wash on every change reads as "good" even when the
   price went up. Flash the text colour by direction:

   ```tsx
   const dir = value < from.current ? "down" : "up";      // capture before from.current = value
   <span data-dir={dir} className={cx(flashKey && "wq-tick", ...)}>
   ```
   ```css
   @keyframes wq-tick-down { from { color: var(--color-circular); } to { color: inherit; } }
   @keyframes wq-tick-up   { from { color: var(--color-flag); }     to { color: inherit; } }
   .wq-tick[data-dir="down"] { animation: wq-tick-down 900ms var(--ease-out-quart) both; }
   .wq-tick[data-dir="up"]   { animation: wq-tick-up 900ms var(--ease-out-quart) both; }
   ```
2. **Use it everywhere the same number appears**: the sticky bottom bar (`{eur(chosenRoute.price.totalPerMonth)}/mo`)
   and the aside's "Selected route" total still jump. Wrap both in `<AnimatedNumber>`.
3. **Ease and duration**: use `1 - Math.pow(1 - k, 4)` (out-quart) over 520 ms for totals, 380 ms for small
   numbers (CO₂e per tonne). Never animate on mount, never longer than 600 ms: a salesperson clicks frequency
   options quickly.

## P5. Transitions between steps (`QuoteWizard.tsx`)

`<main key={step} className="wq-fade-in">` is in place. Make it feel directional and keep the user's place:

```tsx
const [dir, setDir] = useState<1 | -1>(1);
const go = (next: StepId) => { setDir(STEPS.findIndex((s) => s.id === next) >= stepIndex ? 1 : -1); setStep(next); };
useEffect(() => { window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); }, [step]);
<main key={step} className={dir === 1 ? "wq-step-fwd" : "wq-step-back"}>
```
```css
@keyframes wq-step-fwd  { from { opacity: 0; transform: translateX(16px); }  to { opacity: 1; transform: none; } }
@keyframes wq-step-back { from { opacity: 0; transform: translateX(-16px); } to { opacity: 1; transform: none; } }
.wq-step-fwd  { animation: wq-step-fwd 360ms var(--ease-out-expo) both; }
.wq-step-back { animation: wq-step-back 360ms var(--ease-out-expo) both; }
```

Stepper connectors (line 259, the `h-px w-6` spans): let the line fill as you advance.

```tsx
<span className="relative h-px w-8 overflow-hidden bg-line-2">
  <span className="absolute inset-0 origin-left bg-ink transition-transform duration-500 ease-out-expo"
        style={{ transform: `scaleX(${i < stepIndex ? 1 : 0})` }} />
</span>
```

Also wrap the next-step buttons' arrow glyph in a span with
`transition-transform group-hover:translate-x-0.5` so forward actions nudge forward on hover.

## P6. How the compare cards should animate in (`CompareStep.tsx`)

One orchestrated moment, then stillness:

1. Cards rise in hierarchy order: keep `wq-stagger`, step 80 ms, 12 px rise, 520 ms out-expo
   (`.wq-stagger > * { animation-duration: 520ms }`).
2. Inside each open card, the CO₂e box and the price lines fade 120 ms after the card (`anim-delay-120` +
   `animate-fade-in` on those blocks), so the number lands first.
3. After the stagger (about 450 ms), the recommended card gets **one** `wq-ring` pulse and its price counts up from the
   cheapest linear alternative to its own value. Add a `from` prop to `AnimatedNumber`
   (`useState(from ?? value)` and run the tween on mount when `from` is set).
4. The decision strip numbers (P2) tick at the same moment, so the eye reads strip and card together.
5. Nothing loops, nothing animates on hover except `wq-lift` on open cards.

## P7. Photo step hero (`PhotoStep.tsx`)

The new hero is strong. Remaining polish:

1. **Continuity into the analysing screen.** Today a demo photo jumps into a dark panel. Use a shared-element
   View Transition where supported (Chrome, Safari 18+), plain swap elsewhere:

   ```tsx
   // demo card <img>: style={{ viewTransitionName: picked === name ? "wq-photo" : undefined }}
   // Analysing <img>: style={{ viewTransitionName: "wq-photo" }}
   const start = (fn: () => void) => (document as any).startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches
     ? (document as any).startViewTransition(fn) : fn();
   // in pickDemo / onPick: start(() => flushSync(() => setAnalysing(true)))
   ```
   ```css
   ::view-transition-group(wq-photo) { animation-duration: 420ms; animation-timing-function: var(--ease-out-expo); }
   ```
2. **Drop zone**: give it the dark viewfinder look of the analysing panel (`bg-ink text-white`, the same corner
   brackets) so step 1 and "reading" are one frame that comes alive. On `drag` state, brackets move in 8 px
   (`transition-[inset] duration-300 ease-out-expo`).
3. **Eyebrow**: drop the tracked uppercase `NEW QUOTE` label above the headline; the stepper already says where you
   are.
4. **Demo cards**: `wq-lift` plus `group-hover:scale-[1.03]` on the image (`transition-transform duration-500
   ease-out-expo`), and on click a 120 ms `press` before the transition starts.

## P8. Classify step confidence and flag UI (`ReviewStep.tsx`, `ui.tsx`)

The `Check this` pill and `Confirm` button are the right model. To make it faster and calmer:

1. **Never disable "Configure service".** Keep it enabled; if fields are pending, scroll to the first one and pulse
   it once instead of doing nothing:
   ```tsx
   onClick={() => pending.length ? document.getElementById(`field-${pending[0].key}`)?.scrollIntoView({ block: "center", behavior: "smooth" }) || setPulse(pending[0].key) : onNext()}
   // Field wrapper: id={`field-${label}`} className={cx(pulse === label && "wq-ring")}
   ```
   with the ring colour switched to `--color-flag` for this case.
2. **ConfidenceMeter** (`ui.tsx`): `w-14` to `w-20`, threshold tick `w-px bg-ink/40` to `w-0.5 bg-ink`, and grow
   the fill on mount (`origin-left animate-grow-x`). Add the threshold to the tooltip:
   `title={\`Model confidence ${pct}. Fields under ${threshold * 100}% need a check.\`}`.
3. **Confirm feedback**: on confirm, `animate-pop` on the button and fade the flag border out over 300 ms
   (`transition-[border-color,box-shadow] duration-300` is there; add `ease-out-quart`).
4. **Pending count** in the action bar as a pill with the number in mono: `1 field to check` rather than a sentence.
5. Hazard box title `CHECK BEFORE COLLECTION` and `CIRCULAR OPPORTUNITY`: sentence case, 14 px semibold. All-caps
   tracked labels read as template chrome.

## P9. Section titles (`ui.tsx`, `SectionTitle`)

The app pages now use 40 to 66 px headlines; the wizard steps sit at 20 px under a `STEP 2` eyebrow. Match the
scale and drop the eyebrow (the stepper carries the step number):

```tsx
<h2 className="text-[26px] font-semibold leading-tight tracking-[-0.025em] sm:text-[32px]">{title}</h2>
{hint && <div className="hidden text-right text-[12px] text-muted sm:block">{hint}</div>}
```

The hint is hidden on phones because it wraps into three lines under the title (seen at 390 px on Compare).

## P10. "Ask Selinsight" button placement (`ChatPanel.tsx` line 160)

At 1440 px the floating button covers the bottom of the aside's "Selected route" card; at 390 px on Compare it sits
on top of the price lines, just above the sticky accept bar.

- Phones: icon-only and above the bar: `h-12 w-12 justify-center p-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))]`,
  hide the text with `sr-only sm:not-sr-only`.
- `lg` and up: render the button inside the wizard aside, under the rules pill, instead of `fixed`.

## P11. Sticky accept bar (`CompareStep.tsx`)

- Respect the home indicator: `pb-[max(1rem,env(safe-area-inset-bottom))]`.
- On phones, show route name and price stacked on the left (`text-[12px] text-muted` over the animated price),
  button right; today only the price shows.
- While accepting: keep the label, add a 2 px indeterminate bar along the top edge of the bar (`wq-indeterminate`
  exists) instead of swapping the text to `Generating quote…`, so the button does not change width.
- The quote page now opens with the accepted price revealing (`animate-num-in`) and the route band drawing in. Keep
  the accept button green to the end so the hand-off reads as one motion.

## P12. Smaller items

- `RouteCard` header: `1. CIRCULAR` mono uppercase eyebrow above each route name. Replace with the route swatch
  and the name; put `Circular` / `Linear` as a 12 px label after the name.
- `ConfigureStep.tsx` blocked containers: the long rules-engine reason repeats for every card. Show one line
  (`Not offered for this stream`) and keep the engine reason in the tooltip.
- Analysing screen labels `SELINSIGHT AI · READING`, `CONFIGURATION`, `WASTE STREAM`: sentence case, no middle dot.
- Disabled container cards and closed routes: use the shared `.hatch` class, so "not allowed" looks the same in
  the wizard, the quote list and the price book.

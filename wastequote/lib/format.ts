const eurFmt = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const eurFmt2 = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const numFmt = new Intl.NumberFormat("en-IE", { maximumFractionDigits: 1 });
const intFmt = new Intl.NumberFormat("en-IE", { maximumFractionDigits: 0 });

export const eur = (n: number) => eurFmt.format(n);
export const eur2 = (n: number) => eurFmt2.format(n);
export const num = (n: number) => numFmt.format(n);
export const int = (n: number) => intFmt.format(n);
export const signedKg = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${intFmt.format(Math.abs(n))}`;
export const tonnes = (n: number) => (n < 10 ? numFmt.format(Math.round(n * 100) / 100) : intFmt.format(n));
export const pct = (n: number) => `${Math.round(n * 100)}%`;
export const date = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

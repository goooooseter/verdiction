import type { Outcome } from "@/types/market";

export function totalPool(xpGuilty: number, xpNotGuilty: number) {
  return xpGuilty + xpNotGuilty;
}

export function impliedPercent(xpGuilty: number, xpNotGuilty: number, outcome: Outcome) {
  const t = totalPool(xpGuilty, xpNotGuilty);
  if (t <= 0) return 50;
  return outcome === "GUILTY" ? (xpGuilty / t) * 100 : (xpNotGuilty / t) * 100;
}

export function normalizedPriceBase100(xpGuilty: number, xpNotGuilty: number, outcome: Outcome) {
  const p = impliedPercent(xpGuilty, xpNotGuilty, outcome);
  return (p / 100) * 100;
}

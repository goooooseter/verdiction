export type Outcome = "GUILTY" | "NOT_GUILTY";

export interface MarketPoolRow {
  market_id: string;
  xp_guilty: number;
  xp_not_guilty: number;
  updated_at?: string;
}

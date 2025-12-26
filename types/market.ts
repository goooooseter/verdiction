export type Outcome = "GUILTY" | "NOT_GUILTY";

export interface MarketPoolRow {
  case_id: number;
  xp_guilty: number;
  xp_not_guilty: number;
  updated_at?: string;
}

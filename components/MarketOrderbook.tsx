"use client";

import { useEffect, useMemo, useState } from "react";
import type { MarketPoolRow } from "@/types/market";
import { createSupabaseBrowser } from "@/utils/supabase/client";
import { impliedPercent, normalizedPriceBase100, totalPool } from "@/utils/market/orderbookMath";

type Props = {
  marketId: string;
  realtime?: boolean;
};

export default function MarketOrderbook({ marketId, realtime = true }: Props) {
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const [pool, setPool] = useState<MarketPoolRow>({ market_id: marketId, xp_guilty: 50, xp_not_guilty: 50 });

  async function load() {
    const { data } = await supabase
      .from("market_pools")
      .select("market_id,xp_guilty,xp_not_guilty,updated_at")
      .eq("market_id", marketId)
      .single();

    if (!data) return;
    setPool({
      market_id: data.market_id,
      xp_guilty: Number(data.xp_guilty),
      xp_not_guilty: Number(data.xp_not_guilty),
      updated_at: data.updated_at ?? undefined,
    });
  }

  useEffect(() => {
    load();

    if (!realtime) return;

    const ch = supabase
      .channel(`market_pools:${marketId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "market_pools", filter: `market_id=eq.${marketId}` },
        (payload) => {
          const row: any = payload.new;
          if (!row) return;
          setPool({
            market_id: row.market_id,
            xp_guilty: Number(row.xp_guilty),
            xp_not_guilty: Number(row.xp_not_guilty),
            updated_at: row.updated_at ?? undefined,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [marketId, realtime, supabase]);

  const xpG = pool.xp_guilty;
  const xpN = pool.xp_not_guilty;

  const pctG = impliedPercent(xpG, xpN, "GUILTY");
  const pctN = impliedPercent(xpG, xpN, "NOT_GUILTY");

  const priceG = normalizedPriceBase100(xpG, xpN, "GUILTY");
  const priceN = normalizedPriceBase100(xpG, xpN, "NOT_GUILTY");

  const t = totalPool(xpG, xpN);

  return (
    <div className="w-full max-w-xl rounded-lg border p-4 space-y-3">
      <div className="text-lg font-semibold">Orderbook</div>

      <div className="text-sm opacity-80">Total: {t.toFixed(2)} XP</div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-md border p-3 space-y-1">
          <div className="font-medium">GUILTY</div>
          <div className="text-sm opacity-80">{pctG.toFixed(2)}%</div>
          <div className="text-sm">Price (base 100): {priceG.toFixed(2)}</div>
          <div className="text-sm">Pool XP: {xpG.toFixed(2)}</div>
        </div>

        <div className="rounded-md border p-3 space-y-1">
          <div className="font-medium">NOT_GUILTY</div>
          <div className="text-sm opacity-80">{pctN.toFixed(2)}%</div>
          <div className="text-sm">Price (base 100): {priceN.toFixed(2)}</div>
          <div className="text-sm">Pool XP: {xpN.toFixed(2)}</div>
        </div>
      </div>

      {pool.updated_at && <div className="text-xs opacity-60">Updated: {pool.updated_at}</div>}
    </div>
  );
}

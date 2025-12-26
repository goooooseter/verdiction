"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type Props = {
  caseId: number;
};

type PoolState = {
  xpGuilty: number;
  xpNotGuilty: number;
  bets: number;
};

function totalPool(g: number, n: number) {
  return g + n;
}

function impliedPercent(g: number, n: number, guilty: boolean) {
  const t = totalPool(g, n);
  if (t <= 0) return 50;
  return guilty ? (g / t) * 100 : (n / t) * 100;
}

export default function MarketOrderbook({ caseId }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [pool, setPool] = useState<PoolState>({ xpGuilty: 0, xpNotGuilty: 0, bets: 0 });

  const load = async () => {
    const { data, error } = await supabase
      .from("votes")
      .select("prediction,amount")
      .eq("case_id", caseId);

    if (error || !data) return;

    let g = 0;
    let n = 0;

    for (const row of data as any[]) {
      const amt = Number(row.amount ?? 0);
      const pred = Boolean(row.prediction);
      if (pred) g += amt;
      else n += amt;
    }

    setPool({ xpGuilty: g, xpNotGuilty: n, bets: data.length });
  };

  useEffect(() => {
    load();

    const channel = supabase
      .channel("votes_case_" + String(caseId))
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "votes",
          filter: "case_id=eq." + String(caseId),
        },
        () => {
          load();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  const g = pool.xpGuilty;
  const n = pool.xpNotGuilty;

  const pctG = g + n > 0 ? impliedPercent(g, n, true) : 50;
  const pctN = g + n > 0 ? impliedPercent(g, n, false) : 50;

  const priceG = pctG;
  const priceN = pctN;

  const t = totalPool(g, n);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-2">
      <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Спрогнозировать</div>
      <div className="text-xs text-slate-500">
        Total: {t.toFixed(0)} XP · Bets: {pool.bets}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-slate-800 p-3">
          <div className="text-sm font-bold text-emerald-300">ВИНОВЕН</div>
          <div className="text-xs text-slate-400">{pctG.toFixed(2)}%</div>
          <div className="text-xs text-slate-400">Цена: {priceG.toFixed(2)}</div>
          <div className="text-xs text-slate-500">Pool XP: {g.toFixed(0)}</div>
        </div>

        <div className="rounded-lg border border-slate-800 p-3">
          <div className="text-sm font-bold text-rose-300">НЕВИНОВЕН</div>
          <div className="text-xs text-slate-400">{pctN.toFixed(2)}%</div>
          <div className="text-xs text-slate-400">Цена: {priceN.toFixed(2)}</div>
          <div className="text-xs text-slate-500">Pool XP: {n.toFixed(0)}</div>
        </div>
      </div>
    </div>
  );
}
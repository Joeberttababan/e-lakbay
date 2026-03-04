import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '../ui/skeleton';
import { supabase } from '../../lib/supabaseClient';
import { DailyTouristData, DateFilter, getDateCutoff, formatDateLabel, generateDateRange } from './types';

// ─── data fetcher ─────────────────────────────────────────────────────────────

async function fetchDailyTourists(cutoff: string | null): Promise<DailyTouristData[]> {
  // Try the view first (fast, bypasses RLS)
  try {
    let viewQ = supabase
      .from('daily_tourist_signups')
      .select('signup_date, tourist_count')
      .order('signup_date', { ascending: true });
    if (cutoff) viewQ = viewQ.gte('signup_date', cutoff.slice(0, 10));

    const { data: viewData, error: viewErr } = await viewQ;
    if (!viewErr && viewData && viewData.length > 0) {
      console.log('[DailyTouristsChart] Loaded from view:', viewData.length, 'rows');
      return viewData.map((r: { signup_date: string; tourist_count: number }) => ({
        date: String(r.signup_date),
        count: Number(r.tourist_count),
      }));
    }
    if (viewErr) console.warn('[DailyTouristsChart] View unavailable:', viewErr.message);
  } catch {
    // view doesn't exist, fall through
  }

  // Fallback: query profiles table directly
  let q = supabase
    .from('profiles')
    .select('created_at')
    .eq('role', 'tourist')
    .order('created_at', { ascending: true });
  if (cutoff) q = q.gte('created_at', cutoff);

  const { data, error } = await q;
  if (error) {
    console.error('[DailyTouristsChart] profiles query error:', error);
    return [];
  }

  console.log('[DailyTouristsChart] Loaded from profiles:', (data ?? []).length, 'tourist rows');

  const countByDate = new Map<string, number>();
  for (const row of data ?? []) {
    const d = (row.created_at ?? '').slice(0, 10);
    if (!d) continue;
    countByDate.set(d, (countByDate.get(d) ?? 0) + 1);
  }

  return Array.from(countByDate.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ─── chart component ──────────────────────────────────────────────────────────

const BAR_AREA_HEIGHT = 200; // px – fixed known height for reliable bar sizing

const DailyTouristsChart: React.FC = () => {
  const [dateFilter, setDateFilter] = useState<DateFilter>('30');

  const cutoff = useMemo(() => {
    const d = getDateCutoff(dateFilter);
    return d ? d.toISOString() : null;
  }, [dateFilter]);

  const { data: rawData, isPending } = useQuery({
    queryKey: ['daily-tourists-chart', dateFilter],
    queryFn: () => fetchDailyTourists(cutoff),
    staleTime: 2 * 60 * 1000,
  });

  // Zero-fill date gaps
  const chartData = useMemo<DailyTouristData[]>(() => {
    const raw = rawData ?? [];
    const dateRange = generateDateRange(dateFilter);
    if (dateRange.length === 0) return raw; // "all" filter – no zero-fill
    const rawMap = new Map(raw.map((d) => [d.date, d.count]));
    return dateRange.map((date) => ({ date, count: rawMap.get(date) ?? 0 }));
  }, [rawData, dateFilter]);

  const maxCount = useMemo(() => Math.max(...chartData.map((d) => d.count), 1), [chartData]);
  const totalTourists = useMemo(() => chartData.reduce((s, d) => s + d.count, 0), [chartData]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
        <div>
          <h3 className="text-lg font-semibold">Daily New Tourists</h3>
          <p className="text-sm text-white/60">
            Based on tourist account creation
            {!isPending && (
              <span className="ml-2 text-white/40">
                ({totalTourists} total in period)
              </span>
            )}
          </p>
        </div>
        {/* Date filter pills */}
        <div className="flex gap-1">
          {(
            [
              { value: '7', label: '7d' },
              { value: '30', label: '30d' },
              { value: '90', label: '90d' },
              { value: 'all', label: 'All' },
            ] as { value: DateFilter; label: string }[]
          ).map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setDateFilter(f.value)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                dateFilter === f.value
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart area */}
      {isPending ? (
        <div className="h-64 flex items-center justify-center">
          <Skeleton className="h-full w-full rounded-lg" />
        </div>
      ) : chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-white/60">
          No tourist data available for the selected period.
        </div>
      ) : (
        <div className="mt-4 relative min-h-60">
          {/* Y-axis labels */}
          <div
            className="absolute left-0 top-0 w-8 flex flex-col justify-between text-[10px] text-white/40 h-50"
          >
            <span>{maxCount}</span>
            <span>{Math.round(maxCount / 2)}</span>
            <span>0</span>
          </div>

          {/* Bars */}
          <div
            className="flex items-end gap-0.5 ml-10 overflow-x-auto hide-scrollbar h-50"
          >
            {chartData.map((day) => {
              const barHeight =
                day.count > 0
                  ? Math.max((day.count / maxCount) * BAR_AREA_HEIGHT, 3)
                  : 2;
              return (
                <div
                  key={day.date}
                  className="flex-1 min-w-1.5 max-w-10 flex flex-col items-center justify-end group h-50"
                >
                  <motion.div
                    className={`w-full rounded-t relative cursor-pointer ${
                      day.count > 0
                        ? 'bg-blue-500/70 hover:bg-blue-400'
                        : 'bg-white/6'
                    }`}
                    initial={{ height: 0 }}
                    animate={{ height: barHeight }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  >
                    {/* Tooltip */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 border border-white/10 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      <span className="font-medium">{day.count}</span> tourist
                      {day.count !== 1 ? 's' : ''}{' '}
                      <span className="text-white/50">· {formatDateLabel(day.date)}</span>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>

          {/* X-axis date labels (sampled to avoid clutter) */}
          <div className="flex ml-10 mt-2 overflow-x-auto hide-scrollbar">
            {chartData.map((day, i) => {
              // Show label every N bars depending on total count
              const step = chartData.length <= 14 ? 1 : chartData.length <= 31 ? 3 : 7;
              const showLabel = i % step === 0 || i === chartData.length - 1;
              return (
                <div key={day.date} className="flex-1 min-w-1.5 max-w-10 text-center">
                  {showLabel && (
                    <span className="text-[8px] sm:text-[10px] text-white/40 whitespace-nowrap">
                      {formatDateLabel(day.date)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyTouristsChart;

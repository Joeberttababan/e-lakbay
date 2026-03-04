import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import StatsBoxes from './StatsBoxes';
import MunicipalityStatsTable from './MunicipalityStatsTable';
import DailyTouristsChart from './DailyTouristsChart';
import {
  AnalyticsData,
  MunicipalityStats,
  DateFilter,
  ContentTab,
  getDateCutoff,
} from './types';

// ─── helpers ──────────────────────────────────────────────────────────────────

const cutoffISO = (filter: DateFilter): string | null => {
  const d = getDateCutoff(filter);
  return d ? d.toISOString() : null;
};

// ─── data fetchers ────────────────────────────────────────────────────────────

/** Fetch all profiles with role='municipality' so we always show them all. */
async function fetchMunicipalityProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'municipality');
  if (error) console.error('[admin-analytics] profiles error', error);

  type Row = { id: string; full_name: string | null; email: string | null };
  return (data ?? []) as Row[];
}

/**
 * Fetch per-owner breakdown from the municipality_analytics_summary VIEW.
 * Columns: destination_sessions, product_sessions, destination_queries,
 *          product_queries, general_sessions.
 */
async function fetchViewSummary() {
  const { data, error } = await supabase
    .from('municipality_analytics_summary')
    .select('owner_id, destination_sessions, product_sessions, destination_queries, product_queries, general_sessions');
  if (error) console.error('[admin-analytics] view summary error', error);

  type Row = {
    owner_id: string;
    destination_sessions: number;
    product_sessions: number;
    destination_queries: number;
    product_queries: number;
    general_sessions: number;
  };
  return (data ?? []) as Row[];
}

/**
 * Fetch ratings scoped to destinations OR products,
 * mapping content → owner user_id → ratings.
 */
async function fetchRatingsByUser(cutoff: string | null, contentTab: ContentTab) {
  const ratingsTable = contentTab === 'destinations' ? 'destination_ratings' : 'product_ratings';
  const contentTable = contentTab === 'destinations' ? 'destinations' : 'products';
  const fkField = contentTab === 'destinations' ? 'destination_id' : 'product_id';

  const { data: contentRows, error: cErr } = await supabase
    .from(contentTable)
    .select('id, user_id');
  if (cErr) console.error('[admin-analytics] content query error', cErr);

  const contentToUser = new Map<string, string>();
  for (const row of contentRows ?? []) {
    if (row.user_id) contentToUser.set(row.id, row.user_id);
  }

  let q = supabase
    .from(ratingsTable)
    .select(`rating, ${fkField}`)
    .order('created_at', { ascending: false });
  if (cutoff) q = q.gte('created_at', cutoff);

  const { data, error } = await q;
  if (error) console.error('[admin-analytics] ratings error', error);

  const map = new Map<string, { sum: number; count: number }>();
  let totalCount = 0;
  let totalSum = 0;

  for (const row of (data ?? []) as Record<string, unknown>[]) {
    const contentId = row[fkField] as string | null;
    if (!contentId) continue;
    const userId = contentToUser.get(contentId);
    if (!userId) continue;
    const rating = row.rating as number;
    const entry = map.get(userId) ?? { sum: 0, count: 0 };
    entry.sum += rating;
    entry.count += 1;
    map.set(userId, entry);
    totalCount += 1;
    totalSum += rating;
  }

  return {
    perUser: map,
    totalCount,
    totalAvg: totalCount > 0 ? totalSum / totalCount : 0,
  };
}

// ─── main component ───────────────────────────────────────────────────────────

const AnalyticsTab: React.FC = () => {
  const [dateFilter, setDateFilter] = useState<DateFilter>('30');
  const [contentTab, setContentTab] = useState<ContentTab>('destinations');
  const cutoff = cutoffISO(dateFilter);

  // ── all municipality profiles (always show every one) ──
  const { data: muniProfiles, isPending: isProfilesPending } = useQuery({
    queryKey: ['admin-analytics', 'municipality-profiles'],
    queryFn: fetchMunicipalityProfiles,
    staleTime: 5 * 60 * 1000,
  });

  // ── sessions & queries from the view table ──
  const { data: viewRows, isPending: isViewPending } = useQuery({
    queryKey: ['admin-analytics', 'view-summary'],
    queryFn: fetchViewSummary,
  });

  // ── ratings per user, scoped by content tab ──
  const { data: ratingData, isPending: isRatingsPending } = useQuery({
    queryKey: ['admin-analytics', 'ratings', dateFilter, contentTab],
    queryFn: () => fetchRatingsByUser(cutoff, contentTab),
  });

  const isLoading = isProfilesPending || isViewPending || isRatingsPending;

  // ── build per-municipality stats ──
  const analyticsData = useMemo<AnalyticsData>(() => {
    const profiles = muniProfiles ?? [];
    const ratingMap = ratingData?.perUser ?? new Map<string, { sum: number; count: number }>();

    // Build a lookup from the view rows
    type ViewEntry = {
      destination_sessions: number;
      product_sessions: number;
      destination_queries: number;
      product_queries: number;
      general_sessions: number;
    };
    const viewMap = new Map<string, ViewEntry>();
    for (const row of viewRows ?? []) {
      viewMap.set(row.owner_id, {
        destination_sessions: row.destination_sessions ?? 0,
        product_sessions: row.product_sessions ?? 0,
        destination_queries: row.destination_queries ?? 0,
        product_queries: row.product_queries ?? 0,
        general_sessions: row.general_sessions ?? 0,
      });
    }

    // Grand totals: sum ALL session & query columns from the view (not tab-filtered)
    let grandVisits = 0;
    let grandQueries = 0;
    for (const row of viewRows ?? []) {
      grandVisits += (row.destination_sessions ?? 0) + (row.product_sessions ?? 0) + (row.general_sessions ?? 0);
      grandQueries += (row.destination_queries ?? 0) + (row.product_queries ?? 0);
    }

    // Build a row for EVERY municipality profile, mapping by id === owner_id
    const municipalityStats: MunicipalityStats[] = profiles.map((p) => {
      const v = viewMap.get(p.id);
      // Switch visits & queries based on the active content tab
      const visits = contentTab === 'destinations'
        ? (v?.destination_sessions ?? 0)
        : (v?.product_sessions ?? 0);
      const queries = contentTab === 'destinations'
        ? (v?.destination_queries ?? 0)
        : (v?.product_queries ?? 0);
      const profileVisits = v?.general_sessions ?? 0;
      const rEntry = ratingMap.get(p.id);
      const ratingCount = rEntry?.count ?? 0;
      const avgRating = ratingCount > 0 ? rEntry!.sum / ratingCount : 0;

      return {
        municipality: p.full_name || p.email || p.id,
        visits,
        queries,
        profileVisits,
        ratingCount,
        avgRating: Math.round(avgRating * 100) / 100,
      };
    });

    municipalityStats.sort((a, b) => b.visits - a.visits || a.municipality.localeCompare(b.municipality));

    return {
      totalVisits: grandVisits,
      totalQueries: grandQueries,
      totalRatings: ratingData?.totalCount ?? 0,
      avgRating: ratingData?.totalAvg ?? 0,
      municipalityStats,
      dailyTourists: [],
    };
  }, [muniProfiles, viewRows, contentTab, ratingData, dateFilter]);

  return (
    <motion.section
      className="mt-5"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Municipality Analytics</h2>
        <p className="text-sm text-white/60 mt-1">
          Track visits and engagement across all municipality users
        </p>
      </div>

      {/* Date filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(
          [
            { value: '7', label: 'Last 7 days' },
            { value: '30', label: 'Last 30 days' },
            { value: '90', label: 'Last 90 days' },
            { value: 'all', label: 'All time' },
          ] as { value: DateFilter; label: string }[]
        ).map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setDateFilter(f.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              dateFilter === f.value
                ? 'bg-white/10 text-white border border-white/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Top-level totals */}
      <StatsBoxes
        loading={isLoading}
        totalVisits={analyticsData.totalVisits}
        totalQueries={analyticsData.totalQueries}
        totalRatings={analyticsData.totalRatings}
        avgRating={analyticsData.avgRating}
      />

      {/* Content Tabs: Destinations / Products */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setContentTab('destinations')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            contentTab === 'destinations'
              ? 'bg-white/10 text-white border border-white/20'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          Destinations
        </button>
        <button
          type="button"
          onClick={() => setContentTab('products')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            contentTab === 'products'
              ? 'bg-white/10 text-white border border-white/20'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          Products
        </button>
      </div>

      {/* Municipality breakdown */}
      <MunicipalityStatsTable loading={isLoading} stats={analyticsData.municipalityStats} />

      {/* Daily tourists chart – self-contained, fetches its own data */}
      <DailyTouristsChart />
    </motion.section>
  );
};

export default AnalyticsTab;

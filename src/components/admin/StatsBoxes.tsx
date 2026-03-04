import React from 'react';
import { Eye, Star, TrendingUp, Search } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

type StatsBoxesProps = {
  loading: boolean;
  totalVisits: number;
  totalQueries: number;
  totalRatings: number;
  avgRating: number;
};

const StatsBoxes: React.FC<StatsBoxesProps> = ({
  loading,
  totalVisits,
  totalQueries,
  totalRatings,
  avgRating,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-500/20">
            <Eye className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-white/60">Total Visits</p>
            {loading ? (
              <Skeleton className="h-8 w-20 mt-1" />
            ) : (
              <p className="text-2xl font-bold">{totalVisits.toLocaleString()}</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-500/20">
            <Search className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <p className="text-sm text-white/60">Total Queries</p>
            {loading ? (
              <Skeleton className="h-8 w-20 mt-1" />
            ) : (
              <p className="text-2xl font-bold">{totalQueries.toLocaleString()}</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-yellow-500/20">
            <Star className="h-6 w-6 text-yellow-400" />
          </div>
          <div>
            <p className="text-sm text-white/60">Total Ratings</p>
            {loading ? (
              <Skeleton className="h-8 w-20 mt-1" />
            ) : (
              <p className="text-2xl font-bold">{totalRatings.toLocaleString()}</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-green-500/20">
            <TrendingUp className="h-6 w-6 text-green-400" />
          </div>
          <div>
            <p className="text-sm text-white/60">Avg Rating</p>
            {loading ? (
              <Skeleton className="h-8 w-20 mt-1" />
            ) : (
              <p className="text-2xl font-bold">{avgRating.toFixed(2)}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsBoxes;

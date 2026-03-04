import React from 'react';
import { Star } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Skeleton } from '../ui/skeleton';
import { MunicipalityStats } from './types';

type MunicipalityStatsTableProps = {
  loading: boolean;
  stats: MunicipalityStats[];
};

const MunicipalityStatsTable: React.FC<MunicipalityStatsTableProps> = ({ loading, stats }) => {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Municipality Statistics</h3>
      <div className="overflow-x-auto">
        <Table className="text-white">
          <TableHeader>
            <TableRow className="border-white/10">
              <TableHead className="text-white/50">Municipality</TableHead>
              <TableHead className="text-white/50 text-right">Visits</TableHead>
              <TableHead className="text-white/50 text-right">Queries</TableHead>
              <TableHead className="text-white/50 text-right">Profile Visits</TableHead>
              <TableHead className="text-white/50 text-right"># Ratings</TableHead>
              <TableHead className="text-white/50 text-right">Avg Rating</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`analytics-skeleton-${index}`} className="border-white/10">
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : stats.length === 0 ? (
              <TableRow className="border-white/10">
                <TableCell colSpan={6} className="py-6 text-center text-white/60">
                  No data available for the selected period.
                </TableCell>
              </TableRow>
            ) : (
              stats.map((stat) => (
                <TableRow key={stat.municipality} className="border-white/10">
                  <TableCell className="font-medium">{stat.municipality}</TableCell>
                  <TableCell className="text-right text-white/70">{stat.visits.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-white/70">{stat.queries.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-white/70">{stat.profileVisits.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-white/70">{stat.ratingCount.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <span className="flex items-center justify-end gap-1">
                      {stat.avgRating.toFixed(2)}
                      <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default MunicipalityStatsTable;

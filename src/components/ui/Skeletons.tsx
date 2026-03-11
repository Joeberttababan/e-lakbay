import React from 'react';
import { Skeleton } from './skeleton';

interface SkeletonListProps {
  count: number;
  render: (index: number) => React.ReactNode;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({ count, render }) => (
  <>
    {Array.from({ length: count }).map((_, index) => render(index))}
  </>
);

export const ProductTileSkeleton: React.FC = () => (
  <div className="rounded-3xl glass-card p-3 sm:p-4">
    <div className="relative aspect-square rounded-2xl overflow-hidden">
      <Skeleton className="h-full w-full rounded-2xl" />
      <Skeleton className="absolute top-2 right-2 h-9 w-9 rounded-full" />
      <Skeleton className="absolute bottom-3 left-3 h-4 w-2/3 rounded-full" />
    </div>
    <div className="mt-3 flex gap-1">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={`star-skeleton-${index}`} className="h-3 w-3 rounded-full" />
      ))}
    </div>
  </div>
);

export const DestinationTileSkeleton: React.FC = () => (
  <article className="rounded-2xl glass-card p-4 flex flex-col h-full">
    <Skeleton className="aspect-4/3 w-full rounded-xl" />
    <div className="flex flex-1 flex-col gap-2 pt-4">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-4 w-1/2 rounded-full" />
        <Skeleton className="h-3 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full rounded-full" />
      <Skeleton className="h-3 w-5/6 rounded-full" />
    </div>
  </article>
);

export const DestinationModalCardSkeleton: React.FC = () => (
  <article className="rounded-2xl glass-card p-4 sm:p-6 flex flex-col gap-5">
    <Skeleton className="h-56 sm:h-72 lg:h-80 w-full rounded-2xl" />
    <div className="rounded-2xl p-4 sm:p-5 flex flex-col gap-4">
      <Skeleton className="h-4 w-2/3 rounded-full" />
      <Skeleton className="h-6 w-1/2 rounded-full" />
      <Skeleton className="h-3 w-full rounded-full" />
      <Skeleton className="h-3 w-5/6 rounded-full" />
    </div>
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-40 rounded-full" />
      <Skeleton className="h-8 w-24 rounded-full" />
    </div>
  </article>
);

export const ProductCardSkeleton: React.FC = () => (
  <article className="rounded-2xl glass-card p-4 sm:p-5 flex flex-col h-105 overflow-hidden">
    <Skeleton className="aspect-4/3 w-full rounded-xl" />
    <div className="flex flex-1 flex-col gap-3 pt-4">
      <Skeleton className="h-5 w-2/3 rounded-full" />
      <Skeleton className="h-3 w-1/2 rounded-full" />
      <Skeleton className="h-3 w-full rounded-full" />
      <Skeleton className="h-3 w-5/6 rounded-full" />
      <Skeleton className="h-4 w-24 rounded-full" />
    </div>
  </article>
);

interface TopDestinationSkeletonProps {
  className?: string;
}

export const TopDestinationSkeleton: React.FC<TopDestinationSkeletonProps> = ({ className }) => (
  <div className={`relative min-w-[90%] sm:min-w-[60%] lg:min-w-[35%] aspect-square rounded-2xl glass-card overflow-hidden ${className ?? ''}`}>
    <Skeleton className="h-full w-full rounded-2xl" />
    <div className="absolute inset-x-0 bottom-0 p-4 flex items-end justify-between">
      <div className="space-y-2 w-3/4">
        <Skeleton className="h-4 w-2/3 rounded-full" />
        <Skeleton className="h-3 w-1/2 rounded-full" />
      </div>
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>
  </div>
);

export const ProfileHeaderSkeleton: React.FC = () => (
  <div className="flex items-center gap-4 glass-card rounded-2xl p-4">
    <Skeleton className="h-16 w-16 sm:h-20 sm:w-20 rounded-full" />
    <div>
      <Skeleton className="h-6 w-40 rounded-full" />
      <Skeleton className="h-3 w-56 mt-2 rounded-full" />
    </div>
  </div>
);

export const ProfileChipSkeleton: React.FC = () => (
  <div className="flex flex-col items-center gap-1 text-center min-w-18 glass-card rounded-2xl p-3">
    <Skeleton className="h-14 w-14 rounded-full" />
    <Skeleton className="h-3 w-12 rounded-full" />
  </div>
);

export const AnalyticsDashboardSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Key Metrics */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={`metric-skeleton-${index}`} className="glass-secondary rounded-2xl p-5 border border-black/10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Skeleton className="h-3 w-24 rounded-full mb-2" />
              <Skeleton className="h-8 w-32 rounded-full mb-3" />
            </div>
            <Skeleton className="h-12 w-12 rounded-lg" />
          </div>
          <Skeleton className="h-2 w-20 rounded-full" />
        </div>
      ))}
    </div>

    {/* Daily Visits Chart */}
    <div className="glass-secondary rounded-2xl p-5 border border-black/10">
      <Skeleton className="h-4 w-40 rounded-full mb-4" />
      <Skeleton className="h-80 w-full rounded-xl" />
    </div>

    {/* Traffic Sources and Device Type Row */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Traffic Sources Pie */}
      <div className="glass-secondary rounded-2xl p-5 border border-black/10">
        <Skeleton className="h-4 w-40 rounded-full mb-4" />
        <Skeleton className="h-64 w-full rounded-xl mx-auto" />
      </div>

      {/* Device Type Pie */}
      <div className="glass-secondary rounded-2xl p-5 border border-black/10">
        <Skeleton className="h-4 w-40 rounded-full mb-4" />
        <Skeleton className="h-64 w-full rounded-xl mx-auto" />
      </div>
    </div>

    {/* Browser and Destinations/Products Row */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Browser Chart */}
      <div className="glass-secondary rounded-2xl p-5 border border-black/10">
        <Skeleton className="h-4 w-40 rounded-full mb-4" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>

      {/* Top Destinations and Products */}
      <div className="space-y-4">
        <div className="glass-secondary rounded-2xl p-5 border border-black/10">
          <Skeleton className="h-4 w-40 rounded-full mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={`dest-skeleton-${index}`} className="flex justify-between items-center">
                <Skeleton className="h-3 w-32 rounded-full" />
                <Skeleton className="h-3 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        <div className="glass-secondary rounded-2xl p-5 border border-black/10">
          <Skeleton className="h-4 w-40 rounded-full mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={`prod-skeleton-${index}`} className="flex justify-between items-center">
                <Skeleton className="h-3 w-32 rounded-full" />
                <Skeleton className="h-3 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

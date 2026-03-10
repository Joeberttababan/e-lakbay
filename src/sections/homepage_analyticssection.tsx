import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from '../components/modern-ui/breadcrumb';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';

interface AnalyticsItem {
  id: string;
  name: string;
  count: number;
  rating?: number;
}

interface AnalyticsSectionData {
  mostSearched: AnalyticsItem[];
  mostVisited: AnalyticsItem[];
  topRatedDestinations: AnalyticsItem[];
  topRatedProducts: AnalyticsItem[];
}

interface HomepageAnalyticsSectionProps {
  onViewDestination?: (destinationId: string) => void;
  onViewProduct?: (productId: string) => void;
}

export const HomepageAnalyticsSection: React.FC<HomepageAnalyticsSectionProps> = ({
  onViewDestination,
  onViewProduct,
}) => {
  const [activeCategory, setActiveCategory] = useState<'most-searched' | 'most-visited' | 'top-rated-destinations' | 'top-rated-products'>('most-searched');

  const { data: analyticsData, isPending: isAnalyticsPending } = useQuery({
    queryKey: ['analytics', 'homepage'],
    queryFn: async (): Promise<AnalyticsSectionData> => {
      try {
        // Get most searched destinations
        const { data: searchData, error: searchError } = await supabase
          .from('analytics_events')
          .select('metadata, destination_id, search_query')
          .eq('event_name', 'search_performed')
          .not('search_query', 'is', null)
          .order('created_at', { ascending: false });

        if (searchError) throw searchError;

        // Count search occurrences by destination
        const searchMap = new Map<string, { name: string; count: number }>();
        if (searchData) {
          for (const event of searchData) {
            if (event.search_query) {
              const key = event.search_query.toLowerCase();
              const current = searchMap.get(key);
              searchMap.set(key, {
                name: event.search_query,
                count: current ? current.count + 1 : 1,
              });
            }
          }
        }

        const mostSearched = Array.from(searchMap.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
          .map((item, idx) => ({
            id: `search_${idx}`,
            name: item.name,
            count: item.count,
          }));

        // Get most visited destinations
        const { data: pageViewData, error: pageViewError } = await supabase
          .from('analytics_events')
          .select('destination_id, metadata')
          .eq('event_name', 'page_view')
          .not('destination_id', 'is', null)
          .order('created_at', { ascending: false });

        if (pageViewError) throw pageViewError;

        const visitMap = new Map<string, number>();
        (pageViewData ?? []).forEach((event) => {
          if (event.destination_id) {
            visitMap.set(event.destination_id, (visitMap.get(event.destination_id) ?? 0) + 1);
          }
        });

        // Fetch destination names for most visited
        const destIds = Array.from(visitMap.keys()).slice(0, 10);
        let mostVisited: AnalyticsItem[] = [];

        if (destIds.length > 0) {
          const { data: destinations, error: destError } = await supabase
            .from('destinations')
            .select('id, destination_name')
            .in('id', destIds);

          if (destError) throw destError;

          mostVisited = destinations
            ?.map((dest) => ({
              id: dest.id,
              name: dest.destination_name,
              count: visitMap.get(dest.id) ?? 0,
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5) ?? [];
        }

        // Get top rated destinations
        const { data: ratingData, error: ratingError } = await supabase
          .from('destination_ratings')
          .select('destination_id, rating');

        if (ratingError) throw ratingError;

        const destRatingMap = new Map<string, { total: number; count: number }>();
        (ratingData ?? []).forEach((row) => {
          const current = destRatingMap.get(row.destination_id) ?? { total: 0, count: 0 };
          destRatingMap.set(row.destination_id, {
            total: current.total + (row.rating ?? 0),
            count: current.count + 1,
          });
        });

        const topDestIds = Array.from(destRatingMap.entries())
          .sort((a, b) => (b[1].total / b[1].count) - (a[1].total / a[1].count))
          .slice(0, 10)
          .map(([id]) => id);

        let topRatedDestinations: AnalyticsItem[] = [];
        if (topDestIds.length > 0) {
          const { data: topDests, error: topDestError } = await supabase
            .from('destinations')
            .select('id, destination_name')
            .in('id', topDestIds);

          if (topDestError) throw topDestError;

          topRatedDestinations = topDests
            ?.map((dest) => {
              const rating = destRatingMap.get(dest.id);
              return {
                id: dest.id,
                name: dest.destination_name,
                count: rating?.count ?? 0,
                rating: rating ? Number((rating.total / rating.count).toFixed(1)) : 0,
              };
            })
            .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
            .slice(0, 5) ?? [];
        }

        // Get top rated products
        const { data: prodRatingData, error: prodRatingError } = await supabase
          .from('product_ratings')
          .select('product_id, rating');

        if (prodRatingError) throw prodRatingError;

        const prodRatingMap = new Map<string, { total: number; count: number }>();
        (prodRatingData ?? []).forEach((row) => {
          const current = prodRatingMap.get(row.product_id) ?? { total: 0, count: 0 };
          prodRatingMap.set(row.product_id, {
            total: current.total + (row.rating ?? 0),
            count: current.count + 1,
          });
        });

        const topProdIds = Array.from(prodRatingMap.entries())
          .sort((a, b) => (b[1].total / b[1].count) - (a[1].total / a[1].count))
          .slice(0, 10)
          .map(([id]) => id);

        let topRatedProducts: AnalyticsItem[] = [];
        if (topProdIds.length > 0) {
          const { data: topProds, error: topProdError } = await supabase
            .from('products')
            .select('id, product_name')
            .in('id', topProdIds);

          if (topProdError) throw topProdError;

          topRatedProducts = topProds
            ?.map((prod) => {
              const rating = prodRatingMap.get(prod.id);
              return {
                id: prod.id,
                name: prod.product_name,
                count: rating?.count ?? 0,
                rating: rating ? Number((rating.total / rating.count).toFixed(1)) : 0,
              };
            })
            .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
            .slice(0, 5) ?? [];
        }

        return {
          mostSearched,
          mostVisited,
          topRatedDestinations,
          topRatedProducts,
        };
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        toast.error('Failed to load analytics data');
        return {
          mostSearched: [],
          mostVisited: [],
          topRatedDestinations: [],
          topRatedProducts: [],
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const categoryData = useMemo(() => {
    if (!analyticsData) return [];
    switch (activeCategory) {
      case 'most-searched':
        return analyticsData.mostSearched;
      case 'most-visited':
        return analyticsData.mostVisited;
      case 'top-rated-destinations':
        return analyticsData.topRatedDestinations;
      case 'top-rated-products':
        return analyticsData.topRatedProducts;
      default:
        return [];
    }
  }, [analyticsData, activeCategory]);

  const categoryTitle = useMemo(() => {
    switch (activeCategory) {
      case 'most-searched':
        return 'Most Searched';
      case 'most-visited':
        return 'Most Visited Destinations';
      case 'top-rated-destinations':
        return 'Top Rated Destinations';
      case 'top-rated-products':
        return 'Top Rated Products';
      default:
        return '';
    }
  }, [activeCategory]);

  return (
    <section id="analytics" className="w-full py-16 md:py-20 border-t border-black/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <h2 className="text-3xl md:text-4xl font-bold text-black mb-2">Analytics</h2>
        <p className="text-black/60 mb-8">Explore popular destinations, products and trending searches</p>

        {/* Breadcrumb Navigation */}
        <div className="mb-8 overflow-x-auto pb-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  onClick={() => setActiveCategory('most-searched')}
                  className={`cursor-pointer ${activeCategory === 'most-searched' ? 'text-black font-semibold' : 'text-black/70'}`}
                >
                  Most Searched
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  onClick={() => setActiveCategory('most-visited')}
                  className={`cursor-pointer ${activeCategory === 'most-visited' ? 'text-black font-semibold' : 'text-black/70'}`}
                >
                  Most Visited
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  onClick={() => setActiveCategory('top-rated-destinations')}
                  className={`cursor-pointer ${activeCategory === 'top-rated-destinations' ? 'text-black font-semibold' : 'text-black/70'}`}
                >
                  Top Destinations
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  onClick={() => setActiveCategory('top-rated-products')}
                  className={`cursor-pointer ${activeCategory === 'top-rated-products' ? 'text-black font-semibold' : 'text-black/70'}`}
                >
                  Top Products
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Content */}
        <div className="mt-8">
          <h3 className="text-2xl font-semibold text-black mb-6">{categoryTitle}</h3>

          {isAnalyticsPending ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black/30"></div>
            </div>
          ) : categoryData.length === 0 ? (
            <p className="text-black/50 text-center py-12">No data available yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryData.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => {
                    if (activeCategory === 'top-rated-products' && onViewProduct) {
                      onViewProduct(item.id);
                    } else if ((activeCategory === 'most-visited' || activeCategory === 'top-rated-destinations') && onViewDestination) {
                      onViewDestination(item.id);
                    }
                  }}
                  className={`p-4 rounded-lg border border-black/10 hover:border-black/20 transition-all ${
                    (activeCategory === 'top-rated-products' || activeCategory === 'most-visited' || activeCategory === 'top-rated-destinations') ? 'cursor-pointer hover:shadow-md' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-black/10 text-xs font-semibold text-black">
                          {index + 1}
                        </span>
                        <h4 className="font-semibold text-black line-clamp-2">{item.name}</h4>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {item.rating !== undefined ? (
                          <>
                            <span className="text-yellow-500">★</span>
                            <span className="font-medium text-black">{item.rating}</span>
                            <span className="text-black/50">({item.count} ratings)</span>
                          </>
                        ) : (
                          <span className="text-black/60">{item.count} searches</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

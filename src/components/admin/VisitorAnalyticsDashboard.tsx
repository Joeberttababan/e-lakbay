import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Users, Eye, Globe, Smartphone, Monitor, Clock, GitCompare, Loader, Link, BarChart3, Tablet } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { AnalyticsDashboardSkeleton } from '../ui/Skeletons';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  bgColor?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, trend, bgColor = 'bg-blue-500' }) => (
  <div className="glass-secondary rounded-2xl p-5 border border-black/10">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-black/60 text-sm font-medium mb-2">{title}</p>
        <p className="text-3xl font-bold text-black">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      </div>
      <div className={`${bgColor} p-3 rounded-lg text-white/90`}>
        {icon}
      </div>
    </div>
    {trend !== undefined && (
      <p className={`text-xs mt-3 font-semibold ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% from last period
      </p>
    )}
  </div>
);

// Custom legend renderer for Traffic Sources
const TrafficSourcesLegend = (props: any) => {
  const { payload } = props;
  if (!payload) return null;
  
  const iconMap: Record<string, React.ReactNode> = {
    'Direct': <Globe className="w-4 h-4" />,
    'Referral': <Link className="w-4 h-4" />,
  };
  
  return (
    <div className="flex flex-wrap gap-4 justify-center mt-4">
      {payload.map((entry: any, index: number) => (
        <div key={`legend-${index}`} className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            {iconMap[entry.value] || <BarChart3 className="w-4 h-4" />}
            <span className="text-sm text-black font-medium">{entry.value}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// Custom legend renderer for Device Type
const DeviceLegend = (props: any) => {
  const { payload } = props;
  if (!payload) return null;
  
  const deviceIconMap: Record<string, React.ReactNode> = {
    'Mobile': <Smartphone className="w-4 h-4" />,
    'Desktop': <Monitor className="w-4 h-4" />,
    'Tablet': <Tablet className="w-4 h-4" />,
  };
  
  return (
    <div className="flex flex-wrap gap-4 justify-center mt-4">
      {payload.map((entry: any, index: number) => (
        <div key={`device-legend-${index}`} className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            {deviceIconMap[entry.value] || <BarChart3 className="w-4 h-4" />}
            <span className="text-sm text-black font-medium">{entry.value}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export const VisitorAnalyticsDashboard: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
  
  // Fetch analytics events
  const { data: analyticsEvents = [], isLoading: isAnalyticsLoading } = useQuery({
    queryKey: ['visitor-analytics-events'],
    queryFn: async () => {
      // Get last 30 days of data
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('analytics_data')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Failed to fetch analytics data:', error);
        return [];
      }

      return data || [];
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  // Fetch page views
  const { data: pageViews = [] } = useQuery({
    queryKey: ['visitor-page-views'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('page_views')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Failed to fetch page views:', error);
        return [];
      }

      return data || [];
    },
    staleTime: 30000,
    refetchInterval: 30000,
  });

  // Process data for charts
  const { dailyVisitsData, totalMetrics, changes, trafficSourcesData, browserData, deviceData } = useMemo(() => {
    if (!analyticsEvents.length) {
      return {
        dailyVisitsData: [],
        totalMetrics: { totalVisitors: 0, totalPageViews: 0, totalUniqueVisitors: 0, avgVisitDuration: '0m 0s', bounceRate: '0%' },
        changes: { visitorsChange: 0, pageViewsChange: 0, totalVisitorsChange: 0, bounceRateChange: 0 },
        trafficSourcesData: [],
        browserData: [],
        deviceData: [],
      };
    }

    // Create maps for tracking statistics
    const dailyMap = new Map<string, { uniqueVisitors: Set<string>; sessions: Set<string>; pageViews: number; bounced: number }>();
    const browserMap = new Map<string, number>();
    const deviceMap = new Map<string, number>();
    let totalBounced = 0;
    let totalDuration = 0;
    let sessionCount = 0;

    // Process analytics events
    analyticsEvents.forEach((event: any) => {
      const date = new Date(event.created_at);
      const dayKey = date.toISOString().split('T')[0];
      
      if (!dailyMap.has(dayKey)) {
        dailyMap.set(dayKey, { uniqueVisitors: new Set(), sessions: new Set(), pageViews: 0, bounced: 0 });
      }
      
      const dayData = dailyMap.get(dayKey)!;
      
      if (event.visitor_id) {
        dayData.uniqueVisitors.add(event.visitor_id);
      }
      if (event.session_id) {
        dayData.sessions.add(event.session_id);
      }
      
      if (event.is_bounced) {
        dayData.bounced++;
        totalBounced++;
      }
      
      if (event.duration_ms) {
        totalDuration += event.duration_ms;
        sessionCount++;
      }

      // Parse user agent for browser and device detection
      if (event.user_agent_text) {
        const ua = event.user_agent_text.toLowerCase();
        
        // Browser detection
        if (ua.includes('chrome') && !ua.includes('edge')) {
          browserMap.set('Chrome', (browserMap.get('Chrome') || 0) + 1);
        } else if (ua.includes('firefox')) {
          browserMap.set('Firefox', (browserMap.get('Firefox') || 0) + 1);
        } else if (ua.includes('safari') && !ua.includes('chrome')) {
          browserMap.set('Safari', (browserMap.get('Safari') || 0) + 1);
        } else if (ua.includes('edge')) {
          browserMap.set('Edge', (browserMap.get('Edge') || 0) + 1);
        } else {
          browserMap.set('Others', (browserMap.get('Others') || 0) + 1);
        }

        // Device type detection
        if (ua.includes('mobile') || ua.includes('android')) {
          deviceMap.set('Mobile', (deviceMap.get('Mobile') || 0) + 1);
        } else if (ua.includes('tablet') || ua.includes('ipad')) {
          deviceMap.set('Tablet', (deviceMap.get('Tablet') || 0) + 1);
        } else {
          deviceMap.set('Desktop', (deviceMap.get('Desktop') || 0) + 1);
        }
      }
    });

    // Build daily visits data
    const dailyVisits = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        visitors: data.uniqueVisitors.size,
        pageViews: pageViews.filter(pv => pv.created_at.startsWith(date)).length || data.pageViews,
        uniqueVisitors: data.uniqueVisitors.size,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate average session duration
    const avgDurationMs = sessionCount > 0 ? Math.floor(totalDuration / sessionCount) : 0;
    const avgMinutes = Math.floor(avgDurationMs / 60000);
    const avgSeconds = Math.floor((avgDurationMs % 60000) / 1000);

    // Calculate bounce rate - fixed NaN issue
    const uniqueSessions = new Set(analyticsEvents.map((e: any) => e.session_id)).size;
    const bouncedSessions = analyticsEvents.filter((e: any) => e.is_bounced).length;
    const bounceRate = uniqueSessions > 0 ? ((bouncedSessions / uniqueSessions) * 100).toFixed(1) : '0';

    // Calculate total unique visitors and page views
    const uniqueVisitors = new Set(analyticsEvents.map((e: any) => e.visitor_id)).size;
    const totalPageViewsCount = pageViews.length;

    // Calculate period-to-period changes (today vs yesterday, or last 7 days vs prior 7 days)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todayEvents = analyticsEvents.filter((e: any) => new Date(e.created_at) >= today);
    const yesterdayEvents = analyticsEvents.filter((e: any) => {
      const d = new Date(e.created_at);
      d.setHours(0, 0, 0, 0);
      return d >= yesterday && d < today;
    });

    const todayVisitors = new Set(todayEvents.map((e: any) => e.visitor_id)).size;
    const yesterdayVisitors = new Set(yesterdayEvents.map((e: any) => e.visitor_id)).size;
    const visitorsChange = yesterdayVisitors > 0 ? (((todayVisitors - yesterdayVisitors) / yesterdayVisitors) * 100).toFixed(1) : 0;

    const todayPageViews = pageViews.filter((e: any) => new Date(e.created_at) >= today).length;
    const yesterdayPageViews = pageViews.filter((e: any) => {
      const d = new Date(e.created_at);
      d.setHours(0, 0, 0, 0);
      return d >= yesterday && d < today;
    }).length;
    const pageViewsChange = yesterdayPageViews > 0 ? (((todayPageViews - yesterdayPageViews) / yesterdayPageViews) * 100).toFixed(1) : 0;

    const todayUnique = todayEvents.length;
    const yesterdayUnique = yesterdayEvents.length;
    const totalVisitorsChange = yesterdayUnique > 0 ? (((todayUnique - yesterdayUnique) / yesterdayUnique) * 100).toFixed(1) : 0;

    const todayBounced = todayEvents.filter((e: any) => e.is_bounced).length;
    const todaySessionCount = new Set(todayEvents.map((e: any) => e.session_id)).size;
    const yesterdayBounced = yesterdayEvents.filter((e: any) => e.is_bounced).length;
    const yesterdaySessionCount = new Set(yesterdayEvents.map((e: any) => e.session_id)).size;
    
    const todayBounceRate = todaySessionCount > 0 ? ((todayBounced / todaySessionCount) * 100) : 0;
    const yesterdayBounceRate = yesterdaySessionCount > 0 ? ((yesterdayBounced / yesterdaySessionCount) * 100) : 0;
    const bounceRateChange = yesterdayBounceRate > 0 ? (todayBounceRate - yesterdayBounceRate).toFixed(1) : 0;

    const metrics = {
      totalVisitors: analyticsEvents.length,
      totalPageViews: totalPageViewsCount,
      totalUniqueVisitors: uniqueVisitors,
      avgVisitDuration: `${avgMinutes}m ${avgSeconds}s`,
      bounceRate: isNaN(parseFloat(bounceRate as string)) ? '0%' : `${bounceRate}%`,
    };

    const changes = {
      visitorsChange: parseFloat(visitorsChange as any),
      pageViewsChange: parseFloat(pageViewsChange as any),
      totalVisitorsChange: parseFloat(totalVisitorsChange as any),
      bounceRateChange: parseFloat(bounceRateChange as any),
    };

    // Build browser data
    const totalBrowsers = Array.from(browserMap.values()).reduce((a, b) => a + b, 0);
    const browsers = Array.from(browserMap.entries())
      .map(([name, count]) => ({
        name,
        users: count,
        percentage: totalBrowsers > 0 ? Math.round((count / totalBrowsers) * 100) : 0,
      }))
      .sort((a, b) => b.users - a.users);

    // Build device data
    const totalDevices = Array.from(deviceMap.values()).reduce((a, b) => a + b, 0);
    const devices = Array.from(deviceMap.entries())
      .map(([name, count]) => ({
        name,
        value: totalDevices > 0 ? Math.round((count / totalDevices) * 100) : 0,
        color: name === 'Desktop' ? '#3b82f6' : name === 'Mobile' ? '#ef4444' : '#06b6d4',
      }))
      .sort((a, b) => b.value - a.value);

    // Traffic sources (simplified - using direct vs referred)
    const directVisitors = analyticsEvents.filter((e: any) => !e.referrer).length;
    const referredVisitors = analyticsEvents.filter((e: any) => e.referrer).length;
    
    const trafficSources = [];
    if (directVisitors > 0) {
      trafficSources.push({
        name: 'Direct',
        value: Math.round((directVisitors / analyticsEvents.length) * 100),
        color: '#3b82f6',
      });
    }
    if (referredVisitors > 0) {
      trafficSources.push({
        name: 'Referral',
        value: Math.round((referredVisitors / analyticsEvents.length) * 100),
        color: '#10b981',
      });
    }

    return {
      dailyVisitsData: dailyVisits,
      totalMetrics: metrics,
      changes,
      trafficSourcesData: trafficSources,
      browserData: browsers,
      deviceData: devices,
    };
  }, [analyticsEvents, pageViews]);

  const mostVisitedPages = useMemo(() => {
    if (!pageViews.length) {
      return [];
    }

    const pageMap = new Map<string, number>();
    pageViews.forEach((view: any) => {
      if (view.page_path) {
        pageMap.set(view.page_path, (pageMap.get(view.page_path) || 0) + 1);
      }
    });

    return Array.from(pageMap.entries())
      .map(([page, views]) => ({
        page,
        views,
        avgTime: '2:30', // Placeholder - can be calculated from page duration
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);
  }, [pageViews]);

  // Fetch top visited destinations
  const { data: topDestinations = [], isLoading: isDestinationsLoading } = useQuery({
    queryKey: ['top-visited-destinations'],
    queryFn: async () => {
      try {
        // Get destination visit counts from analytics
        const { data: analyticsEvents, error: analyticsError } = await supabase
          .from('analytics_events')
          .select('destination_id')
          .not('destination_id', 'is', null);

        console.log('Destination Analytics Debug:', { analyticsEvents, analyticsError });

        if (!analyticsError && analyticsEvents?.length) {
          // Count visits per destination
          const destinationVisits = new Map<string, number>();
          analyticsEvents.forEach((event: any) => {
            if (event.destination_id) {
              destinationVisits.set(event.destination_id, (destinationVisits.get(event.destination_id) || 0) + 1);
            }
          });

          console.log('Destination visits map:', destinationVisits);

          // Get top 5 destination IDs
          const topDestinationIds = Array.from(destinationVisits.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([id]) => id);

          if (topDestinationIds.length > 0) {
            // Fetch destination details
            const { data: destinations, error: destError } = await supabase
              .from('destinations')
              .select('id, destination_name')
              .in('id', topDestinationIds);

            console.log('Fetched destinations:', { destinations, destError });

            if (!destError && destinations?.length) {
              // Map visit counts to destinations
              return destinations.map((dest: any) => ({
                name: dest.destination_name,
                visits: destinationVisits.get(dest.id) || 0,
              }));
            }
          }
        }

        console.log('No destination events found, fetching from destinations table');

        // Fallback: Fetch top rated destinations
        const { data: destinations, error: destError } = await supabase
          .from('destinations')
          .select('id, destination_name, rating_count')
          .order('rating_count', { ascending: false })
          .limit(5);

        console.log('Fetched destinations (fallback):', { destinations, destError });

        if (destError || !destinations?.length) return [];

        return destinations.map((dest: any) => ({
          name: dest.destination_name,
          visits: dest.rating_count || 0,
        }));
      } catch (error) {
        console.error('Error fetching top destinations:', error);
        return [];
      }
    },
    staleTime: 60000,
  });

  // Fetch top rated products
  const { data: topRatedProducts = [], isLoading: isProductsLoading } = useQuery({
    queryKey: ['top-rated-products'],
    queryFn: async () => {
      try {
        // Try to fetch products with highest ratings
        const { data: products, error } = await supabase
          .from('products')
          .select('id, product_name, rating_avg, rating_count')
          .order('rating_avg', { ascending: false })
          .limit(5);

        console.log('Fetched products:', { products, error });

        if (!error && products?.length) {
          const mappedProducts = products.map((prod: any) => ({
            name: prod.product_name,
            rating: prod.rating_avg ? parseFloat(prod.rating_avg).toFixed(1) : 'N/A',
            ratingCount: prod.rating_count || 0,
          }));

          // Check if all products have real ratings (not N/A and count > 0)
          const hasRealRatings = mappedProducts.some(p => p.rating !== 'N/A' && p.ratingCount > 0);
          if (hasRealRatings) {
            // Sort from highest to lowest rating
            return mappedProducts.sort((a, b) => {
              const ratingA = a.rating === 'N/A' ? 0 : parseFloat(a.rating);
              const ratingB = b.rating === 'N/A' ? 0 : parseFloat(b.rating);
              return ratingB - ratingA;
            });
          }
        }

        console.log('No rated products found, fetching by rating count');

        // Fallback: Fetch products ordered by rating count (popularity/engagement)
        const { data: fallbackProducts, error: fallbackError } = await supabase
          .from('products')
          .select('id, product_name, rating_avg, rating_count')
          .order('rating_count', { ascending: false })
          .limit(5);

        console.log('Fetched products (fallback):', { fallbackProducts, fallbackError });

        if (fallbackError || !fallbackProducts?.length) return [];

        const fallbackMapped = fallbackProducts.map((prod: any) => ({
          name: prod.product_name,
          rating: prod.rating_avg ? parseFloat(prod.rating_avg).toFixed(1) : 'N/A',
          ratingCount: prod.rating_count || 0,
        }));

        // Sort from highest to lowest rating
        return fallbackMapped.sort((a, b) => {
          const ratingA = a.rating === 'N/A' ? 0 : parseFloat(a.rating);
          const ratingB = b.rating === 'N/A' ? 0 : parseFloat(b.rating);
          return ratingB - ratingA;
        });
      } catch (error) {
        console.error('Error fetching top products:', error);
        return [];
      }
    },
    staleTime: 60000,
  });

  if (isAnalyticsLoading) {
    return <AnalyticsDashboardSkeleton />;
  }

  return (
    <div className="space-y-6">

      {/* Key Metrics */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
        animate={shouldReduceMotion ? true : { opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          animate={shouldReduceMotion ? true : { opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0 }}
        >
          <MetricCard
            title="Total Visitors"
            value={totalMetrics.totalVisitors}
            icon={<Users className="w-6 h-6" />}
            trend={changes.totalVisitorsChange}
            bgColor="bg-blue-500"
          />
        </motion.div>
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          animate={shouldReduceMotion ? true : { opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          <MetricCard
            title="Unique Visitors"
            value={totalMetrics.totalUniqueVisitors}
            icon={<Globe className="w-6 h-6" />}
            trend={changes.visitorsChange}
            bgColor="bg-green-500"
          />
        </motion.div>
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          animate={shouldReduceMotion ? true : { opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <MetricCard
            title="Page Views"
            value={totalMetrics.totalPageViews}
            icon={<Eye className="w-6 h-6" />}
            trend={changes.pageViewsChange}
            bgColor="bg-purple-500"
          />
        </motion.div>
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          animate={shouldReduceMotion ? true : { opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <MetricCard
            title="Avg Duration"
            value={totalMetrics.avgVisitDuration}
            icon={<Clock className="w-6 h-6" />}
            trend={3.1}
            bgColor="bg-orange-500"
          />
        </motion.div>
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          animate={shouldReduceMotion ? true : { opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <MetricCard
            title="Bounce Rate"
            value={totalMetrics.bounceRate}
            icon={<TrendingUp className="w-6 h-6" />}
            trend={changes.bounceRateChange}
            bgColor="bg-red-500"
          />
        </motion.div>
      </motion.div>

      {/* Charts Section */}
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
        animate={shouldReduceMotion ? true : { opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {/* Daily Visits Chart */}
        {dailyVisitsData.length > 0 && (
          <div className="lg:col-span-2 glass-secondary rounded-2xl p-6 border border-black/10">
            <h2 className="text-lg font-bold text-black mb-4">Daily Visits (Last 30 Days)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyVisitsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                <Legend />
                <Line type="monotone" dataKey="visitors" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                <Line type="monotone" dataKey="pageViews" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Traffic Sources */}
        {trafficSourcesData.length > 0 && (
          <div className="glass-secondary rounded-2xl p-6 border border-black/10">
            <h2 className="text-lg font-bold text-black mb-4">Traffic Sources</h2>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={trafficSourcesData}
                  cx="50%"
                  cy="40%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  dataKey="value"
                >
                  {trafficSourcesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend content={<TrafficSourcesLegend />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>

      {/* Device Type & Browser Usage - Same Row on MD+ */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
        animate={shouldReduceMotion ? true : { opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        {/* Device Type */}
        {deviceData.length > 0 && (
          <div className="glass-secondary rounded-2xl p-6 border border-black/10">
            <h2 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
              <Smartphone className="w-5 h-5" /> Device Type Distribution
            </h2>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie data={deviceData} cx="50%" cy="40%" labelLine={false} label={({ name, value }) => `${name}: ${value}%`} dataKey="value">
                  {deviceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend content={<DeviceLegend />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Browser Usage */}
        {browserData.length > 0 && (
          <div className="glass-secondary rounded-2xl p-6 border border-black/10">
            <h2 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
              <Monitor className="w-5 h-5" /> Browser Usage
            </h2>
            <div className="space-y-4">
              {browserData.map((browser, index) => (
                <div key={index}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-black">{browser.name}</span>
                    <span className="text-sm text-black/60">{browser.percentage}%</span>
                  </div>
                  <div className="w-full bg-black/10 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${browser.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Most Visited Destinations, Pages, and Products */}
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
        animate={shouldReduceMotion ? true : { opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {/* Top Visited Destinations */}
        <div className="glass-secondary rounded-2xl p-6 border border-black/10">
          <h2 className="text-lg font-bold text-black mb-4">Top Visited Destinations</h2>
          <div className="space-y-3">
            {topDestinations.length > 0 ? (
              topDestinations.map((destination: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-black/5 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-black truncate">{destination.name}</p>
                    <p className="text-xs text-black/60">Destination</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-black">{destination.visits}</p>
                    <p className="text-xs text-black/60">visits</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-black/60">No destination data available</p>
            )}
          </div>
        </div>

        {/* Most Visited Pages */}
        <div className="glass-secondary rounded-2xl p-6 border border-black/10">
          <h2 className="text-lg font-bold text-black mb-4">Top Pages</h2>
          <div className="space-y-3">
            {mostVisitedPages.slice(0, 5).length > 0 ? (
              mostVisitedPages.slice(0, 5).map((page: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-black/5 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-black truncate">{page.page}</p>
                    <p className="text-xs text-black/60">Page</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-black">{page.views}</p>
                    <p className="text-xs text-black/60">views</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-black/60">No page data available</p>
            )}
          </div>
        </div>

        {/* Top Rated Products */}
        <div className="glass-secondary rounded-2xl p-6 border border-black/10">
          <h2 className="text-lg font-bold text-black mb-4">Top Rated Products</h2>
          <div className="space-y-3">
            {topRatedProducts.length > 0 ? (
              topRatedProducts.map((product: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-black/5 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-black truncate">{product.name}</p>
                    <p className="text-xs text-black/60">{product.rating} ★ ({product.ratingCount})</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-black">{product.rating}</p>
                    <p className="text-xs text-black/60">rating</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-black/60">No product data available</p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

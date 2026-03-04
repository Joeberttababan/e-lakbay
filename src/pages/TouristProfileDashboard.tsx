import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion, easeOut } from 'framer-motion';
import { toast } from 'sonner';
import { Star } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../components/AuthProvider';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../components/modern-ui/breadcrumb';

interface RatingItem {
  id: string;
  type: 'destination' | 'product';
  itemId: string;
  itemName: string;
  itemImageUrl: string | null;
  rating: number;
  comment: string | null;
  createdAt: string;
}

type TabType = 'all' | 'destinations' | 'products';

const TouristProfileDashboard: React.FC = () => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const { profile, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user ratings for destinations
  const { data: destinationRatings = [], isPending: isDestRatingsPending } = useQuery({
    queryKey: ['destination-ratings', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('destination_ratings')
        .select(`
          id,
          destination_id,
          rating,
          comment,
          created_at,
          destinations (
            id,
            destination_name,
            image_url,
            image_urls
          )
        `)
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch destination ratings:', error);
        toast.error('Failed to load destination ratings.');
        return [];
      }

      return (data ?? []).map((row) => {
        // Handle both single object and array returns from Supabase join
        const rawDest = row.destinations as unknown;
        const dest = Array.isArray(rawDest) 
          ? (rawDest[0] as { id: string; destination_name: string; image_url: string | null; image_urls: string[] | null } | undefined)
          : (rawDest as { id: string; destination_name: string; image_url: string | null; image_urls: string[] | null } | null);
        const imageUrls = dest?.image_urls ?? [];
        return {
          id: row.id,
          type: 'destination' as const,
          itemId: row.destination_id,
          itemName: dest?.destination_name ?? 'Unknown Destination',
          itemImageUrl: imageUrls[0] ?? dest?.image_url ?? null,
          rating: row.rating,
          comment: row.comment ?? null,
          createdAt: row.created_at,
        };
      });
    },
    enabled: Boolean(profile?.id),
  });

  // Fetch user ratings for products
  const { data: productRatings = [], isPending: isProdRatingsPending } = useQuery({
    queryKey: ['product-ratings', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('product_ratings')
        .select(`
          id,
          product_id,
          rating,
          comment,
          created_at,
          products (
            id,
            product_name,
            image_url,
            image_urls
          )
        `)
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch product ratings:', error);
        toast.error('Failed to load product ratings.');
        return [];
      }

      return (data ?? []).map((row) => {
        // Handle both single object and array returns from Supabase join
        const rawProd = row.products as unknown;
        const prod = Array.isArray(rawProd)
          ? (rawProd[0] as { id: string; product_name: string; image_url: string | null; image_urls: string[] | null } | undefined)
          : (rawProd as { id: string; product_name: string; image_url: string | null; image_urls: string[] | null } | null);
        const imageUrls = prod?.image_urls ?? [];
        return {
          id: row.id,
          type: 'product' as const,
          itemId: row.product_id,
          itemName: prod?.product_name ?? 'Unknown Product',
          itemImageUrl: imageUrls[0] ?? prod?.image_url ?? null,
          rating: row.rating,
          comment: row.comment ?? null,
          createdAt: row.created_at,
        };
      });
    },
    enabled: Boolean(profile?.id),
  });

  const isLoading = isDestRatingsPending || isProdRatingsPending;

  // Combine and compute stats
  const allRatings: RatingItem[] = useMemo(() => {
    const combined = [...destinationRatings, ...productRatings];
    return combined.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [destinationRatings, productRatings]);

  const totalRatings = allRatings.length;
  const totalDestinationsRated = destinationRatings.length;
  const totalProductsRated = productRatings.length;

  // Filter based on active tab
  const filteredRatings = useMemo(() => {
    switch (activeTab) {
      case 'destinations':
        return allRatings.filter((r) => r.type === 'destination');
      case 'products':
        return allRatings.filter((r) => r.type === 'product');
      default:
        return allRatings;
    }
  }, [allRatings, activeTab]);

  const getItemMotion = (index: number) =>
    shouldReduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.35, ease: easeOut, delay: index * 0.04 },
        };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleEditPhoto = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !profile?.id) return;

      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be smaller than 5MB.');
        return;
      }

      setIsUploading(true);
      try {
        const fileExt = file.name.split('.').pop() || 'jpg';
        const filePath = `profiles/${profile.id}/${crypto.randomUUID()}.${fileExt}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('uploads')
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(filePath);
        const publicUrl = urlData?.publicUrl;

        if (!publicUrl) throw new Error('Failed to get public URL');

        // Update profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ img_url: publicUrl })
          .eq('id', profile.id);

        if (updateError) throw updateError;

        await refreshProfile();
        toast.success('Profile photo updated!');
      } catch (error) {
        console.error('Failed to upload photo:', error);
        toast.error('Failed to update profile photo.');
      } finally {
        setIsUploading(false);
        setIsEditingPhoto(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [profile?.id, refreshProfile]
  );

  const renderStars = (rating: number) => {
    return (
      <>
        {/* Mobile: Show number + single star */}
        <div className="flex md:hidden items-center gap-1">
          <span className="text-sm font-semibold text-yellow-400">{rating}</span>
          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
        </div>
        {/* Desktop: Show all stars */}
        <div className="hidden md:flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`}
            />
          ))}
        </div>
      </>
    );
  };

  return (
    <main className="min-h-screen bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-white pt-20 pb-16">
      <div className="container mx-auto px-4 md:px-8">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                onClick={() => navigate('/')}
                className="cursor-pointer text-white/70 hover:text-white transition-colors"
              >
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-white/50" />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-white font-medium">My Profile</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Profile Header Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column - Profile Card */}
          <motion.div
            {...getItemMotion(0)}
            className="glass-secondary rounded-2xl p-6 relative"
          >
            {/* Edit Button */}
            <button
              type="button"
              onClick={handleEditPhoto}
              disabled={isUploading}
              className="absolute top-4 right-4 p-2 rounded-full glass-button hover:bg-white/20 transition-colors disabled:opacity-50"
              aria-label="Edit profile photo"
            >
              {isUploading ? (
                <svg
                  className="h-5 w-5 animate-spin text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              )}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              aria-label="Upload profile photo"
            />

            {/* Avatar */}
            <div className="flex flex-col items-center">
              <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-white/20 mb-4">
                {profile?.img_url ? (
                  <img
                    src={profile.img_url}
                    alt={profile.full_name ?? 'Profile'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-4xl md:text-5xl font-bold text-white">
                      {(profile?.full_name?.[0] ?? profile?.email?.[0] ?? 'U').toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Name */}
              <h2 className="text-xl md:text-2xl font-extrabold text-center">
                {profile?.full_name ?? profile?.email ?? 'Tourist'}
              </h2>

              {/* Email */}
              {profile?.email && (
                <p className="text-sm text-white/60 mt-1">{profile.email}</p>
              )}

              {/* Battle Cry */}
              {profile?.battle_cry && (
                <p className="text-sm text-white/80 italic mt-2 text-center">
                  "{profile.battle_cry}"
                </p>
              )}
            </div>
          </motion.div>

          {/* Right Column - Stats */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Total Ratings Given */}
            <motion.div
              {...getItemMotion(1)}
              className="glass-secondary rounded-2xl p-6 flex items-center justify-between"
            >
              <div>
                <h3 className="text-sm text-white/60 uppercase tracking-wide">Total Ratings Given</h3>
                <p className="text-4xl md:text-5xl font-bold mt-2">
                  {isLoading ? (
                    <span className="inline-block w-16 h-12 bg-white/10 rounded animate-pulse" />
                  ) : (
                    totalRatings
                  )}
                </p>
              </div>
              <div className="p-4 rounded-full glass-button">
                <svg
                  className="h-8 w-8 text-yellow-400"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
            </motion.div>

            {/* Destinations and Products Rated */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div
                {...getItemMotion(2)}
                className="glass-secondary rounded-2xl p-6"
              >
                <h3 className="text-sm text-white/60 uppercase tracking-wide">Destinations Rated</h3>
                <p className="text-3xl md:text-4xl font-bold mt-2">
                  {isLoading ? (
                    <span className="inline-block w-12 h-10 bg-white/10 rounded animate-pulse" />
                  ) : (
                    totalDestinationsRated
                  )}
                </p>
              </motion.div>

              <motion.div
                {...getItemMotion(3)}
                className="glass-secondary rounded-2xl p-6"
              >
                <h3 className="text-sm text-white/60 uppercase tracking-wide">Products Rated</h3>
                <p className="text-3xl md:text-4xl font-bold mt-2">
                  {isLoading ? (
                    <span className="inline-block w-12 h-10 bg-white/10 rounded animate-pulse" />
                  ) : (
                    totalProductsRated
                  )}
                </p>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex gap-2 border-b border-white/10 pb-2">
            {(['all', 'destinations', 'products'] as TabType[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-white/10 text-white border-b-2 border-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab === 'all'
                  ? 'All'
                  : tab === 'destinations'
                  ? 'Destinations'
                  : 'Products'}
              </button>
            ))}
          </div>
        </div>

        {/* Ratings List */}
        <div className="space-y-4">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="glass-secondary rounded-2xl p-4 flex gap-4 animate-pulse"
              >
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl bg-white/10 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-1/3 bg-white/10 rounded" />
                  <div className="h-4 w-16 bg-white/10 rounded" />
                  <div className="h-4 w-full bg-white/10 rounded" />
                  <div className="h-3 w-24 bg-white/10 rounded" />
                </div>
              </div>
            ))
          ) : filteredRatings.length === 0 ? (
            <div className="text-center py-12 text-white/60">
              <svg
                className="h-16 w-16 mx-auto mb-4 text-white/30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <p className="text-lg">No ratings yet</p>
              <p className="text-sm mt-1">
                Start exploring destinations and products to leave your first rating!
              </p>
            </div>
          ) : (
            filteredRatings.map((rating, index) => (
              <motion.div
                key={rating.id}
                {...getItemMotion(index)}
                className="glass-secondary rounded-2xl p-4 flex gap-4 relative hover:bg-white/5 transition-colors cursor-pointer"
                onClick={() =>
                  rating.type === 'destination'
                    ? navigate(`/destinations?highlight=${rating.itemId}`)
                    : navigate(`/products?highlight=${rating.itemId}`)
                }
              >
                {/* Image */}
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden shrink-0">
                  {rating.itemImageUrl ? (
                    <img
                      src={rating.itemImageUrl}
                      alt={rating.itemName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-linear-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                      <svg
                        className="h-8 w-8 text-white/40"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Name */}
                  <h4 className="font-semibold text-white truncate pr-16">{rating.itemName}</h4>

                  {/* Tag */}
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      rating.type === 'destination'
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'bg-green-500/20 text-green-300'
                    }`}
                  >
                    {rating.type === 'destination' ? 'Destination' : 'Product'}
                  </span>

                  {/* Comment */}
                  {rating.comment && (
                    <p className="text-sm text-white/70 mt-2 line-clamp-2">{rating.comment}</p>
                  )}

                  {/* Date */}
                  <p className="text-xs text-white/50 mt-2">{formatDate(rating.createdAt)}</p>
                </div>

                {/* Stars - Top Right */}
                <div className="absolute top-4 right-4">{renderStars(rating.rating)}</div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </main>
  );
};

export default TouristProfileDashboard;

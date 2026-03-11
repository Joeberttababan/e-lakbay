import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion, easeOut } from 'framer-motion';
import { toast } from 'sonner';
import { Star } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../components/AuthProvider';
import { DestinationModalCard } from '../components/DestinationModalCard';
import { ProductModal } from '../components/ProductModal';
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

type TabType = 'all' | 'destinations' | 'products' | 'pinned';

interface PinnedEvent {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  location: string | null;
  category: 'festival' | 'cultural' | 'holiday' | 'other';
  municipality_id: string;
  municipality_name?: string;
  pinned_at: string;
}

interface DestinationData {
  id: string;
  destination_name: string;
  description: string | null;
  image_url: string | null;
  image_urls: string[];
  user_id: string | null;
  municipality: string | null;
  barangay: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  uploader_name?: string;
  uploader_image?: string | null;
}

interface ProductData {
  id: string;
  product_name: string;
  description: string | null;
  image_url: string | null;
  image_urls: string[];
  user_id: string | null;
  municipality: string | null;
  barangay: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  uploader_name?: string;
  uploader_image?: string | null;
}

const TouristProfileDashboard: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const shouldReduceMotion = useReducedMotion();
  const { profile, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [showEditPhotoModal, setShowEditPhotoModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingNameValue, setEditingNameValue] = useState(profile?.full_name ?? '');
  const [isSavingName, setIsSavingName] = useState(false);
  const [activeDestinationId, setActiveDestinationId] = useState<string | null>(null);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [destinationData, setDestinationData] = useState<DestinationData | null>(null);
  const [productData, setProductData] = useState<ProductData | null>(null);
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

  // Fetch pinned events
  const { data: pinnedEvents = [], isPending: isPinnedEventsPending } = useQuery({
    queryKey: ['pinned-events', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('pinned_events')
        .select(`
          id,
          event_id,
          pinned_at,
          events (
            id,
            title,
            description,
            start_date,
            end_date,
            location,
            category,
            municipality_id,
            profiles:municipality_id(full_name)
          )
        `)
        .eq('user_id', profile.id)
        .order('pinned_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch pinned events:', error);
        toast.error('Failed to load pinned events.');
        return [];
      }

      return (data ?? []).map((row) => {
        const rawEvent = row.events as unknown;
        const event = Array.isArray(rawEvent) 
          ? (rawEvent[0] as any)
          : (rawEvent as any);
        const rawMunicipality = event?.profiles as unknown;
        const municipality = Array.isArray(rawMunicipality)
          ? (rawMunicipality[0] as { full_name: string } | undefined)
          : (rawMunicipality as { full_name: string } | null);

        return {
          id: row.id,
          title: event?.title ?? 'Unknown Event',
          description: event?.description ?? null,
          start_date: event?.start_date ?? '',
          end_date: event?.end_date ?? '',
          location: event?.location ?? null,
          category: event?.category ?? 'other',
          municipality_id: event?.municipality_id ?? '',
          municipality_name: municipality?.full_name ?? 'Unknown',
          pinned_at: row.pinned_at,
        } as PinnedEvent;
      });
    },
    enabled: Boolean(profile?.id),
  });

  const isLoading = isDestRatingsPending || isProdRatingsPending || isPinnedEventsPending;

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
      case 'pinned':
        return [];
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
        setShowEditPhotoModal(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [profile?.id, refreshProfile]
  );

  const handleSaveName = useCallback(
    async (newName: string) => {
      if (!profile?.id || !newName.trim()) {
        toast.error('Please enter a valid name.');
        return;
      }

      if (newName === profile.full_name) {
        setIsEditingName(false);
        return;
      }

      setIsSavingName(true);
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ full_name: newName.trim() })
          .eq('id', profile.id);

        if (error) {
          console.error('Update profile error:', error);
          throw error;
        }

        // Add a small delay to allow replication
        await new Promise(resolve => setTimeout(resolve, 500));

        await refreshProfile();
        setIsEditingName(false);
        toast.success('Name updated successfully!');
      } catch (error) {
        console.error('Failed to update name:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to update name. Please try again.';
        toast.error(errorMessage);
      } finally {
        setIsSavingName(false);
      }
    },
    [profile?.id, profile?.full_name, refreshProfile]
  );

  const handleRatingClick = useCallback(
    async (rating: RatingItem) => {
      try {
        if (rating.type === 'destination') {
          const { data } = await supabase
            .from('destinations')
            .select('id, destination_name, description, image_url, image_urls, user_id, municipality, barangay, latitude, longitude, address')
            .eq('id', rating.itemId)
            .single();

          if (data) {
            let uploaderName: string | undefined;
            let uploaderImage: string | null | undefined;

            if (data.user_id) {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('full_name, email, img_url')
                .eq('id', data.user_id)
                .single();

              uploaderName = profileData?.full_name || profileData?.email || undefined;
              uploaderImage = profileData?.img_url ?? null;
            }

            setDestinationData({ ...data, uploader_name: uploaderName, uploader_image: uploaderImage } as DestinationData);
            setActiveDestinationId(rating.itemId);
          }
        } else {
          const { data } = await supabase
            .from('products')
            .select('id, product_name, description, image_url, image_urls, user_id, municipality, barangay, latitude, longitude, address')
            .eq('id', rating.itemId)
            .single();

          if (data) {
            let uploaderName: string | undefined;
            let uploaderImage: string | null | undefined;

            if (data.user_id) {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('full_name, email, img_url')
                .eq('id', data.user_id)
                .single();

              uploaderName = profileData?.full_name || profileData?.email || undefined;
              uploaderImage = profileData?.img_url ?? null;
            }

            setProductData({ ...data, uploader_name: uploaderName, uploader_image: uploaderImage } as ProductData);
            setActiveProductId(rating.itemId);
          }
        }
      } catch (error) {
        console.error('Failed to load item details:', error);
        toast.error('Failed to load item details.');
      }
    },
    []
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
                className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-black/20'}`}
            />
          ))}
        </div>
      </>
    );
  };

  return (
    <main className="min-h-screen bg-[#F8F8F8] text-black pt-20 pb-16">
      <div className="container mx-auto px-4 md:px-8">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                href="#"
                onClick={(event) => {
                  event.preventDefault();
                  navigate('/');
                }}
              >
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-black/50" />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-black font-medium">My Profile</BreadcrumbPage>
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
              <button
                type="button"
                onClick={() => setShowEditPhotoModal(true)}
                className="relative w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-[#1A1A1A]/20 mb-4 hover:opacity-80 transition-opacity cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30"
                aria-label="Click to change profile photo"
              >
                {profile?.img_url ? (
                  <img
                    src={profile.img_url}
                    alt={profile.full_name ?? 'Profile'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-4xl md:text-5xl font-bold text-black">
                      {(profile?.full_name?.[0] ?? profile?.email?.[0] ?? 'U').toUpperCase()}
                    </span>
                  </div>
                )}
              </button>

              {/* Name */}
              <div className="flex items-center gap-2 justify-center">
                {isEditingName ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter your name"
                      value={editingNameValue}
                      onChange={(e) => setEditingNameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveName(editingNameValue);
                        } else if (e.key === 'Escape') {
                          setIsEditingName(false);
                          setEditingNameValue(profile?.full_name ?? '');
                        }
                      }}
                      className="text-xl md:text-2xl font-extrabold text-center bg-[#EEEEEE] border border-black/15 rounded-lg px-3 py-1 text-black outline-none focus:border-[#0D9488]/50"
                      autoFocus
                      disabled={isSavingName}
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveName(editingNameValue)}
                      disabled={isSavingName}
                      className="p-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 transition-colors disabled:opacity-50"
                      aria-label="Save name"
                    >
                      {isSavingName ? (
                        <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingName(false);
                        setEditingNameValue(profile?.full_name ?? '');
                      }}
                      className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors disabled:opacity-50"
                      aria-label="Cancel editing"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl md:text-2xl font-extrabold text-center">
                      {profile?.full_name ?? profile?.email ?? 'Tourist'}
                    </h2>
                    <button
                      type="button"
                      onClick={() => setIsEditingName(true)}
                      className="p-1.5 rounded-lg hover:bg-[#1A1A1A]/10 transition-colors"
                      aria-label="Edit name"
                    >
                      <svg className="h-4 w-4 text-black/60 hover:text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  </>
                )}
              </div>

              {/* Email */}
              {profile?.email && (
                <p className="text-sm text-black/60 mt-1">{profile.email}</p>
              )}

              {/* Battle Cry */}
              {profile?.battle_cry && (
                <p className="text-sm text-black/80 italic mt-2 text-center">
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
                <h3 className="text-sm text-black/60 uppercase tracking-wide">Total Ratings Given</h3>
                <p className="text-4xl md:text-5xl font-bold mt-2">
                  {isLoading ? (
                    <span className="inline-block w-16 h-12 bg-[#1A1A1A]/10 rounded animate-pulse" />
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
                <h3 className="text-sm text-black/60 uppercase tracking-wide">Destinations Rated</h3>
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
                <h3 className="text-sm text-black/60 uppercase tracking-wide">Products Rated</h3>
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
          <div className="flex gap-2 border-b border-black/10 pb-2">
            {(['all', 'destinations', 'products', 'pinned'] as (TabType | 'pinned')[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab as TabType)}
                className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-black/10 text-black border-b-2 border-black'
                    : 'text-black/60 hover:text-black hover:bg-black/5'
                }`}
              >
                {tab === 'all'
                  ? 'All'
                  : tab === 'destinations'
                  ? 'Destinations'
                  : tab === 'products'
                  ? 'Products'
                  : 'Pinned Events'}
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
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl bg-black/10 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-1/3 bg-black/10 rounded" />
                  <div className="h-4 w-16 bg-black/10 rounded" />
                  <div className="h-4 w-full bg-black/10 rounded" />
                  <div className="h-3 w-24 bg-black/10 rounded" />
                </div>
              </div>
            ))
          ) : activeTab === 'pinned' ? (
            // Pinned Events View
            pinnedEvents.length === 0 ? (
              <div className="text-center py-12 text-black/60">
                <svg
                  className="h-16 w-16 mx-auto mb-4 text-black/30"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                <p className="text-lg">No pinned events yet</p>
                <p className="text-sm mt-1">
                  Visit the Events page and pin your favorite events here!
                </p>
              </div>
            ) : (
              pinnedEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  {...getItemMotion(index)}
                  className="glass-secondary rounded-2xl p-4 flex gap-4 relative hover:bg-black/5 transition-colors"
                >
                  {/* Calendar Icon */}
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden shrink-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <svg
                      className="h-10 w-10 text-black"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" />
                    </svg>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Title */}
                    <h4 className="font-semibold text-black truncate pr-16">{event.title}</h4>

                    {/* Category Tag */}
                    <span
                      className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        event.category === 'festival'
                          ? 'bg-purple-100 text-purple-700'
                          : event.category === 'cultural'
                          ? 'bg-blue-100 text-blue-700'
                          : event.category === 'holiday'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {event.category}
                    </span>

                    {/* Description */}
                    {event.description && (
                      <p className="text-sm text-black/70 mt-2 line-clamp-2">{event.description}</p>
                    )}

                    {/* Date & Municipality */}
                    <div className="flex flex-col gap-1 mt-2 text-xs text-black/60">
                      <div>
                        <strong>Start:</strong> {formatDate(event.start_date)}
                      </div>
                      <div>
                        <strong>Municipality:</strong> {event.municipality_name}
                      </div>
                      {event.location && (
                        <div>
                          <strong>Location:</strong> {event.location}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )
          ) : filteredRatings.length === 0 ? (
            <div className="text-center py-12 text-black/60">
              <svg
                className="h-16 w-16 mx-auto mb-4 text-black/30"
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
                className="glass-secondary rounded-2xl p-4 flex gap-4 relative hover:bg-black/5 transition-colors cursor-pointer"
                onClick={() => handleRatingClick(rating)}
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
                        className="h-8 w-8 text-black/40"
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
                  <h4 className="font-semibold text-black truncate pr-16">{rating.itemName}</h4>

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
                    <p className="text-sm text-black/70 mt-2 line-clamp-2">{rating.comment}</p>
                  )}

                  {/* Date */}
                  <p className="text-xs text-black/50 mt-2">{formatDate(rating.createdAt)}</p>
                </div>

                {/* Stars - Top Right */}
                <div className="absolute top-4 right-4">{renderStars(rating.rating)}</div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Destination Modal */}
      {activeDestinationId && destinationData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          role="presentation"
          onClick={() => {
            setActiveDestinationId(null);
            setDestinationData(null);
          }}
        >
          <div
            className="max-w-5xl w-full max-h-[85vh] md:max-h-none overflow-y-auto hide-scrollbar overscroll-contain touch-pan-y"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <DestinationModalCard
              id={destinationData.id}
              title={destinationData.destination_name}
              description={destinationData.description ?? 'A great destination'}
              imageUrl={destinationData.image_url ?? ''}
              imageUrls={destinationData.image_urls ?? []}
              postedBy={destinationData.uploader_name}
              postedByImageUrl={destinationData.uploader_image}
              postedById={destinationData.user_id}
              ratingAvg={undefined}
              ratingCount={undefined}
              location={{
                municipality: destinationData.municipality,
                barangay: destinationData.barangay,
                lat: destinationData.latitude,
                lng: destinationData.longitude,
                address: destinationData.address,
              }}
              onProfileClick={(profileId) => navigate(`/profile/${profileId}`)}
            />
          </div>
        </div>
      )}

      {/* Product Modal */}
      {activeProductId && productData && (
        <ProductModal
          open={true}
          product={{
            id: productData.id,
            name: productData.product_name,
            imageUrl: productData.image_url ?? '',
            imageUrls: productData.image_urls,
            description: productData.description,
            uploaderName: productData.uploader_name,
            uploaderImageUrl: productData.uploader_image,
            uploaderId: productData.user_id,
          }}
          onClose={() => {
            setActiveProductId(null);
            setProductData(null);
          }}
          onProfileClick={(profileId) => navigate(`/profile/${profileId}`)}
        />
      )}

      {/* Edit Profile Photo Modal */}
      {showEditPhotoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          role="presentation"
          onClick={() => setShowEditPhotoModal(false)}
        >
          <div
            className="bg-slate-900 border border-white/20 rounded-2xl p-6 max-w-sm w-full"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-xl font-semibold text-white mb-4">Change Profile Photo</h2>
            <p className="text-sm text-white/70 mb-6">
              Select a new photo for your profile
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowEditPhotoModal(false);
                  handleEditPhoto();
                }}
                disabled={isUploading}
                className="flex-1 px-4 py-2 rounded-lg bg-hero-gradient text-white font-medium transition-colors hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Uploading...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    Change Photo
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowEditPhotoModal(false)}
                disabled={isUploading}
                className="flex-1 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default TouristProfileDashboard;

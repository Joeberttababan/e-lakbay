"use client";

import { AnimatePresence, motion, Variants } from "framer-motion";
import { cn } from "@/lib/utils";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { HomepageSearchWithSuggestions } from "./homepage_searchbar";
import { DestinationCard } from "@/components/DestinationCard";
import { ProductCard } from "@/components/ProductCard";
import { DestinationModalCard } from "@/components/DestinationModalCard";
import { ProductModal } from "@/components/ProductModal";
import { supabase } from "@/lib/supabaseClient";

// ─── GradualSpacing Component ───────────────────────────────────────────────

interface GradualSpacingProps {
  text: string;
  duration?: number;
  delayMultiple?: number;
  framerProps?: Variants;
  className?: string;
}

interface DestinationItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  imageUrls: string[];
  ratingAvg?: number;
  ratingCount?: number;
  postedByName?: string;
  postedByImageUrl?: string | null;
  postedById?: string | null;
  location?: {
    municipality: string | null;
    barangay: string | null;
    lat: number | null;
    lng: number | null;
    address: string | null;
  };
}

interface ProductItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  ratingAvg?: number;
  ratingCount?: number;
  uploaderName?: string;
  uploaderImageUrl?: string | null;
  uploaderId?: string | null;
  location?: {
    municipality: string | null;
    barangay: string | null;
    lat: number | null;
    lng: number | null;
    address: string | null;
  };
}

interface CombinedItem {
  type: 'destination' | 'product';
  data: DestinationItem | ProductItem;
}

// ─── Auto-Scroll Carousel Component ─────────────────────────────────────────

interface CarouselProps {
  items: CombinedItem[];
  onViewProfile?: (profileId: string) => void;
  onItemClick?: (item: DestinationItem | ProductItem, type: 'destination' | 'product') => void;
}

const Carousel: React.FC<CarouselProps> = ({
  items,
  onViewProfile,
  onItemClick,
}) => {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const isAdjustingScrollRef = useRef(false);
  const [isPaused, setIsPaused] = useState(false);

  if (items.length === 0) return null;

  // Create looped items array for infinite scroll
  const loopItems = useMemo(() => items.concat(items), [items]);

  // Initialize scroll to middle when items load
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || items.length === 0) {
      return;
    }

    // Calculate item width and set initial scroll position
    const firstItem = scroller.querySelector('.carousel-item') as HTMLElement;
    if (firstItem) {
      const itemWidth = firstItem.offsetWidth + 16; // item width + gap
      const totalWidth = itemWidth * items.length;
      scroller.scrollLeft = totalWidth;
    }
  }, [items.length]);

  // Auto-scroll animation loop
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || items.length === 0) {
      return;
    }

    let frameId = 0;
    let lastTimestamp = 0;
    const speedPxPerMs = 0.06;

    const animate = (timestamp: number) => {
      if (!lastTimestamp) {
        lastTimestamp = timestamp;
      }

      if (!isPaused) {
        const elapsed = timestamp - lastTimestamp;
        const firstItem = scroller.querySelector('.carousel-item') as HTMLElement;
        
        if (firstItem) {
          const itemWidth = firstItem.offsetWidth + 16; // item width + gap
          const singleTrackWidth = itemWidth * items.length;

          scroller.scrollLeft += elapsed * speedPxPerMs;

          // Reset scroll position for infinite loop
          if (scroller.scrollLeft >= singleTrackWidth * 2 - scroller.clientWidth - 1) {
            isAdjustingScrollRef.current = true;
            scroller.scrollLeft -= singleTrackWidth;
            isAdjustingScrollRef.current = false;
          }
        }
      }

      lastTimestamp = timestamp;
      frameId = window.requestAnimationFrame(animate);
    };

    frameId = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frameId);
  }, [isPaused, items.length]);

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* Auto-Scroll Container */}
      <div
        ref={scrollerRef}
        className="hide-scrollbar overflow-x-auto w-full touch-pan-x"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        onTouchCancel={() => setIsPaused(false)}
      >
        <div className="flex w-max gap-4">
          {loopItems.map((item, index) => (
            <div
              key={`${item.data.id}-${index}`}
              className="carousel-item flex-shrink-0 w-36 sm:w-44 md:w-56 lg:w-64 h-24 sm:h- md:h-36 lg:h-48 cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => onItemClick?.(item.data, item.type)}
            >
              <div className="w-full h-full rounded-lg overflow-hidden shadow-lg">
                {item.type === 'destination' ? (
                  <DestinationCard
                    id={(item.data as DestinationItem).id}
                    title={(item.data as DestinationItem).name}
                    description={(item.data as DestinationItem).description ?? "A featured destination from Ilocos Sur."}
                    imageUrl={(item.data as DestinationItem).imageUrl ?? ""}
                    imageUrls={(item.data as DestinationItem).imageUrls}
                    postedBy={(item.data as DestinationItem).postedByName ?? "Traveler"}
                    postedByImageUrl={(item.data as DestinationItem).postedByImageUrl}
                    postedById={(item.data as DestinationItem).postedById}
                    ratingAvg={(item.data as DestinationItem).ratingAvg}
                    ratingCount={(item.data as DestinationItem).ratingCount}
                    location={(item.data as DestinationItem).location}
                    imageClassName="aspect-square"
                    showMeta={false}
                    showDescription={false}
                    showTitle={false}
                    className="!p-0"
                    onProfileClick={onViewProfile}
                  />
                ) : (
                  <ProductCard
                    title={(item.data as ProductItem).name}
                    description={(item.data as ProductItem).description ?? "A featured product from Ilocos Sur."}
                    imageUrl={(item.data as ProductItem).imageUrl ?? ""}
                    uploaderName={(item.data as ProductItem).uploaderName ?? "Seller"}
                    uploaderImageUrl={(item.data as ProductItem).uploaderImageUrl}
                    uploaderId={(item.data as ProductItem).uploaderId}
                    ratingAvg={(item.data as ProductItem).ratingAvg}
                    ratingCount={(item.data as ProductItem).ratingCount}
                    location={(item.data as ProductItem).location}
                    imageClassName="aspect-square"
                    showMeta={false}
                    showDescription={false}
                    showTitle={false}
                    className="!p-0"
                    onProfileClick={onViewProfile}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

function GradualSpacing({
  text,
  duration = 0.5,
  delayMultiple = 0.04,
  framerProps = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  },
  className,
}: GradualSpacingProps) {
  return (
    <div className="flex justify-start space-x-1">
      <AnimatePresence>
        {text.split("").map((char, i) => (
          <motion.h1
            key={i}
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={framerProps}
            transition={{ duration, delay: i * delayMultiple }}
            className={cn("drop-shadow-sm", className)}
          >
            {char === " " ? <span>&nbsp;</span> : char}
          </motion.h1>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Hero Section ────────────────────────────────────────────────────────────

interface HomepageHeroSectionProps {
  onSearch?: (value: string) => void;
  onViewDestinations?: () => void;
  onViewProfile?: (profileId: string) => void;
}

export const HomepageHeroSection: React.FC<HomepageHeroSectionProps> = ({
  onViewDestinations,
  onViewProfile,
}) => {
  const [activeDestination, setActiveDestination] = useState<DestinationItem | null>(null);
  const [activeProduct, setActiveProduct] = useState<ProductItem | null>(null);
  // Fetch top 5 destinations
  const { data: topDestinations = [] } = useQuery({
    queryKey: ["destinations", "top-5-hero"],
    queryFn: async () => {
      try {
        const { data: destinationRows, error: destinationError } = await supabase
          .from("destinations")
          .select("id, destination_name, description, image_url, image_urls, user_id, municipality, barangay, latitude, longitude, address")
          .order("created_at", { ascending: false });

        if (destinationError) throw destinationError;

        const { data: ratingRows, error: ratingError } = await supabase
          .from("destination_ratings")
          .select("destination_id, rating");

        if (ratingError) throw ratingError;

        const ratingMap = new Map<string, { total: number; count: number }>();
        (ratingRows ?? []).forEach((row) => {
          const current = ratingMap.get(row.destination_id) ?? { total: 0, count: 0 };
          ratingMap.set(row.destination_id, {
            total: current.total + (row.rating ?? 0),
            count: current.count + 1,
          });
        });

        const userIds = Array.from(
          new Set((destinationRows ?? []).map((row) => row.user_id).filter(Boolean))
        ) as string[];

        const profilesById = new Map<string, { full_name?: string | null; email?: string | null; img_url?: string | null }>();
        if (userIds.length > 0) {
          const { data: profileRows, error: profileError } = await supabase
            .from("profiles")
            .select("id, full_name, email, img_url")
            .in("id", userIds);

          if (profileError) throw profileError;

          (profileRows ?? []).forEach((profile) => {
            profilesById.set(profile.id, profile);
          });
        }

        const mapped = (destinationRows ?? []).map((row) => {
          const rating = ratingMap.get(row.id);
          const ratingAvg = rating && rating.count > 0 ? rating.total / rating.count : undefined;
          const typedRow = row as { image_urls?: string[]; user_id?: string | null };
          const imageUrls = typedRow.image_urls ?? [];
          const profile = typedRow.user_id ? profilesById.get(typedRow.user_id) : undefined;
          const postedByName = profile?.full_name || profile?.email || "Traveler";
          return {
            id: row.id,
            name: row.destination_name,
            description: row.description ?? null,
            imageUrl: imageUrls[0] ?? row.image_url ?? null,
            imageUrls,
            ratingAvg,
            ratingCount: rating?.count,
            postedByName,
            postedByImageUrl: profile?.img_url ?? null,
            postedById: typedRow.user_id ?? null,
            location: {
              municipality: (row as { municipality?: string | null }).municipality ?? null,
              barangay: (row as { barangay?: string | null }).barangay ?? null,
              lat: (row as { latitude?: number | null }).latitude ?? null,
              lng: (row as { longitude?: number | null }).longitude ?? null,
              address: (row as { address?: string | null }).address ?? null,
            },
          } as DestinationItem;
        });

        const ratedOnly = mapped.filter(
          (item) => item.imageUrl && typeof item.ratingAvg === "number" && (item.ratingCount ?? 0) > 0
        );

        const sorted = [...ratedOnly].sort((a, b) => {
          if ((b.ratingAvg ?? 0) !== (a.ratingAvg ?? 0)) {
            return (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0);
          }
          if ((b.ratingCount ?? 0) !== (a.ratingCount ?? 0)) {
            return (b.ratingCount ?? 0) - (a.ratingCount ?? 0);
          }
          return a.name.localeCompare(b.name);
        });

        return sorted.slice(0, 5);
      } catch (error) {
        console.error("Failed to load top destinations:", error);
        return [] as DestinationItem[];
      }
    },
  });

  // Fetch top 5 products
  const { data: topProducts = [] } = useQuery({
    queryKey: ["products", "top-5-hero"],
    queryFn: async () => {
      try {
        const { data: productRows, error: productError } = await supabase
          .from("products")
          .select("id, product_name, description, image_url, user_id, municipality, barangay, latitude, longitude, address")
          .order("created_at", { ascending: false });

        if (productError) throw productError;

        const { data: ratingRows, error: ratingError } = await supabase
          .from("product_ratings")
          .select("product_id, rating");

        if (ratingError) throw ratingError;

        const ratingMap = new Map<string, { total: number; count: number }>();
        (ratingRows ?? []).forEach((row) => {
          const current = ratingMap.get(row.product_id) ?? { total: 0, count: 0 };
          ratingMap.set(row.product_id, {
            total: current.total + (row.rating ?? 0),
            count: current.count + 1,
          });
        });

        const userIds = Array.from(
          new Set((productRows ?? []).map((row) => row.user_id).filter(Boolean))
        ) as string[];

        const profilesById = new Map<string, { full_name?: string | null; email?: string | null; img_url?: string | null }>();
        if (userIds.length > 0) {
          const { data: profileRows, error: profileError } = await supabase
            .from("profiles")
            .select("id, full_name, email, img_url")
            .in("id", userIds);

          if (profileError) throw profileError;

          (profileRows ?? []).forEach((profile) => {
            profilesById.set(profile.id, profile);
          });
        }

        const mapped = (productRows ?? []).map((row) => {
          const rating = ratingMap.get(row.id);
          const ratingAvg = rating && rating.count > 0 ? rating.total / rating.count : undefined;
          const typedRow = row as { user_id?: string | null };
          const profile = typedRow.user_id ? profilesById.get(typedRow.user_id) : undefined;
          const uploaderName = profile?.full_name || profile?.email || "Seller";
          return {
            id: row.id,
            name: row.product_name,
            description: row.description ?? null,
            imageUrl: row.image_url ?? null,
            ratingAvg,
            ratingCount: rating?.count,
            uploaderName,
            uploaderImageUrl: profile?.img_url ?? null,
            uploaderId: typedRow.user_id ?? null,
            location: {
              municipality: (row as { municipality?: string | null }).municipality ?? null,
              barangay: (row as { barangay?: string | null }).barangay ?? null,
              lat: (row as { latitude?: number | null }).latitude ?? null,
              lng: (row as { longitude?: number | null }).longitude ?? null,
              address: (row as { address?: string | null }).address ?? null,
            },
          } as ProductItem;
        });

        const ratedOnly = mapped.filter(
          (item) => item.imageUrl && typeof item.ratingAvg === "number" && (item.ratingCount ?? 0) > 0
        );

        const sorted = [...ratedOnly].sort((a, b) => {
          if ((b.ratingAvg ?? 0) !== (a.ratingAvg ?? 0)) {
            return (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0);
          }
          if ((b.ratingCount ?? 0) !== (a.ratingCount ?? 0)) {
            return (b.ratingCount ?? 0) - (a.ratingCount ?? 0);
          }
          return a.name.localeCompare(b.name);
        });

        return sorted.slice(0, 5);
      } catch (error) {
        console.error("Failed to load top products:", error);
        return [] as ProductItem[];
      }
    },
  });
  return (
    <section className="hero-section-bg relative z-50 flex flex-col items-center justify-between min-h-screen pt-24 md:pt-28 pb-8">
      <div className="absolute inset-0 bg-linear-to-b from-black/70 via-black/40 to-transparent" />

      <div className="relative z-10 w-full max-w-5xl px-4 sm:px-6 flex flex-col items-center flex-grow">
        <div className="text-center md:text-left w-full mb-12">

          {/* "Explore" — animated letter by letter via GradualSpacing */}
          <GradualSpacing
            text="Explore"
            duration={0.6}
            delayMultiple={0.06}
            className="text-white text-6xl sm:text-7xl md:text-8xl font-semibold leading-tight"
          />

          {/* Subtitle — fades in after "Explore" finishes (~7 letters × 0.06 + 0.6 ≈ 1.02s) */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.1 }}
            className="text-hero-gradient text-transparent text-3xl sm:text-6xl md:text-7xl font-semibold mt-3 md:mt-2 drop-shadow-black drop-shadow-xl leading-tight"
          >
            2nd District of Ilocos Sur
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.5 }}
            className="text-white text-base sm:text-lg md:text-xl mt-4"
          >
            "Explore, Taste, and Enjoy the culture of every town."
          </motion.p>
        </div>

        {/* Search bar with suggestions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.8 }}
          className="w-full flex justify-center relative z-[100] mb-8"
        >
          <HomepageSearchWithSuggestions />
        </motion.div>
      </div>

      {/* Combined Carousel */}
      {(topDestinations.length > 0 || topProducts.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 2.0 }}
          className="relative z-10 w-full px-4 sm:px-6 flex flex-col items-center justify-center"
        >
          {(() => {
            // Combine and shuffle destinations and products into a single array
            const combinedItems: CombinedItem[] = [];
            topDestinations.forEach((dest) => {
              combinedItems.push({ type: 'destination', data: dest });
            });
            topProducts.forEach((prod) => {
              combinedItems.push({ type: 'product', data: prod });
            });

            // Shuffle the array using Fisher-Yates algorithm
            for (let i = combinedItems.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [combinedItems[i], combinedItems[j]] = [combinedItems[j], combinedItems[i]];
            }

            return (
              <Carousel
                items={combinedItems}
                onViewProfile={onViewProfile}
                onItemClick={(item, type) => {
                  if (type === 'destination') {
                    setActiveDestination(item as DestinationItem);
                  } else {
                    setActiveProduct(item as ProductItem);
                  }
                }}
              />
            );
          })()}
        </motion.div>
      )}

      {/* Destination Modal */}
      {activeDestination && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          role="presentation"
          onClick={() => setActiveDestination(null)}
        >
          <div
            className="max-w-5xl w-full max-h-[85vh] md:max-h-none overflow-y-auto hide-scrollbar overscroll-contain touch-pan-y"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <DestinationModalCard
              id={activeDestination.id}
              title={activeDestination.name}
              description={activeDestination.description || "A featured destination from Ilocos Sur."}
              imageUrl={activeDestination.imageUrl ?? ""}
              imageUrls={activeDestination.imageUrls}
              meta="Featured destination"
              postedBy={activeDestination.postedByName ?? "Tourism Office"}
              postedByImageUrl={activeDestination.postedByImageUrl}
              postedById={activeDestination.postedById}
              ratingAvg={activeDestination.ratingAvg}
              ratingCount={activeDestination.ratingCount}
              location={activeDestination.location}
              onProfileClick={onViewProfile}
            />
          </div>
        </div>
      )}

      {/* Product Modal */}
      {activeProduct && (
        <ProductModal
          open={true}
          product={{
            id: activeProduct.id,
            name: activeProduct.name,
            imageUrl: activeProduct.imageUrl ?? "",
            description: activeProduct.description,
            uploaderName: activeProduct.uploaderName,
            uploaderImageUrl: activeProduct.uploaderImageUrl,
            uploaderId: activeProduct.uploaderId,
            ratingAvg: activeProduct.ratingAvg,
            ratingCount: activeProduct.ratingCount,
            location: activeProduct.location,
          }}
          onClose={() => setActiveProduct(null)}
          onProfileClick={onViewProfile}
        />
      )}
    </section>
  );
};
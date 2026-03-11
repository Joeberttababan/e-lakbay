import React, { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { WildlifeCard } from '../components/WildlifeCard';
import { useAuth } from '../components/AuthProvider';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import { trackFilterUsage } from '../lib/analytics';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../components/modern-ui/breadcrumb';

interface Comment {
  id: string;
  user_id: string;
  comment_text: string;
  created_at: string;
  user_name?: string;
  user_image_url?: string;
}

interface WildlifeItem {
  id: string;
  species_name: string;
  description: string | null;
  conservation_status: string | null;
  image_url: string | null;
  image_urls: string[];
  created_at: string | null;
  municipality_id: string | null;
  municipality_name: string | null;
  municipality_image_url: string | null;
  comments?: Comment[];
}

interface WildlifePageProps {
  onBackHome?: () => void;
  onViewProfile?: (profileId: string) => void;
}

export const WildlifePage: React.FC<WildlifePageProps> = ({ onBackHome, onViewProfile }) => {
  const shouldReduceMotion = useReducedMotion();
  const getItemMotion = (index: number) =>
    shouldReduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.35, ease: 'easeOut', delay: index * 0.04 },
        };
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConservationStatus, setSelectedConservationStatus] = useState<string | null>(null);

  const {
    data: wildlife = [],
    isPending: isWildlifePending,
    isFetching: isWildlifeFetching,
  } = useQuery({
    queryKey: ['wildlife', 'approved'],
    queryFn: async () => {
      try {
        const { data: wildlifeRows, error: wildlifeError } = await supabase
          .from('endangered_wildlife')
          .select(`
            id,
            species_name,
            description,
            conservation_status,
            image_url,
            image_urls,
            created_at,
            municipality_id,
            approval_status,
            profiles:municipality_id (
              full_name,
              img_url
            )
          `)
          .eq('approval_status', 'approved')
          .order('created_at', { ascending: false });

        if (wildlifeError) {
          throw wildlifeError;
        }

        // Fetch comments for each wildlife item
        const wildlifeWithComments = await Promise.all(
          (wildlifeRows || []).map(async (item: any) => {
            const { data: commentsRows } = await supabase
              .from('wildlife_comments')
              .select(`
                id,
                user_id,
                comment_text,
                created_at,
                profiles:user_id (
                  full_name,
                  img_url
                )
              `)
              .eq('wildlife_id', item.id)
              .order('created_at', { ascending: false });

            // Map comments to include user info
            const comments = (commentsRows || []).map((comment: any) => {
              const profileData = Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles;
              return {
                id: comment.id,
                user_id: comment.user_id,
                comment_text: comment.comment_text,
                created_at: comment.created_at,
                user_name: profileData?.full_name || 'Anonymous',
                user_image_url: profileData?.img_url,
              };
            });

            // Handle profiles as either array or object
            const profileData = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;

            return {
              id: item.id,
              species_name: item.species_name,
              description: item.description,
              conservation_status: item.conservation_status,
              image_url: item.image_url,
              image_urls: item.image_urls || [],
              created_at: item.created_at,
              municipality_id: item.municipality_id,
              municipality_name: profileData?.full_name || 'Unknown Municipality',
              municipality_image_url: profileData?.img_url,
              comments,
            };
          })
        );

        return wildlifeWithComments;
      } catch (error) {
        console.error('Error fetching wildlife:', error);
        toast.error('Failed to load wildlife data');
        return [];
      }
    },
  });

  const filteredWildlife = useMemo(() => {
    let filtered = wildlife;

    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.species_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedConservationStatus) {
      filtered = filtered.filter((item) => item.conservation_status === selectedConservationStatus);
    }

    return filtered;
  }, [wildlife, searchQuery, selectedConservationStatus]);

  const handleAddComment = async (wildlifeId: string, commentText: string) => {
    if (!user) {
      toast.error('Please log in to comment');
      return;
    }

    if (!commentText.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    try {
      const { error } = await supabase.from('wildlife_comments').insert({
        wildlife_id: wildlifeId,
        user_id: user.id,
        comment_text: commentText,
      });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['wildlife', 'approved'] });
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  return (
    <main className="min-h-screen bg-white text-black pt-24 md:pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={onBackHome} className="cursor-pointer hover:text-black/70">
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Wildlife Conservation</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Endangered Wildlife</h1>
          <p className="text-black/60 text-lg">
            Discover the endangered species of Ilocos Sur and learn about conservation efforts
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search wildlife species..."
              className="w-full px-4 py-2 bg-white border border-black/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Conservation Status</label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'All', value: null },
                { label: 'Critically Endangered', value: 'Critically Endangered' },
                { label: 'Endangered', value: 'Endangered' },
                { label: 'Vulnerable', value: 'Vulnerable' },
              ].map((status) => (
                <button
                  key={status.value || 'all'}
                  onClick={() => {
                    setSelectedConservationStatus(status.value);
                    trackFilterUsage({
                      scope: 'global',
                      filterName: 'conservation_status',
                      filterValue: status.label,
                    });
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedConservationStatus === status.value
                      ? 'bg-green-600 text-white'
                      : 'bg-black/10 text-black hover:bg-black/20'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Wildlife Grid */}
        {isWildlifePending ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-black/5 rounded-lg h-80 animate-pulse" />
            ))}
          </div>
        ) : filteredWildlife.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWildlife.map((item, index) => (
              <motion.div
                key={item.id}
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.04 }}
              >
                <WildlifeCard
                  id={item.id}
                  speciesName={item.species_name}
                  description={item.description}
                  conservationStatus={item.conservation_status}
                  imageUrl={item.image_url}
                  imageUrls={item.image_urls}
                  municipalityName={item.municipality_name}
                  municipalityImageUrl={item.municipality_image_url}
                  comments={item.comments}
                  onAddComment={handleAddComment}
                  onViewProfile={onViewProfile}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-black/60 text-lg">No wildlife species found</p>
          </div>
        )}
      </div>
    </main>
  );
};

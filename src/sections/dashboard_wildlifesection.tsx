import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../components/AuthProvider';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

interface DashboardWildlifeSectionProps {
  onOpenWildlifeUpload: () => void;
}

interface WildlifeItem {
  id: string;
  species_name: string;
  description: string | null;
  image_url: string | null;
  approval_status: 'pending' | 'approved' | 'declined';
  created_at: string;
}

export const DashboardWildlifeSection: React.FC<DashboardWildlifeSectionProps> = ({ onOpenWildlifeUpload }) => {
  const shouldReduceMotion = useReducedMotion();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: wildlife = [], isPending } = useQuery({
    queryKey: ['dashboard-wildlife', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data, error } = await supabase
        .from('endangered_wildlife')
        .select('id, species_name, description, image_url, approval_status, created_at')
        .eq('municipality_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching wildlife:', error);
        toast.error('Failed to load your wildlife uploads');
        return [];
      }

      return data as WildlifeItem[];
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'declined':
        return 'bg-red-100 text-red-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <section id="wildlife-section" className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-black">Endangered Wildlife</h3>
        <button
          type="button"
          onClick={onOpenWildlifeUpload}
          className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors text-sm"
        >
          <Plus className="h-4 w-4" />
          Upload Wildlife
        </button>
      </div>

      {isPending ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-black/5 rounded-lg h-20 animate-pulse" />
          ))}
        </div>
      ) : wildlife.length > 0 ? (
        <motion.div className="space-y-3">
          {wildlife.map((item, index) => (
            <motion.div
              key={item.id}
              className="flex gap-4 p-4 rounded-lg border border-black/10 hover:border-green-500 transition-colors bg-white"
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              {item.image_url && (
                <img
                  src={item.image_url}
                  alt={item.species_name}
                  className="w-20 h-20 rounded-lg object-cover"
                />
              )}

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-black truncate">{item.species_name}</p>
                <p className="text-sm text-black/60 line-clamp-1">{item.description}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-black/40">{formatDate(item.created_at)}</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(item.approval_status)}`}>
                    {item.approval_status.charAt(0).toUpperCase() + item.approval_status.slice(1)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="text-center py-8 rounded-lg border border-black/10 bg-black/5">
          <p className="text-black/60 mb-3">No wildlife uploads yet</p>
          <button
            type="button"
            onClick={onOpenWildlifeUpload}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Upload Your First Species
          </button>
        </div>
      )}
    </section>
  );
};

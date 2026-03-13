import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Skeleton } from '../ui/skeleton';
import { toast } from 'sonner';
import { AlertCircle, Check, X, Eye, Trash2 } from 'lucide-react';

interface WildlifeApproval {
  id: string;
  species_name: string;
  description: string | null;
  conservation_status: string | null;
  image_url: string | null;
  approval_status: 'pending' | 'approved' | 'declined';
  municipality_id: string;
  created_at: string;
  profiles?: Array<{
    full_name: string;
    email: string;
    img_url?: string;
  }> | {
    full_name: string;
    email: string;
    img_url?: string;
  };
}

interface TabProps {
  onTabChange?: (tab: string) => void;
}

export const WildlifeAdminTab: React.FC<TabProps> = () => {
  const [wildlife, setWildlife] = useState<WildlifeApproval[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'declined'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedWildlife, setSelectedWildlife] = useState<WildlifeApproval | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load wildlife
  useEffect(() => {
    let isMounted = true;
    const loadWildlife = async () => {
      setIsLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('endangered_wildlife')
        .select(`
          id,
          species_name,
          description,
          conservation_status,
          image_url,
          approval_status,
          municipality_id,
          created_at,
          profiles:municipality_id(full_name, email, img_url)
        `)
        .order('created_at', { ascending: false });

      if (!isMounted) return;

      if (fetchError) {
        setError(fetchError.message);
        toast.error('Failed to load wildlife submissions.');
        setWildlife([]);
      } else {
        // Normalize profiles to be a single object instead of array
        const normalizedData = (data as any[])?.map((item) => ({
          ...item,
          profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
        })) ?? [];
        setWildlife(normalizedData as WildlifeApproval[]);
      }
      setIsLoading(false);
    };

    loadWildlife();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredWildlife = useMemo(() => {
    return wildlife.filter((item) => {
      const matchesSearch =
        item.species_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getMunicipalityName(item).toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter = filterStatus === 'all' || item.approval_status === filterStatus;

      return matchesSearch && matchesFilter;
    });
  }, [wildlife, searchQuery, filterStatus]);

  const getMunicipalityName = (item: WildlifeApproval) => {
    if (!item.profiles) return 'Unknown';
    if (Array.isArray(item.profiles)) {
      return item.profiles[0]?.full_name || 'Unknown';
    }
    return item.profiles.full_name || 'Unknown';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadgeColor = (status: string) => {
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

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      // Update approval status
      const { error: updateError } = await supabase
        .from('endangered_wildlife')
        .update({ approval_status: 'approved' })
        .eq('id', id);

      if (updateError) throw updateError;

      // Get the wildlife item for notification
      const item = wildlife.find((w) => w.id === id);
      if (item) {
        // Create notification for municipality
        await supabase.from('notifications').insert({
          type: 'wildlife_approved',
          user_id: item.municipality_id,
          title: 'Wildlife Upload Approved',
          message: `Your wildlife upload "${item.species_name}" has been approved and is now live!`,
          related_id: id,
          is_read: false,
          created_at: new Date().toISOString(),
        });
      }

      // Update local state
      setWildlife(
        wildlife.map((w) => (w.id === id ? { ...w, approval_status: 'approved' } : w))
      );

      toast.success('Wildlife approved successfully!');
    } catch (err) {
      console.error('Error approving wildlife:', err);
      toast.error('Failed to approve wildlife');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (id: string) => {
    setProcessingId(id);
    try {
      // Update approval status
      const { error: updateError } = await supabase
        .from('endangered_wildlife')
        .update({ approval_status: 'declined' })
        .eq('id', id);

      if (updateError) throw updateError;

      // Get the wildlife item for notification
      const item = wildlife.find((w) => w.id === id);
      if (item) {
        // Create notification for municipality
        await supabase.from('notifications').insert({
          type: 'wildlife_declined',
          user_id: item.municipality_id,
          title: 'Wildlife Upload Declined',
          message: `Your wildlife upload "${item.species_name}" did not meet our guidelines and was declined. Please contact support for more details.`,
          related_id: id,
          is_read: false,
          created_at: new Date().toISOString(),
        });
      }

      // Update local state
      setWildlife(
        wildlife.map((w) => (w.id === id ? { ...w, approval_status: 'declined' } : w))
      );

      toast.success('Wildlife declined.');
    } catch (err) {
      console.error('Error declining wildlife:', err);
      toast.error('Failed to decline wildlife');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this wildlife entry? This action cannot be undone.');
    if (!confirmed) return;

    setProcessingId(id);
    try {
      // Delete the wildlife record
      const { error: deleteError } = await supabase
        .from('endangered_wildlife')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Update local state to remove the deleted wildlife
      setWildlife(wildlife.filter((w) => w.id !== id));

      // Close modal if the deleted item was selected
      if (selectedWildlife?.id === id) {
        setIsModalOpen(false);
      }

      toast.success('Wildlife deleted successfully.');
    } catch (err) {
      console.error('Error deleting wildlife:', err);
      toast.error('Failed to delete wildlife');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Search by species name, description, or municipality..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-[#1A1A1A]/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/20"
        />

        <div className="flex gap-2 flex-wrap">
          {[
            { label: 'All', value: 'all' },
            { label: 'Pending', value: 'pending' },
            { label: 'Approved', value: 'approved' },
            { label: 'Declined', value: 'declined' },
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setFilterStatus(filter.value as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === filter.value
                  ? 'bg-[#1A1A1A] text-white'
                  : 'bg-[#1A1A1A]/10 text-[#1A1A1A] hover:bg-[#1A1A1A]/20'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Error loading wildlife</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : filteredWildlife.length > 0 ? (
        <div className="overflow-x-auto border border-[#1A1A1A]/10 rounded-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#1A1A1A]/5">
                <TableHead className="text-[#1A1A1A] font-semibold">Species</TableHead>
                <TableHead className="text-[#1A1A1A] font-semibold">Status</TableHead>
                <TableHead className="text-[#1A1A1A] font-semibold">Municipality</TableHead>
                <TableHead className="text-[#1A1A1A] font-semibold">Submitted</TableHead>
                <TableHead className="text-[#1A1A1A] font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWildlife.map((item) => (
                <TableRow key={item.id} className="hover:bg-[#1A1A1A]/5">
                  <TableCell className="font-medium text-[#1A1A1A]">{item.species_name}</TableCell>
                  <TableCell>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(item.approval_status)}`}>
                      {item.approval_status.charAt(0).toUpperCase() + item.approval_status.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell className="text-[#1A1A1A]/60">{getMunicipalityName(item)}</TableCell>
                  <TableCell className="text-[#1A1A1A]/60">{formatDate(item.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedWildlife(item);
                          setIsModalOpen(true);
                        }}
                        className="p-2 hover:bg-[#1A1A1A]/10 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4 text-[#1A1A1A]/60" />
                      </button>

                      {item.approval_status === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleApprove(item.id)}
                            disabled={processingId === item.id}
                            className="p-2 hover:bg-green-50 text-green-600 rounded-lg transition-colors disabled:opacity-50"
                            title="Approve"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDecline(item.id)}
                            disabled={processingId === item.id}
                            className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors disabled:opacity-50"
                            title="Decline"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      )}

                      {item.approval_status === 'approved' && (
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          disabled={processingId === item.id}
                          className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 text-[#1A1A1A]/60">
          <p>No wildlife submissions found</p>
        </div>
      )}

      {/* Details Modal */}
      {isModalOpen && selectedWildlife && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#1A1A1A]/10">
              <h3 className="text-xl font-semibold text-[#1A1A1A]">{selectedWildlife.species_name}</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[#1A1A1A]/60 hover:text-[#1A1A1A]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {selectedWildlife.image_url && (
                <img
                  src={selectedWildlife.image_url}
                  alt={selectedWildlife.species_name}
                  className="w-full h-64 object-cover rounded-lg"
                />
              )}

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-[#1A1A1A]/60 uppercase tracking-wide">Conservation Status</p>
                  <p className="text-lg font-medium text-[#1A1A1A]">{selectedWildlife.conservation_status}</p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-[#1A1A1A]/60 uppercase tracking-wide">Description</p>
                  <p className="text-[#1A1A1A]">{selectedWildlife.description}</p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-[#1A1A1A]/60 uppercase tracking-wide">Submitted By</p>
                  <p className="text-[#1A1A1A]">{getMunicipalityName(selectedWildlife)}</p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-[#1A1A1A]/60 uppercase tracking-wide">Submitted Date</p>
                  <p className="text-[#1A1A1A]">{formatDate(selectedWildlife.created_at)}</p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-[#1A1A1A]/60 uppercase tracking-wide">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadgeColor(selectedWildlife.approval_status)}`}>
                    {selectedWildlife.approval_status.charAt(0).toUpperCase() + selectedWildlife.approval_status.slice(1)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              {selectedWildlife.approval_status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t border-[#1A1A1A]/10">
                  <button
                    type="button"
                    onClick={() => {
                      handleDecline(selectedWildlife.id);
                      setIsModalOpen(false);
                    }}
                    disabled={processingId === selectedWildlife.id}
                    className="flex-1 px-4 py-2 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleApprove(selectedWildlife.id);
                      setIsModalOpen(false);
                    }}
                    disabled={processingId === selectedWildlife.id}
                    className="flex-1 px-4 py-2 rounded-lg font-medium text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    Approve
                  </button>
                </div>
              )}

              {selectedWildlife.approval_status === 'approved' && (
                <div className="flex gap-3 pt-4 border-t border-[#1A1A1A]/10">
                  <button
                    type="button"
                    onClick={() => {
                      handleDelete(selectedWildlife.id);
                      setIsModalOpen(false);
                    }}
                    disabled={processingId === selectedWildlife.id}
                    className="flex-1 px-4 py-2 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-full px-4 py-2 rounded-lg font-medium text-[#1A1A1A] border border-[#1A1A1A]/20 hover:bg-[#1A1A1A]/5 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

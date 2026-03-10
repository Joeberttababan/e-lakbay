import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Skeleton } from '../ui/skeleton';
import { toast } from 'sonner';
import { AlertCircle, Trash2, Edit2, X, Check } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  location: string | null;
  category: 'festival' | 'cultural' | 'holiday' | 'other';
  municipality_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  profiles?: Array<{
    full_name: string;
    email: string;
  }> | {
    full_name: string;
    email: string;
  };
}

const EventsTab: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Event | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load events
  useEffect(() => {
    let isMounted = true;
    const loadEvents = async () => {
      setIsLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('events')
        .select(`
          id,
          title,
          description,
          start_date,
          end_date,
          location,
          category,
          municipality_id,
          created_by,
          created_at,
          updated_at,
          profiles:municipality_id(full_name, email)
        `)
        .order('start_date', { ascending: false });

      if (!isMounted) return;

      if (fetchError) {
        setError(fetchError.message);
        toast.error('Failed to load events.');
        setEvents([]);
      } else {
        // Normalize profiles to be a single object instead of array
        const normalizedData = (data as any[])?.map((event) => ({
          ...event,
          profiles: Array.isArray(event.profiles) ? event.profiles[0] : event.profiles,
        })) ?? [];
        setEvents(normalizedData as Event[]);
      }
      setIsLoading(false);
    };

    loadEvents();
    return () => { isMounted = false; };
  }, []);

  const getMunicipalityName = (event: Event) => {
    if (!event.profiles) return 'Unknown';
    if (Array.isArray(event.profiles)) {
      return event.profiles[0]?.full_name || 'Unknown';
    }
    return event.profiles.full_name || 'Unknown';
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

  // Filter events
  const filteredEvents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return events.filter((event) => {
      const title = event.title?.toLowerCase() ?? '';
      const location = event.location?.toLowerCase() ?? '';
      const municipality = getMunicipalityName(event).toLowerCase();
      return (
        !query ||
        title.includes(query) ||
        location.includes(query) ||
        municipality.includes(query)
      );
    });
  }, [events, searchQuery]);

  const handleEdit = (event: Event) => {
    setEditingId(event.id);
    setEditValues({ ...event });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValues(null);
  };

  const handleSaveEdit = async () => {
    if (!editValues) return;

    if (!editValues.title.trim()) {
      toast.error('Event title is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error: updateError } = await supabase
        .from('events')
        .update({
          title: editValues.title,
          description: editValues.description,
          start_date: editValues.start_date,
          end_date: editValues.end_date,
          location: editValues.location,
          category: editValues.category,
        })
        .eq('id', editValues.id);

      if (updateError) throw updateError;

      setEvents((prev) =>
        prev.map((e) => (e.id === editValues.id ? editValues : e))
      );
      setEditingId(null);
      setEditValues(null);
      toast.success('Event updated successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update event';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (deleteError) throw deleteError;

      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      toast.success('Event deleted successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete event';
      toast.error(message);
    }
  };

  if (error) {
    return (
      <div className="mt-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-red-600" />
        <div>
          <p className="text-sm font-medium text-red-900">Error loading events</p>
          <p className="text-xs text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-6"
    >
      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search events by title, location, or municipality..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-[#1A1A1A]/20 focus:border-[#1A1A1A] focus:outline-none transition-colors"
        />
      </div>

      {/* Events Table */}
      <div className="rounded-lg border border-[#1A1A1A]/10 overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-[#1A1A1A]/10">
                <TableHead className="text-black font-semibold">Title</TableHead>
                <TableHead className="text-black font-semibold">Municipality</TableHead>
                <TableHead className="text-black font-semibold">Category</TableHead>
                <TableHead className="text-black font-semibold">Start Date</TableHead>
                <TableHead className="text-black font-semibold">End Date</TableHead>
                <TableHead className="text-black font-semibold">Location</TableHead>
                <TableHead className="text-black font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5)
                  .fill(0)
                  .map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    </TableRow>
                  ))
              ) : filteredEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-[#1A1A1A]/60">
                    {searchQuery ? 'No events found matching your search.' : 'No events posted yet.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredEvents.map((event) => (
                  <TableRow key={event.id} className="border-b border-[#1A1A1A]/5 hover:bg-[#1A1A1A]/2 transition-colors">
                    {editingId === event.id ? (
                      <>
                        <TableCell>
                          <input
                            type="text"
                            value={editValues?.title || ''}
                            onChange={(e) => setEditValues((prev) => prev ? { ...prev, title: e.target.value } : null)}
                            className="w-full px-2 py-1 border border-[#1A1A1A]/20 rounded text-sm"
                          />
                        </TableCell>
                        <TableCell className="text-sm text-[#1A1A1A]/60">
                          {getMunicipalityName(event)}
                        </TableCell>
                        <TableCell>
                          <select
                            value={editValues?.category || 'other'}
                            onChange={(e) => setEditValues((prev) => prev ? { ...prev, category: e.target.value as any } : null)}
                            className="px-2 py-1 border border-[#1A1A1A]/20 rounded text-sm"
                          >
                            <option value="festival">Festival</option>
                            <option value="cultural">Cultural</option>
                            <option value="holiday">Holiday</option>
                            <option value="other">Other</option>
                          </select>
                        </TableCell>
                        <TableCell>
                          <input
                            type="datetime-local"
                            value={editValues?.start_date ? new Date(editValues.start_date).toISOString().slice(0, 16) : ''}
                            onChange={(e) => setEditValues((prev) => prev ? { ...prev, start_date: new Date(e.target.value).toISOString() } : null)}
                            className="px-2 py-1 border border-[#1A1A1A]/20 rounded text-sm w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <input
                            type="datetime-local"
                            value={editValues?.end_date ? new Date(editValues.end_date).toISOString().slice(0, 16) : ''}
                            onChange={(e) => setEditValues((prev) => prev ? { ...prev, end_date: new Date(e.target.value).toISOString() } : null)}
                            className="px-2 py-1 border border-[#1A1A1A]/20 rounded text-sm w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <input
                            type="text"
                            value={editValues?.location || ''}
                            onChange={(e) => setEditValues((prev) => prev ? { ...prev, location: e.target.value } : null)}
                            className="w-full px-2 py-1 border border-[#1A1A1A]/20 rounded text-sm"
                          />
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <button
                            onClick={handleSaveEdit}
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors disabled:opacity-60"
                          >
                            <Check className="h-3 w-3" />
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500 transition-colors"
                          >
                            <X className="h-3 w-3" />
                            Cancel
                          </button>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="font-medium text-sm">{event.title}</TableCell>
                        <TableCell className="text-sm text-[#1A1A1A]/60">
                          {getMunicipalityName(event)}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs px-2 py-1 rounded-full bg-[#1A1A1A]/10 text-[#1A1A1A] capitalize">
                            {event.category}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-[#1A1A1A]/70">
                          {formatDate(event.start_date)}
                        </TableCell>
                        <TableCell className="text-sm text-[#1A1A1A]/70">
                          {formatDate(event.end_date)}
                        </TableCell>
                        <TableCell className="text-sm text-[#1A1A1A]/70">
                          {event.location || '—'}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <button
                            onClick={() => handleEdit(event)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
                          >
                            <Edit2 className="h-3 w-3" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(event.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </button>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Summary */}
      {!isLoading && (
        <div className="mt-4 text-sm text-[#1A1A1A]/60">
          Showing {filteredEvents.length} of {events.length} events
        </div>
      )}
    </motion.div>
  );
};

export default EventsTab;

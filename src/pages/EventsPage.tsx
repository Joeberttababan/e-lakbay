import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../components/AuthProvider';
import { toast } from 'sonner';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../components/modern-ui/breadcrumb';

interface Event {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  location: string | null;
  category: 'festival' | 'cultural' | 'holiday' | 'other';
  municipality_id: string;
  created_at: string;
  image_urls?: string[];
}

interface EventsPageProps {
  onBackHome: () => void;
}

export const EventsPage: React.FC<EventsPageProps> = ({ onBackHome }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [pinnedEventIds, setPinnedEventIds] = useState<Set<string>>(new Set());
  const [pinningEventId, setPinningEventId] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*,image_urls')
          .order('start_date', { ascending: true });

        if (error) {
          console.error('Error fetching events:', error);
        } else {
          setEvents(data || []);
        }
      } catch (err) {
        console.error('Error fetching events:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Fetch pinned events for logged-in user
  useEffect(() => {
    if (!user) {
      setPinnedEventIds(new Set());
      return;
    }

    const fetchPinnedEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('pinned_events')
          .select('event_id')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching pinned events:', error);
        } else {
          const pinned = new Set(data?.map((p) => p.event_id) || []);
          setPinnedEventIds(pinned);
        }
      } catch (err) {
        console.error('Error fetching pinned events:', err);
      }
    };

    fetchPinnedEvents();
  }, [user]);

  const handleTogglePin = async (eventId: string) => {
    if (!user) {
      toast.error('Please log in to pin events');
      return;
    }

    setPinningEventId(eventId);

    try {
      if (pinnedEventIds.has(eventId)) {
        // Unpin event
        const { error } = await supabase
          .from('pinned_events')
          .delete()
          .eq('user_id', user.id)
          .eq('event_id', eventId);

        if (error) throw error;

        setPinnedEventIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(eventId);
          return newSet;
        });
        toast.success('Event unpinned');
      } else {
        // Pin event
        const { error } = await supabase
          .from('pinned_events')
          .insert({
            user_id: user.id,
            event_id: eventId,
          });

        if (error) throw error;

        setPinnedEventIds((prev) => {
          const newSet = new Set(prev);
          newSet.add(eventId);
          return newSet;
        });
        toast.success('Event pinned!');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to pin event';
      console.error('Error toggling pin:', err);
      toast.error(message);
    } finally {
      setPinningEventId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'festival':
        return 'bg-purple-100 border-purple-300 text-purple-700';
      case 'cultural':
        return 'bg-blue-100 border-blue-300 text-blue-700';
      case 'holiday':
        return 'bg-red-100 border-red-300 text-red-700';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-700';
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-black pt-24 md:pt-28 pb-12">
      {/* Header Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative px-4 sm:px-6 lg:px-10 mb-12"
      >
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex justify-start mb-6">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      onBackHome();
                    }}
                  >
                    Home
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Events</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            Events & Festivals
          </h1>
          <p className="text-lg text-black/70 max-w-2xl">
            Discover all the vibrant events, festivals, and celebrations happening across the 2nd District of Ilocos Sur
          </p>
        </div>
      </motion.section>

      {/* Database Events Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="px-4 sm:px-6 lg:px-10"
      >
        <div className="max-w-7xl mx-auto">
          {!loading && events.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6">Upcoming Municipality Events</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow bg-white border border-gray-200 relative"
                  >
                    {/* Event Images - Full Width */}
                    {event.image_urls && event.image_urls.length > 0 ? (
                      <div className="w-full h-48 overflow-x-auto scrollbar-hide flex">
                        {event.image_urls.map((imageUrl, idx) => (
                          <img
                            key={idx}
                            src={imageUrl}
                            alt={`Event image ${idx + 1}`}
                            className="h-full w-full flex-shrink-0 object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <div className="text-center">
                          <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-gray-500 text-sm font-medium">No images available</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Pin Button */}
                    <button
                      type="button"
                      onClick={() => handleTogglePin(event.id)}
                      disabled={pinningEventId === event.id}
                      className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-white shadow-md hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center"
                      aria-label={pinnedEventIds.has(event.id) ? 'Unpin event' : 'Pin event'}
                    >
                      <svg
                        className={`w-5 h-5 transition-colors ${
                          pinnedEventIds.has(event.id)
                            ? 'text-red-500 fill-red-500'
                            : 'text-gray-400 hover:text-red-500'
                        }`}
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                      </svg>
                    </button>

                    <div className="p-4">
                      {/* Category Badge */}
                      <div className="flex items-start justify-between mb-3">
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full border capitalize ${getCategoryColor(event.category)}`}>
                          {event.category}
                        </span>
                      </div>

                      {/* Event Title */}
                      <h3 className="text-lg font-bold mb-2 text-black line-clamp-2">
                        {event.title}
                      </h3>

                      {/* Description */}
                      {event.description && (
                        <p className="text-sm text-black/70 mb-3 line-clamp-2">
                          {event.description}
                        </p>
                      )}

                      {/* Date & Time */}
                      <div className="space-y-2 mb-3 text-sm">
                        <div className="flex items-center gap-2 text-black/80">
                          <span className="font-semibold">📅 Start:</span>
                          <span>{formatDate(event.start_date)} at {formatTime(event.start_date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-black/80">
                          <span className="font-semibold">🏁 End:</span>
                          <span>{formatDate(event.end_date)} at {formatTime(event.end_date)}</span>
                        </div>
                      </div>

                      {/* Location */}
                      {event.location && (
                        <div className="flex items-center gap-2 text-sm text-black/80 mb-3">
                          <span className="font-semibold">📍</span>
                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* No Events Message */}
          {!loading && events.length === 0 && (
            <div className="mt-12 p-8 rounded-lg bg-slate-100 border border-slate-300 text-center">
              <p className="text-black/70">
                No municipality events posted yet. Stay tuned for upcoming celebrations and events from our municipalities!
              </p>
            </div>
          )}

          {/* Calendar Section */}
          <div className="mt-12 rounded-2xl overflow-hidden shadow-lg bg-white">
            {/* Calendar Embed */}
            <div className="w-full" style={{ minHeight: '400px' }}>
              <iframe
                src="https://calendar.google.com/calendar/embed?src=elakbay.ilocos2@gmail.com&ctz=Asia%2FManila"
                style={{
                  border: 0,
                  width: '100%',
                  height: '400px',
                  display: 'block',
                }}
                frameBorder="0"
                scrolling="no"
                title="E-Lakbay Events Calendar"
                loading="lazy"
              />
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-lg p-6 bg-blue-50 border border-blue-200"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                  📅
                </div>
                <h3 className="font-semibold text-lg">Upcoming Events</h3>
              </div>
              <p className="text-black/70 text-sm">
                Stay updated with festivals, fairs, and cultural events happening throughout the 2nd District
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-lg p-6 bg-green-50 border border-green-200"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
                  🎉
                </div>
                <h3 className="font-semibold text-lg">Local Festivals</h3>
              </div>
              <p className="text-black/70 text-sm">
                Experience the rich traditions through local fiestas and cultural celebrations
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="rounded-lg p-6 bg-orange-50 border border-orange-200"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">
                  🎪
                </div>
                <h3 className="font-semibold text-lg">Activities</h3>
              </div>
              <p className="text-black/70 text-sm">
                Join various activities and events organized by municipalities in the district
              </p>
            </motion.div>
          </div>

          {/* Instructions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-12 p-6 rounded-lg bg-slate-100 border border-slate-300"
          >
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <span className="text-lg">ℹ️</span> How to Use This Calendar
            </h3>
            <ul className="space-y-2 text-sm text-black/70">
              <li>• <strong>View Events:</strong> Browse all events across the 2nd District of Ilocos Sur</li>
              <li>• <strong>List:</strong>Pin events</li>
            </ul>
          </motion.div>
        </div>
      </motion.section>
    </main>
  );
};

export default EventsPage;

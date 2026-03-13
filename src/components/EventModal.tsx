import React from 'react';
import { X, Calendar, MapPin, Clock, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface EventModalProps {
  open: boolean;
  onClose: () => void;
  event: {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    eventDate: string | null;
    eventTime: string | null;
    municipality: string | null;
    barangay: string | null;
    createdAt?: string | null;
    createdBy?: string | null;
    createdByImageUrl?: string | null;
  };
}

export const EventModal: React.FC<EventModalProps> = ({ open, onClose, event }) => {
  if (!open) return null;

  const handleAddToGoogleCalendar = () => {
    const title = event.name;
    const description = event.description || '';
    const location = event.municipality || 'Ilocos Sur';
    
    // Parse date and time
    let startDateTime = '';
    let endDateTime = '';
    
    if (event.eventDate) {
      startDateTime = `${event.eventDate}${event.eventTime ? `T${event.eventTime}` : 'T00:00:00'}`;
      endDateTime = `${event.eventDate}${event.eventTime ? `T${event.eventTime.split(':')[0]}:${parseInt(event.eventTime.split(':')[1]) + 1}:00` : 'T01:00:00'}`;
    }

    const googleCalendarUrl = new URL('https://www.google.com/calendar/render');
    googleCalendarUrl.searchParams.append('action', 'TEMPLATE');
    googleCalendarUrl.searchParams.append('text', title);
    googleCalendarUrl.searchParams.append('details', description);
    googleCalendarUrl.searchParams.append('location', location);
    if (startDateTime) {
      googleCalendarUrl.searchParams.append('dates', startDateTime.replace(/[-:]/g, '').replace('T', '') + '/' + endDateTime.replace(/[-:]/g, '').replace('T', ''));
    }

    window.open(googleCalendarUrl.toString(), '_blank');
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatCreatedAt = (createdAt: string | null | undefined) => {
    if (!createdAt) return '';
    try {
      const date = new Date(createdAt);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return createdAt;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-2xl max-h-[90vh] rounded-2xl overflow-hidden bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-black/10 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-6 h-6 text-black" />
        </button>

        {/* Content */}
        <div className="overflow-y-auto max-h-[90vh]">
          {/* Event Image */}
          {event.imageUrl && (
            <div className="w-full h-64 bg-gray-200 overflow-hidden">
              <img
                src={event.imageUrl}
                alt={event.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-6 md:p-8">
            {/* Event Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-black mb-2">
              {event.name}
            </h1>

            {/* Posted By Info */}
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-black/10">
              {event.createdByImageUrl && (
                <img
                  src={event.createdByImageUrl}
                  alt={(event.createdBy || 'Creator') as string}
                  className="w-10 h-10 rounded-full object-cover"
                />
              )}
              <div>
                <p className="text-sm text-black/70">Posted by</p>
                <p className="font-semibold text-black">{event.createdBy || 'Municipality'}</p>
                {event.createdAt && (
                  <p className="text-xs text-black/60">{formatCreatedAt(event.createdAt)}</p>
                )}
              </div>
            </div>

            {/* Event Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Date */}
              {event.eventDate && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-black/70">Date</p>
                    <p className="font-semibold text-black">{formatDate(event.eventDate)}</p>
                  </div>
                </div>
              )}

              {/* Time */}
              {event.eventTime && (
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-black/70">Time</p>
                    <p className="font-semibold text-black">{event.eventTime}</p>
                  </div>
                </div>
              )}

              {/* Location */}
              {event.municipality && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-black/70">Location</p>
                    <p className="font-semibold text-black">{event.municipality}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            {event.description && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-black mb-3">About This Event</h2>
                <p className="text-black/80 leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            )}

            {/* Add to Google Calendar Button */}
            <button
              onClick={handleAddToGoogleCalendar}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold hover:brightness-110 transition-all flex items-center justify-center gap-2"
            >
              <Calendar className="w-5 h-5" />
              Add to Google Calendar
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

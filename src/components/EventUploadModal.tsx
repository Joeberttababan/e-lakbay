import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthProvider';
import { toast } from 'sonner';

interface EventUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EventUploadModal: React.FC<EventUploadModalProps> = ({ isOpen, onClose }) => {
  const { user, profile } = useAuth();
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventStartDate, setEventStartDate] = useState('');
  const [eventStartTime, setEventStartTime] = useState('');
  const [eventEndDate, setEventEndDate] = useState('');
  const [eventEndTime, setEventEndTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventCategory, setEventCategory] = useState<'festival' | 'cultural' | 'holiday' | 'other'>('festival');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!eventTitle.trim()) {
      setError('Event title is required');
      return;
    }

    if (!eventStartDate || !eventStartTime) {
      setError('Event start date and time are required');
      return;
    }

    if (!eventEndDate || !eventEndTime) {
      setError('Event end date and time are required');
      return;
    }

    if (!user || !profile) {
      setError('You must be logged in to add events');
      return;
    }

    setIsSubmitting(true);

    try {
      const startDateTime = new Date(`${eventStartDate}T${eventStartTime}`);
      const endDateTime = new Date(`${eventEndDate}T${eventEndTime}`);

      if (endDateTime <= startDateTime) {
        setError('End date and time must be after start date and time');
        setIsSubmitting(false);
        return;
      }

      const { error: insertError } = await supabase.from('events').insert({
        title: eventTitle,
        description: eventDescription,
        start_date: startDateTime.toISOString(),
        end_date: endDateTime.toISOString(),
        location: eventLocation,
        category: eventCategory,
        municipality_id: profile.id,
        created_by: user.id,
      });

      if (insertError) throw insertError;

      toast.success('Event added successfully!');
      setEventTitle('');
      setEventDescription('');
      setEventStartDate('');
      setEventStartTime('');
      setEventEndDate('');
      setEventEndTime('');
      setEventLocation('');
      setEventCategory('festival');
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add event';
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      role="presentation"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-secondary rounded-2xl p-6 w-full max-w-2xl text-black max-h-[90vh] overflow-y-auto hide-scrollbar"
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="event-modal-title" className="text-2xl font-semibold">
            Add Event
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-black/60 hover:text-black"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Event Title */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Event Title *
            </label>
            <input
              type="text"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              placeholder="e.g., Vigan Festival, Local Fiesta"
              className="w-full px-4 py-2 rounded-lg border border-black/20 focus:border-black/40 focus:outline-none transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              placeholder="Describe the event, activities, and attractions..."
              rows={4}
              className="w-full px-4 py-2 rounded-lg border border-black/20 focus:border-black/40 focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Category
            </label>
            <select
              value={eventCategory}
              onChange={(e) => setEventCategory(e.target.value as any)}
              className="w-full px-4 py-2 rounded-lg border border-black/20 focus:border-black/40 focus:outline-none transition-colors"
            >
              <option value="festival">Festival</option>
              <option value="cultural">Cultural Event</option>
              <option value="holiday">Holiday</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Start Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Start Date *
              </label>
              <input
                type="date"
                value={eventStartDate}
                onChange={(e) => setEventStartDate(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-black/20 focus:border-black/40 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Start Time *
              </label>
              <input
                type="time"
                value={eventStartTime}
                onChange={(e) => setEventStartTime(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-black/20 focus:border-black/40 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* End Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                End Date *
              </label>
              <input
                type="date"
                value={eventEndDate}
                onChange={(e) => setEventEndDate(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-black/20 focus:border-black/40 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                End Time *
              </label>
              <input
                type="time"
                value={eventEndTime}
                onChange={(e) => setEventEndTime(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-black/20 focus:border-black/40 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Location
            </label>
            <input
              type="text"
              value={eventLocation}
              onChange={(e) => setEventLocation(e.target.value)}
              placeholder="e.g., Plaza Mayor, Vigan City"
              className="w-full px-4 py-2 rounded-lg border border-black/20 focus:border-black/40 focus:outline-none transition-colors"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-black/20 text-black font-medium hover:bg-black/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 rounded-lg bg-black text-white font-medium hover:bg-black/90 transition-colors disabled:opacity-60"
            >
              {isSubmitting ? 'Adding...' : 'Add Event'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default EventUploadModal;

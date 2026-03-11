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
  const [eventImages, setEventImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      const totalImages = eventImages.length + newFiles.length;

      if (totalImages > 10) {
        setError('Maximum 10 images allowed');
        return;
      }

      setError(null);
      setEventImages([...eventImages, ...newFiles]);

      // Create previews for new files
      newFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setEventImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

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

      // Upload images to Supabase storage
      const imageUrls: string[] = [];
      for (const file of eventImages) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `events/${user.id}/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('uploads')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('uploads')
          .getPublicUrl(uploadData.path);

        imageUrls.push(urlData.publicUrl);
      }

      const { error: insertError } = await supabase.from('events').insert({
        title: eventTitle,
        description: eventDescription,
        start_date: startDateTime.toISOString(),
        end_date: endDateTime.toISOString(),
        location: eventLocation,
        category: eventCategory,
        image_urls: imageUrls.length > 0 ? imageUrls : null,
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
      setEventImages([]);
      setImagePreviews([]);
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
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 px-4 py-4 sm:py-6 overflow-y-auto"
      role="presentation"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-secondary rounded-lg sm:rounded-xl lg:rounded-2xl p-4 sm:p-5 md:p-6 w-full max-w-xs sm:max-w-2xl max-h-[90vh] sm:max-h-[calc(100vh-120px)] overflow-y-auto hide-scrollbar my-4 sm:my-0"
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 sm:mb-6 gap-4">
          <h2 id="event-modal-title" className="text-lg sm:text-xl md:text-2xl font-semibold text-black">
            Add Event
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-black/60 hover:text-black text-xl sm:text-2xl flex-shrink-0"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 text-black">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm">
              {error}
            </div>
          )}

          {/* Event Title */}
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-1.5 text-black/80">
              Event Title *
            </label>
            <input
              type="text"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              placeholder="e.g., Vigan Festival, Local Fiesta"
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm rounded-lg border border-black/20 focus:border-black/40 focus:outline-none transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-1.5 text-black/80">
              Description
            </label>
            <textarea
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              placeholder="Describe the event, activities, and attractions..."
              rows={3}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm rounded-lg border border-black/20 focus:border-black/40 focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-1.5 text-black/80">
              Category
            </label>
            <select
              value={eventCategory}
              onChange={(e) => setEventCategory(e.target.value as any)}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm rounded-lg border border-black/20 focus:border-black/40 focus:outline-none transition-colors"
            >
              <option value="festival">Festival</option>
              <option value="cultural">Cultural Event</option>
              <option value="holiday">Holiday</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Start Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1.5 text-black/80">
                Start Date *
              </label>
              <input
                type="date"
                value={eventStartDate}
                onChange={(e) => setEventStartDate(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm rounded-lg border border-black/20 focus:border-black/40 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1.5 text-black/80">
                Start Time *
              </label>
              <input
                type="time"
                value={eventStartTime}
                onChange={(e) => setEventStartTime(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm rounded-lg border border-black/20 focus:border-black/40 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* End Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1.5 text-black/80">
                End Date *
              </label>
              <input
                type="date"
                value={eventEndDate}
                onChange={(e) => setEventEndDate(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm rounded-lg border border-black/20 focus:border-black/40 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1.5 text-black/80">
                End Time *
              </label>
              <input
                type="time"
                value={eventEndTime}
                onChange={(e) => setEventEndTime(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm rounded-lg border border-black/20 focus:border-black/40 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-1.5 text-black/80">
              Location
            </label>
            <input
              type="text"
              value={eventLocation}
              onChange={(e) => setEventLocation(e.target.value)}
              placeholder="e.g., Plaza Mayor, Vigan City"
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm rounded-lg border border-black/20 focus:border-black/40 focus:outline-none transition-colors"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-2 text-black/80">
              Event Images <span className="text-black/50 font-normal">(Optional, max 10)</span>
            </label>
            <div className="relative">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageSelect}
                disabled={eventImages.length >= 10}
                className="hidden"
                id="event-images"
              />
              <label
                htmlFor="event-images"
                className="flex flex-col items-center justify-center w-full px-3 sm:px-4 py-4 sm:py-6 rounded-lg border-2 border-dashed border-black/20 hover:border-black/40 transition-colors cursor-pointer bg-black/5"
              >
                <div className="text-2xl sm:text-3xl mb-2">📸</div>
                <p className="text-xs sm:text-sm font-medium text-black">Click to upload images</p>
                <p className="text-[11px] sm:text-xs text-black/60">PNG, JPG, GIF up to 10MB</p>
              </label>
            </div>

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="mt-3 sm:mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-20 sm:h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                    <p className="text-[10px] sm:text-xs text-black/60 mt-1 truncate">
                      {eventImages[index].name}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {eventImages.length > 0 && (
              <p className="text-xs text-black/60 mt-2">
                {eventImages.length} of 10 images selected
              </p>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border border-black/20 text-black text-xs sm:text-sm font-medium hover:bg-black/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-black text-white text-xs sm:text-sm font-medium hover:bg-black/90 transition-colors disabled:opacity-60"
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

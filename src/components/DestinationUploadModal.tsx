import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useLockBodyScroll } from '../lib/useLockBodyScroll';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthProvider';
import LocationPickerMap from './LocationPickerMap';
import type { LocationData } from '../lib/locationTypes';
import { toast } from 'sonner';

interface DestinationUploadModalProps {
  open: boolean;
  onClose: () => void;
  mode?: 'create' | 'edit';
  destinationId?: string;
  initialData?: {
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    imageUrls?: string[];
    location?: LocationData;
  } | null;
  onSuccess?: (updated?: {
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    imageUrls?: string[];
    location?: LocationData;
  }) => void;
}

const MAX_IMAGES = 20;
const STORAGE_BUCKET = 'uploads';

const uploadImages = async (files: File[], folder: string) => {
  const urls: string[] = [];

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const extension = file.name.split('.').pop() || 'jpg';
    const fileName = `${folder}/${crypto.randomUUID()}-${index}.${extension}`;

    const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

    if (error) {
      throw error;
    }

    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);
    urls.push(data.publicUrl);
  }

  return urls;
};

export const DestinationUploadModal: React.FC<DestinationUploadModalProps> = ({
  open,
  onClose,
  mode = 'create',
  destinationId,
  initialData,
  onSuccess,
}) => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const isMunicipalityUser = profile?.role === 'municipality';
  const isMunicipalityEditableMode = !isMunicipalityUser;
  const [destinationName, setDestinationName] = useState('');
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setDestinationName('');
      setLocationData(null);
      setDescription('');
      setFiles([]);
      setExistingImageUrls([]);
      setPreviews((prev) => {
        prev.forEach((url) => URL.revokeObjectURL(url));
        return [];
      });
      setError(null);
      setIsSubmitting(false);
      return;
    }

    if (mode === 'edit' && initialData) {
      setDestinationName(initialData.name ?? '');
      setDescription(initialData.description ?? '');
      setLocationData(initialData.location ?? null);
      setFiles([]);
      setExistingImageUrls(initialData.imageUrls ?? (initialData.imageUrl ? [initialData.imageUrl] : []));
      setPreviews((prev) => {
        prev.forEach((url) => URL.revokeObjectURL(url));
        return [];
      });
      setError(null);
      setIsSubmitting(false);
    } else if (isMunicipalityUser && mode === 'create') {
      // Reset form for municipality users creating a new destination
      setDestinationName('');
      setLocationData(null);
      setDescription('');
      setFiles([]);
      setExistingImageUrls([]);
      setPreviews((prev) => {
        prev.forEach((url) => URL.revokeObjectURL(url));
        return [];
      });
      setError(null);
      setIsSubmitting(false);
    }
  }, [initialData, mode, open, isMunicipalityUser, profile?.municipality_name]);

  useEffect(() => {
    return () => {
      setPreviews((prev) => {
        prev.forEach((url) => URL.revokeObjectURL(url));
        return prev;
      });
    };
  }, []);

  const previewCountLabel = useMemo(() => {
    if (previews.length === 0) return 'Upload up to 20 images.';
    return `${previews.length} of ${MAX_IMAGES} selected.`;
  }, [previews.length]);

  const handleLocationConfirmed = useCallback(
    (loc: LocationData) => {
      setLocationData(loc);
    },
    [],
  );

  const handleFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    if (selected.length === 0) return;

    setFiles((prevFiles) => {
      const remainingSlots = Math.max(MAX_IMAGES - prevFiles.length, 0);
      const nextFiles = [...prevFiles, ...selected.slice(0, remainingSlots)];
      return nextFiles;
    });

    setPreviews((prevPreviews) => {
      const remainingSlots = Math.max(MAX_IMAGES - prevPreviews.length, 0);
      const nextPreviews = [
        ...prevPreviews,
        ...selected.slice(0, remainingSlots).map((file) => URL.createObjectURL(file)),
      ];
      return nextPreviews;
    });

    event.currentTarget.value = '';
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (!destinationName.trim()) {
      setError('Destination name is required.');
      return;
    }

    if (!locationData?.barangay) {
      setError('Please select a barangay.');
      return;
    }

    if (!locationData?.municipality) {
      setError('Municipality is required.');
      return;
    }

    if (mode === 'create' && files.length === 0) {
      setError('Please select at least one image.');
      return;
    }

    if (mode === 'edit' && existingImageUrls.length === 0 && files.length === 0) {
      setError('Please keep at least one image.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const fallbackImageUrls = existingImageUrls;
      const imageUrls = files.length > 0
        ? [...fallbackImageUrls, ...(await uploadImages(files, `destinations/${destinationName.trim()}`))]
        : fallbackImageUrls;
      const basePayload = {
        destination_name: destinationName.trim(),
        description: description.trim() || null,
        image_url: imageUrls[0] ?? null,
        user_id: user?.id ?? null,
        municipality: locationData.municipality,
        barangay: locationData.barangay,
        latitude: locationData.lat,
        longitude: locationData.lng,
        address: locationData.address,
      };

      const payloadWithArray = {
        ...basePayload,
        image_urls: imageUrls,
      } as typeof basePayload & { image_urls?: string[] };

      if (mode === 'edit') {
        let { error: updateError } = await supabase
          .from('destinations')
          .update(payloadWithArray)
          .eq('id', destinationId ?? '')
          .eq('user_id', user?.id ?? '');

        if (updateError && updateError.message.includes('image_urls')) {
          const retry = await supabase
            .from('destinations')
            .update(basePayload)
            .eq('id', destinationId ?? '')
            .eq('user_id', user?.id ?? '');
          updateError = retry.error ?? null;
        }

        if (updateError) {
          throw updateError;
        }

        const updated = {
          name: basePayload.destination_name,
          description: basePayload.description,
          imageUrl: basePayload.image_url,
          imageUrls,
          location: {
            municipality: basePayload.municipality,
            barangay: basePayload.barangay,
            lat: basePayload.latitude,
            lng: basePayload.longitude,
            address: basePayload.address,
          } as LocationData,
        };

        toast.success('Destination updated successfully.');
        await queryClient.invalidateQueries({ queryKey: ['destinations'] });
        onSuccess?.(updated);
        onClose();
        return;
      }

      let { error: insertError } = await supabase.from('destinations').insert(payloadWithArray);

      if (insertError && insertError.message.includes('image_urls')) {
        const retry = await supabase.from('destinations').insert(basePayload);
        insertError = retry.error ?? null;
      }

      if (insertError) {
        throw insertError;
      }

      toast.success('Destination uploaded successfully.');
      await queryClient.invalidateQueries({ queryKey: ['destinations'] });
      onSuccess?.();
      onClose();
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : 'Upload failed. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // lock the document when the modal is open
  useLockBodyScroll(open);

  if (!open) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4 py-6 overflow-y-auto"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="glass-secondary text-black border border-black/20 rounded-lg sm:rounded-xl lg:rounded-2xl p-4 sm:p-5 md:p-6 w-full max-w-xs sm:max-w-2xl lg:max-w-4xl max-h-[calc(100vh-120px)] overflow-y-auto hide-scrollbar overscroll-contain touch-pan-y"
        role="dialog"
        aria-modal="true"
        aria-labelledby="destination-upload-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 sm:mb-6 gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold" id="destination-upload-title">Destination Upload</h2>
            <p className="text-xs sm:text-sm text-black/60 mt-1">{mode === 'edit' ? 'Update your uploaded destination.' : 'Add new destinations with visuals.'}</p>
          </div>
          <button
            type="button"
            className="text-black/60 hover:opacity-80 text-2xl sm:text-3xl flex-shrink-0"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <form className="flex flex-col gap-4 sm:gap-5 md:gap-6" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs sm:text-sm text-black/60">Destination name</label>
              <span className={`text-xs ${destinationName.length > 64 ? 'text-red-400' : 'text-black/50'}`}>
                {destinationName.length}/64
              </span>
            </div>
            <input
              type="text"
              value={destinationName}
              onChange={(event) => setDestinationName(event.target.value.slice(0, 64))}
              maxLength={64}
              placeholder="e.g. Sta. Maria Church"
              className="rounded-lg bg-white/10 border border-black/15 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-black placeholder:text-black/50 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>
          <div className="flex flex-col gap-2">
            {isMunicipalityUser && (
              <div className="flex flex-col gap-2 rounded-lg bg-white/5 border border-white/10 p-3 sm:p-4">
                <label className="text-xs sm:text-sm text-black/60">Municipality</label>
                <div className="rounded-lg bg-white/10 border border-black/15 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-black">
                  {profile?.municipality_name || 'N/A'}
                </div>
                <p className="text-xs text-black/50">Your municipality is pre-selected and cannot be changed.</p>
              </div>
            )}
            <label className="text-xs sm:text-sm text-black/60 mt-1">{isMunicipalityUser ? 'Select Location (Barangay)' : 'Location'}</label>
            <LocationPickerMap 
              onLocationConfirmed={handleLocationConfirmed}
              initialLocation={locationData} 
              hideIntro 
              defaultPinMapOpen={false} 
              isMunicipalityMode={isMunicipalityUser}
              fixedMunicipality={isMunicipalityUser ? profile?.municipality_name || null : null}
            />
            {locationData && (
              <p className="text-xs text-black/60">
                Location: {locationData.barangay ?? 'Unknown'}, {locationData.municipality ?? 'Unknown'}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs sm:text-sm text-black/60">Description</label>
              <span className={`text-xs ${description.length > 2200 ? 'text-red-400' : 'text-black/50'}`}>
                {description.length}/2,200
              </span>
            </div>
            <textarea
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value.slice(0, 2200))}
              maxLength={2200}
              placeholder="Describe the destination..."
              className="rounded-lg bg-white/10 border border-white/15 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-black placeholder:text-black/50 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="destination-upload-images" className="text-xs sm:text-sm text-black/60">Image upload</label>
            <input
              id="destination-upload-images"
              type="file"
              multiple
              accept="image/*"
              onChange={handleFilesChange}
              className="rounded-lg bg-black/5 border border-black/15 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-black file:mr-2 sm:file:mr-3 file:rounded-full file:border-0 file:bg-black/10 file:px-2 sm:file:px-3 file:py-1 file:text-xs file:text-black"
            />
            <p className="text-xs text-black/50">{previewCountLabel}</p>
          </div>
          {(existingImageUrls.length > 0 || previews.length > 0) && (
            <div>
              <p className="text-xs text-black/60 mb-2">Preview</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {existingImageUrls.map((src, index) => (
                  <div key={`existing-${src}-${index}`} className="relative aspect-square rounded-lg overflow-hidden border border-white/10 bg-white/10">
                    <img src={src} alt="Existing destination" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setExistingImageUrls((prev) => prev.filter((_, i) => i !== index))}
                      className="absolute top-1 right-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[9px] sm:text-[10px] text-white hover:bg-black/80"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {previews.map((src, index) => (
                  <div key={`new-${src}-${index}`} className="relative aspect-square rounded-lg overflow-hidden border border-white/10 bg-white/10">
                    <img src={src} alt="Selected destination" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setFiles((prev) => prev.filter((_, i) => i !== index));
                        setPreviews((prev) => {
                          const target = prev[index];
                          if (target) URL.revokeObjectURL(target);
                          return prev.filter((_, i) => i !== index);
                        });
                      }}
                      className="absolute top-1 right-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[9px] sm:text-[10px] text-white hover:bg-black/80"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {error && (
            <div className="text-xs sm:text-sm text-black bg-red-500/20 border border-red-200/30 rounded px-3 sm:px-4 py-2 sm:py-3">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-2 sm:gap-3 pt-2">
            <button
              type="button"
              className="text-xs sm:text-sm text-black/60 hover:opacity-80 px-3 sm:px-4 py-2"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-white/10 border border-white/20 px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold hover:bg-white/20 transition-colors disabled:opacity-60"
            >
              {isSubmitting ? (mode === 'edit' ? 'Updating...' : 'Uploading...') : (mode === 'edit' ? 'Update destination' : 'Upload destination')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

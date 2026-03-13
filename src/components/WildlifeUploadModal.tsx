import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useLockBodyScroll } from '../lib/useLockBodyScroll';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthProvider';
import { toast } from 'sonner';
import { X, Upload } from 'lucide-react';

interface WildlifeUploadModalProps {
  open: boolean;
  onClose: () => void;
  editingWildlife?: {
    id: string;
    species_name: string;
    description: string | null;
    conservation_status: string | null;
    image_url: string | null;
  };
}

const MAX_IMAGES = 10;
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

export const WildlifeUploadModal: React.FC<WildlifeUploadModalProps> = ({ open, onClose, editingWildlife }) => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [speciesName, setSpeciesName] = useState('');
  const [description, setDescription] = useState('');
  const [conservationStatus, setConservationStatus] = useState('Endangered');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useLockBodyScroll(open);

  useEffect(() => {
    if (!open) {
      setSpeciesName('');
      setDescription('');
      setConservationStatus('Endangered');
      setFiles([]);
      setPreviews([]);
      setError(null);
    } else if (editingWildlife) {
      setSpeciesName(editingWildlife.species_name);
      setDescription(editingWildlife.description || '');
      setConservationStatus(editingWildlife.conservation_status || 'Endangered');
      setFiles([]);
      setPreviews(editingWildlife.image_url ? [editingWildlife.image_url] : []);
      setError(null);
    }
  }, [open, editingWildlife]);

  useEffect(() => {
    const newPreviews: string[] = [];
    const readers: FileReader[] = [];

    files.forEach((file, index) => {
      const reader = new FileReader();
      readers.push(reader);

      reader.onload = () => {
        newPreviews[index] = reader.result as string;
        if (newPreviews.filter(Boolean).length === files.length) {
          setPreviews(newPreviews);
        }
      };

      reader.readAsDataURL(file);
    });

    return () => {
      readers.forEach((reader) => {
        if (reader.abort) reader.abort();
      });
    };
  }, [files]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.currentTarget.files;
    if (!selectedFiles) return;

    const newFiles = Array.from(selectedFiles);
    const totalFiles = files.length + newFiles.length;

    if (totalFiles > MAX_IMAGES) {
      setError(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    

  const isEditMode = !!editingWildlife;setError(null);
    setFiles([...files, ...newFiles]);
  };

  const handleRemoveImage = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!speciesName.trim()) {
      setError('Species name is required');
      return;
    }

    if (!description.trim()) {
      setError('Description is required');
      return;
    }

    if (!isEditMode && files.length === 0) {
      setError('At least one image is required');
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrls = previews.filter(p => !p.startsWith('http') || p.includes('http'));
      
      // Upload new images if any
      if (files.length > 0) {
        imageUrls = await uploadImages(files, `wildlife/${profile?.id}`);
      }

      if (isEditMode && editingWildlife) {
        // Update existing wildlife
        const { error: updateError } = await supabase
          .from('endangered_wildlife')
          .update({
            species_name: speciesName,
            description,
            conservation_status: conservationStatus,
            ...(imageUrls.length > 0 && {
              image_url: imageUrls[0],
              image_urls: imageUrls,
            }),
          })
          .eq('id', editingWildlife.id);

        if (updateError) throw updateError;

        toast.success('Wildlife updated successfully!');
        // Invalidate all relevant caches
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['dashboard-wildlife'], exact: false }),
          queryClient.invalidateQueries({ queryKey: ['wildlife', 'approved'], exact: false }),
          queryClient.invalidateQueries({ queryKey: ['search-wildlife'], exact: false }),
          queryClient.invalidateQueries({ queryKey: ['homepage-search-wildlife'], exact: false }),
        ]);
      } else {
        // Insert new wildlife record
        const { data, error: insertError } = await supabase
          .from('endangered_wildlife')
          .insert({
            species_name: speciesName,
            description,
            conservation_status: conservationStatus,
            image_url: imageUrls[0],
            image_urls: imageUrls,
            municipality_id: profile?.id,
            approval_status: 'pending',
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Create notification for admin
        await supabase.from('notifications').insert({
          type: 'wildlife_upload',
          user_id: profile?.id,
          title: `New Wildlife Upload: ${speciesName}`,
          message: `${profile?.full_name} uploaded a new endangered species: ${speciesName}`,
          related_id: data.id,
          is_read: false,
          created_at: new Date().toISOString(),
        });

        // Create notification for municipality
        await supabase.from('notifications').insert({
          type: 'wildlife_submitted',
          user_id: profile?.id,
          title: 'Wildlife Upload Submitted',
          message: `Your wildlife upload "${speciesName}" is pending admin approval.`,
          related_id: data.id,
          is_read: false,
          created_at: new Date().toISOString(),
        });

        toast.success('Wildlife uploaded successfully! Awaiting admin approval.');
        // Invalidate all relevant caches
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['dashboard-wildlife'], exact: false }),
          queryClient.invalidateQueries({ queryKey: ['wildlife', 'approved'], exact: false }),
          queryClient.invalidateQueries({ queryKey: ['search-wildlife'], exact: false }),
          queryClient.invalidateQueries({ queryKey: ['homepage-search-wildlife'], exact: false }),
        ]);
      }

      onClose();
    } catch (err) {
      console.error('Error saving wildlife:', err);
      setError(`Failed to ${isEditMode ? 'update' : 'upload'} wildlife. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-black">
            {isEditMode ? 'Edit Endangered Species' : 'Upload Endangered Species'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-black/60 hover:text-black transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Species Name */}
          <div>
            <label className="block text-sm font-semibold text-black mb-2">Species Name *</label>
            <input
              type="text"
              value={speciesName}
              onChange={(e) => setSpeciesName(e.target.value)}
              placeholder="e.g., Philippine Eagle"
              className="w-full px-3 py-2 border border-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
              disabled={isSubmitting}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-black mb-2">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the species, its habitat, threats, and conservation status..."
              rows={5}
              className="w-full px-3 py-2 border border-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-black resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Conservation Status */}
          <div>
            <label className="block text-sm font-semibold text-black mb-2">Conservation Status *</label>
            <select
              value={conservationStatus}
              onChange={(e) => setConservationStatus(e.target.value)}
              className="w-full px-3 py-2 border border-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-black bg-white"
              disabled={isSubmitting}
            >
              <option value="Critically Endangered">Critically Endangered</option>
              <option value="Endangered">Endangered</option>
              <option value="Vulnerable">Vulnerable</option>
              <option value="Near Threatened">Near Threatened</option>
            </select>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-semibold text-black mb-2">Images ({files.length}/{MAX_IMAGES})</label>
            <div className="border-2 border-dashed border-black/20 rounded-lg p-6 text-center cursor-pointer hover:border-green-500 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="wildlife-file-input"
                disabled={isSubmitting || files.length >= MAX_IMAGES}
              />
              <label htmlFor="wildlife-file-input" className="cursor-pointer">
                <Upload className="h-8 w-8 text-black/40 mx-auto mb-2" />
                <p className="text-sm font-medium text-black">Click to upload or drag and drop</p>
                <p className="text-xs text-black/60">PNG, JPG, GIF up to 10MB</p>
              </label>
            </div>

            {/* Image Previews */}
            {previews.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                {previews.map((preview, index) => (
                  <div key={index} className="relative group rounded-lg overflow-hidden bg-black/5">
                    <img src={preview} alt={`Preview ${index}`} className="w-full h-32 object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    >
                      <X className="h-6 w-6 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-medium text-black border border-black/20 hover:bg-black/5 transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg font-medium text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Uploading...' : 'Submit for Approval'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

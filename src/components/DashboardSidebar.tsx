import React, { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthProvider';
import { toast } from 'sonner';

interface DashboardSidebarProps {
  displayName: string;
  battleCry: string;
  description?: string | null;
  imgUrl?: string | null;
  userId?: string | null;
  fullName?: string | null;
  onOpenProductUpload: () => void;
  onOpenDestinationUpload: () => void;
  onOpenEventUpload: () => void;
  onOpenWildlifeUpload: () => void;
  onJumpToSection?: (sectionId: string) => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  displayName,
  battleCry,
  description,
  imgUrl,
  userId,
  fullName,
  onOpenProductUpload,
  onOpenDestinationUpload,
  onOpenEventUpload,
  onOpenWildlifeUpload,
  onJumpToSection,
}) => {
    const handleSectionJump = (sectionId: string) => {
      if (!onJumpToSection) return;
      setIsSidebarOpen(false);
      onJumpToSection(sectionId);
    };

  const { refreshProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(fullName || displayName);
  const [battleInput, setBattleInput] = useState(battleCry);
  const [descriptionInput, setDescriptionInput] = useState(description || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const profileCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isEditing) {
      setNameInput(fullName || displayName);
      setBattleInput(battleCry);
      setDescriptionInput(description || '');
    }
  }, [battleCry, description, displayName, fullName, isEditing]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!isEditing) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (profileCardRef.current && !profileCardRef.current.contains(event.target as Node)) {
        setIsEditing(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEditing]);

  useEffect(() => {
    if (!isSidebarOpen) return;
    let lastScrollY = window.scrollY;
    
    const handleOutsideClick = (event: MouseEvent) => {
      const sidebar = document.getElementById('dashboard-sidebar');
      if (sidebar && !sidebar.contains(event.target as Node)) {
        setIsSidebarOpen(false);
      }
    };
    
    const handleScroll = () => {
      // Only close sidebar on mobile when the main body scrolls
      // On desktop (lg+), this scroll listener is not relevant since sidebar is sticky
      const isDesktop = window.innerWidth >= 1024; // lg breakpoint
      if (isDesktop) return;
      
      // Only close sidebar if the main body/window actually scrolled (scrollY changed)
      // This prevents closing when scrolling inside the sidebar's own scrollable content
      if (window.scrollY !== lastScrollY) {
        lastScrollY = window.scrollY;
        setIsSidebarOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isSidebarOpen]);

  const displayAvatar = useMemo(() => {
    if (previewUrl) return previewUrl;
    return imgUrl || null;
  }, [imgUrl, previewUrl]);

  const handleSelectAvatar = () => {
    if (!isEditing) return;
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    event.currentTarget.value = '';
  };

  const handleUpdate = async () => {
    if (!userId) {
      setError('Missing user id. Please re-login.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      let avatarUrl = imgUrl ?? null;
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop() || 'jpg';
        const filePath = `profiles/${userId}/${crypto.randomUUID()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('uploads')
          .upload(filePath, selectedFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('uploads').getPublicUrl(filePath);
        avatarUrl = data.publicUrl;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: nameInput.trim() || null,
          battle_cry: battleInput.trim() || null,
          description: descriptionInput.trim() || null,
          img_url: avatarUrl,
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      setIsEditing(false);
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      await refreshProfile();
      toast.success('Profile updated successfully.');
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : 'Failed to update profile.';
      setError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <>
      {!isSidebarOpen && (
        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          className="lg:hidden fixed left-0 top-1/2 -translate-y-1/2 z-50 h-14 w-7 rounded-r-full glass-button border border-border text-black hover:text-black/80 flex items-center justify-center"
          aria-label="Open sidebar"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}
      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-30" aria-hidden="true" />
      )}
      <aside
        id="dashboard-sidebar"
        className={`lg:w-80 w-64 sm:w-72 lg:static lg:translate-x-0 fixed left-0 top-0 bottom-0 z-40 transition-transform duration-300 lg:sticky lg:top-24 lg:self-start ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="glass-secondary border border-border rounded-2xl lg:rounded-2xl rounded-l-none mt-10 sm:mt-24 lg:mt-0 p-3 sm:p-4 md:p-5 h-screen lg:h-[calc(80vh-6rem)] overflow-y-auto hide-scrollbar flex flex-col relative text-black">
          <div ref={profileCardRef} className="mt-1 glass-secondary border border-border rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 md:p-5 relative flex-shrink-0">
            <div className="flex flex-col items-center text-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <button
                type="button"
                onClick={handleSelectAvatar}
                disabled={!isEditing}
                className={`h-24 sm:h-28 md:h-32 lg:h-36 w-24 sm:w-28 md:w-32 lg:w-36 rounded-full border-2 border-border bg-card/60 overflow-hidden flex items-center justify-center relative flex-shrink-0 ${
                  isEditing ? 'group cursor-pointer hover:opacity-80' : 'cursor-default'
                } transition-opacity`}
              >
                {displayAvatar ? (
                  <img src={displayAvatar} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs sm:text-sm font-semibold text-black/70">Profile</span>
                )}
                {isEditing && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg
                      className="h-5 w-5 sm:h-6 sm:w-6 text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </span>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <button
              type="button"
              onClick={() => setIsEditing((prev) => !prev)}
              className="absolute top-3 right-3 text-black/70 hover:text-black text-lg"
              aria-label="Edit profile"
            >
              ✎
            </button>
            {!isEditing ? (
              <div>
                <p className="text-xs sm:text-sm font-semibold line-clamp-2">{displayName}</p>
                <p className="text-xs text-black/70 mt-1 line-clamp-2">{battleCry}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 sm:gap-3">
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-xs text-black/70">Name</label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={nameInput}
                    onChange={(event) => setNameInput(event.target.value)}
                    className="rounded-lg bg-background/70 border border-border px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-xs text-black/70">About your municipality</label>
                  <input
                    type="text"
                    placeholder="Tell us about your municipality"
                    value={battleInput}
                    onChange={(event) => setBattleInput(event.target.value)}
                    className="rounded-lg bg-background/70 border border-border px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-xs text-black/70">Description <span className="text-black/50 font-normal">({descriptionInput.length}/2200)</span></label>
                  <textarea
                    placeholder="Tell us more about your municipality..."
                    value={descriptionInput}
                    onChange={(event) => {
                      if (event.target.value.length <= 2200) {
                        setDescriptionInput(event.target.value);
                      }
                    }}
                    rows={4}
                    className="rounded-lg bg-background/70 border border-border px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>
                {error && (
                  <div className="text-xs text-black bg-red-500/20 border border-red-200/30 rounded px-3 py-2">
                    {error}
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={isSaving}
                  className="rounded-full glass-button border border-border px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition-colors disabled:opacity-60"
                >
                  {isSaving ? 'Updating...' : 'Update Profile'}
                </button>
              </div>
            )}
          </div>

          <div className="mt-3 sm:mt-4 md:mt-6 flex-1 min-h-0">
            <p className="text-[10px] sm:text-xs md:text-sm uppercase tracking-[0.15em] text-black/70 font-semibold">Dashboard</p>
            <nav className=" mt-2 sm:mt-3 md:mt-4 flex flex-col gap-1 sm:gap-2 text-xs sm:text-sm md:text-base">
              <button
                type="button"
                onClick={() => handleSectionJump('analytics-overview')}
                className="text-left text-[#1A1A1A]/80 hover:text-[#1A1A1A] transition-colors truncate"
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => handleSectionJump('products')}
                className="text-left text-[#1A1A1A]/80 hover:text-[#1A1A1A] transition-colors truncate"
              >
                Products
              </button>
              <button
                type="button"
                onClick={() => handleSectionJump('destinations')}
                className="text-left text-[#1A1A1A]/80 hover:text-[#1A1A1A] transition-colors truncate"
              >
                Destinations
              </button>
              <button
                type="button"
                onClick={() => handleSectionJump('wildlife-section')}
                className="text-left text-[#1A1A1A]/80 hover:text-[#1A1A1A] transition-colors truncate"
              >
                Wildlife
              </button>
            </nav>

            <div className="mt-2 sm:mt-3 md:mt-4 border-t border-border pt-2 sm:pt-3 md:pt-4 flex flex-col gap-1.5 sm:gap-2 md:gap-3">
              <button
                type="button"
                className="rounded-full glass-button border border-border px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 text-xs sm:text-sm md:text-base font-semibold transition-colors hover:bg-black/5 w-full"
                onClick={onOpenProductUpload}
              >
                Upload Product
              </button>
              <button
                type="button"
                className="rounded-full glass-button border border-border px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 text-xs sm:text-sm md:text-base font-semibold transition-colors hover:bg-black/5 w-full"
                onClick={onOpenDestinationUpload}
              >
                Upload Destination
              </button>
              <button
                type="button"
                className="rounded-full glass-button border border-border px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 text-xs sm:text-sm md:text-base font-semibold transition-colors hover:bg-black/5 w-full"
                onClick={onOpenEventUpload}
              >
                Add Event
              </button>
              <button
                type="button"
                className="rounded-full glass-button border border-border px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 text-xs sm:text-sm md:text-base font-semibold transition-colors hover:bg-black/5 w-full"
                onClick={onOpenWildlifeUpload}
              >
                Upload Wildlife
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

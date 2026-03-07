import React, { useEffect, useRef, useState } from 'react';

interface GlassSelectOption {
  value: string;
  label: string;
}

interface GlassSelectProps {
  value: string;
  onChange: (next: string) => void;
  options: GlassSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  emptyText?: string;
}

export const GlassSelect: React.FC<GlassSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  disabled = false,
  loading = false,
  loadingText = 'Loading...',
  emptyText = 'No options',
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = options.find((opt) => opt.value === value)?.label;
  const displayLabel = selectedLabel || placeholder;
  const showEmpty = !loading && options.length === 0;

  const toggleOpen = () => {
    if (disabled) return;
    setOpen((prev) => !prev);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={toggleOpen}
        disabled={disabled}
        className="w-full rounded-lg bg-[#EEEEEE] backdrop-blur-md border border-[#1A1A1A]/15 px-4 py-2 text-sm text-left flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 disabled:opacity-50 text-black"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={selectedLabel ? 'text-black' : 'text-black/60'}>{displayLabel}</span>
        <span className="text-black/60">▾</span>
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-full rounded-lg border border-[#1A1A1A]/15 bg-[#FFFFFF]/95 backdrop-blur-xl shadow-lg max-h-56 overflow-y-auto text-sm">
          {loading ? (
            <div className="px-4 py-2 text-black/70">{loadingText}</div>
          ) : showEmpty ? (
            <div className="px-4 py-2 text-black/10">{emptyText}</div>
          ) : (
            options.map((opt) => (
              <button
                type="button"
                key={opt.value}
                className={`w-full text-left px-4 py-2 hover:bg-[#1A1A1A]/10 transition-colors ${
                  value === opt.value ? 'bg-black/10 text-black' : 'text-black'
                }`}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                {opt.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

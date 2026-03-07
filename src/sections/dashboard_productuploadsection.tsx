import React from 'react';

export const DashboardProductUploadSection: React.FC = () => {
  return (
    <section className="mt-10 rounded-2xl bg-[#1A1A1A]/5 border border-[#1A1A1A]/10 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-black">Product Upload</h2>
          <p className="text-sm text-black/60">Add new products tied to destinations.</p>
        </div>
      </div>
      <form className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className="text-sm text-black/70">Product name</label>
          <input
            type="text"
            placeholder="Ilocos Souvenir Bundle"
            className="rounded-lg bg-[#EEEEEE] border border-[#1A1A1A]/15 px-4 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm text-black/70">Destination name</label>
          <input
            type="text"
            placeholder="Vigan Heritage"
            className="rounded-lg bg-[#EEEEEE] border border-[#1A1A1A]/15 px-4 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30"
          />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <label className="text-sm text-black/70">Description</label>
          <textarea
            rows={3}
            placeholder="Describe the product..."
            className="rounded-lg bg-[#EEEEEE] border border-[#1A1A1A]/15 px-4 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm text-black/70">Image upload</label>
          <input
            type="file"
            accept="image/*"
            className="rounded-lg bg-[#EEEEEE] border border-[#1A1A1A]/15 px-4 py-2 text-sm text-black file:mr-3 file:rounded-full file:border-0 file:bg-[#0D9488] file:px-3 file:py-1 file:text-xs file:text-[#FFFFFF]"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm text-black/70">Image URL</label>
          <input
            type="url"
            placeholder="https://..."
            className="rounded-lg bg-[#EEEEEE] border border-[#1A1A1A]/15 px-4 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm text-black/70">Created at</label>
          <input
            type="datetime-local"
            className="rounded-lg bg-[#EEEEEE] border border-[#1A1A1A]/15 px-4 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm text-black/70">Last updated</label>
          <input
            type="datetime-local"
            className="rounded-lg bg-[#EEEEEE] border border-[#1A1A1A]/15 px-4 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30"
          />
        </div>
        <div className="sm:col-span-2 flex justify-end">
          <button
            type="button"
            className="rounded-full bg-[#0D9488] border border-[#0D9488] px-5 py-2 text-sm font-semibold text-[#FFFFFF] hover:bg-[#0D9488]/90 transition-colors"
          >
            Upload product
          </button>
        </div>
      </form>
    </section>
  );
};

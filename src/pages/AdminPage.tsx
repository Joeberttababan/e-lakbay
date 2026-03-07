import React, { useState } from 'react';
import { Users, BarChart3 } from 'lucide-react';
import { ProfilesTab, AnalyticsTab } from '../components/admin';

type TabType = 'profiles' | 'analytics';

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('profiles');

  return (
    <main className="min-h-screen bg-[#F8F8F8] text-black px-6 pt-18 md:pt-24 pb-8">
      <div className="relative left-1/2 w-screen -ml-[50vw] p-1 md:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-black">Admin</p>
        <h1 className="mt-3 text-3xl sm:text-4xl font-semibold">Developer Console</h1>

        {/* Main Tabs */}
        <div className="mt-6 flex gap-2 border-b border-[#1A1A1A]/10">
          <button
            type="button"
            onClick={() => setActiveTab('profiles')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'profiles'
                ? 'text-[#1A1A1A] border-b-2 border-[#1A1A1A]'
                : 'text-[#1A1A1A]/60 hover:text-[#1A1A1A]'
            }`}
          >
            <Users className="h-4 w-4" />
            Profiles
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'analytics'
                ? 'text-[#1A1A1A] border-b-2 border-[#1A1A1A]'
                : 'text-[#1A1A1A]/60 hover:text-[#1A1A1A]'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'profiles' && <ProfilesTab />}
        {activeTab === 'analytics' && <AnalyticsTab />}
      </div>
    </main>
  );
};

export default AdminPage;

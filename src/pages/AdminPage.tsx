import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users, BarChart3, Calendar, Leaf } from 'lucide-react';
import { ProfilesTab, AnalyticsTab, EventsTab, WildlifeAdminTab, VisitorAnalyticsDashboard } from '../components/admin';

type TabType = 'profiles' | 'analytics' | 'events' | 'wildlife';

const AdminPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as TabType | null;
  const [activeTab, setActiveTab] = useState<TabType>(tabParam || 'analytics');

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  return (
    <main className="min-h-screen bg-[#F8F8F8] text-black px-6 pt-18 md:pt-24 pb-8">
      <div className="relative left-1/2 w-screen -ml-[50vw] p-1 md:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-black">Admin</p>
        <h1 className="mt-3 text-3xl sm:text-4xl font-semibold">Developer Console</h1>

        {/* Main Tabs */}
        <div className="mt-6 flex gap-2 border-b border-[#1A1A1A]/10 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'text-[#1A1A1A] border-b-2 border-[#1A1A1A]'
                : 'text-[#1A1A1A]/60 hover:text-[#1A1A1A]'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('profiles')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
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
            onClick={() => setActiveTab('events')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'events'
                ? 'text-[#1A1A1A] border-b-2 border-[#1A1A1A]'
                : 'text-[#1A1A1A]/60 hover:text-[#1A1A1A]'
            }`}
          >
            <Calendar className="h-4 w-4" />
            Events
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('wildlife')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'wildlife'
                ? 'text-[#1A1A1A] border-b-2 border-[#1A1A1A]'
                : 'text-[#1A1A1A]/60 hover:text-[#1A1A1A]'
            }`}
          >
            <Leaf className="h-4 w-4" />
            Wildlife
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Visitor Analytics</h2>
              <VisitorAnalyticsDashboard />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-4">Analytics Overview</h2>
              <AnalyticsTab />
            </div>
          </div>
        )}
        {activeTab === 'profiles' && <ProfilesTab />}
        {activeTab === 'events' && <EventsTab />}
        {activeTab === 'wildlife' && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Wildlife Conservation Submissions</h2>
            <WildlifeAdminTab />
          </div>
        )}
      </div>
    </main>
  );
};

export default AdminPage;

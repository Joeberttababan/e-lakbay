import React from 'react';
import { VisitorAnalyticsDashboard } from '../components/admin';

const AnalyticsPage: React.FC = () => {
  return (
    <main className="min-h-screen bg-[#F8F8F8] text-black px-6 pt-18 md:pt-24 pb-8">
      <div className="relative left-1/2 w-screen -ml-[50vw] p-1 md:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-black">Analytics</p>
        <h1 className="mt-3 text-3xl sm:text-4xl font-semibold">Visitor Analytics</h1>
        <p className="mt-2 text-black/60">Track and analyze website traffic and visitor behavior</p>

        <div className="mt-8">
          <VisitorAnalyticsDashboard />
        </div>
      </div>
    </main>
  );
};

export default AnalyticsPage;

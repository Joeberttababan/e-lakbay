import React from 'react';
import { VisitorAnalyticsDashboard } from '../components/admin';

const AnalyticsPage: React.FC = () => {
  return (
    <main className="min-h-screen bg-[#F8F8F8] text-black px-6 pt-18 md:pt-24 pb-8">
      <div className="relative left-1/2 w-screen -ml-[50vw] p-1 md:p-8">
        <div className="mt-8">
          <VisitorAnalyticsDashboard />
        </div>
      </div>
    </main>
  );
};

export default AnalyticsPage;

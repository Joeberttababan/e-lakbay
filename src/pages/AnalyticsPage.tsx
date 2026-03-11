import React from 'react';
import { useNavigate } from 'react-router-dom';
import { VisitorAnalyticsDashboard } from '../components/admin';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../components/modern-ui/breadcrumb';

const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-[#F8F8F8] text-black px-6 pt-18 md:pt-24 pb-8">
      <div className="relative left-1/2 w-screen -ml-[50vw] p-1 md:p-8">
        {/* Breadcrumb */}
        <div className="flex justify-start mb-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    navigate('/');
                  }}
                >
                  Home
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Analytics</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="mt-8">
          <VisitorAnalyticsDashboard />
        </div>
      </div>
    </main>
  );
};

export default AnalyticsPage;

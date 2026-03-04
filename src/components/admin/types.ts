export type AdminProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  battle_cry: string | null;
  created_at: string | null;
};

export type DateFilter = '7' | '30' | '90' | 'all';
export type ContentTab = 'destinations' | 'products';

export type MunicipalityStats = {
  municipality: string;
  visits: number;
  queries: number;
  profileVisits: number;
  ratingCount: number;
  avgRating: number;
};

export type DailyTouristData = {
  date: string;
  count: number;
};

export type AnalyticsData = {
  totalVisits: number;
  totalQueries: number;
  totalRatings: number;
  avgRating: number;
  municipalityStats: MunicipalityStats[];
  dailyTourists: DailyTouristData[];
};

export const ROLE_OPTIONS = ['tourist', 'municipality', 'developer'] as const;
export type RoleOption = (typeof ROLE_OPTIONS)[number];

export const getDateCutoff = (filter: DateFilter): Date | null => {
  if (filter === 'all') return null;
  const days = parseInt(filter, 10);
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const formatDateLabel = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Generate array of dates from today going back N days
export const generateDateRange = (filter: DateFilter): string[] => {
  if (filter === 'all') return [];
  
  const days = parseInt(filter, 10);
  const dates: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
};

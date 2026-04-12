import { format, getDay, getDate, startOfMonth, addDays } from 'date-fns';

export interface ChurchService {
  name: string;
  time: string;
  day: string;
  description?: string;
  theme?: string;
}

export const getSundayOccurrence = (date: Date): number => {
  const dayOfMonth = getDate(date);
  return Math.ceil(dayOfMonth / 7);
};

export const getSundayTheme = (date: Date): string | null => {
  if (getDay(date) !== 0) return null; // Not a Sunday
  
  const occurrence = getSundayOccurrence(date);
  switch (occurrence) {
    case 1: return "Thanksgiving Sunday";
    case 2: return "Youth Sunday";
    case 3: return "Choir Sunday";
    case 4: return "Workers Sunday";
    default: return null;
  }
};

export const getTodayServices = (date: Date = new Date()): ChurchService[] => {
  const dayName = format(date, 'EEEE');
  const services: ChurchService[] = [];
  const sundayTheme = getSundayTheme(date);

  // Sunday Services
  if (dayName === 'Sunday') {
    services.push({
      name: "English Service One",
      time: "7:00 AM - 9:00 AM",
      day: "Sunday",
      theme: sundayTheme || undefined
    });
    services.push({
      name: "English Service Two",
      time: "9:00 AM - 11:00 AM",
      day: "Sunday",
      theme: sundayTheme || undefined
    });
    services.push({
      name: "Local Language Service",
      time: "11:00 AM - 1:00 PM",
      day: "Sunday",
      theme: sundayTheme || undefined
    });
    services.push({
      name: "Fellowship",
      time: "3:00 PM - 5:00 PM",
      day: "Sunday"
    });
  }

  // Wednesday Fellowship
  if (dayName === 'Wednesday') {
    services.push({
      name: "Fellowship",
      time: "3:00 PM - 5:00 PM",
      day: "Wednesday"
    });
  }

  // Morning Glory
  if (dayName === 'Tuesday') {
    services.push({
      name: "Morning Glory",
      time: "6:40 AM - 8:00 AM",
      day: "Tuesday",
      description: "With Holy Communion, Guidance, and Counseling after service"
    });
  }
  if (dayName === 'Friday') {
    services.push({
      name: "Morning Glory",
      time: "6:40 AM - 8:00 AM",
      day: "Friday"
    });
  }

  return services;
};

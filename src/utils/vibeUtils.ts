import { format, isSunday, isSameDay } from 'date-fns';

export type VibeType = 'default' | 'sunday' | 'easter' | 'palm-sunday' | 'independence' | 'womens-day' | 'christmas' | 'new-year';

interface VibeProfile {
  type: VibeType;
  greeting: string;
  subGreeting: string;
  primaryColor: string;
  accentColor: string;
  gradient: string;
  icon: string;
  badge?: string;
  message: string;
}

export const getVibe = (date: Date): VibeProfile => {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayName = format(date, 'EEEE');

  // 1. Fixed Date Holidays
  
  // New Year (Jan 1)
  if (month === 1 && day === 1) {
    return {
      type: 'new-year',
      greeting: 'Happy New Year!',
      subGreeting: 'A Season of New Beginnings',
      primaryColor: 'text-amber-500',
      accentColor: 'bg-amber-500',
      gradient: 'from-amber-400 via-yellow-300 to-amber-500',
      icon: '✨',
      badge: '🎊 2026',
      message: 'May this year bring you closer to your divine purpose and fill your life with God\'s unending favor.'
    };
  }

  // Women's Day (Mar 8)
  if (month === 3 && day === 8) {
    return {
      type: 'womens-day',
      greeting: 'Happy Women\'s Day',
      subGreeting: 'Celebrating Strength & Grace',
      primaryColor: 'text-purple-600',
      accentColor: 'bg-purple-600',
      gradient: 'from-purple-500 via-pink-400 to-purple-600',
      icon: '🌸',
      badge: '👩‍🦰 Empowered',
      message: 'Today we celebrate the virtuous women who lead with love, serve with grace, and inspire us all.'
    };
  }

  // Uganda Independence (Oct 9)
  if (month === 10 && day === 9) {
    return {
      type: 'independence',
      greeting: 'Happy Independence Day',
      subGreeting: 'For God and My Country',
      primaryColor: 'text-red-600',
      accentColor: 'bg-yellow-500',
      gradient: 'from-black via-yellow-500 to-red-600',
      icon: '🇺🇬',
      badge: '🦅 Independent',
      message: 'United in prayer and purpose, we celebrate the freedom and heritage of our beautiful nation, Uganda.'
    };
  }

  // Christmas (Dec 25)
  if (month === 12 && day === 25) {
    return {
      type: 'christmas',
      greeting: 'Merry Christmas!',
      subGreeting: 'Celebrating the Birth of Christ',
      primaryColor: 'text-red-600',
      accentColor: 'bg-emerald-600',
      gradient: 'from-red-600 via-emerald-500 to-red-700',
      icon: '🎄',
      badge: '🎁 Joyful',
      message: 'Unto us a child is born, unto us a son is given. May the peace of Christ rule in your hearts this season.'
    };
  }

  // 2. Movable Holidays (Approximate for now, or can be improved with a library)
  // For Easter 2026: April 5
  // For Palm Sunday 2026: March 29
  
  const easter2026 = new Date(2026, 3, 5); // April 5
  const palmSunday2026 = new Date(2026, 2, 29); // March 29

  if (isSameDay(date, easter2026)) {
    return {
      type: 'easter',
      greeting: 'He is Risen!',
      subGreeting: 'Happy Easter Sunday',
      primaryColor: 'text-purple-700',
      accentColor: 'bg-yellow-400',
      gradient: 'from-purple-600 via-white to-yellow-400',
      icon: '🌅',
      badge: '✝️ Risen',
      message: 'Death could not hold Him! We celebrate the victory of the cross and the hope of eternal life.'
    };
  }

  if (isSameDay(date, palmSunday2026)) {
    return {
      type: 'palm-sunday',
      greeting: 'Hosanna!',
      subGreeting: 'Blessed is He who comes',
      primaryColor: 'text-emerald-700',
      accentColor: 'bg-emerald-500',
      gradient: 'from-emerald-600 via-green-400 to-emerald-700',
      icon: '🌿',
      badge: '🌴 Hosanna',
      message: 'Join us as we welcome the King of Kings with palm branches and songs of praise.'
    };
  }

  // 3. Weekly Vibes
  if (isSunday(date)) {
    return {
      type: 'sunday',
      greeting: 'Blessed Sunday',
      subGreeting: 'Welcome to the Sanctuary',
      primaryColor: 'text-primary',
      accentColor: 'bg-accent',
      gradient: 'from-primary via-purple-600 to-indigo-700',
      icon: '⛪',
      badge: '🙏 Sacred',
      message: 'It is a beautiful day to worship in the house of the Lord. We are glad you are here with us.'
    };
  }

  // Default Vibe
  return {
    type: 'default',
    greeting: 'Heavenly Greetings',
    subGreeting: 'Blessed & Highly Favored',
    primaryColor: 'text-primary',
    accentColor: 'bg-accent',
    gradient: 'from-primary via-purple-500 to-accent',
    icon: '👋',
    badge: '✨ Grace',
    message: 'Stay connected with your church family and grow in faith every single day.'
  };
};

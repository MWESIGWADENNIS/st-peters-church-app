import { format, isSunday, isSameDay } from 'date-fns';

export type VibeType = 'default' | 'sunday' | 'tuesday' | 'wednesday' | 'friday' | 'easter' | 'palm-sunday' | 'independence' | 'womens-day' | 'christmas' | 'new-year';

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
  
  // Sunday Service
  if (isSunday(date)) {
    return {
      type: 'sunday',
      greeting: 'Glory to God!',
      subGreeting: 'The Lord\'s Day Celebration',
      primaryColor: 'text-primary',
      accentColor: 'bg-primary',
      gradient: 'from-accent via-white to-accent/50',
      icon: '✨',
      badge: '⛪ Sunday Service',
      message: 'It is a beautiful morning to worship. Join the congregation in praise and thanksgiving!'
    };
  }

  // Tuesday: Holy Communion
  if (dayName === 'Tuesday') {
    return {
      type: 'tuesday',
      greeting: 'Holy Communion',
      subGreeting: 'At the Lord\'s Table',
      primaryColor: 'text-red-700',
      accentColor: 'bg-red-500',
      gradient: 'from-red-700 via-rose-500 to-red-800',
      icon: '🍷',
      badge: '🍞 Communion',
      message: 'Today we gather for Holy Communion. Let us remember Christ\'s sacrifice and renew our covenant with Him.'
    };
  }

  // Wednesday: Fellowship Night
  if (dayName === 'Wednesday') {
    return {
      type: 'wednesday',
      greeting: 'Fellowship Night',
      subGreeting: 'Growing Together in Christ',
      primaryColor: 'text-teal-700',
      accentColor: 'bg-teal-500',
      gradient: 'from-teal-600 via-emerald-400 to-teal-700',
      icon: '🤝',
      badge: '💫 Fellowship',
      message: 'Mid-week renewal! Join our fellowship tonight as we study the word and share our journeys in faith.'
    };
  }

  // Friday: Morning Glory
  if (dayName === 'Friday') {
    return {
      type: 'friday',
      greeting: 'Morning Glory',
      subGreeting: 'First Light Prayer',
      primaryColor: 'text-blue-600',
      accentColor: 'bg-sky-400',
      gradient: 'from-sky-400 via-blue-500 to-indigo-600',
      icon: '☀️',
      badge: '🔥 Morning Glory',
      message: 'The fire on the altar must not go out. Join us for Morning Glory prayer as we start the morning with God.'
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

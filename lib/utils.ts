export const MAPS = [
  'Hide-and-Seek Mansion',
  'Sewer',
  'Backrooms',
  'Indoor Country',
  'Penguin Hotel',
  'Sugar Land',
  'Osaka',
  'Apartment',
  'Art Gallery',
  'Swimming Pool',
  'Minecraft House',
  'Minecraft',
  'Simpsons Family House',
  'CS2 Mirage',
  'Meeting Room',
  'Bikini Bottom',
  'Minepops',
  'Restaurant Building',
  'Viking Dining',
  'The Market',
] as const;

export type MapName = (typeof MAPS)[number];

export const CATEGORIES = [
  'Best Hide',
  'Best Camouflage',
  'Funniest Hide',
  'Best Beginner Hide',
  'Impossible Hide',
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_COLORS: Record<string, string> = {
  'Best Hide':         'bg-green-400/10 text-green-400 border-green-400/20',
  'Best Camouflage':   'bg-blue-400/10 text-blue-400 border-blue-400/20',
  'Funniest Hide':     'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
  'Best Beginner Hide':'bg-orange-400/10 text-orange-400 border-orange-400/20',
  'Impossible Hide':   'bg-red-400/10 text-red-400 border-red-400/20',
};

export function getCurrentWeek(): { week: number; year: number } {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
  return { week, year: now.getFullYear() };
}

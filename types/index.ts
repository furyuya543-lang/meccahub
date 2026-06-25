export interface User {
  id: string;
  steam_id: string;
  username: string;
  avatar_url: string;
  steam_profile_url: string;
  reputation: number;
  created_at: string;
}

export type Category =
  | 'Best Hide'
  | 'Best Camouflage'
  | 'Funniest Hide'
  | 'Best Beginner Hide'
  | 'Impossible Hide';

export interface Hide {
  id: string;
  user_id: string;
  title: string;
  description: string;
  map: string;
  category: Category;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Impossible';
  screenshot_url: string;
  video_url?: string;
  votes: number;
  created_at: string;
  users?: User;
}

export interface Vote {
  id: string;
  user_id: string;
  hide_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  hide_id: string;
  content: string;
  created_at: string;
  users?: User;
}

export interface Award {
  id: string;
  user_id: string;
  hide_id: string;
  award_type: string;
  week: number;
  year: number;
  created_at: string;
  hides?: Hide;
  users?: User;
}

export const MAPS = ['Map 1', 'Map 2', 'Map 3'] as const;
export const CATEGORIES: Category[] = [
  'Best Hide',
  'Best Camouflage',
  'Funniest Hide',
  'Best Beginner Hide',
  'Impossible Hide',
];

export const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: 'text-green-400 border-green-900',
  Medium: 'text-yellow-400 border-yellow-900',
  Hard: 'text-orange-400 border-orange-900',
  Impossible: 'text-red-400 border-red-900',
};

export interface Archive {
  id: string;
  week: number;
  year: number;
  category: 'hide' | 'player';
  hide_id: string | null;
  user_id: string | null;
  votes: number;
  created_at: string;
  hides?: Hide & { users?: User };
  users?: User;
}


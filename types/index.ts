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

export type ReportReason = 'Inappropriate' | 'Fake hide' | 'Spam' | 'Wrong map' | 'Other';

export interface Report {
  id: string;
  hide_id: string;
  user_id: string;
  reason: ReportReason;
  created_at: string;
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

export { MAPS } from "@/lib/utils";
export const CATEGORIES: Category[] = [
  'Best Hide',
  'Best Camouflage',
  'Funniest Hide',
  'Best Beginner Hide',
  'Impossible Hide',
];


export interface MapSubmission {
  id: string;
  user_id: string;
  map_name: string;
  steam_workshop_url: string;
  workshop_id: string;
  description: string | null;
  screenshot_url: string | null;
  preview_image_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  votes: number;
  created_at: string;
  users?: User;
}

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


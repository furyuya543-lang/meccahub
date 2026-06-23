export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Impossible'
export type Category =
  | 'Best Hide'
  | 'Best Camouflage'
  | 'Funniest Hide'
  | 'Best Beginner Hide'
  | 'Impossible Hide'
export type Map =
  | 'Hide-and-Seek Mansion'
  | 'Sewer'
  | 'Backrooms'
  | 'Indoor Country'
  | 'Penguin Hotel'
  | 'Sugar Land'
  | 'Osaka'
  | 'Apartment'
  | 'Art Gallery'
  | 'Swimming Pool'
  | 'Minecraft House'
  | 'Minecraft'
  | 'Simpsons Family House'
  | 'CS2 Mirage'
  | 'Meeting Room'
  | 'Bikini Bottom'
  | 'Minepops'
  | 'Restaurant Building'
  | 'Viking Dining'
  | 'The Market'

export interface User {
  id: string
  steam_id: string
  username: string
  avatar_url: string
  steam_profile_url: string
  reputation: number
  created_at: string
}

export interface Hide {
  id: string
  user_id: string
  title: string
  description: string
  map: Map
  difficulty: Difficulty
  category: Category
  screenshot_url: string
  video_url?: string
  votes: number
  created_at: string
  users?: User
}

export interface Vote {
  id: string
  user_id: string
  hide_id: string
  created_at: string
}

export interface Comment {
  id: string
  user_id: string
  hide_id: string
  content: string
  created_at: string
  users?: User
}

export interface Award {
  id: string
  user_id: string
  hide_id: string
  award_type: string
  week: number
  year: number
}

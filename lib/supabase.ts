import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  xp: number;
  level: number;
  rank: number | null;
  created_at: string;
  updated_at: string;
};

export type Meme = {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profiles?: Profile;
  user_liked?: boolean;
};

export type Comment = {
  id: string;
  meme_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: Profile;
};

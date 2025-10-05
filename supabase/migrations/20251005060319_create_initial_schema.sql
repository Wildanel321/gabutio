/*
  # Create Meme Upload Platform Schema

  ## Overview
  This migration creates the complete database schema for a meme upload platform with user progression, comments, and likes system.

  ## New Tables
  
  ### 1. `profiles` (extends auth.users)
    - `id` (uuid, primary key, references auth.users)
    - `username` (text, unique, required)
    - `avatar_url` (text, nullable)
    - `bio` (text, nullable)
    - `xp` (integer, default 0)
    - `level` (integer, default 1)
    - `rank` (integer, nullable) - calculated rank based on XP
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ### 2. `memes`
    - `id` (uuid, primary key)
    - `user_id` (uuid, references profiles)
    - `image_url` (text, required)
    - `caption` (text, nullable)
    - `likes_count` (integer, default 0)
    - `comments_count` (integer, default 0)
    - `created_at` (timestamptz)

  ### 3. `comments`
    - `id` (uuid, primary key)
    - `meme_id` (uuid, references memes)
    - `user_id` (uuid, references profiles)
    - `content` (text, required)
    - `created_at` (timestamptz)

  ### 4. `likes`
    - `id` (uuid, primary key)
    - `meme_id` (uuid, references memes)
    - `user_id` (uuid, references profiles)
    - `created_at` (timestamptz)
    - Unique constraint on (meme_id, user_id)

  ## Security
  - Enable RLS on all tables
  - Authenticated users can read all public data
  - Users can only modify their own data
  - Automatic XP calculation via triggers

  ## Functions & Triggers
  - Function to update user XP and level
  - Trigger to award XP on meme upload (+10 XP)
  - Trigger to award XP on like (+2 XP)
  - Trigger to award XP on comment (+3 XP)
  - Function to update meme counts (likes, comments)
  - Function to calculate user ranks
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  avatar_url text,
  bio text,
  xp integer DEFAULT 0 NOT NULL,
  level integer DEFAULT 1 NOT NULL,
  rank integer,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create memes table
CREATE TABLE IF NOT EXISTS memes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  image_url text NOT NULL,
  caption text,
  likes_count integer DEFAULT 0 NOT NULL,
  comments_count integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meme_id uuid REFERENCES memes(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create likes table
CREATE TABLE IF NOT EXISTS likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meme_id uuid REFERENCES memes(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(meme_id, user_id)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE memes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Memes policies
CREATE POLICY "Memes are viewable by everyone"
  ON memes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own memes"
  ON memes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memes"
  ON memes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own memes"
  ON memes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone"
  ON comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "Likes are viewable by everyone"
  ON likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own likes"
  ON likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update user level based on XP
CREATE OR REPLACE FUNCTION update_user_level()
RETURNS TRIGGER AS $$
BEGIN
  NEW.level := FLOOR(NEW.xp / 100.0) + 1;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update level when XP changes
DROP TRIGGER IF EXISTS update_level_on_xp_change ON profiles;
CREATE TRIGGER update_level_on_xp_change
  BEFORE UPDATE OF xp ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_level();

-- Function to award XP
CREATE OR REPLACE FUNCTION award_xp(user_uuid uuid, xp_amount integer)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET xp = xp + xp_amount
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to increment meme likes count
CREATE OR REPLACE FUNCTION increment_meme_likes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE memes
  SET likes_count = likes_count + 1
  WHERE id = NEW.meme_id;
  
  -- Award XP to the user who liked
  PERFORM award_xp(NEW.user_id, 2);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement meme likes count
CREATE OR REPLACE FUNCTION decrement_meme_likes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE memes
  SET likes_count = likes_count - 1
  WHERE id = OLD.meme_id;
  
  -- Deduct XP from the user who unliked
  PERFORM award_xp(OLD.user_id, -2);
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger for likes
DROP TRIGGER IF EXISTS increment_likes_on_insert ON likes;
CREATE TRIGGER increment_likes_on_insert
  AFTER INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION increment_meme_likes();

DROP TRIGGER IF EXISTS decrement_likes_on_delete ON likes;
CREATE TRIGGER decrement_likes_on_delete
  AFTER DELETE ON likes
  FOR EACH ROW
  EXECUTE FUNCTION decrement_meme_likes();

-- Function to increment comments count and award XP
CREATE OR REPLACE FUNCTION increment_meme_comments()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE memes
  SET comments_count = comments_count + 1
  WHERE id = NEW.meme_id;
  
  -- Award XP to the user who commented
  PERFORM award_xp(NEW.user_id, 3);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement comments count
CREATE OR REPLACE FUNCTION decrement_meme_comments()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE memes
  SET comments_count = comments_count - 1
  WHERE id = OLD.meme_id;
  
  -- Deduct XP from the user who deleted comment
  PERFORM award_xp(OLD.user_id, -3);
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger for comments
DROP TRIGGER IF EXISTS increment_comments_on_insert ON comments;
CREATE TRIGGER increment_comments_on_insert
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION increment_meme_comments();

DROP TRIGGER IF EXISTS decrement_comments_on_delete ON comments;
CREATE TRIGGER decrement_comments_on_delete
  AFTER DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION decrement_meme_comments();

-- Function to award XP on meme upload
CREATE OR REPLACE FUNCTION award_xp_on_meme_upload()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM award_xp(NEW.user_id, 10);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for meme upload XP
DROP TRIGGER IF EXISTS award_xp_on_meme_insert ON memes;
CREATE TRIGGER award_xp_on_meme_insert
  AFTER INSERT ON memes
  FOR EACH ROW
  EXECUTE FUNCTION award_xp_on_meme_upload();

-- Function to calculate and update ranks
CREATE OR REPLACE FUNCTION update_user_ranks()
RETURNS void AS $$
BEGIN
  WITH ranked_users AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY xp DESC, created_at ASC) as new_rank
    FROM profiles
  )
  UPDATE profiles
  SET rank = ranked_users.new_rank
  FROM ranked_users
  WHERE profiles.id = ranked_users.id;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_memes_user_id ON memes(user_id);
CREATE INDEX IF NOT EXISTS idx_memes_created_at ON memes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_meme_id ON comments(meme_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_meme_id ON likes(meme_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_xp ON profiles(xp DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Initial rank calculation
SELECT update_user_ranks();
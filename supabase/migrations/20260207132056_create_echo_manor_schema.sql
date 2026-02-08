/*
  # Echo Manor Mysteries - Database Schema

  ## Overview
  Creates the database structure for the AI-powered detective game where players
  investigate procedurally generated murder mysteries in a gothic manor.

  ## New Tables

  ### `games`
  Stores each game session with the mystery configuration and current state
  - `id` (uuid, primary key) - Unique game identifier
  - `created_at` (timestamptz) - When the game was created
  - `status` (text) - Game state: 'initializing', 'active', 'won', 'lost'
  - `mystery_truth` (jsonb) - Hidden solution (killer, weapon, location)
  - `game_state` (jsonb) - Current world state (suspects, rooms, weapons, etc.)
  - `current_location` (text) - Player's current location in the manor
  - `updated_at` (timestamptz) - Last activity timestamp

  ### `evidence`
  Tracks clues and evidence collected during investigation
  - `id` (uuid, primary key) - Unique evidence identifier
  - `game_id` (uuid, foreign key) - References games table
  - `description` (text) - What the player discovered
  - `location_found` (text) - Where this evidence was found
  - `significance` (text) - AI assessment of clue importance
  - `created_at` (timestamptz) - When evidence was discovered

  ### `chat_history`
  Stores the narrative conversation between player and AI
  - `id` (uuid, primary key) - Unique message identifier
  - `game_id` (uuid, foreign key) - References games table
  - `message_type` (text) - Type: 'user_action', 'ai_response', 'system'
  - `content` (text) - The actual message content
  - `created_at` (timestamptz) - Message timestamp

  ## Security
  - Enable RLS on all tables
  - Public read/write policies for hackathon demo (can be restricted later)
*/

-- Create games table
CREATE TABLE IF NOT EXISTS games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  status text DEFAULT 'initializing',
  mystery_truth jsonb DEFAULT '{}'::jsonb,
  game_state jsonb DEFAULT '{}'::jsonb,
  current_location text DEFAULT 'Grand Entrance Hall',
  updated_at timestamptz DEFAULT now()
);

-- Create evidence table
CREATE TABLE IF NOT EXISTS evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES games(id) ON DELETE CASCADE,
  description text NOT NULL,
  location_found text NOT NULL,
  significance text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create chat_history table
CREATE TABLE IF NOT EXISTS chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES games(id) ON DELETE CASCADE,
  message_type text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (demo mode)
CREATE POLICY "Anyone can create games"
  ON games FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view games"
  ON games FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update games"
  ON games FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can view evidence"
  ON evidence FOR SELECT
  USING (true);

CREATE POLICY "Anyone can add evidence"
  ON evidence FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view chat history"
  ON chat_history FOR SELECT
  USING (true);

CREATE POLICY "Anyone can add to chat history"
  ON chat_history FOR INSERT
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_evidence_game_id ON evidence(game_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_game_id ON chat_history(game_id);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);

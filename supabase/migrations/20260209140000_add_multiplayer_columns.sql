/*
  # Add Multiplayer Support Columns

  Adds columns needed for multiplayer game functionality:
  - room_code: For joining games
  - host_player_id: Track the game host
  - current_turn_player_id: Track whose turn it is
  - turn_order: Array of player IDs for turn sequence
*/

-- Add missing columns to games table
ALTER TABLE games ADD COLUMN IF NOT EXISTS room_code text;
ALTER TABLE games ADD COLUMN IF NOT EXISTS host_player_id uuid;
ALTER TABLE games ADD COLUMN IF NOT EXISTS current_turn_player_id uuid;
ALTER TABLE games ADD COLUMN IF NOT EXISTS turn_order jsonb DEFAULT '[]'::jsonb;

-- Create index for room_code lookups
CREATE INDEX IF NOT EXISTS idx_games_room_code ON games(room_code);

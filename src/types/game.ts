export interface Suspect {
  name: string;
  occupation: string;
  personality: string;
  motive: string;
  alibi: string;
}

export interface MysteryTruth {
  killer: string;
  weapon: string;
  location: string;
  motive: string;
}

export interface GameState {
  suspects: Suspect[];
  rooms: string[];
  weapons: string[];
  initialNarrative: string;
}

export interface Evidence {
  id: string;
  description: string;
  location_found: string;
  significance: string;
  created_at: string;
}

export type StoryMood = 'neutral' | 'tense' | 'mysterious' | 'joyful';

export interface ChatMessage {
  id: string;
  message_type: 'user_action' | 'ai_response' | 'system';
  content: string;
  created_at: string;
  image_url?: string;
  mood?: StoryMood;
}

export interface StoryBeat {
  id: string;
  narrative: string;
  image_url?: string;
  mood: StoryMood;
  timestamp: number;
}

export interface Game {
  id: string;
  status: 'lobby' | 'active' | 'won' | 'lost';
  game_state: GameState;
  current_location: string;
  mystery_truth: MysteryTruth;
  room_code: string;
  host_player_id: string;
  current_turn_player_id: string | null;
  turn_order: string[];
  created_at: string;
  updated_at: string;
}

// Multiplayer types
export interface Player {
  id: string;
  game_id: string;
  player_name: string;
  is_ai: boolean;
  is_host: boolean;
  joined_at: string;
}

export type DiceResultType = 'critical_fail' | 'fail' | 'partial' | 'success' | 'critical_success';

export interface DiceRoll {
  value: number;
  type: DiceResultType;
  timestamp: number;
}

// Helper to determine dice result type
export function getDiceResultType(roll: number): DiceResultType {
  if (roll === 1) return 'critical_fail';
  if (roll <= 7) return 'fail';
  if (roll <= 14) return 'partial';
  if (roll <= 19) return 'success';
  return 'critical_success';
}

// Generate a 6-character room code
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}


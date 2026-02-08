import { useState } from 'react';
import { Player } from '../types/game';
import { Users, Crown, Bot, Copy, Check } from 'lucide-react';

interface PlayerListProps {
    players: Player[];
    currentTurnPlayerId: string | null;
    currentPlayerId: string;
}

export function PlayerList({ players, currentTurnPlayerId, currentPlayerId }: PlayerListProps) {
    return (
        <div className="player-list">
            {players.map((player) => (
                <div
                    key={player.id}
                    className={`player-card ${player.is_ai ? 'is-ai' : ''} ${currentTurnPlayerId === player.id ? 'is-current-turn' : ''}`}
                >
                    <div className={`player-avatar ${player.is_ai ? 'is-ai' : ''}`}>
                        {player.is_ai ? (
                            <Bot className="w-6 h-6 text-blue-300" />
                        ) : (
                            <Users className="w-6 h-6 text-red-300" />
                        )}
                    </div>

                    <div className="flex-1">
                        <p className="player-name">
                            {player.player_name}
                            {player.id === currentPlayerId && (
                                <span className="text-slate-400 text-sm ml-2">(You)</span>
                            )}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {player.is_host && (
                            <span className="player-badge host">
                                <Crown className="w-3 h-3 inline mr-1" />
                                Host
                            </span>
                        )}
                        {player.is_ai && (
                            <span className="player-badge ai">
                                <Bot className="w-3 h-3 inline mr-1" />
                                AI
                            </span>
                        )}
                        {currentTurnPlayerId === player.id && (
                            <span className="turn-indicator">
                                <span className="your-turn">Current Turn</span>
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

interface GameLobbyProps {
    onCreateGame: (playerName: string) => void;
    onJoinGame: (roomCode: string, playerName: string) => void;
    isLoading: boolean;
    roomCode?: string;
    players: Player[];
    isHost: boolean;
    currentPlayerId: string;
    onStartGame: () => void;
}

export function GameLobby({
    onCreateGame,
    onJoinGame,
    isLoading,
    roomCode,
    players,
    isHost,
    currentPlayerId,
    onStartGame,
}: GameLobbyProps) {
    const [mode, setMode] = useState<'choice' | 'create' | 'join'>('choice');
    const [playerName, setPlayerName] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [copied, setCopied] = useState(false);

    const handleCopyCode = () => {
        if (roomCode) {
            navigator.clipboard.writeText(roomCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // If we have a room code, show the waiting room
    if (roomCode) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
                <div className="lobby-container">
                    <div className="card-gothic p-8 text-center space-y-6">
                        {/* Room Code Display */}
                        <div className="space-y-2">
                            <p className="text-slate-400 uppercase tracking-wider text-sm">Room Code</p>
                            <div className="flex items-center justify-center gap-4">
                                <span className="room-code">{roomCode}</span>
                                <button
                                    onClick={handleCopyCode}
                                    className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
                                    title="Copy code"
                                >
                                    {copied ? (
                                        <Check className="w-5 h-5 text-green-400" />
                                    ) : (
                                        <Copy className="w-5 h-5 text-slate-300" />
                                    )}
                                </button>
                            </div>
                            <p className="text-slate-500 text-sm">Share this code with friends to join</p>
                        </div>

                        {/* Players List */}
                        <div className="space-y-4">
                            <h3 className="text-slate-200 font-serif text-xl">
                                <Users className="w-5 h-5 inline mr-2" />
                                Players ({players.length})
                            </h3>
                            <PlayerList
                                players={players}
                                currentTurnPlayerId={null}
                                currentPlayerId={currentPlayerId}
                            />
                        </div>

                        {/* Start Game Button (Host Only) */}
                        {isHost && (
                            <button
                                onClick={onStartGame}
                                disabled={players.length < 2 || isLoading}
                                className="btn-gothic w-full disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Starting...' : `Start Investigation (${players.length} players)`}
                            </button>
                        )}

                        {!isHost && (
                            <p className="text-slate-400 italic animate-pulse">
                                Waiting for host to start the game...
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Initial choice screen
    if (mode === 'choice') {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
                {/* Fog overlay */}
                <div className="fog-overlay" />

                <div className="lobby-container relative z-10">
                    <div className="card-gothic p-8 text-center space-y-8">
                        <div className="space-y-4">
                            <h1 className="text-4xl font-serif text-slate-100 animate-dramaticReveal">
                                Echo Manor Mysteries
                            </h1>
                            <p className="text-slate-400">
                                Gather your fellow investigators for a night of mystery
                            </p>
                        </div>

                        <div className="grid gap-4">
                            <button
                                onClick={() => setMode('create')}
                                className="btn-gothic py-4"
                            >
                                <Crown className="w-5 h-5 inline mr-2" />
                                Create New Game
                            </button>
                            <button
                                onClick={() => setMode('join')}
                                className="px-6 py-4 bg-slate-700 hover:bg-slate-600 text-slate-100 
                         font-serif rounded-lg border border-slate-600 transition-all"
                            >
                                <Users className="w-5 h-5 inline mr-2" />
                                Join Existing Game
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Create or Join form
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            <div className="fog-overlay" />

            <div className="lobby-container relative z-10">
                <div className="card-gothic p-8 space-y-6">
                    <button
                        onClick={() => setMode('choice')}
                        className="text-slate-400 hover:text-slate-200 transition-colors"
                    >
                        ← Back
                    </button>

                    <h2 className="text-2xl font-serif text-slate-100">
                        {mode === 'create' ? 'Create New Game' : 'Join Game'}
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-slate-300 mb-2">Your Name</label>
                            <input
                                type="text"
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                                placeholder="Enter your detective name..."
                                className="input-gothic w-full"
                                maxLength={20}
                            />
                        </div>

                        {mode === 'join' && (
                            <div>
                                <label className="block text-slate-300 mb-2">Room Code</label>
                                <input
                                    type="text"
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                    placeholder="Enter 6-character code..."
                                    className="input-gothic w-full room-code-input"
                                    maxLength={6}
                                />
                            </div>
                        )}

                        <button
                            onClick={() => {
                                if (mode === 'create') {
                                    onCreateGame(playerName);
                                } else {
                                    onJoinGame(joinCode, playerName);
                                }
                            }}
                            disabled={!playerName.trim() || (mode === 'join' && joinCode.length !== 6) || isLoading}
                            className="btn-gothic w-full disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Loading...' : mode === 'create' ? 'Create Game' : 'Join Game'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

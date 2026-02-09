import { useState, useMemo, lazy, Suspense } from 'react';
import { supabase } from './lib/supabase';
import { WelcomeScreen } from './components/WelcomeScreen';
import { GameLobby } from './components/GameLobby';
import { InvestigationInterface } from './components/InvestigationInterface';
import { EvidenceJournal } from './components/EvidenceJournal';
import { Game, Evidence, ChatMessage, GameState, Player, DiceRoll, generateRoomCode, StoryBeat, StoryMood } from './types/game';
import { generateManorLayout, generateSeed, ManorLayout } from './utils/procedural';
import { Scale, Users, Dice6, Map } from 'lucide-react';
import { PlayerList } from './components/GameLobby';

// Lazy load components that aren't needed on initial render
const AccusationInterface = lazy(() => import('./components/AccusationInterface').then(m => ({ default: m.AccusationInterface })));
const GameResult = lazy(() => import('./components/GameResult').then(m => ({ default: m.GameResult })));
const D20Dice = lazy(() => import('./components/D20Dice').then(m => ({ default: m.D20Dice })));
const StoryReel = lazy(() => import('./components/StoryReel').then(m => ({ default: m.StoryReel })));

type GamePhase = 'welcome' | 'lobby' | 'playing' | 'result';

interface AccusationResult {
  isCorrect: boolean;
  narrative: string;
}

function App() {
  const [phase, setPhase] = useState<GamePhase>('welcome');
  const [game, setGame] = useState<Game | null>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAccusation, setShowAccusation] = useState(false);
  const [accusationResult, setAccusationResult] = useState<AccusationResult | null>(null);

  // Multiplayer state
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>('');
  const [isHost, setIsHost] = useState(false);
  const [roomCode, setRoomCode] = useState<string>('');

  // D20 Dice state
  const [showDiceRoll, setShowDiceRoll] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [lastDiceRoll, setLastDiceRoll] = useState<DiceRoll | null>(null);

  // Procedural generation state
  const [gameSeed, setGameSeed] = useState<number>(0);
  const [manorLayout, setManorLayout] = useState<ManorLayout | null>(null);
  const [showMap, setShowMap] = useState(true);

  // Story Reel state
  const [showStoryReel, setShowStoryReel] = useState(false);
  const [isGeneratingReel, setIsGeneratingReel] = useState(false);
  const [storyBeats, setStoryBeats] = useState<StoryBeat[]>([]);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  // Helper function to replace em-dashes with regular hyphens
  const sanitizeText = (text: string): string => {
    return text.replace(/—/g, '-').replace(/–/g, '-');
  };

  // Deep sanitize object strings (for AI responses)
  const sanitizeAIResponse = (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizeText(obj);
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitizeAIResponse);
    }
    if (obj && typeof obj === 'object') {
      const result: any = {};
      for (const key in obj) {
        result[key] = sanitizeAIResponse(obj[key]);
      }
      return result;
    }
    return obj;
  };

  // Create a new multiplayer game
  const handleCreateGame = async (playerName: string) => {
    setIsLoading(true);
    try {
      const newRoomCode = generateRoomCode();
      const playerId = crypto.randomUUID();

      // Create host player
      const hostPlayer: Player = {
        id: playerId,
        game_id: '', // Will be set after game creation
        player_name: playerName,
        is_ai: false,
        is_host: true,
        joined_at: new Date().toISOString(),
      };

      // Create AI teammate
      const aiTeammate: Player = {
        id: crypto.randomUUID(),
        game_id: '',
        player_name: 'Detective Cogsworth',
        is_ai: true,
        is_host: false,
        joined_at: new Date().toISOString(),
      };

      setCurrentPlayerId(playerId);
      setIsHost(true);
      setRoomCode(newRoomCode);
      setPlayers([hostPlayer, aiTeammate]);
      setPhase('lobby');
    } catch (error) {
      console.error('Error creating game:', error);
      alert('Failed to create game. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Join an existing game
  const handleJoinGame = async (code: string, playerName: string) => {
    setIsLoading(true);
    try {
      const playerId = crypto.randomUUID();

      const newPlayer: Player = {
        id: playerId,
        game_id: '',
        player_name: playerName,
        is_ai: false,
        is_host: false,
        joined_at: new Date().toISOString(),
      };

      // For demo purposes, simulate joining (in real implementation, this would fetch from Supabase)
      setCurrentPlayerId(playerId);
      setIsHost(false);
      setRoomCode(code);
      setPlayers(prev => [...prev, newPlayer]);
      setPhase('lobby');
    } catch (error) {
      console.error('Error joining game:', error);
      alert('Failed to join game. Please check the room code and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Start the game (host only)
  const handleStartGame = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-mystery`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Mystery generation failed:', errorText);
        throw new Error(`Failed to generate mystery: ${response.status}`);
      }

      const rawMysteryData = await response.json();
      const mysteryData = sanitizeAIResponse(rawMysteryData);

      const gameState: GameState = {
        suspects: mysteryData.suspects,
        rooms: mysteryData.rooms,
        weapons: mysteryData.weapons,
        initialNarrative: mysteryData.initialNarrative,
      };

      // Initialize procedural generation
      const seed = generateSeed();
      setGameSeed(seed);
      const layout = generateManorLayout(seed, gameState.rooms);
      setManorLayout(layout);

      const { data: newGame, error } = await supabase
        .from('games')
        .insert({
          status: 'active',
          game_state: gameState,
          mystery_truth: mysteryData.truth,
          current_location: gameState.rooms[0] || 'Grand Entrance Hall',
          room_code: roomCode,
          host_player_id: currentPlayerId,
          current_turn_player_id: currentPlayerId,
          turn_order: players.map(p => p.id),
        })
        .select()
        .single();

      if (error) throw error;

      setGame(newGame as Game);
      setEvidence([]);
      setChatHistory([]);
      setAccusationResult(null);

      await supabase.from('chat_history').insert({
        game_id: newGame.id,
        message_type: 'system',
        content: sanitizeText(mysteryData.initialNarrative),
      });

      const { data: messages } = await supabase
        .from('chat_history')
        .select('*')
        .eq('game_id', newGame.id)
        .order('created_at', { ascending: true });

      if (messages) {
        setChatHistory(messages as ChatMessage[]);
      }

      setPhase('playing');
    } catch (error) {
      console.error('Error starting game:', error);
      alert('Failed to start game. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle action with D20 dice roll
  const handleActionWithDice = (action: string) => {
    setPendingAction(action);
    setShowDiceRoll(true);
  };

  // Process action after dice roll
  const handleDiceRollComplete = async (roll: DiceRoll) => {
    setLastDiceRoll(roll);
    setShowDiceRoll(false);

    if (pendingAction && game) {
      await processActionWithRoll(pendingAction, roll);
      setPendingAction(null);
    }
  };

  // Process action with dice roll modifier
  const processActionWithRoll = async (action: string, roll: DiceRoll) => {
    if (!game) return;

    setIsProcessing(true);

    // Add dice roll info to the action
    const actionWithRoll = `[Rolled ${roll.value}] ${action}`;

    await supabase.from('chat_history').insert({
      game_id: game.id,
      message_type: 'user_action',
      content: actionWithRoll,
    });

    const { data: updatedMessages } = await supabase
      .from('chat_history')
      .select('*')
      .eq('game_id', game.id)
      .order('created_at', { ascending: true });

    if (updatedMessages) {
      setChatHistory(updatedMessages as ChatMessage[]);
    }

    try {
      const isInterrogation = action.toLowerCase().includes('question') ||
        action.toLowerCase().includes('interrogate') ||
        action.toLowerCase().includes('ask') ||
        action.toLowerCase().includes('speak with') ||
        action.toLowerCase().includes('talk to');

      const suspect = game.game_state.suspects.find((s) =>
        action.toLowerCase().includes(s.name.toLowerCase())
      );

      let response;

      if (isInterrogation && suspect) {
        response = await fetch(`${supabaseUrl}/functions/v1/interrogate-suspect`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            suspectName: suspect.name,
            question: action,
            suspectInfo: suspect,
            mysteryTruth: game.mystery_truth,
            diceRoll: roll.value, // Pass dice roll to AI
          }),
        });

        if (!response.ok) throw new Error('Failed to interrogate suspect');

        const data = await response.json();

        // Modify response based on dice roll
        let narrativeContent = `${suspect.name} responds:\n\n${sanitizeText(data.dialogue)}`;
        if (roll.type === 'critical_success') {
          narrativeContent += '\n\n*[Critical Success! The suspect reveals more than intended.]*';
        } else if (roll.type === 'critical_fail') {
          narrativeContent += '\n\n*[Critical Fail! The suspect becomes suspicious of you.]*';
        }

        await supabase.from('chat_history').insert({
          game_id: game.id,
          message_type: 'ai_response',
          content: narrativeContent,
        });

        // Better clue chance on high rolls
        if (data.hintRevealed && roll.value >= 8) {
          await supabase.from('evidence').insert({
            game_id: game.id,
            description: sanitizeText(data.hintRevealed),
            location_found: game.current_location,
            significance: roll.value >= 15 ? 'high' : data.suspicionLevel,
          });
        }
      } else {
        response = await fetch(`${supabaseUrl}/functions/v1/process-action`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action,
            gameState: game.game_state,
            currentLocation: game.current_location,
            diceRoll: roll.value,
          }),
        });

        if (!response.ok) throw new Error('Failed to process action');

        const data = await response.json();

        let narrative = sanitizeText(data.narrative);
        if (roll.type === 'critical_success') {
          narrative += '\n\n*[Critical Success! You discover something extraordinary!]*';
        } else if (roll.type === 'critical_fail') {
          narrative += '\n\n*[Critical Fail! Something goes wrong...]*';
        } else if (roll.type === 'fail') {
          narrative = `*Your attempt was unsuccessful.*\n\n${narrative}`;
        }

        await supabase.from('chat_history').insert({
          game_id: game.id,
          message_type: 'ai_response',
          content: narrative,
        });

        if (data.newLocation && data.newLocation.trim()) {
          await supabase
            .from('games')
            .update({ current_location: data.newLocation })
            .eq('id', game.id);

          setGame({ ...game, current_location: data.newLocation });
        }

        // Only find clues on successful rolls
        if (data.clueFound && data.clueFound.trim() && roll.value >= 8) {
          await supabase.from('evidence').insert({
            game_id: game.id,
            description: sanitizeText(data.clueFound),
            location_found: sanitizeText(data.newLocation) || game.current_location,
            significance: roll.value >= 15 ? 'high' : data.evidenceSignificance || 'low',
          });
        }
      }

      const { data: updatedMessagesAfter } = await supabase
        .from('chat_history')
        .select('*')
        .eq('game_id', game.id)
        .order('created_at', { ascending: true });

      if (updatedMessagesAfter) {
        setChatHistory(updatedMessagesAfter as ChatMessage[]);
      }

      const { data: updatedEvidence } = await supabase
        .from('evidence')
        .select('*')
        .eq('game_id', game.id)
        .order('created_at', { ascending: true });

      if (updatedEvidence) {
        setEvidence(updatedEvidence as Evidence[]);
      }

      // Rotate turn to next player
      rotateTurn();

    } catch (error) {
      console.error('Error processing action:', error);
      alert('Failed to process action. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Rotate to next player's turn
  const rotateTurn = () => {
    if (!game || players.length === 0) return;

    const currentIndex = players.findIndex(p => p.id === game.current_turn_player_id);
    const nextIndex = (currentIndex + 1) % players.length;
    const nextPlayer = players[nextIndex];

    if (!nextPlayer) return;

    setGame(prev => prev ? { ...prev, current_turn_player_id: nextPlayer.id } : null);

    // If next player is AI, trigger AI turn (with safety check to prevent infinite loops)
    const humanPlayers = players.filter(p => !p.is_ai);
    if (nextPlayer.is_ai && humanPlayers.length > 0) {
      setTimeout(() => handleAITurn(nextPlayer), 2000);
    }
  };

  // Handle AI teammate's turn
  const handleAITurn = async (aiPlayer: Player) => {
    if (!game || !aiPlayer) return;

    setIsProcessing(true);

    // AI decides on an action
    const aiActions = [
      'examine the room carefully',
      'look for hidden clues',
      'check for footprints or evidence',
      'inspect the furniture',
      'search for documents or notes',
    ];
    const randomAction = aiActions[Math.floor(Math.random() * aiActions.length)];
    const aiRoll = Math.floor(Math.random() * 20) + 1;

    await supabase.from('chat_history').insert({
      game_id: game.id,
      message_type: 'user_action',
      content: `[${aiPlayer.player_name} rolled ${aiRoll}] ${randomAction}`,
    });

    // Simulate AI action processing
    setTimeout(async () => {
      try {
        await supabase.from('chat_history').insert({
          game_id: game.id,
          message_type: 'ai_response',
          content: `${aiPlayer.player_name} ${randomAction}s and ${aiRoll >= 10 ? 'finds something interesting' : 'doesn\'t find anything notable'}.`,
        });

        const { data: updatedMessages } = await supabase
          .from('chat_history')
          .select('*')
          .eq('game_id', game.id)
          .order('created_at', { ascending: true });

        if (updatedMessages) {
          setChatHistory(updatedMessages as ChatMessage[]);
        }
      } catch (error) {
        console.error('Error in AI turn:', error);
      } finally {
        setIsProcessing(false);
        rotateTurn();
      }
    }, 1500);
  };

  const handleAccusation = async (accusation: { killer: string; weapon: string; location: string }) => {
    if (!game) return;

    setIsProcessing(true);

    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/validate-accusation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accusation,
          mysteryTruth: game.mystery_truth,
          gameState: game.game_state,
        }),
      });

      if (!response.ok) throw new Error('Failed to validate accusation');

      const data = await response.json();

      await supabase
        .from('games')
        .update({ status: data.isCorrect ? 'won' : 'lost' })
        .eq('id', game.id);

      setAccusationResult({
        isCorrect: data.isCorrect,
        narrative: sanitizeText(data.narrative),
      });

      setShowAccusation(false);
      setPhase('result');
    } catch (error) {
      console.error('Error validating accusation:', error);
      alert('Failed to validate accusation. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewReel = async () => {
    if (storyBeats.length > 0) {
      setShowStoryReel(true);
      return;
    }

    setIsGeneratingReel(true);
    try {
      // 1. Select key moments from chat history
      // Filter for AI responses that are narrative-heavy
      const narrativeMoments = chatHistory
        .filter(msg => msg.message_type === 'ai_response')
        .filter((_, i) => i % 2 === 0) // Take every other response to abbreviate
        .slice(-5); // Take last 5 moments

      // Always include the intro and the solution
      const intro = chatHistory[0];
      const moments = [intro, ...narrativeMoments];
      // Add conclusion if available
      if (accusationResult) {
        moments.push({
          id: 'conclusion',
          message_type: 'system',
          content: accusationResult.narrative,
          created_at: new Date().toISOString()
        });
      }

      // 2. Generate images for each moment
      const beats: StoryBeat[] = await Promise.all(moments.map(async (msg, index) => {
        // Determine mood based on keywords
        const text = msg.content.toLowerCase();
        let mood: StoryMood = 'neutral';
        if (text.includes('blood') || text.includes('body') || text.includes('killer')) mood = 'tense';
        else if (text.includes('shadow') || text.includes('mystery') || text.includes('secret')) mood = 'mysterious';
        else if (text.includes('win') || text.includes('success')) mood = 'joyful';

        // Call Edge Function to generate image
        let imageUrl: string | undefined;
        try {
          const response = await fetch(`${supabaseUrl}/functions/v1/generate-image`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              prompt: msg.content.substring(0, 100), // Summarize prompt
              mood
            }),
          });

          if (response.ok) {
            const data = await response.json();
            imageUrl = data.image_url;
          }
        } catch (e) {
          console.error("Failed to generate image", e);
        }

        return {
          id: msg.id || `beat-${index}`,
          narrative: msg.content.substring(0, 150) + (msg.content.length > 150 ? '...' : ''),
          mood,
          image_url: imageUrl,
          timestamp: index * 5000,
        };
      }));

      setStoryBeats(beats);
      setShowStoryReel(true);
    } catch (error) {
      console.error('Failed to generate reel:', error);
    } finally {
      setIsGeneratingReel(false);
    }
  };

  const handleNewGame = () => {
    setPhase('welcome');
    setGame(null);
    setEvidence([]);
    setChatHistory([]);
    setAccusationResult(null);
    setShowAccusation(false);
    setPlayers([]);
    setRoomCode('');
    setCurrentPlayerId('');
    setIsHost(false);
    // Reset procedural generation state
    setGameSeed(0);
    setManorLayout(null);
    setShowMap(true);
    // Reset story reel state
    setStoryBeats([]);
    setShowStoryReel(false);
  };

  const isMyTurn = game?.current_turn_player_id === currentPlayerId;
  const currentTurnPlayer = players.find(p => p.id === game?.current_turn_player_id);

  return (
    <main className="min-h-screen bg-slate-900" role="main">
      {phase === 'welcome' && (
        <WelcomeScreen
          onStartGame={() => setPhase('lobby')}
          isLoading={isLoading}
        />
      )}

      {phase === 'lobby' && (
        <GameLobby
          onCreateGame={handleCreateGame}
          onJoinGame={handleJoinGame}
          isLoading={isLoading}
          roomCode={roomCode}
          players={players}
          isHost={isHost}
          currentPlayerId={currentPlayerId}
          onStartGame={handleStartGame}
        />
      )}

      {phase === 'playing' && game && (
        <div className="h-screen flex flex-col">
          <header className="bg-slate-800 border-b-2 border-red-900 p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-serif text-slate-100">Echo Manor Mysteries</h1>
              {roomCode && (
                <span className="text-slate-400 text-sm font-mono">
                  Room: {roomCode}
                </span>
              )}
            </div>

            <div className="flex items-center gap-4">
              {/* Turn Indicator */}
              {currentTurnPlayer && (
                <div className={`turn-indicator ${isMyTurn ? 'your-turn' : ''}`}>
                  <Dice6 className="w-4 h-4" />
                  <span>
                    {isMyTurn ? "Your Turn" : `${currentTurnPlayer.player_name}'s Turn`}
                  </span>
                </div>
              )}

              <button
                onClick={() => setShowAccusation(true)}
                disabled={isProcessing || !isMyTurn}
                className="px-6 py-2 bg-red-900 hover:bg-red-800 text-slate-100 rounded-lg
                           transition-colors duration-200 flex items-center gap-2 disabled:opacity-50
                           disabled:cursor-not-allowed border border-red-950"
              >
                <Scale className="w-4 h-4" />
                Make Accusation
              </button>
            </div>
          </header>

          <div className="flex-1 flex overflow-hidden">
            {/* Player List Sidebar */}
            <div className="w-64 bg-slate-800/50 border-r border-slate-700 p-4 overflow-y-auto">
              <h3 className="text-slate-300 font-serif text-lg mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Investigators
              </h3>
              <PlayerList
                players={players}
                currentTurnPlayerId={game.current_turn_player_id}
                currentPlayerId={currentPlayerId}
              />

              {/* Last Dice Roll Display */}
              {lastDiceRoll && (
                <div className="mt-6">
                  <h4 className="text-slate-400 text-sm mb-2">Last Roll</h4>
                  <div className={`d20-result ${`dice-${lastDiceRoll.type.replace('_', '-')}`}`}>
                    <span className="d20-result-label">{lastDiceRoll.value}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col min-w-0">
              <InvestigationInterface
                currentLocation={game.current_location}
                chatHistory={chatHistory}
                onSubmitAction={handleActionWithDice}
                isProcessing={isProcessing || !isMyTurn}
              />
            </div>

            <div className="w-96 flex-shrink-0">
              <EvidenceJournal
                evidence={evidence}
                suspects={game.game_state.suspects}
                rooms={game.game_state.rooms}
                weapons={game.game_state.weapons}
              />
            </div>
          </div>
        </div>
      )}

      {/* D20 Dice Roll Modal */}
      {showDiceRoll && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"><div className="text-slate-300">Loading...</div></div>}>
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="card-gothic p-8 text-center space-y-6">
              <h2 className="text-2xl font-serif text-slate-100">Roll for Action</h2>
              <p className="text-slate-400">"{pendingAction}"</p>
              <D20Dice onRollComplete={handleDiceRollComplete} />
            </div>
          </div>
        </Suspense>
      )}

      {showAccusation && game && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"><div className="text-slate-300">Loading...</div></div>}>
          <AccusationInterface
            suspects={game.game_state.suspects}
            rooms={game.game_state.rooms}
            weapons={game.game_state.weapons}
            onSubmitAccusation={handleAccusation}
            onClose={() => setShowAccusation(false)}
            isProcessing={isProcessing}
          />
        </Suspense>
      )}

      {phase === 'result' && accusationResult && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"><div className="text-slate-300">Loading...</div></div>}>
          <GameResult
            isCorrect={accusationResult.isCorrect}
            narrative={accusationResult.narrative}
            onNewGame={handleNewGame}
            onViewReel={handleViewReel}
            isGeneratingReel={isGeneratingReel}
          />
        </Suspense>
      )}

      {showStoryReel && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"><div className="text-slate-300">Loading...</div></div>}>
          <StoryReel
            beats={storyBeats}
            onClose={() => {
              setShowStoryReel(false);
              setPhase('lobby');
            }}
            onReplay={() => setShowStoryReel(true)} // Replay doesn't need to regeneration
          />
        </Suspense>
      )}

      {/* Waiting Overlay when not your turn */}
      {phase === 'playing' && !isMyTurn && !isProcessing && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-30">
          <div className="bg-slate-800/90 border border-slate-600 rounded-lg px-6 py-3 animate-pulse">
            <p className="text-slate-300">
              Waiting for {currentTurnPlayer?.player_name || 'other player'}...
            </p>
          </div>
        </div>
      )}
    </main>
  );
}

export default App;

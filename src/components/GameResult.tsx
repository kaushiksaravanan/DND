import { Crown, Skull, Ghost, RotateCcw, Sparkles, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface GameResultProps {
  isCorrect: boolean;
  narrative: string;
  onNewGame: () => void;
  onViewReel: () => void;
  isGeneratingReel: boolean;
}

// Simple confetti particle component for victory
function ConfettiParticle({ delay, left }: { delay: number; left: number }) {
  return (
    <div
      className="absolute w-2 h-2 rounded-sm"
      style={{
        left: `${left}%`,
        top: '-10px',
        backgroundColor: ['#fbbf24', '#ef4444', '#22c55e', '#3b82f6', '#a855f7'][Math.floor(Math.random() * 5)],
        animation: `confettiFall 3s ease-out ${delay}s forwards`,
        opacity: 0,
      }}
    />
  );
}

export function GameResult({ isCorrect, narrative, onNewGame }: GameResultProps) {
  const [showContent, setShowContent] = useState(false);
  const [confetti, setConfetti] = useState<Array<{ id: number; delay: number; left: number }>>([]);

  useEffect(() => {
    // Delay content reveal for dramatic effect
    const timer = setTimeout(() => setShowContent(true), 500);

    // Generate confetti for victory
    if (isCorrect) {
      const particles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        delay: Math.random() * 2,
        left: Math.random() * 100,
      }));
      setConfetti(particles);
    }

    return () => clearTimeout(timer);
  }, [isCorrect]);

  return (
    <div className="fixed inset-0 modal-overlay flex items-center justify-center p-4 z-50">
      {/* Confetti for victory */}
      {isCorrect && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <style>{`
            @keyframes confettiFall {
              0% { transform: translateY(0) rotate(0deg); opacity: 1; }
              100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
            }
          `}</style>
          {confetti.map((particle) => (
            <ConfettiParticle key={particle.id} delay={particle.delay} left={particle.left} />
          ))}
        </div>
      )}

      <div
        className={`card-gothic border-4 ${isCorrect ? 'border-amber-600 victory-glow' : 'border-red-900'} 
                    max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-dramatic-reveal`}
      >
        {/* Header */}
        <div
          className={`${isCorrect
            ? 'bg-gradient-to-r from-amber-900/80 via-yellow-900/60 to-amber-900/80'
            : 'bg-gradient-to-r from-red-950 via-red-900/80 to-red-950 defeat-pulse'
            } border-b-4 ${isCorrect ? 'border-amber-700' : 'border-red-900'} p-8 text-center relative overflow-hidden`}
        >
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-10">
            {isCorrect ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-64 h-64 text-amber-400" />
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Ghost className="w-64 h-64 text-red-400" />
              </div>
            )}
          </div>

          {/* Icon */}
          <div
            className={`relative z-10 flex justify-center mb-4 ${showContent ? 'animate-float' : 'opacity-0'}`}
            style={{ transition: 'opacity 0.5s' }}
          >
            {isCorrect ? (
              <div className="relative">
                <Crown className="w-20 h-20 text-amber-400 text-glow-gold" />
                <div className="absolute inset-0 bg-amber-400/20 blur-2xl rounded-full" />
              </div>
            ) : (
              <div className="relative">
                <Skull className="w-20 h-20 text-red-400 text-glow-blood" />
                <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full" />
              </div>
            )}
          </div>

          {/* Title */}
          <h2
            className={`relative z-10 font-serif text-5xl mb-3 ${isCorrect ? 'text-amber-200 text-glow-gold' : 'text-red-200 text-glow-blood'
              } ${showContent ? 'animate-fadeIn' : 'opacity-0'}`}
            style={{ animationDelay: '0.2s' }}
          >
            {isCorrect ? 'Mystery Solved!' : 'Case Unsolved'}
          </h2>

          <p
            className={`relative z-10 text-lg italic ${isCorrect ? 'text-amber-300/80' : 'text-red-300/80'
              } ${showContent ? 'animate-fadeIn' : 'opacity-0'}`}
            style={{ animationDelay: '0.4s' }}
          >
            {isCorrect
              ? 'Your brilliant deduction has brought justice to Echo Manor!'
              : 'The shadows of Echo Manor keep their secrets still...'}
          </p>
        </div>

        {/* Narrative Content */}
        <div className="p-8 space-y-6">
          <div
            className={`card-gothic p-6 border-${isCorrect ? 'amber' : 'red'}-900/30 ${showContent ? 'animate-fadeIn' : 'opacity-0'
              }`}
            style={{ animationDelay: '0.6s' }}
          >
            <p className="text-slate-200 leading-relaxed whitespace-pre-wrap font-serif text-lg">
              {narrative}
            </p>
          </div>

          {/* Play Again Button */}
          <div className="flex gap-4 justify-center flex-wrap"
            style={{ animationDelay: '0.8s' }}
          >
            <button
              onClick={() => {
                const resultText = isCorrect
                  ? `I solved the mystery of Echo Manor! The killer was ${narrative.split(' ').slice(0, 5).join(' ')}... Can you beat my detective skills? #EchoManor https://echo-manor.netlify.app`
                  : `The mystery of Echo Manor stumped me this time. Can you solve the case? #EchoManor https://echo-manor.netlify.app`;
                navigator.clipboard.writeText(resultText);
                // Optional: Tooltip or toast trigger here
                alert("Result copied to clipboard!");
              }}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-900/80 hover:bg-emerald-800/80 
                         rounded-lg transition-colors border border-emerald-500/30 font-serif text-slate-200"
            >
              <Share2 className="w-5 h-5" />
              <span>Share Result</span>
            </button>

            <button
              onClick={onViewReel}
              disabled={isGeneratingReel}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-900/80 hover:bg-indigo-800/80 
                           rounded-lg transition-colors border border-indigo-500/30 font-serif text-slate-200
                           disabled:opacity-50 disabled:cursor-wait"
            >
              {isGeneratingReel ? (
                <>
                  <Sparkles className="w-5 h-5 animate-spin" />
                  <span>Developing Reel...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>View Story Reel</span>
                </>
              )}
            </button>

            <button
              onClick={onNewGame}
              className="flex items-center gap-2 px-6 py-3 bg-red-900/80 hover:bg-red-800/80 
                           rounded-lg transition-colors border border-red-800 font-serif text-slate-200"
            >
              <RotateCcw className="w-5 h-5" />
              <span>New Mystery</span>
            </button>
          </div>

          {/* Stats or flavor text */}
          <p
            className={`text-center text-slate-500 text-sm italic ${showContent ? 'animate-fadeIn' : 'opacity-0'
              }`}
            style={{ animationDelay: '1s' }}
          >
            {isCorrect
              ? '"The truth, like the sun, will always rise to illuminate the shadows."'
              : '"Even the greatest detectives face mysteries that elude their grasp. Try again."'}
          </p>
        </div>
      </div>
    </div>
  );
}

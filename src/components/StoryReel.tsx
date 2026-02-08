import { useState, useEffect, useRef } from 'react';
import { StoryBeat } from '../types/game';
import { MarimbaGenerator } from '../utils/audio';
import { Play, RotateCcw, Home } from 'lucide-react';

interface StoryReelProps {
    beats: StoryBeat[];
    onClose: () => void;
    onReplay: () => void;
}

export function StoryReel({ beats, onClose, onReplay }: StoryReelProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showControls, setShowControls] = useState(false);
    const audioRef = useRef<MarimbaGenerator | null>(null);

    useEffect(() => {
        // Initialize audio engine
        audioRef.current = new MarimbaGenerator();
        audioRef.current.init().catch(console.error);

        return () => {
            audioRef.current?.stop();
        };
    }, []);

    useEffect(() => {
        if (isPlaying) {
            const beatDuration = 8000; // 8 seconds per beat
            const timer = setTimeout(() => {
                if (currentIndex < beats.length - 1) {
                    setCurrentIndex(prev => prev + 1);
                } else {
                    setIsPlaying(false);
                    setShowControls(true);
                    audioRef.current?.stop();
                }
            }, beatDuration);

            // Update audio mood based on current beat
            const currentBeat = beats[currentIndex];
            audioRef.current?.setMood(currentBeat.mood as any);

            return () => clearTimeout(timer);
        }
    }, [isPlaying, currentIndex, beats]);

    const handleStart = () => {
        setIsPlaying(true);
        setShowControls(false);
        audioRef.current?.start(beats[0].mood as any);
    };

    const handleReplay = () => {
        setCurrentIndex(0);
        setIsPlaying(true);
        setShowControls(false);
        audioRef.current?.start(beats[0].mood as AudioMood);
    };

    const currentBeat = beats[currentIndex];

    return (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-0 opacity-30">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-transparent to-slate-900" />
                {currentBeat.image_url && (
                    <img
                        src={currentBeat.image_url}
                        className="w-full h-full object-cover filter blur-sm scale-110 transition-transform duration-[10000ms] ease-linear"
                        style={{ transform: isPlaying ? 'scale(1.2)' : 'scale(1.1)' }}
                    />
                )}
            </div>

            <div className="relative z-10 max-w-4xl w-full p-8 text-center space-y-8">
                {!isPlaying && !showControls && (
                    <div className="animate-fadeIn space-y-6">
                        <h2 className="text-4xl font-serif text-slate-100 tracking-wider">The Mystery Concludes</h2>
                        <button
                            onClick={handleStart}
                            className="group flex items-center gap-3 mx-auto px-8 py-4 bg-slate-800/50 
                         hover:bg-slate-700/50 border border-slate-600 rounded-full 
                         transition-all duration-300 hover:scale-105"
                        >
                            <Play className="w-6 h-6 text-red-400 group-hover:text-red-300" />
                            <span className="text-xl font-serif text-slate-200">Play Reel</span>
                        </button>
                    </div>
                )}

                {isPlaying && (
                    <div key={currentBeat.id} className="animate-crossfade space-y-8">
                        {/* Image Frame */}
                        <div className="relative aspect-video max-h-[60vh] mx-auto overflow-hidden rounded-lg shadow-2xl border border-slate-700/50 bg-black">
                            {currentBeat.image_url ? (
                                <img
                                    src={currentBeat.image_url}
                                    alt="Story moment"
                                    className="w-full h-full object-contain animate-pan"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-900">
                                    <span className="text-slate-600 font-serif italic">Scene Missing</span>
                                </div>
                            )}

                            {/* Vignette */}
                            <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/60 pointer-events-none" />
                        </div>

                        {/* Narrative Captions */}
                        <div className="space-y-4 max-w-2xl mx-auto">
                            <p className="text-lg md:text-2xl font-serif text-slate-200 leading-relaxed drop-shadow-lg">
                                {currentBeat.narrative}
                            </p>
                        </div>

                        {/* Progress Bar */}
                        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 w-64 h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-red-900/50"
                                style={{ width: `${((currentIndex + 1) / beats.length) * 100}%`, transition: 'width 1s linear' }}
                            />
                        </div>
                    </div>
                )}

                {showControls && (
                    <div className="animate-fadeIn space-y-8 bg-slate-900/80 p-12 rounded-2xl border border-slate-800 backdrop-blur-md">
                        <h2 className="text-3xl font-serif text-slate-100">Fin</h2>
                        <div className="flex justify-center gap-6">
                            <button
                                onClick={handleReplay}
                                className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 
                           rounded-lg transition-colors border border-slate-600"
                            >
                                <RotateCcw className="w-5 h-5" />
                                <span>Replay Reel</span>
                            </button>
                            <button
                                onClick={onClose}
                                className="flex items-center gap-2 px-6 py-3 bg-red-900/80 hover:bg-red-800/80 
                           rounded-lg transition-colors border border-red-800"
                            >
                                <Home className="w-5 h-5" />
                                <span>Return to Lobby</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

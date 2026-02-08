import { useState } from 'react';
import { Scale, X, AlertTriangle, User, Sword, MapPin } from 'lucide-react';
import { Suspect } from '../types/game';

interface AccusationInterfaceProps {
  suspects: Suspect[];
  rooms: string[];
  weapons: string[];
  onSubmitAccusation: (accusation: { killer: string; weapon: string; location: string }) => void;
  onClose: () => void;
  isProcessing: boolean;
}

export function AccusationInterface({
  suspects,
  rooms,
  weapons,
  onSubmitAccusation,
  onClose,
  isProcessing,
}: AccusationInterfaceProps) {
  const [killer, setKiller] = useState('');
  const [weapon, setWeapon] = useState('');
  const [location, setLocation] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (killer && weapon && location && !isProcessing) {
      setShowConfirm(true);
    }
  };

  const handleConfirm = () => {
    onSubmitAccusation({ killer, weapon, location });
    setShowConfirm(false);
  };

  const isValid = killer && weapon && location;

  const selectedSuspect = suspects.find(s => s.name === killer);

  return (
    <div className="fixed inset-0 modal-overlay flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="card-gothic border-2 border-red-900 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-dramatic-reveal">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-950 to-slate-900 border-b-2 border-red-900 p-5 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-900/50 rounded-lg border border-red-800 animate-blood-glow">
              <Scale className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h2 className="text-slate-100 font-serif text-2xl">Make Your Accusation</h2>
              <p className="text-slate-400 text-sm">Choose wisely - there's no turning back</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6 text-slate-400 hover:text-slate-200" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Warning Banner */}
          <div className="flex items-start gap-3 bg-red-950/30 border border-red-900/50 rounded-lg p-4">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-slate-300 text-sm leading-relaxed">
              Once you make your final accusation, the mystery will be revealed.
              <span className="text-red-400 font-medium"> You must correctly identify the killer, weapon, and location to win!</span>
            </p>
          </div>

          {/* Selection Cards */}
          <div className="space-y-5">
            {/* Suspect Selection */}
            <div className="card-gothic p-4">
              <label className="flex items-center gap-2 text-slate-200 font-serif text-lg mb-3">
                <User className="w-5 h-5 text-red-600" />
                Who committed the murder?
              </label>
              <select
                value={killer}
                onChange={(e) => setKiller(e.target.value)}
                disabled={isProcessing}
                className="w-full input-gothic rounded-lg px-4 py-3
                           text-slate-200 disabled:opacity-50 cursor-pointer"
              >
                <option value="">Select a suspect...</option>
                {suspects.map((suspect) => (
                  <option key={suspect.name} value={suspect.name}>
                    {suspect.name} - {suspect.occupation}
                  </option>
                ))}
              </select>
              {selectedSuspect && (
                <p className="text-slate-500 text-xs mt-2 italic">
                  "{selectedSuspect.personality}"
                </p>
              )}
            </div>

            {/* Weapon Selection */}
            <div className="card-gothic p-4">
              <label className="flex items-center gap-2 text-slate-200 font-serif text-lg mb-3">
                <Sword className="w-5 h-5 text-slate-400" />
                What was the murder weapon?
              </label>
              <select
                value={weapon}
                onChange={(e) => setWeapon(e.target.value)}
                disabled={isProcessing}
                className="w-full input-gothic rounded-lg px-4 py-3
                           text-slate-200 disabled:opacity-50 cursor-pointer"
              >
                <option value="">Select a weapon...</option>
                {weapons.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Selection */}
            <div className="card-gothic p-4">
              <label className="flex items-center gap-2 text-slate-200 font-serif text-lg mb-3">
                <MapPin className="w-5 h-5 text-amber-600" />
                Where did the murder occur?
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={isProcessing}
                className="w-full input-gothic rounded-lg px-4 py-3
                           text-slate-200 disabled:opacity-50 cursor-pointer"
              >
                <option value="">Select a location...</option>
                {rooms.map((room) => (
                  <option key={room} value={room}>
                    {room}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Summary Preview */}
          {isValid && (
            <div className="card-gothic p-4 border-red-900/50 animate-fadeIn">
              <p className="text-slate-300 text-sm font-serif leading-relaxed">
                You accuse <span className="text-red-400 font-semibold">{killer}</span> of committing
                the murder with the <span className="text-slate-200 font-semibold">{weapon}</span> in
                the <span className="text-amber-500 font-semibold">{location}</span>.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200
                         rounded-lg transition-colors duration-200 disabled:opacity-50
                         disabled:cursor-not-allowed font-medium"
            >
              Continue Investigating
            </button>
            <button
              type="submit"
              disabled={!isValid || isProcessing}
              className="flex-1 btn-gothic px-6 py-3 text-slate-100 rounded-lg
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                         font-serif text-lg"
            >
              {isProcessing ? 'Revealing Truth...' : 'Submit Accusation'}
            </button>
          </div>
        </form>

        {/* Confirmation Modal */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fadeIn">
            <div className="card-gothic border-2 border-red-900 p-6 max-w-md mx-4 animate-dramatic-reveal">
              <div className="text-center mb-6">
                <Scale className="w-12 h-12 text-red-500 mx-auto mb-3" />
                <h3 className="text-slate-100 font-serif text-xl mb-2">Are you certain?</h3>
                <p className="text-slate-400 text-sm">
                  This decision is final. The truth will be revealed.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 
                             text-slate-200 rounded-lg transition-colors"
                >
                  Wait, let me reconsider
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 btn-gothic px-4 py-2 text-slate-100 rounded-lg"
                >
                  Yes, reveal the truth
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

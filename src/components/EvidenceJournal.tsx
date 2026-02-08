import { useState } from 'react';
import { BookOpen, AlertCircle, MapPin, Sword, ChevronDown, ChevronRight, Sparkles } from 'lucide-react';
import { Evidence, Suspect } from '../types/game';

interface EvidenceJournalProps {
  evidence: Evidence[];
  suspects: Suspect[];
  rooms: string[];
  weapons: string[];
}

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  count: number;
  defaultOpen?: boolean;
  accentColor?: string;
  children: React.ReactNode;
}

function CollapsibleSection({ title, icon, count, defaultOpen = true, accentColor = 'red', children }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="border-b border-slate-700/50 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="collapsible-header w-full flex items-center justify-between p-3 hover:bg-slate-800/30"
      >
        <div className="flex items-center gap-2">
          <span className={`text-${accentColor}-700`}>{icon}</span>
          <h3 className={`text-${accentColor}-600 font-serif text-base`}>{title}</h3>
          <span className="text-slate-500 text-sm">({count})</span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-slate-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-500" />
        )}
      </button>

      <div
        className="collapsible-content px-3 pb-3"
        style={{
          maxHeight: isOpen ? '1000px' : '0',
          opacity: isOpen ? 1 : 0,
          paddingBottom: isOpen ? '12px' : '0',
        }}
      >
        {children}
      </div>
    </section>
  );
}

export function EvidenceJournal({ evidence, suspects, rooms, weapons }: EvidenceJournalProps) {
  return (
    <div className="h-full overflow-y-auto bg-gradient-to-b from-slate-900/90 to-slate-950 border-l-2 border-red-900/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b-2 border-red-900/50 p-4 flex items-center gap-3 sticky top-0 z-10 backdrop-blur-sm">
        <div className="p-2 bg-red-900/30 rounded-lg border border-red-900/50">
          <BookOpen className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <h2 className="text-slate-100 font-serif text-lg">Detective's Journal</h2>
          <p className="text-slate-500 text-xs">Your investigation notes</p>
        </div>
      </div>

      <div className="divide-y divide-slate-700/30">
        {/* Suspects Section */}
        <CollapsibleSection
          title="Suspects"
          icon={<AlertCircle className="w-4 h-4" />}
          count={suspects.length}
          accentColor="red"
        >
          <div className="space-y-2">
            {suspects.map((suspect, idx) => (
              <div
                key={idx}
                className="suspect-card card-gothic p-3 animate-fadeIn"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-slate-100 font-serif font-semibold">{suspect.name}</p>
                    <p className="text-red-400/80 text-sm">{suspect.occupation}</p>
                  </div>
                </div>
                <p className="text-slate-400 text-xs mt-2 italic leading-relaxed">
                  {suspect.personality}
                </p>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* Locations Section */}
        <CollapsibleSection
          title="Locations"
          icon={<MapPin className="w-4 h-4" />}
          count={rooms.length}
          defaultOpen={false}
          accentColor="amber"
        >
          <div className="grid grid-cols-1 gap-2">
            {rooms.map((room, idx) => (
              <div
                key={idx}
                className="location-chip"
              >
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-slate-300 text-sm">{room}</span>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* Weapons Section */}
        <CollapsibleSection
          title="Potential Weapons"
          icon={<Sword className="w-4 h-4" />}
          count={weapons.length}
          defaultOpen={false}
          accentColor="slate"
        >
          <div className="grid grid-cols-1 gap-2">
            {weapons.map((weapon, idx) => (
              <div
                key={idx}
                className="location-chip"
              >
                <Sword className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-300 text-sm">{weapon}</span>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* Evidence Section */}
        <CollapsibleSection
          title="Evidence Collected"
          icon={<Sparkles className="w-4 h-4" />}
          count={evidence.length}
          accentColor="emerald"
        >
          {evidence.length === 0 ? (
            <div className="text-center py-6">
              <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-500 text-sm italic">No evidence collected yet...</p>
              <p className="text-slate-600 text-xs mt-1">Search the manor to find clues</p>
            </div>
          ) : (
            <div className="space-y-2">
              {evidence.map((item, idx) => (
                <div
                  key={item.id}
                  className="card-gothic p-3 animate-fadeIn"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <p className="text-slate-200 text-sm mb-2 leading-relaxed">{item.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-xs flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {item.location_found}
                    </span>
                    <span
                      className={`badge-evidence ${item.significance === 'high'
                          ? 'badge-high'
                          : item.significance === 'medium'
                            ? 'badge-medium'
                            : 'badge-low'
                        }`}
                    >
                      {item.significance}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CollapsibleSection>
      </div>
    </div>
  );
}

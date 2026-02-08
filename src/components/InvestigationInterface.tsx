import { useState, useEffect, useRef } from 'react';
import { Send, MapPin, Search, Users, Eye } from 'lucide-react';
import { ChatMessage } from '../types/game';

interface InvestigationInterfaceProps {
  currentLocation: string;
  chatHistory: ChatMessage[];
  onSubmitAction: (action: string) => void;
  isProcessing: boolean;
}

const quickActions = [
  { icon: Search, label: 'Search the room', action: 'Search the room for clues' },
  { icon: Eye, label: 'Examine closely', action: 'Examine the surroundings more closely' },
  { icon: Users, label: 'Look for people', action: 'Look around for anyone nearby' },
];

export function InvestigationInterface({
  currentLocation,
  chatHistory,
  onSubmitAction,
  isProcessing,
}: InvestigationInterfaceProps) {
  const [action, setAction] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isProcessing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (action.trim() && !isProcessing) {
      onSubmitAction(action.trim());
      setAction('');
    }
  };

  const handleQuickAction = (actionText: string) => {
    if (!isProcessing) {
      onSubmitAction(actionText);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Location Header */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-800 to-slate-900 border-b-2 border-red-900/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-900/30 rounded-lg border border-red-900/50">
              <MapPin className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <span className="text-slate-400 text-xs uppercase tracking-wider">Current Location</span>
              <h2 className="text-slate-100 font-serif text-xl">{currentLocation}</h2>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="hidden md:flex items-center gap-2">
            {quickActions.map((qa) => (
              <button
                key={qa.label}
                onClick={() => handleQuickAction(qa.action)}
                disabled={isProcessing}
                className="quick-action"
                title={qa.action}
              >
                <qa.icon className="w-3.5 h-3.5" />
                <span>{qa.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-slate-900/80 to-slate-950/90"
      >
        {chatHistory.map((message, index) => (
          <div
            key={message.id}
            className={`p-5 rounded-lg ${message.message_type === 'user_action'
                ? 'message-user bg-slate-700/40 border border-slate-600/50 ml-12 backdrop-blur-sm'
                : message.message_type === 'system'
                  ? 'message-system text-center mx-8'
                  : 'message-ai bg-slate-800/60 border border-slate-700/50 mr-12 backdrop-blur-sm'
              }`}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            {message.message_type === 'user_action' && (
              <div className="flex items-center gap-2 mb-2 text-slate-400 text-xs uppercase tracking-wider">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                Your Action
              </div>
            )}
            {message.message_type === 'ai_response' && (
              <div className="flex items-center gap-2 mb-2 text-slate-400 text-xs uppercase tracking-wider">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                Narrator
              </div>
            )}
            <p className="text-slate-200 leading-relaxed whitespace-pre-wrap font-serif text-base">
              {message.content}
            </p>
          </div>
        ))}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="message-ai bg-slate-800/60 border border-slate-700/50 mr-12 p-5 rounded-lg backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2 text-slate-400 text-xs uppercase tracking-wider">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
              Narrator
            </div>
            <p className="text-slate-400 italic flex items-center gap-1">
              <span>The manor whispers its secrets</span>
              <span className="loading-dots">
                <span>.</span><span>.</span><span>.</span>
              </span>
            </p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Action Input Form */}
      <form onSubmit={handleSubmit} className="bg-slate-800 border-t-2 border-red-900/50 p-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="What do you do? (e.g., 'Search the library for clues' or 'Question the butler')"
              disabled={isProcessing}
              className="w-full input-gothic rounded-lg px-5 py-4
                         text-slate-200 placeholder-slate-500 text-base"
            />
          </div>
          <button
            type="submit"
            disabled={isProcessing || !action.trim()}
            className="btn-gothic px-6 py-4 text-slate-100 rounded-lg
                       disabled:opacity-50 disabled:cursor-not-allowed
                       disabled:transform-none flex items-center gap-2"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Quick Actions */}
        <div className="flex md:hidden items-center gap-2 mt-3 flex-wrap">
          {quickActions.map((qa) => (
            <button
              key={qa.label}
              type="button"
              onClick={() => handleQuickAction(qa.action)}
              disabled={isProcessing}
              className="quick-action"
            >
              <qa.icon className="w-3.5 h-3.5" />
              <span>{qa.label}</span>
            </button>
          ))}
        </div>

        <p className="text-slate-500 text-xs mt-3 italic">
          Try: "Go to the library" | "Examine the fireplace" | "Speak with Lady Blackwood" | "Look for hidden passages"
        </p>
      </form>
    </div>
  );
}

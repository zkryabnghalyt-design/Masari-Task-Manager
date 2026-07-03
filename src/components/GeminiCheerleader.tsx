import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Trophy, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GeminiCheerleaderProps {
  completedCount: number;
  activeCount: number;
  level: number;
  points: number;
  locale: string;
}

export default function GeminiCheerleader({
  completedCount,
  activeCount,
  level,
  points,
  locale
}: GeminiCheerleaderProps) {
  const [motivation, setMotivation] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchMotivation() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/motivation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          completedCount,
          activeCount,
          level,
          points,
          locale
        })
      });
      if (!response.ok) {
        throw new Error('Failed to load motivation quote');
      }
      const data = await response.json();
      setMotivation(data.motivation || 'Keep crushing those tasks!');
    } catch (err) {
      console.error('Error fetching cheerleader quote:', err);
      setError('Upstream request timed out. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Load first motivation quote on mount or when completing tasks
  useEffect(() => {
    fetchMotivation();
  }, [completedCount]);

  return (
    <div id="gemini-cheerleader-widget" className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden mb-6">
      <div className="absolute top-0 right-0 w-24 h-24 bg-pink-50/40 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
      
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <span className="p-1 bg-pink-50 text-pink-600 rounded-lg">✨</span>
          AI Gemini Cheerleader Coach
        </h2>
        <button
          type="button"
          id="cheerleader-refresh-btn"
          onClick={fetchMotivation}
          disabled={loading}
          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
          title="Refresh AI Cheer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-pink-500' : ''}`} />
        </button>
      </div>

      <div className="mt-3 flex gap-3.5 items-start">
        {/* Cute Coach Avatar icon */}
        <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-pink-500 to-rose-500 text-white flex items-center justify-center font-extrabold shadow-sm shadow-pink-100 shrink-0">
          📣
        </div>

        <div className="flex-1 space-y-2">
          <div className="bg-slate-50/70 border border-slate-100/80 px-4 py-3 rounded-2xl rounded-tl-xs relative">
            {/* Speach bubble arrow */}
            <div className="absolute top-0 -left-1.5 w-0 h-0 border-t-[8px] border-t-slate-50 border-r-[8px] border-r-transparent" />
            
            {loading ? (
              <div className="space-y-2 py-1.5 animate-pulse">
                <div className="h-3.5 bg-slate-200 rounded-full w-5/6" />
                <div className="h-3.5 bg-slate-200 rounded-full w-2/3" />
              </div>
            ) : error ? (
              <p className="text-xs text-rose-600 font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                {error}
              </p>
            ) : (
              <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                {motivation}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 font-extrabold uppercase tracking-wider px-1">
            <span>Coach Status: Super Excited</span>
            <span className="flex items-center gap-1 text-pink-500 bg-pink-50 px-2 py-0.5 rounded-full border border-pink-100/50">
              <Trophy className="w-3 h-3" /> Level {level} Companion
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

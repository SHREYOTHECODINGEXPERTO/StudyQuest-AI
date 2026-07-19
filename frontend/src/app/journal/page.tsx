'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { BookOpen, Calendar, Compass, Sparkles, Smile } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function JournalPage() {
  const router = useRouter();
  const { token, updateUser } = useStore();

  const [journals, setJournals] = useState<any[]>([]);
  const [wins, setWins] = useState('');
  const [mistakes, setMistakes] = useState('');
  const [mood, setMood] = useState('cozy');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Auto redirect if token missing
  useEffect(() => {
    if (!token) {
      router.push('/login');
    }
  }, [token]);

  const loadJournals = () => {
    if (token) {
      setLoading(true);
      api.get('/journal')
        .then((res) => {
          setJournals(res);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    loadJournals();
  }, [token]);

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await api.post('/journal', {
        mood,
        wins: wins || undefined,
        mistakes: mistakes || undefined,
      });

      confetti({ particleCount: 60, spread: 40 });
      setMessage('Daily reflection log successfully compiled!');
      setWins('');
      setMistakes('');
      setTimeout(() => setMessage(''), 3000);
      loadJournals(); // reload list

      // Refresh User profile details to reward XP
      const profile = await api.get('/auth/profile');
      updateUser(profile);
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && journals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-cozy-lavender border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-gray-500 mt-2">Opening daily logbooks...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800 dark:text-[#F3EFE6]">Study Journal 📔</h2>
          <p className="text-xs text-gray-500 mt-1">
            Log reflections, track moods, and let the AI Counselor summarize your learning trends.
          </p>
        </div>

        {message && (
          <div className="bg-cozy-mint px-4 py-2 border border-cozy-mint-dark rounded-xl text-xs font-bold animate-pulse text-cozy-mint-deep">
            {message}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* NEW ENTRY COMPILER */}
        <div className="glass-card p-6 lg:col-span-1 h-full">
          <div className="flex items-center space-x-2 mb-4 border-b border-gray-100 dark:border-gray-800 pb-3">
            <Smile className="text-cozy-lavender-deep" size={18} />
            <h3 className="font-bold text-sm text-gray-800 dark:text-[#F3EFE6]">Compile Reflection</h3>
          </div>

          <form onSubmit={handleCreateEntry} className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 font-semibold block mb-1">Today's Mood Status:</label>
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-black/20 focus:outline-none focus:ring-2 focus:ring-cozy-lavender text-xs font-bold text-gray-700"
              >
                <option value="cozy">🌸 Cozy & Relaxed</option>
                <option value="focused">🌲 Highly Focused</option>
                <option value="tired">💤 Exhausted / Sleepy</option>
                <option value="distracted">🌀 Distracted / Procrastinating</option>
                <option value="stressed">⚡ Stressed / Stuck</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 font-semibold block mb-1">Personal Wins (Optional):</label>
              <textarea
                placeholder="What went well? (e.g. Completed loops, focused 20 minutes)"
                value={wins}
                onChange={(e) => setWins(e.target.value)}
                className="w-full p-3 h-20 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-black/20 focus:outline-none focus:ring-2 focus:ring-cozy-lavender text-xs"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 font-semibold block mb-1">Struggles / Friction (Optional):</label>
              <textarea
                placeholder="What felt hard? (e.g. Kept rewatching same video, switched tabs)"
                value={mistakes}
                onChange={(e) => setMistakes(e.target.value)}
                className="w-full p-3 h-20 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-black/20 focus:outline-none focus:ring-2 focus:ring-cozy-lavender text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-cozy-lavender text-cozy-lavender-deep hover:bg-cozy-lavender-dark transition-all rounded-xl font-bold flex items-center justify-center space-x-2 text-xs shadow cursor-pointer"
            >
              <Sparkles size={14} />
              <span>{loading ? 'Analyzing...' : 'Generate AI Summary'}</span>
            </button>
          </form>
        </div>

        {/* HISTORICAL ENTRIES LOGS */}
        <div className="glass-card p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center space-x-2 border-b border-gray-100 dark:border-gray-800 pb-3 mb-4">
            <BookOpen className="text-cozy-peach-deep" size={18} />
            <h3 className="font-bold text-sm text-gray-800 dark:text-[#F3EFE6]">Reflection Logs</h3>
          </div>

          <div className="space-y-6 max-h-[480px] overflow-y-auto pr-2">
            {journals.map((entry) => (
              <div
                key={entry.id}
                className="p-4 bg-white/40 dark:bg-black/20 border border-gray-100 dark:border-gray-800 rounded-2xl space-y-3 cozy-hover"
              >
                <div className="flex items-center justify-between text-xs border-b border-gray-100 dark:border-gray-800 pb-2">
                  <span className="font-bold text-gray-600 dark:text-gray-300 flex items-center">
                    <Calendar size={12} className="mr-1.5" />
                    {new Date(entry.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <span className="bg-cozy-lavender px-2 py-0.5 rounded text-[10px] text-cozy-lavender-deep font-bold capitalize">
                    Mood: {entry.mood}
                  </span>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-gray-700 dark:text-gray-200 leading-relaxed font-semibold">
                    📖 {entry.summary}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-[11px]">
                    {entry.wins && (
                      <div className="p-2.5 bg-cozy-mint/20 rounded-xl">
                        <span className="font-extrabold text-cozy-mint-deep">🌟 Daily Highlights:</span>
                        <p className="text-gray-600 dark:text-gray-300 mt-1 whitespace-pre-line">{entry.wins}</p>
                      </div>
                    )}
                    {entry.mistakes && (
                      <div className="p-2.5 bg-cozy-peach/20 rounded-xl">
                        <span className="font-extrabold text-cozy-peach-deep">🌀 Passive Traps:</span>
                        <p className="text-gray-600 dark:text-gray-300 mt-1 whitespace-pre-line">{entry.mistakes}</p>
                      </div>
                    )}
                  </div>

                  {entry.aiSuggestions && (
                    <div className="p-3 bg-cozy-yellow/20 border border-cozy-yellow rounded-xl text-[11px] text-amber-800 leading-relaxed mt-2">
                      💡 <strong>Counselor Suggestion:</strong>
                      <p className="mt-1 whitespace-pre-line">{entry.aiSuggestions}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {journals.length === 0 && (
              <div className="text-center py-16 text-xs text-gray-400 italic bg-gray-50 dark:bg-black/10 rounded-2xl border border-gray-100 dark:border-gray-800">
                ✏️ Your diary is blank. Reflect on your study session today to start your journey!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

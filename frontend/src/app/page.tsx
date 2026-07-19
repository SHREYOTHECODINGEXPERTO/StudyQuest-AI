'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Play, ClipboardList, BookOpen, Heart, CloudRain, Sun, Compass, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const router = useRouter();
  const { token, user, activeSessionId, logout, updateUser } = useStore();

  const [topics, setTopics] = useState<any[]>([]);
  const [placements, setPlacements] = useState<any[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [mood, setMood] = useState('cozy');
  const [journalSaved, setJournalSaved] = useState(false);
  const [weather, setWeather] = useState<'sunny' | 'rainy' | 'starry'>('sunny');
  const [loading, setLoading] = useState(true);

  // Auto redirect if token missing
  useEffect(() => {
    if (!token) {
      router.push('/login');
    }
  }, [token]);

  // Load Dashboard Data
  useEffect(() => {
    if (token) {
      setLoading(true);
      Promise.all([
        api.get('/topic'),
        api.get('/gamification/placements')
      ])
        .then(([topicsRes, placementsRes]) => {
          setTopics(topicsRes);
          setPlacements(placementsRes);
          if (topicsRes.length > 0) {
            setSelectedTopicId(topicsRes[0].id);
          }
        })
        .catch((err) => {
          console.error(err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [token]);

  // Handle Mood log submission
  const logMood = async (newMood: string) => {
    setMood(newMood);
    try {
      const res = await api.post('/journal', {
        mood: newMood,
        wins: 'Logged in and updated status.',
        mistakes: 'None.',
      });
      setJournalSaved(true);
      
      // Update coins/XP gained from logging journal
      const profile = await api.get('/auth/profile');
      updateUser(profile);
      
      setTimeout(() => setJournalSaved(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartSession = () => {
    if (!selectedTopicId) return;
    router.push(`/session?topicId=${selectedTopicId}`);
  };

  const activePetPlacement = placements.find(p => p.inventoryItem.pet !== null);
  const activeDecorations = placements.filter(p => p.inventoryItem.decoration !== null);

  // Daily Missions mock lists based on database status
  const dailyMissions = [
    { text: 'Start a study session (10 XP)', completed: (user?.sessions?.length || 0) > 0 },
    { text: 'Log a conceptual study topic (10 XP)', completed: topics.length > 0 },
    { text: 'Reflect in study journal today (15 XP)', completed: journalSaved },
    { text: 'Keep focus score above 80% (20 XP)', completed: false },
  ];

  if (loading) {
    return (
      <div className="flex flex-col space-y-4 p-4">
        <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-cozy animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-cozy animate-pulse col-span-2"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-cozy animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER BANNER CARD */}
      <div className="glass-card p-6 relative overflow-hidden bg-gradient-to-r from-cozy-lavender/20 to-cozy-sky/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 dark:text-[#F3EFE6]">
              Welcome back, {user?.username}! 🏡
            </h2>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Your magical study village is blooming nicely. Set your status log below to start!
            </p>
          </div>

          {/* Mood Logging Widget */}
          <div className="bg-white/40 dark:bg-black/20 p-2 rounded-2xl flex items-center space-x-2 border border-white/20">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2">Mood:</span>
            {[
              { label: 'Cozy 🌸', id: 'cozy' },
              { label: 'Tired 💤', id: 'tired' },
              { label: 'Stressed ⚡', id: 'stressed' },
              { label: 'Focused 🌲', id: 'focused' },
            ].map(m => (
              <button
                key={m.id}
                onClick={() => logMood(m.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  mood === m.id
                    ? 'bg-cozy-lavender text-cozy-lavender-deep shadow-cozyInner'
                    : 'hover:bg-white/50 text-gray-600 dark:text-gray-300'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        {journalSaved && (
          <div className="absolute top-2 right-2 bg-cozy-mint px-2 py-1 rounded text-[10px] text-cozy-mint-deep font-bold animate-bounce">
            ✨ Status saved! (+15 XP, +10 Coins)
          </div>
        )}
      </div>

      {/* CORE SPLIT SCREEN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FOREST GRID PREVIEW CONTAINER */}
        <div className="glass-card p-6 lg:col-span-2 flex flex-col justify-between relative min-h-[350px]">
          <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-800 pb-3">
            <div className="flex items-center space-x-2">
              <Compass className="text-cozy-mint-deep" size={20} />
              <h3 className="font-bold text-base text-gray-800 dark:text-[#F3EFE6]">Study Forest Village</h3>
            </div>

            {/* Weather controls */}
            <div className="flex items-center space-x-1.5 bg-gray-100 dark:bg-black/30 px-2 py-1 rounded-xl">
              <button
                onClick={() => setWeather('sunny')}
                className={`p-1.5 rounded-lg ${weather === 'sunny' ? 'bg-white dark:bg-gray-800 text-amber-500 shadow' : 'text-gray-400'}`}
                title="Sunny"
              >
                <Sun size={14} />
              </button>
              <button
                onClick={() => setWeather('rainy')}
                className={`p-1.5 rounded-lg ${weather === 'rainy' ? 'bg-white dark:bg-gray-800 text-blue-500 shadow' : 'text-gray-400'}`}
                title="Rainy"
              >
                <CloudRain size={14} />
              </button>
              <button
                onClick={() => setWeather('starry')}
                className={`p-1.5 rounded-lg ${weather === 'starry' ? 'bg-white dark:bg-gray-800 text-violet-500 shadow' : 'text-gray-400'}`}
                title="Starry Night"
              >
                ⭐
              </button>
            </div>
          </div>

          {/* SVG Tile Grid Canvas */}
          <div
            className={`relative w-full h-[220px] rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-inner flex items-center justify-center transition-all duration-700 ${
              weather === 'sunny'
                ? 'bg-gradient-to-b from-[#E8F5E9] to-[#C8E6C9]'
                : weather === 'rainy'
                ? 'bg-gradient-to-b from-[#D0E2EC] to-[#99B2C4] filter brightness-90'
                : 'bg-gradient-to-b from-[#1C162E] to-[#0A0714]'
            }`}
          >
            {/* Ambient Rain overlay inside village canvas */}
            {weather === 'rainy' && <div className="rain-overlay absolute inset-0 pointer-events-none z-10 opacity-60"></div>}

            {/* Iso Grid Placement drawing */}
            <div className="relative w-[340px] h-[180px] bg-[#B5D6B2]/40 dark:bg-[#273B25]/20 border border-white/20 rounded-full flex items-center justify-center">
              {placements.length > 0 ? (
                <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 p-4">
                  {placements.map((placement, index) => {
                    const item = placement.inventoryItem;
                    const x = placement.x;
                    const y = placement.y;
                    return (
                      <div
                        key={index}
                        className="relative flex items-center justify-center animate-float"
                        style={{
                          gridColumnStart: x + 1,
                          gridRowStart: y + 1,
                          animationDelay: `${index * 0.4}s`
                        }}
                      >
                        {item.pet && (
                          <div
                            className="w-12 h-12"
                            dangerouslySetInnerHTML={{ __html: item.pet.svgContent }}
                            title={`${item.pet.name} (Level ${user?.level})`}
                          />
                        )}
                        {item.decoration && (
                          <div
                            className="w-10 h-10"
                            dangerouslySetInnerHTML={{ __html: item.decoration.svgContent }}
                            title={item.decoration.name}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-xs p-6 text-gray-500 dark:text-gray-400">
                  🍃 Your study meadow is empty.<br/>Go to the <strong>Study Forest</strong> page to place your pet!
                </div>
              )}
            </div>

            {/* Glowing stars if night mode */}
            {weather === 'starry' && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[20%] left-[15%] w-1 h-1 bg-white rounded-full animate-ping"></div>
                <div className="absolute top-[40%] left-[80%] w-1.5 h-1.5 bg-yellow-100 rounded-full animate-pulse"></div>
                <div className="absolute top-[70%] left-[45%] w-1 h-1 bg-white rounded-full animate-ping"></div>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
            <span>🌱 Level {user?.level} Forest Canopy</span>
            <Link href="/village" className="text-cozy-lavender-deep font-bold hover:underline">
              Enter Village Customizer &rarr;
            </Link>
          </div>
        </div>

        {/* SIDE LAUNCHPAD PANEL */}
        <div className="space-y-6">
          {/* QUICK SESSION STARTER */}
          <div className="glass-card p-6 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <BookOpen className="text-cozy-lavender-deep" size={20} />
                <h3 className="font-bold text-base text-gray-800 dark:text-[#F3EFE6]">Active Study Panel</h3>
              </div>

              {topics.length > 0 ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-400 font-semibold block mb-1">Select Study Topic:</label>
                    <select
                      value={selectedTopicId}
                      onChange={(e) => setSelectedTopicId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-black/20 focus:outline-none focus:ring-2 focus:ring-cozy-lavender text-sm"
                    >
                      {topics.map(t => (
                        <option key={t.id} value={t.id}>{t.title} ({t.category})</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleStartSession}
                    className="w-full py-3 bg-cozy-lavender text-cozy-lavender-deep hover:bg-cozy-lavender-dark transition-all rounded-xl font-bold flex items-center justify-center space-x-2 text-sm shadow-cozy cursor-pointer active:scale-95"
                  >
                    <Play size={16} fill="currentColor" />
                    <span>Launch Study Timer</span>
                  </button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-xs text-gray-500">You haven't logged any study topics yet!</p>
                  <Link href="/topics">
                    <button className="mt-3 px-4 py-2 bg-cozy-mint text-cozy-mint-deep hover:bg-cozy-mint-dark rounded-xl font-bold text-xs shadow cursor-pointer">
                      + Create First Topic
                    </button>
                  </Link>
                </div>
              )}
            </div>

            {/* Pet advice speech bubble */}
            <div className="mt-6 p-4 bg-cozy-cream-light dark:bg-black/20 border border-cozy-cream-dark rounded-2xl relative">
              <span className="absolute -top-2 left-6 text-xs bg-cozy-peach px-2 py-0.5 rounded text-cozy-peach-deep font-extrabold animate-bounce">
                Coach Tips ✨
              </span>
              <p className="text-[11px] text-gray-600 dark:text-gray-300 italic mt-1 leading-relaxed">
                "Welcome to the sandbox! Open a topic scheduling box, start the timer and test yourself. If you switch tabs, I will prompt you gently!"
              </p>
              <p className="text-[10px] text-cozy-lavender-deep font-bold text-right mt-2">— Dewy</p>
            </div>
          </div>
        </div>
      </div>

      {/* LOWER GRID: DAILY MISSIONS & STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* DAILY MISSIONS WIDGET */}
        <div className="glass-card p-6">
          <div className="flex items-center space-x-2 mb-4 border-b border-gray-100 dark:border-gray-800 pb-3">
            <ClipboardList className="text-cozy-peach-deep" size={20} />
            <h3 className="font-bold text-base text-gray-800 dark:text-[#F3EFE6]">Daily Study Missions</h3>
          </div>

          <div className="space-y-3">
            {dailyMissions.map((m, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-white/40 dark:bg-black/10 border border-gray-100 dark:border-gray-800 rounded-xl">
                <span className={`text-xs ${m.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                  {m.text}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  m.completed ? 'bg-cozy-mint/40 text-cozy-mint-deep' : 'bg-cozy-peach/20 text-cozy-peach-deep'
                }`}>
                  {m.completed ? 'Completed' : 'Active'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* STUDY LEVEL ACHIEVEMENTS SUMMARY */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-4 border-b border-gray-100 dark:border-gray-800 pb-3">
              <Sparkles className="text-cozy-yellow-deep" size={20} />
              <h3 className="font-bold text-base text-gray-800 dark:text-[#F3EFE6]">Active RPG Village Stats</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-cozy-lavender/20 rounded-2xl text-center">
                <span className="text-2xl">🌱</span>
                <h4 className="text-xs text-gray-500 mt-1">Village Level</h4>
                <p className="text-lg font-bold text-cozy-lavender-deep">{user?.level || 1}</p>
              </div>

              <div className="p-3 bg-cozy-yellow/20 rounded-2xl text-center">
                <span className="text-2xl">🪙</span>
                <h4 className="text-xs text-gray-500 mt-1">Gold Coins</h4>
                <p className="text-lg font-bold text-amber-600 dark:text-amber-300">{user?.coins || 0}</p>
              </div>

              <div className="p-3 bg-cozy-peach/20 rounded-2xl text-center">
                <span className="text-2xl">🔥</span>
                <h4 className="text-xs text-gray-500 mt-1">Active Streak</h4>
                <p className="text-lg font-bold text-orange-500">{user?.streak || 0} Days</p>
              </div>

              <div className="p-3 bg-cozy-sky/20 rounded-2xl text-center">
                <span className="text-2xl">🎒</span>
                <h4 className="text-xs text-gray-500 mt-1">Topics Logged</h4>
                <p className="text-lg font-bold text-blue-500">{topics.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

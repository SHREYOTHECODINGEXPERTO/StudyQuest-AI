'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { api } from '@/lib/api';
import { Volume2, VolumeX, Sun, Moon, LogOut, Compass, Map, BookOpen, BarChart3, Award, Coffee } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const {
    token,
    user,
    soundEnabled,
    theme,
    toggleSound,
    toggleTheme,
    setAuth,
    logout,
  } = useStore();

  const [ambientAudio, setAmbientAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlayingAmbient, setIsPlayingAmbient] = useState(false);

  // Sync profile details on mount or if token changes
  useEffect(() => {
    if (token) {
      api.get('/auth/profile')
        .then((res) => {
          setAuth(token, res);
        })
        .catch(() => {
          logout();
        });
    }
  }, [token]);

  // Sync theme to body element
  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [theme]);

  // Ambient sound system (Keyboard lofi lofi clicks + rain loop using free public sound links)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2448/2448-84.wav'); // forest loop
      audio.loop = true;
      audio.volume = 0.15;
      setAmbientAudio(audio);
    }
  }, []);

  const toggleAmbientSound = () => {
    if (!ambientAudio) return;
    if (isPlayingAmbient) {
      ambientAudio.pause();
      setIsPlayingAmbient(false);
    } else {
      ambientAudio.play().catch(() => {});
      setIsPlayingAmbient(true);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: Compass },
    { name: 'Study Forest', path: '/village', icon: Map },
    { name: 'Topics Logger', path: '/topics', icon: BookOpen },
    { name: 'Quizzes', path: '/quizzes', icon: Award },
    { name: 'Journal', path: '/journal', icon: Coffee },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  ];

  return (
    <html lang="en">
      <head>
        <title>StudyQuest AI - Gamified behavior analyzer</title>
        <meta name="description" content="StudyQuest AI measures HOW you study, tracking distractions, avoidance, and passive reading habits to guide you to educational mastery." />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen pb-16 md:pb-6 font-cozy">
        {/* Floating Particles background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="particle bg-cozy-lavender/30 w-3 h-3 rounded-full left-[10%] top-[40%] animate-float" style={{ animationDelay: '0s' }}></div>
          <div className="particle bg-cozy-mint/40 w-4 h-4 rounded-full left-[30%] top-[80%] animate-float" style={{ animationDelay: '2s' }}></div>
          <div className="particle bg-cozy-peach/30 w-3.5 h-3.5 rounded-full left-[75%] top-[20%] animate-float" style={{ animationDelay: '4s' }}></div>
          <div className="particle bg-cozy-yellow/50 w-2.5 h-2.5 rounded-full left-[90%] top-[60%] animate-float" style={{ animationDelay: '1s' }}></div>
        </div>

        {/* Rain overlay if ambient sound is playing */}
        {isPlayingAmbient && <div className="rain-overlay fixed inset-0 pointer-events-none z-10 opacity-70"></div>}

        {token && user ? (
          <div className="relative z-20 flex flex-col min-h-screen">
            {/* TOP HEADER */}
            <header className="mx-4 mt-4 glass-card px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-cozy-lavender rounded-full flex items-center justify-center font-bold text-cozy-lavender-deep text-lg animate-float">
                  🌱
                </div>
                <div>
                  <h1 className="font-bold text-base md:text-lg text-gray-800 dark:text-[#F3EFE6]">StudyQuest AI</h1>
                  <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">Village Level {user.level}</p>
                </div>
              </div>

              {/* Status Stats bar */}
              <div className="flex items-center space-x-4 md:space-x-8">
                {/* Level Progress */}
                <div className="hidden md:flex flex-col items-end w-32">
                  <span className="text-[10px] text-gray-500">XP: {user.xp} / {user.level * 150}</span>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden mt-1">
                    <div
                      className="bg-cozy-lavender-dark h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (user.xp / (user.level * 150)) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Coins */}
                <div className="flex items-center space-x-1.5 bg-cozy-yellow/30 px-3 py-1.5 rounded-full text-cozy-peach-deep font-bold text-xs md:text-sm animate-pulse-slow">
                  🪙 <span className="text-amber-600 dark:text-amber-300">{user.coins}</span>
                </div>

                {/* Streak */}
                <div className="flex items-center space-x-1.5 bg-cozy-peach/30 px-3 py-1.5 rounded-full text-cozy-peach-deep font-bold text-xs md:text-sm">
                  🔥 <span className="text-orange-500 dark:text-orange-300">{user.streak} days</span>
                </div>

                {/* System Toggles */}
                <div className="flex items-center space-x-1 md:space-x-2">
                  <button
                    onClick={toggleAmbientSound}
                    className={`p-2 rounded-full hover:bg-cozy-cream-dark transition-colors ${isPlayingAmbient ? 'bg-cozy-sky/40 text-blue-600' : 'text-gray-500'}`}
                    title="Toggle cozy background lofi"
                  >
                    {isPlayingAmbient ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  </button>

                  <button
                    onClick={toggleTheme}
                    className="p-2 text-gray-500 hover:bg-cozy-cream-dark rounded-full transition-colors"
                  >
                    {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                  </button>

                  <button
                    onClick={logout}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full transition-colors"
                    title="Logout"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </div>
            </header>

            {/* MAIN APP CONTAINER */}
            <div className="flex-1 flex flex-col md:flex-row p-4 gap-4">
              {/* SIDEBAR NAVIGATION - DESKTOP */}
              <aside className="hidden md:flex w-64 glass-card p-4 flex-col justify-between">
                <nav className="flex flex-col space-y-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.path;
                    return (
                      <Link key={item.path} href={item.path}>
                        <div
                          className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 cozy-hover cursor-pointer ${
                            isActive
                              ? 'bg-cozy-lavender text-cozy-lavender-deep font-bold shadow-cozyInner'
                              : 'text-gray-600 dark:text-gray-300 hover:bg-cozy-cream'
                          }`}
                        >
                          <Icon size={18} />
                          <span className="text-sm">{item.name}</span>
                        </div>
                      </Link>
                    );
                  })}
                </nav>

                <div className="mt-8 p-3 bg-cozy-mint/20 border border-cozy-mint rounded-xl text-center">
                  <p className="text-[11px] text-cozy-mint-deep font-medium">🌿 Active Recall Loop</p>
                  <p className="text-[10px] text-gray-500 mt-1">Study and watch your magical village grow flowers!</p>
                </div>
              </aside>

              {/* CORE CONTENT */}
              <main className="flex-1 overflow-y-auto">
                {children}
              </main>
            </div>

            {/* BOTTOM NAV BAR - MOBILE ONLY */}
            <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/90 dark:bg-[#1A1813]/90 border-t border-gray-100 dark:border-gray-800 flex items-center justify-around z-30 md:hidden px-2 backdrop-blur-md">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;
                return (
                  <Link key={item.path} href={item.path} className="flex flex-col items-center justify-center flex-1 py-1">
                    <div className={`p-1.5 rounded-full ${isActive ? 'text-cozy-lavender-deep' : 'text-gray-400'}`}>
                      <Icon size={18} />
                    </div>
                    <span className={`text-[9px] ${isActive ? 'text-cozy-lavender-deep font-bold' : 'text-gray-500'}`}>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        ) : (
          /* AUTH LOGIN SCREEN */
          <div className="relative z-20 min-h-screen">
            {children}
          </div>
        )}
      </body>
    </html>
  );
}

'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useStore } from '@/store/useStore';
import { api } from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import { Play, Pause, Square, AlertCircle, Volume2, Sparkles, BookOpen, Video, Plus, Smile } from 'lucide-react';
import confetti from 'canvas-confetti';

function ActiveSession() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const topicId = searchParams.get('topicId');

  const {
    token,
    activeSessionId,
    duration,
    breaksCount,
    videosOpened,
    notesOpened,
    revisitsCount,
    problemsAttempted,
    idleTime,
    tabSwitches,
    distractionsCount,
    focusScore,
    isTimerRunning,
    startSessionStore,
    updateTelemetry,
    incrementDuration,
    incrementTabSwitches,
    incrementIdleTime,
    incrementBreaks,
    incrementNotesOpened,
    incrementVideosOpened,
    incrementRevisits,
    incrementProblemsAttempted,
    incrementDistractions,
    resetSessionStore,
    updateUser,
  } = useStore();

  const [topic, setTopic] = useState<any>(null);
  const [sessionNotes, setSessionNotes] = useState<any[]>([]);
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [activeTabAlert, setActiveTabAlert] = useState(false);
  const [sessionResult, setSessionResult] = useState<any>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Sound ref for pomodoro tick
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Auto redirect if token missing
  useEffect(() => {
    if (!token) {
      router.push('/login');
    }
  }, [token]);

  // Load topic notes
  useEffect(() => {
    if (token && topicId) {
      setLoading(true);
      api.get('/topic')
        .then((res: any[]) => {
          const matchingTopic = res.find(t => t.id === topicId);
          if (matchingTopic) {
            setTopic(matchingTopic);
            setSessionNotes(matchingTopic.notes || []);
            if (matchingTopic.notes?.length > 0) {
              setSelectedNote(matchingTopic.notes[0]);
            }
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [token, topicId]);

  // Initialize/start the session row in DB
  useEffect(() => {
    if (token && topicId && !activeSessionId) {
      api.post('/session/start', { topicId })
        .then((res) => {
          startSessionStore(res.id, topicId);
        })
        .catch(console.error);
    }
  }, [token, topicId]);

  // Telemetry: track tab switching (blur/focus events)
  useEffect(() => {
    const handleBlur = () => {
      if (isTimerRunning && activeSessionId) {
        incrementTabSwitches();
        setActiveTabAlert(true);
        // Play small alert beep
        try {
          const beep = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav');
          beep.volume = 0.1;
          beep.play();
        } catch {}
        setTimeout(() => setActiveTabAlert(false), 5000);
      }
    };

    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [isTimerRunning, activeSessionId]);

  // Telemetry: track idle time (mousemove, keypress)
  useEffect(() => {
    const handleInteraction = () => {
      lastActivityRef.current = Date.now();
    };

    window.addEventListener('mousemove', handleInteraction);
    window.addEventListener('keypress', handleInteraction);

    return () => {
      window.removeEventListener('mousemove', handleInteraction);
      window.removeEventListener('keypress', handleInteraction);
    };
  }, []);

  // Timer tick & Idle scanner loop (runs every second)
  useEffect(() => {
    if (isTimerRunning && activeSessionId) {
      timerIntervalRef.current = setInterval(() => {
        // Increment duration timer
        incrementDuration();

        // Check if user is idle (no activity for 12 seconds)
        const idleDuration = Date.now() - lastActivityRef.current;
        if (idleDuration > 12000) {
          incrementIdleTime(1);
        }

        // Periodic auto-save telemetry to DB every 20 seconds
        if (duration > 0 && duration % 20 === 0) {
          api.patch(`/session/${activeSessionId}`, {
            duration,
            breaksCount,
            videosOpened,
            notesOpened,
            revisitsCount,
            problemsAttempted,
            idleTime,
            tabSwitches,
            distractionsCount,
          }).catch(console.error);
        }
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [
    isTimerRunning,
    activeSessionId,
    duration,
    breaksCount,
    videosOpened,
    notesOpened,
    revisitsCount,
    problemsAttempted,
    idleTime,
    tabSwitches,
    distractionsCount,
  ]);

  const handlePauseToggle = () => {
    if (isTimerRunning) {
      updateTelemetry({ isTimerRunning: false });
      incrementBreaks();
    } else {
      updateTelemetry({ isTimerRunning: true });
    }
  };

  const handleEndSession = async () => {
    if (!activeSessionId) return;
    updateTelemetry({ isTimerRunning: false });

    try {
      const res = await api.post(`/session/${activeSessionId}/end`);
      setSessionResult(res);
      setShowResultModal(true);

      // Trigger Confetti!
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });

      // Fetch fresh profile state to sync coins & levels
      const profile = await api.get('/auth/profile');
      updateUser(profile);
      
      resetSessionStore();
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-cozy-lavender border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-gray-500 mt-2">Entering study portal...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Tab Alert Notification */}
      {activeTabAlert && (
        <div className="bg-cozy-peach border border-cozy-peach-dark px-4 py-3 rounded-2xl flex items-center justify-between text-cozy-peach-deep font-bold text-xs animate-bounce z-40 fixed top-6 left-1/2 -translate-x-1/2 w-[340px] shadow-cozy">
          <div className="flex items-center space-x-2">
            <AlertCircle size={16} />
            <span>Companion Bramble warns: Tab switched!</span>
          </div>
          <span className="text-[10px] text-gray-500 font-normal">Focus decreased</span>
        </div>
      )}

      {/* TOP BAR / FOCUS CONTROLLER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* THE POMODORO TIMER PANEL */}
        <div className="glass-card p-6 flex flex-col items-center justify-center text-center relative overflow-hidden bg-gradient-to-br from-white/90 to-cozy-lavender/10">
          <h3 className="text-xs text-gray-400 font-extrabold uppercase tracking-widest mb-1">Focus Timer</h3>
          <div className="text-5xl font-black text-gray-800 dark:text-[#F3EFE6] font-mono tracking-tight my-4">
            {formatTime(duration)}
          </div>

          <div className="flex items-center space-x-3 mt-2">
            <button
              onClick={handlePauseToggle}
              className={`p-3.5 rounded-full shadow transition-all active:scale-95 ${
                isTimerRunning ? 'bg-amber-500 text-white' : 'bg-cozy-lavender text-cozy-lavender-deep'
              }`}
            >
              {isTimerRunning ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
            </button>

            <button
              onClick={handleEndSession}
              className="p-3.5 bg-red-500 text-white rounded-full shadow hover:bg-red-600 transition-all active:scale-95"
              title="Complete study session"
            >
              <Square size={18} fill="currentColor" />
            </button>
          </div>

          <div className="mt-6 w-full grid grid-cols-3 gap-2 border-t border-gray-100 dark:border-gray-800 pt-4 text-center">
            <div>
              <span className="text-[10px] text-gray-400 block">Focus Score</span>
              <span className="text-sm font-bold text-cozy-lavender-deep">{focusScore}%</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block">Tab Switches</span>
              <span className="text-sm font-bold text-cozy-peach-deep">{tabSwitches}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block">Idle Seconds</span>
              <span className="text-sm font-bold text-gray-500">{idleTime}s</span>
            </div>
          </div>
        </div>

        {/* STUDY CONTROLS AND MULTI-MEDIA LOGGING SIMULATORS */}
        <div className="glass-card p-6 lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-gray-800 dark:text-[#F3EFE6] mb-1">Study Telemetry Logging Panel</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              StudyQuest AI measures behavioral actions. Interact with these widgets to record active vs passive learning loops.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => {
                  incrementNotesOpened();
                  // Play book sweep sound
                  try {
                    new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav').play();
                  } catch {}
                }}
                className="p-4 bg-cozy-lavender/20 border border-cozy-lavender/40 hover:bg-cozy-lavender/30 transition-all rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer active:scale-95"
              >
                <BookOpen size={24} className="text-cozy-lavender-deep mb-2" />
                <span className="text-xs font-bold text-gray-700 dark:text-[#F3EFE6]">Review Notes</span>
                <span className="text-[10px] text-gray-400 mt-0.5">Logged: {notesOpened} times</span>
              </button>

              <button
                onClick={() => {
                  incrementVideosOpened();
                }}
                className="p-4 bg-cozy-sky/20 border border-cozy-sky/40 hover:bg-cozy-sky/30 transition-all rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer active:scale-95"
              >
                <Video size={24} className="text-cozy-sky-deep mb-2" />
                <span className="text-xs font-bold text-gray-700 dark:text-[#F3EFE6]">Watch Lecture</span>
                <span className="text-[10px] text-gray-400 mt-0.5">Watched: {videosOpened} times</span>
              </button>

              <button
                onClick={() => {
                  incrementProblemsAttempted();
                  confetti({ particleCount: 20, spread: 30, origin: { x: 0.5, y: 0.5 } });
                }}
                className="p-4 bg-cozy-mint/20 border border-cozy-mint/40 hover:bg-cozy-mint/30 transition-all rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer active:scale-95"
              >
                <Plus size={24} className="text-cozy-mint-deep mb-2" />
                <span className="text-xs font-bold text-gray-700 dark:text-[#F3EFE6]">Solve Problem</span>
                <span className="text-[10px] text-gray-400 mt-0.5">Attempted: {problemsAttempted}</span>
              </button>

              <button
                onClick={() => {
                  incrementDistractions();
                }}
                className="p-4 bg-cozy-peach/20 border border-cozy-peach/40 hover:bg-cozy-peach/30 transition-all rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer active:scale-95"
              >
                <Smile size={24} className="text-cozy-peach-deep mb-2" />
                <span className="text-xs font-bold text-gray-700 dark:text-[#F3EFE6]">"I'm Stuck!"</span>
                <span className="text-[10px] text-gray-400 mt-0.5">Struggled: {distractionsCount}</span>
              </button>
            </div>
          </div>

          <div className="mt-4 p-3 bg-cozy-yellow/20 border border-cozy-yellow rounded-xl flex items-center space-x-2 text-xs text-amber-700">
            <span>💡</span>
            <p>
              Avoidance flag starts if you review notes/watch videos repeatedly without solving problems.
            </p>
          </div>
        </div>
      </div>

      {/* LOWER NOTES CONTENT AREA */}
      {topic && (
        <div className="glass-card p-6">
          <div className="flex items-center space-x-2 mb-4 border-b border-gray-100 dark:border-gray-800 pb-3">
            <BookOpen className="text-cozy-lavender-deep" size={20} />
            <h3 className="font-bold text-base text-gray-800 dark:text-[#F3EFE6]">{topic.title} Study Material</h3>
          </div>

          {sessionNotes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Note titles list */}
              <div className="space-y-2 md:col-span-1 border-r border-gray-100 dark:border-gray-800 pr-4">
                {sessionNotes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => {
                      setSelectedNote(note);
                      incrementRevisits();
                    }}
                    className={`p-3 rounded-xl cursor-pointer text-xs font-bold transition-all ${
                      selectedNote?.id === note.id
                        ? 'bg-cozy-lavender text-cozy-lavender-deep'
                        : 'hover:bg-gray-100 dark:hover:bg-black/30'
                    }`}
                  >
                    📄 {note.title}
                  </div>
                ))}
              </div>

              {/* Note Content display */}
              <div className="md:col-span-3 prose dark:prose-invert max-w-none text-sm p-4 bg-white/40 dark:bg-black/10 rounded-2xl min-h-[160px] border border-gray-100 dark:border-gray-800">
                {selectedNote ? (
                  <div>
                    <h4 className="font-bold text-gray-800 dark:text-[#F3EFE6] mb-2">{selectedNote.title}</h4>
                    <p className="whitespace-pre-wrap leading-relaxed">{selectedNote.content}</p>
                  </div>
                ) : (
                  <p className="text-gray-400 italic">No notes created for this topic.</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-500 italic text-center py-6">
              No study materials attached to this topic. Go to Topics tab to create one.
            </p>
          )}
        </div>
      )}

      {/* SESSION RESULTS DIAGNOSIS MODAL */}
      {showResultModal && sessionResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl glass-card p-6 text-center max-h-[90vh] overflow-y-auto relative animate-float">
            <h2 className="text-3xl font-black text-gray-800 dark:text-[#F3EFE6]">Study Session Finalized! 🌟</h2>
            <p className="text-xs text-gray-400 mt-1">AI Behavior Analysis Diagnosed</p>

            {/* Diagnostics Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
              <div className="p-3 bg-cozy-lavender/20 rounded-2xl">
                <span className="text-xs text-gray-500">Knowledge Gap</span>
                <p className="text-lg font-bold text-cozy-lavender-deep">{sessionResult.report?.knowledgeGapScore}%</p>
              </div>
              <div className="p-3 bg-cozy-peach/20 rounded-2xl">
                <span className="text-xs text-gray-500">Avoidance</span>
                <p className="text-lg font-bold text-cozy-peach-deep">{sessionResult.report?.avoidanceScore}%</p>
              </div>
              <div className="p-3 bg-cozy-mint/20 rounded-2xl">
                <span className="text-xs text-gray-500">Passive Learning</span>
                <p className="text-lg font-bold text-cozy-mint-deep">{sessionResult.report?.passiveLearningScore}%</p>
              </div>
              <div className="p-3 bg-cozy-sky/20 rounded-2xl">
                <span className="text-xs text-gray-500">Motivation Drop</span>
                <p className="text-lg font-bold text-blue-500">{sessionResult.report?.motivationDropScore}%</p>
              </div>
            </div>

            {/* Summary dialogue bubble */}
            <div className="p-4 bg-cozy-cream-light dark:bg-black/20 border border-cozy-cream-dark rounded-3xl text-left my-4 relative">
              <span className="text-[10px] bg-cozy-lavender text-cozy-lavender-deep font-extrabold px-2 py-0.5 rounded absolute -top-2 left-6">
                AI Behavior Diagnosis
              </span>
              <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">
                {sessionResult.report?.reportSummary}
              </p>
            </div>

            {/* Coaching advice bubble */}
            <div className="p-4 bg-cozy-mint/10 border border-cozy-mint rounded-3xl text-left my-4 relative">
              <span className="text-[10px] bg-cozy-mint text-cozy-mint-deep font-extrabold px-2 py-0.5 rounded absolute -top-2 left-6">
                Coaching Intervention
              </span>
              <div
                className="text-xs text-gray-700 dark:text-gray-300 mt-1 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: sessionResult.report?.coachingAdvice || '' }}
              />
            </div>

            {/* Loot bag rewards */}
            <div className="flex justify-center space-x-6 py-4 bg-gray-50 dark:bg-black/30 rounded-2xl border border-gray-100 dark:border-gray-800 my-4">
              <div className="text-center">
                <span className="text-2xl block">🪙</span>
                <span className="text-xs text-gray-500 block">Gold Coins</span>
                <span className="text-sm font-bold text-amber-600 dark:text-amber-300">+{sessionResult.rewards?.coinsGained}</span>
              </div>
              <div className="text-center">
                <span className="text-2xl block">🌱</span>
                <span className="text-xs text-gray-500 block">XP Gained</span>
                <span className="text-sm font-bold text-cozy-lavender-deep">+{sessionResult.rewards?.xpGained}</span>
              </div>
            </div>

            {sessionResult.rewards?.leveledUp && (
              <div className="my-4 p-3 bg-cozy-yellow border border-cozy-yellow-dark rounded-xl text-sm text-amber-700 font-extrabold animate-bounce">
                🎉 LEVEL UP! You progressed to Village Level {sessionResult.rewards?.currentLevel}! (+Unlockable slots!)
              </div>
            )}

            <button
              onClick={() => {
                setShowResultModal(false);
                router.push('/');
              }}
              className="mt-4 px-6 py-2.5 bg-cozy-lavender text-cozy-lavender-deep hover:bg-cozy-lavender-dark transition-all rounded-xl font-bold text-sm shadow cursor-pointer"
            >
              Return to Village Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ActiveSessionPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-cozy-lavender border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-gray-500 mt-2">Entering study portal...</p>
      </div>
    }>
      <ActiveSession />
    </Suspense>
  );
}


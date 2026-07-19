import { create } from 'zustand';

interface TelemetryState {
  activeSessionId: string | null;
  activeTopicId: string | null;
  duration: number; // in seconds
  breaksCount: number;
  videosOpened: number;
  notesOpened: number;
  revisitsCount: number;
  problemsAttempted: number;
  idleTime: number;
  tabSwitches: number;
  distractionsCount: number;
  focusScore: number;
  isTimerRunning: boolean;
}

interface UserState {
  token: string | null;
  user: any | null;
  soundEnabled: boolean;
  theme: 'light' | 'dark';
}

interface StoreState extends TelemetryState, UserState {
  setAuth: (token: string, user: any) => void;
  updateUser: (user: any) => void;
  logout: () => void;
  toggleSound: () => void;
  toggleTheme: () => void;

  startSessionStore: (sessionId: string, topicId: string) => void;
  updateTelemetry: (data: Partial<TelemetryState>) => void;
  incrementDuration: () => void;
  incrementTabSwitches: () => void;
  incrementIdleTime: (amount: number) => void;
  incrementBreaks: () => void;
  incrementNotesOpened: () => void;
  incrementVideosOpened: () => void;
  incrementRevisits: () => void;
  incrementProblemsAttempted: () => void;
  incrementDistractions: () => void;
  resetSessionStore: () => void;
}

export const useStore = create<StoreState>((set) => {
  // Load token & user from localStorage safely in SSR context
  let initialToken = null;
  let initialUser = null;
  let initialSound = true;
  let initialTheme: 'light' | 'dark' = 'light';

  if (typeof window !== 'undefined') {
    initialToken = localStorage.getItem('studyquest_token');
    try {
      initialUser = JSON.parse(localStorage.getItem('studyquest_user') || 'null');
      initialSound = localStorage.getItem('studyquest_sound') !== 'false';
      initialTheme = (localStorage.getItem('studyquest_theme') as 'light' | 'dark') || 'light';
    } catch {
      // ignore
    }
  }

  return {
    // Auth & settings
    token: initialToken,
    user: initialUser,
    soundEnabled: initialSound,
    theme: initialTheme,

    // Active Study Telemetry
    activeSessionId: null,
    activeTopicId: null,
    duration: 0,
    breaksCount: 0,
    videosOpened: 0,
    notesOpened: 0,
    revisitsCount: 0,
    problemsAttempted: 0,
    idleTime: 0,
    tabSwitches: 0,
    distractionsCount: 0,
    focusScore: 100,
    isTimerRunning: false,

    setAuth: (token, user) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('studyquest_token', token);
        localStorage.setItem('studyquest_user', JSON.stringify(user));
      }
      set({ token, user });
    },

    updateUser: (user) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('studyquest_user', JSON.stringify(user));
      }
      set({ user });
    },

    logout: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('studyquest_token');
        localStorage.removeItem('studyquest_user');
      }
      set({ token: null, user: null, activeSessionId: null, isTimerRunning: false });
    },

    toggleSound: () => set((state) => {
      const nextSound = !state.soundEnabled;
      if (typeof window !== 'undefined') {
        localStorage.setItem('studyquest_sound', String(nextSound));
      }
      return { soundEnabled: nextSound };
    }),

    toggleTheme: () => set((state) => {
      const nextTheme = state.theme === 'light' ? 'dark' : 'light';
      if (typeof window !== 'undefined') {
        localStorage.setItem('studyquest_theme', nextTheme);
      }
      return { theme: nextTheme };
    }),

    // Telemetry mutations
    startSessionStore: (sessionId, topicId) => set({
      activeSessionId: sessionId,
      activeTopicId: topicId,
      duration: 0,
      breaksCount: 0,
      videosOpened: 0,
      notesOpened: 0,
      revisitsCount: 0,
      problemsAttempted: 0,
      idleTime: 0,
      tabSwitches: 0,
      distractionsCount: 0,
      focusScore: 100,
      isTimerRunning: true,
    }),

    updateTelemetry: (data) => set((state) => ({ ...state, ...data })),

    incrementDuration: () => set((state) => ({ duration: state.duration + 1 })),
    
    incrementTabSwitches: () => set((state) => {
      const nextSwitches = state.tabSwitches + 1;
      const penalty = (nextSwitches * 5) + (state.breaksCount * 5) + (state.distractionsCount * 6) + ((state.idleTime / (state.duration + 1)) * 50);
      const computedFocus = Math.max(10, Math.min(100, Math.round(100 - penalty)));
      return { tabSwitches: nextSwitches, focusScore: computedFocus };
    }),

    incrementIdleTime: (amount) => set((state) => {
      const nextIdle = state.idleTime + amount;
      const penalty = (state.tabSwitches * 5) + (state.breaksCount * 5) + (state.distractionsCount * 6) + ((nextIdle / (state.duration + 1)) * 50);
      const computedFocus = Math.max(10, Math.min(100, Math.round(100 - penalty)));
      return { idleTime: nextIdle, focusScore: computedFocus };
    }),

    incrementBreaks: () => set((state) => {
      const nextBreaks = state.breaksCount + 1;
      const penalty = (state.tabSwitches * 5) + (nextBreaks * 5) + (state.distractionsCount * 6) + ((state.idleTime / (state.duration + 1)) * 50);
      const computedFocus = Math.max(10, Math.min(100, Math.round(100 - penalty)));
      return { breaksCount: nextBreaks, focusScore: computedFocus };
    }),

    incrementNotesOpened: () => set((state) => ({ notesOpened: state.notesOpened + 1 })),
    incrementVideosOpened: () => set((state) => ({ videosOpened: state.videosOpened + 1 })),
    incrementRevisits: () => set((state) => ({ revisitsCount: state.revisitsCount + 1 })),
    incrementProblemsAttempted: () => set((state) => ({ problemsAttempted: state.problemsAttempted + 1 })),
    
    incrementDistractions: () => set((state) => {
      const nextDistractions = state.distractionsCount + 1;
      const penalty = (state.tabSwitches * 5) + (state.breaksCount * 5) + (nextDistractions * 6) + ((state.idleTime / (state.duration + 1)) * 50);
      const computedFocus = Math.max(10, Math.min(100, Math.round(100 - penalty)));
      return { distractionsCount: nextDistractions, focusScore: computedFocus };
    }),

    resetSessionStore: () => set({
      activeSessionId: null,
      activeTopicId: null,
      duration: 0,
      breaksCount: 0,
      videosOpened: 0,
      notesOpened: 0,
      revisitsCount: 0,
      problemsAttempted: 0,
      idleTime: 0,
      tabSwitches: 0,
      distractionsCount: 0,
      focusScore: 100,
      isTimerRunning: false,
    }),
  };
});

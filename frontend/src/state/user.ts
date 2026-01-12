import { create } from "zustand";
import { api } from "../utils/api";
import { completedToHistory, isoToDbDate, calculateStreak } from "../shared/dateUtils";

// Theme colors matching the new design
export type ThemeColor = "ORANGE" | "BLUE" | "GREEN" | "YELLOW";

// Completion detail type
export type CompletionDetail = {
  day: string;
  notes: string | null;
};

// Original habit type (DB/API format) - for classic design compatibility
export type Habit = {
  id: string;
  name: string;
  description?: string | null;
  theme?: ThemeColor;
  emoji?: string | null;
  completed: string[];
  completionDetails?: CompletionDetail[];
  created?: number;
};

// New design habit type (UI format) - with converted dates
export type NewDesignHabit = {
  id: string;
  title: string; // alias for name
  description: string | null;
  theme: ThemeColor;
  emoji: string | null;
  history: Record<string, boolean>;
  completionDetails: CompletionDetail[];
  streak: number;
  createdAt: number;
};

type Store = {
  loaded?: boolean;
  id?: string;
  created?: number;
  habits?: Habit[];

  // Classic design actions
  deleteHabit: (id: string) => void;
  createHabit: (name?: string, theme?: ThemeColor) => void;
  renameHabit: (id: string, name: string) => void;
  updateUserInfo: () => void;

  // New design actions
  updateTheme: (id: string, theme: ThemeColor) => void;
  logHabit: (id: string, day: string) => void;
  unlogHabit: (id: string, day: string) => void;
};

// Convert habit from API format to new design format
export function toNewDesignHabit(habit: Habit): NewDesignHabit {
  return {
    id: habit.id,
    title: habit.name,
    description: habit.description || null,
    theme: habit.theme || "ORANGE",
    emoji: habit.emoji || null,
    history: completedToHistory(habit.completed),
    completionDetails: habit.completionDetails || [],
    streak: calculateStreak(completedToHistory(habit.completed)),
    createdAt: habit.created || Date.now(),
  };
}

// Selector to get habits in new design format
export function useNewDesignHabits(): NewDesignHabit[] {
  const habits = useUser((state) => state.habits);
  return (habits || []).map(toNewDesignHabit);
}

export const useUser = create<Store>()((set, get) => ({
  loaded: false,

  deleteHabit: async (id) => {
    const req = await api.post("/habits/delete", {
      id,
    });

    if (req?.habits) {
      set((state) => ({ ...state, ...req, loaded: true }));
    }
  },

  createHabit: async (name, theme = "ORANGE") => {
    const req = await api.post("/habits/create", {
      name: name,
      theme: theme,
    });

    if (req?.habits) {
      set((state) => ({ ...state, ...req, loaded: true }));
    }
  },

  renameHabit: async (id, name) => {
    const req = await api.post("/habits/rename", {
      id,
      name,
    });

    if (req?.habits) {
      set((state) => ({ ...state, ...req, loaded: true }));
    }
  },

  updateUserInfo: async () => {
    const info = await api.get("/habits");

    if (info?.habits) {
      set((state) => ({ ...state, ...info, loaded: true }));
      console.log(info);
    }
  },

  updateTheme: async (id, theme) => {
    const req = await api.post("/habits/update-theme", {
      id,
      theme,
    });

    if (req?.habits) {
      set((state) => ({ ...state, ...req, loaded: true }));
    }
  },

  logHabit: async (id, day) => {
    // Optimistic update
    const habits = get().habits;
    if (habits) {
      const dbDay = isoToDbDate(day);
      const optimisticHabits = habits.map((h) =>
        h.id === id && !h.completed.includes(dbDay)
          ? { ...h, completed: [...h.completed, dbDay] }
          : h
      );
      set({ habits: optimisticHabits });
    }

    // API call
    await api.post("/habits/log", {
      id,
      day: isoToDbDate(day),
    });
  },

  unlogHabit: async (id, day) => {
    // Optimistic update
    const habits = get().habits;
    if (habits) {
      const dbDay = isoToDbDate(day);
      const optimisticHabits = habits.map((h) =>
        h.id === id
          ? { ...h, completed: h.completed.filter((d) => d !== dbDay) }
          : h
      );
      set({ habits: optimisticHabits });
    }

    // API call
    await api.post("/habits/unlog", {
      id,
      day: isoToDbDate(day),
    });
  },
}));

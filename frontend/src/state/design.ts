import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DesignMode = "classic" | "new";
export type ViewMode = "habits" | "calendar";

type DesignStore = {
  design: DesignMode;
  view: ViewMode;
  hiddenHabits: string[]; // Array of habit IDs that are hidden
  setDesign: (design: DesignMode) => void;
  setView: (view: ViewMode) => void;
  toggleDesign: () => void;
  toggleView: () => void;
  toggleHabitHidden: (habitId: string) => void;
  isHabitHidden: (habitId: string) => boolean;
};

export const useDesign = create<DesignStore>()(
  persist(
    (set, get) => ({
      design: "new",
      view: "habits",
      hiddenHabits: [],

      setDesign: (design) => set({ design }),
      setView: (view) => set({ view }),

      toggleDesign: () =>
        set((state) => ({
          design: state.design === "classic" ? "new" : "classic",
        })),

      toggleView: () =>
        set((state) => ({
          view: state.view === "habits" ? "calendar" : "habits",
        })),

      toggleHabitHidden: (habitId) =>
        set((state) => ({
          hiddenHabits: state.hiddenHabits.includes(habitId)
            ? state.hiddenHabits.filter((id) => id !== habitId)
            : [...state.hiddenHabits, habitId],
        })),

      isHabitHidden: (habitId) => get().hiddenHabits.includes(habitId),
    }),
    {
      name: "habits-design-preference",
    }
  )
);

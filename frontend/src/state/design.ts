import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DesignMode = "classic" | "new";
export type ViewMode = "habits" | "calendar";

type DesignStore = {
  design: DesignMode;
  view: ViewMode;
  setDesign: (design: DesignMode) => void;
  setView: (view: ViewMode) => void;
  toggleDesign: () => void;
  toggleView: () => void;
};

export const useDesign = create<DesignStore>()(
  persist(
    (set) => ({
      design: "new",
      view: "habits",

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
    }),
    {
      name: "habits-design-preference",
    }
  )
);

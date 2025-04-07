import { create } from "zustand";
import { api } from "../utils/api";

export type Habit = {
  id: string;
  name: string;
  completed: string[];
  created?: number;
};

type Store = {
  loaded?: boolean;
  id?: string;
  created?: number;
  habits?: Habit[];

  deleteHabit: (id: string) => void;
  createHabit: (name?: string) => void;
  renameHabit: (id: string, name: string) => void;
  updateUserInfo: () => void;
};

export const useUser = create<Store>()((set) => ({
  loaded: false,

  deleteHabit: async (id) => {
    const req = await api.post("/habits/delete", {
      id,
    });

    if (req?.habits) {
      set((state) => ({ ...state, ...req, loaded: true }));
    }
  },

  createHabit: async (name) => {
    const req = await api.post("/habits/create", {
      name: name,
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
    }
  },
}));

import { useState, useEffect } from "react";
import useSWR from "swr";
import { generateRandomString } from "../lib/utils";

export type Habit = {
  id: string;
  name: string;
  completed: string[];
  created?: number;
};

type HabitsResponse = {
  id: string;
  created?: number;
  habits: Habit[];
};

const fetcher = async (url: string) => {
  const id =
    typeof localStorage !== "undefined" ? localStorage.getItem("ID") : null;

  if (!id) {
    return null;
  }

  const res = await fetch(url, {
    headers: {
      Authorization: id,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("An error occurred while fetching the data.");
  }

  return res.json();
};

export function useHabits() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Check for ID in localStorage or create a new one
    if (typeof window !== "undefined") {
      let id = localStorage.getItem("ID");
      if (!id) {
        id = generateRandomString(16);
        localStorage.setItem("ID", id);
      }
      setUserId(id);
    }
  }, []);

  const { data, error, mutate } = useSWR<HabitsResponse>(
    userId ? "/api/habits" : null,
    fetcher,
  );

  const createHabit = async (name: string) => {
    if (!userId) return null;

    // Optimistic update
    const optimisticHabit: Habit = {
      id: `temp-${Date.now()}`,
      name,
      completed: [],
    };

    mutate(
      data
        ? {
            ...data,
            habits: [...(data.habits || []), optimisticHabit],
          }
        : {
            id: userId,
            habits: [optimisticHabit],
          },
      { revalidate: false },
    );

    // Actual API call
    const response = await fetch("/api/habits/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: userId,
      },
      body: JSON.stringify({ name }),
    });

    const result = await response.json();
    mutate(result);
    return result;
  };

  const deleteHabit = async (id: string) => {
    if (!userId) return null;

    // Optimistic update
    if (data) {
      mutate(
        {
          ...data,
          habits: data.habits.filter((habit) => habit.id !== id),
        },
        { revalidate: false },
      );
    }

    // Actual API call
    const response = await fetch("/api/habits/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: userId,
      },
      body: JSON.stringify({ id }),
    });

    const result = await response.json();
    mutate(result);
    return result;
  };

  const renameHabit = async (id: string, name: string) => {
    if (!userId) return null;

    // Optimistic update
    if (data) {
      mutate(
        {
          ...data,
          habits: data.habits.map((habit) =>
            habit.id === id ? { ...habit, name } : habit,
          ),
        },
        { revalidate: false },
      );
    }

    // Actual API call
    const response = await fetch("/api/habits/rename", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: userId,
      },
      body: JSON.stringify({ id, name }),
    });

    const result = await response.json();
    mutate(result);
    return result;
  };

  const logDay = async (habitId: string, day: string) => {
    if (!userId) return null;

    // Optimistic update
    if (data) {
      mutate(
        {
          ...data,
          habits: data.habits.map((habit) =>
            habit.id === habitId
              ? { ...habit, completed: [...habit.completed, day] }
              : habit,
          ),
        },
        { revalidate: false },
      );
    }

    // Actual API call
    const response = await fetch("/api/habits/log", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: userId,
      },
      body: JSON.stringify({ id: habitId, day }),
    });

    const result = await response.json();
    mutate(result);
    return result;
  };

  const unlogDay = async (habitId: string, day: string) => {
    if (!userId) return null;

    // Optimistic update
    if (data) {
      mutate(
        {
          ...data,
          habits: data.habits.map((habit) =>
            habit.id === habitId
              ? {
                  ...habit,
                  completed: habit.completed.filter((d) => d !== day),
                }
              : habit,
          ),
        },
        { revalidate: false },
      );
    }

    // Actual API call
    const response = await fetch("/api/habits/unlog", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: userId,
      },
      body: JSON.stringify({ id: habitId, day }),
    });

    const result = await response.json();
    mutate(result);
    return result;
  };

  return {
    userId,
    habits: data?.habits || [],
    isLoading: !error && !data,
    isError: error,
    createHabit,
    deleteHabit,
    renameHabit,
    logDay,
    unlogDay,
  };
}

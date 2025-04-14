import React from "react";
import { Habit } from "../components/Habit";
import { Nav } from "../components/Nav";
import { Habit as HabitType } from "../state/user";

// Import and use the same API_URL as the main API
const API_URL = process.env.REACT_APP_API_URL;

// Custom API client that uses the hardcoded sync token instead of localStorage
const vivekApi = {
  async get(url: string): Promise<any> {
    const SYNC_TOKEN = "JVNWX4Z0FUQ781VB"; // Hardcoded sync token

    try {
      const response = await fetch(API_URL + url, {
        headers: {
          Authorization: SYNC_TOKEN,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "API request failed");
      }

      return data;
    } catch (error: any) {
      console.error(error);
      throw error;
    }
  },

  async post(url: string, body: object = {}): Promise<any> {
    const SYNC_TOKEN = "JVNWX4Z0FUQ781VB"; // Hardcoded sync token

    try {
      const response = await fetch(API_URL + url, {
        method: "POST",
        headers: {
          Authorization: SYNC_TOKEN,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "API request failed");
      }

      return data;
    } catch (error: any) {
      console.error(error);
      throw error;
    }
  },
};

// Custom view-only page component that doesn't affect localStorage
const ViewOnlyPage: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div className="flex flex-col gap-8 p-4">
      <Nav />

      <main className="m-auto mt-4 flex w-full flex-col items-center gap-8">
        {children}
      </main>
    </div>
  );
};

export default function Vivek() {
  const [habits, setHabits] = React.useState<HabitType[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchHabits = async () => {
    try {
      setLoading(true);
      const info = await vivekApi.get("/habits");
      if (info?.habits) {
        setHabits(info.habits);
      }
    } catch (error) {
      console.error("Error fetching habits:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchHabits();
  }, []);

  return (
    <ViewOnlyPage>
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-6xl font-bold">Vivek's habits</h1>
        <h2 className="text-light-gray">View-only access to Vivek's habits</h2>
      </div>

      {loading ? (
        <div className="flex w-full items-center justify-center p-8">
          <div className="text-xl">Loading...</div>
        </div>
      ) : (
        <div className="flex w-full max-w-full flex-col gap-2 md:max-w-[750px]">
          {habits.length === 0 ? (
            <div className="flex h-24 w-full items-center justify-center rounded-lg bg-gray text-xl">
              No habits found
            </div>
          ) : (
            habits.map((habit) => <Habit key={habit.id} {...habit} viewOnly />)
          )}
        </div>
      )}
    </ViewOnlyPage>
  );
}

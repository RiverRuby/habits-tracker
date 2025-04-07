"use client";

import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Page } from "../components/Page";
import { Habit } from "../components/Habit";
import { CreateModal } from "../components/modals/CreateModal";
import { useHabits } from "../hooks/useHabits";

export default function Home() {
  const { habits, isLoading } = useHabits();
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <>
      {showCreateModal && (
        <CreateModal onClose={() => setShowCreateModal(false)} />
      )}

      <Page>
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-6xl font-bold">habits</h1>
          <h2 className="text-light-gray">Track your habits every day</h2>
        </div>

        <div className="mt-8 flex w-full max-w-full flex-col gap-2 md:max-w-[750px]">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <p className="text-light-gray">Loading your habits...</p>
            </div>
          ) : habits.length === 0 ? (
            <div className="flex items-center justify-center p-8">
              <p className="text-light-gray">
                No habits yet. Create one to get started!
              </p>
            </div>
          ) : (
            habits.map((habit) => <Habit key={habit.id} {...habit} />)
          )}

          <button
            className="flex h-24 w-full items-center justify-center gap-2 rounded-lg bg-gray text-xl font-bold duration-100 hover:bg-opacity-80"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="size-8" /> Create
          </button>
        </div>
      </Page>
    </>
  );
}

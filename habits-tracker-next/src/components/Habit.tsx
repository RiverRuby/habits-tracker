"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import classNames from "classnames";
import { Trash } from "lucide-react";
import { useHabits } from "../hooks/useHabits";
import { calculateStreaks, getLast365Days } from "../lib/utils";
import { HabitCube } from "./HabitCube";
import { ConfirmModal } from "./modals/ConfirmModal";

interface HabitProps {
  id: string;
  name: string;
  completed: string[];
  created?: number;
}

export const Habit: React.FC<HabitProps> = ({ id, name, completed }) => {
  const { deleteHabit, renameHabit, logDay, unlogDay } = useHabits();
  const [habitName, setHabitName] = useState(name);
  const [completions, setCompletions] = useState(completed);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const last365Days = useMemo(getLast365Days, []);
  const { currentStreak, longestStreak } = useMemo(
    () => calculateStreaks(completions),
    [completions],
  );

  const spanRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (spanRef.current && inputRef.current) {
      const spanWidth = spanRef.current.offsetWidth;
      inputRef.current.style.width = `${spanWidth + 5}px`;
    }
  }, [habitName]);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.scrollLeft = ref.current.scrollWidth;
  }, []);

  const handleLogDay = async (day: string) => {
    const newCompletions = [...completions, day];
    setCompletions(newCompletions);
    await logDay(id, day);
  };

  const handleUnlogDay = async (day: string) => {
    const newCompletions = completions.filter(
      (completion) => completion !== day,
    );
    setCompletions(newCompletions);
    await unlogDay(id, day);
  };

  // Group days by month
  const months = useMemo(() => {
    const monthGroups: Record<string, number> = {};
    let currentMonth = "";
    let currentIndex = 0;

    last365Days.reverse().forEach((day, index) => {
      const month = day.split(" ").slice(2, 4).join(" ");
      if (currentMonth !== month) {
        monthGroups[month] = index - currentIndex;
        currentMonth = month;
        currentIndex = index;
      }
    });
    return monthGroups;
  }, [last365Days]);

  const handleRename = async () => {
    if (habitName === name) return;
    await renameHabit(id, habitName);
  };

  return (
    <>
      {showDeleteModal && (
        <ConfirmModal
          description="Deleted habits can't be recovered"
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={() => {
            deleteHabit(id);
            setShowDeleteModal(false);
          }}
        />
      )}

      <div className="group flex flex-col gap-2 rounded-lg bg-dark-gray p-4 md:max-w-[750px]">
        <div className="flex w-full items-center justify-between">
          <div className="flex flex-grow items-center gap-2 overflow-hidden">
            <div
              className="flex items-center"
              style={{
                maxWidth: "calc(100% - 7rem)",
              }}
            >
              <span
                ref={spanRef}
                className="invisible absolute max-w-full text-xl font-bold"
                style={{ whiteSpace: "pre" }}
              >
                {/* Using this to track the width of the text */}
                {habitName || " "}
              </span>

              <input
                ref={inputRef}
                value={habitName}
                onChange={(e) => setHabitName(e.target.value)}
                className="bg-transparent text-xl font-bold outline-none"
                style={{ minWidth: "1ch" }}
                onBlur={handleRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRename();
                    inputRef.current?.blur();
                  }
                }}
              />
            </div>

            <div
              className={classNames(
                "shrink-0 rounded-lg px-2 py-1 text-xs font-bold",
                {
                  "bg-green-500": currentStreak > 0,
                  "bg-light-gray": currentStreak === 0,
                },
              )}
            >
              {currentStreak} DAY STREAK
            </div>
          </div>

          <button
            className="min-w-fit cursor-pointer p-2 duration-100 group-hover:opacity-100 md:opacity-0"
            onClick={() => setShowDeleteModal(true)}
          >
            <Trash className="size-5 text-red-500" />
          </button>
        </div>

        <div
          className="hide-scrollbar flex flex-col gap-1 overflow-auto"
          ref={ref}
        >
          {/* Months */}
          <div className="flex text-ellipsis">
            {Object.entries(months).map(([month, startIndex]) => {
              const margin = startIndex / 7;

              return (
                <span
                  key={month}
                  style={{
                    marginLeft: `${margin * 13}px`,
                  }}
                >
                  {month.split(", ")[0]}
                </span>
              );
            })}
          </div>

          {/* Grid */}
          <div className="grid w-fit grid-flow-col grid-rows-7 gap-1 overflow-auto">
            {last365Days.map((day, index) => (
              <HabitCube
                key={index}
                day={day}
                index={index}
                completions={completions}
                last365Days={last365Days}
                logDay={handleLogDay}
                unlogDay={handleUnlogDay}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

import classNames from "classnames";
import { CalendarPlus, Trash } from "lucide-react";
import React from "react";
import { Habit as HabitType, useUser } from "../state/user";
import { api } from "../utils/api";
import { calculateStreaks, getLast365Days } from "../utils/utils";
import { HabitCube } from "./HabitCube";
import { ConfirmModal } from "./modals/ConfirmModal";
import { NaturalDateInput } from "./NaturalDateInput";

interface HabitProps extends HabitType {
  viewOnly?: boolean;
}

export const Habit: React.FC<HabitProps> = ({
  id,
  name,
  completed,
  viewOnly = false,
}) => {
  const { deleteHabit, renameHabit, updateUserInfo } = useUser();
  const [habitName, setHabitName] = React.useState(name);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [showNaturalDateInput, setShowNaturalDateInput] = React.useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);
  const last365Days = React.useMemo(getLast365Days, []);
  const { currentStreak, longestStreak } = React.useMemo(
    () => calculateStreaks(completed),
    [completed],
  );

  // Calculate year and 30 days statistics
  const yearStats = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    const yearCompletions = completed.filter((day) => {
      const year = parseInt(day.split(", ")[2]);
      return year === currentYear;
    });
    return yearCompletions.length;
  }, [completed]);

  const past30DaysStats = React.useMemo(() => {
    // Get dates from the last 30 days
    const past30Days = getLast365Days().slice(0, 30);

    const completionsInLast30Days = completed.filter((day) =>
      past30Days.includes(day),
    ).length;

    if (completionsInLast30Days === 0) return 0;

    const ratio = 30 / completionsInLast30Days;
    return ratio.toFixed(1);
  }, [completed, last365Days]);

  const spanRef = React.useRef<HTMLSpanElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (spanRef.current && inputRef.current) {
      const spanWidth = spanRef.current.offsetWidth;
      inputRef.current.style.width = `${spanWidth + 5}px`;
    }
  }, [habitName]);

  React.useEffect(() => {
    if (!ref.current) return;
    ref.current.scrollLeft = ref.current.scrollWidth;
  }, []);

  const logDay = async (day: string): Promise<void> => {
    if (viewOnly) return Promise.resolve();

    // First make the log API call
    await api.post("/habits/log", {
      id: id,
      day: day,
    });

    // Finally update the user info
    await updateUserInfo();
  };

  const unlogDay = async (day: string): Promise<void> => {
    if (viewOnly) return Promise.resolve();

    // First make the unlog API call
    await api.post("/habits/unlog", {
      id: id,
      day: day,
    });

    // Finally update the user info
    await updateUserInfo();
  };

  // group days by month
  const months = React.useMemo(() => {
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

  const rename = async () => {
    if (viewOnly || habitName === name) return;

    await renameHabit(id, habitName);
  };

  return (
    <>
      {!viewOnly && showDeleteModal && (
        <ConfirmModal
          description="Deleted habits can't be recovered"
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={() => {
            deleteHabit(id);
            setShowDeleteModal(false);
          }}
        />
      )}

      {!viewOnly && showNaturalDateInput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <NaturalDateInput
            habitId={id}
            onClose={() => setShowNaturalDateInput(false)}
          />
        </div>
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
                {/* using this to track the width of the text */}
                {habitName || " "}
              </span>

              {viewOnly ? (
                <span className="text-xl font-bold">{habitName}</span>
              ) : (
                <input
                  ref={inputRef}
                  value={habitName}
                  onChange={(e) => setHabitName(e.target.value)}
                  className="bg-transparent text-xl font-bold outline-none"
                  style={{ minWidth: "1ch" }}
                  onBlur={rename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      e.stopPropagation();

                      rename();
                      inputRef.current?.blur();
                    }
                  }}
                />
              )}
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

          {!viewOnly && (
            <div className="flex gap-2">
              <button
                className="min-w-fit cursor-pointer p-2 duration-100 group-hover:opacity-100 md:opacity-0"
                onClick={() => setShowNaturalDateInput(true)}
              >
                <CalendarPlus className="text-blue-500 size-5" />
              </button>

              <button
                className="min-w-fit cursor-pointer p-2 duration-100 group-hover:opacity-100 md:opacity-0"
                onClick={() => setShowDeleteModal(true)}
              >
                <Trash className="size-5 text-red-500" />
              </button>
            </div>
          )}
        </div>

        <div
          className="hide-scrollbar flex flex-col gap-1 overflow-auto"
          ref={ref}
        >
          {/* months */}
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

          {/* grid */}
          <div className="grid w-fit grid-flow-col grid-rows-7 gap-1 overflow-auto">
            {last365Days.map((day, index) => (
              <HabitCube
                key={index}
                day={day}
                index={index}
                completions={completed}
                last365Days={last365Days}
                logDay={logDay}
                unlogDay={unlogDay}
                viewOnly={viewOnly}
              />
            ))}
          </div>
        </div>

        {/* summary line - moved outside the scrollable container */}
        <div className="text-gray-300 mt-2 flex flex-wrap gap-1 text-xs">
          <span>Year: {yearStats} times</span>
          <span>{"//"}</span>
          {Number(past30DaysStats) > 0 && (
            <span>Month: Every {past30DaysStats} days</span>
          )}
          {past30DaysStats === 0 && completed.length > 0 && (
            <span>Past 30 days: Not completed</span>
          )}
          {completed.length === 0 && <span>No completions yet</span>}
        </div>
      </div>
    </>
  );
};

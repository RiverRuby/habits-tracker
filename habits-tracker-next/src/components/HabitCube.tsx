"use client";

import React, { useState, useEffect } from "react";
import classNames from "classnames";
import { Tooltip } from "react-tooltip";

interface HabitCubeProps {
  day: string;
  completions: string[];
  index: number;
  last365Days: string[];
  logDay: (day: string) => void;
  unlogDay: (day: string) => void;
}

export const HabitCube: React.FC<HabitCubeProps> = ({
  day,
  completions,
  index,
  last365Days,
  logDay,
  unlogDay,
}) => {
  const [gotLogged, setGotLogged] = useState(false);
  const isFiller = day === "FILLER";

  useEffect(() => {
    if (gotLogged) {
      // This timeout resets the state after logging
      const timer = setTimeout(() => {
        setGotLogged(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [gotLogged]);

  return (
    <div
      data-tooltip-id={day}
      data-tooltip-content={day}
      className={classNames(
        "size-4 cursor-pointer rounded-sm border-[1px] border-transparent",
        {
          "bg-gray hover:bg-light-gray":
            !isFiller && !completions.includes(day),
          "bg-green-500": completions.includes(day),
          "border-white": index === last365Days.length - 1,
          "opacity-30": isFiller,
        },
      )}
      onClick={() => {
        if (isFiller) return;

        if (completions.includes(day)) {
          unlogDay(day);
          setGotLogged(false);
        } else {
          logDay(day);
          setGotLogged(true);
        }
      }}
    >
      {day !== "FILLER" && <Tooltip id={day} />}
    </div>
  );
};

import classNames from "classnames";
import React from "react";
import ConfettiExplosion from "react-confetti-explosion";
import { Tooltip } from "react-tooltip";

interface Props {
  day: string;
  completions: string[];
  index: number;
  last365Days: string[];
  viewOnly?: boolean;
  logDay: (day: string) => Promise<void>;
  unlogDay: (day: string) => Promise<void>;
}

export const HabitCube: React.FC<Props> = ({
  day,
  completions,
  index,
  last365Days,
  logDay,
  unlogDay,
  viewOnly = false,
}) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [showConfetti, setShowConfetti] = React.useState(false);
  const isFiller = day === "FILLER";
  const isCompleted = completions.includes(day);

  React.useEffect(() => {
    if (showConfetti) {
      // this is here to avoid lag caused by confetti
      setTimeout(() => {
        setShowConfetti(false);
      }, 2000);
    }
  }, [showConfetti]);

  const handleClick = async () => {
    if (isFiller || viewOnly) return;

    setIsLoading(true);

    try {
      if (isCompleted) {
        await unlogDay(day);
        setShowConfetti(false);
      } else {
        await logDay(day);
        setShowConfetti(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      key={day}
      data-tooltip-id={day}
      data-tooltip-content={day}
      className={classNames(
        "relative size-4 rounded-sm border-[1px] border-transparent",
        {
          "cursor-pointer": !viewOnly && !isFiller,
          "bg-gray hover:bg-light-gray":
            !isFiller && !isCompleted && !isLoading,
          "bg-green-500": isCompleted && !isLoading,
          "border-white": index === last365Days.length - 1,
          "opacity-30": isFiller,
          "animate-pulse bg-green-400": isLoading && !isCompleted,
          "animate-pulse bg-green-500": isLoading && isCompleted,
        },
      )}
      onClick={handleClick}
    >
      {showConfetti && (
        <ConfettiExplosion particleCount={150} duration={2000} force={0.8} />
      )}
      {day !== "FILLER" && <Tooltip id={day} />}
    </div>
  );
};

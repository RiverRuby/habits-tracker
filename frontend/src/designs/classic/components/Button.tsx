import React from "react";
import classNames from "classnames";

interface Props {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  color?: "blue" | "red" | "gray";
}

export const Button: React.FC<Props> = ({
  children,
  onClick,
  className,
  disabled,
  color = "blue",
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={classNames(
        "rounded-md px-4 py-2 font-bold duration-100 hover:bg-opacity-80 disabled:cursor-not-allowed disabled:opacity-50",
        {
          "bg-blue-500": color === "blue",
          "bg-red-500": color === "red",
          "bg-gray": color === "gray",
        },
        className,
      )}
    >
      {children}
    </button>
  );
};

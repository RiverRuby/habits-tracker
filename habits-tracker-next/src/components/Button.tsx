"use client";

import React, { MouseEventHandler } from "react";
import classNames from "classnames";

interface ButtonProps {
  children?: React.ReactNode;
  color?: "white" | "red";
  className?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  color = "white",
  className,
  onClick,
}) => {
  return (
    <button
      className={classNames(
        "rounded-md px-4 py-1 font-bold duration-100 hover:bg-opacity-80",
        {
          "bg-white text-black": color === "white",
          "bg-red-500": color === "red",
        },
        className,
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

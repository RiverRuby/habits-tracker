import React from "react";
import { twMerge } from "tailwind-merge";

interface Props {
  children?: React.ReactNode;
  className?: string;
  onClose?: () => void;
}

export const Modal: React.FC<Props> = ({ children, className, onClose }) => {
  return (
    <div
      className="fixed left-0 top-0 flex h-full w-full items-center justify-center bg-black bg-opacity-20 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={twMerge(
          "flex min-h-[200px] w-full flex-col gap-2 rounded-lg border-[1px] border-gray bg-dark-gray p-4 sm:w-fit",
          className,
        )}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {children}
      </div>
    </div>
  );
};

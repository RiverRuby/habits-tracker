"use client";

import React, { useEffect, useRef } from "react";
import classNames from "classnames";

interface ModalProps {
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
}

export const Modal: React.FC<ModalProps> = ({
  children,
  className,
  onClose,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(e.target as Node) &&
        onClose
      ) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div
        ref={modalRef}
        className={classNames(
          "flex flex-col gap-4 rounded-lg bg-dark-gray p-4 shadow-lg",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
};

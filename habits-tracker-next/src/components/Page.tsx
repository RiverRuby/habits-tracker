"use client";

import React from "react";
import { Nav } from "./Nav";

interface PageProps {
  children: React.ReactNode;
}

export const Page: React.FC<PageProps> = ({ children }) => {
  return (
    <div className="m-auto flex min-h-screen max-w-7xl flex-col gap-4 p-4">
      <Nav />
      <div className="flex flex-1 flex-col items-center">{children}</div>
    </div>
  );
};

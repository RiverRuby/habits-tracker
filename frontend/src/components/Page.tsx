import React from "react";
import { generateRandomString } from "../utils/utils";
import { Nav } from "./Nav";

interface Props {
  children?: React.ReactNode;
}

export const Page: React.FC<Props> = ({ children }) => {
  React.useEffect(() => {
    const ID = localStorage.getItem("ID");

    if (!ID) {
      localStorage.setItem("ID", generateRandomString(16));
    }
  }, [localStorage]);

  return (
    <div className="flex flex-col gap-8 p-4">
      <Nav />

      <main className="m-auto mt-4 flex w-full flex-col items-center gap-8">
        {children}
      </main>
    </div>
  );
};

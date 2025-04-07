"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "./Button";
import { SyncModal } from "./modals/SyncModal";

export const Nav: React.FC = () => {
  const [showSyncModal, setShowSyncModal] = useState(false);

  return (
    <>
      {showSyncModal && <SyncModal onClose={() => setShowSyncModal(false)} />}

      <nav className="sticky m-auto flex h-20 w-full items-center justify-between rounded-2xl bg-gray bg-opacity-50 px-8 py-2 backdrop-blur-xl sm:w-[600px]">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative h-10 w-10">
            <Image src="/logo.svg" alt="logo" fill sizes="2.5rem" />
          </div>
          <span>habits</span>
        </Link>

        <Button
          className="cursor-pointer bg-transparent text-white duration-100 hover:opacity-75"
          onClick={() => setShowSyncModal(!showSyncModal)}
        >
          Sync
        </Button>
      </nav>
    </>
  );
};

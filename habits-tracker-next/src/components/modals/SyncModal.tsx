"use client";

import React, { useState, useEffect } from "react";
import { Check, Copy } from "lucide-react";
import QRCode from "react-qr-code";
import { useHabits } from "../../hooks/useHabits";
import { copyToClipboard, syncCode } from "../../lib/utils";
import { Button } from "../Button";
import { Modal } from "./Modal";

interface SyncModalProps {
  onClose?: () => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({ onClose }) => {
  const { userId } = useHabits();
  const [syncValue, setSyncValue] = useState("");
  const [copied, setCopied] = useState(false);
  const syncURL = `${process.env.NEXT_PUBLIC_APP_URL}/sync?id=${userId}`;

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => {
        setCopied(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  return (
    <Modal onClose={onClose}>
      <div className="text-center text-xl font-bold">Sync</div>

      <div
        className="flex cursor-pointer items-center"
        onClick={() => {
          if (userId) {
            copyToClipboard(userId);
            setCopied(true);
          }
        }}
      >
        <div className="w-full rounded-l-md bg-black p-2">{userId}</div>
        <div className="h-full w-fit rounded-r-md bg-black p-2">
          {copied ? <Check /> : <Copy />}
        </div>
      </div>

      <QRCode value={syncURL} className="m-auto rounded-md bg-white p-2" />

      <div className="flex items-center gap-2">
        <span className="h-[1px] w-full bg-gray" />
        <span className="text-sm text-light-gray">OR</span>
        <span className="h-[1px] w-full bg-gray" />
      </div>

      <input
        value={syncValue}
        onChange={(e) => setSyncValue(e.target.value)}
        placeholder="Enter a sync code"
        className="rounded-md border-none bg-black px-2 py-1 outline-none"
      />
      <Button
        onClick={() => {
          if (!syncValue) return;
          syncCode(syncValue);
          window.location.reload();
        }}
      >
        Sync!
      </Button>
    </Modal>
  );
};

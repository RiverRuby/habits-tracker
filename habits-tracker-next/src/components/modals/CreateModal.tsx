"use client";

import React, { useState } from "react";
import { useHabits } from "../../hooks/useHabits";
import { Button } from "../Button";
import { Modal } from "./Modal";

interface CreateModalProps {
  onClose?: () => void;
}

export const CreateModal: React.FC<CreateModalProps> = ({ onClose }) => {
  const { createHabit } = useHabits();
  const [name, setName] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) return;

    await createHabit(name);
    onClose && onClose();
  };

  return (
    <Modal className="min-h-fit gap-4" onClose={onClose}>
      <div className="text-center text-xl font-bold sm:px-8">
        Create a habit
      </div>

      <div className="m-auto flex flex-col gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="rounded-md border-none bg-black px-2 py-1 outline-none"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleCreate();
            }
          }}
          autoFocus
        />

        <Button onClick={handleCreate}>Create!</Button>
      </div>
    </Modal>
  );
};

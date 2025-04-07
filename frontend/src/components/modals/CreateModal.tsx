import React from "react";
import { useUser } from "../../state/user";
import { Button } from "../Button";
import { Modal } from "./Modal";

interface Props {
  onClose?: () => void;
}

export const CreateModal: React.FC<Props> = ({ onClose }) => {
  const { createHabit } = useUser();
  const [name, setName] = React.useState("");

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
              createHabit(name);
              onClose && onClose();
            }
          }}
          autoFocus
        />

        <Button
          onClick={() => {
            createHabit(name);
            onClose && onClose();
          }}
        >
          Create!
        </Button>
      </div>
    </Modal>
  );
};

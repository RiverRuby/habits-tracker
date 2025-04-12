import React from "react";
import { Button } from "../Button";
import { Modal } from "./Modal";

interface Props {
  description?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<Props> = ({
  description = "Are you sure?",
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal className="min-h-fit gap-4" onClose={onCancel}>
      <div className="text-center text-xl font-bold sm:px-8">{description}</div>

      <div className="flex flex-col gap-2">
        <Button className="w-full" color="gray" onClick={onCancel}>
          Cancel
        </Button>

        <Button className="w-full" color="red" onClick={onConfirm}>
          Confirm
        </Button>
      </div>
    </Modal>
  );
};

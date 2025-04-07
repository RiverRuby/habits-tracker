import React from "react";
import { Button } from "../Button";
import { Modal } from "./Modal";

interface Props {
  label?: React.ReactNode;
  description?: React.ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ConfirmModal: React.FC<Props> = ({
  label = "Are you sure?",
  description,
  onCancel,
  onConfirm,
}) => {
  return (
    <Modal className="min-h-fit" onClose={onCancel}>
      <div className="text-center text-xl font-bold sm:px-8">{label}</div>

      <div className="text-light-gray">{description}</div>

      <div className="mt-4 flex gap-2">
        <Button className="w-full" onClick={onCancel}>
          Cancel
        </Button>

        <Button className="w-full" color="red" onClick={onConfirm}>
          Confirm
        </Button>
      </div>
    </Modal>
  );
};

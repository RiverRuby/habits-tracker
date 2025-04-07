"use client";

import React from "react";
import { Button } from "../Button";
import { Modal } from "./Modal";

interface ConfirmModalProps {
  title?: string;
  description?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  title = "Are you sure?",
  description,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal onClose={onCancel}>
      <div className="text-center text-xl font-bold">{title}</div>
      {description && (
        <div className="text-center text-light-gray">{description}</div>
      )}
      <div className="flex justify-center gap-2">
        <Button color="red" onClick={onConfirm}>
          Confirm
        </Button>
        <Button onClick={onCancel}>Cancel</Button>
      </div>
    </Modal>
  );
};

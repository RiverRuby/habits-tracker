import React from "react";
import { Button } from "./Button";
import { api } from "../../../utils/api";
import { useUser } from "../../../state/user";

interface Props {
  habitId: string;
  onClose: () => void;
}

export const NaturalDateInput: React.FC<Props> = ({ habitId, onClose }) => {
  const { updateUserInfo } = useUser();
  const [naturalDate, setNaturalDate] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async () => {
    if (!naturalDate.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post("/habits/log-natural", {
        id: habitId,
        naturalDate: naturalDate.trim(),
      });

      if (response.success) {
        await updateUserInfo();
        onClose();
      } else {
        setError(response.message || "Failed to process dates");
      }
    } catch (error) {
      setError("Failed to process dates. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-w-[280px] max-w-[95vw] flex-col gap-4 rounded-lg bg-dark-gray p-4 sm:min-w-[400px] md:min-w-[500px]">
      <div className="text-center text-xl font-bold">Add Dates</div>

      <div className="flex flex-col gap-2">
        <textarea
          value={naturalDate}
          onChange={(e) => setNaturalDate(e.target.value)}
          placeholder="Enter dates in natural language&#10;e.g. last week&#10;yesterday and today&#10;March 15-20&#10;every Monday this month"
          className="placeholder:text-gray-500 min-h-[120px] w-full rounded-md border-none bg-black px-4 py-3 text-lg outline-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.metaKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          autoFocus
        />

        <div className="text-gray-400 text-xs">
          Press ⌘+Enter (Mac) or Ctrl+Enter (Windows) to submit
        </div>

        {error && <div className="text-sm text-red-500">{error}</div>}

        <div className="flex gap-2">
          <Button onClick={onClose} className="flex-1" color="gray">
            Cancel
          </Button>

          <Button
            onClick={handleSubmit}
            className="flex-1"
            disabled={isLoading || !naturalDate.trim()}
          >
            {isLoading ? "Processing..." : "Add"}
          </Button>
        </div>
      </div>
    </div>
  );
};

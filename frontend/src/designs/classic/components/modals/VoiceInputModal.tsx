import React from "react";
import { Mic, X } from "lucide-react";
import { useUser } from "../../../../state/user";
import { Button } from "../Button";
import { Modal } from "./Modal";
import { api } from "../../../../utils/api";

interface Props {
  onClose?: () => void;
}

export const VoiceInputModal: React.FC<Props> = ({ onClose }) => {
  const { habits, updateUserInfo } = useUser();
  const [isRecording, setIsRecording] = React.useState(false);
  const [time, setTime] = React.useState(0);
  const [transcript, setTranscript] = React.useState("");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [result, setResult] = React.useState<{
    habit: string;
    day: string;
  } | null>(null);
  const [selectedHabit, setSelectedHabit] = React.useState<{
    id: string;
    name: string;
  } | null>(null);

  const recognitionRef = React.useRef<SpeechRecognition | null>(null);

  React.useEffect(() => {
    if (
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    ) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(finalTranscript || interimTranscript);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  React.useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isRecording) {
      intervalId = setInterval(() => {
        setTime((t) => t + 1);
      }, 1000);

      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.error("Failed to start speech recognition:", e);
        }
      }
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error("Failed to stop speech recognition:", e);
        }
      }

      setTime(0);
    }

    return () => clearInterval(intervalId);
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      if (transcript) {
        setIsProcessing(true);
        processTranscript(transcript);
      }
    } else {
      setIsRecording(true);
      setTranscript("");
      setResult(null);
      setSelectedHabit(null);
    }
  };

  const processTranscript = async (text: string) => {
    try {
      // Call backend API to process the transcript with Gemini
      const response = await api.post("/habits/process-voice", {
        transcript: text,
      });

      if (response && response.result) {
        setResult(response.result);

        // Try to match the habit name to an existing habit
        if (habits && habits.length > 0 && response.result.habit) {
          const habitName = response.result.habit.toLowerCase();
          const matchedHabit = habits.find(
            (h) =>
              h.name.toLowerCase().includes(habitName) ||
              habitName.includes(h.name.toLowerCase()),
          );

          if (matchedHabit) {
            setSelectedHabit({
              id: matchedHabit.id,
              name: matchedHabit.name,
            });
          }
        }
      }
    } catch (error) {
      console.error("Error processing transcript:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async () => {
    if (!result || !result.day) return;

    try {
      if (selectedHabit) {
        // Log the habit on the specified date
        await api.post("/habits/log-natural", {
          id: selectedHabit.id,
          naturalDate: result.day,
        });

        // Update the UI
        await updateUserInfo();
      } else if (result.habit) {
        // Create a new habit first
        await api.post("/habits/create", {
          name: result.habit,
        });

        // Get the updated habits list to find the new habit
        const info = await api.get("/habits");
        if (info?.habits) {
          const newHabit = info.habits.find(
            (h: any) => h.name === result.habit,
          );
          if (newHabit) {
            // Log the habit on the specified date
            await api.post("/habits/log-natural", {
              id: newHabit.id,
              naturalDate: result.day,
            });
          }
        }

        // Update the UI
        await updateUserInfo();
      }

      // Close the modal
      onClose && onClose();
    } catch (error) {
      console.error("Error saving habit:", error);
    }
  };

  const hasExistingHabits = habits && habits.length > 0;

  return (
    <Modal className="min-h-fit max-w-md gap-4" onClose={onClose}>
      <div className="text-center text-xl font-bold">
        Track habit with voice
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="relative flex w-full flex-col items-center gap-2">
          <button
            className={`group flex h-16 w-16 items-center justify-center rounded-xl transition-colors ${
              isRecording ? "bg-red-500/20" : "bg-none hover:bg-gray/20"
            }`}
            type="button"
            onClick={handleToggleRecording}
            disabled={isProcessing}
          >
            {isRecording ? (
              <div
                className="h-6 w-6 animate-pulse cursor-pointer rounded-sm bg-red-500"
                style={{ animationDuration: "1.5s" }}
              />
            ) : (
              <Mic className="h-6 w-6 text-white/70" />
            )}
          </button>

          <span className="font-mono text-sm">
            {isRecording ? formatTime(time) : "Click to speak"}
          </span>

          {/* Sound visualization */}
          <div className="mt-2 flex h-12 w-64 items-center justify-center gap-0.5">
            {Array.from({ length: 32 }).map((_, i) => (
              <div
                key={i}
                className={`w-0.5 rounded-full transition-all duration-300 ${
                  isRecording ? "animate-pulse bg-white/50" : "h-1 bg-white/10"
                }`}
                style={
                  isRecording
                    ? {
                        height: `${20 + Math.random() * 80}%`,
                        animationDelay: `${i * 0.05}s`,
                      }
                    : undefined
                }
              />
            ))}
          </div>
        </div>

        {transcript && (
          <div className="mt-2 w-full rounded-lg border border-gray bg-black p-3">
            <p className="text-sm">{transcript}</p>
          </div>
        )}

        {isProcessing && (
          <div className="mt-4 flex flex-col items-center text-center">
            <div className="mb-3 flex justify-center">
              <div className="loader-spinner">
                <div className="relative h-12 w-12">
                  <div className="border-t-blue-500 absolute h-full w-full animate-spin rounded-full border-4 border-t-4 border-gray opacity-75"></div>
                  <div className="absolute flex h-full w-full items-center justify-center">
                    <div className="bg-blue-500/20 h-6 w-6 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-sm font-medium">Processing with Gemini AI</p>
            <p className="mt-1 text-xs text-light-gray">
              Analyzing your speech and habits
            </p>
            <p className="text-blue-400/70 mt-3 text-xs">
              This may take a few seconds...
            </p>
          </div>
        )}

        {result && (
          <>
            <div className="mt-2 w-full rounded-lg border border-gray bg-dark-gray p-4">
              <h3 className="mb-2 text-center font-medium">Analyzed speech</h3>
              <p className="mb-2 text-sm">
                <strong>Habit:</strong> {result.habit}
              </p>
              <p className="text-sm">
                <strong>Day:</strong> {result.day}
              </p>
            </div>
            {habits && habits.length > 0 && (
              <div className="mt-2 w-full rounded-lg border border-gray bg-dark-gray p-4">
                <h3 className="mb-4 text-center font-medium">Change habit</h3>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {habits.map((habit) => (
                    <button
                      key={habit.id}
                      className={`rounded-md px-3 py-1 text-sm ${
                        selectedHabit?.id === habit.id
                          ? "bg-green-500"
                          : "bg-gray"
                      }`}
                      onClick={() =>
                        setSelectedHabit({ id: habit.id, name: habit.name })
                      }
                    >
                      {habit.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {result && (
          <Button onClick={handleSubmit} className="mt-2 w-full bg-gray">
            {selectedHabit
              ? `Log "${selectedHabit.name}" on ${result.day}`
              : `Create and log "${result.habit}" on ${result.day}`}
          </Button>
        )}

        <p className="mx-8 mb-4 text-center text-xs text-light-gray">
          {hasExistingHabits && !result && (
            <>
              <span className="text-blue-400">
                AI is used to recognize your habits by name:{" "}
                {habits.map((h) => h.name).join(", ")}
              </span>
            </>
          )}
        </p>
      </div>
    </Modal>
  );
};

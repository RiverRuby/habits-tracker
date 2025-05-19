import { Mic, Plus } from "lucide-react";
import React from "react";
import { Habit } from "../components/Habit";
import { CreateModal } from "../components/modals/CreateModal";
import { VoiceInputModal } from "../components/modals/VoiceInputModal";
import { Page } from "../components/Page";
import { Spinner } from "../components/Spinner";
import { useUser } from "../state/user";

export default function Home() {
  const { habits, loaded, updateUserInfo } = useUser();
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [showVoiceModal, setShowVoiceModal] = React.useState(false);

  React.useEffect(() => {
    updateUserInfo();
  }, [localStorage]);

  return (
    <>
      {showCreateModal && (
        <CreateModal onClose={() => setShowCreateModal(false)} />
      )}

      {showVoiceModal && (
        <VoiceInputModal onClose={() => setShowVoiceModal(false)} />
      )}

      <Page>
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-6xl font-bold">habits</h1>
          <h2 className="text-light-gray">track your habits every day</h2>
        </div>

        <div className="flex w-full max-w-full flex-col gap-4 md:max-w-[750px]">
          <button
            className="flex h-16 w-full items-center justify-center gap-2 rounded-lg bg-gray text-xl font-bold duration-100 hover:bg-opacity-80"
            onClick={() => setShowVoiceModal(true)}
          >
            <Mic className="size-6" /> Track with voice
          </button>

          {!loaded ? (
            <div className="flex items-center justify-center py-10">
              <Spinner size="large" />
            </div>
          ) : (
            habits?.map((habit) => <Habit key={habit.id} {...habit} />)
          )}

          <button
            className="flex h-16 w-full items-center justify-center gap-2 rounded-lg bg-gray text-xl font-bold duration-100 hover:bg-opacity-80"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="size-8" /> Add new habit
          </button>
        </div>
      </Page>
    </>
  );
}

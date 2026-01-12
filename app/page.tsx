import CheckPlaylist from "@/components/admin/CheckPlaylist";
import SchedulePreview from "@/components/admin/CheckSchedule";
import Pause from "@/components/Pause";

export default function Home() {
  return (
    <main className="w-full flex flex-col">
      <div className="flex items-center justify-center w-full p-4">
        <Pause />
      </div>
      <div className="bg-muted-foreground w-full h-[0.1] mt-1"></div>
      <div className="w-full flex flex-wrap">
        <div className="flex-1 p-5 min-w-96">
          <SchedulePreview hideDebug={true} />
        </div>
        <div className="flex-1 p-5">
          <CheckPlaylist />
        </div>
      </div>
    </main>
  );
}

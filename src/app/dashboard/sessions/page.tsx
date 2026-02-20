import { SessionList } from "@/components/session-list";

export default function SessionsPage() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-3">
        <h1 className="text-lg font-semibold">Sessions</h1>
      </div>
      <SessionList />
    </div>
  );
}

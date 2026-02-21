"use client";

import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { SessionProvider, useSession } from "@/components/session-context";

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { activeSessionKey, selectSession, newChat, deleteSession } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  function handleSelectSession(key: string) {
    selectSession(key);
    if (pathname !== "/dashboard/chat") {
      router.push("/dashboard/chat");
    }
  }

  function handleNewChat() {
    newChat();
    if (pathname !== "/dashboard/chat") {
      router.push("/dashboard/chat");
    }
  }

  return (
    <div className="flex h-[100dvh]">
      <Sidebar
        activeSessionKey={activeSessionKey}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={deleteSession}
      />
      <main className="flex flex-1 flex-col overflow-hidden bg-dot-grid">
        {children}
      </main>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <DashboardShell>{children}</DashboardShell>
    </SessionProvider>
  );
}

"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface SessionContextValue {
  activeSessionKey: string | null;
  selectSession: (key: string) => void;
  newChat: () => void;
  deleteSession: (key: string) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [activeSessionKey, setActiveSessionKey] = useState<string | null>(null);

  const selectSession = useCallback((key: string) => {
    setActiveSessionKey(key);
  }, []);

  const newChat = useCallback(() => {
    setActiveSessionKey(null);
  }, []);

  const deleteSession = useCallback((key: string) => {
    setActiveSessionKey((current) => (current === key ? null : current));
  }, []);

  return (
    <SessionContext value={{ activeSessionKey, selectSession, newChat, deleteSession }}>
      {children}
    </SessionContext>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  LogOut,
  Plus,
  Menu,
  X,
  MessageSquare,
  Trash2,
} from "lucide-react";

interface Session {
  key: string;
  updatedAt?: number;
  age?: number;
}

interface SidebarProps {
  activeSessionKey: string | null;
  onSelectSession: (key: string) => void;
  onNewChat: () => void;
  onDeleteSession: (key: string) => void;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function sessionLabel(key: string): string {
  const parts = key.split(":");
  if (parts.length >= 4) {
    const uuid = parts[3];
    return `${parts[1]} / ${uuid.slice(0, 8)}`;
  }
  return key.length > 24 ? key.slice(0, 24) + "..." : key;
}

function groupSessionsByTime(sessions: Session[]): {
  today: Session[];
  yesterday: Session[];
  older: Session[];
} {
  const now = Date.now();
  const oneDayMs = 86400000;
  const twoDaysMs = oneDayMs * 2;

  const today: Session[] = [];
  const yesterday: Session[] = [];
  const older: Session[] = [];

  for (const session of sessions) {
    const age = session.age ?? (session.updatedAt ? now - session.updatedAt : Infinity);
    if (age < oneDayMs) {
      today.push(session);
    } else if (age < twoDaysMs) {
      yesterday.push(session);
    } else {
      older.push(session);
    }
  }

  return { today, yesterday, older };
}

export function Sidebar({
  activeSessionKey,
  onSelectSession,
  onNewChat,
  onDeleteSession,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data } = useSWR<Session[]>("/api/sessions", fetcher, {
    refreshInterval: 30000,
  });
  const { mutate } = useSWRConfig();

  const sessions = Array.isArray(data) ? data : [];
  const grouped = groupSessionsByTime(sessions);

  const isOverview = pathname === "/dashboard";

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  function handleSelectSession(key: string) {
    if (confirmingDelete) return;
    onSelectSession(key);
    setMobileOpen(false);
  }

  function handleNewChat() {
    onNewChat();
    setMobileOpen(false);
  }

  async function handleDelete(key: string) {
    setDeleting(key);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/sessions/${encodeURIComponent(key)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onDeleteSession(key);
        mutate("/api/sessions");
      } else {
        const body = await res.json().catch(() => ({}));
        const msg = body.error ?? `Failed (${res.status})`;
        setDeleteError(msg);
        setTimeout(() => setDeleteError(null), 4000);
      }
    } finally {
      setDeleting(null);
      setConfirmingDelete(null);
    }
  }

  function renderSessionGroup(label: string, items: Session[]) {
    if (items.length === 0) return null;
    return (
      <div key={label}>
        <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        {items.map((session) => {
          const isActive = activeSessionKey === session.key;
          const isConfirming = confirmingDelete === session.key;
          const isDeleting = deleting === session.key;

          return (
            <div
              key={session.key}
              className={cn(
                "group relative flex w-full items-center rounded-md transition-colors min-h-[44px]",
                isActive
                  ? "border-l-2 border-l-primary bg-accent"
                  : "hover:bg-accent/50"
              )}
            >
              {isConfirming ? (
                /* Confirm / cancel row */
                <div className="flex w-full items-center justify-between gap-1 px-2 py-1.5">
                  <span className="truncate text-xs text-destructive font-mono">
                    Delete?
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(session.key)}
                      disabled={isDeleting}
                      className="rounded px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors min-h-[32px] disabled:opacity-50"
                    >
                      {isDeleting ? "..." : "Yes"}
                    </button>
                    <button
                      onClick={() => setConfirmingDelete(null)}
                      className="rounded px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors min-h-[32px]"
                    >
                      No
                    </button>
                  </div>
                </div>
              ) : (
                /* Normal session row */
                <>
                  <button
                    onClick={() => handleSelectSession(session.key)}
                    className={cn(
                      "flex flex-1 items-center gap-2 px-3 py-2.5 text-left text-sm min-w-0",
                      isActive
                        ? "font-medium text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <MessageSquare className="size-3.5 shrink-0 opacity-50" />
                    <span className="truncate font-mono text-xs">
                      {sessionLabel(session.key)}
                    </span>
                  </button>

                  {/* Delete button — visible on hover (desktop) or always on active */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmingDelete(session.key);
                    }}
                    className={cn(
                      "mr-1.5 flex shrink-0 items-center justify-center rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive min-h-[32px] min-w-[32px]",
                      isActive
                        ? "opacity-70"
                        : "opacity-0 group-hover:opacity-70 focus:opacity-70"
                    )}
                    aria-label="Delete session"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <>
      {/* Mobile hamburger toggle */}
      <button
        className="fixed left-3 top-3 z-50 flex size-11 items-center justify-center rounded-md border border-border bg-card text-foreground sm:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
      >
        {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-full flex-col border-r border-border bg-sidebar transition-transform duration-200 sm:relative sm:w-64 sm:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"
        )}
      >
        {/* Top: Brand + New Chat */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="font-display text-lg font-bold bg-gradient-to-r from-primary to-amber-400 bg-clip-text text-transparent">
            ClawLink
          </h2>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 min-h-[44px] sm:min-h-0"
            onClick={handleNewChat}
          >
            <Plus className="size-4" />
            <span className="text-xs">New Chat</span>
          </Button>
        </div>

        {/* Delete error banner */}
        {deleteError && (
          <div className="mx-2 mt-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive font-mono">
            {deleteError}
          </div>
        )}

        {/* Middle: Session list (scrollable) */}
        <div className="flex-1 scroll-contain space-y-1 p-2">
          {sessions.length === 0 && (
            <div className="px-3 py-4 text-center text-xs text-muted-foreground font-mono">
              // no sessions
            </div>
          )}
          {renderSessionGroup("Today", grouped.today)}
          {renderSessionGroup("Yesterday", grouped.yesterday)}
          {renderSessionGroup("Older", grouped.older)}
        </div>

        {/* Bottom: Overview link + Sign out */}
        <div className="border-t border-border p-2 space-y-1">
          <Link
            href="/dashboard"
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm transition-colors min-h-[44px]",
              isOverview
                ? "bg-accent font-medium text-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            <LayoutDashboard className="size-4" />
            Overview
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground min-h-[44px]"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 sm:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}

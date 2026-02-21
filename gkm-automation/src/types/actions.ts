export type ActionName =
  | "atem.program.set"
  | "atem.macro.run"
  | "propresenter.trigger"
  | "propresenter.next"
  | "propresenter.previous"
  | "propresenter.clear"
  | "system.health";

export type ActionPayloadMap = {
  "atem.program.set": { input: number };
  "atem.macro.run": { macroId: number };
  "propresenter.trigger": { playlistId: string; itemId: string };
  "propresenter.next": Record<string, never>;
  "propresenter.previous": Record<string, never>;
  "propresenter.clear": { target?: "all" | "slides" | "media" | "audio" };
  "system.health": Record<string, never>;
};

export type ActionRequest<T extends ActionName = ActionName> = {
  action: T;
  payload: ActionPayloadMap[T];
  requestId?: string;
  source?: string;
};

export type ActionResult = {
  ok: boolean;
  action: ActionName;
  dryRun: boolean;
  requestId?: string;
  message: string;
  data?: unknown;
  timestamp: string;
};

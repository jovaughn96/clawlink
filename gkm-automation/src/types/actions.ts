export type ActionName =
  | "atem.program.set"
  | "atem.macro.run"
  | "system.health";

export type ActionPayloadMap = {
  "atem.program.set": { input: number };
  "atem.macro.run": { macroId: number };
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

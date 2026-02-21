export type ActionName =
  | "atem.program.set"
  | "atem.me.program.set"
  | "atem.scene.take"
  | "atem.overlay.set"
  | "atem.scene.compose"
  | "atem.feed.mirror"
  | "atem.macro.run"
  | "propresenter.trigger"
  | "propresenter.next"
  | "propresenter.previous"
  | "propresenter.clear"
  | "system.health"
  | "system.profile.get";

export type ActionPayloadMap = {
  "atem.program.set": { input: number };
  "atem.me.program.set": { input: number; me: 1 | 2 };
  "atem.scene.take": { scene: string; me?: 1 | 2 };
  "atem.overlay.set": {
    me: 1 | 2;
    layer: "usk1" | "usk2";
    enabled: boolean;
  };
  "atem.scene.compose": {
    scene: string;
    me?: 1 | 2;
    overlays?: Partial<Record<"usk1" | "usk2", boolean>>;
  };
  "atem.feed.mirror": {
    fromMe: 1 | 2;
    toMe: 1 | 2;
    includeOverlays?: boolean;
  };
  "atem.macro.run": { macroId: number };
  "propresenter.trigger": { playlistId: string; itemId: string };
  "propresenter.next": Record<string, never>;
  "propresenter.previous": Record<string, never>;
  "propresenter.clear": { target?: "all" | "slides" | "media" | "audio" };
  "system.health": Record<string, never>;
  "system.profile.get": Record<string, never>;
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

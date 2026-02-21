export type MeBus = 1 | 2;

export const inputAliases = {
  follow: 1,
  wide: 2,
  "three-quarter": 3,
  wireless: 4,
  // SDI physical input 5 is bad; jib is remapped to input 9.
  jib: 9,
  drum: 6,
  handheld: 7,
  host: 8,
  aux: 8,
  laptop: 8,
  "playback-mini": 11,
  loop: 20
} as const;

export const meAliases: Record<string, MeBus> = {
  broadcast: 1,
  stream: 1,
  live: 1,
  auditorium: 2,
  lobby: 2,
  atrium: 2
};

export const keyLayers = {
  usk1: { name: "ProPresenter", role: "presentation-overlay" },
  usk2: { name: "GFXPC/TitleLive", role: "graphics-overlay" }
} as const;

export const scenePresets = {
  "sermon-follow": { input: "follow", defaultMe: 1 },
  "sermon-wide": { input: "wide", defaultMe: 1 },
  "sermon-close": { input: "three-quarter", defaultMe: 1 },
  "auditorium-wide": { input: "wide", defaultMe: 2 },
  "auditorium-follow": { input: "follow", defaultMe: 2 },
  "host-input": { input: "host", defaultMe: 1 },
  "playback-loop": { input: "playback-mini", defaultMe: 1 },
  "loop-return": { input: "loop", defaultMe: 2 }
} as const;

export type InputAlias = keyof typeof inputAliases;
export type ScenePreset = keyof typeof scenePresets;

export type MeBus = 1 | 2;

export const inputAliases = {
  // Camera lines
  follow: 1, // CAM1 - FOLLOW
  wide: 2, // CAM2 - WIDE
  "three-quarter": 3, // CAM3 - CLOSEUP
  closeup: 3,
  wireless: 4, // CAM4 - HH1
  hh1: 4,
  // SDI physical input 5 is bad; jib is remapped to input 9.
  jib: 9, // CAM5 - JIB
  drum: 6, // CAM6 - DRUMS
  handheld: 7, // CAM7 - HH2
  hh2: 7,

  // Stage/host and playback
  host: 8, // CAM8 - HOSTS
  hosts: 8,
  aux: 8,
  laptop: 8,
  "playback-mini": 11, // MINI / Play
  mini: 11,
  play: 11,

  // Loopback workflow
  loop: 20, // LOOP
  "loop-return": 20
} as const;

export const meAliases: Record<string, MeBus> = {
  // ME1 / BCAST
  broadcast: 1,
  bcast: 1,
  stream: 1,
  live: 1,

  // ME2 / SANCT
  auditorium: 2,
  sanct: 2,
  sanctuary: 2,
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

export type ProPresenterInstance = {
  id: string;
  name: string;
  host: string;
  port: number;
  password?: string;
  roles: string[];
  primary?: boolean;
};

export const propresenterInstances: ProPresenterInstance[] = [
  {
    id: "pp-main",
    name: "Pro7 - PC",
    host: "172.16.14.223",
    port: 64910,
    roles: ["main", "auditorium", "control", "sanctuary"],
    primary: true
  },
  {
    id: "pp-studio",
    name: "Studio iMac",
    host: "172.16.12.148",
    port: 1025,
    password: process.env.PROPRESENTER_STUDIO_PASSWORD,
    roles: ["studio", "booth"]
  },
  {
    id: "pp-playback",
    name: "Playback Mini",
    host: "172.16.14.222",
    port: 1025,
    password: process.env.PROPRESENTER_PLAYBACK_PASSWORD,
    roles: ["playback", "mini"]
  }
];

export function resolveProPresenterTarget(target?: string): ProPresenterInstance {
  if (!target) {
    const primary = propresenterInstances.find((x) => x.primary);
    if (!primary) throw new Error("No primary ProPresenter instance configured");
    return primary;
  }

  const t = target.toLowerCase().trim();
  const matched = propresenterInstances.find(
    (x) => x.id.toLowerCase() === t || x.name.toLowerCase() === t || x.roles.some((r) => r.toLowerCase() === t)
  );

  if (!matched) throw new Error(`Unknown ProPresenter target: ${target}`);
  return matched;
}

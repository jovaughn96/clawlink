import { env } from "../config/env.js";

type AtemConnectionLike = {
  connect: (ip: string) => Promise<void>;
  disconnect: () => void;
  connected: boolean;
  state?: {
    video?: {
      mixEffects?: Array<{ programInput?: number }>;
    };
  };
  changeProgramInput: (input: number, me?: number) => void;
  changeUpstreamKeyerOnAir?: (onAir: boolean, keyer?: number, me?: number) => void;
  macro: {
    runMacro: (macroId: number) => void;
  };
};

let connection: AtemConnectionLike | null = null;
let connectedIp: string | null = null;

async function getLiveConnection(): Promise<AtemConnectionLike> {
  if (connection && connectedIp === env.atemIp) {
    return connection;
  }

  const { Atem } = await import("atem-connection");
  const atem = new Atem() as unknown as AtemConnectionLike;
  await atem.connect(env.atemIp);
  connection = atem;
  connectedIp = env.atemIp;
  return atem;
}

export async function setProgramInput(input: number): Promise<{ target: string; input: number }> {
  const result = await setProgramInputForMe(input, 1);
  return { target: result.target, input: result.input };
}

export async function setProgramInputForMe(
  input: number,
  me: 1 | 2
): Promise<{ target: string; input: number; me: 1 | 2 }> {
  if (env.atemMock) {
    return { target: env.atemIp, input, me };
  }

  const atem = await getLiveConnection();
  atem.changeProgramInput(input, me - 1);
  return { target: env.atemIp, input, me };
}

export async function setOverlayForMe(
  me: 1 | 2,
  layer: "usk1" | "usk2",
  enabled: boolean
): Promise<{ target: string; me: 1 | 2; layer: "usk1" | "usk2"; enabled: boolean }> {
  if (env.atemMock) {
    return { target: env.atemIp, me, layer, enabled };
  }

  const atem = await getLiveConnection();
  if (!atem.changeUpstreamKeyerOnAir) {
    throw new Error("ATEM library missing upstream keyer control method");
  }

  const keyerIndex = layer === "usk1" ? 0 : 1;
  atem.changeUpstreamKeyerOnAir(enabled, keyerIndex, me - 1);
  return { target: env.atemIp, me, layer, enabled };
}

export async function getProgramInputForMe(me: 1 | 2): Promise<number> {
  const atem = await getLiveConnection();
  const value = atem.state?.video?.mixEffects?.[me - 1]?.programInput;
  if (typeof value !== "number") {
    throw new Error("Could not read program input for ME bus");
  }
  return value;
}

export async function runMacro(macroId: number): Promise<{ target: string; macroId: number }> {
  if (env.atemMock) {
    return { target: env.atemIp, macroId };
  }

  const atem = await getLiveConnection();
  atem.macro.runMacro(macroId);
  return { target: env.atemIp, macroId };
}

export function disconnectAtem(): void {
  if (connection) {
    connection.disconnect();
    connection = null;
    connectedIp = null;
  }
}

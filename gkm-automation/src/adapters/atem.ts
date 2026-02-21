import { env } from "../config/env.js";

type AtemConnectionLike = {
  connect: (ip: string) => Promise<void>;
  disconnect: () => void;
  connected: boolean;
  changeProgramInput: (input: number, me?: number) => void;
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

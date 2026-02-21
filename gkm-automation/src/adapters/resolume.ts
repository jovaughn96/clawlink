import dgram from "node:dgram";
import { resolumeConfig } from "../config/resolume.js";

function pad4(n: number): number {
  return (4 - (n % 4)) % 4;
}

function oscString(str: string): Buffer {
  const b = Buffer.from(`${str}\0`);
  return Buffer.concat([b, Buffer.alloc(pad4(b.length))]);
}

function oscFloat(v: number): Buffer {
  const b = Buffer.alloc(4);
  b.writeFloatBE(v);
  return b;
}

function oscMessage(address: string, types: string, args: number[]): Buffer {
  const parts: Buffer[] = [oscString(address), oscString(`,${types}`)];
  args.forEach((a) => parts.push(oscFloat(a)));
  return Buffer.concat(parts);
}

async function send(address: string, types = "f", args: number[] = [1]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const socket = dgram.createSocket("udp4");
    const msg = oscMessage(address, types, args);
    socket.send(msg, resolumeConfig.portIn, resolumeConfig.host, (err) => {
      socket.close();
      if (err) reject(err);
      else resolve();
    });
  });
}

export async function triggerClip(layer: number, clip: number): Promise<{ host: string; layer: number; clip: number }> {
  await send(`/composition/layers/${layer}/clips/${clip}/trigger`, "f", [1]);
  return { host: resolumeConfig.host, layer, clip };
}

export async function clearLayer(layer: number): Promise<{ host: string; layer: number }> {
  await send(`/composition/layers/${layer}/clear`, "f", [1]);
  return { host: resolumeConfig.host, layer };
}

export async function clearAll(): Promise<{ host: string }> {
  await send("/composition/clear", "f", [1]);
  return { host: resolumeConfig.host };
}

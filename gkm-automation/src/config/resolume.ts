export const resolumeConfig = {
  host: process.env.RESOLUME_HOST ?? "172.16.13.239",
  portIn: Number(process.env.RESOLUME_OSC_IN_PORT ?? 7000),
  portOut: Number(process.env.RESOLUME_OSC_OUT_PORT ?? 7001)
};

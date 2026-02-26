import { NicheConfig } from "../types/niche";

export const lashTechConfig: NicheConfig = {
  nicheKey: "lash-tech",
  displayName: "Lash Tech",
  clientFields: [
    { key: "allergies", label: "Allergies", type: "text" },
    {
      key: "preferredStyle",
      label: "Preferred Style",
      type: "select",
      options: ["Classic", "Hybrid", "Volume"],
    },
  ],
  appointmentFields: [
    {
      key: "fillType",
      label: "Fill Type",
      type: "select",
      options: ["2-week", "3-week", "4-week"],
    },
    { key: "patchTestDone", label: "Patch Test Done", type: "boolean" },
  ],
  serviceDefaults: {
    depositType: "percent",
    depositValue: 30,
  },
  templates: {
    booking_confirmation: "You’re booked for {{service}} on {{date}}.",
    late_policy: "Late arrivals over 15 min may require rescheduling.",
  },
};

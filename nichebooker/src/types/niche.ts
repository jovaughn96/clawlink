export type DynamicFieldType = "text" | "number" | "boolean" | "select";

export interface DynamicField {
  key: string;
  label: string;
  type: DynamicFieldType;
  required?: boolean;
  options?: string[];
}

export interface NicheConfig {
  nicheKey: string;
  displayName: string;
  clientFields: DynamicField[];
  appointmentFields: DynamicField[];
  serviceDefaults: {
    depositType: "none" | "fixed" | "percent";
    depositValue: number;
  };
  templates: Record<string, string>;
}

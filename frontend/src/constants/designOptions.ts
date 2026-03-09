export const DESIGN_OPTIONS = [
  { value: "impact-light", label: "Impact - Light" },
  { value: "impact-dark", label: "Impact - Dark" },
  { value: "minimal-light", label: "Minimal - Light" },
  { value: "minimal-dark", label: "Minimal - Dark" },
] as const;

export type DesignOptionValue = (typeof DESIGN_OPTIONS)[number]["value"];

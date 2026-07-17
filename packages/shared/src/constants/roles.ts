export const targetRoles = [
  "Frontend Engineer",
  "Backend Engineer",
  "Full-Stack Engineer",
  "Mobile Engineer",
  "DevOps Engineer",
  "Data Engineer",
  "Machine Learning Engineer",
] as const;

export type TargetRole = (typeof targetRoles)[number];


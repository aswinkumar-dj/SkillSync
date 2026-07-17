import { z } from "zod";

export const matchSearchSchema = z.object({
  prompt: z.string().min(5).max(500),
  targetRole: z.string().max(80).optional(),
  skills: z.array(z.string().min(1).max(50)).max(20).default([]),
  interviewTopics: z.array(z.string().min(1).max(50)).max(20).default([]),
  preferredLanguage: z.string().max(50).optional(),
  minYearsOfExperience: z.number().int().min(0).max(50).optional(),
  maxYearsOfExperience: z.number().int().min(0).max(50).optional(),
});

export type MatchSearchInput = z.infer<typeof matchSearchSchema>;


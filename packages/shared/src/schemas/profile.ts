import { z } from "zod";

export const availabilitySlotSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startMinute: z.number().int().min(0).max(1439),
  endMinute: z.number().int().min(1).max(1440),
  isActive: z.boolean().default(true),
});

export const userProfileSchema = z.object({
  name: z.string().min(2).max(80),
  bio: z.string().max(300).optional(),
  yearsOfExperience: z.number().int().min(0).max(50).optional(),
  targetRole: z.string().min(2).max(80).optional(),
  preferredLanguage: z.string().min(1).max(50).optional(),
  timezone: z.string().min(1).max(100).optional(),
  githubUrl: z.string().url().optional().or(z.literal("")),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  techStack: z.array(z.string().min(1).max(50)).max(20).default([]),
  skills: z.array(z.string().min(1).max(50)).max(30).default([]),
  interviewTopics: z.array(z.string().min(1).max(50)).max(20).default([]),
  availability: z.array(availabilitySlotSchema).max(30).default([]),
  isDiscoverable: z.boolean().default(true),
});

export type UserProfileInput = z.infer<typeof userProfileSchema>;
export type AvailabilitySlotInput = z.infer<typeof availabilitySlotSchema>;


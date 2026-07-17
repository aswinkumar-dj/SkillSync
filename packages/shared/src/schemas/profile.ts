import { z } from "zod";

const optionalTrimmedString = (max: number) =>
  z.preprocess((value) => {
    if (typeof value !== "string") {
      return value;
    }

    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  }, z.string().min(1).max(max).optional());

const optionalUrlString = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}, z.string().url().optional());

export const availabilitySlotSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startMinute: z.number().int().min(0).max(1439),
  endMinute: z.number().int().min(1).max(1440),
  isActive: z.boolean().default(true),
});

export const userProfileSchema = z.object({
  name: z.string().min(2).max(80),
  bio: optionalTrimmedString(300),
  yearsOfExperience: z.number().int().min(0).max(50).optional(),
  targetRole: optionalTrimmedString(80),
  preferredLanguage: optionalTrimmedString(50),
  timezone: optionalTrimmedString(100),
  githubUrl: optionalUrlString,
  linkedinUrl: optionalUrlString,
  techStack: z.array(z.string().min(1).max(50)).max(20).default([]),
  skills: z.array(z.string().min(1).max(50)).max(30).default([]),
  interviewTopics: z.array(z.string().min(1).max(50)).max(20).default([]),
  availability: z.array(availabilitySlotSchema).max(30).default([]),
  isDiscoverable: z.boolean().default(true),
});

export type UserProfileInput = z.infer<typeof userProfileSchema>;
export type AvailabilitySlotInput = z.infer<typeof availabilitySlotSchema>;

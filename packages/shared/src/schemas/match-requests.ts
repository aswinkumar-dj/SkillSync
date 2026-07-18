import { z } from "zod";

export const createMatchRequestSchema = z.object({
  receiverId: z.string().uuid(),
  message: z.string().trim().max(500).optional(),
  requestedRole: z.string().trim().max(80).optional(),
  requestedTopics: z.array(z.string().trim().min(1).max(50)).max(10).default([]),
});

export type CreateMatchRequestInput = z.infer<typeof createMatchRequestSchema>;

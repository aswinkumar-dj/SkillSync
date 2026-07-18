import { z } from "zod";

export const sendChatMessageSchema = z.object({
  content: z.string().trim().min(1, "Message cannot be empty.").max(4000),
});

export const listChatMessagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  beforeId: z.string().uuid().optional(),
});

export type SendChatMessageInput = z.infer<typeof sendChatMessageSchema>;
export type ListChatMessagesQuery = z.infer<typeof listChatMessagesQuerySchema>;

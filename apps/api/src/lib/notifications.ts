import type { NotificationType, Prisma } from "@prisma/client";

import { prisma } from "./prisma";
import { emitToUser } from "../sockets/io-registry";

type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Prisma.InputJsonValue;
};

export const createNotification = async (input: CreateNotificationInput) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        data: input.data,
      },
    });

    const payload = {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: notification.data,
      isRead: notification.isRead,
      createdAt: notification.createdAt.toISOString(),
    };

    emitToUser(input.userId, "notification:new", payload);

    return payload;
  } catch (error) {
    // Notifications must not break core match/chat flows.
    console.error("Failed to create notification", error);
    return null;
  }
};

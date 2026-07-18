import { Router } from "express";

import { listNotificationsQuerySchema } from "@skillsync/shared";

import { sendOk } from "../../lib/http";
import { prisma } from "../../lib/prisma";
import { requireAuth } from "../../middleware/auth";

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

const serializeNotification = (notification: {
  id: string;
  type: string;
  title: string;
  body: string;
  data: unknown;
  isRead: boolean;
  createdAt: Date;
}) => ({
  id: notification.id,
  type: notification.type,
  title: notification.title,
  body: notification.body,
  data: notification.data,
  isRead: notification.isRead,
  createdAt: notification.createdAt.toISOString(),
});

notificationsRouter.get("/", async (req, res, next) => {
  try {
    const userId = req.authUser!.id;
    const parsed = listNotificationsQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_QUERY",
          message: "Invalid notification query parameters.",
          details: parsed.error.flatten(),
        },
      });
    }

    const { limit, unreadOnly } = parsed.data;

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return sendOk(res, {
      notifications: notifications.map(serializeNotification),
    });
  } catch (error) {
    return next(error);
  }
});

notificationsRouter.get("/unread-count", async (req, res, next) => {
  try {
    const unreadCount = await prisma.notification.count({
      where: {
        userId: req.authUser!.id,
        isRead: false,
      },
    });

    return sendOk(res, { unreadCount });
  } catch (error) {
    return next(error);
  }
});

notificationsRouter.post("/read-all", async (req, res, next) => {
  try {
    const result = await prisma.notification.updateMany({
      where: {
        userId: req.authUser!.id,
        isRead: false,
      },
      data: { isRead: true },
    });

    return sendOk(res, {
      updatedCount: result.count,
    });
  } catch (error) {
    return next(error);
  }
});

notificationsRouter.post("/:id/read", async (req, res, next) => {
  try {
    const userId = req.authUser!.id;
    const existing = await prisma.notification.findFirst({
      where: {
        id: req.params.id,
        userId,
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOTIFICATION_NOT_FOUND",
          message: "Notification not found.",
        },
      });
    }

    const notification = existing.isRead
      ? existing
      : await prisma.notification.update({
          where: { id: existing.id },
          data: { isRead: true },
        });

    return sendOk(res, {
      notification: serializeNotification(notification),
    });
  } catch (error) {
    return next(error);
  }
});

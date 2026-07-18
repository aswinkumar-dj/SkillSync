import { Router } from "express";

import { listChatMessagesQuerySchema, sendChatMessageSchema } from "@skillsync/shared";

import { sendOk } from "../../lib/http";
import { createNotification } from "../../lib/notifications";
import { prisma } from "../../lib/prisma";
import { requireAuth } from "../../middleware/auth";
import { emitToChatRoom } from "../../sockets/io-registry";

export const chatRouter = Router();

chatRouter.use(requireAuth);

const partnerSelect = {
  id: true,
  name: true,
  avatarUrl: true,
  targetRole: true,
} as const;

const membershipWhere = (userId: string) => ({
  OR: [{ userAId: userId }, { userBId: userId }],
});

const serializePartner = (user: {
  id: string;
  name: string;
  avatarUrl: string | null;
  targetRole: string | null;
}) => user;

const serializeRoom = (
  room: {
    id: string;
    matchId: string;
    createdAt: Date;
    match: {
      id: string;
      status: string;
      userAId: string;
      userBId: string;
      userA: {
        id: string;
        name: string;
        avatarUrl: string | null;
        targetRole: string | null;
      };
      userB: {
        id: string;
        name: string;
        avatarUrl: string | null;
        targetRole: string | null;
      };
    };
    messages?: Array<{
      id: string;
      content: string;
      createdAt: Date;
      senderId: string;
    }>;
  },
  currentUserId: string,
) => {
  const partner =
    room.match.userAId === currentUserId ? room.match.userB : room.match.userA;
  const lastMessage = room.messages?.[0];

  return {
    id: room.id,
    matchId: room.matchId,
    matchStatus: room.match.status,
    createdAt: room.createdAt.toISOString(),
    partner: serializePartner(partner),
    lastMessage: lastMessage
      ? {
          id: lastMessage.id,
          content: lastMessage.content,
          senderId: lastMessage.senderId,
          createdAt: lastMessage.createdAt.toISOString(),
        }
      : null,
  };
};

const serializeMessage = (
  message: {
    id: string;
    roomId: string;
    senderId: string;
    type: string;
    content: string;
    createdAt: Date;
    editedAt: Date | null;
  },
  sender: { id: string; name: string; avatarUrl: string | null } | null,
) => ({
  id: message.id,
  roomId: message.roomId,
  senderId: message.senderId,
  type: message.type,
  content: message.content,
  createdAt: message.createdAt.toISOString(),
  editedAt: message.editedAt?.toISOString() ?? null,
  sender: sender
    ? {
        id: sender.id,
        name: sender.name,
        avatarUrl: sender.avatarUrl,
      }
    : null,
});

const getRoomForMember = async (roomId: string, userId: string) => {
  return prisma.chatRoom.findFirst({
    where: {
      id: roomId,
      match: {
        status: "ACTIVE",
        ...membershipWhere(userId),
      },
    },
    include: {
      match: {
        select: {
          id: true,
          status: true,
          userAId: true,
          userBId: true,
          userA: { select: partnerSelect },
          userB: { select: partnerSelect },
        },
      },
    },
  });
};

const ensureRoomForMatch = async (matchId: string, userId: string) => {
  const match = await prisma.match.findFirst({
    where: {
      id: matchId,
      status: "ACTIVE",
      ...membershipWhere(userId),
    },
    select: {
      id: true,
      status: true,
      userAId: true,
      userBId: true,
      chatRoom: {
        include: {
          match: {
            select: {
              id: true,
              status: true,
              userAId: true,
              userBId: true,
              userA: { select: partnerSelect },
              userB: { select: partnerSelect },
            },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              content: true,
              createdAt: true,
              senderId: true,
            },
          },
        },
      },
    },
  });

  if (!match) {
    return null;
  }

  if (match.chatRoom) {
    return match.chatRoom;
  }

  const room = await prisma.chatRoom.create({
    data: { matchId: match.id },
    include: {
      match: {
        select: {
          id: true,
          status: true,
          userAId: true,
          userBId: true,
          userA: { select: partnerSelect },
          userB: { select: partnerSelect },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          content: true,
          createdAt: true,
          senderId: true,
        },
      },
    },
  });

  return room;
};

chatRouter.get("/rooms", async (req, res, next) => {
  try {
    const userId = req.authUser!.id;

    const rooms = await prisma.chatRoom.findMany({
      where: {
        match: {
          status: "ACTIVE",
          ...membershipWhere(userId),
        },
      },
      include: {
        match: {
          select: {
            id: true,
            status: true,
            userAId: true,
            userBId: true,
            userA: { select: partnerSelect },
            userB: { select: partnerSelect },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            content: true,
            createdAt: true,
            senderId: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const sorted = [...rooms].sort((left, right) => {
      const leftTime = left.messages[0]?.createdAt.getTime() ?? left.createdAt.getTime();
      const rightTime = right.messages[0]?.createdAt.getTime() ?? right.createdAt.getTime();
      return rightTime - leftTime;
    });

    return sendOk(res, {
      rooms: sorted.map((room) => serializeRoom(room, userId)),
    });
  } catch (error) {
    return next(error);
  }
});

chatRouter.get("/rooms/match/:matchId", async (req, res, next) => {
  try {
    const userId = req.authUser!.id;
    const room = await ensureRoomForMatch(req.params.matchId, userId);

    if (!room) {
      return res.status(404).json({
        success: false,
        error: {
          code: "MATCH_NOT_FOUND",
          message: "Active match not found.",
        },
      });
    }

    return sendOk(res, {
      room: serializeRoom(room, userId),
    });
  } catch (error) {
    return next(error);
  }
});

chatRouter.get("/rooms/:roomId", async (req, res, next) => {
  try {
    const userId = req.authUser!.id;
    const room = await getRoomForMember(req.params.roomId, userId);

    if (!room) {
      return res.status(404).json({
        success: false,
        error: {
          code: "ROOM_NOT_FOUND",
          message: "Chat room not found.",
        },
      });
    }

    const lastMessage = await prisma.chatMessage.findFirst({
      where: { roomId: room.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        content: true,
        createdAt: true,
        senderId: true,
      },
    });

    return sendOk(res, {
      room: serializeRoom({ ...room, messages: lastMessage ? [lastMessage] : [] }, userId),
    });
  } catch (error) {
    return next(error);
  }
});

chatRouter.get("/rooms/:roomId/messages", async (req, res, next) => {
  try {
    const userId = req.authUser!.id;
    const parsed = listChatMessagesQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_QUERY",
          message: "Invalid message query parameters.",
          details: parsed.error.flatten(),
        },
      });
    }

    const room = await getRoomForMember(req.params.roomId, userId);

    if (!room) {
      return res.status(404).json({
        success: false,
        error: {
          code: "ROOM_NOT_FOUND",
          message: "Chat room not found.",
        },
      });
    }

    const { limit, beforeId } = parsed.data;
    let beforeCreatedAt: Date | undefined;

    if (beforeId) {
      const cursorMessage = await prisma.chatMessage.findFirst({
        where: { id: beforeId, roomId: room.id },
        select: { createdAt: true },
      });

      if (!cursorMessage) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_CURSOR",
            message: "Message cursor is invalid for this room.",
          },
        });
      }

      beforeCreatedAt = cursorMessage.createdAt;
    }

    const messages = await prisma.chatMessage.findMany({
      where: {
        roomId: room.id,
        ...(beforeCreatedAt
          ? {
              createdAt: { lt: beforeCreatedAt },
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const senderIds = [...new Set(messages.map((message) => message.senderId))];
    const senders = await prisma.user.findMany({
      where: { id: { in: senderIds } },
      select: { id: true, name: true, avatarUrl: true },
    });
    const senderMap = new Map(senders.map((sender) => [sender.id, sender]));

    // Return chronological order for UI rendering.
    const chronological = [...messages].reverse();

    return sendOk(res, {
      messages: chronological.map((message) =>
        serializeMessage(message, senderMap.get(message.senderId) ?? null),
      ),
      hasMore: messages.length === limit,
    });
  } catch (error) {
    return next(error);
  }
});

chatRouter.post("/rooms/:roomId/messages", async (req, res, next) => {
  try {
    const userId = req.authUser!.id;
    const parsed = sendChatMessageSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_MESSAGE",
          message: "Please check your message and try again.",
          details: parsed.error.flatten(),
        },
      });
    }

    const room = await getRoomForMember(req.params.roomId, userId);

    if (!room) {
      return res.status(404).json({
        success: false,
        error: {
          code: "ROOM_NOT_FOUND",
          message: "Chat room not found.",
        },
      });
    }

    const content = parsed.data.content.trim();
    const message = await prisma.chatMessage.create({
      data: {
        roomId: room.id,
        senderId: userId,
        type: "TEXT",
        content,
      },
    });

    const sender = {
      id: req.authUser!.id,
      name: req.authUser!.name,
      avatarUrl: null as string | null,
    };

    const senderProfile = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, avatarUrl: true },
    });

    const payload = serializeMessage(message, senderProfile ?? sender);

    emitToChatRoom(room.id, "chat:message", payload);

    const partnerId =
      room.match.userAId === userId ? room.match.userBId : room.match.userAId;

    await createNotification({
      userId: partnerId,
      type: "CHAT_MESSAGE",
      title: `New message from ${req.authUser!.name}`,
      body: content.length > 120 ? `${content.slice(0, 117)}...` : content,
      data: {
        roomId: room.id,
        matchId: room.matchId,
        messageId: message.id,
        senderId: userId,
      },
    });

    return sendOk(res, { message: payload });
  } catch (error) {
    return next(error);
  }
});

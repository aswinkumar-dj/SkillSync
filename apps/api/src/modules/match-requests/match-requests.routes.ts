import { Router } from "express";

import { createMatchRequestSchema } from "@skillsync/shared";

import { sendOk } from "../../lib/http";
import { createNotification } from "../../lib/notifications";
import { prisma } from "../../lib/prisma";
import { requireAuth } from "../../middleware/auth";

export const matchRequestsRouter = Router();

matchRequestsRouter.use(requireAuth);

const partnerSelect = {
  id: true,
  name: true,
  avatarUrl: true,
  targetRole: true,
  preferredLanguage: true,
  yearsOfExperience: true,
} as const;

const requestInclude = {
  sender: { select: partnerSelect },
  receiver: { select: partnerSelect },
  createdMatch: { select: { id: true, status: true } },
} as const;

type RequestWithRelations = {
  id: string;
  message: string | null;
  requestedRole: string | null;
  requestedTopics: unknown;
  status: string;
  createdAt: Date;
  respondedAt: Date | null;
  sender: {
    id: string;
    name: string;
    avatarUrl: string | null;
    targetRole: string | null;
    preferredLanguage: string | null;
    yearsOfExperience: number | null;
  };
  receiver: {
    id: string;
    name: string;
    avatarUrl: string | null;
    targetRole: string | null;
    preferredLanguage: string | null;
    yearsOfExperience: number | null;
  };
  createdMatch: { id: string; status: string } | null;
};

const serializeRequest = (request: RequestWithRelations) => ({
  id: request.id,
  message: request.message,
  requestedRole: request.requestedRole,
  requestedTopics: Array.isArray(request.requestedTopics) ? request.requestedTopics : [],
  status: request.status,
  createdAt: request.createdAt.toISOString(),
  respondedAt: request.respondedAt?.toISOString() ?? null,
  sender: request.sender,
  receiver: request.receiver,
  match: request.createdMatch,
});

const activeMatchWhere = (leftUserId: string, rightUserId: string) => ({
  status: "ACTIVE" as const,
  OR: [
    { userAId: leftUserId, userBId: rightUserId },
    { userAId: rightUserId, userBId: leftUserId },
  ],
});

const orderedPair = (leftUserId: string, rightUserId: string) =>
  leftUserId < rightUserId
    ? { userAId: leftUserId, userBId: rightUserId }
    : { userAId: rightUserId, userBId: leftUserId };

matchRequestsRouter.post("/", async (req, res, next) => {
  try {
    const parsed = createMatchRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_MATCH_REQUEST",
          message: "Please check the request details and try again.",
          details: parsed.error.flatten(),
        },
      });
    }

    const senderId = req.authUser!.id;
    const { receiverId } = parsed.data;

    if (senderId === receiverId) {
      return res.status(400).json({
        success: false,
        error: {
          code: "SELF_MATCH_REQUEST",
          message: "You cannot send a match request to yourself.",
        },
      });
    }

    const [sender, receiver, existingPending, existingMatch] = await Promise.all([
      prisma.user.findUnique({
        where: { id: senderId },
        select: { isProfileComplete: true },
      }),
      prisma.user.findFirst({
        where: {
          id: receiverId,
          status: "ACTIVE",
          isProfileComplete: true,
          isDiscoverable: true,
        },
        select: { id: true },
      }),
      prisma.matchRequest.findFirst({
        where: {
          status: "PENDING",
          OR: [
            { senderId, receiverId },
            { senderId: receiverId, receiverId: senderId },
          ],
        },
        select: { id: true },
      }),
      prisma.match.findFirst({
        where: activeMatchWhere(senderId, receiverId),
        select: { id: true },
      }),
    ]);

    if (!sender?.isProfileComplete) {
      return res.status(403).json({
        success: false,
        error: {
          code: "PROFILE_INCOMPLETE",
          message: "Complete your profile before sending match requests.",
        },
      });
    }

    if (!receiver) {
      return res.status(404).json({
        success: false,
        error: {
          code: "RECEIVER_UNAVAILABLE",
          message: "This profile is not available for requests.",
        },
      });
    }

    if (existingPending || existingMatch) {
      return res.status(409).json({
        success: false,
        error: {
          code: "REQUEST_ALREADY_EXISTS",
          message: "A pending request or active match already exists with this person.",
        },
      });
    }

    const request = await prisma.matchRequest.create({
      data: {
        senderId,
        receiverId,
        message: parsed.data.message?.trim() || null,
        requestedRole: parsed.data.requestedRole?.trim() || null,
        requestedTopics: parsed.data.requestedTopics,
      },
      include: requestInclude,
    });

    await createNotification({
      userId: receiverId,
      type: "MATCH_REQUEST_RECEIVED",
      title: "New match request",
      body: `${request.sender.name} wants to practice with you.`,
      data: {
        requestId: request.id,
        senderId,
      },
    });

    return sendOk(res, {
      request: serializeRequest(request as RequestWithRelations),
    });
  } catch (error) {
    return next(error);
  }
});

matchRequestsRouter.get("/incoming", async (req, res, next) => {
  try {
    const requests = await prisma.matchRequest.findMany({
      where: { receiverId: req.authUser!.id },
      include: requestInclude,
      orderBy: { createdAt: "desc" },
    });

    return sendOk(res, {
      requests: requests.map((request) => serializeRequest(request as RequestWithRelations)),
    });
  } catch (error) {
    return next(error);
  }
});

matchRequestsRouter.get("/outgoing", async (req, res, next) => {
  try {
    const requests = await prisma.matchRequest.findMany({
      where: { senderId: req.authUser!.id },
      include: requestInclude,
      orderBy: { createdAt: "desc" },
    });

    return sendOk(res, {
      requests: requests.map((request) => serializeRequest(request as RequestWithRelations)),
    });
  } catch (error) {
    return next(error);
  }
});

matchRequestsRouter.post("/:id/accept", async (req, res, next) => {
  try {
    const receiverId = req.authUser!.id;
    const request = await prisma.matchRequest.findFirst({
      where: {
        id: req.params.id,
        receiverId,
        status: "PENDING",
      },
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        error: {
          code: "REQUEST_NOT_FOUND",
          message: "Pending request not found.",
        },
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const pair = orderedPair(request.senderId, request.receiverId);

      const existingMatch = await tx.match.findFirst({
        where: activeMatchWhere(request.senderId, request.receiverId),
        select: {
          id: true,
          status: true,
          chatRoom: { select: { id: true } },
        },
      });

      await tx.matchRequest.update({
        where: { id: request.id },
        data: {
          status: "ACCEPTED",
          respondedAt: new Date(),
        },
      });

      const match =
        existingMatch ??
        (await tx.match.create({
          data: {
            ...pair,
            createdFromRequestId: request.id,
          },
          select: {
            id: true,
            status: true,
            chatRoom: { select: { id: true } },
          },
        }));

      const chatRoom =
        match.chatRoom ??
        (await tx.chatRoom.create({
          data: { matchId: match.id },
          select: { id: true },
        }));

      await tx.matchRequest.updateMany({
        where: {
          id: { not: request.id },
          status: "PENDING",
          OR: [
            { senderId: request.senderId, receiverId: request.receiverId },
            { senderId: request.receiverId, receiverId: request.senderId },
          ],
        },
        data: {
          status: "CANCELLED",
          respondedAt: new Date(),
        },
      });

      const updatedRequest = await tx.matchRequest.findUniqueOrThrow({
        where: { id: request.id },
        include: requestInclude,
      });

      return {
        request: updatedRequest,
        match: {
          id: match.id,
          status: match.status,
          chatRoomId: chatRoom.id,
        },
      };
    });

    await createNotification({
      userId: request.senderId,
      type: "MATCH_REQUEST_ACCEPTED",
      title: "Match request accepted",
      body: `${result.request.receiver.name} accepted your match request.`,
      data: {
        requestId: request.id,
        matchId: result.match.id,
        chatRoomId: result.match.chatRoomId,
        receiverId: request.receiverId,
      },
    });

    return sendOk(res, {
      request: serializeRequest(result.request as RequestWithRelations),
      match: result.match,
    });
  } catch (error) {
    return next(error);
  }
});

matchRequestsRouter.post("/:id/decline", async (req, res, next) => {
  try {
    const request = await prisma.matchRequest.findFirst({
      where: {
        id: req.params.id,
        receiverId: req.authUser!.id,
        status: "PENDING",
      },
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        error: {
          code: "REQUEST_NOT_FOUND",
          message: "Pending request not found.",
        },
      });
    }

    const updated = await prisma.matchRequest.update({
      where: { id: request.id },
      data: {
        status: "DECLINED",
        respondedAt: new Date(),
      },
      include: requestInclude,
    });

    return sendOk(res, {
      request: serializeRequest(updated as RequestWithRelations),
    });
  } catch (error) {
    return next(error);
  }
});

matchRequestsRouter.post("/:id/cancel", async (req, res, next) => {
  try {
    const request = await prisma.matchRequest.findFirst({
      where: {
        id: req.params.id,
        senderId: req.authUser!.id,
        status: "PENDING",
      },
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        error: {
          code: "REQUEST_NOT_FOUND",
          message: "Pending request not found.",
        },
      });
    }

    const updated = await prisma.matchRequest.update({
      where: { id: request.id },
      data: {
        status: "CANCELLED",
        respondedAt: new Date(),
      },
      include: requestInclude,
    });

    return sendOk(res, {
      request: serializeRequest(updated as RequestWithRelations),
    });
  } catch (error) {
    return next(error);
  }
});

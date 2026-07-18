import { Router } from "express";

import { createMatchRequestSchema } from "@skillsync/shared";

import { sendOk } from "../../lib/http";
import { prisma } from "../../lib/prisma";
import { requireAuth } from "../../middleware/auth";

export const matchRequestsRouter = Router();

matchRequestsRouter.use(requireAuth);

const userSelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
  targetRole: true,
  preferredLanguage: true,
  yearsOfExperience: true,
} as const;

const requestInclude = {
  sender: { select: userSelect },
  receiver: { select: userSelect },
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
  sender: Record<string, unknown>;
  receiver: Record<string, unknown>;
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
        error: { code: "SELF_MATCH_REQUEST", message: "You cannot send a match request to yourself." },
      });
    }

    const [sender, receiver, existingPending, existingMatch] = await Promise.all([
      prisma.user.findUnique({ where: { id: senderId }, select: { isProfileComplete: true } }),
      prisma.user.findFirst({
        where: { id: receiverId, status: "ACTIVE", isProfileComplete: true, isDiscoverable: true },
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
      }),
      prisma.match.findFirst({ where: activeMatchWhere(senderId, receiverId) }),
    ]);

    if (!sender?.isProfileComplete) {
      return res.status(403).json({
        success: false,
        error: { code: "PROFILE_INCOMPLETE", message: "Complete your profile before sending match requests." },
      });
    }

    if (!receiver) {
      return res.status(404).json({
        success: false,
        error: { code: "RECEIVER_UNAVAILABLE", message: "This profile is not available for requests." },
      });
    }

    if (existingPending || existingMatch) {
      return res.status(409).json({
        success: false,
        error: { code: "REQUEST_ALREADY_EXISTS", message: "A pending request or active match already exists." },
      });
    }

    const request = await prisma.matchRequest.create({
      data: {
        senderId,
        receiverId,
        message: parsed.data.message || null,
        requestedRole: parsed.data.requestedRole || null,
        requestedTopics: parsed.data.requestedTopics,
      },
      include: requestInclude,
    });

    return sendOk(res, { request: serializeRequest(request as RequestWithRelations) });
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

    return sendOk(res, { requests: requests.map((request) => serializeRequest(request as RequestWithRelations)) });
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

    return sendOk(res, { requests: requests.map((request) => serializeRequest(request as RequestWithRelations)) });
  } catch (error) {
    return next(error);
  }
});

matchRequestsRouter.post("/:id/accept", async (req, res, next) => {
  try {
    const request = await prisma.matchRequest.findFirst({ where: { id: req.params.id, receiverId: req.authUser!.id } });

    if (!request || request.status !== "PENDING") {
      return res.status(404).json({
        success: false,
        error: { code: "REQUEST_NOT_FOUND", message: "Pending request not found." },
      });
    }

    const existingMatch = await prisma.match.findFirst({ where: activeMatchWhere(request.senderId, request.receiverId) });

    const result = await prisma.$transaction(async (tx) => {
      const updatedRequest = await tx.matchRequest.update({
        where: { id: request.id },
        data: { status: "ACCEPTED", respondedAt: new Date() },
        include: requestInclude,
      });

      const match = existingMatch ?? await tx.match.create({
        data: {
          userAId: request.senderId < request.receiverId ? request.senderId : request.receiverId,
          userBId: request.senderId < request.receiverId ? request.receiverId : request.senderId,
          createdFromRequestId: request.id,
        },
        select: { id: true, status: true },
      });

      await tx.matchRequest.updateMany({
        where: {
          id: { not: request.id },
          status: "PENDING",
          OR: [
            { senderId: request.senderId, receiverId: request.receiverId },
            { senderId: request.receiverId, receiverId: request.senderId },
          ],
        },
        data: { status: "CANCELLED", respondedAt: new Date() },
      });

      return { request: updatedRequest, match };
    });

    return sendOk(res, { request: serializeRequest(result.request as RequestWithRelations), match: result.match });
  } catch (error) {
    return next(error);
  }
});

matchRequestsRouter.post("/:id/decline", async (req, res, next) => {
  try {
    const request = await prisma.matchRequest.findFirst({
      where: { id: req.params.id, receiverId: req.authUser!.id, status: "PENDING" },
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        error: { code: "REQUEST_NOT_FOUND", message: "Pending request not found." },
      });
    }

    const updated = await prisma.matchRequest.update({
      where: { id: request.id },
      data: { status: "DECLINED", respondedAt: new Date() },
      include: requestInclude,
    });

    return sendOk(res, { request: serializeRequest(updated as RequestWithRelations) });
  } catch (error) {
    return next(error);
  }
});

matchRequestsRouter.post("/:id/cancel", async (req, res, next) => {
  try {
    const request = await prisma.matchRequest.findFirst({
      where: { id: req.params.id, senderId: req.authUser!.id, status: "PENDING" },
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        error: { code: "REQUEST_NOT_FOUND", message: "Pending request not found." },
      });
    }

    const updated = await prisma.matchRequest.update({
      where: { id: request.id },
      data: { status: "CANCELLED", respondedAt: new Date() },
      include: requestInclude,
    });

    return sendOk(res, { request: serializeRequest(updated as RequestWithRelations) });
  } catch (error) {
    return next(error);
  }
});

import { Router } from "express";

import { sendOk } from "../../lib/http";
import { prisma } from "../../lib/prisma";
import { requireAuth } from "../../middleware/auth";

export const matchesRouter = Router();

matchesRouter.use(requireAuth);

const partnerSelect = {
  id: true,
  name: true,
  avatarUrl: true,
  targetRole: true,
  preferredLanguage: true,
  yearsOfExperience: true,
  bio: true,
  timezone: true,
  githubUrl: true,
  linkedinUrl: true,
  skills: { include: { skill: { select: { name: true } } } },
  techStackItems: { include: { techStackItem: { select: { name: true } } } },
  interviewTopics: { include: { interviewTopic: { select: { name: true } } } },
} as const;

const serializePartner = (user: {
  id: string;
  name: string;
  avatarUrl: string | null;
  targetRole: string | null;
  preferredLanguage: string | null;
  yearsOfExperience: number | null;
  bio: string | null;
  timezone: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  skills: Array<{ skill: { name: string } }>;
  techStackItems: Array<{ techStackItem: { name: string } }>;
  interviewTopics: Array<{ interviewTopic: { name: string } }>;
}) => ({
  id: user.id,
  name: user.name,
  avatarUrl: user.avatarUrl,
  targetRole: user.targetRole,
  preferredLanguage: user.preferredLanguage,
  yearsOfExperience: user.yearsOfExperience,
  bio: user.bio,
  timezone: user.timezone,
  githubUrl: user.githubUrl,
  linkedinUrl: user.linkedinUrl,
  skills: user.skills.map((item) => item.skill.name),
  techStack: user.techStackItems.map((item) => item.techStackItem.name),
  interviewTopics: user.interviewTopics.map((item) => item.interviewTopic.name),
});

const matchInclude = {
  userA: { select: partnerSelect },
  userB: { select: partnerSelect },
  chatRoom: { select: { id: true } },
  createdFromRequest: {
    select: {
      id: true,
      message: true,
      requestedRole: true,
      requestedTopics: true,
      createdAt: true,
      respondedAt: true,
    },
  },
} as const;

const serializeMatch = (
  match: {
    id: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    userAId: string;
    userBId: string;
    userA: Parameters<typeof serializePartner>[0];
    userB: Parameters<typeof serializePartner>[0];
    chatRoom: { id: string } | null;
    createdFromRequest: {
      id: string;
      message: string | null;
      requestedRole: string | null;
      requestedTopics: unknown;
      createdAt: Date;
      respondedAt: Date | null;
    };
  },
  currentUserId: string,
) => {
  const partner = match.userAId === currentUserId ? match.userB : match.userA;

  return {
    id: match.id,
    status: match.status,
    createdAt: match.createdAt.toISOString(),
    updatedAt: match.updatedAt.toISOString(),
    chatRoomId: match.chatRoom?.id ?? null,
    partner: serializePartner(partner),
    request: {
      id: match.createdFromRequest.id,
      message: match.createdFromRequest.message,
      requestedRole: match.createdFromRequest.requestedRole,
      requestedTopics: Array.isArray(match.createdFromRequest.requestedTopics)
        ? match.createdFromRequest.requestedTopics
        : [],
      createdAt: match.createdFromRequest.createdAt.toISOString(),
      respondedAt: match.createdFromRequest.respondedAt?.toISOString() ?? null,
    },
  };
};

const membershipWhere = (userId: string) => ({
  OR: [{ userAId: userId }, { userBId: userId }],
});

matchesRouter.get("/", async (req, res, next) => {
  try {
    const userId = req.authUser!.id;

    const matches = await prisma.match.findMany({
      where: {
        ...membershipWhere(userId),
        status: "ACTIVE",
      },
      include: matchInclude,
      orderBy: { updatedAt: "desc" },
    });

    return sendOk(res, {
      matches: matches.map((match) => serializeMatch(match, userId)),
    });
  } catch (error) {
    return next(error);
  }
});

matchesRouter.get("/:id", async (req, res, next) => {
  try {
    const userId = req.authUser!.id;

    const match = await prisma.match.findFirst({
      where: {
        id: req.params.id,
        ...membershipWhere(userId),
      },
      include: matchInclude,
    });

    if (!match) {
      return res.status(404).json({
        success: false,
        error: {
          code: "MATCH_NOT_FOUND",
          message: "Match not found.",
        },
      });
    }

    return sendOk(res, {
      match: serializeMatch(match, userId),
    });
  } catch (error) {
    return next(error);
  }
});

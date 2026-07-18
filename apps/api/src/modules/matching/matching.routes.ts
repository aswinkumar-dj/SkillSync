import { Router } from "express";

import { matchSearchSchema } from "@skillsync/shared";

import { sendOk } from "../../lib/http";
import { prisma } from "../../lib/prisma";
import { requireAuth } from "../../middleware/auth";

export const matchingRouter = Router();

matchingRouter.use(requireAuth);

type CandidateWithRelations = {
  id: string;
  name: string;
  avatarUrl: string | null;
  targetRole: string | null;
  preferredLanguage: string | null;
  yearsOfExperience: number | null;
  skills: Array<{ skill: { name: string } }>;
  interviewTopics: Array<{ interviewTopic: { name: string } }>;
};

matchingRouter.post("/search", async (req, res, next) => {
  try {
    const parsed = matchSearchSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_MATCH_SEARCH",
          details: parsed.error.flatten(),
        },
      });
    }

    const currentUser = await prisma.user.findUniqueOrThrow({
      where: { id: req.authUser!.id },
    });

    if (!currentUser.isProfileComplete) {
      return res.status(403).json({
        success: false,
        error: {
          code: "PROFILE_INCOMPLETE",
          message: "Complete your profile before searching for interview partners.",
        },
      });
    }

    const candidates = (await prisma.user.findMany({
      where: {
        id: { not: currentUser.id },
        status: "ACTIVE",
        isDiscoverable: true,
        isProfileComplete: true,
        ...(parsed.data.targetRole ? { targetRole: parsed.data.targetRole } : {}),
        ...(parsed.data.preferredLanguage ? { preferredLanguage: parsed.data.preferredLanguage } : {}),
        ...(typeof parsed.data.minYearsOfExperience === "number"
          ? { yearsOfExperience: { gte: parsed.data.minYearsOfExperience } }
          : {}),
        ...(typeof parsed.data.maxYearsOfExperience === "number"
          ? { yearsOfExperience: { lte: parsed.data.maxYearsOfExperience } }
          : {}),
      },
      include: {
        skills: { include: { skill: true } },
        interviewTopics: { include: { interviewTopic: true } },
      },
      take: 12,
      orderBy: [{ updatedAt: "desc" }],
    })) as CandidateWithRelations[];

    const requestedSkills = new Set(parsed.data.skills.map((item) => item.toLowerCase()));
    const requestedTopics = new Set(parsed.data.interviewTopics.map((item) => item.toLowerCase()));

    const rankedCandidates = candidates
      .map((candidate) => {
        const skillMatches = candidate.skills.filter((item) => requestedSkills.has(item.skill.name.toLowerCase())).length;
        const topicMatches = candidate.interviewTopics.filter((item) =>
          requestedTopics.has(item.interviewTopic.name.toLowerCase()),
        ).length;
        const score = skillMatches * 2 + topicMatches;
        const matchReasons = [
          ...(candidate.targetRole === currentUser.targetRole && candidate.targetRole
            ? [`Shared target: ${candidate.targetRole}`]
            : []),
          ...(candidate.preferredLanguage === currentUser.preferredLanguage && candidate.preferredLanguage
            ? [`Both practice in ${candidate.preferredLanguage}`]
            : []),
          ...candidate.skills
            .filter((item) => requestedSkills.has(item.skill.name.toLowerCase()))
            .slice(0, 2)
            .map((item) => `Shared skill: ${item.skill.name}`),
          ...candidate.interviewTopics
            .filter((item) => requestedTopics.has(item.interviewTopic.name.toLowerCase()))
            .slice(0, 2)
            .map((item) => `Shared topic: ${item.interviewTopic.name}`),
        ].slice(0, 3);

        return {
          id: candidate.id,
          name: candidate.name,
          avatarUrl: candidate.avatarUrl,
          targetRole: candidate.targetRole,
          preferredLanguage: candidate.preferredLanguage,
          yearsOfExperience: candidate.yearsOfExperience,
          skills: candidate.skills.map((item) => item.skill.name),
          interviewTopics: candidate.interviewTopics.map((item) => item.interviewTopic.name),
          matchScore: score,
          matchReasons,
        };
      })
      .sort((left, right) => right.matchScore - left.matchScore);

    return sendOk(res, {
      query: parsed.data,
      candidates: rankedCandidates,
      message: "Profile-complete users are filtered deterministically. Gemini ranking narrative is the next layer.",
    });
  } catch (error) {
    return next(error);
  }
});

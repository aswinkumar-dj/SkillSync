import { Router } from "express";

import { userProfileSchema } from "@skillsync/shared";

import { sendOk } from "../../lib/http";
import { prisma } from "../../lib/prisma";
import { requireAuth } from "../../middleware/auth";

export const usersRouter = Router();

const createProfileInclude = () => ({
  skills: { include: { skill: true } },
  techStackItems: { include: { techStackItem: true } },
  interviewTopics: { include: { interviewTopic: true } },
  availabilitySlots: { orderBy: [{ dayOfWeek: "asc" as const }, { startMinute: "asc" as const }] },
});

const normalizeItems = (items: string[]) => Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));

const computeProfileComplete = (input: {
  bio?: string | null;
  targetRole?: string | null;
  preferredLanguage?: string | null;
  timezone?: string | null;
  yearsOfExperience?: number | null;
  skills: string[];
  techStack: string[];
  interviewTopics: string[];
  availabilityCount: number;
}) =>
  Boolean(
    input.bio &&
      input.targetRole &&
      input.preferredLanguage &&
      input.timezone &&
      typeof input.yearsOfExperience === "number" &&
      input.skills.length > 0 &&
      input.techStack.length > 0 &&
      input.interviewTopics.length > 0 &&
      input.availabilityCount > 0,
  );

type UserWithProfile = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  yearsOfExperience: number | null;
  targetRole: string | null;
  preferredLanguage: string | null;
  timezone: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  isProfileComplete: boolean;
  isDiscoverable: boolean;
  skills: Array<{ skill: { name: string } }>;
  techStackItems: Array<{ techStackItem: { name: string } }>;
  interviewTopics: Array<{ interviewTopic: { name: string } }>;
  availabilitySlots: Array<{ dayOfWeek: number; startMinute: number; endMinute: number; isActive: boolean }>;
};

const serializeUser = (user: UserWithProfile) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  avatarUrl: user.avatarUrl,
  bio: user.bio,
  yearsOfExperience: user.yearsOfExperience,
  targetRole: user.targetRole,
  preferredLanguage: user.preferredLanguage,
  timezone: user.timezone,
  githubUrl: user.githubUrl,
  linkedinUrl: user.linkedinUrl,
  isProfileComplete: user.isProfileComplete,
  isDiscoverable: user.isDiscoverable,
  skills: user.skills.map((item) => item.skill.name),
  techStack: user.techStackItems.map((item) => item.techStackItem.name),
  interviewTopics: user.interviewTopics.map((item) => item.interviewTopic.name),
  availability: user.availabilitySlots,
});

const ensureSkills = async (names: string[]) => {
  if (names.length === 0) {
    return [] as Array<{ id: string; name: string }>;
  }

  await prisma.$transaction(
    names.map((name) =>
      prisma.skill.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  );

  return prisma.skill.findMany({
    where: { name: { in: names } },
    select: { id: true, name: true },
  });
};

const ensureTechStackItems = async (names: string[]) => {
  if (names.length === 0) {
    return [] as Array<{ id: string; name: string }>;
  }

  await prisma.$transaction(
    names.map((name) =>
      prisma.techStackItem.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  );

  return prisma.techStackItem.findMany({
    where: { name: { in: names } },
    select: { id: true, name: true },
  });
};

const ensureInterviewTopics = async (names: string[]) => {
  if (names.length === 0) {
    return [] as Array<{ id: string; name: string }>;
  }

  await prisma.$transaction(
    names.map((name) =>
      prisma.interviewTopic.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  );

  return prisma.interviewTopic.findMany({
    where: { name: { in: names } },
    select: { id: true, name: true },
  });
};

usersRouter.use(requireAuth);

usersRouter.get("/me", async (req, res, next) => {
  try {
    const user = (await prisma.user.findUniqueOrThrow({
      where: { id: req.authUser!.id },
      include: createProfileInclude(),
    })) as unknown as UserWithProfile;

    return sendOk(res, { profile: serializeUser(user) });
  } catch (error) {
    return next(error);
  }
});

usersRouter.get("/me/profile-completeness", async (req, res, next) => {
  try {
    const user = (await prisma.user.findUniqueOrThrow({
      where: { id: req.authUser!.id },
      include: createProfileInclude(),
    })) as unknown as UserWithProfile;

    const missing = [
      !user.bio ? "bio" : null,
      !user.targetRole ? "targetRole" : null,
      !user.preferredLanguage ? "preferredLanguage" : null,
      !user.timezone ? "timezone" : null,
      typeof user.yearsOfExperience !== "number" ? "yearsOfExperience" : null,
      user.skills.length === 0 ? "skills" : null,
      user.techStackItems.length === 0 ? "techStack" : null,
      user.interviewTopics.length === 0 ? "interviewTopics" : null,
      user.availabilitySlots.length === 0 ? "availability" : null,
    ].filter(Boolean);

    return sendOk(res, {
      isProfileComplete: user.isProfileComplete,
      missing,
    });
  } catch (error) {
    return next(error);
  }
});

usersRouter.patch("/me", async (req, res, next) => {
  try {
    const parsed = userProfileSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_PROFILE",
          message: "Please correct the highlighted profile fields and try again.",
          details: parsed.error.flatten(),
        },
      });
    }

    const userId = req.authUser!.id;
    const payload = {
      ...parsed.data,
      skills: normalizeItems(parsed.data.skills),
      techStack: normalizeItems(parsed.data.techStack),
      interviewTopics: normalizeItems(parsed.data.interviewTopics),
    };

    const isProfileComplete = computeProfileComplete({
      bio: payload.bio,
      targetRole: payload.targetRole,
      preferredLanguage: payload.preferredLanguage,
      timezone: payload.timezone,
      yearsOfExperience: payload.yearsOfExperience,
      skills: payload.skills,
      techStack: payload.techStack,
      interviewTopics: payload.interviewTopics,
      availabilityCount: payload.availability.length,
    });

    const [skills, techStackItems, interviewTopics] = await Promise.all([
      ensureSkills(payload.skills),
      ensureTechStackItems(payload.techStack),
      ensureInterviewTopics(payload.interviewTopics),
    ]);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          name: payload.name,
          bio: payload.bio,
          yearsOfExperience: payload.yearsOfExperience,
          targetRole: payload.targetRole,
          preferredLanguage: payload.preferredLanguage,
          timezone: payload.timezone,
          githubUrl: payload.githubUrl || null,
          linkedinUrl: payload.linkedinUrl || null,
          isDiscoverable: payload.isDiscoverable,
          isProfileComplete,
          lastActiveAt: new Date(),
        },
      }),
      prisma.userSkill.deleteMany({ where: { userId } }),
      prisma.userTechStackItem.deleteMany({ where: { userId } }),
      prisma.userInterviewTopic.deleteMany({ where: { userId } }),
      prisma.availabilitySlot.deleteMany({ where: { userId } }),
      ...(skills.length > 0
        ? [
            prisma.userSkill.createMany({
              data: skills.map((skill) => ({ userId, skillId: skill.id })),
            }),
          ]
        : []),
      ...(techStackItems.length > 0
        ? [
            prisma.userTechStackItem.createMany({
              data: techStackItems.map((item) => ({ userId, techStackItemId: item.id })),
            }),
          ]
        : []),
      ...(interviewTopics.length > 0
        ? [
            prisma.userInterviewTopic.createMany({
              data: interviewTopics.map((topic) => ({ userId, interviewTopicId: topic.id })),
            }),
          ]
        : []),
      ...(payload.availability.length > 0
        ? [
            prisma.availabilitySlot.createMany({
              data: payload.availability.map((slot) => ({
                userId,
                dayOfWeek: slot.dayOfWeek,
                startMinute: slot.startMinute,
                endMinute: slot.endMinute,
                isActive: slot.isActive,
              })),
            }),
          ]
        : []),
    ]);

    const user = (await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: createProfileInclude(),
    })) as unknown as UserWithProfile;

    return sendOk(res, {
      profile: serializeUser(user),
      message: "Profile saved successfully.",
    });
  } catch (error) {
    return next(error);
  }
});

usersRouter.patch("/me/discoverability", async (req, res, next) => {
  try {
    if (typeof req.body?.isDiscoverable !== "boolean") {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_DISCOVERABILITY", message: "isDiscoverable must be a boolean." },
      });
    }

    const user = (await prisma.user.update({
      where: { id: req.authUser!.id },
      data: { isDiscoverable: req.body.isDiscoverable },
      include: createProfileInclude(),
    })) as unknown as UserWithProfile;

    return sendOk(res, { profile: serializeUser(user) });
  } catch (error) {
    return next(error);
  }
});

usersRouter.get("/:id", async (req, res, next) => {
  try {
    const user = (await prisma.user.findUnique({
      where: { id: req.params.id },
      include: createProfileInclude(),
    })) as unknown as UserWithProfile | null;

    if (!user || !user.isProfileComplete) {
      return res.status(404).json({
        success: false,
        error: { code: "USER_NOT_FOUND", message: "Profile not found." },
      });
    }

    return sendOk(res, {
      profile: serializeUser(user),
    });
  } catch (error) {
    return next(error);
  }
});

import { Router } from "express";

import { sendOk } from "../../lib/http";
import { prisma } from "../../lib/prisma";

const defaultRoles = [
  "Frontend Engineer",
  "Backend Engineer",
  "Full Stack Engineer",
  "Data Engineer",
  "DevOps Engineer",
  "Mobile Engineer",
  "QA Engineer",
  "Engineering Manager",
];

const defaultLanguages = ["English", "Hindi", "Tamil", "Telugu", "Malayalam", "Kannada"];

export const metaRouter = Router();

metaRouter.get("/roles", async (_req, res, next) => {
  try {
    const databaseRoles = await prisma.user.findMany({
      where: { targetRole: { not: null } },
      select: { targetRole: true },
      distinct: ["targetRole"],
      orderBy: { targetRole: "asc" },
    });

    const roles = Array.from(
      new Set(
        [...defaultRoles, ...databaseRoles.map((item: { targetRole: string | null }) => item.targetRole).filter(Boolean)] as string[],
      ),
    );

    return sendOk(res, { roles });
  } catch (error) {
    return next(error);
  }
});

metaRouter.get("/languages", (_req, res) => {
  sendOk(res, { languages: defaultLanguages });
});

metaRouter.get("/skills", async (_req, res, next) => {
  try {
    const skills = await prisma.skill.findMany({ orderBy: { name: "asc" }, take: 50 });
    return sendOk(res, { skills: skills.map((item: { name: string }) => item.name) });
  } catch (error) {
    return next(error);
  }
});

metaRouter.get("/tech-stack", async (_req, res, next) => {
  try {
    const techStack = await prisma.techStackItem.findMany({ orderBy: { name: "asc" }, take: 50 });
    return sendOk(res, { techStack: techStack.map((item: { name: string }) => item.name) });
  } catch (error) {
    return next(error);
  }
});

metaRouter.get("/interview-topics", async (_req, res, next) => {
  try {
    const interviewTopics = await prisma.interviewTopic.findMany({ orderBy: { name: "asc" }, take: 50 });
    return sendOk(res, { interviewTopics: interviewTopics.map((item: { name: string }) => item.name) });
  } catch (error) {
    return next(error);
  }
});

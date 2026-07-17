export const heroStats = [
  { value: "serious matches", label: "people preparing for interviews, not scrolling communities" },
  { value: "private workflow", label: "request, accept, chat, schedule, and practice without public noise" },
  { value: "one platform", label: "no bouncing between Discord, Meet, docs, and random chats" }
] as const;

export const workflowSteps = [
  {
    step: "01",
    title: "Set your prep context",
    description:
      "Target role, experience, stack, interview topics, preferred language, timezone, and availability create a profile built for matching."
  },
  {
    step: "02",
    title: "Ask for the exact practice you need",
    description:
      "Instead of browsing endlessly, describe the type of mock interview partner or session you want and let the platform narrow the field."
  },
  {
    step: "03",
    title: "Move directly into practice",
    description:
      "Once both people agree, chat, scheduling, and the interview room are already part of the same product flow."
  }
] as const;

export const faqs = [
  {
    question: "Why not just use Discord, LinkedIn, or WhatsApp groups?",
    answer:
      "Those tools are broad communities, not dedicated interview-prep workflows. SkillSync is designed to reduce the time between intention and an actual mock interview session."
  },
  {
    question: "Is this a social platform or reputation system?",
    answer:
      "No. SkillSync avoids public ratings, popularity scores, and leaderboards. The product is built around preparation, not public performance."
  },
  {
    question: "What happens after two users match?",
    answer:
      "They can privately coordinate, schedule a session, and use an in-platform interview room with video, a shared editor, notes, and a timer."
  },
  {
    question: "How is AI used here?",
    answer:
      "AI helps rank already-filtered candidates and explain why a match makes sense. It does not replace database filtering, business rules, or authentication."
  }
] as const;
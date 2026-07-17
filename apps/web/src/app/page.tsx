const featureCards = [
  {
    title: "Focused matching",
    description:
      "Search for interview partners by role, skills, availability, and preparation goals instead of browsing a noisy community.",
  },
  {
    title: "Private workflow",
    description:
      "Requests, chat, scheduling, and feedback stay between the two participants with no public scores or popularity loops.",
  },
  {
    title: "Built-in practice room",
    description:
      "Run the full mock interview with video, a shared code editor, notes, and a timer inside one product.",
  },
];

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "48px 24px",
      }}
    >
      <section
        style={{
          width: "min(1120px, 100%)",
          display: "grid",
          gap: 24,
        }}
      >
        <div
          style={{
            padding: 32,
            borderRadius: 28,
            border: "1px solid var(--border)",
            background: "var(--background-soft)",
            backdropFilter: "blur(18px)",
            boxShadow: "0 30px 80px rgba(0, 0, 0, 0.35)",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              padding: "8px 14px",
              borderRadius: 999,
              border: "1px solid rgba(124, 226, 255, 0.25)",
              color: "var(--accent-strong)",
              background: "rgba(70, 194, 255, 0.1)",
              fontSize: 13,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Developer interview practice
          </div>

          <h1
            style={{
              margin: "20px 0 12px",
              fontSize: "clamp(2.75rem, 7vw, 5.75rem)",
              lineHeight: 0.95,
              letterSpacing: "-0.05em",
            }}
          >
            Find the right mock interview partner without leaving the platform.
          </h1>

          <p
            style={{
              margin: 0,
              maxWidth: 700,
              color: "var(--muted)",
              fontSize: 18,
              lineHeight: 1.7,
            }}
          >
            SkillSync is a dedicated workspace for developers who want structured mock interviews,
            private matching, and a focused interview room built for practice.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 20,
          }}
        >
          {featureCards.map((card) => (
            <article
              key={card.title}
              style={{
                padding: 24,
                borderRadius: 24,
                border: "1px solid var(--border)",
                background: "rgba(6, 18, 34, 0.8)",
              }}
            >
              <h2
                style={{
                  margin: "0 0 10px",
                  fontSize: 20,
                }}
              >
                {card.title}
              </h2>
              <p
                style={{
                  margin: 0,
                  color: "var(--muted)",
                  lineHeight: 1.7,
                }}
              >
                {card.description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

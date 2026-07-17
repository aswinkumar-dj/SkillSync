import type { AuthUser } from "../auth/auth-gate";

type ProfileStatusCardProps = {
  user: AuthUser;
};

export function ProfileStatusCard({ user }: ProfileStatusCardProps) {
  const items = [
    { label: "Role", value: user.targetRole ?? "Add your target role" },
    { label: "Language", value: user.preferredLanguage ?? "Add your preferred language" },
    { label: "Skills", value: user.skills.length ? `${user.skills.length} added` : "Add your core skills" },
    {
      label: "Availability",
      value: user.availability.length ? `${user.availability.length} slots ready` : "Add practice windows",
    },
  ];

  return (
    <section className="rounded-[24px] bg-white/[0.04] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-orange-300">Profile status</p>
          <h2 className="mt-3 text-xl font-semibold tracking-[-0.04em] text-text">
            {user.isProfileComplete ? "Ready for matching" : "Complete your profile"}
          </h2>
        </div>
        <div className="rounded-[16px] bg-[#17110d] px-4 py-3 text-sm text-orange-100">
          {user.isDiscoverable ? "Visible to matching" : "Hidden from matching"}
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="rounded-[18px] bg-black/20 px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{item.label}</p>
            <p className="mt-2 text-sm font-medium text-text">{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

import Image from "next/image";

import logo from "../../app/skillsync-logo.png";

type LogoProps = {
  compact?: boolean;
};

export function Logo({ compact = false }: LogoProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-panel">
        <Image
          src={logo}
          alt="SkillSync logo"
          className={compact ? "h-10 w-auto" : "h-14 w-auto"}
          priority
        />
      </div>
    </div>
  );
}

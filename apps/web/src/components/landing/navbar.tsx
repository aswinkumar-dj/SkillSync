import { Logo } from "./logo";

export function LandingNavbar() {
  return (
    <header className="sticky top-0 z-30 bg-[#090b10]/78 backdrop-blur-2xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        <div className="flex items-center gap-4">
          <Logo compact />
          <div className="hidden md:block">
            <p className="text-sm font-medium tracking-[-0.02em] text-text">SkillSync</p>
            <p className="text-[11px] uppercase tracking-[0.26em] text-muted">mock interview platform</p>
          </div>
        </div>

        <nav className="hidden items-center gap-8 text-sm text-muted lg:flex">
          <a data-cursor="interactive" href="#how" className="transition hover:text-text">How It Works</a>
          <a data-cursor="interactive" href="#faq" className="transition hover:text-text">FAQ</a>
        </nav>

        <a
          data-cursor="interactive"
          href="#cta"
          className="interactive-button rounded-full bg-orange-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-orange-400"
        >
          Get started
        </a>
      </div>
    </header>
  );
}
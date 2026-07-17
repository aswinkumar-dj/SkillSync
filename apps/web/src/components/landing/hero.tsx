import { heroStats } from "./landing-data";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-6 pb-14 pt-8 lg:px-10 lg:pb-18 lg:pt-24 lg:mt-10 lg:mb-12">
      <div className="absolute left-1/2 top-0 -z-10 h-[22rem] w-[22rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,102,0,0.14),transparent_68%)] blur-3xl" />
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div>
            <div className="inline-flex items-center rounded-full bg-[#101319] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-orange-300">
              Interview matching
            </div>

            <h1 className="mt-6 max-w-3xl text-balance text-[2.1rem] font-semibold leading-[1] tracking-[-0.055em] text-text sm:text-[2.75rem] lg:text-[3.55rem]">
              Find the right person to practice interviews with.
            </h1>

            <p className="mt-5 max-w-xl text-pretty text-sm leading-7 text-muted sm:text-base">
              SkillSync replaces scattered community searching with one focused flow for finding,
              coordinating, and completing mock interviews.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                data-cursor="interactive"
                href="#cta"
                className="interactive-button inline-flex items-center justify-center rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-400"
              >
                Get started
              </a>
              <a
                data-cursor="interactive"
                href="#how"
                className="interactive-button inline-flex items-center justify-center rounded-full bg-[#11151c] px-6 py-3 text-sm font-semibold text-text transition hover:bg-[#171c24]"
              >
                How it works
              </a>
            </div>
          </div>

          <div className="grid gap-2.5 self-start lg:pt-2">
            <div className="bg-[#0e1218] px-4 py-4 shadow-[0_16px_34px_rgba(0,0,0,0.22)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-orange-300">before</p>
              <p className="mt-3 text-base font-medium tracking-[-0.03em] text-text">
                Too many apps, too much noise, weak follow-through.
              </p>
            </div>

            <div className="bg-[#14100d] px-4 py-4 shadow-[0_18px_38px_rgba(255,106,0,0.07)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-orange-300">after</p>
              <p className="mt-3 text-base font-medium tracking-[-0.03em] text-text">
                One place to match and move into a real practice session.
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {heroStats.map((stat) => (
                  <div key={stat.value} className="bg-black/20 px-3 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-text">{stat.value}</p>
                    <p className="mt-1.5 text-[11px] leading-5 text-muted">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
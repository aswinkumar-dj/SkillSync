export function FinalCtaSection() {
  return (
    <section id="cta" className="px-6 pb-20 pt-14 lg:px-10 lg:pb-24 lg:pt-18">
      <div className="mx-auto max-w-7xl pt-10 lg:pt-12">
        <div className="bg-[#0c1015] px-7 py-9 shadow-[0_22px_50px_rgba(0,0,0,0.22)] sm:px-10 sm:py-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-orange-300">Get started</p>
          <h2 className="mt-4 max-w-3xl text-balance text-[1.8rem] font-semibold tracking-[-0.05em] text-text sm:text-[2.35rem]">
            A better way to organize mock interview practice.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted sm:text-base">
            SkillSync is built to make interview prep feel direct, private, and easier to follow through on.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <a
              data-cursor="interactive"
              href="#"
              className="interactive-button inline-flex items-center justify-center rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-400"
            >
              Join SkillSync
            </a>
            <a
              data-cursor="interactive"
              href="#faq"
              className="interactive-button inline-flex items-center justify-center rounded-full bg-[#151922] px-6 py-3 text-sm font-semibold text-text transition hover:bg-[#1b2029]"
            >
              Read the FAQ
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
import { workflowSteps } from "./landing-data";

export function WorkflowSection() {
  return (
    <section id="how" className="px-6 py-14 lg:px-10 lg:py-18">
      <div className="mx-auto max-w-7xl pt-10 lg:pt-12">
        <div className="max-w-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-orange-300">How it works</p>
          <h2 className="mt-4 text-balance text-[1.7rem] font-semibold tracking-[-0.05em] text-text sm:text-[2.2rem]">
            A simple path from search to mock interview.
          </h2>
        </div>

        <div className="mt-8 grid gap-3 lg:grid-cols-3">
          {workflowSteps.map((item) => (
            <article key={item.step} className="bg-[#0f1319] px-5 py-5 shadow-[0_14px_30px_rgba(0,0,0,0.18)]">
              <p className="text-xs font-semibold text-orange-400">{item.step}</p>
              <h3 className="mt-4 text-lg font-semibold tracking-[-0.03em] text-text">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-muted">{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
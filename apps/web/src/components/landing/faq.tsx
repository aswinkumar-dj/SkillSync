import { faqs } from "./landing-data";

export function FaqSection() {
  return (
    <section id="faq" className="px-6 py-14 lg:px-10 lg:py-18">
      <div className="mx-auto grid max-w-7xl gap-8 pt-10 lg:grid-cols-[0.72fr_1.28fr] lg:pt-12">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-orange-300">FAQ</p>
          <h2 className="mt-4 text-balance text-[1.7rem] font-semibold tracking-[-0.05em] text-text sm:text-[2.2rem]">
            Product boundaries, clearly stated.
          </h2>
        </div>

        <div className="grid gap-2.5">
          {faqs.map((item) => (
            <article key={item.question} className="bg-[#0f1319] px-5 py-5 shadow-[0_14px_30px_rgba(0,0,0,0.16)]">
              <h3 className="text-base font-semibold tracking-[-0.03em] text-text">{item.question}</h3>
              <p className="mt-3 text-sm leading-6 text-muted">{item.answer}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
function Footer() {
  return (
    <footer className="relative overflow-hidden bg-emerald-950 text-emerald-100/80">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />
      <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-x-6 gap-y-7 px-4 py-8 sm:px-8 sm:py-12 md:grid-cols-[1.4fr_1fr_1fr] md:gap-10 lg:px-12">
        <div className="col-span-2 md:col-span-1">
          <a
            className="group inline-flex min-w-0 items-center gap-2.5 no-underline sm:gap-3.5"
            href="#top"
            aria-label="Ask Tour and Travel home"
          >
            <span className="brand-flight relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-full border border-amber-300/50 bg-gradient-to-br from-amber-300/20 to-amber-500/5 shadow-inner shadow-amber-300/10 transition duration-500 group-hover:border-amber-300 group-hover:shadow-amber-300/30 sm:size-11">
              <svg className="brand-flight-plane size-5 text-amber-300 sm:size-6" viewBox="0 0 36 36" fill="none" aria-hidden="true">
                <path d="m4 17 27-11-8 25-5-10-10-4Z" fill="currentColor" />
                <path d="m18 21 13-15" stroke="#031f17" strokeWidth="1.4" />
                <path d="M5 26h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity=".7" />
                <path d="M2 30h7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity=".45" />
              </svg>
            </span>
            <span className="block whitespace-nowrap font-serif text-lg font-semibold leading-none tracking-wide text-white sm:text-[1.7rem]">
              Ask Tour and Travel
              <small className="mt-1 block whitespace-nowrap font-sans text-[8px] font-semibold uppercase tracking-[0.24em] text-amber-300/90 sm:mt-1.5 sm:text-[10px] sm:tracking-[0.32em]">
                Journeys in Ethiopia
              </small>
            </span>
          </a>
          <p className="mt-3 max-w-sm text-[13px] leading-relaxed sm:mt-4 sm:text-sm">
            Local knowledge, thoughtful journeys. Every trip is arranged by people who live in the places you visit.
          </p>
        </div>
        <div className="min-w-0">
          <h3 className="m-0 font-serif text-base font-semibold text-white sm:text-lg">Explore</h3>
          <ul className="m-0 mt-2.5 grid gap-1.5 p-0 text-[13px] sm:mt-3 sm:gap-2 sm:text-sm [&>li]:list-none">
            <li><a className="text-emerald-100/80 no-underline transition hover:text-amber-300" href="#journeys">All journeys</a></li>
            <li><a className="text-emerald-100/80 no-underline transition hover:text-amber-300" href="#top">Back to top</a></li>
          </ul>
        </div>
        <div className="min-w-0">
          <h3 className="m-0 font-serif text-base font-semibold text-white sm:text-lg">Based in</h3>
          <p className="m-0 mt-2.5 text-[13px] leading-relaxed sm:mt-3 sm:text-sm">Addis Ababa, Ethiopia<br />Journeys across the highlands, lakes and desert.</p>
          <p className="mt-3 text-[13px] font-medium text-amber-200 sm:text-sm">
            <span className="text-emerald-100/80">Contact:</span>{' '}
            <a href="tel:+291123456787" className="text-amber-300 underline-offset-2 transition hover:text-amber-200 hover:underline">+291123456787</a>
          </p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-3 px-4 py-3.5 text-[10.5px] text-emerald-100/60 sm:px-8 sm:py-5 sm:text-xs lg:px-12">
          <span>© 2026 Ask Tour and Travel</span>
          <span className="text-right"><span className="hidden sm:inline">Ask Tour and Travel / </span>Ethiopia</span>
        </div>
      </div>
    </footer>
  )
}

export default Footer
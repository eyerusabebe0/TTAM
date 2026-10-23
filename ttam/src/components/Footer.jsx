function Footer() {
  return (
    <footer className="relative overflow-hidden bg-emerald-950 text-emerald-100/80">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />
      <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-12 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr] lg:px-12">
        <div>
          <a
            className="group inline-flex min-w-0 items-center gap-3.5 no-underline"
            href=""
            aria-label="Ask Tour and Travel home"
          >
            <span className="brand-flight relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-full border border-amber-300/50 bg-gradient-to-br from-amber-300/20 to-amber-500/5 shadow-inner shadow-amber-300/10 transition duration-500 group-hover:border-amber-300 group-hover:shadow-amber-300/30">
              <svg className="brand-flight-plane size-6 text-amber-300" viewBox="0 0 36 36" fill="none" aria-hidden="true">
                <path d="m4 17 27-11-8 25-5-10-10-4Z" fill="currentColor" />
                <path d="m18 21 13-15" stroke="#031f17" strokeWidth="1.4" />
                <path d="M5 26h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity=".7" />
                <path d="M2 30h7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity=".45" />
              </svg>
            </span>
            <span className="min-w-0 truncate font-serif text-xl font-semibold leading-none tracking-wide text-white sm:text-[1.7rem]">
              Ask Tour and Travel
              <small className="mt-1.5 block truncate font-sans text-[9.5px] font-semibold uppercase tracking-[0.32em] text-amber-300/90 sm:text-[10px]">
                Journeys in Ethiopia
              </small>
            </span>
          </a>
          <p className="mt-4 max-w-sm text-sm leading-relaxed">
            Local knowledge, thoughtful journeys. Every trip is arranged by people who live in the places you visit.
          </p>
        </div>
        <div>
          <h3 className="font-serif text-lg font-semibold text-white">Explore</h3>
          <ul className="mt-3 grid gap-2 p-0 text-sm [&>li]:list-none">
            <li><a className="text-emerald-100/80 no-underline transition hover:text-amber-300" href="#journeys">All journeys</a></li>
            <li><a className="text-emerald-100/80 no-underline transition hover:text-amber-300" href="#top">Back to top</a></li>
          </ul>
        </div>
        <div>
          <h3 className="font-serif text-lg font-semibold text-white">Based in</h3>
          <p className="mt-3 text-sm leading-relaxed">Addis Ababa, Ethiopia<br />Journeys across the highlands, lakes and desert.</p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-2 px-4 py-5 text-xs text-emerald-100/60 sm:flex-row sm:justify-between sm:px-8 lg:px-12">
          <span>© 2026 Ask Tour and Travel</span>
          <span>Ask Tour and Travel / Ethiopia</span>
        </div>
      </div>
    </footer>
  )
}

export default Footer
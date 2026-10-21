function Footer() {
  return (
    <footer className="relative overflow-hidden bg-emerald-950 text-emerald-100/80">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />
      <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-12 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr] lg:px-12">
        <div>
          <div className="flex items-center gap-3">
            <svg className="size-9 text-amber-400" viewBox="0 0 36 36" fill="none" aria-hidden="true">
              <path d="M18 3.5 32.5 12v12L18 32.5 3.5 24V12L18 3.5Z" stroke="currentColor" strokeWidth="1.6" />
              <path d="M11 22.5c3.6-8.2 8.5-9.8 14.5-10.5-2.4 7.2-6.3 11.2-14.5 10.5Z" fill="currentColor" />
            </svg>
            <span className="font-serif text-xl font-semibold text-white">Ask Tour and Travel</span>
          </div>
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
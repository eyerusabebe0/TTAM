import { useEffect, useState } from 'react'

/* Loads the luxury typefaces once and maps them onto Tailwind's font-serif / font-sans. */
function useLuxuryFonts() {
  useEffect(() => {
    if (document.getElementById('ttam-fonts')) return
    const link = document.createElement('link')
    link.id = 'ttam-fonts'
    link.rel = 'stylesheet'
    link.href =
      'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap'
    document.head.appendChild(link)
    const style = document.createElement('style')
    style.id = 'ttam-font-map'
    style.textContent = `
      .font-serif{font-family:'Cormorant Garamond',Georgia,'Times New Roman',serif;letter-spacing:.005em}
      .font-sans,body{font-family:'Manrope',ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif}
      html{scroll-behavior:smooth}
      ::selection{background:#fbbf24;color:#052e22}
    `
    document.head.appendChild(style)
  }, [])
}

function Header({ currentUser, onLogin, onSignup, onLogout, onBrowse, onDashboard, notifications = [] }) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const notificationStorageKey = currentUser
    ? `ttam-read-notifications:${currentUser.role}:${currentUser.email.toLowerCase()}`
    : ''
  const [seenNotifications, setSeenNotifications] = useState(() => new Set(
    notificationStorageKey ? JSON.parse(localStorage.getItem(notificationStorageKey) || '[]') : [],
  ))
  const unreadCount = notifications.filter((notification) => !seenNotifications.has(notification.id)).length
  const dashboardHref = currentUser?.role === 'client' ? '#client-dashboard' : '#dashboard'
  const initial = currentUser?.name?.trim().charAt(0).toUpperCase() || 'U'
  const markNotificationsSeen = () => {
    if (!notificationStorageKey || !unreadCount) return
    const next = new Set([...seenNotifications, ...notifications.map((notification) => notification.id)])
    setSeenNotifications(next)
    localStorage.setItem(notificationStorageKey, JSON.stringify([...next]))
  }
  useLuxuryFonts()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const close = () => setOpen(false)

  return (
    <header
      className={`sticky top-0 z-40 border-b text-white backdrop-blur-2xl transition-all duration-500 ${
        scrolled
          ? 'border-amber-300/20 bg-[#031f17]/95 shadow-2xl shadow-black/30'
          : 'border-white/5 bg-[#031f17]/80'
      }`}
    >
      <div
        aria-hidden="true"
        className={`absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-300/70 to-transparent transition-opacity duration-500 ${scrolled ? 'opacity-100' : 'opacity-0'}`}
      />
      <div className={`mx-auto flex max-w-[1280px] items-center justify-between gap-2 px-3 transition-all duration-500 sm:gap-4 sm:px-8 lg:px-12 ${scrolled ? 'h-[52px] sm:h-[70px]' : 'h-[58px] sm:h-[84px]'}`}>
        <a
          className="group inline-flex shrink-0 items-center gap-2 no-underline sm:gap-3.5"
          href="#top"
          onClick={(event) => { event.preventDefault(); onBrowse(); close() }}
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
          <span className="block whitespace-nowrap font-serif text-[1.05rem] font-semibold leading-none tracking-wide text-white sm:text-[1.7rem]">
            Ask Tour and Travel
            <small className="mt-1 block whitespace-nowrap font-sans text-[7.5px] font-semibold uppercase tracking-[0.2em] text-amber-300/90 sm:mt-1.5 sm:text-[10px] sm:tracking-[0.32em]">
              Journeys in Ethiopia
            </small>
          </span>
        </a>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Main">
          <a
            className="group relative inline-flex min-h-10 items-center overflow-hidden rounded-full border border-amber-300/60 px-5 text-[13px] font-bold uppercase tracking-[0.14em] text-amber-200 no-underline transition duration-500 hover:text-emerald-950"
            href="#journeys"
            onClick={onBrowse}
          >
            <span aria-hidden="true" className="absolute inset-0 -translate-x-full bg-gradient-to-r from-amber-300 to-amber-500 transition duration-500 group-hover:translate-x-0" />
            <span className="relative">Find your journey</span>
          </a>
          {currentUser ? (
            <div className="flex items-center gap-4">
              <a
                className="relative grid size-11 place-items-center rounded-full bg-gradient-to-br from-amber-200 to-amber-500 font-serif text-lg font-bold text-emerald-950 no-underline ring-2 ring-amber-300/40 ring-offset-2 ring-offset-[#031f17] transition duration-300 hover:scale-105"
                href={dashboardHref}
                onClick={() => { markNotificationsSeen(); onDashboard(); close() }}
                aria-label={unreadCount ? `Go to ${currentUser.name}'s dashboard, ${unreadCount} unread notifications` : `Go to ${currentUser.name}'s dashboard`}
              >
                {initial}
                {unreadCount > 0 && <span aria-hidden="true" className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-[#031f17] bg-red-600 px-1 font-sans text-[10px] font-extrabold leading-none text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>}
              </a>
              <button className="cursor-pointer border-0 bg-transparent p-0 text-sm font-semibold text-emerald-100/75 transition hover:text-amber-300" onClick={onLogout}>
                Log out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button className="cursor-pointer border-0 bg-transparent px-2 py-2 text-sm font-semibold text-emerald-50 transition hover:text-amber-300" onClick={onLogin}>
                Log in
              </button>
              <button
                className="cursor-pointer rounded-full bg-gradient-to-b from-amber-200 to-amber-500 px-6 py-2.5 text-sm font-bold text-emerald-950 shadow-lg shadow-amber-500/25 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-400/40"
                onClick={onSignup}
              >
                Sign up
              </button>
            </div>
          )}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 md:hidden">
          {currentUser && (
            <a
              className="relative grid size-9 place-items-center rounded-full bg-gradient-to-br from-amber-200 to-amber-500 font-serif text-base font-bold text-emerald-950 no-underline ring-2 ring-amber-300/40"
              href={dashboardHref}
              onClick={() => { markNotificationsSeen(); onDashboard() }}
              aria-label={unreadCount ? `Go to ${currentUser.name}'s dashboard, ${unreadCount} unread notifications` : `Go to ${currentUser.name}'s dashboard`}
            >
              {initial}
              {unreadCount > 0 && <span aria-hidden="true" className="absolute -right-1 -top-1 grid min-h-4 min-w-4 place-items-center rounded-full border-2 border-[#031f17] bg-red-600 px-1 font-sans text-[9px] font-extrabold leading-none text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>}
            </a>
          )}
          <button
            type="button"
            className="grid size-9 cursor-pointer place-items-center rounded-full border border-amber-300/40 bg-white/5"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <span className="relative block h-3.5 w-5" aria-hidden="true">
              <span className={`absolute left-0 h-0.5 w-5 rounded bg-amber-200 transition duration-300 ${open ? 'top-1.5 rotate-45' : 'top-0'}`} />
              <span className={`absolute left-0 top-1.5 h-0.5 w-5 rounded bg-amber-200 transition duration-300 ${open ? 'opacity-0' : ''}`} />
              <span className={`absolute left-0 h-0.5 w-5 rounded bg-amber-200 transition duration-300 ${open ? 'top-1.5 -rotate-45' : 'top-3'}`} />
            </span>
          </button>
        </div>
      </div>

      <div className={`overflow-hidden transition-[max-height] duration-500 ease-out md:hidden ${open ? 'max-h-96' : 'max-h-0'}`}>
        <div className="grid gap-1.5 border-t border-white/10 px-4 pb-5 pt-3">
          <a className="rounded-xl bg-amber-300/15 px-4 py-3 text-[15px] font-semibold text-amber-200 no-underline hover:bg-amber-300 hover:text-emerald-950" href="#journeys" onClick={() => { onBrowse(); close() }}>
            Find your journey
          </a>
          {currentUser ? (
            <>
              <a className="rounded-xl px-4 py-3 text-[15px] font-semibold text-white no-underline hover:bg-white/10" href={dashboardHref} onClick={() => { onDashboard(); close() }}>
                My dashboard · {currentUser.name}
              </a>
              <button className="cursor-pointer rounded-xl border border-white/20 bg-transparent px-4 py-3 text-left text-[15px] font-semibold text-white" onClick={() => { onLogout(); close() }}>
                Log out
              </button>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button className="min-h-11 cursor-pointer rounded-full border border-white/30 bg-transparent text-[15px] font-semibold text-white" onClick={() => { onLogin(); close() }}>
                Log in
              </button>
              <button className="min-h-11 cursor-pointer rounded-full border-0 bg-gradient-to-b from-amber-200 to-amber-500 text-[15px] font-bold text-emerald-950" onClick={() => { onSignup(); close() }}>
                Sign up
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
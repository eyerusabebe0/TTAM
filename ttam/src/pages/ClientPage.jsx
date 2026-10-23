import { useEffect, useMemo, useState } from 'react'
import Reveal from './ScrollReveal.jsx'
import { birr } from '../utils/currency.js'
import { INCLUDED_IN_JOURNEY_PRICE } from '../utils/journeyPricePolicy.js'
import { Badge, BTN, BTN_OUTLINE, Empty, Field, Modal, Notice, PAGE } from './UI.jsx'

/*
  ClientPage – Tailwind only. Put your hero video at /public/bg.mp4.
*/

const POSTER =
  'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=2000&q=90'

function ethiopianDate() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Addis_Ababa',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return `${values.year}-${values.month}-${values.day}`
}

function formatJourneyDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function ClientPage({ tours = [], bookings = [], signedIn, currentUser, notificationTarget, onSignIn, onDashboard, onBooking, onPayment, onCancelBooking, view = 'browse' }) {
  const [activeTour, setActiveTour] = useState(null)
  const [customer, setCustomer] = useState({ name: null, email: null, agentCode: '', members: 1, amountBirr: '', paymentMethod: 'Telebirr', paymentReference: '' })
  const [paymentBooking, setPaymentBooking] = useState(null)
  const [confirmation, setConfirmation] = useState('')
  const [bookingError, setBookingError] = useState('')
  const [creatingBooking, setCreatingBooking] = useState(false)
  const [category, setCategory] = useState('All')
  const [ready, setReady] = useState(false)
  const [today, setToday] = useState(ethiopianDate)

  // One orchestrated entrance for the hero
  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    if (view !== 'dashboard' || notificationTarget?.section !== 'client-bookings') return
    const frame = requestAnimationFrame(() => {
      document.getElementById(notificationTarget.elementId)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
    return () => cancelAnimationFrame(frame)
  }, [notificationTarget, view])

  useEffect(() => {
    const interval = window.setInterval(() => setToday(ethiopianDate()), 60_000)
    return () => window.clearInterval(interval)
  }, [])

  const currentTours = useMemo(() => tours.filter((tour) => !tour.journeyDate || tour.journeyDate >= today), [tours, today])
  const categories = useMemo(() => ['All', ...new Set(currentTours.map((tour) => tour.category))], [currentTours])
  const visibleTours = category === 'All' ? currentTours : currentTours.filter((tour) => tour.category === category)

  function beginBooking(tour) {
    setActiveTour(tour)
    setPaymentBooking(null)
    setConfirmation('')
    setCustomer((c) => ({ ...c, name: currentUser?.name ?? c.name, email: currentUser?.email ?? c.email, agentCode: currentUser?.agentCode || c.agentCode, members: 1 }))
    if (!signedIn) onSignIn?.()
  }

  function changeGroupSize(change) {
    setCustomer((current) => ({
      ...current,
      members: Math.min(50, Math.max(1, Number(current.members || 1) + change)),
    }))
  }

  async function completeBooking(event) {
    event.preventDefault()
    const result = await createBooking()
    if (result) setPaymentBooking(result)
  }

  async function reserveBooking() {
    setBookingError('')
    const result = await createBooking()
    if (!result) return
    setConfirmation(`Booking ${result.reference} is saved. Pay within 24 hours, by ${new Date(result.expiresAt).toLocaleString()}, or it will be automatically cancelled.`)
    setActiveTour(null)
    setCustomer((current) => ({ ...current, agentCode: '' }))
    onDashboard?.()
  }

  async function createBooking() {
    if (creatingBooking) return null
    setCreatingBooking(true)
    setBookingError('')
    try {
      const result = await onBooking?.({
        ...customer,
        name: customer.name || currentUser?.name || '',
        email: customer.email || currentUser?.email || '',
        tour: activeTour.name,
        place: activeTour.place,
        tourId: activeTour.id,
        price: activeTour.price,
        journeyDate: activeTour.journeyDate,
        members: Number(customer.members),
      })
      if (typeof result === 'string' || !result) {
        setBookingError(typeof result === 'string' ? result : 'Could not create your booking.')
        return null
      }
      return result
    } finally {
      setCreatingBooking(false)
    }
  }

  async function completePayment(event) {
    event.preventDefault()
    setBookingError('')
    const amountBirr = Number(customer.amountBirr)
    if (!Number.isFinite(amountBirr) || amountBirr <= 0) {
      setBookingError('Enter a valid payment amount in Birr.')
      return
    }
    if (!customer.paymentReference.trim()) {
      setBookingError('Enter the demo transaction/reference number.')
      return
    }
    const error = await onPayment?.(paymentBooking.id, {
      paymentMethod: customer.paymentMethod,
      amountBirr,
      paymentReference: customer.paymentReference.trim(),
    })
    if (error) {
      setBookingError(error)
      return
    }
    setConfirmation(`Demo payment recorded for booking ${paymentBooking.reference}. No money was transferred or verified.`)
    setPaymentBooking((current) => ({ ...current, paymentMethod: customer.paymentMethod, amountBirr, paymentReference: customer.paymentReference.trim(), paymentStatus: 'Paid' }))
    setActiveTour(null)
    setCustomer((current) => ({ ...current, agentCode: '' }))
  }

  async function cancelClientBooking(booking) {
    if (!window.confirm(`Cancel booking ${booking.reference}?`)) return
    const result = await onCancelBooking?.(booking.id)
    if (typeof result === 'string') {
      setConfirmation(result)
    } else if (result?.paymentStatus === 'Refund due') {
      setConfirmation(`Booking cancelled. A refund of ${birr(result.refundAmount)} is due after the ${birr(result.cancellationFee)} cancellation fee. Staff must send the refund through the payment provider; it is not automatic.`)
    } else {
      setConfirmation('Booking cancelled. No refund is due for this unpaid booking.')
    }
  }

  const myBookings = currentUser
    ? bookings.filter((b) => (
      (b.email || '').toLowerCase() === (currentUser.email || '').toLowerCase()
      && (!b.journeyDate || b.journeyDate >= today)
      && b.status !== 'Expired'
      && b.paymentStatus !== 'Expired'
    ))
    : []

  const rise = (delay) => ({
    style: { transitionDelay: `${delay}ms` },
    className: `transition duration-1000 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100 ${
      ready ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
    }`,
  })

  return (
    <div className="w-full overflow-x-clip bg-stone-50 text-stone-900 antialiased">
      {view === 'browse' && <>
      {/* HERO */}
      <section
        id="top"
        className="relative ml-[calc(50%-50vw)] h-[calc(100svh-68px)] min-h-[600px] w-screen overflow-hidden bg-emerald-950 text-white sm:h-[calc(100svh-76px)] md:max-h-[960px]"
      >
        <video
          className={`absolute inset-0 size-full object-cover transition-transform duration-[2500ms] ease-out motion-reduce:scale-100 ${ready ? 'scale-100' : 'scale-110'}`}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={POSTER}
          aria-hidden="true"
        >
          <source src="/bg.mp4" type="video/mp4" />
        </video>
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,28,20,.88)_0%,rgba(3,28,20,.55)_50%,rgba(3,28,20,.1)_100%),linear-gradient(0deg,rgba(3,28,20,.85)_0%,transparent_60%),radial-gradient(90%_60%_at_0%_100%,rgba(251,191,36,.25),transparent_70%)] max-sm:bg-[linear-gradient(0deg,rgba(3,28,20,.92)_0%,rgba(3,28,20,.55)_60%,rgba(3,28,20,.35)_100%)]"
        />

        <div className={`${PAGE} relative flex h-full items-end pb-14 sm:pb-20 lg:pb-24`}>
          <div className="max-w-3xl">
            <span {...rise(100)} className={`${rise(100).className} inline-flex items-center gap-3 text-sm font-semibold text-amber-300`}>
              <span className="h-0.5 w-10 bg-amber-400" aria-hidden="true" />
              Go a little further
            </span>
            <h1 {...rise(250)} className={`${rise(250).className} mb-5 mt-5 font-serif text-[2.6rem] font-semibold leading-[1.04] tracking-tight text-white drop-shadow-[0_2px_24px_rgba(0,0,0,.45)] sm:text-6xl lg:text-7xl`}>
              Somewhere real is closer than you think.
            </h1>
            <p {...rise(450)} className={`${rise(450).className} max-w-lg text-base leading-relaxed text-white/90 sm:text-lg`}>
              Journeys shaped by local people, open landscapes, and the stories you bring home.
            </p>
            <div {...rise(650)} className={`${rise(650).className} mt-8 flex flex-col gap-3 sm:flex-row sm:items-center`}>
              <a href="#journeys" className={`${BTN} px-8 py-4 text-base no-underline`}>Find your journey</a>
              {signedIn && (
                <a
                  href="#client-dashboard"
                  onClick={onDashboard}
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/60 bg-white/10 px-8 py-4 text-base font-bold text-white no-underline backdrop-blur transition hover:bg-white/20"
                >
                  My bookings
                </a>
              )}
            </div>
          </div>
        </div>

      
      </section>

      {/* JOURNEYS */}
      <section id="journeys" className={`${PAGE} scroll-mt-20 pb-20 pt-16 sm:pt-24 lg:pb-28`}>
        {confirmation && <Notice>{confirmation}</Notice>}

        <Reveal>
          <div className="mb-8 flex flex-col items-start justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <span className="text-sm font-semibold text-emerald-700">Made for the curious</span>
              <h2 className="mt-2 font-serif text-4xl font-semibold leading-tight tracking-tight text-emerald-950 sm:text-5xl">Journeys worth taking</h2>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-stone-600">
                {currentTours.length} thoughtfully planned experiences, each led by people who know the ground.
              </p>
            </div>
            <div className="-mx-4 max-w-[100vw] overflow-x-auto px-4 sm:mx-0 sm:px-0" role="group" aria-label="Filter journeys by category">
              <div className="flex w-max gap-2">
                {categories.map((item) => (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={category === item}
                    onClick={() => setCategory(item)}
                    className={`cursor-pointer whitespace-nowrap rounded-full border px-4 py-2.5 text-sm font-semibold transition duration-300 ${
                      category === item ? 'border-emerald-900 bg-emerald-950 text-white' : 'border-stone-300 bg-white text-stone-600 hover:border-emerald-800 hover:text-emerald-900'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        {visibleTours.length === 0 ? (
          <Empty>No journeys in this category yet. Try another one.</Empty>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {visibleTours.map((tour, index) => (
              <Reveal key={tour.id} delay={(index % 3) * 120} className="h-full">
                <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-3xl border border-emerald-950/10 bg-white shadow-sm transition duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-950/20">
                  <div className="relative aspect-[4/3] overflow-hidden bg-stone-200">
                    <img
                      src={tour.image}
                      alt={`${tour.place} landscape`}
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110"
                    />
                    <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-emerald-950/60 via-transparent to-transparent opacity-70 transition duration-500 group-hover:opacity-90" />
                    <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-emerald-900 shadow-sm">{tour.category}</span>
                    <span className="absolute bottom-4 left-4 right-4 font-serif text-2xl font-semibold leading-tight text-white drop-shadow sm:text-3xl">{tour.place}</span>
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <div className="mb-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900">{tour.days}</span>
                      {tour.journeyDate && <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900">{formatJourneyDate(tour.journeyDate)}{tour.startTime ? ` · ${tour.startTime}` : ''}</span>}
                    </div>
                    <p className="mb-5 line-clamp-3 text-[15px] leading-relaxed text-stone-600">{tour.description}</p>
                    <p className="mb-5 inline-flex w-fit items-center gap-2 rounded-full bg-stone-100 px-3 py-2 text-xs text-stone-600">
                      <span aria-hidden="true" className="size-1.5 rounded-full bg-emerald-600" />
                      <span><strong className="text-emerald-950">Included:</strong> {INCLUDED_IN_JOURNEY_PRICE}</span>
                    </p>

                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-5">
                      <span className="font-serif text-3xl font-semibold leading-none text-emerald-950">
                        {birr(tour.price)}
                        <small className="mt-1.5 block font-sans text-xs font-normal text-stone-500">per person</small>
                      </span>
                      <button onClick={() => beginBooking(tour)} className={`${BTN} px-5`}>
                        {signedIn ? 'Request a place' : 'Book this journey'}
                      </button>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      </>}

      {/* DASHBOARD */}
      {view === 'dashboard' && signedIn && currentUser && (
        <section id="client-dashboard" className={`${PAGE} scroll-mt-20 py-16 sm:py-24`}>
          <Reveal>
            <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <span className="text-sm font-semibold text-emerald-700">Your account</span>
                <h2 className="mt-2 font-serif text-4xl font-semibold leading-tight tracking-tight text-emerald-950 sm:text-5xl">
                  Welcome, {(currentUser.name || '').split(' ')[0]}.
                </h2>
              </div>
              <Badge tone="amber">Client dashboard</Badge>
            </div>

            <div className="rounded-3xl border border-emerald-950/10 bg-white p-5 shadow-sm sm:p-8">
              {confirmation && <div className="mb-6"><Notice>{confirmation}</Notice></div>}
              <h3 className="font-serif text-2xl font-semibold text-emerald-950">Booking requests</h3>
              <p className="mb-6 mt-1.5 text-sm text-stone-500">Unpaid bookings are held for 24 hours and stay private until payment is recorded. After payment, the booking is sent for manager approval. Expired holds are automatically cancelled and removed from this list.</p>

              {myBookings.length > 0 ? (
                <>
                  <div className="hidden overflow-x-auto rounded-2xl border border-stone-200 md:block">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead className="bg-emerald-950 text-xs text-emerald-100/85">
                        <tr>
                          {['Reference', 'Journey', 'Members', 'Total', 'Payment', 'Agent', 'Status', 'Actions'].map((label) => (
                            <th key={label} className="whitespace-nowrap px-4 py-3.5 font-semibold">{label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200">
                        {myBookings.map((booking) => (
                          <tr key={booking.id} id={`client-booking-${booking.id}`} className="scroll-mt-24 transition hover:bg-amber-50/60">
                            <td className="px-4 py-4 font-semibold">{booking.tripCode || booking.reference}</td>
                            <td className="px-4 py-4">{booking.tour}</td>
                            <td className="px-4 py-4">{booking.members} · {birr(booking.pricePerPerson || booking.price)} each</td>
                            <td className="px-4 py-4">{birr(booking.price)}</td>
                            <td className="px-4 py-4">
                              <Badge tone={booking.paymentStatus === 'Paid' ? 'green' : booking.paymentStatus === 'Awaiting payment' ? 'amber' : 'stone'}>{booking.paymentStatus}</Badge>
                              {booking.paymentMethod && <span className="mt-1 block text-xs text-stone-500">{booking.paymentMethod} · {birr(booking.amountBirr)}</span>}
                            </td>
                            <td className="px-4 py-4">{booking.agentCode || 'Direct'}</td>
                            <td className="px-4 py-4">
                              <Badge tone={booking.status === 'Approved' ? 'green' : booking.status === 'Cancelled' || booking.status === 'Expired' ? 'stone' : 'amber'}>{clientBookingStatus(booking)}</Badge>
                              {booking.refundAmount > 0 && <span className="mt-1 block text-xs text-stone-500">Refund {booking.paymentStatus === 'Refunded' ? 'sent' : 'due'}: {birr(booking.refundAmount)} · sent outside this demo</span>}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-wrap gap-2">
                                {booking.paymentStatus === 'Awaiting payment' && <span className="max-w-48 text-xs font-medium text-amber-800">Pay within 24 hours · by {new Date(booking.expiresAt).toLocaleString()}</span>}
                                {booking.status === 'Approved' && <button className={BTN_OUTLINE} onClick={() => downloadConfirmationPdf(booking)}>Download confirmation</button>}
                                {booking.status !== 'Cancelled' && booking.status !== 'Expired' && <button className={BTN_OUTLINE} onClick={() => cancelClientBooking(booking)}>Cancel booking</button>}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="grid gap-3 md:hidden">
                    {myBookings.map((booking) => (
                      <div key={booking.id} id={`client-booking-${booking.id}`} className="scroll-mt-24 rounded-2xl border border-stone-200 bg-stone-50 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <span className="font-semibold text-emerald-950">{booking.tripCode || booking.reference}</span>
                          <Badge tone={booking.status === 'Approved' ? 'green' : booking.status === 'Cancelled' || booking.status === 'Expired' ? 'stone' : 'amber'}>{clientBookingStatus(booking)}</Badge>
                        </div>
                        <p className="mb-0 mt-2 font-serif text-lg font-semibold">{booking.tour}</p>
                        <p className="m-0 text-sm text-stone-500">{booking.place}</p>
                        <p className="mb-0 mt-2 text-sm text-stone-600">{booking.members} member(s) · {birr(booking.price)} total · {booking.agentCode || 'Direct booking'}</p>
                        <p className="mb-0 mt-1 text-sm text-stone-600">Payment: {booking.paymentStatus}{booking.paymentMethod ? ` · ${booking.paymentMethod} · ${birr(booking.amountBirr)}` : ''}</p>
                        {booking.refundAmount > 0 && <p className="mb-0 mt-1 text-sm text-stone-600">Refund {booking.paymentStatus === 'Refunded' ? 'sent' : 'due'}: {birr(booking.refundAmount)} (fee {birr(booking.cancellationFee)}). Refunds are sent outside this demo.</p>}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {booking.paymentStatus === 'Awaiting payment' && <span className="self-center text-xs font-medium text-amber-800">Pay within 24 hours · by {new Date(booking.expiresAt).toLocaleString()}</span>}
                          {booking.status === 'Approved' && <button className={BTN_OUTLINE} onClick={() => downloadConfirmationPdf(booking)}>Download confirmation</button>}
                          {booking.status !== 'Cancelled' && booking.status !== 'Expired' && <button className={BTN_OUTLINE} onClick={() => cancelClientBooking(booking)}>Cancel booking</button>}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <Empty>You don’t have any booking requests yet. Pick a journey above to send your first.</Empty>
              )}
            </div>
          </Reveal>
        </section>
      )}

      {/* BOOKING MODAL */}
      {activeTour && signedIn && !paymentBooking && (
        <Modal onClose={() => setActiveTour(null)} labelledBy="booking-title" size="max-w-[480px]">
          <div className="relative h-36 overflow-hidden sm:h-44">
            <img src={activeTour.image} alt="" className="size-full object-cover" />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 to-transparent" />
            <span className="absolute bottom-4 left-6 right-16 text-sm font-semibold text-amber-300">
            {activeTour.category} · {birr(activeTour.price)} per person
            </span>
          </div>
          <div className="p-6 sm:p-8">
            <h2 id="booking-title" className="font-serif text-3xl font-semibold leading-tight text-emerald-950">{activeTour.place}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900">{activeTour.days}</span>
              {activeTour.journeyDate && <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900">{formatJourneyDate(activeTour.journeyDate)}{activeTour.startTime ? ` · ${activeTour.startTime}` : ''}</span>}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-stone-600">{activeTour.description}</p>
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-2 text-xs text-stone-600">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-emerald-600" />
              <span><strong className="text-emerald-950">Included:</strong> {INCLUDED_IN_JOURNEY_PRICE}</span>
            </p>
            <form className="mt-6 grid gap-4" onSubmit={completeBooking}>
              <Field id="booking-name" label="Full name" required autoComplete="name" value={customer.name ?? currentUser?.name ?? ''} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
              <Field id="booking-email" label="Email address" type="email" required autoComplete="email" value={customer.email ?? currentUser?.email ?? ''} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} />
              <div className="flex items-center justify-between rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                <div>
                  <p className="m-0 text-sm font-semibold text-emerald-950">Group size</p>
                  <p className="mb-0 mt-0.5 text-xs text-stone-500">Choose your travelers</p>
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" aria-label="Remove one traveler" disabled={Number(customer.members) <= 1} onClick={() => changeGroupSize(-1)} className="grid size-10 place-items-center rounded-full border border-stone-300 bg-white text-lg font-semibold text-emerald-900 transition hover:border-amber-500 disabled:opacity-40">−</button>
                  <span className="min-w-6 text-center font-semibold text-emerald-950" aria-live="polite">{customer.members}</span>
                  <button type="button" aria-label="Add one traveler" disabled={Number(customer.members) >= 50} onClick={() => changeGroupSize(1)} className="grid size-10 place-items-center rounded-full border border-stone-300 bg-white text-lg font-semibold text-emerald-900 transition hover:border-amber-500 disabled:opacity-40">+</button>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-emerald-950 px-4 py-3 text-sm text-white">
                <span>Total for {customer.members} {Number(customer.members) === 1 ? 'traveler' : 'travelers'}</span>
                <strong className="text-base text-amber-300">{birr(Number(activeTour.price) * Math.max(1, Number(customer.members) || 1))}</strong>
              </div>
              <Field id="agent-code" label="Agent code" optional placeholder="e.g. TTAM-7K4P2" maxLength="24" pattern="[A-Za-z0-9-]{4,24}" title="Use 4 to 24 letters, numbers, or hyphens." value={customer.agentCode} onChange={(e) => setCustomer({ ...customer, agentCode: e.target.value.toUpperCase() })} />
              {bookingError && <p className="m-0 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">{bookingError}</p>}
              <p className="m-0 rounded-xl bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">Unpaid bookings are held for 24 hours. Pay before the deadline or the booking will be automatically cancelled. Only paid bookings are sent to the manager for approval.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <button type="submit" disabled={creatingBooking} className={`${BTN} mt-1 w-full px-4 py-3 text-sm`}>{creatingBooking ? 'Saving booking…' : 'Continue to payment'}</button>
                <button
                  type="button"
                  disabled={creatingBooking}
                  className={`${BTN_OUTLINE} mt-1 w-full whitespace-normal px-4 py-3 text-sm`}
                  onClick={(event) => {
                    if (event.currentTarget.form?.reportValidity()) reserveBooking()
                  }}
                >
                  {creatingBooking ? 'Saving booking…' : 'Book now, pay within 24 hours'}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
      {activeTour && signedIn && paymentBooking && (
        <Modal onClose={() => { setActiveTour(null); setPaymentBooking(null) }} labelledBy="payment-title" size="max-w-[480px]">
          <div className="p-6 sm:p-8">
            <Badge tone="amber">Booking held for 24 hours</Badge>
            <h2 id="payment-title" className="mt-4 font-serif text-3xl font-semibold leading-tight text-emerald-950">Choose your payment method</h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">{paymentBooking.reference} · {paymentBooking.members} member(s) · {birr(paymentBooking.price)} total.</p>
            <p className="mt-2 rounded-xl bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">Demo checkout only. This records your selection and amount; it does not transfer or verify money.</p>
            <form className="mt-6 grid gap-4" onSubmit={completePayment}>
              <Field id="payment-method" label="Payment method" as="select" value={customer.paymentMethod} onChange={(event) => setCustomer({ ...customer, paymentMethod: event.target.value })}>
                <option>Telebirr</option>
                <option>CBE</option>
              </Field>
              <Field id="payment-amount" label="Amount paid (Birr)" type="number" min="0.01" step="0.01" required value={customer.amountBirr} onChange={(event) => setCustomer({ ...customer, amountBirr: event.target.value })} />
              <Field id="payment-reference" label="Demo transaction/reference number" required maxLength="100" value={customer.paymentReference} onChange={(event) => setCustomer({ ...customer, paymentReference: event.target.value })} />
              {bookingError && <p className="m-0 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">{bookingError}</p>}
              <button type="submit" className={`${BTN} mt-1 w-full py-4 text-base`}>Record demo payment</button>
            </form>
          </div>
        </Modal>
      )}
    </div>
  )
}

function clientBookingStatus(booking) {
  if (booking.paymentStatus === 'Awaiting payment') return 'Held for payment'
  return booking.status
}

function downloadConfirmationPdf(booking) {
  const issuedAt = booking.approvedAt
    ? new Date(booking.approvedAt).toLocaleString()
    : 'Not recorded'
  const tripDate = booking.journeyDate
    ? formatJourneyDate(booking.journeyDate)
    : 'Not specified'
  const lines = [
    'ASK TOUR AND TRAVEL',
    'BOOKING CONFIRMATION',
    '',
    `Trip code: ${booking.tripCode || booking.reference}`,
    `Confirmation issued: ${issuedAt}`,
    `Client: ${booking.name}`,
    `Email: ${booking.email}`,
    `Phone: ${booking.phone || 'Not provided'}`,
    `Journey: ${booking.tour}`,
    `Destination: ${booking.place}`,
    `Trip date: ${tripDate}`,
    `Trip time: ${booking.journeyStartTime || 'Not specified'}`,
    `Duration: ${booking.journeyDuration || 'Not specified'}`,
    `Travelers: ${booking.members}`,
    `Price per person: ${birr(booking.pricePerPerson || 0)}`,
    `Total price: ${birr(booking.price)}`,
    `Payment status: ${booking.paymentStatus || 'Not recorded'}`,
    ...(booking.paymentMethod ? [`Payment method: ${booking.paymentMethod}`] : []),
    ...(booking.paymentReference ? [`Payment reference: ${booking.paymentReference}`] : []),
    `Amount recorded: ${birr(booking.amountBirr || 0)}`,
    `Referring agent: ${booking.agentName || 'Direct booking'}`,
    ...(Number(booking.cancellationFee) > 0 ? [
      `Cancellation fee: ${birr(booking.cancellationFee)}`,
      `Refund ${booking.paymentStatus === 'Refunded' ? 'processed' : 'due'}: ${birr(booking.refundAmount)}`,
    ] : []),
    '',
    'Please keep this confirmation and present your trip code when requested.',
  ]
  downloadPdf(`${booking.reference}-confirmation.pdf`, lines)
}

function downloadPdf(fileName, lines) {
  const safe = (value) => String(value ?? '—')
    .replace(/[^\x20-\x7E]/g, '?')
    .replace(/([\\()])/g, '\\$1')
  const stream = `BT /F1 11 Tf 54 750 Td 17 TL ${lines.map((line, index) => `${index ? 'T* ' : ''}(${safe(line)}) Tj`).join(' ')} ET`
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ]
  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((object, index) => {
    offsets.push(pdf.length)
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })
  const xrefOffset = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  offsets.slice(1).forEach((offset) => { pdf += `${String(offset).padStart(10, '0')} 00000 n \n` })
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  const url = URL.createObjectURL(new Blob([pdf], { type: 'application/pdf' }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default ClientPage
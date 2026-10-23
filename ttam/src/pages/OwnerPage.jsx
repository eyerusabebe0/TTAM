import { useEffect, useState } from 'react'
import Reveal from './ScrollReveal.jsx'
import { birr } from '../utils/currency.js'
import { EXCLUDED_FROM_JOURNEY_PRICE, INCLUDED_IN_JOURNEY_PRICE } from '../utils/journeyPricePolicy.js'
import { Badge, BookingAnalytics, BTN, BTN_OUTLINE, Card, DataList, Empty, Field, Notice, PAGE, PageHeader, Perm, Section, Stat, Stats, SupportChat, Tabs } from './UI.jsx'

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=85'
const blankTour = { name: '', place: '', days: '', journeyDate: '', startTime: '09:00', price: '', category: 'Culture', image: '', description: '' }
const blankPermissions = { approveAgents: false, approveBookings: false, viewPayments: false, viewBookings: false }

function localDateInputValue() {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

function OwnerPage({ tours, agents, team, bookings, managerPermissionOptions, currentUser, token, notificationTarget, onAddTour, onUpdateTour, onDeleteTour, onAddManager, onApproveManager, onManagerActiveChange, onManagerPermissionChange, onBookingUpdate }) {
  const [form, setForm] = useState(blankTour)
  const [managerForm, setManagerForm] = useState({ name: '', email: '', password: '', permissions: blankPermissions })
  const [showPassword, setShowPassword] = useState(false)
  const [page, setPage] = useState('overview')
  const [agentFilter, setAgentFilter] = useState('all')
  const [bookingSource, setBookingSource] = useState('all')
  const [bookingAgent, setBookingAgent] = useState('all')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const pageBySection = { team: 'team', bookings: 'bookings' }
    const nextPage = pageBySection[notificationTarget?.section]
    if (!nextPage) return
    const timer = window.setTimeout(() => {
      setPage(nextPage)
      window.requestAnimationFrame(() => {
        document.getElementById(notificationTarget.elementId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }, 0)
    return () => window.clearTimeout(timer)
  }, [notificationTarget])

  async function publishTour(event) {
    event.preventDefault()
    const tour = { ...form, price: Number(form.price), image: form.image || FALLBACK_IMAGE }
    const error = await (form.id ? onUpdateTour(tour) : onAddTour(tour))
    if (error) {
      setMessage(error)
      return
    }
    setMessage(form.id ? 'Journey updated.' : 'Journey published. It is now visible on the client explore page.')
    setForm(blankTour)
  }

  function selectTourImage(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setMessage('Choose a JPG, PNG, or WebP image.')
      event.target.value = ''
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessage('Choose an image smaller than 2 MB.')
      event.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setForm((current) => ({ ...current, image: reader.result }))
        setMessage('')
      }
    }
    reader.onerror = () => setMessage('Could not read this image. Try another file.')
    reader.readAsDataURL(file)
  }

  async function deleteTour(tour) {
    if (!window.confirm(`Delete ${tour.name}?`)) return
    const error = await onDeleteTour(tour.id)
    setMessage(error || 'Journey deleted.')
  }

  function editTour(tour) {
    setForm({ ...tour })
    document.getElementById('publish-journey')?.scrollIntoView({ behavior: 'smooth' })
  }

  async function registerManager(event) {
    event.preventDefault()
    const error = await onAddManager({ id: Date.now(), ...managerForm, status: 'pending' })
    if (error) {
      setMessage(error)
      return
    }
    setManagerForm({ name: '', email: '', password: '', permissions: blankPermissions })
    setMessage('Manager registered. Review and approve the account below to activate it.')
  }

  const approvedAgents = agents.filter((agent) => agent.status === 'approved').length
  const approvedManagers = team.filter((manager) => manager.status === 'approved').length
  const toReview = team.filter((member) => member.status !== 'approved').length
  const netRecordedPayments = bookings.reduce((total, booking) => {
    if (!['Paid', 'Refund due', 'Refunded'].includes(booking.paymentStatus)) return total
    return total + Math.max(0, Number(booking.amountBirr || 0) - (booking.paymentStatus === 'Paid' ? 0 : Number(booking.refundAmount || 0)))
  }, 0)
  const bookingAgents = [...new Map(bookings.filter((booking) => booking.agentId).map((booking) => [
    booking.agentId,
    { id: booking.agentId, name: booking.agentName, code: booking.agentCode },
  ])).values()]
  const filteredBookings = bookings.filter((booking) => (
    (bookingSource === 'all' || (bookingSource === 'agent' ? Boolean(booking.agentId) : !booking.agentId))
    && (bookingAgent === 'all' || String(booking.agentId) === bookingAgent)
  ))

  const managerColumns = [
    { label: 'Manager', render: (m) => <div className="min-w-0 text-left max-md:text-right"><strong className="block text-emerald-950">{m.name}</strong><span className="block break-all text-xs text-stone-500">{m.email}</span></div> },
    { label: 'Status', render: (m) => <Badge tone={m.isActive === false ? 'stone' : m.status === 'approved' ? 'green' : 'amber'}>{m.isActive === false ? 'Deactivated' : m.status === 'approved' ? 'Approved' : 'Pending approval'}</Badge> },
    {
      label: 'Permissions',
      render: (m) => (
        <div className="perm-wrap flex flex-wrap gap-2 md:min-w-[300px]">
          {managerPermissionOptions.map((option) => (
            <Perm key={option.key} label={option.label} checked={Boolean(m.permissions[option.key])} onChange={() => onManagerPermissionChange(m.id, option.key)} />
          ))}
        </div>
      ),
    },
    { label: 'Action', render: (m) => (
      m.status !== 'approved'
        ? <button className={`${BTN} min-h-10 px-4 py-2`} onClick={() => onApproveManager(m.id)}>Approve manager</button>
        : <button className={BTN_OUTLINE} onClick={() => onManagerActiveChange(m.id, m.isActive === false)}>{m.isActive === false ? 'Activate manager' : 'Deactivate manager'}</button>
    ) },
  ]

  return (
    <div className="bg-stone-50 pb-20">
      <PageHeader
        kicker="Owner controls"
        title="Shape the journeys."
        text="Publish the experiences clients can book and review the whole operation."
        tag="OWNER WORKSPACE"
      />
      <Stats>
        <Stat label="Published journeys" value={tours.length} onClick={() => setPage('tours')} />
        <Stat label="Approved agents" value={approvedAgents} delay={100} onClick={() => { setAgentFilter('approved'); setPage('team') }} />
        <Stat label="Registered managers" value={approvedManagers} delay={200} className="col-span-2 sm:col-span-1" onClick={() => setPage('team')} />
      </Stats>

      <div className={PAGE}>
        {message && <div className="pt-8"><Notice>{message}</Notice></div>}
        <div className="pt-6">
          <SupportChat currentUser={currentUser} token={token} />
          <Tabs
            tabs={[
              { key: 'overview', label: 'Overview' },
              { key: 'tours', label: 'Journeys' },
              { key: 'team', label: 'Team & access' },
              { key: 'bookings', label: 'Reports' },
            ]}
            value={page}
            onChange={(nextPage) => {
              setPage(nextPage)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            label="Owner dashboard pages"
          />
        </div>

        {page === 'overview' && (
          <Section title="Operations overview" text="Review your business at a glance, then open a dedicated page to manage journeys, team access, or bookings.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <p className="m-0 text-sm font-semibold text-stone-500">Net recorded payments</p>
                <p className="mb-0 mt-2 font-serif text-3xl font-semibold text-emerald-950">{birr(netRecordedPayments)}</p>
                <p className="mb-0 mt-2 text-xs text-stone-500">Paid bookings less refunds recorded as processed.</p>
              </Card>
              <Card>
                <p className="m-0 text-sm font-semibold text-stone-500">Bookings</p>
                <p className="mb-0 mt-2 font-serif text-3xl font-semibold text-emerald-950">{bookings.length}</p>
                <button type="button" className={`${BTN_OUTLINE} mt-4`} onClick={() => setPage('bookings')}>Open booking reports</button>
              </Card>
            </div>
          </Section>
        )}

        {page === 'tours' && <>
        <Section title={form.id ? 'Edit journey' : 'Publish a journey'} text="Add the destination, a short description, trip duration and date, and price. Clients will also see what the price includes and excludes." className="scroll-mt-24" >
          <div className="grid gap-6 lg:grid-cols-[1.3fr_.7fr] lg:items-start">
            <Card>
              <form id="publish-journey" onSubmit={publishTour} className="grid gap-4 sm:grid-cols-2">
                <Field id="tour-name" label="Journey title" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="A morning above the clouds" required />
                <Field id="tour-place" label="Destination" value={form.place} onChange={(e) => setForm({ ...form, place: e.target.value })} placeholder="Simien Mountains, Ethiopia" required />
                <Field id="tour-days" label="Trip duration" value={form.days} onChange={(e) => setForm({ ...form, days: e.target.value })} placeholder="3 days · Guided walk" required />
                <Field id="tour-date" label="Trip date" type="date" min={localDateInputValue()} value={form.journeyDate} onChange={(e) => setForm({ ...form, journeyDate: e.target.value })} required />
                <Field id="tour-start-time" label="Start time" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required />
                <Field id="tour-category" label="Category" as="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option>Culture</option>
                  <option>Adventure</option>
                  <option>Slow travel</option>
                  <option>Food & nature</option>
                  <option>Wildlife</option>
                </Field>
                <Field id="tour-price" label="Price per person (Birr)" type="number" min="1" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="750" required />
                <div className="rounded-xl border border-emerald-900/10 bg-emerald-50/70 px-4 py-3 text-sm sm:col-span-2">
                  <p className="mb-1 font-semibold text-emerald-950">Price covers: {INCLUDED_IN_JOURNEY_PRICE}</p>
                  <p className="m-0 text-stone-600">Not included: {EXCLUDED_FROM_JOURNEY_PRICE}.</p>
                </div>
                <Field id="tour-image" label="Image URL" optional type="url" value={form.image.startsWith('data:image/') ? '' : form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://..." />
                <Field id="tour-image-file" label="Or choose an image file" optional type="file" accept="image/jpeg,image/png,image/webp" onChange={selectTourImage} />
                {form.image.startsWith('data:image/') && <div className="flex items-center justify-between gap-3 sm:col-span-2"><span className="truncate text-xs text-stone-500">Image file selected</span><button className={BTN_OUTLINE} type="button" onClick={() => setForm({ ...form, image: '' })}>Remove image</button></div>}
                <Field className="sm:col-span-2" id="tour-description" label="Description" as="textarea" rows="4" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Tell travelers what makes this experience worth taking." required />
                <button className={`${BTN} min-h-12 sm:col-span-2`} type="submit">{form.id ? 'Save journey' : 'Publish journey'}</button>
                {form.id && <button className={`${BTN_OUTLINE} sm:col-span-2`} type="button" onClick={() => setForm(blankTour)}>Cancel edit</button>}
              </form>
            </Card>

            <div className="lg:sticky lg:top-24">
              <p className="mb-3 text-sm font-semibold text-stone-500">Live preview</p>
              <article className="overflow-hidden rounded-3xl border border-emerald-950/10 bg-white shadow-xl shadow-emerald-950/10">
                <div className="relative aspect-[4/3] bg-stone-200">
                  <img src={form.image || FALLBACK_IMAGE} alt="" className="size-full object-cover" />
                  <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-emerald-950/60 to-transparent" />
                  <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-emerald-900">{form.category}</span>
                  <span className="absolute bottom-4 left-4 right-4 font-serif text-2xl font-semibold leading-tight text-white drop-shadow">{form.place || 'Destination'}</span>
                </div>
                <div className="p-5">
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900">{form.days || 'Trip duration'}</span>
                    {form.journeyDate && <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900">{new Date(`${form.journeyDate}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}{form.startTime ? ` · ${form.startTime}` : ''}</span>}
                  </div>
                  <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-stone-600">{form.description || 'Your description will appear here.'}</p>
                  <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-2 text-xs text-stone-600">
                    <span aria-hidden="true" className="size-1.5 rounded-full bg-emerald-600" />
                    <span><strong className="text-emerald-950">Included:</strong> {INCLUDED_IN_JOURNEY_PRICE}</span>
                  </p>
                  <span className="block font-serif text-2xl font-semibold text-emerald-950">{birr(form.price || 0)}<small className="ml-1.5 font-sans text-xs font-normal text-stone-500">per person</small></span>
                </div>
              </article>
            </div>
          </div>
        </Section>
        </>}

        {page === 'team' && <>
        <Section title="Register a manager" text="Set their access, then approve the account from the manager list.">
          <Card>
            <form onSubmit={registerManager} className="grid gap-4 sm:grid-cols-2">
              <Field id="owner-manager-name" label="Full name" value={managerForm.name} onChange={(e) => setManagerForm({ ...managerForm, name: e.target.value })} required />
              <Field id="owner-manager-email" label="Email address" type="email" value={managerForm.email} onChange={(e) => setManagerForm({ ...managerForm, email: e.target.value })} required />
              <div className="relative sm:col-span-2">
                <Field id="owner-manager-password" label="Manager password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength="8" value={managerForm.password} onChange={(e) => setManagerForm({ ...managerForm, password: e.target.value })} required />
                <button type="button" aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)} className="absolute bottom-3 right-3 cursor-pointer rounded-md bg-transparent px-2 py-1 text-xs font-semibold text-emerald-800">{showPassword ? 'Hide' : 'Show'}</button>
              </div>
              <fieldset className="m-0 min-w-0 border-0 p-0 sm:col-span-2">
                <legend className="mb-2 p-0 text-sm font-semibold text-stone-800">Manager permissions</legend>
                <div className="flex flex-wrap gap-2">
                  {managerPermissionOptions.map((option) => (
                    <Perm
                      key={option.key}
                      label={option.label}
                      checked={managerForm.permissions[option.key]}
                      onChange={() => setManagerForm({ ...managerForm, permissions: { ...managerForm.permissions, [option.key]: !managerForm.permissions[option.key] } })}
                    />
                  ))}
                </div>
              </fieldset>
              <button className={`${BTN} min-h-12 sm:col-span-2`} type="submit">Register manager</button>
            </form>
          </Card>
        </Section>

        <div id="manager-approvals" className="scroll-mt-24">
        <Section title="Manager approvals" text="Manager accounts stay inactive until you approve them." action={<Badge tone="amber">{toReview} to review</Badge>}>
          {team.length ? <DataList columns={managerColumns} rows={team} getKey={(m) => m.id} /> : <Empty>No managers registered yet. Add a manager above to begin the approval process.</Empty>}
        </Section>
        </div>

        <section id="registered-agents" className="scroll-mt-24">
          <Section title="Registered agents" text="Review approved and pending agent accounts." action={<div className="flex gap-2"><button type="button" className={agentFilter === 'all' ? BTN : BTN_OUTLINE} onClick={() => setAgentFilter('all')}>All</button><button type="button" className={agentFilter === 'approved' ? BTN : BTN_OUTLINE} onClick={() => setAgentFilter('approved')}>Approved</button><button type="button" className={agentFilter === 'pending' ? BTN : BTN_OUTLINE} onClick={() => setAgentFilter('pending')}>Pending</button></div>}>
            {agents.length ? <DataList columns={[
              { label: 'Agent', render: (agent) => <div><strong className="block text-emerald-950">{agent.name}</strong><span className="text-xs text-stone-500">{agent.email}</span></div> },
              { label: 'Phone', render: (agent) => agent.phone || '—' },
              { label: 'Status', render: (agent) => <Badge tone={agent.isActive === false ? 'stone' : agent.status === 'approved' ? 'green' : 'amber'}>{agent.isActive === false ? 'Deactivated' : agent.status}</Badge> },
              { label: 'Invitation code', render: (agent) => agent.code || '—' },
            ]} rows={agents.filter((agent) => agentFilter === 'all' || agent.status === agentFilter)} getKey={(agent) => agent.id} /> : <Empty>No agents have registered yet.</Empty>}
          </Section>
        </section>
        </>}

        {page === 'tours' && <>
        <section id="published-journeys" className="scroll-mt-24">
        <Section title="Published journeys" text="Edit or remove journeys from the client catalog." action={<Badge tone="green">{tours.length} live</Badge>}>
          <div className="grid gap-3">
            {tours.map((tour, index) => (
              <Reveal key={tour.id} delay={(index % 4) * 80}>
                <div className="flex items-center gap-4 rounded-2xl border border-emerald-950/10 bg-white p-3 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md sm:p-4">
                  <img className="size-16 shrink-0 rounded-xl object-cover sm:h-20 sm:w-28" src={tour.image} alt="" loading="lazy" />
                  <div className="min-w-0 flex-1">
                    <strong className="block truncate font-serif text-lg text-emerald-950">{tour.name}</strong>
                    <span className="block truncate text-sm text-stone-500">{tour.place}</span>
                    <span className="mt-1 hidden text-xs text-stone-500 sm:block">{tour.category} · {tour.days}{tour.journeyDate ? ` · ${new Date(`${tour.journeyDate}T00:00:00`).toLocaleDateString()}` : ''}{tour.startTime ? ` · ${tour.startTime}` : ''}</span>
                  </div>
                  <span className="font-serif text-xl font-semibold text-emerald-950 sm:text-2xl">{birr(tour.price)}</span>
                  <div className="flex gap-2">
                    <button className={BTN_OUTLINE} type="button" onClick={() => editTour(tour)}>Edit</button>
                    <button className="min-h-10 cursor-pointer rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50" type="button" onClick={() => deleteTour(tour)}>Delete</button>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Section>
        </section>
        </>}

        {page === 'bookings' && (
        <div id="owner-bookings" className="scroll-mt-24">
        <Section title="Booking reports" text="Filter payments by referral, agent, and date. Payment entries and refund confirmations are recorded for reconciliation; transfers require your payment provider." action={<div className="flex flex-wrap items-center gap-2"><select aria-label="Filter bookings by referral" className="min-h-10 rounded-full border border-stone-300 bg-white px-4 text-sm" value={bookingSource} onChange={(event) => { setBookingSource(event.target.value); if (event.target.value !== 'agent') setBookingAgent('all') }}><option value="all">All bookings</option><option value="agent">Agent referrals</option><option value="direct">Direct bookings</option></select>{bookingSource === 'agent' && <select aria-label="Filter bookings by agent" className="min-h-10 rounded-full border border-stone-300 bg-white px-4 text-sm" value={bookingAgent} onChange={(event) => setBookingAgent(event.target.value)}><option value="all">All agents</option>{bookingAgents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name} · {agent.code || 'code unavailable'}</option>)}</select>}<Badge tone="amber">{filteredBookings.length} shown</Badge></div>}>
          <BookingAnalytics bookings={filteredBookings} totalMode="payments" columns={[
            { label: 'Client', render: (booking) => <div><strong className="block text-emerald-950">{booking.name}</strong><span className="block text-xs text-stone-500">{booking.email}</span>{booking.phone && <span className="block text-xs text-stone-500">{booking.phone}</span>}</div> },
            { label: 'Journey', render: (booking) => booking.tour },
            { label: 'Members', render: (booking) => booking.members || 1 },
            { label: 'Referral', render: (booking) => booking.agentId ? `${booking.agentName} · ${booking.agentCode || 'code unavailable'}` : 'Direct booking' },
            { label: 'Date', render: (booking) => (booking.paidAt || booking.createdAt) ? new Date(booking.paidAt || booking.createdAt).toLocaleDateString() : '—' },
            { label: 'Trip value', render: (booking) => birr(booking.price) },
            { label: 'Payment', render: (booking) => <div><Badge tone={booking.paymentStatus === 'Paid' || booking.paymentStatus === 'Refunded' ? 'green' : booking.paymentStatus === 'Awaiting payment' ? 'amber' : 'stone'}>{booking.paymentStatus}</Badge>{booking.paymentMethod && <span className="mt-1 block text-xs text-stone-500">{booking.paymentMethod} · {birr(booking.amountBirr)} · {booking.paymentReference}</span>}</div> },
            { label: 'Fee / refund', render: (booking) => booking.refundAmount > 0 ? `Fee ${birr(booking.cancellationFee)} · ${booking.paymentStatus === 'Refunded' ? 'Refunded' : 'Refund due'} ${birr(booking.refundAmount)}` : '—' },
            { label: 'Agent commission (10%)', render: (booking) => booking.commission ? birr(booking.commission) : '—' },
            { label: 'Action', render: (booking) => booking.paymentStatus === 'Refund due' ? <button className={BTN_OUTLINE} onClick={() => onBookingUpdate(booking.id, { paymentStatus: 'Refunded' })}>Record refund sent</button> : '—' },
          ]} getKey={(booking) => booking.id} />
        </Section>
        </div>
        )}
      </div>
    </div>
  )
}

export default OwnerPage
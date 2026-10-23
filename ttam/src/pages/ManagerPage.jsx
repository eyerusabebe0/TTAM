import { useEffect, useState } from 'react'
import { birr } from '../utils/currency.js'
import { Badge, BookingAnalytics, BTN, BTN_OUTLINE, DataList, Empty, Field, Modal, Notice, PAGE, PageHeader, Perm, Section, Stat, Stats, SupportChat, Tabs } from './UI.jsx'

function ManagerPage({ agents, bookings, permissionOptions, currentPermissions, currentUser, token, notificationTarget, onApprove, onAgentCodeChange, onPermissionChange, onAgentActiveChange, onBookingUpdate, onBookingApprove }) {
  const defaultView = currentPermissions?.approveAgents ? 'agents' : currentPermissions?.viewBookings || currentPermissions?.approveBookings ? 'bookings' : 'locked'
  const [view, setView] = useState(currentPermissions ? defaultView : 'agents')
  const [agentStatusFilter, setAgentStatusFilter] = useState('all')
  const [agentCodes, setAgentCodes] = useState(() => Object.fromEntries(agents.map((agent) => [agent.id, agent.code || ''])))
  const [codeErrors, setCodeErrors] = useState({})
  const [message, setMessage] = useState('')
  const [bookingSource, setBookingSource] = useState('all')
  const [bookingAgent, setBookingAgent] = useState('all')
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [tripCode, setTripCode] = useState('')
  const [tripTime, setTripTime] = useState('')
  const [approvalError, setApprovalError] = useState('')
  const [approvingBooking, setApprovingBooking] = useState(false)
  useEffect(() => {
    if (notificationTarget?.section !== 'agents' && notificationTarget?.section !== 'bookings') return
    const timer = window.setTimeout(() => {
      setView(notificationTarget.section)
      window.requestAnimationFrame(() => {
        document.getElementById(notificationTarget.elementId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }, 0)
    return () => window.clearTimeout(timer)
  }, [notificationTarget])
  const approved = agents.filter((agent) => agent.status === 'approved' && agent.isActive !== false).length
  const pending = agents.filter((agent) => agent.status === 'pending' && agent.isActive !== false).length
  const canApproveAgents = currentPermissions?.approveAgents ?? true
  const canApproveBookings = currentPermissions?.approveBookings ?? !currentPermissions
  const canViewPayments = currentPermissions?.viewPayments ?? true
  const canViewBookings = currentPermissions?.viewBookings ?? true
  const canAccessBookings = canViewBookings || canApproveBookings
  const bookingAgents = [...new Map(bookings.filter((booking) => booking.agentId).map((booking) => [
    booking.agentId,
    { id: booking.agentId, name: booking.agentName, code: booking.agentCode },
  ])).values()]
  const filteredBookings = bookings.filter((booking) => (
    (bookingSource === 'all' || (bookingSource === 'agent' ? Boolean(booking.agentId) : !booking.agentId))
    && (bookingAgent === 'all' || String(booking.agentId) === bookingAgent)
  ))
  const filteredAgents = agents.filter((agent) => (
    agentStatusFilter === 'all'
    || (agentStatusFilter === 'pending' && agent.status === 'pending' && agent.isActive !== false)
    || (agentStatusFilter === 'approved' && agent.status === 'approved' && agent.isActive !== false)
  ))

  const tabs = [
    canApproveAgents && { key: 'agents', label: 'Agent approvals' },
    canAccessBookings && { key: 'bookings', label: 'Client requests' },
  ].filter(Boolean)

  const person = (item) => (
    <div className="min-w-0 text-left max-md:text-right">
      <strong className="block text-emerald-950">{item.name}</strong>
      <span className="block break-all text-xs text-stone-500">{item.email}</span>
      {item.phone && <span className="block text-xs text-stone-500">{item.phone}</span>}
    </div>
  )

  const bookingColumns = [
    { label: 'Client', render: person },
    { label: 'Journey', render: (b) => b.tour },
    { label: 'Referral', render: (b) => b.agentId ? `${b.agentName} · ${b.agentCode || 'code unavailable'}` : 'Direct booking' },
    { label: 'Members', render: (b) => b.members || 1 },
    { label: 'Value', render: (b) => birr(b.price) },
    { label: 'Agent commission (10%)', render: (b) => (b.commission ? birr(b.commission) : '—') },
    { label: 'Status', render: (b) => <Badge tone={b.status === 'Approved' ? 'green' : b.status === 'Cancelled' || b.status === 'Expired' ? 'stone' : 'amber'}>{b.status}</Badge> },
    ...(canViewPayments ? [{ label: 'Payment / refund', render: (b) => <div><Badge tone={b.paymentStatus === 'Paid' || b.paymentStatus === 'Refunded' ? 'green' : b.paymentStatus === 'Awaiting payment' ? 'amber' : 'stone'}>{b.paymentStatus}</Badge>{b.paymentMethod && <span className="mt-1 block text-xs text-stone-500">{b.paymentMethod} · {birr(b.amountBirr)} · {b.paymentReference}</span>}{b.cancellationFee > 0 && <span className="mt-1 block text-xs text-stone-500">Fee {birr(b.cancellationFee)} · {b.paymentStatus === 'Refunded' ? 'refunded' : 'refund due'} {birr(b.refundAmount)}</span>}</div> }] : []),
    {
      label: 'Actions',
      render: (b) => (
        <div className="flex flex-wrap justify-end gap-2 md:min-w-[210px] md:justify-start">
          {canApproveBookings && b.status !== 'Approved' && b.status !== 'Cancelled' && b.status !== 'Expired' && <button className={`${BTN} min-h-10 px-4 py-2`} onClick={() => {
            setSelectedBooking(b)
            setTripCode('')
            setTripTime(b.journeyStartTime || '')
            setApprovalError('')
          }}>Review & approve</button>}
          {canViewPayments && b.paymentStatus === 'Refund due' && <button className={BTN_OUTLINE} onClick={() => onBookingUpdate(b.id, { paymentStatus: 'Refunded' })}>Record refund sent</button>}
        </div>
      ),
    },
  ]

  async function submitBookingApproval(event) {
    event.preventDefault()
    if (!selectedBooking) return
    setApprovingBooking(true)
    setApprovalError('')
    const error = await onBookingApprove(selectedBooking.id, {
      tripCode: tripCode.trim().toUpperCase(),
      journeyStartTime: tripTime,
    })
    setApprovingBooking(false)
    if (error) {
      setApprovalError(error)
      return
    }
    setMessage(`Booking confirmed and ${selectedBooking.name} notified.`)
    setSelectedBooking(null)
  }

  async function saveAgentCode(agent) {
    const code = (agentCodes[agent.id] || '').trim()
    const error = await onAgentCodeChange(agent.id, code)
    if (error) {
      setCodeErrors((current) => ({ ...current, [agent.id]: error }))
      return
    }
    setCodeErrors((current) => ({ ...current, [agent.id]: '' }))
    setMessage(`Invitation code saved for ${agent.name}.`)
  }

  async function approveWithCode(agent) {
    const error = await onApprove(agent.id, agentCodes[agent.id] || '')
    if (error) {
      setCodeErrors((current) => ({ ...current, [agent.id]: error }))
      return
    }
    setCodeErrors((current) => ({ ...current, [agent.id]: '' }))
    setMessage(`${agent.name} approved and assigned the invitation code.`)
  }

  const agentColumns = [
    { label: 'Agent', render: person },
    { label: 'Status', render: (a) => <Badge tone={a.isActive === false ? 'stone' : a.status === 'approved' ? 'green' : 'amber'}>{a.isActive === false ? 'Deactivated' : a.status === 'pending' ? 'Pending review' : 'Approved'}</Badge> },
    {
      label: 'Invitation code',
      render: (a) => (
        <div className="min-w-44">
          <input aria-label={`Invitation code for ${a.name}`} className="w-full rounded-lg border border-stone-300 bg-stone-50 px-3 py-2 font-mono text-sm uppercase" value={agentCodes[a.id] ?? a.code ?? ''} onChange={(event) => setAgentCodes((current) => ({ ...current, [a.id]: event.target.value.toUpperCase() }))} minLength="4" maxLength="24" pattern="[A-Za-z0-9-]{4,24}" placeholder="Type an agent code" />
          {codeErrors[a.id] && <span className="mt-1 block max-w-56 text-xs text-red-700" role="alert">{codeErrors[a.id]}</span>}
        </div>
      ),
    },
    {
      label: 'Access granted',
      render: (a) => (
        <div className="perm-wrap flex flex-wrap gap-2 md:min-w-[260px]">
          {permissionOptions.map((option) => (
            <Perm key={option.key} label={option.label} checked={Boolean(a.permissions[option.key])} onChange={() => onPermissionChange(a.id, option.key)} />
          ))}
        </div>
      ),
    },
    {
      label: 'Action',
      render: (a) => (
        <div className="flex flex-wrap gap-2">
          {a.status === 'pending'
            ? <button className={`${BTN} min-h-10 px-4 py-2`} onClick={() => approveWithCode(a)}>Approve & assign</button>
            : <>
              <button className={`${BTN_OUTLINE} min-h-10 px-4 py-2`} onClick={() => saveAgentCode(a)}>Save code</button>
              <a className={`${BTN_OUTLINE} no-underline`} href={`mailto:${a.email}?subject=${encodeURIComponent('Your Ask Tour and Travel invitation code')}&body=${encodeURIComponent(`Hello ${a.name},\n\nYour agent referral code is ${a.code}.\n\nAsk Tour and Travel`)}`}>Email code</a>
            </>}
          {a.status === 'approved' && (
            <button
              className={`${BTN_OUTLINE} min-h-10 px-4 py-2`}
              onClick={async () => {
                const error = await onAgentActiveChange(a.id, a.isActive === false)
                setMessage(error || `${a.name} ${a.isActive === false ? 'reactivated' : 'deactivated'}.`)
              }}
            >
              {a.isActive === false ? 'Reactivate' : 'Deactivate'}
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="bg-stone-50 pb-20">
      <PageHeader
        kicker="Operations desk"
        title="Good morning, manager."
        text="Approve agent registrations, assign referral codes, and route client requests."
        tag="MANAGER WORKSPACE"
      />
      <Stats>
        <Stat label="Agent applications" value={pending} note="pending" onClick={canApproveAgents ? () => { setAgentStatusFilter('pending'); setView('agents') } : undefined} />
        <Stat label="Approved agents" value={approved} delay={100} onClick={canApproveAgents ? () => { setAgentStatusFilter('approved'); setView('agents') } : undefined} />
        <Stat label="Client requests" value={bookings.length} delay={200} className="col-span-2 sm:col-span-1" onClick={canAccessBookings ? () => setView('bookings') : undefined} />
      </Stats>

      <div className={`${PAGE} pt-8`}>
        {tabs.length > 0 && <Tabs tabs={tabs} value={view} onChange={(key) => { setView(key); setMessage('') }} label="Manager tools" />}
        {message && <div className="mt-6"><Notice>{message}</Notice></div>}

        <SupportChat currentUser={currentUser} token={token} />

        {view === 'agents' && canApproveAgents && (
          <div id="manager-agent-applications" className="scroll-mt-24">
          <Section
            title="Agent applications & access"
            text="Set each agent's invitation code and choose whether they can view payments or bookings."
            action={<div className="flex flex-wrap gap-2">{[['all', 'All'], ['pending', 'Pending'], ['approved', 'Approved']].map(([status, label]) => <button key={status} type="button" className={`${agentStatusFilter === status ? BTN : BTN_OUTLINE} min-h-10 px-4 py-2`} onClick={() => setAgentStatusFilter(status)}>{label}</button>)}</div>}
          >
            {filteredAgents.length ? <DataList columns={agentColumns} rows={filteredAgents} getKey={(a) => a.id} /> : <Empty>{agents.length ? `No ${agentStatusFilter} agents to show.` : 'No agent applications yet. New applications will appear here.'}</Empty>}
          </Section>
          </div>
        )}

        {view === 'bookings' && canAccessBookings && (
          <div id="manager-client-requests" className="scroll-mt-24">
          <Section
            title="Client requests"
            text="Filter referred clients by agent or referral code, or review direct bookings. Pending demo refunds remain due for staff to process."
            action={<div className="flex flex-wrap items-center gap-2"><select aria-label="Filter bookings by referral" className="min-h-10 rounded-full border border-stone-300 bg-white px-4 text-sm" value={bookingSource} onChange={(event) => { setBookingSource(event.target.value); if (event.target.value !== 'agent') setBookingAgent('all') }}><option value="all">All bookings</option><option value="agent">Agent referrals</option><option value="direct">Direct bookings</option></select>{bookingSource === 'agent' && <select aria-label="Filter bookings by agent" className="min-h-10 rounded-full border border-stone-300 bg-white px-4 text-sm" value={bookingAgent} onChange={(event) => setBookingAgent(event.target.value)}><option value="all">All agents</option>{bookingAgents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name} · {agent.code || 'code unavailable'}</option>)}</select>}<Badge tone="amber">{filteredBookings.length} shown</Badge></div>}
          >
            <BookingAnalytics bookings={filteredBookings} columns={bookingColumns} getKey={(booking) => booking.id} />
          </Section>
          </div>
        )}

        {view === 'locked' && <div className="mt-8"><Empty>No manager permissions have been granted to this account.</Empty></div>}
      </div>
      {selectedBooking && (
        <Modal onClose={() => { if (!approvingBooking) setSelectedBooking(null) }} labelledBy="booking-approval-title" size="max-w-[520px]">
          <div className="p-6 sm:p-8">
            <Badge tone="amber">Review booking</Badge>
            <h2 id="booking-approval-title" className="mt-3 font-serif text-3xl font-semibold text-emerald-950">Confirm trip details</h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">Check the client information, enter the trip code and confirm the departure time. The client will see a dashboard notification and can download the confirmation PDF after approval.</p>
            <div className="mt-5 grid gap-3 rounded-2xl bg-stone-50 p-4 text-sm sm:grid-cols-2">
              <div><span className="block text-xs font-semibold uppercase tracking-wide text-stone-500">Client</span><strong className="mt-1 block text-emerald-950">{selectedBooking.name}</strong></div>
              <div><span className="block text-xs font-semibold uppercase tracking-wide text-stone-500">Phone</span><strong className="mt-1 block text-emerald-950">{selectedBooking.phone || 'Not provided'}</strong></div>
              <div className="sm:col-span-2"><span className="block text-xs font-semibold uppercase tracking-wide text-stone-500">Email</span><strong className="mt-1 block break-all text-emerald-950">{selectedBooking.email}</strong></div>
              <div><span className="block text-xs font-semibold uppercase tracking-wide text-stone-500">Destination</span><strong className="mt-1 block text-emerald-950">{selectedBooking.place}</strong></div>
              <div><span className="block text-xs font-semibold uppercase tracking-wide text-stone-500">Trip date</span><strong className="mt-1 block text-emerald-950">{selectedBooking.journeyDate || 'Not specified'}</strong></div>
              <div><span className="block text-xs font-semibold uppercase tracking-wide text-stone-500">Travelers</span><strong className="mt-1 block text-emerald-950">{selectedBooking.members || 1}</strong></div>
              <div><span className="block text-xs font-semibold uppercase tracking-wide text-stone-500">Total</span><strong className="mt-1 block text-emerald-950">{birr(selectedBooking.price)}</strong></div>
              <div className="sm:col-span-2"><span className="block text-xs font-semibold uppercase tracking-wide text-stone-500">Journey</span><strong className="mt-1 block text-emerald-950">{selectedBooking.tour}</strong></div>
            </div>
            <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={submitBookingApproval}>
              <Field className="sm:col-span-2" id="approval-trip-code" label="Trip code" required minLength="4" maxLength="24" pattern="[A-Za-z0-9-]{4,24}" title="Use 4 to 24 letters, numbers, or hyphens." placeholder="e.g. LAL-2026-01" value={tripCode} onChange={(event) => setTripCode(event.target.value.toUpperCase())} />
              <Field className="sm:col-span-2" id="approval-trip-time" label="Departure time" type="time" required value={tripTime} onChange={(event) => setTripTime(event.target.value)} />
              {approvalError && <p className="m-0 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 sm:col-span-2" role="alert">{approvalError}</p>}
              <button className={`${BTN} sm:col-span-2`} type="submit" disabled={approvingBooking}>{approvingBooking ? 'Approving…' : 'Approve & notify client'}</button>
              <button className={`${BTN_OUTLINE} sm:col-span-2`} type="button" disabled={approvingBooking} onClick={() => setSelectedBooking(null)}>Cancel</button>
            </form>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default ManagerPage
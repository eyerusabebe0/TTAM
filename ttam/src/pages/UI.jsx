import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import Reveal from '../pages/ScrollReveal.jsx'
import { apiRequest } from '../api.js'
import { birr } from '../utils/currency.js'

/* Shared building blocks so every page speaks the same luxury visual language. */

/* Money is always written "840 Birr" (number first, currency after). Use birr(x) or <Money value={x} /> everywhere. */
export function Money({ value, className = '' }) {
  return <span className={className}>{birr(value)}</span>
}

export const PAGE = 'mx-auto w-full max-w-[1240px] px-4 sm:px-8 lg:px-12'

export const INPUT =
  'min-h-11 w-full rounded-xl border border-stone-300 bg-stone-50/80 px-3.5 py-2.5 text-base text-stone-900 outline-none transition duration-300 placeholder:text-stone-400 hover:border-stone-400 focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-400/20 sm:min-h-12 sm:px-4 sm:py-3'

export const BTN =
  'inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full border-0 bg-gradient-to-b from-amber-200 via-amber-400 to-amber-500 px-5 py-2.5 text-[13px] font-bold tracking-wide text-emerald-950 shadow-lg shadow-amber-600/25 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-500/40 active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 sm:min-h-11 sm:px-7 sm:py-3 sm:text-sm'

export const BTN_OUTLINE =
  'inline-flex min-h-9 cursor-pointer items-center justify-center whitespace-nowrap rounded-full border border-emerald-900/25 bg-white px-4 py-2 text-[13px] font-semibold text-emerald-900 transition duration-300 hover:border-amber-500 hover:bg-amber-50 hover:text-emerald-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 sm:min-h-10 sm:px-5 sm:text-sm'

export function Field({ id, label, optional, as: Tag = 'input', className = '', children, ...props }) {
  return (
    <div className={`flex min-w-0 flex-col gap-1 sm:gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-xs font-bold tracking-wide text-stone-800 sm:text-[13px]">
        {label}
        {optional && <span className="font-normal text-stone-500"> (optional)</span>}
      </label>
      <Tag id={id} className={INPUT} {...props}>
        {children}
      </Tag>
    </div>
  )
}

const TONES = {
  green: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600/20',
  amber: 'bg-amber-50 text-amber-900 ring-1 ring-amber-500/30',
  stone: 'bg-stone-100 text-stone-600 ring-1 ring-stone-300/60',
}

export function Badge({ tone = 'stone', children }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider sm:px-3 sm:py-1 sm:text-[11px] ${TONES[tone]}`}>
      {children}
    </span>
  )
}

export function Notice({ tone = 'green', children }) {
  const style =
    tone === 'green'
      ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
      : 'border-amber-400 bg-amber-50 text-amber-900'
  return (
    <div role="status" className={`mb-4 rounded-xl border-l-4 px-4 py-3 text-[13px] font-medium leading-relaxed shadow-sm sm:mb-6 sm:px-5 sm:py-4 sm:text-sm ${style}`}>
      {children}
    </div>
  )
}

export function Empty({ children }) {
  return (
    <div className="rounded-2xl border border-dashed border-amber-400/50 bg-gradient-to-b from-white to-amber-50/40 px-5 py-9 text-center text-[13px] leading-relaxed text-stone-500 sm:px-6 sm:py-14 sm:text-sm">
      {children}
    </div>
  )
}

export function Card({ children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-emerald-950/10 bg-white p-4 shadow-[0_10px_40px_-18px_rgba(3,31,23,.25)] sm:p-7 ${className}`}>{children}</div>
  )
}

/* Dark hero band that opens every workspace page. */
export function PageHeader({ kicker, title, text, tag }) {
  return (
    <div className="relative overflow-hidden bg-[#031f17] text-white">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(70%_120%_at_88%_0%,rgba(251,191,36,.24),transparent_60%),radial-gradient(60%_90%_at_0%_100%,rgba(16,185,129,.25),transparent_70%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[.07] [background-image:linear-gradient(30deg,#fff_1px,transparent_1px),linear-gradient(150deg,#fff_1px,transparent_1px)] [background-size:44px_76px]"
      />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-300/80 to-transparent" />
      <div className={`${PAGE} relative pb-16 pt-7 sm:pb-32 sm:pt-20`}>
        <Reveal>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 text-[9.5px] font-bold uppercase tracking-[0.24em] text-amber-300 sm:gap-3 sm:text-[11px] sm:tracking-[0.32em]">
                <span className="h-px w-6 bg-amber-300/70 sm:w-10" aria-hidden="true" />
                {kicker}
              </span>
              <h1 className="mt-2 font-serif text-[1.75rem] font-semibold leading-[1.05] tracking-tight sm:mt-4 sm:text-6xl sm:leading-[1.02] lg:text-7xl">{title}</h1>
              <p className="mt-2.5 max-w-xl text-[13px] leading-5 text-emerald-100/75 sm:mt-5 sm:text-base sm:leading-8">{text}</p>
            </div>
            {tag && (
              <span className="self-start whitespace-nowrap rounded-full border border-amber-300/50 bg-amber-300/10 px-3.5 py-1.5 text-[9.5px] font-bold uppercase tracking-[0.2em] text-amber-300 backdrop-blur sm:px-5 sm:py-2 sm:text-[11px] sm:tracking-[0.25em]">
                {tag}
              </span>
            )}
          </div>
        </Reveal>
      </div>
    </div>
  )
}

/* Stat cards that overlap the header band. */
export function Stats({ children, cols = 'grid-cols-2 sm:grid-cols-3' }) {
  return <div className={`${PAGE} relative -mt-9 grid gap-2.5 sm:-mt-14 sm:gap-5 ${cols}`}>{children}</div>
}

export function Stat({ label, value, note, detail, accent, className = '', delay = 0, onClick }) {
  return (
    <Reveal delay={delay} className={className}>
      <div
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onClick={onClick}
        onKeyDown={onClick ? (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onClick() } } : undefined}
        className={`group relative h-full overflow-hidden rounded-xl border border-emerald-950/10 bg-white p-3 text-left shadow-[0_20px_50px_-20px_rgba(3,31,23,.35)] sm:rounded-2xl sm:p-6 ${onClick ? 'cursor-pointer transition duration-300 hover:-translate-y-1 hover:border-amber-400/60 hover:shadow-2xl focus-visible:outline-2 focus-visible:outline-emerald-800' : ''}`}
      >
        <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-amber-300 via-amber-500 to-amber-300" />
        <div className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-stone-500 sm:text-[11px] sm:tracking-[0.18em]">{label}</div>
        <div className={`mt-1.5 font-serif text-2xl font-semibold leading-none sm:mt-3 sm:text-5xl ${accent ? 'text-amber-600' : 'text-emerald-950'}`}>
          {value}
          {note && <span className="ml-1.5 font-sans text-[10px] font-medium tracking-normal text-stone-500 sm:ml-2 sm:text-xs">{note}</span>}
        </div>
        {detail && <div className="mt-1.5 text-[11px] font-semibold text-emerald-800 sm:mt-3 sm:text-xs">{detail}</div>}
      </div>
    </Reveal>
  )
}

export function BookingAnalytics({ bookings, columns, getKey, totalMode = 'trip' }) {
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [period, setPeriod] = useState('custom')
  const [sort, setSort] = useState('highest')
  const paymentTotal = (booking) => {
    if (!['Paid', 'Refund due', 'Refunded'].includes(booking.paymentStatus)) return 0
    const amount = Number(booking.amountBirr || 0)
    return Math.max(0, amount - (booking.paymentStatus === 'Paid' ? 0 : Number(booking.refundAmount || 0)))
  }
  const bookingValue = (booking) => totalMode === 'payments' ? paymentTotal(booking) : Number(booking.price || 0)
  const filteredBookings = bookings.filter((booking) => {
    if (fromDate && toDate && fromDate > toDate) return false
    const date = new Date((totalMode === 'payments' && booking.paidAt) || booking.createdAt || booking.journeyDate || 0)
    if (Number.isNaN(date.getTime())) return false
    const day = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
    return (!fromDate || day >= fromDate) && (!toDate || day <= toDate)
  }).sort((first, second) => (sort === 'highest' ? bookingValue(second) - bookingValue(first) : bookingValue(first) - bookingValue(second)))
  const totalValue = filteredBookings.reduce((total, booking) => total + bookingValue(booking), 0)
  const formatDate = (value, options = { month: 'short', day: 'numeric', year: 'numeric' }) => (
    value ? new Date(`${value}T00:00:00`).toLocaleDateString(undefined, options) : ''
  )
  const periodLabel = period === 'month'
    ? formatDate(fromDate, { month: 'long', year: 'numeric' })
    : period === 'week'
      ? `Week of ${formatDate(fromDate)} – ${formatDate(toDate)}`
      : period === 'year'
        ? fromDate.slice(0, 4)
        : period === 'all'
          ? 'All time'
          : `${fromDate ? formatDate(fromDate) : 'Any date'} – ${toDate ? formatDate(toDate) : 'Any date'}`
  const dailyTotals = new Map()
  if (totalMode === 'payments' && period === 'week') {
    filteredBookings.forEach((booking) => {
      const amount = paymentTotal(booking)
      if (!amount) return
      const paymentDate = new Date(booking.paidAt || booking.createdAt || booking.journeyDate)
      const day = [paymentDate.getFullYear(), String(paymentDate.getMonth() + 1).padStart(2, '0'), String(paymentDate.getDate()).padStart(2, '0')].join('-')
      dailyTotals.set(day, (dailyTotals.get(day) || 0) + amount)
    })
  }
  const rankedDays = [...dailyTotals.entries()].sort((first, second) => sort === 'highest' ? second[1] - first[1] : first[1] - second[1])
  const leadingDay = rankedDays[0]
  const selectClass = 'min-h-10 w-full min-w-0 rounded-xl border border-stone-300 bg-stone-50 px-2.5 text-sm outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-400/20 sm:min-h-11 sm:px-3'
  const labelClass = 'grid min-w-0 gap-1 text-xs font-bold text-stone-700 sm:gap-1.5 sm:text-[13px]'

  function exportReport(format) {
    const rows = filteredBookings.map((booking) => ({
      client: booking.name,
      email: booking.email || '',
      journey: booking.tour || booking.place || '',
      members: booking.members || 1,
      referral: booking.agentId ? `${booking.agentName || 'Agent'} · ${booking.agentCode || 'code unavailable'}` : 'Direct booking',
      date: booking.paidAt || booking.createdAt || booking.journeyDate || '',
      tripValue: Number(booking.price || 0),
      paymentStatus: booking.paymentStatus || '',
      paymentAmount: Number(booking.amountBirr || 0),
      refundAmount: Number(booking.refundAmount || 0),
      commission: Number(booking.commission || 0),
    }))

    if (format === 'xlsx') {
      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.json_to_sheet(rows)
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Report')
      XLSX.writeFile(workbook, `ttam-report-${Date.now()}.xlsx`)
      return
    }

    const doc = new jsPDF()
    doc.setProperties({ title: 'TTAM report', subject: 'Operational report' })
    doc.setFontSize(18)
    doc.text('TTAM Operational Report', 14, 18)
    doc.setFontSize(10)
    doc.text(`Period: ${periodLabel}`, 14, 28)
    doc.text(`Total: ${birr(totalValue)}`, 14, 34)
    autoTable(doc, {
      startY: 42,
      head: [['Client', 'Journey', 'Date', 'Trip value', 'Payment', 'Commission']],
      body: rows.map((row) => [
        row.client,
        row.journey,
        row.date ? new Date(`${row.date}T00:00:00`).toLocaleDateString() : '—',
        birr(row.tripValue),
        `${row.paymentStatus} · ${birr(row.paymentAmount)}`,
        birr(row.commission),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [3, 31, 23], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [250, 250, 249] },
    })
    doc.save(`ttam-report-${Date.now()}.pdf`)
  }

  function selectPeriod(value) {
    setPeriod(value)
    if (value === 'custom') return
    if (value === 'all') {
      setFromDate('')
      setToDate('')
      return
    }

    const today = new Date()
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const end = new Date(start)
    if (value === 'week') {
      const daysSinceMonday = (start.getDay() + 6) % 7
      start.setDate(start.getDate() - daysSinceMonday)
      end.setDate(start.getDate() + 6)
    } else if (value === 'month') {
      start.setDate(1)
      end.setMonth(start.getMonth() + 1, 0)
    } else if (value === 'year') {
      start.setMonth(0, 1)
      end.setMonth(11, 31)
    }
    const toDateValue = (date) => [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-')
    setFromDate(toDateValue(start))
    setToDate(toDateValue(end))
  }

  return (
    <div className="grid gap-3 sm:gap-4">
      <div className="grid grid-cols-2 gap-2.5 rounded-2xl border border-emerald-950/10 bg-white p-3.5 shadow-[0_10px_40px_-18px_rgba(3,31,23,.25)] sm:gap-3 sm:p-5 lg:grid-cols-3">
        {totalMode === 'payments' && (
          <label className={`${labelClass} col-span-2 lg:col-span-1`}>
            Quick period
            <select aria-label="Payment report period" className={selectClass} value={period} onChange={(event) => selectPeriod(event.target.value)}>
              <option value="custom">Custom dates</option>
              <option value="all">Any date</option>
              <option value="week">This week</option>
              <option value="month">This month</option>
              <option value="year">This year</option>
            </select>
          </label>
        )}
        <label className={labelClass}>From date<input aria-label="Bookings from date" className={selectClass} type="date" max={toDate || undefined} value={fromDate} onChange={(event) => { setPeriod('custom'); setFromDate(event.target.value) }} /></label>
        <label className={labelClass}>To date<input aria-label="Bookings to date" className={selectClass} type="date" min={fromDate || undefined} value={toDate} onChange={(event) => { setPeriod('custom'); setToDate(event.target.value) }} /></label>
        <label className={`${labelClass} col-span-2 lg:col-span-1`}>
          Sort clients
          <select className={selectClass} value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="highest">{totalMode === 'payments' ? 'Highest payment first' : 'Highest trip value first'}</option>
            <option value="lowest">{totalMode === 'payments' ? 'Lowest payment first' : 'Lowest trip value first'}</option>
          </select>
        </label>
        <div className="col-span-2 flex flex-col justify-center border-t border-amber-300/40 pt-3 sm:pt-4 lg:col-span-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500 sm:text-[11px] sm:tracking-[0.18em]">{totalMode === 'payments' ? 'Net recorded payments' : 'Total trip value'} · {periodLabel}</span>
          <strong className="mt-1 font-serif text-3xl font-semibold text-emerald-950 sm:mt-1.5 sm:text-4xl">{birr(totalValue)}</strong>
          <span className="text-xs text-stone-500">{filteredBookings.length} bookings</span>
          {totalMode === 'payments' && period === 'week' && (
            <span className="mt-2 text-[13px] font-semibold text-emerald-900 sm:text-sm">
              {leadingDay
                ? `${sort === 'highest' ? 'Highest' : 'Lowest'} payment day: ${formatDate(leadingDay[0], { weekday: 'long', month: 'long', day: 'numeric' })} · ${birr(leadingDay[1])}`
                : 'No recorded payments this week.'}
            </span>
          )}
        </div>
      </div>
      {filteredBookings.length ? (
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" className={BTN_OUTLINE} onClick={() => exportReport('xlsx')}>Export Excel</button>
          <button type="button" className={BTN_OUTLINE} onClick={() => exportReport('pdf')}>Export PDF</button>
        </div>
      ) : null}
      {filteredBookings.length ? <DataList columns={columns} rows={filteredBookings} getKey={getKey} /> : <Empty>No bookings in this period.</Empty>}
    </div>
  )
}

export function SupportChat({ currentUser, token }) {
  const [open, setOpen] = useState(false)
  const [contacts, setContacts] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [messages, setMessages] = useState([])
  const [loadedPeerId, setLoadedPeerId] = useState('')
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const currentUserId = currentUser?.id

  useEffect(() => {
    if (!token || !currentUserId) return
    let active = true
    apiRequest('/messages/contacts', { token })
      .then((rows) => {
        if (!active) return
        setContacts(rows)
        setError('')
        setSelectedId((current) => rows.some((contact) => String(contact.id) === current) ? current : String(rows[0]?.id || ''))
      })
      .catch((loadError) => { if (active) setError(`Could not load message contacts: ${loadError.message}`) })
    return () => { active = false }
  }, [token, currentUserId])

  useEffect(() => {
    if (!open || !selectedId || !token) return
    let active = true
    const loadMessages = () => apiRequest(`/messages/${selectedId}`, { token })
      .then((rows) => { if (active) { setMessages(rows); setLoadedPeerId(selectedId); setError('') } })
      .catch((loadError) => { if (active) setError(`Could not load messages: ${loadError.message}`) })
    loadMessages()
    const interval = window.setInterval(loadMessages, 5000)
    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [open, selectedId, token])

  const selected = contacts.find((contact) => String(contact.id) === selectedId)
  const visibleMessages = loadedPeerId === selectedId ? messages : []

  async function sendMessage(event) {
    event.preventDefault()
    const body = draft.trim()
    if (!body || !selectedId || sending) return
    setSending(true)
    setError('')
    try {
      const message = await apiRequest(`/messages/${selectedId}`, {
        token,
        method: 'POST',
        body: JSON.stringify({ body }),
      })
      setLoadedPeerId(selectedId)
      setMessages((current) => [...current, message])
      setDraft('')
    } catch (sendError) {
      setError(`Could not send message: ${sendError.message}`)
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Open messages"
        title="Messages"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 grid size-12 cursor-pointer place-items-center rounded-full border-0 bg-emerald-950 text-amber-200 shadow-xl shadow-emerald-950/30 transition hover:-translate-y-1 hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 sm:bottom-5 sm:right-5 sm:size-14"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-5 sm:size-6" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 4.5h6m-9.75 7.5 2.8-3.1a8.25 8.25 0 1 1 2.6 1.04L3.75 20.25Z" />
        </svg>
      </button>
      {open && (
        <Modal onClose={() => setOpen(false)} labelledBy="messages-title" size="max-w-4xl">
          <div className="p-4 sm:p-8">
            <div className="mb-3 pr-10 sm:mb-5">
              <p className="m-0 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700 sm:text-[11px] sm:tracking-[0.25em]">Workspace inbox</p>
              <h2 id="messages-title" className="mb-0 mt-1 font-serif text-2xl font-semibold text-emerald-950 sm:mt-2 sm:text-3xl">Messages</h2>
              <p className="mb-0 mt-1 text-xs text-stone-600 sm:mt-2 sm:text-sm">Owner ↔ manager · Manager ↔ agent</p>
            </div>
            {error && <p role="alert" className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-800 sm:mb-4 sm:px-4 sm:py-3 sm:text-sm">{error}</p>}
            <div className="grid gap-3 sm:gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
              <nav aria-label="Message contacts" className="max-h-40 overflow-y-auto rounded-2xl border border-stone-200 bg-stone-50 md:max-h-[460px]">
                {contacts.length ? contacts.map((contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => setSelectedId(String(contact.id))}
                    className={`flex w-full items-center justify-between gap-3 border-0 border-b border-stone-200 px-3.5 py-2.5 text-left text-[13px] last:border-0 sm:px-4 sm:py-3 sm:text-sm ${selectedId === String(contact.id) ? 'bg-emerald-950 text-amber-100' : 'bg-transparent text-stone-700 hover:bg-white'}`}
                  >
                    <span className="min-w-0 truncate font-semibold">{contact.name}</span>
                    <span className="text-[10px] uppercase tracking-wider opacity-70">{contact.role}</span>
                  </button>
                )) : <p className="m-0 p-4 text-sm text-stone-500">No eligible contacts are available yet.</p>}
              </nav>
              <div className="flex min-h-[300px] flex-col rounded-2xl border border-stone-200 bg-stone-50 p-2.5 sm:min-h-[460px] sm:p-3">
                <div className="border-b border-stone-200 px-2 pb-2.5 sm:pb-3">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">Conversation</span>
                  <strong className="text-sm text-emerald-950 sm:text-base">{selected?.name || 'Choose a contact'}</strong>
                </div>
                <div className="flex-1 space-y-2.5 overflow-y-auto py-3 sm:space-y-3 sm:py-4">
                  {visibleMessages.length ? visibleMessages.map((message) => {
                    const ownMessage = Number(message.senderId) === Number(currentUser?.id)
                    return (
                      <div key={message.id} className={`flex ${ownMessage ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[88%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed sm:max-w-[85%] sm:px-3.5 sm:py-2.5 sm:text-sm ${ownMessage ? 'bg-emerald-950 text-amber-100' : 'bg-white text-stone-700 shadow-sm'}`}>
                          <p className="m-0 whitespace-pre-wrap break-words">{message.body}</p>
                          <time className={`mt-1 block text-[10px] ${ownMessage ? 'text-amber-200/80' : 'text-stone-500'}`} dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleString()}</time>
                        </div>
                      </div>
                    )
                  }) : <p className="m-0 py-8 text-center text-[13px] text-stone-500 sm:text-sm">{selected ? 'No messages yet. Start the conversation.' : 'Select a contact to see messages.'}</p>}
                </div>
                <form onSubmit={sendMessage} className="flex gap-2 border-t border-stone-200 pt-2.5 sm:pt-3">
                  <input
                    aria-label="Message"
                    maxLength="2000"
                    className="min-h-10 min-w-0 flex-1 rounded-full border border-stone-300 bg-white px-4 text-base text-stone-900 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-400/20 sm:min-h-11 sm:text-sm"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder={selected ? `Message ${selected.name}...` : 'Choose a contact'}
                    disabled={!selected}
                  />
                  <button type="submit" className={`${BTN} px-5`} disabled={!selected || !draft.trim() || sending}>{sending ? 'Sending…' : 'Send'}</button>
                </form>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

export function Section({ title, text, action, children, className = '' }) {
  return (
    <Reveal className={`py-7 sm:py-14 ${className}`}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 sm:mb-7">
        <div className="min-w-0">
          <span className="mb-2 block h-0.5 w-9 bg-gradient-to-r from-amber-400 to-transparent sm:mb-3 sm:w-12" aria-hidden="true" />
          <h2 className="font-serif text-2xl font-semibold leading-tight text-emerald-950 sm:text-4xl">{title}</h2>
          {text && <p className="mt-1.5 max-w-2xl text-[13px] leading-6 text-stone-600 sm:mt-2 sm:text-sm sm:leading-7">{text}</p>}
        </div>
        {action}
      </div>
      {children}
    </Reveal>
  )
}

export function Tabs({ tabs, value, onChange, label }) {
  return (
    <nav className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0" aria-label={label}>
      <div className="flex w-max gap-1 rounded-full border border-emerald-950/10 bg-white p-1 shadow-[0_8px_30px_-12px_rgba(3,31,23,.3)] sm:gap-1.5 sm:p-1.5">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            aria-pressed={value === tab.key}
            onClick={() => onChange(tab.key)}
            className={`cursor-pointer whitespace-nowrap rounded-full border-0 px-3.5 py-2 text-[13px] font-semibold transition duration-300 sm:px-5 sm:py-2.5 sm:text-sm ${
              value === tab.key ? 'bg-emerald-950 text-amber-200 shadow-md' : 'bg-transparent text-stone-600 hover:bg-amber-50 hover:text-emerald-950'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  )
}

export function Perm({ checked, onChange, label }) {
  return (
    <label
      className={`inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold transition duration-300 sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs ${
        checked ? 'border-amber-500 bg-amber-50 text-emerald-950' : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
      }`}
    >
      <input type="checkbox" className="size-3.5 accent-emerald-800" checked={checked} onChange={onChange} />
      {label}
    </label>
  )
}

/* Table on tablets and desktops, stacked cards on phones. */
export function DataList({ columns, rows, getKey }) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-2xl border border-emerald-950/10 bg-white shadow-[0_10px_40px_-18px_rgba(3,31,23,.25)] md:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-[#031f17] text-[11px] uppercase tracking-[0.14em] text-amber-200/90">
            <tr>
              {columns.map((c) => (
                <th key={c.label} className="whitespace-nowrap px-4 py-4 font-bold">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200/80">
            {rows.map((row) => (
              <tr key={getKey(row)} className="transition duration-300 hover:bg-amber-50/70">
                {columns.map((c) => (
                  <td key={c.label} className="px-4 py-4 align-middle">{c.render(row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-2.5 md:hidden">
        {rows.map((row) => (
          <div key={getKey(row)} className="rounded-xl border border-emerald-950/10 bg-white p-3.5 shadow-[0_10px_30px_-16px_rgba(3,31,23,.3)]">
            <dl className="m-0 grid gap-2.5">
              {columns.map((c) => (
                <div key={c.label} className="flex items-start justify-between gap-3">
                  <dt className="shrink-0 pt-0.5 text-[10px] font-bold uppercase tracking-wider text-stone-500">{c.label}</dt>
                  <dd className="m-0 flex min-w-0 flex-col items-end text-right text-[13px] [&_.perm-wrap]:justify-end">{c.render(row)}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </>
  )
}

/* Dialog that floats centered; compact padding on phones. */
export function Modal({ onClose, labelledBy, size = 'max-w-md', children }) {
  const [shown, setShown] = useState(false)
  const closeRef = useRef(onClose)

  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(true))
    const onKey = (event) => event.key === 'Escape' && closeRef.current()
    window.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [])

  return createPortal(
    <div
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      className={`fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto overscroll-contain bg-[#031f17]/80 p-2 backdrop-blur-md transition duration-500 sm:p-4 ${
        shown ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={`relative my-auto max-h-[calc(100dvh-1rem)] w-full ${size} shrink-0 overflow-y-auto overscroll-contain rounded-2xl bg-white shadow-[0_40px_120px_-20px_rgba(0,0,0,.6)] ring-1 ring-amber-300/30 transition duration-500 ease-out sm:max-h-[calc(100dvh-2rem)] sm:rounded-3xl ${
          shown ? 'translate-y-0 scale-100' : 'translate-y-10 scale-[.98]'
        }`}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 grid size-9 cursor-pointer place-items-center rounded-full border-0 bg-stone-100 text-xl leading-none text-stone-600 transition hover:bg-amber-100 hover:text-emerald-950 sm:right-4 sm:top-4 sm:size-10"
        >
          ×
        </button>
        {children}
      </section>
    </div>,
    document.body,
  )
}
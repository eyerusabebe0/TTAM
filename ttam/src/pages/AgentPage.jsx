import { useEffect } from 'react'
import { birr } from '../utils/currency.js'
import { Badge, Card, DataList, Empty, PAGE, PageHeader, Section, Stat, Stats, SupportChat } from './UI.jsx'
import Reveal from './ScrollReveal.jsx'

function AgentPage({ agents = [], bookings = [], currentEmail = '', currentUser, token, notificationTarget }) {
  const agent = agents.find((item) => item.email.toLowerCase() === currentEmail.toLowerCase())
  const referrals = bookings.filter((booking) => booking.agentId === agent?.id)
  const canViewBookings = Boolean(agent?.permissions?.viewBookings)
  const paidCommission = Number(agent?.paidCommission ?? referrals
    .filter((booking) => booking.paymentStatus === 'Paid')
    .reduce((total, booking) => total + Number(booking.commission || 0), 0))

  useEffect(() => {
    if (notificationTarget?.section !== 'referrals') return
    const frame = requestAnimationFrame(() => {
      document.getElementById(notificationTarget.elementId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    return () => cancelAnimationFrame(frame)
  }, [notificationTarget])

  const bookingColumns = [
    { label: 'Client', render: (booking) => <span className="font-semibold text-emerald-950">{booking.name}</span> },
    { label: 'Journey', render: (booking) => booking.tour },
    { label: 'Members', render: (booking) => booking.members || 1 },
    { label: 'Value', render: (booking) => birr(booking.price) },
    { label: 'Commission (10%)', render: (booking) => booking.commission ? birr(booking.commission) : '—' },
    { label: 'Status', render: (booking) => <Badge tone={booking.status === 'Approved' ? 'green' : 'amber'}>{booking.status}</Badge> },
  ]

  function openReferrals() {
    document.getElementById('agent-referrals')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="bg-stone-50 pb-20">
      <PageHeader
        kicker="Your partner workspace"
        title={`Welcome, ${(agent?.name || 'agent').split(' ')[0]}.`}
        text="Track referred journeys, share your invitation code, and grow your local network."
        tag="AGENT WORKSPACE"
      />
      <Stats>
        <Stat label="Referred requests" value={referrals.length} note="bookings" onClick={canViewBookings ? openReferrals : undefined} />
        <Stat label="Net paid revenue" value={birr(agent?.revenue ?? referrals.reduce((total, booking) => total + Number(booking.price || 0), 0))} delay={100} onClick={canViewBookings ? openReferrals : undefined} />
        <Stat
          label="Commission (10%)"
          value={birr(agent?.commission ?? referrals.reduce((total, booking) => total + Number(booking.commission || 0), 0))}
          note="earned"
          detail={`Paid commission: ${birr(paidCommission)}`}
          delay={200}
          className="col-span-2 sm:col-span-1"
          onClick={canViewBookings ? openReferrals : undefined}
        />
      </Stats>

      <div className={`${PAGE} pt-8`}>
        <SupportChat currentUser={currentUser} token={token} />
        <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr]">
          <Section title="Your invitation code" text="Share this code with travelers so their requests are attributed to you.">
            <Card>
              {agent?.status === 'approved' && agent.code ? (
                <>
                  <Badge tone="green">Approved partner</Badge>
                  <p className="mb-2 mt-5 text-sm text-stone-500">Your referral code</p>
                  <p className="m-0 break-all rounded-xl bg-emerald-950 px-4 py-4 font-mono text-xl font-bold tracking-widest text-amber-300">{agent.code}</p>
                </>
              ) : (
                <>
                  <Badge tone="amber">Awaiting approval</Badge>
                  <p className="mb-0 mt-4 text-sm leading-relaxed text-stone-600">Your manager will issue a referral code after approving your agent account.</p>
                </>
              )}
            </Card>
          </Section>

        </div>

        {canViewBookings ? (
          <div id="agent-referrals" className="scroll-mt-24">
            <Section title="Your referred journeys" text="Requests made with your code appear here, with their latest status." action={<Badge tone="amber">{referrals.length} total</Badge>}>
              {referrals.length ? <DataList columns={bookingColumns} rows={referrals} getKey={(booking) => booking.id} /> : <Empty>No referrals yet. Your booking requests will appear here.</Empty>}
            </Section>
          </div>
        ) : (
          <Reveal>
            <div className="mt-8"><Empty>Your account does not currently have booking access.</Empty></div>
          </Reveal>
        )}
      </div>
    </div>
  )
}

export default AgentPage

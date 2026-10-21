import { useEffect, useState } from 'react'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import AuthDialog from './components/AuthDialog.jsx'
import AgentPage from './pages/AgentPage.jsx'
import ClientPage from './pages/ClientPage.jsx'
import ManagerPage from './pages/ManagerPage.jsx'
import OwnerPage from './pages/OwnerPage.jsx'
import { ApiError, apiRequest } from './api.js'
import { getEthiopianDate, isUpcomingJourney } from './utils/journeyDate.js'

const demoJourneyDate = (() => {
  const date = new Date()
  date.setDate(date.getDate() + 60)
  return date.toISOString().slice(0, 10)
})()

const starterTours = [
  { id: 1, name: 'The highlands, slowly', place: 'Lalibela, Ethiopia', days: '5 days · Small group', journeyDate: demoJourneyDate, price: 840, category: 'Culture', image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1200&q=85', description: 'Walk the ancient rock-hewn churches with a local guide, then watch the light settle over the highlands.' },
  { id: 2, name: 'Salt roads & open sky', place: 'Danakil Depression, Ethiopia', days: '4 days · Guided expedition', journeyDate: demoJourneyDate, price: 1260, category: 'Adventure', image: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=1200&q=85', description: 'Cross otherworldly salt flats and volcanic landscapes with an experienced Afar guide.' },
  { id: 3, name: 'A table by the lake', place: 'Bahir Dar, Ethiopia', days: '3 days · Food & nature', journeyDate: demoJourneyDate, price: 590, category: 'Slow travel', image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=85', description: 'Spend unhurried days on Lake Tana, visit island monasteries, and share a home-cooked dinner.' },
]

const permissionOptions = [
  { key: 'viewPayments', label: 'View client payments' },
  { key: 'viewBookings', label: 'View bookings' },
]

const managerPermissionOptions = [
  { key: 'approveAgents', label: 'Approve agents' },
  { key: 'approveBookings', label: 'Approve bookings & issue confirmations' },
  ...permissionOptions,
]

function App() {
  const [role, setRole] = useState('client')
  const [currentUser, setCurrentUser] = useState(null)
  const [sessionToken, setSessionToken] = useState(() => sessionStorage.getItem('ttam-access-token') || '')
  const [authMode, setAuthMode] = useState('')
  const [apiError, setApiError] = useState('')
  const [showJourneys, setShowJourneys] = useState(false)
  const [tours, setTours] = useState(starterTours)
  const [agents, setAgents] = useState([])
  const [team, setTeam] = useState([])
  const [bookings, setBookings] = useState([])
  const [notificationTarget, setNotificationTarget] = useState(null)
  const [today, setToday] = useState(getEthiopianDate)

  useEffect(() => {
    const interval = window.setInterval(() => setToday(getEthiopianDate()), 30_000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    let active = true
    apiRequest('/tours')
      .then((rows) => {
        if (!active) return
        setTours(rows.map((tour) => ({
        id: tour.id,
        name: tour.title,
        place: tour.destination,
        days: tour.duration,
        journeyDate: tour.date,
        startTime: tour.startTime || '09:00',
        price: Number(tour.price),
        category: tour.category,
        image: tour.image,
        description: tour.description,
        })))
      })
      .catch((error) => {
        if (active) setApiError(`Could not load the live journey catalog: ${error.message}`)
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!sessionToken) return
    let active = true
    apiRequest('/auth/me', { token: sessionToken })
      .then((user) => {
        if (active) enterWorkspace(user, user.role)
      })
      .catch((error) => {
        if (!active) return
        setApiError(`Your saved session could not be restored: ${error.message}`)
        if (error instanceof ApiError && error.status === 401) {
          sessionStorage.removeItem('ttam-access-token')
          setSessionToken('')
          setCurrentUser(null)
          setBookings([])
          setAgents([])
        }
      })
    return () => { active = false }
  }, [sessionToken])

  useEffect(() => {
    if (!sessionToken || !currentUser) return
    let active = true
    if (currentUser.role === 'agent') {
      apiRequest('/agents/me', { token: sessionToken })
        .then((agent) => { if (active) setAgents([mapAgent(agent)]) })
        .catch((error) => { if (active) setApiError(`Could not load your agent profile: ${error.message}`) })
      return () => { active = false }
    }
    if (currentUser.role === 'owner' || (currentUser.role === 'manager' && currentUser.permissions?.registerAgents)) {
      apiRequest('/agents', { token: sessionToken })
        .then((rows) => { if (active) setAgents(rows.map(mapAgent)) })
        .catch((error) => { if (active) setApiError(`Could not load agents: ${error.message}`) })
    }
    return () => { active = false }
  }, [sessionToken, currentUser])

  useEffect(() => {
    if (!sessionToken || !currentUser) return
    if (currentUser.role !== 'owner' && !(currentUser.role === 'manager' && currentUser.permissions?.registerManagers)) return
    let active = true
    apiRequest('/managers', { token: sessionToken })
      .then((rows) => { if (active) setTeam(rows.map(mapManager)) })
      .catch((error) => { if (active) setApiError(`Could not load managers: ${error.message}`) })
    return () => { active = false }
  }, [sessionToken, currentUser])

  useEffect(() => {
    if (!sessionToken || !currentUser) return
    let active = true
    if (currentUser.role === 'manager' && !currentUser.permissions?.viewBookings && !currentUser.permissions?.approveBookings) {
      return
    }
    if (currentUser.role === 'agent' && !currentUser.permissions?.viewBookings) {
      return
    }
    const bookingsPath = currentUser.role === 'client'
      ? '/bookings/mine'
      : currentUser.role === 'agent'
        ? '/bookings/agent'
        : '/bookings'
    const loadBookings = () => apiRequest(bookingsPath, { token: sessionToken })
      .then((rows) => { if (active) setBookings(rows.map(mapBooking)) })
      .catch((error) => { if (active) setApiError(`Could not load bookings: ${error.message}`) })
    loadBookings()
    const refreshInterval = window.setInterval(loadBookings, currentUser.role === 'client' ? 15_000 : 30_000)
    return () => {
      active = false
      window.clearInterval(refreshInterval)
    }
  }, [sessionToken, currentUser])

  useEffect(() => {
    const expire = () => {
      setBookings((current) => {
        const now = Date.now()
        return current.map((booking) => (
          booking.paymentStatus === 'Awaiting payment'
          && booking.expiresAt
          && new Date(booking.expiresAt).getTime() <= now
            ? { ...booking, status: 'Expired', paymentStatus: 'Expired' }
            : booking
        ))
      })
    }
    expire()
    const interval = window.setInterval(expire, 60_000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    const target = document.getElementById(window.location.hash.slice(1))
    target?.scrollIntoView()
  }, [showJourneys])

  function enterWorkspace(account, nextRole) {
    setBookings([])
    setAgents([])
    setNotificationTarget(null)
    setApiError('')
    const permissions = account.permissions || {}
    setCurrentUser({
      name: account.name,
      email: account.email,
      role: nextRole,
      permissions: { ...permissions, approveAgents: permissions.registerAgents ?? permissions.approveAgents ?? false },
      agentCode: account.referralCode || account.agentCode || '',
    })
    setRole(nextRole)
    setShowJourneys(false)
    setAuthMode('')
  }

  async function getClientSessionToken() {
    const token = sessionToken || sessionStorage.getItem('ttam-access-token')
    if (!token) {
      setAuthMode('login')
      return { error: 'Please log in to your client account before booking this journey.' }
    }

    if (currentUser?.role === 'client') return { token }
    if (currentUser) {
      return { error: 'Please log in to a client account before booking this journey.' }
    }

    try {
      const account = await apiRequest('/auth/me', { token })
      enterWorkspace(account, account.role)
      if (account.role !== 'client') {
        return { error: 'Please log in to a client account before booking this journey.' }
      }
      sessionStorage.setItem('ttam-access-token', token)
      setSessionToken(token)
      return { token }
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        sessionStorage.removeItem('ttam-access-token')
        setSessionToken('')
        setCurrentUser(null)
        setBookings([])
        setAgents([])
        setAuthMode('login')
      }
      return { error: `Could not restore your saved login: ${error.message}` }
    }
  }

  function login({ email, password }) {
    const normalizedEmail = email.toLowerCase()
    return apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email: normalizedEmail, password }) })
      .then((session) => {
        sessionStorage.setItem('ttam-access-token', session.accessToken)
        setSessionToken(session.accessToken)
        setApiError('')
        enterWorkspace(session.user, session.user.role)
        return ''
      })
      .catch((error) => error.message || 'Could not log in.')
  }

  function signup({ name, email, phone, agentCode = '', password, role: accountRole }) {
    return apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email: email.toLowerCase(), phone, code: agentCode || undefined, password, role: accountRole }),
    })
      .then((session) => {
        sessionStorage.setItem('ttam-access-token', session.accessToken)
        setSessionToken(session.accessToken)
        setApiError('')
        enterWorkspace(session.user, session.user.role)
        return ''
      })
      .catch((error) => error.message || 'Could not create your account.')
  }

  function registerSubAgent(name, email) {
    const exists = agents.some((agent) => agent.email.toLowerCase() === email.toLowerCase())
    if (!exists) setAgents((current) => [...current, { id: Date.now(), name, email, status: 'pending', code: '', permissions: { viewPayments: false, viewBookings: false }, leads: 0, revenue: 0 }])
  }

  function updateAgentCode(agentId, code) {
    const normalizedCode = code.trim()
    const duplicateCode = agents.some((agent) => agent.id !== agentId && agent.code.toLowerCase() === normalizedCode.toLowerCase())
    if (!/^[A-Za-z0-9-]{4,24}$/.test(normalizedCode) || duplicateCode) return 'Use a unique code with 4 to 24 letters, numbers, or hyphens.'
    if (sessionToken && ['owner', 'manager'].includes(currentUser?.role)) {
      return apiRequest(`/agents/${agentId}/code`, {
        token: sessionToken,
        method: 'PATCH',
        body: JSON.stringify({ code: normalizedCode }),
      })
        .then((agent) => {
          setAgents((current) => current.map((item) => item.id === agentId ? mapAgent(agent) : item))
          return ''
        })
        .catch((error) => error.message || 'Could not save the agent code.')
    }
    setAgents((current) => current.map((agent) => agent.id === agentId ? { ...agent, code: normalizedCode } : agent))
    return ''
  }

  function approveAgent(agentId, code) {
    const normalizedCode = code.trim()
    const duplicateCode = agents.some((agent) => agent.id !== agentId && agent.code.toLowerCase() === normalizedCode.toLowerCase())
    if (!/^[A-Za-z0-9-]{4,24}$/.test(normalizedCode) || duplicateCode) return 'Use a unique code with 4 to 24 letters, numbers, or hyphens.'
    if (sessionToken && ['owner', 'manager'].includes(currentUser?.role)) {
      return apiRequest(`/agents/${agentId}/code`, {
        token: sessionToken,
        method: 'PATCH',
        body: JSON.stringify({ code: normalizedCode }),
      })
        .then(() => apiRequest(`/agents/${agentId}/approve`, { token: sessionToken, method: 'PATCH' }))
        .then((agent) => {
          setAgents((current) => current.map((item) => item.id === agentId ? mapAgent(agent) : item))
          return ''
        })
        .catch((error) => error.message || 'Could not approve the agent.')
    }
    setAgents((current) => current.map((agent) => agent.id === agentId ? { ...agent, status: 'approved', code: normalizedCode } : agent))
    return ''
  }

  function toggleAgentPermission(agentId, permission) {
    const agent = agents.find((item) => item.id === agentId)
    if (sessionToken && currentUser?.role && agent) {
      apiRequest(`/agents/${agentId}/permissions`, {
        token: sessionToken,
        method: 'PATCH',
        body: JSON.stringify({ permission, enabled: !agent.permissions[permission] }),
      })
        .then((updated) => setAgents((current) => current.map((item) => item.id === agentId ? mapAgent(updated) : item)))
        .catch((error) => setApiError(`Could not update agent permissions: ${error.message}`))
      return
    }
    setAgents((current) => current.map((agent) => agent.id === agentId
      ? { ...agent, permissions: { ...agent.permissions, [permission]: !agent.permissions[permission] } }
      : agent))
  }

  async function setAgentActive(agentId, isActive) {
    if (!sessionToken) return 'Please log in again to update this agent.'
    try {
      const updated = await apiRequest(`/agents/${agentId}/${isActive ? 'activate' : 'deactivate'}`, {
        token: sessionToken,
        method: 'PATCH',
      })
      setAgents((current) => current.map((agent) => agent.id === agentId ? mapAgent(updated) : agent))
      return ''
    } catch (error) {
      return error.message || 'Could not update agent status.'
    }
  }

  function toggleTeamPermission(memberId, permission) {
    const member = team.find((item) => item.id === memberId)
    const apiPermission = permission === 'approveAgents' ? 'registerAgents' : permission
    if (!member || !sessionToken) return
    apiRequest(`/managers/${memberId}/permissions`, {
      token: sessionToken,
      method: 'PATCH',
      body: JSON.stringify({ permission: apiPermission, enabled: !member.permissions[permission] }),
    })
      .then((updated) => setTeam((current) => current.map((item) => item.id === memberId ? mapManager(updated) : item)))
      .catch((error) => setApiError(`Could not update manager permissions: ${error.message}`))
  }

  function approveManager(managerId) {
    apiRequest(`/managers/${managerId}/approve`, { token: sessionToken, method: 'PATCH' })
      .then((manager) => setTeam((current) => current.map((member) => member.id === managerId ? mapManager(manager) : member)))
      .catch((error) => setApiError(`Could not approve manager: ${error.message}`))
  }

  async function addManager(member) {
    try {
      const manager = await apiRequest('/managers', {
        token: sessionToken,
        method: 'POST',
        body: JSON.stringify({
          name: member.name,
          email: member.email,
          password: member.password,
          permissions: {
            registerAgents: member.permissions.approveAgents,
            approveBookings: member.permissions.approveBookings,
            viewPayments: member.permissions.viewPayments,
            viewBookings: member.permissions.viewBookings,
          },
        }),
      })
      setTeam((current) => [mapManager(manager), ...current])
      return ''
    } catch (error) {
      return error.message || 'Could not register manager.'
    }
  }

  function updateBooking(bookingId, changes) {
    if (sessionToken && ['manager', 'owner'].includes(currentUser?.role)) {
      const endpoint = changes.status ? 'approve' : changes.paymentStatus === 'Refunded' ? 'refund' : ''
      if (!endpoint) return
      apiRequest(`/bookings/${bookingId}/${endpoint}`, { token: sessionToken, method: 'PATCH' })
        .then((updated) => setBookings((current) => current.map((booking) => booking.id === bookingId ? mapBooking(updated) : booking)))
        .catch((error) => setApiError(`Could not update the booking: ${error.message}`))
      return
    }
    setBookings((current) => current.map((booking) => booking.id === bookingId ? { ...booking, ...changes } : booking))
  }

  async function approveBooking(bookingId, approval) {
    if (!sessionToken || !['manager', 'owner'].includes(currentUser?.role)) {
      return 'Please log in with booking approval access.'
    }
    try {
      const updated = mapBooking(await apiRequest(`/bookings/${bookingId}/approve`, {
        token: sessionToken,
        method: 'PATCH',
        body: JSON.stringify(approval),
      }))
      setBookings((current) => current.map((booking) => booking.id === bookingId ? updated : booking))
      return ''
    } catch (error) {
      return error.message || 'Could not approve this booking.'
    }
  }

  async function saveTour(tour, method, id) {
    if (!sessionToken || currentUser?.role !== 'owner') return 'Please log in as the owner to manage journeys.'
    try {
      const result = await apiRequest(id ? `/tours/${id}` : '/tours', {
        token: sessionToken,
        method,
        body: JSON.stringify({
          title: tour.name,
          destination: tour.place,
          duration: tour.days,
          category: tour.category,
          price: Number(tour.price),
          image: tour.image,
          description: tour.description,
          date: tour.journeyDate,
          startTime: tour.startTime,
        }),
      })
      const mapped = {
        id: result.id,
        name: result.title,
        place: result.destination,
        days: result.duration,
        journeyDate: result.date,
        startTime: result.startTime,
        price: Number(result.price),
        category: result.category,
        image: result.image,
        description: result.description,
      }
      setTours((current) => id
        ? current.map((item) => item.id === id ? mapped : item)
        : [mapped, ...current])
      return ''
    } catch (error) {
      return error.message || 'Could not save the journey.'
    }
  }

  async function deleteTour(tourId) {
    if (!sessionToken || currentUser?.role !== 'owner') return 'Please log in as the owner to manage journeys.'
    try {
      await apiRequest(`/tours/${tourId}`, { token: sessionToken, method: 'DELETE' })
      setTours((current) => current.filter((item) => item.id !== tourId))
      return ''
    } catch (error) {
      return error.message || 'Could not delete the journey.'
    }
  }

  async function addBooking(booking) {
    const session = await getClientSessionToken()
    if (session.error) return session.error

    try {
      const result = mapBooking(await apiRequest('/bookings', {
        token: session.token,
        method: 'POST',
        body: JSON.stringify({
          tourId: booking.tourId,
          partySize: booking.members,
          name: booking.name,
          email: booking.email,
          agentCode: booking.agentCode || undefined,
        }),
      }))
      setBookings((current) => [result, ...current])
      return result
    } catch (error) {
      return error.message || 'Could not create your booking.'
    }
  }

  async function recordPayment(bookingId, payment) {
    const session = await getClientSessionToken()
    if (session.error) return session.error

    try {
      const updated = mapBooking(await apiRequest(`/bookings/${bookingId}/payment`, {
        token: session.token,
        method: 'POST',
        body: JSON.stringify(payment),
      }))
      setBookings((current) => current.map((booking) => booking.id === bookingId ? updated : booking))
      return ''
    } catch (error) {
      return error.message || 'Could not record the payment.'
    }
  }

  async function cancelBooking(bookingId) {
    const session = await getClientSessionToken()
    if (session.error) return session.error

    try {
      const updated = mapBooking(await apiRequest(`/bookings/${bookingId}/cancel`, { token: session.token, method: 'POST' }))
      setBookings((current) => current.map((booking) => booking.id === bookingId ? updated : booking))
      return ''
    } catch (error) {
      return error.message || 'Could not cancel this booking.'
    }
  }

  const visibleTours = tours.filter((tour) => isUpcomingJourney(tour.journeyDate, today))
  const visibleBookings = bookings.filter((booking) => isUpcomingJourney(booking.journeyDate, today))
  const notifications = currentUser?.role === 'client'
    ? visibleBookings
      .filter((booking) => booking.status === 'Approved')
      .map((booking) => ({
        id: `booking-approved-${booking.id}`,
        title: 'Trip confirmed',
        message: `${booking.place || booking.tour} · ${booking.tripCode || booking.reference}`,
        section: 'client-bookings',
        elementId: `client-booking-${booking.id}`,
      }))
    : currentUser?.role === 'manager'
      ? [
          ...(currentUser.permissions?.approveBookings ? visibleBookings
            .filter((booking) => booking.status === 'New request')
            .map((booking) => ({
              id: `booking-review-${booking.id}`,
              title: 'Client request needs review',
              message: `${booking.name} · ${booking.place || booking.tour}`,
              section: 'bookings',
              elementId: 'manager-client-requests',
            })) : []),
          ...(currentUser.permissions?.approveAgents ? agents
            .filter((agent) => agent.status === 'pending' && agent.isActive !== false)
            .map((agent) => ({
              id: `agent-application-${agent.id}`,
              title: 'Agent application',
              message: `${agent.name} is waiting for approval`,
              section: 'agents',
              elementId: 'manager-agent-applications',
            })) : []),
        ]
      : currentUser?.role === 'owner'
        ? [
            ...team
              .filter((member) => member.status !== 'approved')
              .map((member) => ({
                id: `manager-approval-${member.id}`,
                title: 'Manager approval',
                message: `${member.name} is waiting for approval`,
                section: 'team',
                elementId: 'manager-approvals',
              })),
            ...agents
              .filter((agent) => agent.status === 'pending' && agent.isActive !== false)
              .map((agent) => ({
                id: `agent-application-${agent.id}`,
                title: 'Agent application',
                message: `${agent.name} is waiting for approval`,
                section: 'team',
                elementId: 'registered-agents',
              })),
            ...visibleBookings
              .filter((booking) => booking.status === 'New request')
              .map((booking) => ({
                id: `booking-review-${booking.id}`,
                title: 'Client request',
                message: `${booking.name} · ${booking.place || booking.tour}`,
                section: 'bookings',
                elementId: 'owner-bookings',
              })),
          ]
        : currentUser?.role === 'agent'
          ? visibleBookings
            .filter((booking) => booking.status === 'New request')
            .map((booking) => ({
              id: `agent-referral-${booking.id}`,
              title: 'New referred request',
              message: `${booking.name} · ${booking.place || booking.tour}`,
              section: 'referrals',
              elementId: 'agent-referrals',
            }))
          : []
  function openNotification(notification) {
    setShowJourneys(false)
    setNotificationTarget((current) => ({ ...notification, nonce: (current?.nonce || 0) + 1 }))
  }
  const shared = { tours: visibleTours, agents, team, bookings: visibleBookings, permissionOptions, managerPermissionOptions }
  const workspacePage = showJourneys ? 'browse' : currentUser?.role || role

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 font-sans text-stone-900 antialiased">
      <Header
        key={`${currentUser?.role || role}:${currentUser?.email || ''}`}
        currentUser={currentUser}
        onLogin={() => setAuthMode('login')}
        onSignup={() => setAuthMode('signup')}
        onLogout={() => { sessionStorage.removeItem('ttam-access-token'); setSessionToken(''); setCurrentUser(null); setBookings([]); setAgents([]); setNotificationTarget(null); setRole('client'); setShowJourneys(false) }}
        onBrowse={() => setShowJourneys(true)}
        onDashboard={() => setShowJourneys(false)}
        notifications={notifications}
        onNotificationClick={openNotification}
      />
      <main className="flex-1 overflow-x-clip" id="dashboard">
        <div key={workspacePage} className="workspace-enter">
          {apiError && <div className="mx-auto max-w-[1240px] px-4 pt-4 text-sm text-red-800" role="alert">{apiError}</div>}
          {(role === 'client' || showJourneys) && <ClientPage {...shared} notificationTarget={notificationTarget} view={currentUser?.role === 'client' && !showJourneys ? 'dashboard' : 'browse'} signedIn={currentUser?.role === 'client'} currentUser={currentUser?.role === 'client' ? currentUser : null} onSignIn={() => setAuthMode('login')} onDashboard={() => setShowJourneys(false)} onBooking={addBooking} onPayment={recordPayment} onCancelBooking={cancelBooking} />}
          {!showJourneys && role === 'agent' && <AgentPage {...shared} notificationTarget={notificationTarget} currentEmail={currentUser?.email ?? ''} onRegisterSubAgent={registerSubAgent} />}
          {!showJourneys && role === 'manager' && <ManagerPage {...shared} notificationTarget={notificationTarget} currentPermissions={currentUser?.permissions} onApprove={approveAgent} onAgentCodeChange={updateAgentCode} onPermissionChange={toggleAgentPermission} onAgentActiveChange={setAgentActive} onBookingUpdate={updateBooking} onBookingApprove={approveBooking} />}
          {!showJourneys && role === 'owner' && <OwnerPage {...shared} notificationTarget={notificationTarget} onAddTour={(tour) => saveTour(tour, 'POST')} onUpdateTour={(tour) => saveTour(tour, 'PATCH', tour.id)} onDeleteTour={deleteTour} onAddManager={addManager} onApproveManager={approveManager} onManagerPermissionChange={toggleTeamPermission} onBookingUpdate={updateBooking} />}
        </div>
      </main>
      {authMode && <AuthDialog key={authMode} initialMode={authMode} onClose={() => setAuthMode('')} onLogin={login} onSignup={signup} />}
      <Footer />
    </div>
  )
}

export default App

function mapBooking(booking) {
  return {
    ...booking,
    price: Number(booking.price),
    pricePerPerson: Number(booking.pricePerPerson || 0),
    members: Number(booking.partySize || booking.members || 1),
    commission: Number(booking.commission || 0),
    amountBirr: Number(booking.amountBirr || 0),
    cancellationFee: Number(booking.cancellationFee || 0),
    refundAmount: Number(booking.refundAmount || 0),
    agentCancellationShareBirr: Number(booking.agentCancellationShareBirr || 0),
    agentCode: booking.agentCode || '',
  }
}

function mapAgent(agent) {
  return {
    ...agent,
    id: agent.id,
    status: agent.status,
    isActive: agent.isActive !== false,
    code: agent.code || '',
    permissions: agent.permissions || {},
    leads: Number(agent.leads || 0),
    revenue: Number(agent.revenue || 0),
  }
}

function mapManager(manager) {
  const permissions = manager.permissions || {}
  return {
    ...manager,
    permissions: { ...permissions, approveAgents: permissions.registerAgents ?? false },
  }
}
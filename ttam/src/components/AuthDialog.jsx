import { useState } from 'react'
import { Field, Modal, BTN } from '../pages/UI.jsx'

const SIDE_IMAGE =
  'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1000&q=80'

const ROLES = [
  { key: 'client', title: 'Client', text: 'Request and track trips' },
  { key: 'agent', title: 'Agent', text: 'Refer clients, earn 10%' },
]

function AuthDialog({ initialMode, onClose, onLogin, onSignup }) {
  const [mode, setMode] = useState(initialMode)
  const [signupRole, setSignupRole] = useState('client')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [agentCode, setAgentCode] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setError('')
    try {
      const result = await (mode === 'login'
        ? onLogin({ email: email.trim(), password })
        : onSignup({ name: name.trim(), email: email.trim(), phone: phone.trim(), agentCode: agentCode.trim(), password, role: signupRole }))
      if (result) setError(result)
    } catch (submitError) {
      setError(submitError.message || 'Could not complete your request.')
    }
  }

  function switchMode(next) {
    setMode(next)
    setError('')
  }

  return (
    <Modal onClose={onClose} labelledBy="auth-title" size="max-w-[940px]">
      <div className="grid md:grid-cols-[0.85fr_1.15fr]">
        <aside className="relative hidden min-h-[620px] overflow-hidden bg-emerald-950 text-white md:block">
          <img src={SIDE_IMAGE} alt="" className="absolute inset-0 size-full object-cover opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#031f17] via-[#031f17]/60 to-[#031f17]/5" />
          <div aria-hidden="true" className="absolute inset-3 rounded-2xl border border-amber-300/30" />
          <div className="relative flex h-full flex-col justify-end p-10">
            <span className="mb-5 h-px w-14 bg-gradient-to-r from-amber-300 to-transparent" aria-hidden="true" />
            <p className="font-serif text-4xl font-semibold leading-[1.1]">Ethiopia, arranged by people who live there.</p>
            <p className="mt-4 text-sm leading-7 text-emerald-100/80">
              Create an account to request journeys, follow their progress and hear back from a real person.
            </p>
          </div>
        </aside>

        <div className="p-6 pt-9 sm:p-11">
          <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-amber-600">Ask Tour and Travel account</span>
          <h2 id="auth-title" className="mb-6 mr-10 mt-3 font-serif text-4xl font-semibold leading-tight text-emerald-950">
            {mode === 'login' ? 'Welcome back.' : 'Start with the right account.'}
          </h2>

          <div className="grid grid-cols-2 rounded-full border border-stone-200 bg-stone-100 p-1" role="tablist" aria-label="Account access">
            {[['login', 'Log in'], ['signup', 'Sign up']].map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={mode === key}
                onClick={() => switchMode(key)}
                className={`min-h-11 cursor-pointer rounded-full border-0 text-sm font-semibold transition duration-300 ${mode === key ? 'bg-emerald-950 text-amber-200 shadow-md' : 'bg-transparent text-stone-500 hover:text-stone-800'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {mode === 'signup' && (
            <div className="mt-5 grid grid-cols-2 gap-3" role="radiogroup" aria-label="Choose an account type">
              {ROLES.map((role) => (
                <button
                  key={role.key}
                  type="button"
                  role="radio"
                  aria-checked={signupRole === role.key}
                  onClick={() => setSignupRole(role.key)}
                  className={`cursor-pointer rounded-2xl border bg-white p-4 text-left transition duration-300 ${
                    signupRole === role.key ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-400/30' : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <span className="block text-sm font-bold text-emerald-950">{role.title}</span>
                  <span className="mt-0.5 block text-xs text-stone-500">{role.text}</span>
                </button>
              ))}
            </div>
          )}

          <form className="mt-6 grid gap-4" onSubmit={submit}>
            {mode === 'signup' && (
              <Field id="auth-name" label="Full name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required />
            )}
            <Field id="auth-email" label="Email address" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            {mode === 'signup' && (
              <>
                <Field id="auth-phone" label="Phone number" type="tel" autoComplete="tel" inputMode="tel" pattern="[+]?[0-9(). -]{7,20}" title="Enter a phone number with 7 to 20 digits or common phone symbols." value={phone} onChange={(event) => setPhone(event.target.value)} required />
                {signupRole === 'client' && (
                  <Field id="auth-agent-code" label="Agent code" optional autoComplete="off" value={agentCode} onChange={(event) => setAgentCode(event.target.value)} placeholder="Enter a code if an agent referred you" />
                )}
              </>
            )}
            <div className="relative">
              <Field
                id="auth-password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                minLength={mode === 'signup' ? 8 : undefined}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute bottom-3 right-3 cursor-pointer rounded-md border-0 bg-transparent px-2 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800 hover:text-amber-600"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            {error && (
              <div className="rounded-xl border-l-4 border-amber-400 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900" role="alert">
                {error}
              </div>
            )}

            <button className={`${BTN} w-full py-4 text-base`} type="submit">
              {mode === 'login' ? 'Log in' : signupRole === 'agent' ? 'Apply as an agent' : 'Create client account'}
            </button>
          </form>
        </div>
      </div>
    </Modal>
  )
}

export default AuthDialog
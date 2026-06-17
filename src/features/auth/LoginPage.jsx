import { useState } from 'react'
import { ArrowRight, Blocks, KeyRound, Mail, ShieldCheck } from 'lucide-react'
import { login, loginWithGoogle } from './api'
import { env } from '../../shared/config/env'
import { setAuthCookies } from '../../shared/utils/authCookies'

const googleIdentityScriptUrl = 'https://accounts.google.com/gsi/client'
const googleOAuthScope = 'profile email'

function loadGoogleIdentityScript() {
  if (window.google?.accounts?.oauth2) {
    return Promise.resolve()
  }

  const existingScript = document.querySelector(`script[src="${googleIdentityScriptUrl}"]`)
  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener('load', resolve, { once: true })
      existingScript.addEventListener('error', reject, { once: true })
    })
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = googleIdentityScriptUrl
    script.async = true
    script.defer = true
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

export function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateField = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const tokens = await login({
        email: form.email,
        password: form.password,
      })

      setAuthCookies(tokens)
      window.location.href = '/getlist'
    } catch (err) {
      setError(err.message || 'Login failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError('')
    setIsGoogleSubmitting(true)

    if (!env.googleClientId) {
      setError('Missing Google client id.')
      setIsGoogleSubmitting(false)
      return
    }

    try {
      await loadGoogleIdentityScript()

      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: env.googleClientId,
        scope: googleOAuthScope,
        callback: async (response) => {
          if (response.error || !response.access_token) {
            setError(response.error_description || response.error || 'Google login failed.')
            setIsGoogleSubmitting(false)
            return
          }

          try {
            const tokens = await loginWithGoogle(response.access_token)

            setAuthCookies(tokens)
            window.location.href = '/getlist'
          } catch (err) {
            window.location.href = '/login'
            setError(err.message || 'Google login failed.')
          } finally {
            setIsGoogleSubmitting(false)
          }
        },
        error_callback: () => {
          setError('Google login was cancelled or failed.')
          setIsGoogleSubmitting(false)
        },
      })

      tokenClient.requestAccessToken({ prompt: 'select_account' })
    } catch {
      setError('Could not open Google login.')
      setIsGoogleSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-shell">
        <div className="auth-copy">
          <a className="auth-brand" href="/">
            <span className="auth-brand-mark">
              <Blocks size={18} />
            </span>
            <span>Builder Thinking</span>
          </a>
          <h1>Sign in to your builder workspace.</h1>
          <p>Open your saved pages, continue editing designs, and keep your work organized in one place.</p>
          <div className="auth-security-note">
            <ShieldCheck size={18} />
            <span>Your workspace stays synced while you design.</span>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div>
            <h2>Login</h2>
            <p>Sign in to continue building your pages.</p>
          </div>

          <label className="auth-field">
            <span>Email</span>
            <div className="auth-input-shell">
              <Mail size={17} />
              <input
                autoComplete="email"
                name="email"
                onChange={updateField}
                placeholder="user@example.com"
                required
                type="email"
                value={form.email}
              />
            </div>
          </label>

          <label className="auth-field">
            <span>Password</span>
            <div className="auth-input-shell">
              <KeyRound size={17} />
              <input
                autoComplete="current-password"
                name="password"
                onChange={updateField}
                placeholder="secret123"
                required
                type="password"
                value={form.password}
              />
            </div>
          </label>

          {error ? <p className="auth-error">{error}</p> : null}

          <button className="auth-submit" disabled={isSubmitting || isGoogleSubmitting} type="submit">
            {isSubmitting ? 'Signing in' : 'Sign in'}
            <ArrowRight size={17} />
          </button>

          <button
            className="auth-google"
            disabled={isSubmitting || isGoogleSubmitting}
            onClick={handleGoogleLogin}
            type="button"
          >
            <span className="auth-google-mark">G</span>
            {isGoogleSubmitting ? 'Opening Google' : 'Continue with Google'}
          </button>
        </form>
      </section>
    </main>
  )
}

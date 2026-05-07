'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { BgDecoration, Footer, GlassBtn, GoogleIcon, SparkleIcon, ArrowRightIcon, GlobeIcon, UserIcon, LogoutIcon } from '../components/ui'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark')

    async function getUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    getUser()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleLogin() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'https://www.googleapis.com/auth/youtube.readonly',
        queryParams: { prompt: 'consent', access_type: 'offline' },
      },
    })
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    document.cookie.split(';').forEach(cookie => {
      const name = cookie.split('=')[0].trim()
      if (name.startsWith('sb-')) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
      }
    })
    setUser(null)
    setDropdownOpen(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <BgDecoration />

      {/* ── HEADER ── */}
      <header style={{ border: 'none', background: 'transparent', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1320, margin: '0 auto', width: '100%', padding: '0 clamp(20px, 4vw, 60px)', height: '62px' }}>
          <Link href="/">
            <img
              src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' rx='5' fill='%23c0392b'/%3E%3Cpolygon points='9,6 9,18 19,12' fill='white'/%3E%3C/svg%3E"
              alt="URTube logo"
              style={{ width: 30, height: 30, objectFit: 'contain', borderRadius: 4 }}
            />
          </Link>

          {!loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {!user ? (
                <GlassBtn onClick={handleLogin} title="Sign in with Google" style={{ padding: '0 10px', minWidth: 36, justifyContent: 'center' }}>
                  <GoogleIcon size={16} />
                </GlassBtn>
              ) : (
                <div style={{ position: 'relative' }} ref={dropRef}>
                  <button
                    onClick={() => setDropdownOpen(o => !o)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '0 14px', height: 36, borderRadius: 10,
                      border: '1px solid var(--border2)',
                      background: dropdownOpen ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.22)',
                      backdropFilter: 'blur(12px)',
                      color: 'var(--text)', cursor: 'pointer',
                      fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: '13.5px',
                      transition: 'all 0.18s ease',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.5)',
                    }}>
                    {user.user_metadata?.picture ? (
                      <img src={user.user_metadata.picture} alt="" style={{ width: 22, height: 22, borderRadius: '50%' }} />
                    ) : (
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>
                        {user.user_metadata?.full_name?.[0] || 'U'}
                      </div>
                    )}
                    {user.user_metadata?.full_name?.split(' ')[0] || 'Account'}
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
                      style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {dropdownOpen && (
                    <div className="user-dropdown" style={{
                      position: 'absolute', top: 'calc(100% + 8px)', right: 0, minWidth: 190,
                      background: 'var(--bg2)', border: '1px solid var(--border2)',
                      borderRadius: 14, padding: '6px', boxShadow: 'var(--shadow-lg)', zIndex: 100,
                    }}>
                      {[
                        { icon: <GlobeIcon />, label: 'Public Mode', href: '/publicmode' },
                        { icon: <UserIcon />, label: 'My Channel', href: '/dashboard' },
                      ].map(({ icon, label, href }) => (
                        <Link key={label} href={href} onClick={() => setDropdownOpen(false)} style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          width: '100%', padding: '10px 12px', borderRadius: 9,
                          background: 'transparent', color: 'var(--text)',
                          textDecoration: 'none', fontSize: '14px', fontWeight: 500,
                          transition: 'background 0.14s',
                        }}>
                          <span style={{ color: 'var(--muted)' }}>{icon}</span>
                          {label}
                        </Link>
                      ))}
                      <button onClick={handleLogout} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        width: '100%', padding: '10px 12px', borderRadius: 9,
                        border: 'none', background: 'transparent',
                        color: 'var(--accent)', cursor: 'pointer',
                        fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 500,
                        textAlign: 'left', transition: 'background 0.14s',
                      }}>
                        <span style={{ color: 'var(--accent)' }}><LogoutIcon /></span>
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* ── MAIN ── */}
      <main style={{ flex: 1, maxWidth: 1320, margin: '0 auto', width: '100%', padding: '0 clamp(20px, 4vw, 60px)', position: 'relative', zIndex: 1 }}>

        {/* HERO */}
        <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: '96px' }}>
          <div className="anim-fade-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--glass-badge-bg)', backdropFilter: 'blur(10px)', border: '1px solid var(--glass-badge-border)', boxShadow: '0 2px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.08)', color: 'var(--text)', borderRadius: 100, padding: '6px 16px', fontSize: '12px', fontWeight: 600, marginBottom: 28, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            <SparkleIcon /> AI-powered YouTube analytics
          </div>

          <h1 className="anim-fade-up hero-h1" style={{ animationDelay: '60ms', fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '64px', lineHeight: 1.08, letterSpacing: '-2px', color: 'var(--text)', maxWidth: 900 }}>
            AI-powered YouTube analytics<br />
            <span style={{ color: 'var(--accent)' }}>for creators</span>
          </h1>

          <p className="anim-fade-up hero-p" style={{ animationDelay: '120ms', color: 'var(--muted)', fontSize: '18px', lineHeight: 1.75, maxWidth: 640, marginTop: 20, marginBottom: 48 }}>
            Analyze your channel&apos;s performance with sentiment analysis, topic clustering, and GPT-powered recommendations.
          </p>

          <div className="anim-fade-up" style={{ animationDelay: '180ms' }}>
            <Link href="/publicmode" style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '18px 36px', borderRadius: 14,
              background: 'var(--accent)', border: 'none', textDecoration: 'none',
              color: '#fff', fontFamily: 'var(--font-body)',
              fontWeight: 700, fontSize: '16px', cursor: 'pointer',
              boxShadow: '0 4px 24px rgba(192,57,43,0.4)',
              transition: 'all 0.18s ease',
            }}>
              Explore Public Research Mode <ArrowRightIcon />
            </Link>
          </div>
        </section>

        {/* FEATURES */}
        <section style={{ marginTop: 110 }}>
          <div className="anim-fade-up" style={{ animationDelay: '260ms', textAlign: 'center', marginBottom: 44 }}>
            <div style={{ color: 'var(--muted)', fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>What URTube gives you</div>
            <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '32px', letterSpacing: '-0.5px', color: 'var(--text)' }}>Everything you need to grow</h2>
          </div>
          <div style={{ display: 'flex', gap: '16px' }} className="features-flex">
            {[
              { icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>, title: 'Sentiment Analysis', desc: "We analyze up to 100 comments per video using VADER NLP to score audience tone. See exactly what percentage of your viewers are positive, neutral, or negative — per video and across your channel.", delay: 300 },
              { icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="5" r="3" /><circle cx="19" cy="19" r="3" /><circle cx="5" cy="19" r="3" /><line x1="12" y1="8" x2="5" y2="16" /><line x1="12" y1="8" x2="19" y2="16" /></svg>, title: 'Topic Clustering', desc: "Our AI reads your video titles, generates embeddings, and groups your content into topics automatically. Instantly see which topics get the most views and engagement — no manual tagging.", delay: 360 },
              { icon: <SparkleIcon />, title: 'AI Recommendations', desc: "GPT-4o analyzes your best and worst performing topics, then generates 5 specific video ideas tailored to your audience. Plus per-video insights: what worked, what to improve, and what to make next.", delay: 420 },
            ].map(({ icon, title, desc, delay }) => (
              <div key={title} className="anim-fade-up feat-card" style={{ animationDelay: `${delay}ms`, flex: 1, padding: '28px 26px 26px', borderRadius: '16px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', backdropFilter: 'blur(12px)', boxShadow: 'var(--glass-shadow)', cursor: 'default' }}>
                <div style={{ width: 44, height: 44, borderRadius: 11, marginBottom: 18, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>{icon}</div>
                <div style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: '16px', marginBottom: 9, color: 'var(--text)' }}>{title}</div>
                <div style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.7 }}>{desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section style={{ marginTop: 88 }}>
          <div className="anim-fade-up" style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ color: 'var(--muted)', fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Simple setup</div>
            <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '32px', letterSpacing: '-0.5px', color: 'var(--text)' }}>How it works</h2>
          </div>
          <div style={{ display: 'flex', gap: 0, alignItems: 'stretch' }} className="steps-flex">
            {[
              { num: 1, title: 'Connect your channel', desc: "One-click Google login. We only need read access to your public video data." },
              { num: 2, title: 'We analyze everything', desc: "30 videos, 3000 comments, sentiment scores, topic clusters — all in under 60 seconds." },
              { num: 3, title: 'You get insights', desc: "Per-video AI analysis + 5 content ideas tailored to your channel's strengths." },
            ].map(({ num, title, desc }, i) => (
              <div key={num} style={{ display: 'contents' }}>
                <div className="anim-fade-up step-card" style={{ animationDelay: `${340 + i * 60}ms`, flex: 1, padding: '32px 28px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--bg2)', boxShadow: 'var(--shadow-sm)', cursor: 'default', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, marginBottom: 18, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: '17px', color: '#fff' }}>{num}</div>
                  <div style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: '17px', marginBottom: 10, color: 'var(--text)' }}>{title}</div>
                  <div style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.7, position: 'relative', zIndex: 1 }}>{desc}</div>
                  <div style={{ position: 'absolute', bottom: 16, right: 20, fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: '72px', lineHeight: 1, color: 'var(--border)', pointerEvents: 'none', userSelect: 'none' }}>{num}</div>
                </div>
                {i < 2 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 0, position: 'relative', zIndex: 2 }}>
                    <div style={{ position: 'absolute', width: 32, height: 32, borderRadius: '50%', background: 'var(--bg)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                      <ArrowRightIcon />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="anim-fade-up cta-section" style={{ animationDelay: '480ms', margin: '80px 0 80px', background: 'var(--glass-cta-bg)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-cta-border)', boxShadow: 'var(--glass-cta-shadow)', borderRadius: 24, padding: '72px 64px', position: 'relative', overflow: 'hidden' }}>
          <svg style={{ position: 'absolute', right: -60, top: '50%', transform: 'translateY(-50%)', opacity: 0.06, pointerEvents: 'none' }} width="420" height="420" viewBox="0 0 420 420" fill="none">
            <circle cx="210" cy="210" r="200" stroke="white" strokeWidth="1" />
            <circle cx="210" cy="210" r="155" stroke="white" strokeWidth="1" />
            <circle cx="210" cy="210" r="110" stroke="white" strokeWidth="1" />
            <circle cx="210" cy="210" r="65" stroke="white" strokeWidth="1" />
            <circle cx="210" cy="210" r="20" stroke="white" strokeWidth="1" />
          </svg>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 48 }} className="cta-flex">
            <div style={{ position: 'relative', zIndex: 1, maxWidth: 460 }}>
              <div style={{ color: 'var(--muted)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>For creators</div>
              <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '36px', lineHeight: 1.1, letterSpacing: '-1px', color: 'var(--text)', marginBottom: 16 }}>Ready to grow<br />your channel?</h2>
              <p style={{ color: 'var(--muted)', fontSize: '15px', lineHeight: 1.75, maxWidth: 360 }}>Connect your YouTube account to unlock full analytics, comment sentiment, topic gap analysis, and AI-powered content ideas.</p>
            </div>
            <div style={{ position: 'relative', zIndex: 1, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              {user ? (
                <>
                  <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '15px 30px', borderRadius: 12, background: 'var(--accent)', border: 'none', color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '15px', textDecoration: 'none', boxShadow: '0 4px 20px rgba(192,57,43,0.4)', transition: 'all 0.18s ease' }}>
                    <UserIcon /> Go to Dashboard
                  </Link>
                  <div style={{ color: 'var(--muted)', fontSize: '12px' }}>You&apos;re all set</div>
                </>
              ) : (
                <>
                  <GlassBtn onClick={handleLogin} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '25px 30px', borderRadius: 12, color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '15px', cursor: 'pointer'}}>
                    <GoogleIcon size={18} /> Get Started — it&apos;s free
                  </GlassBtn>
                  <div style={{ color: 'var(--muted)', fontSize: '12px' }}>No credit card required</div>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
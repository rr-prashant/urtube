'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
// TODO: import { createClient } from '@/lib/supabase/client'

/* ─── Types ─── */
interface VideoResult {
  id: number
  youtube_video_id: string
  title: string
  description: string
  thumbnail_url: string
  views: number
  likes: number
  comments_count: number
  published_at: string
  channel?: string
  thumbColor?: string
  daysAgo?: number
}

interface TrendingTitle {
  title: string
  views: number
  likes: number
  comments_count: number
}

interface Engagement {
  avg_views: number
  avg_likes: number
  avg_engagement_percent: number
  total_comments: number
}

interface PublicResult {
  query: string
  total_videos: number
  videos: VideoResult[]
  trending_titles: TrendingTitle[]
  engagement: Engagement
}

/* ─── Helpers ─── */
const fmt = (n: number) => n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1000 ? (n / 1000).toFixed(0) + 'K' : n.toString()

const timeAgo = (dateStr: string) => {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.round(days / 7)}w ago`
  if (days < 365) return `${Math.round(days / 30)}mo ago`
  return `${Math.round(days / 365)}y ago`
}

/* ─── Icons ─── */
const SearchIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
)
const GoogleIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
)
const MoonIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
)
const SunIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
)
const EyeIcon = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
)
const HeartIcon = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
)
const CommentIcon = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)
const TrendIcon = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
  </svg>
)
const SparkleIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
  </svg>
)

/* ─── Background Decoration ─── */
function BgDecoration({ dark }: { dark: boolean }) {
  const p = dark
    ? { a: 'oklch(0.38 0.12 22 / 0.18)', b: 'oklch(0.32 0.08 220 / 0.14)', c: 'oklch(0.35 0.1 160 / 0.1)' }
    : { a: 'oklch(0.72 0.14 22 / 0.45)', b: 'oklch(0.55 0.1 240 / 0.35)', c: 'oklch(0.65 0.06 200 / 0.28)' }

  return (
    <div aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-10%', right: '-8%', width: 600, height: 600, borderRadius: '50%', background: p.a, filter: 'blur(90px)' }} />
      <div style={{ position: 'absolute', bottom: '-12%', left: '-6%', width: 500, height: 500, borderRadius: '50%', background: p.b, filter: 'blur(80px)' }} />
      <div style={{ position: 'absolute', top: '40%', left: '35%', width: 380, height: 380, borderRadius: '50%', background: p.c, filter: 'blur(100px)' }} />
    </div>
  )
}

/* ─── Stat Card ─── */
function StatCard({ label, value, sub, delay = 0 }: { label: string; value: string; sub?: string; delay?: number }) {
  return (
    <div className="anim-card-in stat-card" style={{ animationDelay: `${delay}ms`, flex: 1, minWidth: 0, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '18px 22px', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ color: 'var(--muted)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '28px', color: 'var(--text)', lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ color: 'var(--teal)', fontSize: '12px', marginTop: 5, fontWeight: 500 }}>{sub}</div>}
    </div>
  )
}

/* ─── Trending Row ─── */
function TrendingRow({ rank, title, delay = 0 }: { rank: number; title: TrendingTitle; delay?: number }) {
  return (
    <div className="anim-card-in trend-row" style={{ animationDelay: `${delay}ms`, display: 'flex', alignItems: 'center', gap: '14px', padding: '11px 14px', borderRadius: '10px', background: 'transparent', border: '1px solid transparent', cursor: 'default' }}>
      <div style={{ width: 30, height: 30, borderRadius: 7, flexShrink: 0, background: rank <= 3 ? 'var(--accent-lo)' : 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '12px', color: rank <= 3 ? 'var(--accent)' : 'var(--muted)' }}>{rank}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, fontSize: '13.5px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title.title}</div>
      </div>
      <div style={{ display: 'flex', gap: '16px', flexShrink: 0 }}>
        {[
          { icon: <EyeIcon />, val: fmt(title.views) },
          { icon: <HeartIcon />, val: fmt(title.likes) },
          { icon: <CommentIcon />, val: fmt(title.comments_count) },
        ].map(({ icon, val }, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--muted)', fontSize: '12.5px', minWidth: 40 }}>{icon} {val}</div>
        ))}
      </div>
    </div>
  )
}

/* ─── Video Card ─── */
function VideoCard({ video, delay = 0 }: { video: VideoResult; delay?: number }) {
  const engRate = video.views > 0 ? ((video.likes / video.views) * 100).toFixed(1) : '0.0'
  return (
    <div className="anim-card-in video-card" style={{ animationDelay: `${delay}ms`, borderRadius: '14px', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg2)', boxShadow: 'var(--shadow-sm)', cursor: 'default' }}>
      {/* Thumbnail */}
      <div style={{ height: '126px', overflow: 'hidden', position: 'relative', background: '#e8d5c4' }}>
        {video.thumbnail_url ? (
          <img src={video.thumbnail_url} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} className="thumb-img" />
        ) : (
          <div className="thumb-img" style={{ position: 'absolute', inset: 0, background: '#e8d5c4', backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 12px, rgba(0,0,0,0.04) 12px, rgba(0,0,0,0.04) 24px)' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--accent)"><path d="M5 3l14 9-14 9V3z" /></svg>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 7, right: 7, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', borderRadius: 5, padding: '2px 7px', fontSize: '11px', color: '#fff', fontWeight: 500 }}>{timeAgo(video.published_at)}</div>
      </div>
      {/* Content */}
      <div style={{ padding: '12px 14px 14px' }}>
        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', lineHeight: 1.45, marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>{video.title}</div>
        <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 8 }}>
          {[
            { icon: <EyeIcon />, val: fmt(video.views) },
            { icon: <HeartIcon />, val: fmt(video.likes) },
            { icon: <TrendIcon />, val: engRate + '%', highlight: parseFloat(engRate) > 3.5 },
          ].map(({ icon, val, highlight }, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '12px', color: highlight ? 'var(--accent)' : 'var(--muted)', fontWeight: highlight ? 600 : 400 }}>{icon} {val}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Feature Card ─── */
function FeatureCard({ icon, title, desc, delay = 0 }: { icon: React.ReactNode; title: string; desc: string; delay?: number }) {
  return (
    <div className="anim-fade-up feat-card" style={{ animationDelay: `${delay}ms`, flex: 1, padding: '28px 26px 26px', borderRadius: '16px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: 'var(--glass-shadow)', cursor: 'default' }}>
      <div style={{ width: 44, height: 44, borderRadius: 11, marginBottom: 18, background: 'var(--accent-lo)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>{icon}</div>
      <div style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: '16px', marginBottom: 9, color: 'var(--text)' }}>{title}</div>
      <div style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.7 }}>{desc}</div>
    </div>
  )
}

/* ─── Search Results ─── */
function SearchResults({ results }: { results: PublicResult }) {
  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Summary */}
      <div className="anim-card-in" style={{ marginBottom: 26 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '22px', color: 'var(--text)' }}>{results.total_videos} videos for</span>
          <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '22px', color: 'var(--accent)' }}>"{results.query}"</span>
        </div>
        <div style={{ color: 'var(--muted)', fontSize: '14px', marginTop: 4 }}>Aggregated analytics across all results</div>
      </div>

      {/* Stats */}
      <div className="stat-row-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 42 }}>
        <StatCard label="Avg Views" value={fmt(results.engagement.avg_views)} sub="per video" delay={0} />
        <StatCard label="Avg Likes" value={fmt(results.engagement.avg_likes)} sub="per video" delay={60} />
        <StatCard label="Engagement Rate" value={results.engagement.avg_engagement_percent + '%'} sub="likes / views" delay={120} />
        <StatCard label="Total Comments" value={fmt(results.engagement.total_comments)} sub="all videos" delay={180} />
      </div>

      {/* Top 10 */}
      <div style={{ marginBottom: 44 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
          <span style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: '17px', color: 'var(--text)' }}>Top 10 Trending</span>
          <span style={{ color: 'var(--muted)', fontSize: '13px' }}>by views</span>
        </div>
        <div style={{ background: 'var(--bg2)', borderRadius: '16px', border: '1px solid var(--border)', padding: '8px', boxShadow: 'var(--shadow-sm)' }}>
          {results.trending_titles.map((t, i) => (
            <TrendingRow key={i} rank={i + 1} title={t} delay={i * 35} />
          ))}
        </div>
      </div>

      {/* All Videos */}
      <div>
        <div style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: '17px', color: 'var(--text)', marginBottom: 14 }}>
          All Videos <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: '14px', marginLeft: 8 }}>({results.total_videos})</span>
        </div>
        <div className="video-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '14px' }}>
          {results.videos.map((v, i) => (
            <VideoCard key={v.youtube_video_id || i} video={v} delay={Math.min(i * 28, 280)} />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Main Page ─── */
export default function Home() {
  const [dark, setDark] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PublicResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  }, [dark])

  /* TODO: Replace with actual API call */
  const doSearch = useCallback(async () => {
    if (!query.trim()) return
    setLoading(true)

    /* TODO: Connect to backend
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/research/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    })
    const data = await response.json()
    setResults(data)
    */

    // Placeholder — remove when connecting to API
    setTimeout(() => {
      setResults(null) // Replace with: setResults(data)
      setLoading(false)
    }, 700)
  }, [query])

  const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') doSearch() }

  const clearSearch = () => {
    setResults(null)
    setQuery('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  /* TODO: Connect Google OAuth login */
  const handleLogin = async () => {
    /* TODO:
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'https://www.googleapis.com/auth/youtube.readonly',
        queryParams: { prompt: 'consent', access_type: 'offline' },
      },
    })
    */
    console.log('Login clicked — connect OAuth here')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <BgDecoration dark={dark} />

      {/* ── HEADER ── */}
      <header style={{ border: 'none', background: 'transparent', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1320, margin: '0 auto', width: '100%', padding: '0 clamp(20px, 4vw, 60px)', height: '62px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: 30, height: 30, borderRadius: 7, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M5.5 4.5L12 8L5.5 11.5V4.5Z" fill="var(--accent)" /></svg>
            </div>
            <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '18px', letterSpacing: '-0.3px', color: 'var(--text)' }}>
              UR<span style={{ color: 'var(--accent)' }}>Tube</span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button onClick={() => setDark(d => !d)} title={dark ? 'Light mode' : 'Dark mode'} style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border2)', background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(12px)', color: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.18s ease', boxShadow: '0 1px 4px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.5)' }}>
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>
            <button onClick={handleLogin} title="Login with Google" style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border2)', background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(12px)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.18s ease', boxShadow: '0 1px 4px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.5)' }}>
              <GoogleIcon size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main style={{ flex: 1, maxWidth: 1320, margin: '0 auto', width: '100%', padding: '0 clamp(20px, 4vw, 60px)', position: 'relative', zIndex: 1 }}>

        {/* HERO */}
        <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: results ? '44px' : '96px', paddingBottom: results ? '36px' : '0', transition: 'padding 0.45s cubic-bezier(.22,1,.36,1)' }}>

          {!results && (
            <div className="anim-fade-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--glass-badge-bg)', backdropFilter: 'blur(10px)', border: '1px solid var(--glass-badge-border)', boxShadow: '0 2px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,1)', color: 'var(--text)', borderRadius: 100, padding: '6px 16px', fontSize: '12px', fontWeight: 600, marginBottom: 28, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              <SparkleIcon /> AI-powered YouTube analytics
            </div>
          )}

          <h1 className="anim-fade-up" style={{ animationDelay: '60ms', fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: results ? '32px' : '56px', lineHeight: 1.1, letterSpacing: '-1.5px', color: 'var(--text)', maxWidth: 660, transition: 'font-size 0.4s cubic-bezier(.22,1,.36,1)' }}>
            {results
              ? 'Analytics results'
              : <><span style={{ color: 'var(--accent)' }}>YouTube</span> analytics<br />for creators</>}
          </h1>

          {!results && (
            <p className="anim-fade-up" style={{ animationDelay: '120ms', color: 'var(--muted)', fontSize: '17px', lineHeight: 1.75, maxWidth: 440, marginTop: 18, marginBottom: 44 }}>
              Search any topic to see what&apos;s trending, or login to analyze your channel.
            </p>
          )}

          {results && (
            <p style={{ color: 'var(--muted)', fontSize: '14px', marginTop: 8, marginBottom: 24 }}>
              Search any topic to explore YouTube trends
            </p>
          )}

          {/* Search bar */}
          <div className="anim-fade-up" style={{ animationDelay: '180ms', width: '100%', maxWidth: 620 }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--glass-search-bg)', backdropFilter: 'blur(16px)', border: `1.5px solid ${focused ? 'var(--accent)' : 'rgba(255,255,255,0.9)'}`, borderRadius: '14px', boxShadow: focused ? 'var(--shadow-md)' : '0 4px 24px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,1)', transition: 'all 0.2s ease', overflow: 'hidden' }}>
              <div style={{ padding: '0 16px', color: 'var(--muted)', display: 'flex', flexShrink: 0 }}><SearchIcon /></div>
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKey}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Search any YouTube topic..."
                style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: '15.5px', padding: '17px 0' }}
              />
              {query && (
                <button onClick={() => { setQuery(''); inputRef.current?.focus() }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '0 8px', fontSize: '20px', lineHeight: 1 }}>×</button>
              )}
              <button onClick={doSearch} disabled={!query.trim() || loading} style={{ margin: '6px', padding: '11px 22px', borderRadius: '10px', background: 'var(--accent)', border: 'none', color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '14px', cursor: query.trim() ? 'pointer' : 'default', transition: 'all 0.18s ease', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 72 }}>
                {loading
                  ? <div style={{ width: 17, height: 17, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 0.7s linear infinite' }} />
                  : 'Search'}
              </button>
            </div>

            {/* Suggestion chips */}
            {!results && !query && (
              <div className="anim-fade-up" style={{ animationDelay: '260ms', marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                {['python tutorial', 'react.js', 'vlog 2025', 'AI tools', 'fitness routine'].map(s => (
                  <button key={s} onClick={() => { setQuery(s); setTimeout(() => inputRef.current?.focus(), 10) }}
                    style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 100, padding: '5px 14px', fontSize: '13px', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.15s', boxShadow: 'var(--shadow-sm)' }}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            {results && (
              <div style={{ marginTop: 12, display: 'flex', gap: 14, justifyContent: 'center' }}>
                <button onClick={doSearch} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-body)', textDecoration: 'underline', textUnderlineOffset: 3 }}>Re-run</button>
                <button onClick={clearSearch} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-body)', textDecoration: 'underline', textUnderlineOffset: 3 }}>Clear results</button>
              </div>
            )}
          </div>
        </section>

        {/* RESULTS */}
        {results && (
          <div ref={resultsRef} style={{ marginTop: 44 }}>
            <SearchResults results={results} />
          </div>
        )}

        {/* FEATURES */}
        {!results && (
          <section style={{ marginTop: 88, paddingBottom: 80 }}>
            <div className="anim-fade-up" style={{ animationDelay: '300ms', textAlign: 'center', marginBottom: 36 }}>
              <div style={{ color: 'var(--muted)', fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>What URTube gives you</div>
            </div>
            <div style={{ display: 'flex', gap: '16px', marginBottom: 52 }} className="features-flex">
              <FeatureCard delay={340}
                icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>}
                title="Sentiment Analysis"
                desc="Understand how your audience feels through comment tone mapping and emotional pattern detection."
              />
              <FeatureCard delay={400}
                icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="5" r="3" /><circle cx="19" cy="19" r="3" /><circle cx="5" cy="19" r="3" /><line x1="12" y1="8" x2="5" y2="16" /><line x1="12" y1="8" x2="19" y2="16" /></svg>}
                title="Topic Clustering"
                desc="See which content themes resonate most in your niche. Discover gaps before your competitors do."
              />
              <FeatureCard delay={460}
                icon={<SparkleIcon />}
                title="AI Recommendations"
                desc="Get personalized content ideas powered by GPT — tailored to your channel, audience, and growth goals."
              />
            </div>
          </section>
        )}

        {/* CTA */}
        {!results && (
          <section className="anim-fade-up cta-section cta-flex" style={{ animationDelay: '520ms', margin: '0 0 80px', background: 'var(--glass-cta-bg)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-cta-border)', boxShadow: 'var(--glass-cta-shadow)', borderRadius: 24, padding: '72px 64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 48, position: 'relative', overflow: 'hidden' }}>
            <svg style={{ position: 'absolute', right: -60, top: '50%', transform: 'translateY(-50%)', opacity: 0.06, pointerEvents: 'none' }} width="420" height="420" viewBox="0 0 420 420" fill="none">
              <circle cx="210" cy="210" r="200" stroke="black" strokeWidth="1" />
              <circle cx="210" cy="210" r="155" stroke="black" strokeWidth="1" />
              <circle cx="210" cy="210" r="110" stroke="black" strokeWidth="1" />
              <circle cx="210" cy="210" r="65" stroke="black" strokeWidth="1" />
              <circle cx="210" cy="210" r="20" stroke="black" strokeWidth="1" />
            </svg>
            <div style={{ position: 'relative', zIndex: 1, maxWidth: 460 }}>
              <div style={{ color: 'var(--muted)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>For creators</div>
              <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '36px', lineHeight: 1.1, letterSpacing: '-1px', color: 'var(--text)', marginBottom: 16 }}>Ready to grow<br />your channel?</h2>
              <p style={{ color: 'var(--muted)', fontSize: '15px', lineHeight: 1.75, maxWidth: 360 }}>Connect your YouTube account to unlock full analytics, comment sentiment, topic gap analysis, and AI-powered content ideas.</p>
            </div>
            <div style={{ position: 'relative', zIndex: 1, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <button onClick={handleLogin} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '15px 30px', borderRadius: 12, background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.5)', color: 'var(--text)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '15px', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 2px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.6)', transition: 'all 0.18s ease' }}>
                <GoogleIcon size={18} /> Get Started — it&apos;s free
              </button>
              <div style={{ color: 'var(--muted)', fontSize: '12px' }}>No credit card required</div>
            </div>
          </section>
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer style={{ position: 'relative', zIndex: 1, borderTop: '1px solid var(--border)', padding: '20px 40px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--bg2)', transition: 'background 0.3s ease' }}>
        {/* TODO: Replace with your name */}
        <span style={{ color: 'var(--muted)', fontSize: '13px' }}>Built by <span style={{ color: 'var(--text)', fontWeight: 500 }}>Your Name</span></span>
        <span style={{ color: 'var(--border2)' }}>·</span>
        <span style={{ color: 'var(--muted)', fontSize: '13px' }}>CS Master&apos;s Project</span>
        <span style={{ color: 'var(--border2)' }}>·</span>
        <span style={{ color: 'var(--muted)', fontSize: '13px' }}>2025</span>
      </footer>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

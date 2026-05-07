'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { BgDecoration, Footer, StatCard, SparkleIcon, GlobeIcon, LogoutIcon, EyeIcon, HeartIcon, CommentIcon, TrendIcon, fmt, timeAgo } from '@/components/ui'

/* ─── Types ─── */
interface Video {
  id: number
  youtube_video_id: string
  title: string
  thumbnail_url: string
  views: number
  likes: number
  comments_count: number
  published_at: string
}

interface Cluster {
  id: number
  cluster_label: number
  cluster_name: string | null
  avg_views: number
  avg_engagement: number
  videos: Video[]
}

interface Sentiment {
  avg_score: number
  positive_percent: number
  neutral_percent: number
  negative_percent: number
  total_comments: number
  video_count: number
}

interface Snapshot {
  avg_sentiment: number
  positive_percent: number
  neutral_percent: number
  negative_percent: number
  total_comments: number
  top_video_title: string | null
  created_at: string
}

interface VideoInsight {
  what_worked: string
  improve: string
  next_idea: string
}

interface Recommendation {
  title: string
  reason: string
}

interface ChannelRecommend {
  channel_analysis: string
  top_tip: string
  recommendations: Recommendation[]
}

/* ─── Icons (dashboard-specific) ─── */
const HomeIcon = () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
const RefreshIcon = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
const LightbulbIcon = () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M9 18h6" /><path d="M10 22h4" /><path d="M12 2a7 7 0 0 1 7 7c0 2.6-1.4 4.9-3.5 6.2-.5.3-.5.8-.5 1.3V17H9v-.5c0-.5 0-1-.5-1.3A7 7 0 0 1 12 2z" /></svg>
const ChevronDownIcon = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>

const Spinner = ({ size = 18 }: { size?: number }) => (
  <div style={{ width: size, height: size, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
)

/* ─── Section Heading ─── */
function SectionHeading({ label, title, sub }: { label?: string; title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      {label && <div style={{ color: 'var(--muted)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '20px', letterSpacing: '-0.3px', color: 'var(--text)', lineHeight: 1.2 }}>{title}</h2>
        {sub && <span style={{ color: 'var(--muted)', fontSize: '14px', fontWeight: 400 }}>{sub}</span>}
      </div>
    </div>
  )
}

/* ─── Sentiment Donut ─── */
function SentimentDonut({ sentiment }: { sentiment: Sentiment }) {
  const { positive_percent: pos, neutral_percent: neu, negative_percent: neg, avg_score } = sentiment
  const R = 56, STROKE = 13, circ = 2 * Math.PI * R, GAP = 3
  let offset = 0
  const segments = [
    { pct: pos, color: 'var(--pos)', label: 'Positive' },
    { pct: neu, color: 'var(--neu)', label: 'Neutral' },
    { pct: neg, color: 'var(--neg)', label: 'Negative' },
  ].map(seg => {
    const len = circ * (seg.pct / 100)
    const dash = { dashArray: `${len - GAP} ${circ - (len - GAP)}`, dashOffset: -offset }
    offset += len
    return { ...seg, ...dash }
  })

  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: '28px 32px', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: 40 }}>
      <div style={{ flexShrink: 0 }}>
        <svg width={150} height={150} viewBox="0 0 150 150">
          <circle cx="75" cy="75" r={R} fill="none" stroke="var(--bg3)" strokeWidth={STROKE} />
          {segments.map((seg, i) => (
            <circle key={i} cx="75" cy="75" r={R} fill="none" stroke={seg.color} strokeWidth={STROKE}
              strokeDasharray={seg.dashArray} strokeDashoffset={seg.dashOffset} strokeLinecap="butt"
              style={{ transform: 'rotate(-90deg)', transformOrigin: '75px 75px' }} />
          ))}
          <text x="75" y="70" textAnchor="middle" style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 20, fill: 'var(--text)' }}>
            {avg_score > 0 ? '+' : ''}{avg_score.toFixed(2)}
          </text>
          <text x="75" y="88" textAnchor="middle" style={{ fontFamily: 'var(--font-body)', fontSize: 11, fill: 'var(--muted)' }}>avg score</text>
        </svg>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[
          { label: 'Positive', pct: pos, color: 'var(--pos)' },
          { label: 'Neutral', pct: neu, color: 'var(--neu)' },
          { label: 'Negative', pct: neg, color: 'var(--neg)' },
        ].map(({ label, pct, color }) => (
          <div key={label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
                <span style={{ fontSize: '13.5px', color: 'var(--text2)', fontWeight: 500 }}>{label}</span>
              </div>
              <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '14px', color: 'var(--text)' }}>{pct}%</span>
            </div>
            <div style={{ height: 5, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.8s cubic-bezier(.22,1,.36,1)' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Top Performing Videos ─── */
function TopVideos({ videos }: { videos: Video[] }) {
  const RANK_COLORS = ['#E6B14C', '#B8B8C4', '#C68B5C']
  return (
    <div>
      <SectionHeading label="Performance" title="Top Performing Videos" sub="by view count" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {videos.map((video, i) => (
          <div key={video.id} className="anim-card-in top-video-card" style={{ animationDelay: `${i * 80}ms`, borderRadius: 16, overflow: 'hidden', border: i === 0 ? '1px solid rgba(192,57,43,0.35)' : '1px solid var(--border)', background: 'var(--bg2)', boxShadow: i === 0 ? '0 4px 24px rgba(192,57,43,0.15)' : 'var(--shadow-sm)' }}>
            <div style={{ height: 160, overflow: 'hidden', position: 'relative' }}>
              {video.thumbnail_url ? (
                <img src={video.thumbnail_url} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} className="thumb-img" />
              ) : (
                <div className="thumb-img" style={{ position: 'absolute', inset: 0, background: '#1a2a3a' }} />
              )}
              <div style={{ position: 'absolute', top: 10, left: 10, width: 28, height: 28, borderRadius: '50%', background: RANK_COLORS[i], color: '#1a1410', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-head)', fontSize: '14px', fontWeight: 700, boxShadow: '0 2px 10px rgba(0,0,0,0.35)' }}>{i + 1}</div>
              <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', borderRadius: 5, padding: '2px 7px', fontSize: '11px', color: '#fff', fontWeight: 500 }}>{timeAgo(video.published_at)}</div>
            </div>
            <div style={{ padding: '14px 16px 16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', lineHeight: 1.4, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>{video.title}</div>
              <div style={{ display: 'flex', gap: 14, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                {[
                  { icon: <EyeIcon />, val: fmt(video.views), label: 'views' },
                  { icon: <HeartIcon />, val: fmt(video.likes), label: 'likes' },
                  { icon: <CommentIcon />, val: fmt(video.comments_count), label: 'comments' },
                ].map(({ icon, val, label }) => (
                  <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--muted)', fontSize: '11px' }}>{icon} {label}</div>
                    <div style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Video Card with AI Insights button ─── */
function DashboardVideoCard({ video, isOpen, onToggle, delay = 0 }: { video: Video; isOpen: boolean; onToggle: () => void; delay?: number }) {
  const engRate = video.views > 0 ? ((video.likes / video.views) * 100).toFixed(1) : '0.0'
  return (
    <div className="anim-card-in video-card" style={{ animationDelay: `${delay}ms`, borderRadius: 14, overflow: 'hidden', border: isOpen ? '1px solid var(--accent)' : '1px solid var(--border)', background: 'var(--bg2)', boxShadow: isOpen ? '0 0 0 2px rgba(192,57,43,0.35), 0 8px 28px rgba(192,57,43,0.18)' : 'var(--shadow-sm)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 126, overflow: 'hidden', position: 'relative' }}>
        {video.thumbnail_url ? (
          <img src={video.thumbnail_url} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} className="thumb-img" />
        ) : (
          <div className="thumb-img" style={{ position: 'absolute', inset: 0, background: '#1a2a3a' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--accent)"><path d="M5 3l14 9-14 9V3z" /></svg>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 7, right: 7, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', borderRadius: 5, padding: '2px 7px', fontSize: '11px', color: '#fff', fontWeight: 500 }}>{timeAgo(video.published_at)}</div>
      </div>
      <div style={{ padding: '12px 14px 0', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', lineHeight: 1.45, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>{video.title}</div>
        <div style={{ display: 'flex', gap: 10, borderTop: '1px solid var(--border)', paddingTop: 10, marginBottom: 10, marginTop: 'auto' }}>
          {[
            { icon: <EyeIcon />, val: fmt(video.views) },
            { icon: <HeartIcon />, val: fmt(video.likes) },
            { icon: <TrendIcon />, val: engRate + '%', highlight: parseFloat(engRate) > 3.5 },
          ].map(({ icon, val, highlight }, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '12px', color: highlight ? 'var(--accent)' : 'var(--muted)', fontWeight: highlight ? 600 : 400 }}>{icon} {val}</div>
          ))}
        </div>
      </div>
      <button onClick={onToggle} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: '9px 14px', background: isOpen ? 'rgba(192,57,43,0.12)' : 'var(--bg3)', border: 'none', borderTop: '1px solid var(--border)', color: isOpen ? 'var(--accent)' : 'var(--muted)', fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.18s ease', letterSpacing: '0.03em' }}>
        <SparkleIcon /> {isOpen ? 'Hide AI Insights' : 'Get AI Insights'}
      </button>
    </div>
  )
}

/* ─── Inline Insights Row ─── */
function InsightsInlineRow({ video, onClose, session }: { video: Video; onClose: () => void; session: any }) {
  const [insights, setInsights] = useState<VideoInsight | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchInsights() {
      /* TODO: Connect to backend */
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/videos/${video.id}/insights/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      })
      const data = await response.json()
      setInsights(data)
      setLoading(false)
    }
    fetchInsights()
  }, [video.id, session])

  return (
    <div className="anim-card-in" style={{ gridColumn: '1 / -1', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, rgba(192,57,43,0.08), rgba(192,57,43,0.01))' }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}><SparkleIcon /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>AI Insights</div>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: '14px', color: 'var(--text)', lineHeight: 1.35 }}>{video.title}</div>
        </div>
        <button onClick={onClose} style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 7, border: '1px solid var(--border2)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>
      <div style={{ padding: '16px 18px' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 0', justifyContent: 'center' }}>
            <Spinner size={16} />
            <span className="shimmer-text" style={{ fontSize: '13px', fontWeight: 500 }}>Analyzing video performance…</span>
          </div>
        ) : insights ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {[
              { key: 'what_worked' as const, label: '✓ What Worked', color: 'var(--pos)', bg: 'rgba(94,176,124,0.07)', border: 'rgba(94,176,124,0.2)' },
              { key: 'improve' as const, label: '↑ What to Improve', color: 'var(--teal)', bg: 'rgba(76,168,184,0.07)', border: 'rgba(76,168,184,0.2)' },
              { key: 'next_idea' as const, label: '→ Next Content Idea', color: 'var(--accent)', bg: 'rgba(192,57,43,0.07)', border: 'rgba(192,57,43,0.2)' },
            ].map(({ key, label, color, bg, border }) => (
              <div key={key} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: '11px 13px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
                <p style={{ fontSize: '12.5px', color: 'var(--text2)', lineHeight: 1.6, margin: 0 }}>{insights[key]}</p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--muted)', fontSize: '13px' }}>Failed to load insights.</p>
        )}
      </div>
    </div>
  )
}

/* ─── AI Recommendations Section ─── */
function AIRecommendations({ session }: { session: any }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle')
  const [recs, setRecs] = useState<ChannelRecommend | null>(null)

  async function loadRecs() {
    setStatus('loading')
    /* TODO: Connect to backend */
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/recom/`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${session?.access_token}` }
    })
    const data = await response.json()
    setRecs(data.recommendations || data)
    setStatus('done')
  }

  return (
    <div style={{ background: 'linear-gradient(135deg, rgba(192,57,43,0.07) 0%, rgba(255,255,255,0.03) 100%)', border: '1px solid rgba(192,57,43,0.2)', borderRadius: 20, padding: '36px 40px', boxShadow: '0 4px 32px rgba(192,57,43,0.08), var(--shadow-sm)', position: 'relative', overflow: 'hidden' }}>
      <svg aria-hidden="true" style={{ position: 'absolute', right: -40, top: '50%', transform: 'translateY(-50%)', opacity: 0.04, pointerEvents: 'none' }} width="360" height="360" viewBox="0 0 360 360">
        <circle cx="180" cy="180" r="170" stroke="white" strokeWidth="1" fill="none" />
        <circle cx="180" cy="180" r="130" stroke="white" strokeWidth="1" fill="none" />
        <circle cx="180" cy="180" r="90" stroke="white" strokeWidth="1" fill="none" />
        <circle cx="180" cy="180" r="50" stroke="white" strokeWidth="1" fill="none" />
      </svg>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: status === 'idle' ? 0 : 28, flexWrap: 'wrap', gap: 16 }}>
        <div style={{ flex: '1 1 320px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><SparkleIcon /></div>
            <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '20px', letterSpacing: '-0.3px' }}>AI Recommendations</h2>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '13.5px', maxWidth: 400, lineHeight: 1.6 }}>GPT-4o analyzes your channel&apos;s performance data and generates personalized content strategy.</p>
        </div>
        <button onClick={loadRecs} disabled={status === 'loading'} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 11, background: status === 'loading' ? 'rgba(192,57,43,0.5)' : 'var(--accent)', border: 'none', color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '14px', cursor: status === 'loading' ? 'default' : 'pointer', boxShadow: status !== 'loading' ? '0 4px 20px rgba(192,57,43,0.4)' : 'none', transition: 'all 0.18s ease', flexShrink: 0 }}>
          {status === 'loading' ? <Spinner size={15} /> : <SparkleIcon />}
          {status === 'idle' ? 'Get AI Recommendations' : status === 'loading' ? 'Generating…' : 'Regenerate'}
        </button>
      </div>

      {status === 'loading' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 0' }}>
          <Spinner size={18} />
          <span className="shimmer-text" style={{ fontSize: '14px', fontWeight: 500 }}>Analyzing your videos, comments, and topic clusters…</span>
        </div>
      )}

      {status === 'done' && recs && (
        <div className="anim-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Channel Analysis</div>
            <p style={{ fontSize: '14.5px', color: 'var(--text2)', lineHeight: 1.75 }}>{recs.channel_analysis}</p>
          </div>
          <div style={{ background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.25)', borderRadius: 12, padding: '16px 18px', display: 'flex', gap: 12 }}>
            <div style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }}><LightbulbIcon /></div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>Top Tip</div>
              <p style={{ fontSize: '14px', color: 'var(--text)', lineHeight: 1.65 }}>{recs.top_tip}</p>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>5 Content Ideas</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
              {recs.recommendations.map((idea, i) => (
                <div key={i} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, flexShrink: 0, background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '11px', color: 'var(--accent)', marginTop: 1 }}>{i + 1}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text)', lineHeight: 1.4, marginBottom: 5 }}>{idea.title}</div>
                    <div style={{ fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.55 }}>{idea.reason}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Previous Analyses ─── */
function PreviousAnalyses({ snapshots }: { snapshots: Snapshot[] }) {
  const [expanded, setExpanded] = useState(false)
  const reversed = [...snapshots].reverse()

  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
      <button onClick={() => setExpanded(e => !e)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '18px 24px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', transition: 'background 0.15s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: '15px' }}>Analysis History</span>
          {snapshots.length > 0 && (
            <span style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 5, padding: '1px 8px', fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>{snapshots.length} snapshots</span>
          )}
        </div>
        <div style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: 'var(--muted)' }}><ChevronDownIcon /></div>
      </button>
      {expanded && (
        <div className="anim-fade-up" style={{ borderTop: '1px solid var(--border)', animationDuration: '0.25s' }}>
          {snapshots.length === 0 ? (
            <div style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--muted)', fontSize: '14px' }}>No previous analyses yet. Re-analyze to start tracking changes.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['#', 'Date', 'Positive %', 'Neutral %', 'Negative %', 'Avg Score', 'Comments', 'Top Video'].map((col, i) => (
                      <th key={col} style={{ padding: '10px 16px', textAlign: i < 2 ? 'left' : 'center', color: 'var(--muted)', fontWeight: 600, fontSize: '11px', letterSpacing: '0.07em', textTransform: 'uppercase', background: 'var(--bg3)', whiteSpace: 'nowrap' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reversed.map((row, i) => (
                    <tr key={i} className="history-table-row" style={{ borderBottom: i < reversed.length - 1 ? '1px solid var(--border)' : 'none', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                      <td style={{ padding: '12px 16px', color: 'var(--muted)', fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '13px' }}>{i + 1}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{new Date(row.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--pos)', fontWeight: 600, fontFamily: 'var(--font-head)' }}>{row.positive_percent}%</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--muted)', fontWeight: 600, fontFamily: 'var(--font-head)' }}>{row.neutral_percent}%</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--neg)', fontWeight: 600, fontFamily: 'var(--font-head)' }}>{row.negative_percent}%</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontFamily: 'var(--font-head)', fontWeight: 700, color: 'var(--text)' }}>{row.avg_sentiment > 0 ? '+' : ''}{row.avg_sentiment.toFixed(2)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text2)' }}>{fmt(row.total_comments)}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text2)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.top_video_title || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── MAIN DASHBOARD PAGE ─── */

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [videos, setVideos] = useState<Video[]>([])
  const [bestVideos, setBestVideos] = useState<Video[]>([])
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [sentiment, setSentiment] = useState<Sentiment | null>(null)
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [reanalyzing, setReanalyzing] = useState(false)
  const [error, setError] = useState('')

  // Video grid state
  const [activeCluster, setActiveCluster] = useState('All')
  const [openVideoId, setOpenVideoId] = useState<number | null>(null)

  // Dropdown state
  const [dropOpen, setDropOpen] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark')
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Reset open card when cluster changes
  useEffect(() => { setOpenVideoId(null) }, [activeCluster])

  useEffect(() => {
    async function initDashboard() {
      const supabase = createClient()
      const { data: { session: s } } = await supabase.auth.getSession()
      if (!s) { setError('Not logged in'); setLoading(false); return }
      setSession(s)

      const { data: { user: authUser } } = await supabase.auth.getUser()

      // Sync user
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sync-user/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${s.access_token}` },
        body: JSON.stringify({
          sub: authUser?.user_metadata.sub,
          email: authUser?.email,
          full_name: authUser?.user_metadata.full_name,
          picture: authUser?.user_metadata.picture,
          email_verified: authUser?.user_metadata.email_verified,
          google_access_token: s.provider_token,
        })
      })

      // Fetch videos + comments on first analysis
      const syncRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sync-user/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${s.access_token}` },
        body: JSON.stringify({ sub: authUser?.user_metadata.sub, email: authUser?.email, full_name: authUser?.user_metadata.full_name, picture: authUser?.user_metadata.picture, email_verified: authUser?.user_metadata.email_verified, google_access_token: s.provider_token })
      })
      const syncData = await syncRes.json()

      if (!syncData.is_analyzed) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fetch-videos/`, { method: 'POST', headers: { 'Authorization': `Bearer ${s.access_token}` } })
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fetch-comments/`, { method: 'POST', headers: { 'Authorization': `Bearer ${s.access_token}` } })
      }

      // Load all data
      const [videosRes, clustersRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/get-videos/`, { headers: { 'Authorization': `Bearer ${s.access_token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/get-clusters/`, { headers: { 'Authorization': `Bearer ${s.access_token}` } }),
      ])

      const videosData = await videosRes.json()
      const clustersData = await clustersRes.json()

      setUser(videosData.user)
      setVideos(videosData.videos)
      setBestVideos(videosData.best_videos || [])
      setSentiment(videosData.sentiment)
      setSnapshots(videosData.snapshots || [])
      setClusters(clustersData.clusters || [])
      setLoading(false)
    }
    initDashboard()
  }, [])

  async function handleReanalyze() {
    setReanalyzing(true)
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fetch-videos/`, { method: 'POST', headers: { 'Authorization': `Bearer ${session?.access_token}` } })
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fetch-comments/`, { method: 'POST', headers: { 'Authorization': `Bearer ${session?.access_token}` } })

    const [videosRes, clustersRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/get-videos/`, { headers: { 'Authorization': `Bearer ${session?.access_token}` } }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/get-clusters/`, { headers: { 'Authorization': `Bearer ${session?.access_token}` } }),
    ])

    const videosData = await videosRes.json()
    const clustersData = await clustersRes.json()

    setUser(videosData.user)
    setVideos(videosData.videos)
    setBestVideos(videosData.best_videos || [])
    setSentiment(videosData.sentiment)
    setSnapshots(videosData.snapshots || [])
    setClusters(clustersData.clusters || [])
    setReanalyzing(false)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    document.cookie.split(';').forEach(cookie => {
      const name = cookie.split('=')[0].trim()
      if (name.startsWith('sb-')) document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
    })
    window.location.href = '/'
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Spinner size={20} />
        <span style={{ color: 'var(--muted)', fontSize: '15px' }}>Loading dashboard…</span>
      </div>
    </div>
  )
  if (error) return <div style={{ padding: 40, color: 'var(--muted)' }}>{error}. <Link href="/" style={{ color: 'var(--accent)' }}>Go home</Link></div>

  // Filter videos by cluster
  const filteredVideos = activeCluster === 'All'
    ? videos
    : clusters.find(c => (c.cluster_name || `Cluster ${c.cluster_label}`) === activeCluster)?.videos || []

  // Build grid with inline insights
  const gridItems: React.ReactNode[] = []
  filteredVideos.forEach((v, i) => {
    gridItems.push(
      <DashboardVideoCard key={v.id} video={v} delay={Math.min(i * 25, 240)} isOpen={openVideoId === v.id} onToggle={() => setOpenVideoId(openVideoId === v.id ? null : v.id)} />
    )
    if (openVideoId === v.id) {
      gridItems.push(<InsightsInlineRow key={`ins-${v.id}`} video={v} onClose={() => setOpenVideoId(null)} session={session} />)
    }
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <BgDecoration />

      {/* ── HEADER ── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(12,14,20,0.88)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1320, margin: '0 auto', width: '100%', padding: '0 clamp(20px, 4vw, 60px)', height: 62, gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link href="/"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' rx='5' fill='%23c0392b'/%3E%3Cpolygon points='9,6 9,18 19,12' fill='white'/%3E%3C/svg%3E" alt="URTube" style={{ width: 28, height: 28, borderRadius: 4 }} /></Link>
            <div style={{ width: 1, height: 18, background: 'var(--border2)' }} />
            <span style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: '16px', color: 'var(--text)' }}>Dashboard</span>
          </div>
          <div style={{ position: 'relative' }} ref={dropRef}>
            <button onClick={() => setDropOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 34, padding: '0 12px', borderRadius: 9, border: '1px solid var(--border2)', background: dropOpen ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)', color: 'var(--text)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: '13.5px', transition: 'all 0.18s ease' }}>
              {user?.picture ? (
                <img src={user.picture} alt="" style={{ width: 24, height: 24, borderRadius: '50%' }} />
              ) : (
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#fff' }}>{user?.first_name?.[0] || 'U'}</div>
              )}
              <span style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.first_name || 'Account'}</span>
              <div style={{ transform: dropOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: 'var(--muted)' }}><ChevronDownIcon /></div>
            </button>
            {dropOpen && (
              <div className="user-dropdown" style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, minWidth: 180, background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 12, padding: '5px', boxShadow: 'var(--shadow-lg)', zIndex: 100 }}>
                {[
                  { icon: <GlobeIcon />, label: 'Public Mode', href: '/publicmode' },
                  { icon: <HomeIcon />, label: 'Home', href: '/' },
                ].map(({ icon, label, href }) => (
                  <Link key={label} href={href} onClick={() => setDropOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 8, color: 'var(--text)', fontSize: '13.5px', fontWeight: 500, textDecoration: 'none', transition: 'background 0.14s' }}>
                    <span style={{ color: 'var(--muted)' }}>{icon}</span>{label}
                  </Link>
                ))}
                <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 11px', borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '13.5px', fontWeight: 500, transition: 'background 0.14s' }}>
                  <span style={{ color: 'var(--accent)' }}><LogoutIcon /></span>Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main style={{ flex: 1, maxWidth: 1320, margin: '0 auto', width: '100%', padding: '40px clamp(20px, 4vw, 60px) 80px', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 56 }}>

        {/* Welcome + Re-analyze */}
        <div className="anim-fade-up" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap', marginBottom: -24, background: 'linear-gradient(135deg, rgba(192,57,43,0.12) 0%, rgba(192,57,43,0.04) 100%)', border: '1px solid rgba(192,57,43,0.25)', borderRadius: 18, padding: '24px 28px', boxShadow: '0 4px 24px rgba(192,57,43,0.08)' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '26px', letterSpacing: '-0.5px', color: 'var(--text)', lineHeight: 1.2 }}>
              Welcome back, <span style={{ color: 'var(--accent)' }}>{user?.first_name || 'Creator'}</span>
            </h1>
            <p style={{ color: 'var(--text2)', fontSize: '14px', marginTop: 6 }}>
              {videos.length} videos · {sentiment?.total_comments || 0} comments analyzed
            </p>
          </div>
          <button onClick={handleReanalyze} disabled={reanalyzing} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 26px', borderRadius: 12, background: reanalyzing ? 'rgba(192,57,43,0.6)' : 'var(--accent)', border: 'none', color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '14px', cursor: reanalyzing ? 'default' : 'pointer', boxShadow: reanalyzing ? 'none' : '0 4px 20px rgba(192,57,43,0.45)', transition: 'all 0.18s ease', flexShrink: 0 }}>
            {reanalyzing ? <Spinner size={15} /> : <RefreshIcon />}
            {reanalyzing ? 'Analyzing…' : 'Re-analyze Channel'}
          </button>
        </div>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          <StatCard label="Videos Analyzed" value={String(videos.length)} sub="from your channel" />
          <StatCard label="Total Comments" value={fmt(sentiment?.total_comments || 0)} sub="across all videos" delay={60} />
          <StatCard label="Avg Sentiment Score" value={`${(sentiment?.avg_score || 0) > 0 ? '+' : ''}${(sentiment?.avg_score || 0).toFixed(2)}`} sub="overall positive" delay={120} />
        </div>

        {/* Top Videos + Sentiment side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>
          <TopVideos videos={bestVideos} />
          {sentiment && (
            <div>
              <SectionHeading label="Audience" title="Sentiment Overview" sub={`${fmt(sentiment.total_comments)} comments`} />
              <SentimentDonut sentiment={sentiment} />
            </div>
          )}
        </div>

        {/* Videos by Topic */}
        <div>
          <SectionHeading label="Content Library" title="Videos by Topic" />
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 20 }}>
            <button className="tab-btn" onClick={() => setActiveCluster('All')} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: activeCluster === 'All' ? '1px solid var(--accent)' : '1px solid var(--border)', background: activeCluster === 'All' ? 'rgba(192,57,43,0.12)' : 'var(--bg2)', color: activeCluster === 'All' ? 'var(--accent)' : 'var(--muted)', fontFamily: 'var(--font-body)', fontWeight: activeCluster === 'All' ? 600 : 500, fontSize: '13px', cursor: 'pointer' }}>
              All <span style={{ background: activeCluster === 'All' ? 'var(--accent)' : 'var(--bg3)', color: activeCluster === 'All' ? '#fff' : 'var(--muted)', borderRadius: 5, padding: '1px 7px', fontSize: '11px', fontWeight: 700 }}>{videos.length}</span>
            </button>
            {clusters.map(c => {
              const name = c.cluster_name || `Cluster ${c.cluster_label}`
              const active = activeCluster === name
              return (
                <button key={c.id} className="tab-btn" onClick={() => setActiveCluster(name)} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: active ? '1px solid var(--accent)' : '1px solid var(--border)', background: active ? 'rgba(192,57,43,0.12)' : 'var(--bg2)', color: active ? 'var(--accent)' : 'var(--muted)', fontFamily: 'var(--font-body)', fontWeight: active ? 600 : 500, fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {name} <span style={{ background: active ? 'var(--accent)' : 'var(--bg3)', color: active ? '#fff' : 'var(--muted)', borderRadius: 5, padding: '1px 7px', fontSize: '11px', fontWeight: 700 }}>{c.videos.length}</span>
                </button>
              )
            })}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
            {gridItems}
          </div>
        </div>

        {/* AI Recommendations */}
        <div>
          <SectionHeading label="Growth" title="AI Recommendations" sub="powered by GPT-4o" />
          <AIRecommendations session={session} />
        </div>

        {/* Previous Analyses */}
        <PreviousAnalyses snapshots={snapshots} />
      </main>

      <Footer />
    </div>
  )
}

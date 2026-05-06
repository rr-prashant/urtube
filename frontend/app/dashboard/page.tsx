'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { BgDecoration, Footer, StatCard, SparkleIcon, GlobeIcon, LogoutIcon, EyeIcon, HeartIcon, CommentIcon, TrendIcon, fmt, timeAgo } from '@/components/ui'

/* ─── Icons (dashboard-specific) ─── */
const HomeIcon = () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
const RefreshIcon = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
const LightbulbIcon = () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M9 18h6" /><path d="M10 22h4" /><path d="M12 2a7 7 0 0 1 7 7c0 2.6-1.4 4.9-3.5 6.2-.5.3-.5.8-.5 1.3V17H9v-.5c0-.5 0-1-.5-1.3A7 7 0 0 1 12 2z" /></svg>
const ChevronDownIcon = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>
const Spinner = ({ size = 18 }: { size?: number }) => (
  <div style={{ width: size, height: size, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
)

/* ─── Dummy Data ─── */
const DUMMY_USER = { first_name: 'Alex', picture: '' }

const DUMMY_VIDEOS = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  youtube_video_id: `vid_${i}`,
  title: ['My Gaming Setup Tour 2024', 'I Played Elden Ring for 24 Hours', 'Hollow Knight 100% Speedrun', 'Minecraft Hardcore: Day 100', 'Ranking Every Game I Played', 'Pro vs Amateur — FIFA Skills', 'Best Moments from 100k Stream', 'Funniest Clips Compilation', 'Top 10 Gaming Fails', 'Every Death in Hardcore Mode', 'How I Edit My Gaming Videos', 'OBS Settings for Streaming', 'How to Grow on YouTube', 'My Thumbnail Design Process', 'Valorant Aim Drills Guide', 'Getting Back Into Streaming', 'New PC Build Vlog', 'I Tried Streaming for 30 Days', 'Behind the Scenes', 'Day in My Life as a YouTuber', 'Budget Gaming Chairs Review', 'Gaming Room Before & After', 'Best Games of 2024', 'Reacting to My Oldest Videos', 'Playing Games Blindfolded', 'Surprising My Subscribers', 'Every Controller I Owned', '24 Hour Gaming Challenge', 'No Damage Run Challenge', 'Year in Review'][i],
  thumbnail_url: '',
  views: [482000, 921000, 317000, 1240000, 263000, 540000, 387000, 614000, 195000, 441000, 328000, 219000, 892000, 174000, 506000, 142000, 267000, 398000, 183000, 312000, 210000, 180000, 350000, 290000, 160000, 420000, 130000, 380000, 270000, 310000][i],
  likes: [18400, 41200, 12800, 58700, 9700, 21200, 22100, 27800, 7200, 18700, 15400, 8800, 39600, 7100, 20300, 8900, 13200, 17200, 9400, 15800, 8200, 7400, 14000, 11600, 6400, 16800, 5200, 15200, 10800, 12400][i],
  comments_count: [1240, 3870, 890, 6420, 740, 1890, 2340, 1970, 580, 1560, 1120, 640, 4120, 510, 1780, 1240, 1870, 2210, 1090, 2060, 680, 540, 1200, 940, 480, 1400, 380, 1260, 880, 1040][i],
  published_at: new Date(Date.now() - [12, 34, 58, 22, 190, 70, 88, 145, 28, 112, 62, 98, 44, 130, 18, 77, 55, 166, 200, 40, 90, 120, 50, 80, 140, 35, 160, 60, 100, 75][i] * 86400000).toISOString(),
}))

const DUMMY_BEST = [...DUMMY_VIDEOS].sort((a, b) => b.views - a.views).slice(0, 3)

const DUMMY_CLUSTERS = [
  { id: 1, cluster_label: 0, cluster_name: 'Gaming Walkthroughs', avg_views: 627000, avg_engagement: 0.038, videos: DUMMY_VIDEOS.slice(0, 6) },
  { id: 2, cluster_label: 1, cluster_name: 'Highlight Reels', avg_views: 409000, avg_engagement: 0.042, videos: DUMMY_VIDEOS.slice(6, 10) },
  { id: 3, cluster_label: 2, cluster_name: 'Tutorials', avg_views: 424000, avg_engagement: 0.035, videos: DUMMY_VIDEOS.slice(10, 15) },
  { id: 4, cluster_label: 3, cluster_name: 'Vlogs', avg_views: 260000, avg_engagement: 0.048, videos: DUMMY_VIDEOS.slice(15, 20) },
]

const DUMMY_SENTIMENT = { avg_score: 0.34, positive_percent: 68.5, neutral_percent: 22.3, negative_percent: 9.2, total_comments: 2847, video_count: 30 }

const DUMMY_SNAPSHOTS = [
  { avg_sentiment: 0.28, positive_percent: 62.1, neutral_percent: 25.4, negative_percent: 12.5, total_comments: 2340, top_video_title: 'Minecraft Hardcore: Day 100', created_at: '2024-03-12T00:00:00Z' },
  { avg_sentiment: 0.31, positive_percent: 65.8, neutral_percent: 23.1, negative_percent: 11.1, total_comments: 2561, top_video_title: 'Minecraft Hardcore: Day 100', created_at: '2024-04-03T00:00:00Z' },
  { avg_sentiment: 0.34, positive_percent: 68.5, neutral_percent: 22.3, negative_percent: 9.2, total_comments: 2847, top_video_title: 'Minecraft Hardcore: Day 100', created_at: '2024-04-28T00:00:00Z' },
]

const DUMMY_INSIGHTS = {
  what_worked: "Strong thumbnail and title hook drove a high click-through rate, while the first 30-second hook kept retention above 70%.",
  improve: "Comment engagement dipped after the 8-minute mark. Adding on-screen text summaries could help mobile viewers stay engaged.",
  next_idea: "\"I Played This Game Every Day for 30 Days\" — a commitment-challenge format with built-in narrative tension.",
}

const DUMMY_RECS = {
  channel_analysis: "Your channel excels at long-form gaming content with strong retention on challenge and hardcore formats. However, tutorial content underperforms relative to its search potential.",
  top_tip: "Double down on the 'challenge' format: your Minecraft Hardcore and 24-hour content outperform everything else by 3×.",
  recommendations: [
    { title: "I Beat Every Souls Game Without Dying", reason: "Challenge format matches your best-performing content with high share value." },
    { title: "100 Day Minecraft Hardcore Speedrun", reason: "Combines your top two performing content types into a high-stakes series." },
    { title: "How I Grew to 100K: My Exact Strategy", reason: "Creator meta content drives massive search traffic and builds community trust." },
    { title: "I Played the #1 Game Every Month for a Year", reason: "Evergreen format with consistent search volume; easy to batch-produce." },
    { title: "Reacting to My Worst vs Best Videos", reason: "Low production overhead; generates strong comment engagement and builds authenticity." },
  ],
}

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

/* ─── Sentiment Donut (SVG placeholder — replace with Recharts) ─── */
function SentimentDonut() {
  const { positive_percent: pos, neutral_percent: neu, negative_percent: neg, avg_score } = DUMMY_SENTIMENT
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
            <circle key={i} cx="75" cy="75" r={R} fill="none" stroke={seg.color} strokeWidth={STROKE} strokeDasharray={seg.dashArray} strokeDashoffset={seg.dashOffset} strokeLinecap="butt" style={{ transform: 'rotate(-90deg)', transformOrigin: '75px 75px' }} />
          ))}
          <text x="75" y="70" textAnchor="middle" style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 20, fill: 'var(--text)' }}>+{avg_score.toFixed(2)}</text>
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
              <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Top Performing Videos ─── */
function TopVideos() {
  const RANK_COLORS = ['#E6B14C', '#B8B8C4', '#C68B5C']
  return (
    <div>
      <SectionHeading label="Performance" title="Top Performing Videos" sub="by view count" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {DUMMY_BEST.map((video, i) => (
          <div key={video.id} className="anim-card-in top-video-card" style={{ animationDelay: `${i * 80}ms`, borderRadius: 16, overflow: 'hidden', border: i === 0 ? '1px solid rgba(192,57,43,0.35)' : '1px solid var(--border)', background: 'var(--bg2)', boxShadow: i === 0 ? '0 4px 24px rgba(192,57,43,0.15)' : 'var(--shadow-sm)' }}>
            <div style={{ height: 160, overflow: 'hidden', position: 'relative', background: '#1a2a3a' }}>
              <div style={{ position: 'absolute', top: 10, left: 10, width: 28, height: 28, borderRadius: '50%', background: RANK_COLORS[i], color: '#1a1410', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-head)', fontSize: '14px', fontWeight: 700, boxShadow: '0 2px 10px rgba(0,0,0,0.35)' }}>{i + 1}</div>
              <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.55)', borderRadius: 5, padding: '2px 7px', fontSize: '11px', color: '#fff', fontWeight: 500 }}>{timeAgo(video.published_at)}</div>
            </div>
            <div style={{ padding: '14px 16px 16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', lineHeight: 1.4, marginBottom: 12 }}>{video.title}</div>
              <div style={{ display: 'flex', gap: 14, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                {[{ icon: <EyeIcon />, val: fmt(video.views), label: 'views' }, { icon: <HeartIcon />, val: fmt(video.likes), label: 'likes' }, { icon: <CommentIcon />, val: fmt(video.comments_count), label: 'comments' }].map(({ icon, val, label }) => (
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

/* ─── Video Card ─── */
function DashboardVideoCard({ video, isOpen, onToggle, delay = 0 }: { video: typeof DUMMY_VIDEOS[0]; isOpen: boolean; onToggle: () => void; delay?: number }) {
  const engRate = video.views > 0 ? ((video.likes / video.views) * 100).toFixed(1) : '0.0'
  return (
    <div className="anim-card-in video-card" style={{ animationDelay: `${delay}ms`, borderRadius: 14, overflow: 'hidden', border: isOpen ? '1px solid var(--accent)' : '1px solid var(--border)', background: 'var(--bg2)', boxShadow: isOpen ? '0 0 0 2px rgba(192,57,43,0.35)' : 'var(--shadow-sm)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 126, overflow: 'hidden', position: 'relative', background: '#1a2a3a' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--accent)"><path d="M5 3l14 9-14 9V3z" /></svg>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 7, right: 7, background: 'rgba(0,0,0,0.55)', borderRadius: 5, padding: '2px 7px', fontSize: '11px', color: '#fff', fontWeight: 500 }}>{timeAgo(video.published_at)}</div>
      </div>
      <div style={{ padding: '12px 14px 0', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', lineHeight: 1.45, marginBottom: 10 }}>{video.title}</div>
        <div style={{ display: 'flex', gap: 10, borderTop: '1px solid var(--border)', paddingTop: 10, marginBottom: 10, marginTop: 'auto' }}>
          {[{ icon: <EyeIcon />, val: fmt(video.views) }, { icon: <HeartIcon />, val: fmt(video.likes) }, { icon: <TrendIcon />, val: engRate + '%', highlight: parseFloat(engRate) > 3.5 }].map(({ icon, val, highlight }, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '12px', color: highlight ? 'var(--accent)' : 'var(--muted)', fontWeight: highlight ? 600 : 400 }}>{icon} {val}</div>
          ))}
        </div>
      </div>
      <button onClick={onToggle} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: '9px 14px', background: isOpen ? 'rgba(192,57,43,0.12)' : 'var(--bg3)', border: 'none', borderTop: '1px solid var(--border)', color: isOpen ? 'var(--accent)' : 'var(--muted)', fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', letterSpacing: '0.03em' }}>
        <SparkleIcon /> {isOpen ? 'Hide AI Insights' : 'Get AI Insights'}
      </button>
    </div>
  )
}

/* ─── Inline Insights Row (dummy) ─── */
function InsightsInlineRow({ video, onClose }: { video: typeof DUMMY_VIDEOS[0]; onClose: () => void }) {
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          {[
            { key: 'what_worked' as const, label: '✓ What Worked', color: 'var(--pos)', bg: 'rgba(94,176,124,0.07)', border: 'rgba(94,176,124,0.2)' },
            { key: 'improve' as const, label: '↑ What to Improve', color: 'var(--teal)', bg: 'rgba(76,168,184,0.07)', border: 'rgba(76,168,184,0.2)' },
            { key: 'next_idea' as const, label: '→ Next Content Idea', color: 'var(--accent)', bg: 'rgba(192,57,43,0.07)', border: 'rgba(192,57,43,0.2)' },
          ].map(({ key, label, color, bg, border }) => (
            <div key={key} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: '11px 13px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
              <p style={{ fontSize: '12.5px', color: 'var(--text2)', lineHeight: 1.6, margin: 0 }}>{DUMMY_INSIGHTS[key]}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── AI Recommendations (dummy) ─── */
function AIRecommendations() {
  const [shown, setShown] = useState(false)
  return (
    <div style={{ background: 'linear-gradient(135deg, rgba(192,57,43,0.07) 0%, rgba(255,255,255,0.03) 100%)', border: '1px solid rgba(192,57,43,0.2)', borderRadius: 20, padding: '36px 40px', boxShadow: '0 4px 32px rgba(192,57,43,0.08), var(--shadow-sm)', position: 'relative', overflow: 'hidden' }}>
      <svg aria-hidden="true" style={{ position: 'absolute', right: -40, top: '50%', transform: 'translateY(-50%)', opacity: 0.04, pointerEvents: 'none' }} width="360" height="360" viewBox="0 0 360 360">
        <circle cx="180" cy="180" r="170" stroke="white" strokeWidth="1" fill="none" />
        <circle cx="180" cy="180" r="130" stroke="white" strokeWidth="1" fill="none" />
        <circle cx="180" cy="180" r="90" stroke="white" strokeWidth="1" fill="none" />
        <circle cx="180" cy="180" r="50" stroke="white" strokeWidth="1" fill="none" />
      </svg>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: shown ? 28 : 0, flexWrap: 'wrap', gap: 16 }}>
        <div style={{ flex: '1 1 320px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><SparkleIcon /></div>
            <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '20px', letterSpacing: '-0.3px' }}>AI Recommendations</h2>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '13.5px', maxWidth: 400, lineHeight: 1.6 }}>GPT-4o analyzes your channel&apos;s performance data and generates personalized content strategy.</p>
        </div>
        <button onClick={() => setShown(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 11, background: 'var(--accent)', border: 'none', color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 20px rgba(192,57,43,0.4)', flexShrink: 0 }}>
          <SparkleIcon /> {shown ? 'Regenerate' : 'Get AI Recommendations'}
        </button>
      </div>
      {shown && (
        <div className="anim-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Channel Analysis</div>
            <p style={{ fontSize: '14.5px', color: 'var(--text2)', lineHeight: 1.75 }}>{DUMMY_RECS.channel_analysis}</p>
          </div>
          <div style={{ background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.25)', borderRadius: 12, padding: '16px 18px', display: 'flex', gap: 12 }}>
            <div style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }}><LightbulbIcon /></div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>Top Tip</div>
              <p style={{ fontSize: '14px', color: 'var(--text)', lineHeight: 1.65 }}>{DUMMY_RECS.top_tip}</p>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>5 Content Ideas</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
              {DUMMY_RECS.recommendations.map((idea, i) => (
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
function PreviousAnalyses() {
  const [expanded, setExpanded] = useState(false)
  const reversed = [...DUMMY_SNAPSHOTS].reverse()
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
      <button onClick={() => setExpanded(e => !e)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '18px 24px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: '15px' }}>Analysis History</span>
          <span style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 5, padding: '1px 8px', fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>{DUMMY_SNAPSHOTS.length} snapshots</span>
        </div>
        <div style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: 'var(--muted)' }}><ChevronDownIcon /></div>
      </button>
      {expanded && (
        <div className="anim-fade-up" style={{ borderTop: '1px solid var(--border)', animationDuration: '0.25s' }}>
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
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontFamily: 'var(--font-head)', fontWeight: 700, color: 'var(--text)' }}>+{row.avg_sentiment.toFixed(2)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text2)' }}>{fmt(row.total_comments)}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text2)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.top_video_title}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════ */
/* ─── MAIN DASHBOARD PAGE ─── */
/* ═══════════════════════════════════════════ */
export default function Dashboard() {
  const [activeCluster, setActiveCluster] = useState('All')
  const [openVideoId, setOpenVideoId] = useState<number | null>(null)
  const [dropOpen, setDropOpen] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => { document.documentElement.setAttribute('data-theme', 'dark') }, [])
  useEffect(() => { setOpenVideoId(null) }, [activeCluster])
  useEffect(() => {
    function handleClick(e: MouseEvent) { if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filteredVideos = activeCluster === 'All'
    ? DUMMY_VIDEOS
    : DUMMY_CLUSTERS.find(c => c.cluster_name === activeCluster)?.videos || []

  const gridItems: React.ReactNode[] = []
  filteredVideos.forEach((v, i) => {
    gridItems.push(<DashboardVideoCard key={v.id} video={v} delay={Math.min(i * 25, 240)} isOpen={openVideoId === v.id} onToggle={() => setOpenVideoId(openVideoId === v.id ? null : v.id)} />)
    if (openVideoId === v.id) gridItems.push(<InsightsInlineRow key={`ins-${v.id}`} video={v} onClose={() => setOpenVideoId(null)} />)
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <BgDecoration />

      {/* HEADER */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(12,14,20,0.88)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1320, margin: '0 auto', width: '100%', padding: '0 clamp(20px, 4vw, 60px)', height: 62, gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link href="/"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' rx='5' fill='%23c0392b'/%3E%3Cpolygon points='9,6 9,18 19,12' fill='white'/%3E%3C/svg%3E" alt="URTube" style={{ width: 28, height: 28, borderRadius: 4 }} /></Link>
            <div style={{ width: 1, height: 18, background: 'var(--border2)' }} />
            <span style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: '16px', color: 'var(--text)' }}>Dashboard</span>
          </div>
          <div style={{ position: 'relative' }} ref={dropRef}>
            <button onClick={() => setDropOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 34, padding: '0 12px', borderRadius: 9, border: '1px solid var(--border2)', background: dropOpen ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)', color: 'var(--text)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: '13.5px' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#fff' }}>A</div>
              {DUMMY_USER.first_name}
              <div style={{ transform: dropOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: 'var(--muted)' }}><ChevronDownIcon /></div>
            </button>
            {dropOpen && (
              <div className="user-dropdown" style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, minWidth: 180, background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 12, padding: '5px', boxShadow: 'var(--shadow-lg)', zIndex: 100 }}>
                <Link href="/publicmode" onClick={() => setDropOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 8, color: 'var(--text)', fontSize: '13.5px', fontWeight: 500, textDecoration: 'none' }}><span style={{ color: 'var(--muted)' }}><GlobeIcon /></span>Public Mode</Link>
                <Link href="/" onClick={() => setDropOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 8, color: 'var(--text)', fontSize: '13.5px', fontWeight: 500, textDecoration: 'none' }}><span style={{ color: 'var(--muted)' }}><HomeIcon /></span>Home</Link>
                <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                <button style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 11px', borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '13.5px', fontWeight: 500 }}><span style={{ color: 'var(--accent)' }}><LogoutIcon /></span>Logout</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main style={{ flex: 1, maxWidth: 1320, margin: '0 auto', width: '100%', padding: '40px clamp(20px, 4vw, 60px) 80px', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 56 }}>

        {/* Welcome */}
        <div className="anim-fade-up" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap', marginBottom: -24, background: 'linear-gradient(135deg, rgba(192,57,43,0.12) 0%, rgba(192,57,43,0.04) 100%)', border: '1px solid rgba(192,57,43,0.25)', borderRadius: 18, padding: '24px 28px', boxShadow: '0 4px 24px rgba(192,57,43,0.08)' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '26px', letterSpacing: '-0.5px', color: 'var(--text)', lineHeight: 1.2 }}>Welcome back, <span style={{ color: 'var(--accent)' }}>{DUMMY_USER.first_name}</span></h1>
            <p style={{ color: 'var(--text2)', fontSize: '14px', marginTop: 6 }}>30 videos · 2,847 comments analyzed</p>
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 26px', borderRadius: 12, background: 'var(--accent)', border: 'none', color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 20px rgba(192,57,43,0.45)', flexShrink: 0 }}>
            <RefreshIcon /> Re-analyze Channel
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          <StatCard label="Videos Analyzed" value="30" sub="from your channel" />
          <StatCard label="Total Comments" value={fmt(2847)} sub="across all videos" delay={60} />
          <StatCard label="Avg Sentiment Score" value="+0.34" sub="overall positive" delay={120} />
        </div>

        {/* Top Videos + Sentiment */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>
          <TopVideos />
          <div>
            <SectionHeading label="Audience" title="Sentiment Overview" sub={`${fmt(2847)} comments`} />
            <SentimentDonut />
          </div>
        </div>

        {/* Videos by Topic */}
        <div>
          <SectionHeading label="Content Library" title="Videos by Topic" />
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 20 }}>
            {[{ name: 'All', count: 30 }, ...DUMMY_CLUSTERS.map(c => ({ name: c.cluster_name!, count: c.videos.length }))].map(({ name, count }) => {
              const active = activeCluster === name
              return (
                <button key={name} className="tab-btn" onClick={() => setActiveCluster(name)} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: active ? '1px solid var(--accent)' : '1px solid var(--border)', background: active ? 'rgba(192,57,43,0.12)' : 'var(--bg2)', color: active ? 'var(--accent)' : 'var(--muted)', fontFamily: 'var(--font-body)', fontWeight: active ? 600 : 500, fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {name} <span style={{ background: active ? 'var(--accent)' : 'var(--bg3)', color: active ? '#fff' : 'var(--muted)', borderRadius: 5, padding: '1px 7px', fontSize: '11px', fontWeight: 700 }}>{count}</span>
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
          <AIRecommendations />
        </div>

        {/* History */}
        <PreviousAnalyses />
      </main>

      <Footer />
    </div>
  )
}
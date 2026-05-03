// 'use client'

// import { useEffect, useState } from 'react'

// interface Video{
//   id: number
//   youtube_video_id: string
//   title: string
//   thumbnail_url: string
//   views: number
//   likes: number
//   comments_count: number
//   published_at: string
// }

// interface Trending{
//     title: string
//     views: number,
//     likes: number,
//     comments_count: number,
// }

// interface Engagement{
//     avg_views: number,
//     avg_likes: number,
//     avg_engagement_percent: number,
//     total_comments: number,
// }

// interface PublicResult {
//     query: string,
//     total_results: number,
//     videos: Video[],
//     trending_titles: Trending[],
//     engagement: Engagement,
// }

// export default function PublicMode() {
//     const [query, setQuery] = useState('')
//     const [loading , setLoading] = useState(false)
//     const [error, setError] = useState('')
//     const [results, setResult] = useState<PublicResult | null>(null)

    
//     async function handleSearch() {
//         if(!query.trim()) return
//         setLoading(true)
//         setError('')

//         const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/research/`,{
//             method: 'POST',
//             headers: {
//                 'Content-Type' : 'application/json',
//             },
//             body: JSON.stringify({ query }),
//         })

//         if (!response.ok) {
//             setError('No results found.')
//             setLoading(false)
//             return
//         }

//         const data = await response.json()
//         setResult(data)
//         setLoading(false)
//     }

//     if (loading) return <p>Searching...</p>
//     if (error) return <p>Error: {error}</p>
//     return(
//          <div>
//       <h1>Public Research</h1>
//       <div>
//         <input
//           type="text"
//           value={query}
//           onChange={(e) => setQuery(e.target.value)}
//           placeholder="Search any YouTube topic..."
//         />
//         <button onClick={handleSearch} disabled={loading}>
//           {loading ? 'Searching...' : 'Search'}
//         </button>
//       </div>
//       {error && <p>{error}</p>}

//       {results && (
//         <div>
//           <h2>Results for "{results.query}" ({results.total_results} videos)</h2>

//           <div>
//             <h3>Engagement Stats</h3>
//             <p>Avg Views: {results.engagement.avg_views}</p>
//             <p>Avg Likes: {results.engagement.avg_likes}</p>
//             <p>Engagement Rate: {results.engagement.avg_engagement_percent}%</p>
//             <p>Total Comments: {results.engagement.total_comments}</p>
//           </div>

//           <div>
//             <h3>Top 10 Trending Titles</h3>
//             <ol>
//               {results.trending_titles.map((t, i) => (
//                 <li key={i}>
//                   {t.title} — {t.views} views | {t.likes} likes | {t.comments_count} comments
//                 </li>
//               ))}
//             </ol>
//           </div>

//           <div>
//             <h3>All Videos</h3>
//             <ul>
//               {results.videos.map((video) => (
//                 <li key={video.youtube_video_id}>
//                   <img src={video.thumbnail_url} alt={video.title} width={120} />
//                   <div>
//                     <strong>{video.title}</strong>
//                     <p>Views: {video.views} | Likes: {video.likes} | Comments: {video.comments_count}</p>
//                     <p>Published: {new Date(video.published_at).toLocaleDateString()}</p>
//                   </div>
//                 </li>
//               ))}
//             </ul>
//           </div>
//         </div>
//       )}

//     </div>
//     )
// }

'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { BgDecoration, Footer, StatCard, SearchIcon, EyeIcon, HeartIcon, CommentIcon, TrendIcon, GlobeIcon, ArrowLeftIcon, fmt, timeAgo } from '@/components/ui'

/* ─── Types ─── */
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

interface VideoResult {
  youtube_video_id: string
  title: string
  thumbnail_url: string
  views: number
  likes: number
  comments_count: number
  published_at: string
  description: string
}

interface PublicResult {
  query: string
  total_videos: number
  videos: VideoResult[]
  trending_titles: TrendingTitle[]
  engagement: Engagement
}

/* ─── Trending Row ─── */
function TrendingRow({ rank, title, delay = 0 }: { rank: number; title: TrendingTitle; delay?: number }) {
  return (
    <div className="anim-card-in trend-row" style={{ animationDelay: `${delay}ms`, display: 'flex', alignItems: 'center', gap: '14px', padding: '11px 14px', borderRadius: '10px', background: 'transparent', border: '1px solid transparent', cursor: 'default' }}>
      <div style={{ width: 30, height: 30, borderRadius: 7, flexShrink: 0, background: rank <= 3 ? 'var(--accent)' : 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '12px', color: rank <= 3 ? '#fff' : 'var(--muted)' }}>{rank}</div>
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
    <a href={`https://www.youtube.com/watch?v=${video.youtube_video_id}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
      <div className="anim-card-in video-card" style={{ animationDelay: `${delay}ms`, borderRadius: '14px', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg2)', boxShadow: 'var(--shadow-sm)', cursor: 'pointer' }}>
        <div style={{ height: '126px', overflow: 'hidden', position: 'relative' }}>
          {video.thumbnail_url ? (
            <img src={video.thumbnail_url} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} className="thumb-img" />
          ) : (
            <div className="thumb-img" style={{ position: 'absolute', inset: 0, background: '#e8d5c4' }} />
          )}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--accent)"><path d="M5 3l14 9-14 9V3z" /></svg>
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: 7, right: 7, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', borderRadius: 5, padding: '2px 7px', fontSize: '11px', color: '#fff', fontWeight: 500 }}>{timeAgo(video.published_at)}</div>
        </div>
        <div style={{ padding: '12px 14px 14px' }}>
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', lineHeight: 1.45, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>{video.title}</div>
          <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
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
    </a>
  )
}

/* ─── Main Page ─── */
export default function PublicMode() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PublicResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark')
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  const doSearch = useCallback(async () => {
    if (!query.trim()) return
    setLoading(true)

    /* TODO: Connect to backend */
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/research/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    })
    const data = await response.json()
    setResults(data)
    setLoading(false)
  }, [query])

  const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') doSearch() }

  const clearSearch = () => {
    setResults(null)
    setQuery('')
    setTimeout(() => inputRef.current?.focus(), 50)
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
        </div>
      </header>

      <main style={{ flex: 1, maxWidth: 1320, margin: '0 auto', width: '100%', padding: '0 clamp(20px, 4vw, 60px)', position: 'relative', zIndex: 1 }}>

        {/* Page title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 36, paddingTop: 20 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)', textDecoration: 'none', fontSize: '14px', fontWeight: 500, transition: 'color 0.15s' }}>
            <ArrowLeftIcon /> Back
          </Link>
          <div style={{ width: 1, height: 18, background: 'var(--border2)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <GlobeIcon />
            <span style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: '17px', color: 'var(--text)' }}>Public Research Mode</span>
          </div>
        </div>

        {/* Search bar */}
        <div style={{ marginBottom: results ? 44 : 80 }}>
          <div className="search-input" style={{ display: 'flex', alignItems: 'center', background: 'var(--glass-search-bg)', backdropFilter: 'blur(16px)', border: `1.5px solid ${focused ? 'var(--accent)' : 'rgba(255,255,255,0.9)'}`, borderRadius: '14px', boxShadow: '0 4px 24px rgba(0,0,0,0.07)', transition: 'all 0.2s ease', overflow: 'hidden', maxWidth: 700 }}>
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
              {loading ? <div style={{ width: 17, height: 17, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 0.7s linear infinite' }} /> : 'Search'}
            </button>
          </div>

          {results && (
            <div style={{ marginTop: 10, display: 'flex', gap: 14 }}>
              <button onClick={doSearch} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}>Re-run</button>
              <button onClick={clearSearch} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}>Clear results</button>
            </div>
          )}

          {!results && (
            <>
              <p style={{ marginTop: 14, color: 'var(--muted)', fontSize: '14px' }}>Search any topic to explore YouTube trends, engagement rates, and top videos — no login required.</p>
              <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['python tutorial', 'react.js', 'vlog 2025', 'AI tools', 'fitness routine', 'study with me'].map(s => (
                  <button key={s} onClick={() => setQuery(s)} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 100, padding: '5px 14px', fontSize: '13px', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.15s', boxShadow: 'var(--shadow-sm)' }}>{s}</button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Results */}
        {results && (
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
        )}
      </main>

      <Footer />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

/* Shared UI components for URTube */
/* Used by: homepage, public mode, dashboard */

import { useState } from 'react'

/* ─── Formatting helpers ─── */
export const fmt = (n: number) =>
  n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1000 ? (n / 1000).toFixed(0) + 'K' : n.toString()

export const timeAgo = (dateStr: string) => {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.round(days / 7)}w ago`
  if (days < 365) return `${Math.round(days / 30)}mo ago`
  return `${Math.round(days / 365)}y ago`
}

/* ─── Icons ─── */
export const SearchIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
)
export const GoogleIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
)
export const EyeIcon = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
)
export const HeartIcon = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
)
export const CommentIcon = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)
export const TrendIcon = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
  </svg>
)
export const SparkleIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
  </svg>
)
export const GlobeIcon = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
)
export const UserIcon = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
)
export const LogoutIcon = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)
export const ArrowLeftIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
)
export const ArrowRightIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
)

/* ─── Background Decoration ─── */
export function BgDecoration() {
  return (
    <div aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-10%', right: '-8%', width: 600, height: 600, borderRadius: '50%', background: 'rgba(192,57,43,0.22)', filter: 'blur(90px)' }} />
      <div style={{ position: 'absolute', bottom: '-12%', left: '-6%', width: 500, height: 500, borderRadius: '50%', background: 'oklch(0.32 0.08 220 / 0.14)', filter: 'blur(80px)' }} />
      <div style={{ position: 'absolute', top: '40%', left: '35%', width: 380, height: 380, borderRadius: '50%', background: 'oklch(0.35 0.1 160 / 0.1)', filter: 'blur(100px)' }} />
    </div>
  )
}

/* ─── Glass Button ─── */
export function GlassBtn({ children, onClick, style = {}, title }: {
  children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties; title?: string
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '0 14px', height: 36, borderRadius: 10,
        border: '1px solid var(--border2)',
        background: hovered ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.22)',
        backdropFilter: 'blur(12px)',
        color: 'var(--text)', cursor: 'pointer',
        fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: '13.5px',
        transition: 'all 0.18s ease',
        boxShadow: hovered
          ? '0 4px 12px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.9)'
          : '0 1px 4px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.5)',
        transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
        whiteSpace: 'nowrap',
        ...style,
      }}>
      {children}
    </button>
  )
}

/* ─── Stat Card ─── */
export function StatCard({ label, value, sub, delay = 0 }: {
  label: string; value: string; sub?: string; delay?: number
}) {
  return (
    <div className="anim-card-in stat-card" style={{ animationDelay: `${delay}ms`, flex: 1, minWidth: 0, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '18px 22px', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ color: 'var(--muted)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '28px', color: 'var(--text)', lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ color: 'var(--teal)', fontSize: '12px', marginTop: 5, fontWeight: 500 }}>{sub}</div>}
    </div>
  )
}

/* ─── Footer ─── */
export function Footer() {
  return (
    <footer style={{ position: 'relative', zIndex: 1, borderTop: '1px solid var(--border)', padding: '20px 40px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--bg2)', transition: 'background 0.3s ease' }}>
      {/* TODO: Replace with your name */}
      <span style={{ color: 'var(--muted)', fontSize: '13px' }}>Built by <span style={{ color: 'var(--text)', fontWeight: 500 }}>Your Name</span></span>
      <span style={{ color: 'var(--border2)' }}>·</span>
      <span style={{ color: 'var(--muted)', fontSize: '13px' }}>CS Master&apos;s Project</span>
      <span style={{ color: 'var(--border2)' }}>·</span>
      <span style={{ color: 'var(--muted)', fontSize: '13px' }}>2025</span>
    </footer>
  )
}
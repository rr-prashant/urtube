'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Clear error params from URL if present
    const error = searchParams.get('error')
    if (error) {
      router.replace('/', { scroll: false })
    }

    async function getUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    getUser()
  }, [searchParams, router])

  async function signIn() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'https://www.googleapis.com/auth/youtube.readonly',
        queryParams: {
          prompt: 'select_account',
        },
      },
    })
  }

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()

    // Clear all Supabase cookies
    document.cookie.split(';').forEach(cookie => {
      const name = cookie.split('=')[0].trim()
      if (name.startsWith('sb-')) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
      }
    })
    setUser(null)
    router.refresh()
  }

  if (loading) return <p>Loading...</p>

  return (
    <div style={{ padding: '20px' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          {user && <span>Welcome {user.user_metadata?.full_name || user.email}</span>}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {user ? (
            <>
              <Link href="/dashboard">
                <button type="button">Dashboard</button>
              </Link>
              <button onClick={signOut}>Log out</button>
            </>
          ) : (
            <button onClick={signIn}>Log in with Google</button>
          )}
          <Link href="/publicmode">
                <button type="button">Public Mode</button>
          </Link>
        </div>
      </nav>
    </div>
  )
}
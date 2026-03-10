import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const signIn = async () => {
    'use server'
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        scopes:'https://www.googleapis.com/auth/youtube.readonly',
      },
    })
    
    if (data.url) {
      redirect(data.url)
    }
  }

  const signOut = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/')
  }

  return (
    <div style={{ padding: '20px' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          {user && <span>Welcome {user.user_metadata?.full_name || user.email}</span>}
        </div>
        <div>
          {user ? (
            <>
             <Link href="/dashboard">
                <button type="button">Dashboard</button>
              </Link>
            <form action={signOut}>
              <button type="submit">Log out</button>
            </form>
            </>
          ) : (
            <form action={signIn}>
              <button type="submit">Log in with Google</button>
            </form>
          )}
        </div>
      </nav>
    </div>
  )
}
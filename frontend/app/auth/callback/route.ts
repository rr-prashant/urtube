import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  // If no code, just redirect home (don't process error callbacks)
  if (!code) {
    return NextResponse.redirect(`${origin}${next}`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  
  if (!error) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: { session } } = await supabase.auth.getSession()
      
      const supabaseToken = session?.access_token
      const googleAccessToken = session?.provider_token

      const syncResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sync-user/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseToken}`
        },
        body: JSON.stringify({
          sub: user.user_metadata.sub,
          email: user.email,
          full_name: user.user_metadata.full_name,
          picture: user.user_metadata.picture,
          email_verified: user.user_metadata.email_verified,
          google_access_token: googleAccessToken,
        })
      })

      const syncData = await syncResponse.json()

      if (!syncData.is_analyzed) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fetch-videos/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseToken}`
          }
        })
      }
    }
  }
  
  return NextResponse.redirect(`${origin}${next}`)
}
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user){
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sync-user/`,{
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            sub: user.user_metadata.sub,
            email: user.email,
            full_name: user.user_metadata.full_name,
            picture: user.user_metadata.picture,
            email_verified: user.user_metadata.email_verified,
        })
      } )
      }
      
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
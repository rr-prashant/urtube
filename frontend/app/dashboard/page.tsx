'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

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

interface UserData {
  email: string
  first_name: string
  picture: string
  is_analyzed: boolean
}

export default function Dashboard() {
  const [user, setUser] = useState<UserData | null>(null)
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function initDashboard() {
      const supabase = createClient()
      
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setError('Not logged in')
        setLoading(false)
        return
      }

      const { data: { user: authUser } } = await supabase.auth.getUser()

      // Sync user first
      const syncResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sync-user/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          sub: authUser?.user_metadata.sub,
          email: authUser?.email,
          full_name: authUser?.user_metadata.full_name,
          picture: authUser?.user_metadata.picture,
          email_verified: authUser?.user_metadata.email_verified,
          google_access_token: session.provider_token,
        })
      })

      const syncData = await syncResponse.json()

      // Fetch videos if not analyzed
      if (!syncData.is_analyzed) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fetch-videos/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })
      }

      // Get videos
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/get-videos/`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        setError('Failed to fetch videos')
        setLoading(false)
        return
      }

      const data = await response.json()
      setUser(data.user)
      setVideos(data.videos)
      setLoading(false)
    }

    initDashboard()
  }, [])

  async function handleReanalyze() {
    setLoading(true)
    const supabase = createClient()
    
    const { data: { session } } = await supabase.auth.getSession()
    
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fetch-videos/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session?.access_token}`
      }
    })

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/get-videos/`, {
      headers: {
        'Authorization': `Bearer ${session?.access_token}`
      }
    })
    const data = await response.json()
    setUser(data.user)
    setVideos(data.videos)
    setLoading(false)
  }

  if (loading) return <p>Loading...</p>
  if (error) return <p>Error: {error}</p>

  return (
    <div>
      <h1>Dashboard</h1>
      
      <div>
        <h2>User Info</h2>
        <p>Name: {user?.first_name}</p>
        <p>Email: {user?.email}</p>
        {user?.picture && <img src={user.picture} alt="Profile" width={100} />}
      </div>

      <div>
        <h2>Videos ({videos.length})</h2>
        <button onClick={handleReanalyze}>Re-analyze Channel</button>
      </div>

      <ul>
        {videos.map((video) => (
          <li key={video.youtube_video_id}>
            <img src={video.thumbnail_url} alt={video.title} width={120} />
            <div>
              <strong>{video.title}</strong>
              <p>Views: {video.views} | Likes: {video.likes} | Comments: {video.comments_count}</p>
              <p>Published: {new Date(video.published_at).toLocaleDateString()}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
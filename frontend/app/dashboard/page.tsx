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
  name: string
  picture: string
  is_analyzed: boolean
}

export default function Dashboard() {
  const [user, setUser] = useState<UserData | null>(null)
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchVideos() {
      const supabase = createClient()
      
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setError('Not logged in')
        setLoading(false)
        return
      }

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

    fetchVideos()
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
        <p>Name: {user?.name}</p>
        <p>Email: {user?.email}</p>
        <p>Picture URL: {user?.picture}</p>
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
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

interface Sentiment {
  avg_score: number
  positive_percent: number
  neutral_percent: number
  negative_percent: number
  total_comments: number
  video_count: number
}

interface Cluster {
  id: number
  cluster_label: number
  cluster_name: string | null
  avg_views: number
  avg_engagement: number
  videos: Video[]
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


export default function Dashboard() {
  const [user, setUser] = useState<UserData | null>(null)
  const [videos, setVideos] = useState<Video[]>([])
  const [bestVideos, setBestVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [sentiment, setSentiment] = useState<Sentiment | null>(null)
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [snapshots, setSnapshot] = useState<Snapshot[]>([])
  const [activeTab, setActiveTab] = useState<string>('all')
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
          'Authorization': `Bearer ${session?.access_token}`
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
            'Authorization': `Bearer ${session?.access_token}`
          }
        })
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fetch-comments/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
    })
      }

      // Get videos
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/get-videos/`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })

      if (!response.ok) {
        setError('Failed to fetch videos')
        setLoading(false)
        return
      }


      // get clusters
      const clusterResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/get-clusters/`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
      const clusterData = await clusterResponse.json()
      setClusters(clusterData.clusters)

      if (!clusterResponse.ok) {
        setError('Failed to fetch clusters')
        setLoading(false)
        return
      }
      
      const data = await response.json()
      setSentiment(data.sentiment)
      setUser(data.user)
      setVideos(data.videos)
      setBestVideos(data.best_videos)
      setSnapshot(data.snapshots || [])
      setLoading(false)
    }

    initDashboard()
  }, [])

  async function handleReanalyze() {
    setLoading(true)
    const supabase = createClient()
    
    const { data: { session } } = await supabase.auth.getSession()
    
    // fetching videos after re-analysis
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fetch-videos/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session?.access_token}`
      }
    })

    // fetching comments after re-analysis
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fetch-comments/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
    })

    // getting videos after re-analysis
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/get-videos/`, {
      headers: {
        'Authorization': `Bearer ${session?.access_token}`
      }
    })

    // getting clusters after re-analysis
    const clusterResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/get-clusters/`, {
      headers: { 'Authorization': `Bearer ${session?.access_token}` }
    })


    const clusterData = await clusterResponse.json()
    setClusters(clusterData.clusters)
    const data = await response.json()
    setSentiment(data.sentiment)
    setUser(data.user)
    setVideos(data.videos)
    setBestVideos(data.best_videos)
    setSnapshot(data.snapshots || [])
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
      {sentiment && (
        <div>
          <h2>Sentiment Analysis</h2>
          <p>Total Comments Analyzed: {sentiment.total_comments}</p>
          <p>Average Score: {sentiment.avg_score}</p>
          <p>Positive: {sentiment.positive_percent}%</p>
          <p>Neutral: {sentiment.neutral_percent}%</p>
          <p>Negative: {sentiment.negative_percent}%</p>
        </div>
      )}

        {snapshots.length > 0 ? (
          <div>
            <h2>Previous Analyses</h2>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Positive</th>
                  <th>Neutral</th>
                  <th>Negative</th>
                  <th>Avg Score</th>
                  <th>Comments</th>
                  <th>Top Video</th>
                </tr>
              </thead>
              <tbody>
                {[...snapshots].reverse().map((snap, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{new Date(snap.created_at).toLocaleDateString()}</td>
                    <td>{snap.positive_percent}%</td>
                    <td>{snap.neutral_percent}%</td>
                    <td>{snap.negative_percent}%</td>
                    <td>{snap.avg_sentiment}</td>
                    <td>{snap.total_comments}</td>
                    <td>{snap.top_video_title || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No previous analyses yet. Re-analyze to start tracking changes.</p>
        )}
      {bestVideos && bestVideos.length > 0 && (
        <div>
          <h2>Top Performing Videos</h2>
          <ol>
            {bestVideos.map((video: Video) => (
              <li key={video.youtube_video_id}>
                {video.title} — {video.views} views
              </li>
            ))}
          </ol>
        </div>
      )}

      <div>
        <h2>Videos</h2>
        <div>
          <button onClick={() => setActiveTab('all')} style={{ fontWeight: activeTab === 'all' ? 'bold' : 'normal' }}>
            All ({videos.length})
          </button>
          {clusters.map((cluster) => (
            <button
              key={cluster.id}
              onClick={() => setActiveTab(String(cluster.cluster_label))}
              style={{ fontWeight: activeTab === String(cluster.cluster_label) ? 'bold' : 'normal' }}
            >
              Cluster {cluster.cluster_label} ({cluster.videos.length})
            </button>
          ))}
        </div>
        <ul>
          {(activeTab === 'all'
            ? videos
            : clusters.find(c => String(c.cluster_label) === activeTab)?.videos || []
          ).map((video) => (
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

      
    </div>
  )
}
'use client'

import { useEffect, useState } from 'react'

interface Video{
  id: number
  youtube_video_id: string
  title: string
  thumbnail_url: string
  views: number
  likes: number
  comments_count: number
  published_at: string
}

interface Trending{
    title: string
    views: number,
    likes: number,
    comments_count: number,
}

interface Engagement{
    avg_views: number,
    avg_likes: number,
    avg_engagement_percent: number,
    total_comments: number,
}

interface PublicResult {
    query: string,
    total_results: number,
    videos: Video[],
    trending_titles: Trending[],
    engagement: Engagement,
}

export default function PublicMode() {
    const [query, setQuery] = useState('')
    const [loading , setLoading] = useState(false)
    const [error, setError] = useState('')
    const [results, setResult] = useState<PublicResult | null>(null)

    
    async function handleSearch() {
        if(!query.trim()) return
        setLoading(true)
        setError('')

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/research/`,{
            method: 'POST',
            headers: {
                'Content-Type' : 'application/json',
            },
            body: JSON.stringify({ query }),
        })

        if (!response.ok) {
            setError('No results found.')
            setLoading(false)
            return
        }

        const data = await response.json()
        setResult(data)
        setLoading(false)
    }

    if (loading) return <p>Searching...</p>
    if (error) return <p>Error: {error}</p>
    return(
         <div>
      <h1>Public Research</h1>
      <div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search any YouTube topic..."
        />
        <button onClick={handleSearch} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>
      {error && <p>{error}</p>}

      {results && (
        <div>
          <h2>Results for "{results.query}" ({results.total_results} videos)</h2>

          <div>
            <h3>Engagement Stats</h3>
            <p>Avg Views: {results.engagement.avg_views}</p>
            <p>Avg Likes: {results.engagement.avg_likes}</p>
            <p>Engagement Rate: {results.engagement.avg_engagement_percent}%</p>
            <p>Total Comments: {results.engagement.total_comments}</p>
          </div>

          <div>
            <h3>Top 10 Trending Titles</h3>
            <ol>
              {results.trending_titles.map((t, i) => (
                <li key={i}>
                  {t.title} — {t.views} views | {t.likes} likes | {t.comments_count} comments
                </li>
              ))}
            </ol>
          </div>

          <div>
            <h3>All Videos</h3>
            <ul>
              {results.videos.map((video) => (
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
      )}

    </div>
    )
}
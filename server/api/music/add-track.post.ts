import { diceRoomStore } from '~/server/utils/diceRoomStore'
import { authenticateUser } from '~/server/utils/auth'

// Helper function to extract YouTube video ID from URL
function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }
  
  return null
}

// Helper function to fetch YouTube video metadata using YouTube Data API v3
async function getYouTubeMetadata(videoId: string) {
  try {
    // Check if YouTube API key is configured
    const apiKey = process.env.YOUTUBE_API_KEY
    
    if (apiKey) {
      // Use YouTube Data API v3 for proper metadata extraction
      const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet,contentDetails`
      
      const response = await fetch(apiUrl)
      const data = await response.json()
      
      if (data.items && data.items.length > 0) {
        const video = data.items[0]
        const snippet = video.snippet
        const contentDetails = video.contentDetails
        
        // Parse ISO 8601 duration (PT4M13S) to seconds
        const duration = parseDuration(contentDetails.duration)
        
        return {
          title: snippet.title,
          artist: snippet.channelTitle,
          duration: duration,
          thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
          publishedAt: snippet.publishedAt,
          description: snippet.description?.substring(0, 500) + (snippet.description?.length > 500 ? '...' : ''),
          tags: snippet.tags?.slice(0, 5) || [] // Limit to first 5 tags
        }
      }
    }
    
    // Fallback: Basic scraping approach (less reliable but doesn't require API key)
    return await getYouTubeMetadataFallback(videoId)
    
  } catch (error) {
    console.error('Failed to fetch YouTube metadata with API, using fallback:', error)
    return await getYouTubeMetadataFallback(videoId)
  }
}

// Helper function to parse YouTube duration format (PT4M13S) to seconds
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 180 // Default 3 minutes
  
  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')  
  const seconds = parseInt(match[3] || '0')
  
  return hours * 3600 + minutes * 60 + seconds
}

// Fallback metadata extraction (basic approach)
async function getYouTubeMetadataFallback(videoId: string) {
  try {
    // This is a simplified approach - in practice you might want to scrape or use other methods
    // For now, return enhanced basic metadata
    return {
      title: `YouTube Video`,
      artist: `YouTube Channel`,
      duration: 180, // Default 3 minutes
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      publishedAt: new Date().toISOString(),
      description: 'YouTube video content',
      tags: []
    }
  } catch (error) {
    console.error('Failed to fetch YouTube metadata:', error)
    return {
      title: 'Unknown YouTube Video',
      artist: 'Unknown Channel',
      duration: 180,
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      publishedAt: new Date().toISOString(),
      description: 'Unable to fetch video details',
      tags: []
    }
  }
}

export default defineEventHandler(async (event) => {
  try {
    // Authenticate user
    const user = await authenticateUser(event)
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'User not authenticated'
      })
    }

    // Parse request body
    const body = await readBody(event)
    const { roomCode, url, playImmediately = false } = body

    if (!roomCode || !url) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: roomCode, url'
      })
    }

    // Validate YouTube URL
    const videoId = getYouTubeVideoId(url)
    if (!videoId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid YouTube URL'
      })
    }

    // Get YouTube metadata
    const metadata = await getYouTubeMetadata(videoId)

    // Add track to playlist with enhanced metadata
    const track = diceRoomStore.addTrackToPlaylist(roomCode, user.id, {
      name: metadata.title,
      title: metadata.title,
      artist: metadata.artist,
      url,
      duration: metadata.duration,
      thumbnail: metadata.thumbnail,
      publishedAt: metadata.publishedAt,
      description: metadata.description,
      tags: metadata.tags
    })

    // If playImmediately is true, start playing the track
    if (playImmediately) {
      diceRoomStore.playTrack(roomCode, user.id, track.id)
    }

    console.log(`🎵 Track "${metadata.title}" added to room ${roomCode} by ${user.username}${playImmediately ? ' and playing' : ''}`)

    return {
      success: true,
      message: playImmediately ? 'Track added and playing' : 'Track added to playlist',
      track
    }

  } catch (error: any) {
    console.error('Error adding track:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal server error'
    })
  }
})
# YouTube Data API v3 Integration

The music system now supports enhanced metadata extraction using YouTube Data API v3.

## Setup (Optional)

The system works with or without the YouTube API key, but providing one gives you access to better metadata including:

- Accurate video titles and channel names
- Video thumbnails
- Video duration
- Video tags and descriptions
- Publish dates

### Getting a YouTube API Key

1. Go to the [Google Cloud Console](https://console.developers.google.com/)
2. Create a new project or select an existing one
3. Enable the YouTube Data API v3
4. Go to "Credentials" and create an API key
5. Add your API key to the `.env` file:

```bash
YOUTUBE_API_KEY=your-youtube-api-key-here
```

### Without API Key

If no API key is provided, the system falls back to basic metadata extraction with:
- Generic titles
- YouTube thumbnails (from img.youtube.com)
- Default duration estimates

## Features

### Enhanced Metadata Display

- **Thumbnails**: Video thumbnails are displayed in both current track and playlist views
- **Duration**: Shows accurate video duration in MM:SS format
- **Tags**: Displays relevant video tags
- **Channel Info**: Shows the channel name as the artist

### Fade Transitions

- **Track Switching**: Smooth fade out/in when changing tracks
- **Volume Changes**: Gradual volume adjustments for large changes
- **Play/Pause**: Subtle fade effects when starting/stopping playback
- **Configurable**: Adjust fade durations in the UI or disable entirely

### Real-time Synchronization

- All metadata and playback changes are synchronized across all connected clients
- SSE (Server-Sent Events) ensure instant updates for all participants
- DM controls vs participant view-only mode

## Technical Implementation

### Backend (`server/api/music/add-track.post.ts`)

- YouTube Data API v3 integration with fallback
- Enhanced `MusicTrack` interface with metadata fields
- Duration parsing from ISO 8601 format (PT4M13S)
- Error handling and graceful degradation

### Frontend (`pages/dice.vue`)

- Enhanced UI with thumbnails and metadata display
- Configurable fade transition system
- Utility functions for duration formatting
- Responsive design for various track information

## Configuration

The fade transition system can be configured in the UI:

- **Enable/Disable**: Toggle smooth fades on/off
- **Track Switch Duration**: Time for fade out/in during track changes (100-2000ms)
- **Volume Change Duration**: Time for volume transitions (100-1000ms)  
- **Play/Pause Duration**: Time for play/pause fades (100-1000ms)

## API Rate Limits

The YouTube Data API v3 has usage quotas:
- Free tier: 10,000 units per day
- Each video metadata request costs ~3 units
- Consider caching metadata for frequently added tracks
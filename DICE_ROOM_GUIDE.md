# D&D Character Manager - Enhanced Dice Room Testing Guide

## 🎲 Real-time Collaborative Dice Room with Server-Sent Events (SSE)

The dice room features beautiful animated dice with custom designs, including the special d36! The system now uses **Server-Sent Events (SSE)** for real-time collaboration, providing superior production compatibility.

### 🚀 Environment Support

**✅ All Environments** (localhost, Vercel, Netlify, etc.)
- **SSE-based real-time collaboration** with native browser EventSource API
- Multiple users can roll together and see each other's results instantly
- **No external server required** - runs entirely on your Nuxt/Nitro server
- **Production-ready** - works seamlessly on Vercel, Netlify, and all hosting platforms

**✅ Automatic Fallback**
- Graceful offline mode if SSE connection fails
- All animations and features work independently
- Yellow banner indicates offline mode to users
- **Automatic 5-minute timeout** - Inactive users are automatically removed after 5 minutes of inactivity

### New Features Added ✨

**🎨 Custom Dice Designs**
- Each dice type has its own color scheme matching your image reference:
  - 🔺 D4 (Blue) - Triangle symbol
  - ⬛ D6 (Green) - Square symbol  
  - ♦ D8 (Purple) - Diamond symbol
  - 🔟 D10 (Pink) - Circle with 10
  - ⬟ D12 (Red) - Dodecagon symbol
  - ● D20 (Orange) - Circle symbol
  - ⬢ D36 (Cyan) - Hexagon symbol ⭐ **NEW!**
  - 💯 D100 (Green) - Percentage symbol

**🎯 Enhanced Animations**
- Dice spin and bounce when selected
- Dramatic rolling animations with staggered effects
- Pulsing effects during rolls
- Scale animations on hover
- Special critical hit detection for d36 (1 and 36)

**⚡ Improved User Experience**
- Longer, more dramatic rolling animation (1.5 seconds)
- Enhanced visual feedback
- Colored dice counters matching each die type
- Smooth transitions and transforms
- **NEW**: Automatic environment detection and offline fallback

### 🛠️ Development Setup

**Single Server Setup** (Much Simpler!)
1. **Start the Nuxt Application**:
   ```bash
   npm run dev
   ```
   This starts the web application with built-in SSE endpoints on port 3000.

2. **Access the Dice Room**: Open http://localhost:3000/dice

3. **Test Real-time Features**: Open multiple browser tabs to test collaboration

### 🌐 Production Deployment

**Simple Deployment** (No additional setup required!)
1. Push your code to your repository
2. Connect to Vercel, Netlify, or any hosting platform
3. Deploy automatically - dice room works with full real-time collaboration!

**Why SSE is Better for Production:**
- ✅ **Native Browser Support**: Uses built-in EventSource API
- ✅ **HTTP-based**: Works through firewalls and proxies
- ✅ **Server Integration**: Runs directly on your Nuxt/Nitro server
- ✅ **No External Dependencies**: No separate WebSocket server needed
- ✅ **Automatic Scaling**: Scales with your hosting platform
- ✅ **Smart Cleanup**: Automatic 5-minute user timeout for inactive users

### Testing the Enhanced Dice Room

**Development Testing**:
1. **Access the Dice Room**: Open http://localhost:3000/dice
2. **Test Real-time Features**: Open multiple browser tabs to test SSE collaboration
3. **Test the New D36**: Click the cyan hexagon dice to add d36 rolls
4. **Verify Connection**: Should show "Connected" status with user count

**Production Testing**:
1. **Access Deployed App**: Visit your Vercel/Netlify URL + `/dice`
2. **Verify Real-time**: Should show "Connected" status with full SSE functionality
3. **Test Multi-user**: Share the URL to test collaborative rolling
4. **Fallback Testing**: If SSE fails, should gracefully fall back to offline mode

### 🎯 Testing Checklist

**✅ Visual Features**
- Click any dice to see bounce and color animations
- Dice symbols change color when selected
- Counters appear with matching dice colors
- Rolling button shows spinning dice and bouncing targets

**✅ Dice Functionality**
- All dice types (D4, D6, D8, D10, D12, D20, D36, D100) work correctly
- Critical hit detection for D20 (1, 20) and D36 (1, 36)
- Advantage/disadvantage mechanics for D20
- Modifier support (+/- numbers)

**✅ Environment Adaptability**
- **All Environments**: Shows "Connected" status with real-time SSE collaboration
- **Automatic Fallback**: Shows "Offline Mode" banner if SSE connection fails
- **Production Ready**: Full real-time functionality on all hosting platforms
- **No External Dependencies**: Everything runs on your main server

### 🏗️ Architecture

- **Frontend**: Nuxt 3 + Vue 3 + Native EventSource API + CSS Animations + SSE Integration
- **Backend**: Server-Sent Events (SSE) endpoints built into Nuxt/Nitro server
- **Development**: All-in-one server on port 3000 (or 3001 if 3000 is busy)
- **Production**: SSE runs directly on your hosting platform (Vercel, Netlify, etc.)
- **Database**: PostgreSQL (for character data, independent of dice functionality)
- **Real-time**: HTTP-based SSE for maximum compatibility and reliability

### Quick Actions Available

- Standard D&D rolls (Attack, Damage, Initiative, Skill Check, Saving Throw)
- Dice combinations (2d6, 3d6, 4d6)
- **NEW**: "d36 Roll" button for instant d36 rolling
- All quick actions work with enhanced animations in both modes

### 🔧 Troubleshooting

**If dice room doesn't work in development:**
- Ensure Nuxt dev server is running: `npm run dev`
- Check console for SSE connection errors
- Verify the server started successfully on the correct port

**If offline mode shows:**
- SSE endpoints might not be responding
- Check browser dev tools network tab for failed requests
- Verify `/api/dice/events` endpoint is accessible

**If animations are choppy:**
- Try reducing browser zoom level
- Close unnecessary browser tabs
- Check if hardware acceleration is enabled

**SSE Specific Issues:**
- Browser dev tools → Network tab → Check for successful EventSource connections
- Console should show "🎲 SSE connection established" when working
- Test direct API endpoints: `/api/dice/stats`, `/api/dice/join`
- **User Timeout**: Inactive users are automatically removed after 5 minutes of no activity

**User Activity Tracking:**
- Activity is tracked on: SSE heartbeats (every 30s), dice rolls, room joins
- Cleanup runs every 1 minute to check for timeouts
- Users are considered inactive after 5 minutes without any tracked activity

The enhanced collaborative dice room with SSE is production-ready and works seamlessly in all environments! 🎲✨
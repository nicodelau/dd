# D&D Character Manager - Enhanced Dice Room Testing Guide

## 🎲 Real-time Collaborative Dice Room with Animated Dice

The dice room now features beautiful animated dice with custom designs, including the special d36! The system automatically adapts to both development and production environments.

### 🚀 Environment Support

**✅ Development Mode** (localhost)
- Full WebSocket collaboration with real-time dice sharing
- Multiple users can roll together and see each other's results
- WebSocket server runs locally on port 3003

**✅ Production Mode** (Vercel/Netlify deployments)
- Automatic offline mode with full dice functionality
- All animations and features work without WebSocket
- Yellow banner indicates offline mode to users
- Graceful fallback ensures dice room always works

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

1. **Start the WebSocket Server** (in terminal 1):
   ```bash
   npm run dice-server
   ```
   This starts the WebSocket server on port 3003.

2. **Start the Nuxt Application** (in terminal 2):
   ```bash
   npm run dev
   ```
   This starts the web application on port 3000.

### 🌐 Production Deployment

**Automatic Deployment (Vercel/Netlify)**
1. Push your code to your repository
2. Connect to Vercel or Netlify
3. Deploy automatically - dice room will work in offline mode

**Optional: WebSocket Server Deployment**
If you want real-time collaboration in production:

1. **Deploy WebSocket Server** to a service like Railway, Heroku, or DigitalOcean:
   ```bash
   # Upload dice-server.mjs to your hosting service
   node dice-server.mjs
   ```

2. **Update Production URLs** in `dice-server.mjs`:
   ```javascript
   origin: [
     "https://your-app.vercel.app",  // Add your actual domain
     "https://your-custom-domain.com"
   ]
   ```

3. **Update WebSocket URL** in `pages/dice.vue` (optional):
   ```javascript
   // Replace localhost with your deployed WebSocket URL
   socket.value = io('https://your-websocket-server.com', {
     path: '/socket.io/',
     autoConnect: true
   })
   ```

### Testing the Enhanced Dice Room

**Development Testing**:
1. **Access the Dice Room**: Open http://localhost:3000/dice
2. **Test Real-time Features**: Open multiple browser tabs to test collaboration
3. **Test the New D36**: Click the cyan hexagon dice to add d36 rolls

**Production Testing**:
1. **Access Deployed App**: Visit your Vercel/Netlify URL + `/dice`
2. **Verify Offline Mode**: Should show yellow banner indicating offline mode
3. **Test Full Functionality**: All dice rolling features work without WebSocket

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
- Development: Shows "Connected" status with real-time collaboration
- Production: Shows "Offline Mode" banner with full local functionality
- Graceful fallback when WebSocket connection fails

### 🏗️ Architecture

- **Frontend**: Nuxt 3 + Vue 3 + Socket.IO Client + CSS Animations + Environment Detection
- **Backend**: Standalone Node.js + Socket.IO Server with CORS support
- **Development**: WebSocket server on port 3003, web app on port 3000
- **Production**: Offline-first approach with optional WebSocket server
- **Database**: PostgreSQL (for character data, independent of dice functionality)

### Quick Actions Available

- Standard D&D rolls (Attack, Damage, Initiative, Skill Check, Saving Throw)
- Dice combinations (2d6, 3d6, 4d6)
- **NEW**: "d36 Roll" button for instant d36 rolling
- All quick actions work with enhanced animations in both modes

### 🔧 Troubleshooting

**If dice room doesn't work in development:**
- Ensure WebSocket server is running: `npm run dice-server`
- Check console for connection errors
- Verify port 3003 is available

**If offline mode shows in development:**
- WebSocket server might not be running
- Check `dice-server.mjs` is executing without errors
- Verify localhost:3003 is accessible

**If animations are choppy:**
- Try reducing browser zoom level
- Close unnecessary browser tabs
- Check if hardware acceleration is enabled

The enhanced collaborative dice room is production-ready and works seamlessly in all environments! 🎲✨
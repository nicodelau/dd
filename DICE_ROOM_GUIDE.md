# D&D Character Manager - Enhanced Dice Room Testing Guide

## 🎲 Real-time Collaborative Dice Room with Animated Dice

The dice room now features beautiful animated dice with custom designs, including the special d36! Here's how to test it:

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

### Running the Application

1. **Start the WebSocket Server** (in terminal 1):
   ```bash
   npm run dice-server
   ```
   This starts the WebSocket server on port 3003.

2. **Start the Nuxt Application** (in terminal 2):
   ```bash
   npm run dev
   ```
   This starts the web application on port 3002.

### Testing the Enhanced Dice Room

1. **Access the Dice Room**: Open http://localhost:3002/dice
2. **Test the New D36**: Click the cyan hexagon dice to add d36 rolls
3. **Watch the Animations**: 
   - Click dice to see selection animations
   - Roll dice to see the dramatic spinning effects
   - Notice the color-coded counters
4. **Test Special Features**:
   - Roll a single d36 and try to get 1 or 36 for critical effects
   - Use the "d36 Roll" quick action button
   - Test with multiple browser tabs for real-time sync

### Enhanced Features in Action

✅ **Animated Dice Selection**
- Click any dice to see bounce and color animations
- Dice symbols change color when selected
- Counters appear with matching dice colors

✅ **Dramatic Rolling Experience**
- Rolling button shows spinning dice and bouncing targets
- All selected dice animate during rolls
- Enhanced visual feedback throughout the process

✅ **D36 Support**
- Full d36 integration with critical hit detection
- Special logging on server for d36 rolls
- Quick roll button for d36

✅ **Real-time Collaboration**
- All animations and new dice work across multiple users
- Enhanced roll feed with better visual hierarchy
- Improved connection status indicators

### Architecture

- **Frontend**: Nuxt 3 + Vue 3 + Socket.IO Client + Custom CSS Animations
- **Backend**: Standalone Node.js + Socket.IO Server with d36 support
- **WebSocket Server**: Runs on port 3003
- **Web Application**: Runs on port 3002
- **Database**: PostgreSQL (for character data)

### New Quick Actions

The quick roll section now includes:
- Standard D&D rolls (Attack, Damage, Initiative, etc.)
- **NEW**: "d36 Roll" button for instant d36 rolling
- All quick actions work with the enhanced animations

The enhanced collaborative dice room is now ready for epic D&D sessions with beautiful, animated dice! 🎲✨
# Watch Together Feature - Implementation Guide

## Overview
The Watch Together feature allows users to watch anime synchronously with friends in real-time. The host controls playback while all viewers see the same content at the same time with a built-in chat system.

## Features Implemented

### 1. **WatchPartyModal Component** (`/src/components/watchparty/WatchPartyModal.jsx`)
- Create or join watch party rooms
- Generate unique room IDs
- Copy room links to share with friends
- Clean, intuitive UI for room creation/joining

### 2. **WatchTogether Page** (`/src/pages/watchtogether/WatchTogether.jsx`)
- Full synchronized video player (same size as regular watch page)
- **HD-2 Server Only** - All other servers are removed for watch together mode
- Episode list with synchronized episode changes
- Host controls (Host has crown badge)
- Room information display
- Back button to return to regular watch page

### 3. **Real-time Chat** (`/src/components/watchparty/WatchTogetherChat.jsx`)
- Live messaging between all viewers
- Online user list with host indicator
- System messages for user joins/leaves
- Message timestamps
- Character limit (500 chars)
- Scrollable message history

### 4. **WebSocket Communication** (`/src/utils/watchTogetherSocket.js`)
Currently implemented with localStorage for demo purposes. For production:
- Real-time video synchronization
- Play/Pause sync
- Seek/timestamp sync
- Episode change sync
- Chat messages
- User presence tracking

## How It Works

### Creating a Room (Host)
1. User clicks "Watch Together" button on watch page
2. Clicks "Create Watch Party"
3. Unique room ID is generated
4. Can copy room link to share with friends
5. Clicks "Start Watching" to enter watch together mode
6. Host controls all playback (play, pause, seek, episode change)
7. All guests sync automatically with host's actions

### Joining a Room (Guest)
1. Receives room link from friend
2. Either:
   - Clicks the shared link directly, OR
   - Enters room ID manually in the modal
3. Joins the room and video syncs with host
4. Can chat but cannot control playback
5. Automatically syncs when host changes episodes

### Video Synchronization
- **Host broadcasts**: Play, Pause, Seek, Episode Change
- **Guests receive**: All video events and sync automatically
- **Tolerance**: 1-second difference before re-syncing
- **Smooth experience**: Ignores self-triggered events to prevent loops

## File Structure

```
src/
├── components/
│   └── watchparty/
│       ├── WatchPartyModal.jsx        # Room creation/join modal
│       └── WatchTogetherChat.jsx      # Real-time chat component
├── pages/
│   └── watchtogether/
│       └── WatchTogether.jsx          # Main watch together page
└── utils/
    └── watchTogetherSocket.js         # WebSocket handler
```

## Integration Points

### App.jsx
Added route: `/watch-together/:id`

### Watch.jsx
- Already has "Watch Together" button (line 502-518)
- Opens WatchPartyModal when clicked
- Modal is imported and rendered at the bottom

## Current Implementation (Demo Mode)

The current implementation uses **localStorage + storage events** for demo purposes. This allows:
- ✅ Multiple browser tabs on same computer to sync
- ✅ Full feature testing without backend
- ❌ Does NOT work across different computers/browsers
- ❌ Not production-ready for real-time collaboration

## Production Implementation (Next Steps)

### Required Backend Setup

#### 1. Install Socket.io
```bash
npm install socket.io-client
```

#### 2. Setup Node.js Server with Socket.io
```javascript
// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173", // Your frontend URL
    methods: ["GET", "POST"]
  }
});

const rooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join room
  socket.on('join-room', ({ roomId, username, isHost }) => {
    socket.join(roomId);
    
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Map());
    }
    
    rooms.get(roomId).set(socket.id, { username, isHost });
    
    // Notify room
    socket.to(roomId).emit('user-joined', { username });
    
    // Send user list
    const users = Array.from(rooms.get(roomId).values());
    io.to(roomId).emit('users-update', users);
  });

  // Chat message
  socket.on('send-message', ({ roomId, username, message, timestamp }) => {
    io.to(roomId).emit('chat-message', {
      username,
      message,
      timestamp
    });
  });

  // Video events
  socket.on('video-event', ({ roomId, eventType, data }) => {
    socket.to(roomId).emit('video-event', { eventType, data });
  });

  // Episode change
  socket.on('episode-change', ({ roomId, episodeId }) => {
    socket.to(roomId).emit('episode-change', { episodeId });
  });

  // Disconnect
  socket.on('disconnect', () => {
    rooms.forEach((users, roomId) => {
      const user = users.get(socket.id);
      if (user) {
        users.delete(socket.id);
        socket.to(roomId).emit('user-left', { username: user.username });
        
        const remainingUsers = Array.from(users.values());
        io.to(roomId).emit('users-update', remainingUsers);
        
        if (users.size === 0) {
          rooms.delete(roomId);
        }
      }
    });
  });
});

server.listen(3001, () => {
  console.log('Socket.io server running on port 3001');
});
```

#### 3. Update Client Implementation

Replace `/src/utils/watchTogetherSocket.js`:

```javascript
import io from 'socket.io-client';

export const createWatchTogetherSocket = () => {
  const socket = io('http://localhost:3001'); // Your backend URL
  
  return {
    connect(roomId, username, isHost) {
      socket.emit('join-room', { roomId, username, isHost });
    },
    
    disconnect() {
      socket.disconnect();
    },
    
    sendMessage(roomId, message) {
      socket.emit('send-message', {
        roomId,
        username: this.username,
        message,
        timestamp: Date.now()
      });
    },
    
    sendVideoEvent(roomId, eventType, data) {
      socket.emit('video-event', { roomId, eventType, data });
    },
    
    sendEpisodeChange(roomId, episodeId) {
      socket.emit('episode-change', { roomId, episodeId });
    },
    
    on(event, callback) {
      socket.on(event, callback);
    },
    
    off(event, callback) {
      socket.off(event, callback);
    }
  };
};
```

#### 4. Deploy Backend
- Deploy to Heroku, Railway, Render, or any Node.js hosting
- Update Socket.io URL in production build
- Configure CORS properly for production domain

## Environment Variables

Add to `.env`:
```
VITE_SOCKET_URL=http://localhost:3001  # Development
# VITE_SOCKET_URL=https://your-backend.com  # Production
```

## Testing Locally (Current Demo Mode)

1. Start the dev server: `npm run dev`
2. Open watch page for any anime
3. Click "Watch Together"
4. Click "Create Watch Party"
5. Copy the room link
6. Open the link in a new tab/window
7. Both tabs should sync (play/pause/seek/episode change)
8. Chat should work between tabs

## UI/UX Features

### Host Indicators
- Crown badge next to "HOST" label
- "You control the playback" message
- Purple theme for host-specific elements

### Guest Experience
- Clear indication they're in guest mode
- Cannot control playback (syncs automatically)
- Can see who's online
- Can participate in chat

### Room Management
- Easy room link copying
- Room ID display
- Online user counter
- User join/leave notifications

### Chat Features
- Usernames with colors
- Timestamp on messages
- System messages for events
- Smooth scrolling to latest message
- Character limit indicator

## Limitations & Future Enhancements

### Current Limitations
- Demo mode only works in same browser (different tabs)
- No persistent room history
- No room expiration/cleanup
- No video quality selection (HD-2 only)

### Future Enhancements
- [ ] Voice chat integration
- [ ] Screen drawing/annotations
- [ ] Emoji reactions
- [ ] Room passwords
- [ ] Persistent rooms
- [ ] Room replay/recording
- [ ] User kick/ban (for hosts)
- [ ] Video quality selection
- [ ] Multiple server support
- [ ] Mobile app support
- [ ] Browser extension for easier sharing

## Troubleshooting

### Video Not Syncing
- Check if both users are in the same room
- Verify the host has stable connection
- Ensure HD-2 server is available
- Check browser console for errors

### Chat Not Working
- Verify WebSocket connection
- Check if localStorage is enabled
- Ensure no ad blockers are interfering

### Can't Join Room
- Verify room ID is correct
- Check if room still exists
- Ensure host hasn't left

## Credits

Feature designed and implemented for HaruAnime/JustAnime project.
Built with React, Tailwind CSS, and love for anime! 🎬✨

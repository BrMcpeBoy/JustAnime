import io from 'socket.io-client';

// Socket.io server URL - update this to your production server URL
const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_SERVER_URL || 'http://localhost:3001';

class WatchTogetherSocket {
  constructor() {
    this.socket = null;
    this.listeners = {};
    this.roomId = null;
    this.userId = Math.random().toString(36).substring(7);
    this.username = null;
    this.isHost = false;
    this.connected = false;
  }

  connect(roomId, username, isHost = false, animeId = null, episodeId = null, serverType = 'sub', roomType = 'public') {
    this.roomId = roomId;
    this.username = username;
    this.isHost = isHost;

    console.log('🔌 Connecting to server:', SOCKET_SERVER_URL);
    console.log('   serverType parameter:', serverType);

    // Create socket connection
    this.socket = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    // Setup socket event listeners
    this.setupSocketListeners();

    // Join the room with proper serverType
    this.socket.emit('join-room', {
      roomId,
      username,
      userId: this.userId,
      isHost,
      animeId,
      episodeId,
      serverType: serverType, // Pass the actual serverType
      roomType: roomType
    });

    console.log(`🎬 Joining room ${roomId} as ${username} (${isHost ? 'Host' : 'Guest'}) with serverType: ${serverType}`);
  }

  setupSocketListeners() {
    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Connected to server');
      this.connected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from server:', reason);
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔴 Connection error:', error);
    });

    // Room events
    this.socket.on('joined-room', (data) => {
      console.log('✅ Successfully joined room:', data);
      this.emit('joined-room', data);
    });

    this.socket.on('join-error', (data) => {
      console.error('❌ Join error:', data);
      this.emit('join-error', data);
    });

    // User events
    this.socket.on('user-joined', (data) => {
      console.log('👤 User joined:', data.username);
      this.emit('user-joined', data);
    });

    this.socket.on('user-left', (data) => {
      console.log('👋 User left:', data.username);
      this.emit('user-left', data);
    });

    this.socket.on('users-update', (users) => {
      console.log('📋 Users update:', users.length);
      this.emit('users-update', users);
    });

    // Chat events
    this.socket.on('chat-message', (data) => {
      this.emit('chat-message', data);
    });

    // Video events
    this.socket.on('video-event', (data) => {
      console.log('🎥 Video event:', data.eventType);
      this.emit('video-event', data);
    });

    // Episode events
    this.socket.on('episode-change', (data) => {
      console.log('📺 Episode change:', data.episodeId);
      this.emit('episode-change', data);
    });

    // Kick/Ban events
    this.socket.on('user-kicked', (data) => {
      console.log('🚫 User kicked:', data.username);
      this.emit('user-kicked', data);
    });

    this.socket.on('user-banned', (data) => {
      console.log('⛔ User banned:', data.username);
      this.emit('user-banned', data);
    });

    // Stream ended
    this.socket.on('stream-ended', (data) => {
      console.log('🛑 Stream ended:', data.message);
      this.emit('stream-ended', data);
    });
  }

  disconnect() {
    if (this.socket && this.connected) {
      console.log('👋 Disconnecting from server');
      this.socket.disconnect();
      this.connected = false;
    }
  }

  // Send chat message
  sendMessage(message) {
    if (!this.socket || !this.connected) {
      console.warn('⚠️ Cannot send message - not connected');
      return;
    }

    this.socket.emit('chat-message', {
      message,
      timestamp: Date.now()
    });
  }

  // Send video event (play, pause, seek)
  sendVideoEvent(eventType, data) {
    if (!this.socket || !this.connected || !this.isHost) {
      return;
    }

    this.socket.emit('video-event', {
      eventType,
      data,
      timestamp: Date.now()
    });
  }

  // Request sync from host
  requestSync() {
    if (!this.socket || !this.connected) {
      return;
    }

    this.socket.emit('request-sync');
  }

  // Send episode change
  sendEpisodeChange(episodeId) {
    if (!this.socket || !this.connected || !this.isHost) {
      return;
    }

    this.socket.emit('episode-change', {
      episodeId,
      timestamp: Date.now()
    });
  }

  // Kick user (host only)
  kickUser(username, userId) {
    if (!this.socket || !this.connected || !this.isHost) {
      return;
    }

    this.socket.emit('kick-user', {
      username,
      userId
    });
  }

  // Ban user (host only)
  banUser(username, userId) {
    if (!this.socket || !this.connected || !this.isHost) {
      return;
    }

    this.socket.emit('ban-user', {
      username,
      userId
    });
  }

  // Event emitter pattern
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  emit(event, data) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }

  // Get connection status
  isConnected() {
    return this.connected && this.socket?.connected;
  }
}

// Export singleton factory
export const createWatchTogetherSocket = () => new WatchTogetherSocket();

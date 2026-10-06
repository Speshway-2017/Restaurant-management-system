import { io } from 'socket.io-client';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    const backendUrl = import.meta.env?.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
      : 'http://localhost:5000';

    console.log('[Socket] Connecting to:', backendUrl);

    socket = io(backendUrl, {
      path: '/socket.io',
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
      // Re-join rooms upon connection/reconnection
      try {
        const raw = sessionStorage.getItem('flavora_user_data') || localStorage.getItem('flavora_user_data');
        if (raw) {
          const user = JSON.parse(raw);
          joinSocketRooms(user);
        }
      } catch (e) { }
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message || err);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    socket.on('reconnect_attempt', (attempt) => {
      console.log('[Socket] Reconnecting: attempt', attempt);
    });
  }
  return socket;
};

export const joinSocketRooms = (user) => {
  if (!user) return;
  const s = getSocket();
  const userId = user._id || user.id;
  const role = user.role || '';
  const managerId = user.managerId || (String(role).toLowerCase().includes('manager') ? userId : '');

  s.emit('join', {
    role,
    userId,
    managerId
  });
};

export const onSocketEvent = (event, callback) => {
  const s = getSocket();
  s.on(event, callback);
  return () => {
    s.off(event, callback);
  };
};

export default {
  getSocket,
  joinSocketRooms,
  onSocketEvent
};

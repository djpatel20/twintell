import { io, Socket } from 'socket.io-client';
import { supabase } from './supabase';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export async function getSocket(): Promise<Socket> {
  if (socket && socket.connected) {
    return socket;
  }

  // Retrieve current session token
  let token: string | undefined;
  try {
    const { data } = await supabase.auth.getSession();
    token = data.session?.access_token;
  } catch (err) {
    console.warn('Failed to retrieve token for socket connection:', err);
  }

  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('⚡ Connected to twintell Notification Socket server');
    });

    socket.on('disconnect', (reason) => {
      console.log('⚡ Notification Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.warn('⚡ Notification Socket connection error:', error.message);
    });
  } else if (token) {
    socket.auth = { token };
  }

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
